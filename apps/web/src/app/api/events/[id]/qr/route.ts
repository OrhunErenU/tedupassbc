import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@tedu-pass/db";
import QRCode from "qrcode";
import { requireSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const membership = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: user.id, clubId: event.clubId } }
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = JSON.stringify({ e: event.id, s: event.qrSecret });
  const png = await QRCode.toBuffer(payload, { type: "png", width: 512, margin: 1 });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store"
    }
  });
}
