"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma, EventStatus, BadgeRole, UserRole } from "@tedu-pass/db";
import { requireSessionUser } from "@/lib/auth";
import { badgeRef, BADGE_ABI, serverWallet, TEDU_PASS_ADDRESS, chainConfigured } from "@/lib/chain";

const createEventSchema = z.object({
  clubId: z.string().min(1),
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  date: z.string().datetime(),
  location: z.string().max(200).optional(),
  // Optional custom badge design (data URL). Capped to keep the row small.
  badgeImageUrl: z.string().max(800_000).optional()
});

export async function createEvent(input: z.infer<typeof createEventSchema>) {
  const data = createEventSchema.parse(input);
  const user = await requireSessionUser();

  const membership = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: user.id, clubId: data.clubId } }
  });
  if (!membership || membership.role === "MEMBER") {
    throw new Error("Bu kulüpte yönetici değilsin.");
  }

  const event = await prisma.event.create({
    data: {
      clubId: data.clubId,
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      location: data.location,
      badgeImageUrl: data.badgeImageUrl,
      qrSecret: randomBytes(16).toString("hex"),
      status: EventStatus.ACTIVE,
      badgeTemplates: {
        create: [
          { roleType: BadgeRole.ATTENDEE, name: `${data.title} — Katılımcı` }
        ]
      }
    }
  });

  return { id: event.id };
}

export async function closeEvent(eventId: string) {
  const user = await requireSessionUser();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { club: true }
  });
  if (!event) throw new Error("Etkinlik bulunamadı.");
  const membership = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: user.id, clubId: event.clubId } }
  });
  if (!membership || membership.role === "MEMBER") {
    throw new Error("Yetki yok.");
  }
  await prisma.event.update({ where: { id: eventId }, data: { status: EventStatus.CLOSED } });
}

/**
 * Mint pending badges for a closed event.
 * Creates Badge rows in DB and (if chain configured) batch-mints on-chain.
 */
export async function mintBadgesForEvent(eventId: string) {
  const user = await requireSessionUser();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      badgeTemplates: true,
      attendances: { include: { user: true } }
    }
  });
  if (!event) throw new Error("Etkinlik bulunamadı.");
  if (event.status !== EventStatus.CLOSED) throw new Error("Önce etkinliği kapat.");

  const membership = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: user.id, clubId: event.clubId } }
  });
  if (!membership || membership.role === "MEMBER") throw new Error("Yetki yok.");

  const created: { id: string; userId: string; templateId: string; wallet: string | null }[] = [];
  for (const att of event.attendances) {
    const template = event.badgeTemplates.find((t) => t.roleType === att.role)
      ?? event.badgeTemplates.find((t) => t.roleType === BadgeRole.ATTENDEE);
    if (!template) continue;
    const badge = await prisma.badge.upsert({
      where: { badgeTemplateId_userId: { badgeTemplateId: template.id, userId: att.userId } },
      create: { badgeTemplateId: template.id, userId: att.userId },
      update: {}
    });
    if (!badge.txHash) {
      created.push({ id: badge.id, userId: att.userId, templateId: template.id, wallet: att.user.walletAddress });
    }
  }

  if (!chainConfigured() || !serverWallet || !TEDU_PASS_ADDRESS) {
    return { minted: 0, queued: created.length, onChain: false };
  }

  const mintable = created.filter((c) => c.wallet);
  if (mintable.length === 0) return { minted: 0, queued: created.length, onChain: true };

  const recipients = mintable.map((c) => c.wallet as `0x${string}`);
  const refs = mintable.map((c) => badgeRef(c.id));
  const uris = mintable.map(
    (c) => `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/metadata/${c.id}`
  );

  const hash = await serverWallet.writeContract({
    address: TEDU_PASS_ADDRESS,
    abi: BADGE_ABI,
    functionName: "batchMint",
    args: [recipients, uris, refs]
  });

  await Promise.all(
    mintable.map((c) =>
      prisma.badge.update({
        where: { id: c.id },
        data: { txHash: hash, mintedAt: new Date() }
      })
    )
  );

  return { minted: mintable.length, queued: created.length - mintable.length, onChain: true, txHash: hash };
}
