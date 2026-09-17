import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, BadgeRole, EventStatus } from "@tedu-pass/db";
import { requireSessionUser } from "@/lib/auth";
import { verifyCheckinCode, checkinWindowState, checkinWindow } from "@/lib/checkin-code";
import { checkRateLimit, clientIp, recordAttempt } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  eventId: z.string().min(1),
  /** Rotating HMAC code from the QR. */
  code: z.string().length(16).optional(),
  /** Legacy field: the old QR embedded the raw secret. Recognised only to
   *  return a helpful error when someone scans an old printout. */
  qrSecret: z.string().optional()
});

/** Turkish messages keyed by machine-readable reason, so the scanner can show
 *  the student something actionable instead of a bare code. */
const MESSAGES: Record<string, string> = {
  "invalid-code": "Kod geçersiz veya süresi doldu. Ekrandaki güncel QR'ı tekrar tara.",
  "legacy-qr": "Bu QR artık geçerli değil. Etkinlik ekranındaki güncel QR'ı tara.",
  "event-not-found": "Etkinlik bulunamadı.",
  "event-closed": "Etkinlik check-in'e kapalı.",
  "window-before": "Check-in henüz açılmadı.",
  "window-after": "Check-in süresi doldu.",
  "rate-limited": "Çok fazla deneme yaptın. Biraz bekleyip tekrar dene.",
  unauthorized: "Önce giriş yapmalısın."
};

function fail(status: number, reason: string) {
  return NextResponse.json({ error: reason, message: MESSAGES[reason] ?? reason }, { status });
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const user = await requireSessionUser().catch(() => null);
  if (!user) return fail(401, "unauthorized");

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(400, "bad-request");

  const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId } });
  if (!event) return fail(404, "event-not-found");

  // Rate limit before touching the code, so a brute-force run is cut off early.
  const verdict = await checkRateLimit({ eventId: event.id, userId: user.id, ip });
  if (verdict.limited) {
    await recordAttempt({ eventId: event.id, userId: user.id, ip, result: `rate-limited:${verdict.scope}` });
    return fail(429, "rate-limited");
  }

  if (!parsed.data.code) {
    // An old QR (or a photo of one) still carries the raw secret.
    const reason = parsed.data.qrSecret ? "legacy-qr" : "invalid-code";
    await recordAttempt({ eventId: event.id, userId: user.id, ip, result: reason });
    return fail(410, reason);
  }

  if (event.status !== EventStatus.ACTIVE) {
    await recordAttempt({ eventId: event.id, userId: user.id, ip, result: "event-closed" });
    return fail(410, "event-closed");
  }

  const windowState = checkinWindowState(event);
  if (windowState !== "open") {
    const reason = windowState === "before" ? "window-before" : "window-after";
    await recordAttempt({ eventId: event.id, userId: user.id, ip, result: reason });
    const { opensAt, closesAt } = checkinWindow(event);
    return NextResponse.json(
      {
        error: reason,
        message: MESSAGES[reason],
        opensAt: opensAt.toISOString(),
        closesAt: closesAt.toISOString()
      },
      { status: 409 }
    );
  }

  if (!verifyCheckinCode(event.qrSecret, event.id, parsed.data.code)) {
    await recordAttempt({ eventId: event.id, userId: user.id, ip, result: "invalid-code" });
    return fail(403, "invalid-code");
  }

  const attendance = await prisma.attendance.upsert({
    where: { eventId_userId: { eventId: event.id, userId: user.id } },
    create: { eventId: event.id, userId: user.id, role: BadgeRole.ATTENDEE },
    update: {}
  });

  await recordAttempt({ eventId: event.id, userId: user.id, ip, result: "ok" });

  return NextResponse.json({
    ok: true,
    attendanceId: attendance.id,
    eventTitle: event.title
  });
}
