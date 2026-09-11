"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@tedu-pass/db";
import { requireSessionUser } from "@/lib/auth";
import { newShareToken } from "@/lib/share";

const createSchema = z.object({
  label: z.string().max(80).optional(),
  /** 0 means "no expiry" — the student can still revoke it by hand. */
  expiresInDays: z.number().int().min(0).max(365).default(30),
  revealStudentId: z.boolean().default(false)
});

/** Students hand out one link per recipient so they can revoke them separately. */
export async function createShareLink(input: z.infer<typeof createSchema>) {
  const data = createSchema.parse(input);
  const user = await requireSessionUser();

  const open = await prisma.shareLink.count({ where: { userId: user.id, revokedAt: null } });
  if (open >= 20) {
    throw new Error("Aynı anda en fazla 20 açık paylaşım bağlantın olabilir. Kullanmadıklarını iptal et.");
  }

  const link = await prisma.shareLink.create({
    data: {
      token: newShareToken(),
      userId: user.id,
      label: data.label?.trim() || null,
      revealStudentId: data.revealStudentId,
      expiresAt:
        data.expiresInDays > 0
          ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
          : null
    }
  });

  revalidatePath("/student/transkript");
  return { token: link.token };
}

/** Revoking is immediate: the next request on that token gets the "revoked" page. */
export async function revokeShareLink(linkId: string) {
  const user = await requireSessionUser();
  const link = await prisma.shareLink.findUnique({ where: { id: linkId } });
  if (!link || link.userId !== user.id) throw new Error("Bağlantı bulunamadı.");
  if (link.revokedAt) return;

  await prisma.shareLink.update({ where: { id: linkId }, data: { revokedAt: new Date() } });
  revalidatePath("/student/transkript");
}
