import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@tedu-pass/db";
import { badgeSvg } from "@/lib/badge-svg";

export const runtime = "nodejs";

/** Public badge artwork (SVG) used as the NFT tokenURI image. */
export async function GET(_req: NextRequest, { params }: { params: { badgeId: string } }) {
  const badge = await prisma.badge
    .findUnique({
      where: { id: params.badgeId },
      include: { badgeTemplate: { include: { event: { include: { club: true } } } } }
    })
    .catch(() => null);

  if (!badge) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const ev = badge.badgeTemplate.event;

  // Club-supplied custom design takes precedence over generated art.
  const custom = badge.badgeTemplate.imageUrl ?? ev.badgeImageUrl;
  const m = custom?.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (m) {
    return new NextResponse(Buffer.from(m[2], "base64"), {
      headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=31536000, immutable" }
    });
  }

  const svg = badgeSvg({
    role: badge.badgeTemplate.roleType,
    eventTitle: ev.title,
    clubName: ev.club.name,
    date: ev.date.toLocaleDateString("tr-TR")
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
