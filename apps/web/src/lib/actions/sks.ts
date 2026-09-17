"use server";

import { revalidatePath } from "next/cache";
import { prisma, UserRole } from "@tedu-pass/db";
import { requireRole } from "@/lib/auth";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";

function refreshSks() {
  revalidatePath("/sks");
  revalidatePath("/sks/clubs");
}

export async function approveClub(clubId: string): Promise<ActionResult> {
  await requireRole([UserRole.SKS_ADMIN]);
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) return actionError("Kulüp bulunamadı.");
  await prisma.club.update({ where: { id: clubId }, data: { approvedBySks: true } });
  refreshSks();
  return actionOk();
}

/**
 * Decline a club application.
 *
 * Deletion cascades through the club's events to their attendance records —
 * which is what every student's transcript is built from. So this is allowed
 * only for what it was meant for: an application that is still pending and has
 * no history behind it. An approved club, or one that already held an event,
 * is withdrawn with revokeClubApproval instead, which keeps the record intact.
 */
export async function rejectClub(clubId: string): Promise<ActionResult> {
  await requireRole([UserRole.SKS_ADMIN]);

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: { _count: { select: { events: true } } }
  });
  if (!club) return actionError("Kulüp bulunamadı.");

  if (club.approvedBySks) {
    return actionError(
      "Onaylanmış bir kulüp silinemez — etkinlik ve katılım geçmişi de silinirdi. Bunun yerine onayı geri al."
    );
  }

  if (club._count.events > 0) {
    const attendance = await prisma.attendance.count({ where: { event: { clubId } } });
    return actionError(
      `Bu kulübün ${club._count.events} etkinliği ve ${attendance} katılım kaydı var; silinemez. Bunun yerine onayı geri al.`
    );
  }

  await prisma.club.delete({ where: { id: clubId } });
  refreshSks();
  return actionOk();
}

/**
 * Withdraw approval without touching history. The club can no longer create
 * events (createEvent requires approval), but every past event, attendance
 * record and badge stays exactly where it is.
 */
export async function revokeClubApproval(clubId: string): Promise<ActionResult> {
  await requireRole([UserRole.SKS_ADMIN]);
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) return actionError("Kulüp bulunamadı.");
  await prisma.club.update({ where: { id: clubId }, data: { approvedBySks: false } });
  refreshSks();
  return actionOk();
}
