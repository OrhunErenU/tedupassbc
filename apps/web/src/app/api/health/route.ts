import { NextResponse } from "next/server";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@tedu-pass/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Walk a directory tree (bounded) collecting Prisma engine files present in the
// deployed lambda filesystem — definitive runtime diagnostic for engine bundling.
function findEngines(root: string, depth = 0, acc: string[] = []): string[] {
  if (depth > 6 || acc.length > 20) return acc;
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const p = join(root, e.name);
    if (e.isDirectory()) {
      if ([".git", ".cache", "node:"].includes(e.name)) continue;
      findEngines(p, depth + 1, acc);
    } else if (e.name.startsWith("libquery_engine-")) {
      acc.push(p);
    }
  }
  return acc;
}

export async function GET() {
  const raw = process.env.DATABASE_URL ?? null;
  const masked = raw ? raw.replace(/:[^:@/]+@/, ":****@") : null;

  let db: string;
  try {
    const r = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`;
    db = `ok:${JSON.stringify(r)}`;
  } catch (e: any) {
    db = `FAIL: ${String(e?.message ?? e).replace(/\s+/g, " ").slice(0, 300)}`;
  }

  return NextResponse.json({
    cwd: process.cwd(),
    dbUrl: masked,
    db,
    enginesCwd: findEngines(process.cwd()),
    enginesTask: findEngines("/var/task")
  });
}
