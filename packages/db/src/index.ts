import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __teduPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__teduPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__teduPrisma = prisma;
}

export * from "@prisma/client";
