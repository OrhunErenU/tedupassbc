import { cookies } from "next/headers";
import { prisma, UserRole } from "@tedu-pass/db";
import { privyServer } from "./privy-server";

const ALLOWED_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN ?? "tedu.edu.tr").toLowerCase();
const COOKIE = process.env.SESSION_COOKIE_NAME ?? "tedu_pass_session";

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

  const user = await prisma.user.upsert({
    where: { teduEmail: email },
    create: {
      teduEmail: email,
      walletAddress: wallet,
      role: UserRole.STUDENT
    },
    update: {
      walletAddress: wallet ?? undefined
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

export const ALLOWED_EMAIL_DOMAIN = ALLOWED_DOMAIN;
export const SESSION_COOKIE = COOKIE;
