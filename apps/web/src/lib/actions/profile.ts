"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@tedu-pass/db";
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
      isPublic: data.isPublic
    }
  });

  revalidatePath("/student");
  revalidatePath("/student/profile");
  if (data.username) revalidatePath(`/u/${data.username}`);
}
