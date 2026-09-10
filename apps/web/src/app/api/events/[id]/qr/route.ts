import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@tedu-pass/db";
import QRCode from "qrcode";
import { requireSessionUser } from "@/lib/auth";
import { checkinPayload, msUntilNextSlice } from "@/lib/checkin-code";

export const runtime = "nodejs";

/**
 * Renders the current rotating check-in QR for a club screen.
 *
 * The image is valid for one 30-second slice, so it must never be cached and
 * the club page re-requests it as the slice rolls over.
 */
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

  const payload = JSON.stringify(checkinPayload(event.id, event.qrSecret));
  const png = await QRCode.toBuffer(payload, { type: "png", width: 512, margin: 1 });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      // Lets the club screen line its refresh up with the rotation.
      "X-Code-Expires-In": String(msUntilNextSlice())
    }
  });
}
