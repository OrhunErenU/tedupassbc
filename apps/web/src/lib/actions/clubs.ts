"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, ClubMemberRole, ClubMemberStatus, BadgeRole } from "@tedu-pass/db";
import { requireSessionUser } from "@/lib/auth";

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
  role: z.enum(["ATTENDEE", "ORGANIZER", "SPEAKER", "MENTOR", "VOLUNTEER"])
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
        name: `${att.event.title} — ${role}`
      },
      update: {}
    });
  });

  revalidatePath(`/club/${att.event.clubId}/events/${att.eventId}`);
}
