import { createHmac, timingSafeEqual } from "crypto";

/**
 * Rotating check-in codes.
 *
 * The QR used to encode the event's long-lived qrSecret, so a photo of the
 * screen — or a screenshot forwarded to a friend at home — checked you in for
 * the rest of the event. The QR now carries an HMAC over a 30-second time
 * slice instead: a captured code stops working within a minute, and the secret
 * itself never leaves the server.
 */
export const SLICE_MS = 30_000;

/** Codes from the neighbouring slices stay valid, so a scan straddling a
 *  boundary (or a phone with a slightly wrong clock) still works. */
export const SLICE_TOLERANCE = 1;

export function currentSlice(now: number = Date.now()): number {
  return Math.floor(now / SLICE_MS);
}

/** Milliseconds until the current slice rolls over — drives the UI countdown. */
export function msUntilNextSlice(now: number = Date.now()): number {
  return SLICE_MS - (now % SLICE_MS);
}

export function checkinCode(qrSecret: string, eventId: string, slice: number): string {
  return createHmac("sha256", qrSecret)
    .update(`${eventId}:${slice}`)
    .digest("hex")
    .slice(0, 16);
}

function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifyCheckinCode(
  qrSecret: string,
  eventId: string,
  code: string,
  now: number = Date.now()
): boolean {
  if (typeof code !== "string" || code.length !== 16) return false;
  const slice = currentSlice(now);
  let ok = false;
  // No early return: check every candidate so timing does not leak which slice matched.
  for (let d = -SLICE_TOLERANCE; d <= SLICE_TOLERANCE; d++) {
    if (constantTimeEquals(code, checkinCode(qrSecret, eventId, slice + d))) ok = true;
  }
  return ok;
}

/** What the QR encodes. v marks the format so an old printed QR is recognised. */
export type CheckinPayload = { v: 2; e: string; c: string };

export function checkinPayload(eventId: string, qrSecret: string, now?: number): CheckinPayload {
  return { v: 2, e: eventId, c: checkinCode(qrSecret, eventId, currentSlice(now)) };
}

/** Default window around the event when the club has not set one explicitly. */
const OPENS_BEFORE_MS = 2 * 60 * 60 * 1000;
const CLOSES_AFTER_MS = 8 * 60 * 60 * 1000;

export function checkinWindow(event: {
  date: Date;
  checkinOpensAt: Date | null;
  checkinClosesAt: Date | null;
}): { opensAt: Date; closesAt: Date } {
  return {
    opensAt: event.checkinOpensAt ?? new Date(event.date.getTime() - OPENS_BEFORE_MS),
    closesAt: event.checkinClosesAt ?? new Date(event.date.getTime() + CLOSES_AFTER_MS)
  };
}

export function checkinWindowState(
  event: { date: Date; checkinOpensAt: Date | null; checkinClosesAt: Date | null },
  now: number = Date.now()
): "before" | "open" | "after" {
  const { opensAt, closesAt } = checkinWindow(event);
  if (now < opensAt.getTime()) return "before";
  if (now > closesAt.getTime()) return "after";
  return "open";
}
