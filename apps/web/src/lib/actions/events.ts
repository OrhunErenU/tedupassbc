"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma, EventStatus, BadgeRole } from "@tedu-pass/db";
import { requireSessionUser } from "@/lib/auth";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { parseEventLogs, zeroHash, type Hex } from "viem";
import { buildBadgeMetadata, metadataContentHash } from "@/lib/metadata";
import { pinBadgeMetadata } from "@/lib/ipfs";
import {
  badgeRef,
  BADGE_ABI,
  publicClient,
  serverWallet,
  TEDU_PASS_ADDRESS,
  chainConfigured
} from "@/lib/chain";

export type MintResult = {
  /** Badges whose mint is now recorded on chain and in the DB. */
  minted: number;
  /** Badges still waiting — no wallet yet, or the chain is not configured. */
  queued: number;
  onChain: boolean;
  txHash?: string;
  /** Minted but the receipt carried no BadgeMinted log for them (should be 0). */
  missingTokenIds: number;
};

/**
 * Permission guard for club-scoped event actions. Throws (see lib/action-result):
 * these controls only exist inside the club panel.
 */
async function requireEventManager(clubId: string, userId: string) {
  const membership = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId, clubId } }
  });
  if (!membership || membership.role === "MEMBER") {
    throw new Error("Bu kulüpte yönetici değilsin.");
  }
  return membership;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}

const createEventSchema = z.object({
  clubId: z.string().min(1),
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  date: z.string().datetime(),
  location: z.string().max(200).optional(),
  // Optional explicit check-in window. Left empty it is derived from the date
  // (2h before to 8h after); multi-day events need to set it.
  checkinOpensAt: z.string().datetime().optional(),
  checkinClosesAt: z.string().datetime().optional(),
  // Optional custom badge design (data URL). Capped to keep the row small.
  badgeImageUrl: z.string().max(800_000).optional()
});

