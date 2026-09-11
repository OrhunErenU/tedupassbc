"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, ClubMemberRole, ClubMemberStatus, BadgeRole } from "@tedu-pass/db";
import { requireSessionUser, ALLOWED_EMAIL_DOMAIN } from "@/lib/auth";
import { BADGE_ROLES, badgeRoleLabel } from "@/lib/roles";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";

async function requireClubManager(clubId: string, userId: string) {
  const m = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId, clubId } }
  });
  if (!m || m.status !== ClubMemberStatus.APPROVED || m.role === ClubMemberRole.MEMBER) {
    throw new Error("Bu kulüpte yönetici değilsin.");
  }
  return m;
}

/** Club manager confirms a student's self-declared role → it becomes verified. */
export async function approveMembership(targetUserId: string, clubId: string) {
  const user = await requireSessionUser();
  await requireClubManager(clubId, user.id);
  await prisma.clubMember.update({
    where: { userId_clubId: { userId: targetUserId, clubId } },
    data: { status: ClubMemberStatus.APPROVED }
  });
  revalidatePath(`/club/${clubId}`);
}

export async function rejectMembership(targetUserId: string, clubId: string) {
  const user = await requireSessionUser();
  await requireClubManager(clubId, user.id);
  await prisma.clubMember.delete({
    where: { userId_clubId: { userId: targetUserId, clubId } }
  });
  revalidatePath(`/club/${clubId}`);
}

const createClubSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(2000).optional()
});

export async function createClub(input: z.infer<typeof createClubSchema>) {
  const data = createClubSchema.parse(input);
  const user = await requireSessionUser();

  const existing = await prisma.club.findUnique({ where: { name: data.name } });
  if (existing) throw new Error("Bu isimde bir kulüp zaten var.");

  const club = await prisma.club.create({
    data: {
      name: data.name,
      description: data.description,
      createdById: user.id,
      approvedBySks: false,
      members: {
        create: { userId: user.id, role: ClubMemberRole.PRESIDENT }
      }
    }
  });

  revalidatePath("/club");
  revalidatePath("/sks");
  return { id: club.id };
}

const promoteSchema = z.object({
  attendanceId: z.string().min(1),
  role: z.enum(BADGE_ROLES)
});

export async function setAttendanceRole(input: z.infer<typeof promoteSchema>) {
  const { attendanceId, role } = promoteSchema.parse(input);
  const user = await requireSessionUser();

  const att = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { event: true }
  });
  if (!att) throw new Error("Katılım bulunamadı.");

  const membership = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: user.id, clubId: att.event.clubId } }
  });
  if (!membership || membership.role === "MEMBER") throw new Error("Yetki yok.");

  await prisma.$transaction(async (tx) => {
    await tx.attendance.update({ where: { id: attendanceId }, data: { role: role as BadgeRole } });
    // Ensure a BadgeTemplate exists for this role on this event
    await tx.badgeTemplate.upsert({
      where: { eventId_roleType: { eventId: att.eventId, roleType: role as BadgeRole } },
      create: {
        eventId: att.eventId,
        roleType: role as BadgeRole,
        name: `${att.event.title} — ${badgeRoleLabel(role)}`
      },
      update: {}
    });
  });

  revalidatePath(`/club/${att.event.clubId}/events/${att.eventId}`);
}

/** Manager check that starts from an event instead of a club id. */
async function requireEventManager(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Etkinlik bulunamadı.");
  await requireClubManager(event.clubId, userId);
  return event;
}

const addAttendanceSchema = z.object({
  eventId: z.string().min(1),
  email: z.string().email().max(200),
  role: z.enum(BADGE_ROLES).default("ATTENDEE")
});

/**
 * Manual check-in by the club desk. Phones die, QR readers fail, and a guest
 * speaker never queues at the door — without this the attendance record (and so
 * the badge) is simply lost. Restricted to TEDÜ addresses; a student who has not
 * signed in yet gets a stub row, and their first Privy login fills in the wallet,
 * at which point the queued badge mints on the next "Rozetleri bas".
 */
export async function addAttendanceByEmail(
  input: z.infer<typeof addAttendanceSchema>
): Promise<ActionResult<{ name: string | null; email: string; isNew: boolean }>> {
  const data = addAttendanceSchema.parse(input);
  const user = await requireSessionUser();
  const event = await requireEventManager(data.eventId, user.id);

  const email = data.email.trim().toLowerCase();
  if (!email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    return actionError(`Sadece @${ALLOWED_EMAIL_DOMAIN} adresleri eklenebilir.`);
  }

  const attendee = await prisma.user.upsert({
    where: { teduEmail: email },
    create: { teduEmail: email },
    update: {}
  });

  const existing = await prisma.attendance.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: attendee.id } }
  });
  if (existing) return actionError("Bu kişi zaten katılımcı listesinde.");

  await prisma.$transaction(async (tx) => {
    await tx.attendance.create({
      data: { eventId: event.id, userId: attendee.id, role: data.role }
    });
    await tx.badgeTemplate.upsert({
      where: { eventId_roleType: { eventId: event.id, roleType: data.role } },
      create: {
        eventId: event.id,
        roleType: data.role,
        name: `${event.title} — ${badgeRoleLabel(data.role)}`
      },
      update: {}
    });
  });

  revalidatePath(`/club/${event.clubId}/events/${event.id}`);
  return actionOk({ name: attendee.name, email, isNew: !attendee.name });
}

/**
 * Undo a wrong check-in. Refused once the badge is on-chain: an SBT cannot be
 * burned from here, so removing the attendance row would leave a badge whose
 * event record no longer backs it.
 */
export async function removeAttendance(attendanceId: string): Promise<ActionResult> {
  const user = await requireSessionUser();
  const att = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { event: { select: { id: true, clubId: true } } }
  });
  if (!att) return actionError("Katılım bulunamadı.");
  await requireClubManager(att.event.clubId, user.id);

  const minted = await prisma.badge.findFirst({
    where: {
      userId: att.userId,
      badgeTemplate: { eventId: att.eventId },
      NOT: { mintedAt: null }
    }
  });
  if (minted) return actionError("Rozet zaten basılmış, katılım silinemez.");

  await prisma.attendance.delete({ where: { id: attendanceId } });
  revalidatePath(`/club/${att.event.clubId}/events/${att.eventId}`);
  return actionOk();
}
