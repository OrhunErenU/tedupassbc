import { keccak256, toBytes, type Hex } from "viem";
import { prisma } from "@tedu-pass/db";
import { badgeRoleLabel } from "@/lib/roles";

/**
 * The badge metadata document, and the canonical form we hash.
 *
 * tokenURI can only ever be a pointer — our own domain today, IPFS tomorrow.
 * What makes the document trustworthy is the keccak256 of its canonical
 * serialisation, written on chain at mint time. Anyone can re-fetch the
 * metadata, canonicalise it and compare, without trusting whoever serves it.
 */
export type BadgeMetadata = {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: { trait_type: string; value: string }[];
};

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}

export async function buildBadgeMetadata(badgeId: string): Promise<BadgeMetadata | null> {
  const badge = await prisma.badge
    .findUnique({
      where: { id: badgeId },
      include: { badgeTemplate: { include: { event: { include: { club: true } } } } }
    })
    .catch(() => null);
  if (!badge) return null;

  const ev = badge.badgeTemplate.event;
  return {
    name: badge.badgeTemplate.name,
    description: `${ev.club.name} — ${ev.title}`,
    image: badge.badgeTemplate.imageUrl ?? `${appUrl()}/api/badge-image/${badge.id}`,
    external_url: `${appUrl()}/verify/${badge.id}`,
    attributes: [
      { trait_type: "Club", value: ev.club.name },
      { trait_type: "Event", value: ev.title },
      { trait_type: "Role", value: badgeRoleLabel(badge.badgeTemplate.roleType) },
      { trait_type: "Date", value: ev.date.toISOString() }
    ]
  };
}

/**
 * Deterministic serialisation. Key order is fixed here rather than left to
 * JSON.stringify's insertion order, so the same badge always hashes the same
 * whichever code path builds it.
 */
export function canonicalMetadataJson(m: BadgeMetadata): string {
  return JSON.stringify({
    attributes: m.attributes.map((a) => ({ trait_type: a.trait_type, value: a.value })),
    description: m.description,
    external_url: m.external_url,
    image: m.image,
    name: m.name
  });
}

export function metadataContentHash(m: BadgeMetadata): Hex {
  return keccak256(toBytes(canonicalMetadataJson(m)));
}
