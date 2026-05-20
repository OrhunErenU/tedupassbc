import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, BadgeRole, EventStatus } from "@tedu-pass/db";
import { requireSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  eventId: z.string().min(1),
  qrSecret: z.string().min(8)
});

export async function POST(req: NextRequest) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId } });
  if (!event) return NextResponse.json({ error: "event-not-found" }, { status: 404 });
  if (event.qrSecret !== parsed.data.qrSecret) {
    return NextResponse.json({ error: "invalid-qr" }, { status: 403 });
  }
  if (event.status !== EventStatus.ACTIVE) {
    return NextResponse.json({ error: "event-closed" }, { status: 410 });
  }

  const attendance = await prisma.attendance.upsert({
    where: { eventId_userId: { eventId: event.id, userId: user.id } },
    create: { eventId: event.id, userId: user.id, role: BadgeRole.ATTENDEE },
    update: {}
  });

  return NextResponse.json({ ok: true, attendanceId: attendance.id, eventTitle: event.title });
}
