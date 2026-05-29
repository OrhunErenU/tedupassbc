import { PrismaClient } from "@prisma/client";
import { join } from "node:path";
import { existsSync } from "node:fs";

declare global {
  // eslint-disable-next-line no-var
  var __teduPrisma: PrismaClient | undefined;
}

// On Vercel, the Prisma query engine isn't reliably bundled into the serverless
// function (pnpm monorepo). We commit the linux engine to apps/web/prisma-engine
// and point Prisma straight at it. Guarded so local (Windows/macOS) dev is untouched.
if (process.env.VERCEL && !process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
  const enginePath = join(
    process.cwd(),
    "prisma-engine",
    "libquery_engine-rhel-openssl-3.0.x.so.node"
  );
  if (existsSync(enginePath)) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
  }
}

/**
 * Ensure Supabase transaction-pooler URLs (port 6543) carry `pgbouncer=true`.
 * Without it Prisma uses prepared statements, which pgbouncer's transaction mode
 * drops between queries → "prepared statement sX does not exist" at runtime.
 * Normalizing here makes the app resilient even if the env var omits the flag.
 */
function normalizeDbUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  if (!raw.includes("pooler.supabase.com:6543")) return raw;
  if (/[?&]pgbouncer=true/.test(raw)) return raw;
  const sep = raw.includes("?") ? "&" : "?";
  return `${raw}${sep}pgbouncer=true&connection_limit=1`;
}

const url = normalizeDbUrl(process.env.DATABASE_URL);

export const prisma =
  globalThis.__teduPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
    ...(url ? { datasources: { db: { url } } } : {})
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__teduPrisma = prisma;
}

export * from "@prisma/client";
