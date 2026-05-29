import { NextResponse } from "next/server";
import { prisma } from "@tedu-pass/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Temporary diagnostic endpoint to verify production DB connectivity.
export async function GET() {
  const raw = process.env.DATABASE_URL ?? null;
  // Full URL with only the password masked, so we can see host/port/query.
  const masked = raw ? raw.replace(/:[^:@/]+@/, ":****@") : null;

  let db: string;
  let code: string | null = null;
  try {
    const r = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`;
    db = `ok:${JSON.stringify(r)}`;
  } catch (e: any) {
    code = e?.code ?? null;
    db = `FAIL: ${String(e?.message ?? e).replace(/\s+/g, " ").slice(0, 400)}`;
  }

  return NextResponse.json({
    dbUrl: masked,
    code,
    db
  });
}
