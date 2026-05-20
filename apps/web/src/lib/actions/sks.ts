"use server";

import { revalidatePath } from "next/cache";
import { prisma, UserRole } from "@tedu-pass/db";
import { requireRole } from "@/lib/auth";

export async function approveClub(clubId: string) {
  await requireRole([UserRole.SKS_ADMIN]);
  await prisma.club.update({ where: { id: clubId }, data: { approvedBySks: true } });
  revalidatePath("/sks");
  revalidatePath("/sks/clubs");
}

export async function rejectClub(clubId: string) {
  await requireRole([UserRole.SKS_ADMIN]);
  await prisma.club.delete({ where: { id: clubId } });
  revalidatePath("/sks");
  revalidatePath("/sks/clubs");
}
