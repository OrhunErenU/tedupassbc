import { prisma } from "@tedu-pass/db";

/**
 * DB-backed rate limiting for check-in.
 *
 * An in-memory counter is worthless here: on Vercel each request can land on a
 * fresh lambda, so a caller simply never sees the same counter twice. The
 * CheckinAttempt table is shared by every instance and doubles as the audit
 * trail for disputed attendance.
 */
export const LIMITS = {
  /** One student, one event. Generous — a real scan takes a few tries at most. */
  perUserPerEvent: { max: 10, windowMs: 60_000 },
  /** One network address across all events — catches scripted enumeration. */
  perIp: { max: 40, windowMs: 60_000 }
};

/** Attempts older than this are noise; pruned opportunistically. */
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function clientIp(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim().slice(0, 64);
  return headers.get("x-real-ip")?.slice(0, 64) ?? null;
}

export async function recordAttempt(input: {
  eventId: string;
  userId: string | null;
  ip: string | null;
  result: string;
}): Promise<void> {
  await prisma.checkinAttempt.create({ data: input }).catch(() => null);

  // Opportunistic pruning: keeps the table from growing without a cron job,
  // while costing almost nothing per request.
  if (Math.random() < 0.02) {
    await prisma.checkinAttempt
      .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } } })
      .catch(() => null);
  }
}

export type RateVerdict = { limited: true; scope: "user" | "ip" } | { limited: false };

export async function checkRateLimit(input: {
  eventId: string;
  userId: string | null;
  ip: string | null;
}): Promise<RateVerdict> {
  const now = Date.now();

  if (input.userId) {
    const since = new Date(now - LIMITS.perUserPerEvent.windowMs);
    const n = await prisma.checkinAttempt
      .count({
        where: { eventId: input.eventId, userId: input.userId, createdAt: { gte: since } }
      })
      .catch(() => 0);
    if (n >= LIMITS.perUserPerEvent.max) return { limited: true, scope: "user" };
  }

  if (input.ip) {
    const since = new Date(now - LIMITS.perIp.windowMs);
    const n = await prisma.checkinAttempt
      .count({ where: { ip: input.ip, createdAt: { gte: since } } })
      .catch(() => 0);
    if (n >= LIMITS.perIp.max) return { limited: true, scope: "ip" };
  }

  return { limited: false };
}
