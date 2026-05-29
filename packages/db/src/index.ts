import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __teduPrisma: PrismaClient | undefined;
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
