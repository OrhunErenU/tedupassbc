/**
 * Wraps a Prisma query so the UI keeps rendering even when DATABASE_URL
 * isn't configured yet (early dev). Returns the fallback on any error.
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[safe-db]", (err as Error).message);
    }
    return fallback;
  }
}
