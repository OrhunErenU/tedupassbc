import { NextResponse } from "next/server";
import { prisma } from "@tedu-pass/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Temporary diagnostic endpoint to verify production DB connectivity.
export async function GET() {
  const raw = process.env.DATABASE_URL ?? null;
  const masked = raw
    ? raw.replace(/:[^:@/]+@/, ":****@").slice(0, 80)
    : null;

  let db: string;
  try {
    const r = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`;
    db = `ok:${JSON.stringify(r)}`;
  } catch (e) {
    db = `FAIL: ${String((e as Error).message).split("\n").slice(0, 3).join(" | ")}`;
  }

  return NextResponse.json({
    hasDbUrl: Boolean(raw),
    dbUrlPrefix: masked,
    hasDirectUrl: Boolean(process.env.DIRECT_URL),
    hasPrivyId: Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
    devLogin: process.env.DEV_LOGIN ?? null,
    db
  });
}
