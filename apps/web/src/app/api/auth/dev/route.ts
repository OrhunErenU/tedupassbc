import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@tedu-pass/db";
import { devLoginEnabled } from "@/lib/dev-login";

export const runtime = "nodejs";

/**
 * Dev-only impersonation. Requires DEV_LOGIN=1 *and* a non-production
 * deployment. Evaluated per request rather than at module load so the guard
 * cannot be frozen in by a build that happened under different env.
 */
export async function GET(req: NextRequest) {
  if (!devLoginEnabled()) return NextResponse.json({ error: "disabled" }, { status: 404 });

  const email = req.nextUrl.searchParams.get("email")?.toLowerCase();
  const redirect = req.nextUrl.searchParams.get("redirect") ?? "/student";
  if (!email) return NextResponse.json({ error: "email-required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { teduEmail: email } });
  if (!user) return NextResponse.json({ error: "no-such-user" }, { status: 404 });

  const opts = { sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 7 };
  cookies().set("dev_user", email, { ...opts, httpOnly: true });
  // Non-httpOnly companions so the client shell can detect dev-login state + role.
  cookies().set("dev_user_pub", email, { ...opts, httpOnly: false });
  cookies().set("dev_role", user.role, { ...opts, httpOnly: false });

  return NextResponse.redirect(new URL(redirect, req.nextUrl.origin));
}

export async function DELETE() {
  cookies().delete("dev_user");
  cookies().delete("dev_user_pub");
  cookies().delete("dev_role");
  return NextResponse.json({ ok: true });
}
