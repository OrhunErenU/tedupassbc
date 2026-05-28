"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, ClubMemberRole, ClubMemberStatus } from "@tedu-pass/db";
import { requireSessionUser } from "@/lib/auth";

const profileSchema = z.object({
  name: z.string().min(1).max(80).optional().nullable(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Sadece küçük harf, rakam, _ ve - kullan")
    .optional()
    .nullable(),
  studentId: z.string().min(3).max(20).optional().nullable(),
  title: z.string().max(100).optional().nullable(),
  bio: z.string().max(600).optional().nullable(),
  avatarUrl: z.string().max(800_000).optional().nullable(),
  isPublic: z.boolean()
});

export async function updateProfile(input: z.infer<typeof profileSchema>) {
  const data = profileSchema.parse(input);
  const user = await requireSessionUser();

  if (data.username) {
    const taken = await prisma.user.findFirst({
      where: { username: data.username, NOT: { id: user.id } }
    });
    if (taken) throw new Error("Bu kullanıcı adı alınmış.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name ?? null,
      username: data.username ?? null,
      studentId: data.studentId ?? null,
      title: data.title ?? null,
      bio: data.bio ?? null,
      // Only overwrite the avatar when a new value is provided.
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      isPublic: data.isPublic
    }
  });

  revalidatePath("/student");
  revalidatePath("/student/profile");
  if (data.username) revalidatePath(`/u/${data.username}`);
}

const claimSchema = z.object({
  clubId: z.string().min(1),
  role: z.enum(["PRESIDENT", "BOARD", "MEMBER"]),
  title: z.string().max(100).optional()
});

/**
 * Student self-declares a role/task in a community. Created as PENDING so the
 * club must confirm it — only confirmed roles show as verified on the CV profile.
 */
export async function claimMembership(input: z.infer<typeof claimSchema>) {
  const { clubId, role, title } = claimSchema.parse(input);
  const user = await requireSessionUser();

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new Error("Topluluk bulunamadı.");

  const existing = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: user.id, clubId } }
  });
  // Don't let a self-claim silently downgrade an already-approved membership.
  if (existing?.status === ClubMemberStatus.APPROVED) {
    throw new Error("Bu toplulukta zaten onaylı bir görevin var.");
  }

  await prisma.clubMember.upsert({
    where: { userId_clubId: { userId: user.id, clubId } },
    create: {
      userId: user.id,
      clubId,
      role: role as ClubMemberRole,
      title: title || null,
      status: ClubMemberStatus.PENDING
    },
    update: { role: role as ClubMemberRole, title: title || null, status: ClubMemberStatus.PENDING }
  });

  revalidatePath("/student/profile");
}

export async function removeMembership(clubId: string) {
  const user = await requireSessionUser();
  await prisma.clubMember.deleteMany({ where: { userId: user.id, clubId } });
  revalidatePath("/student/profile");
}
