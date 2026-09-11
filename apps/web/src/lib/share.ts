import { randomBytes } from "crypto";
import { prisma } from "@tedu-pass/db";

/**
 * Share tokens for the participation transcript.
 *
 * 32 random bytes, base64url — unguessable, and unlike the old scheme (the
 * student's own user id in the URL) a token can be revoked or given an expiry
 * without changing anything else about the student's record.
 */
export function newShareToken(): string {
  return randomBytes(32).toString("base64url");
}

export type ShareResolution =
  | { status: "ok"; userId: string; revealStudentId: boolean; label: string | null }
  | { status: "missing" }
  | { status: "revoked" }
  | { status: "expired" };

/**
 * Resolve a share token to the student whose transcript it opens.
 * Records the view as a side effect so the student can see how a link is used.
 */
export async function resolveShareToken(token: string): Promise<ShareResolution> {
  const link = await prisma.shareLink.findUnique({ where: { token } }).catch(() => null);
  if (!link) return { status: "missing" };
  if (link.revokedAt) return { status: "revoked" };
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return { status: "expired" };

  // Best-effort: a failed counter update must never block the document itself.
  await prisma.shareLink
    .update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 }, lastViewedAt: new Date() }
    })
    .catch(() => null);

  return {
    status: "ok",
    userId: link.userId,
    revealStudentId: link.revealStudentId,
    label: link.label
  };
}

/**
 * Student numbers are personal data (KVKK) and are not needed to check that a
 * transcript is genuine, so a shared document shows only the last two digits
 * unless the student explicitly chose to reveal it on that link.
 */
export function maskStudentId(studentId: string | null): string | null {
  if (!studentId) return null;
  if (studentId.length <= 2) return "•".repeat(studentId.length);
  return "•".repeat(studentId.length - 2) + studentId.slice(-2);
}