export async function createEvent(
  input: z.infer<typeof createEventSchema>
): Promise<ActionResult<{ id: string }>> {
  const data = createEventSchema.parse(input);
  if (
    data.checkinOpensAt &&
    data.checkinClosesAt &&
    new Date(data.checkinClosesAt) <= new Date(data.checkinOpensAt)
  ) {
    return actionError("Check-in kapanışı açılıştan sonra olmalı.");
  }
  const user = await requireSessionUser();

  await requireEventManager(data.clubId, user.id);

  // The SKS panel states that unapproved clubs cannot hold events, but nothing
  // enforced it: a pending club could run an event and collect attendance that
  // SKS would then destroy by declining the application.
  const club = await prisma.club.findUnique({ where: { id: data.clubId } });
  if (!club) return actionError("Kulüp bulunamadı.");
  if (!club.approvedBySks) {
    return actionError(
      "Kulüp SKS onayı almadan etkinlik oluşturamaz. Onay bekleyen kulüpler için SKS ile iletişime geç."
    );
  }

  const event = await prisma.event.create({
    data: {
      clubId: data.clubId,
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      location: data.location,
      checkinOpensAt: data.checkinOpensAt ? new Date(data.checkinOpensAt) : null,
      checkinClosesAt: data.checkinClosesAt ? new Date(data.checkinClosesAt) : null,
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

  return actionOk({ id: event.id });
}

export async function closeEvent(eventId: string): Promise<ActionResult> {
  const user = await requireSessionUser();
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return actionError("Etkinlik bulunamadı.");
  await requireEventManager(event.clubId, user.id);

  if (event.status === EventStatus.CLOSED) return actionOk();

  await prisma.event.update({ where: { id: eventId }, data: { status: EventStatus.CLOSED } });
  revalidatePath(`/club/${event.clubId}/events/${eventId}`);
  return actionOk();
}

/**
 * Mint pending badges for a closed event.
 *
 * Two DB transactions with the chain call between them, deliberately: a Postgres
 * transaction must never stay open across an on-chain round-trip (batchMint plus
 * receipt is seconds, which would hold row locks and hit the transaction timeout).
 * So badge rows are created in one transaction, minted, then settled in another.
 * Nothing is marked minted until the receipt confirms the transaction succeeded.
 */
export async function mintBadgesForEvent(eventId: string): Promise<ActionResult<MintResult>> {
  const user = await requireSessionUser();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      badgeTemplates: true,
      attendances: { include: { user: true } }
    }
  });
  if (!event) return actionError("Etkinlik bulunamadı.");
  await requireEventManager(event.clubId, user.id);
  if (event.status !== EventStatus.CLOSED) {
    return actionError("Rozetleri basmadan önce etkinliği kapatmalısın.");
  }

  // 1. Make sure every attendee has a Badge row. The row id is what we hash into
  //    badgeRef, so it has to exist before we can mint.
  const pending: { id: string; wallet: string | null }[] = [];
  await prisma.$transaction(async (tx) => {
    for (const att of event.attendances) {
      const template =
        event.badgeTemplates.find((t) => t.roleType === att.role) ??
        event.badgeTemplates.find((t) => t.roleType === BadgeRole.ATTENDEE);
      if (!template) continue;
      const badge = await tx.badge.upsert({
        where: { badgeTemplateId_userId: { badgeTemplateId: template.id, userId: att.userId } },
        create: { badgeTemplateId: template.id, userId: att.userId },
        update: {}
      });
      if (!badge.mintedAt) pending.push({ id: badge.id, wallet: att.user.walletAddress });
    }
  });

  if (!chainConfigured() || !serverWallet || !TEDU_PASS_ADDRESS) {
    return actionOk({ minted: 0, queued: pending.length, onChain: false, missingTokenIds: 0 });
  }

  // Students who have never signed in have no wallet yet; their badge stays queued
  // and mints on a later run, once Privy has created one for them.
  const mintable = pending.filter((c) => c.wallet);
  const waitingForWallet = pending.length - mintable.length;
  if (mintable.length === 0) {
    return actionOk({ minted: 0, queued: waitingForWallet, onChain: true, missingTokenIds: 0 });
  }

  const refs = mintable.map((c) => badgeRef(c.id));

  // Build the metadata document once per badge, hash it, and pin it if IPFS is
  // configured. tokenURI is only a pointer; the hash is what ties the token to
  // this exact document, so a badge stays verifiable even if the pointer rots.
  const documents = await Promise.all(
    mintable.map(async (c) => {
      const metadata = await buildBadgeMetadata(c.id);
      if (!metadata) {
        return { uri: `${appUrl()}/api/metadata/${c.id}`, contentHash: zeroHash as Hex };
      }
      const pinned = await pinBadgeMetadata(c.id, metadata);
      return {
        uri: pinned ?? `${appUrl()}/api/metadata/${c.id}`,
        contentHash: metadataContentHash(metadata)
      };
    })
  );
  const uris = documents.map((d) => d.uri);
  const contentHashes = documents.map((d) => d.contentHash);

  // 2. Mint, then wait for the receipt. A submitted hash is not a mint — the
  //    transaction can still revert (e.g. a badgeRef already on chain).
  const hash = await serverWallet.writeContract({
    address: TEDU_PASS_ADDRESS,
    abi: BADGE_ABI,
    functionName: "batchMint",
    args: [mintable.map((c) => c.wallet as `0x${string}`), uris, refs, contentHashes]
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  if (receipt.status !== "success") {
    return actionError(
      `Zincir işlemi başarısız (${hash}). Hiçbir rozet basılmadı, tekrar deneyebilirsin.`
    );
  }

  // 3. Read each badge's tokenId out of the receipt logs. batchMint assigns ids
  //    sequentially inside the call, so the log is the only authoritative source.
  const logs = parseEventLogs({ abi: BADGE_ABI, eventName: "BadgeMinted", logs: receipt.logs });
  const tokenByRef = new Map<string, string>();
  for (const log of logs) {
    tokenByRef.set(log.args.badgeRef.toLowerCase(), log.args.tokenId.toString());
  }

  const settled = mintable.map((c, i) => ({
    id: c.id,
    tokenId: tokenByRef.get(refs[i].toLowerCase()) ?? null
  }));
  const mintedAt = new Date();

  // 4. One transaction for the whole cohort: either every badge records its mint
  //    or none does, so a partial write can never leave a badge minted on chain
  //    but unrecorded here.
  await prisma.$transaction(
    settled.map((b) =>
      prisma.badge.update({
        where: { id: b.id },
        data: { txHash: hash, tokenId: b.tokenId, mintedAt }
      })
    )
  );

  return actionOk({
    minted: settled.length,
    queued: waitingForWallet,
    onChain: true,
    txHash: hash,
    missingTokenIds: settled.filter((b) => !b.tokenId).length
  });
}
