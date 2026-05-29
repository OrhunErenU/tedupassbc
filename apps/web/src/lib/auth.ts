import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma, UserRole } from "@tedu-pass/db";
import { privyServer } from "./privy-server";

const ALLOWED_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN ?? "tedu.edu.tr").toLowerCase();
const COOKIE = process.env.SESSION_COOKIE_NAME ?? "tedu_pass_session";

// Comma-separated allowlists chosen by us — only these emails get elevated roles.
function emailSet(v: string | undefined): Set<string> {
  return new Set(
    (v ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}
const SKS_ADMIN_EMAILS = emailSet(process.env.SKS_ADMIN_EMAILS);
const CLUB_ADMIN_EMAILS = emailSet(process.env.CLUB_ADMIN_EMAILS);

/** Role for an email based on our allowlists; everyone else is a student. */
export function roleForEmail(email: string): UserRole {
  const e = email.toLowerCase();
  if (SKS_ADMIN_EMAILS.has(e)) return UserRole.SKS_ADMIN;
  if (CLUB_ADMIN_EMAILS.has(e)) return UserRole.CLUB_ADMIN;
  return UserRole.STUDENT;
}

export type SessionUser = {
  id: string;
  teduEmail: string;
  name: string | null;
  role: UserRole;
  walletAddress: string | null;
};

/**
 * Verifies the Privy access token from the request and returns the matching DB user.
 * Returns null if no valid session or no DB user yet.
 */
const DEV_LOGIN = process.env.DEV_LOGIN === "1";

export async function getSessionUser(): Promise<SessionUser | null> {
  // Local demo / development impersonation. Strictly gated behind DEV_LOGIN=1,
  // which must never be set in production. Lets the team demo seeded users
  // without a live Privy email round-trip.
  if (DEV_LOGIN) {
    const devEmail = cookies().get("dev_user")?.value;
    if (devEmail) {
      const user = await prisma.user.findUnique({ where: { teduEmail: devEmail } });
      if (user) return user;
    }
  }

  if (!privyServer) {
    const devEmail = cookies().get("dev_user")?.value;
    if (!devEmail) return null;
    const user = await prisma.user.findUnique({ where: { teduEmail: devEmail } });
    return user ?? null;
  }

  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;

  let claims;
  try {
    claims = await privyServer.verifyAuthToken(token);
  } catch {
    return null;
  }

  const privyUser = await privyServer.getUser(claims.userId);
  const email = privyUser.email?.address?.toLowerCase();
  if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) return null;

  const wallet = privyUser.wallet?.address ?? null;

  // Role is derived from our allowlists and re-applied on every login, so adding
  // an email to SKS_ADMIN_EMAILS / CLUB_ADMIN_EMAILS promotes them on next sign-in.
  const role = roleForEmail(email);

  const user = await prisma.user.upsert({
    where: { teduEmail: email },
    create: {
      teduEmail: email,
      walletAddress: wallet,
      role
    },
    update: {
      walletAddress: wallet ?? undefined,
      role
    }
  });

  return user;
}

export async function requireSessionUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error("Unauthorized");
  return u;
}

export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const u = await requireSessionUser();
  if (!roles.includes(u.role)) throw new Error("Forbidden");
  return u;
}

/**
 * Server-component guard: send unauthorized roles away instead of rendering a
 * panel they can't use. In DEV_LOGIN mode the client shell already gates, so we
 * only redirect when a real (Privy) session resolves to the wrong role.
 */
export async function requirePageRole(roles: UserRole[], to = "/"): Promise<SessionUser | null> {
  const u = await getSessionUser().catch(() => null);
  if (DEV_LOGIN && !u) return null; // dev: client shell handles redirect to /dev
  if (!u || !roles.includes(u.role)) redirect(to);
  return u;
}

export const ALLOWED_EMAIL_DOMAIN = ALLOWED_DOMAIN;
export const SESSION_COOKIE = COOKIE;
