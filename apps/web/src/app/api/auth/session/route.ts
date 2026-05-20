import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { privyServer } from "@/lib/privy-server";
import { prisma, UserRole } from "@tedu-pass/db";
import { ALLOWED_EMAIL_DOMAIN, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Called by the client after Privy login. Body: { accessToken }
 * Validates with Privy, upserts the User, and stores accessToken in an HttpOnly cookie.
 */
export async function POST(req: NextRequest) {
  if (!privyServer) {
    // Dev fallback — auth disabled
    return NextResponse.json({ ok: true, dev: true });
  }

  const body = await req.json().catch(() => ({}));
  const token: string | undefined = body?.accessToken;
  if (!token) {
    return NextResponse.json({ error: "missing accessToken" }, { status: 400 });
  }

  let claims;
  try {
    claims = await privyServer.verifyAuthToken(token);
  } catch {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const u = await privyServer.getUser(claims.userId);
  const email = u.email?.address?.toLowerCase();
  if (!email || !email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    return NextResponse.json({ error: "email-not-allowed" }, { status: 403 });
  }

  await prisma.user.upsert({
    where: { teduEmail: email },
    create: {
      teduEmail: email,
      walletAddress: u.wallet?.address,
      role: UserRole.STUDENT
    },
    update: { walletAddress: u.wallet?.address ?? undefined }
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
