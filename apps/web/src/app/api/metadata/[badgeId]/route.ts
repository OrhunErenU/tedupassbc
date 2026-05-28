import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@tedu-pass/db";

export const runtime = "nodejs";

/** Public ERC-721 metadata endpoint (used as tokenURI). */
export async function GET(_req: NextRequest, { params }: { params: { badgeId: string } }) {
  const badge = await prisma.badge.findUnique({
    where: { id: params.badgeId },
    include: {
      badgeTemplate: { include: { event: { include: { club: true } } } }
    }
  });
  if (!badge) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const ev = badge.badgeTemplate.event;
  return NextResponse.json({
    name: badge.badgeTemplate.name,
    description: `${ev.club.name} — ${ev.title}`,
    image: badge.badgeTemplate.imageUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/badge-image/${badge.id}`,
    external_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/verify/${badge.id}`,
    attributes: [
      { trait_type: "Club", value: ev.club.name },
      { trait_type: "Event", value: ev.title },
      { trait_type: "Role", value: badge.badgeTemplate.roleType },
      { trait_type: "Date", value: ev.date.toISOString() }
    ]
  });
}
