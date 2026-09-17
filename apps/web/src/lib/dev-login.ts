/**
 * Dev impersonation switch.
 *
 * /dev and /api/auth/dev let anyone sign in as any seeded user by e-mail —
 * indispensable for demos, catastrophic in production. DEV_LOGIN=1 alone is not
 * enough to enable it: a production deployment hard-refuses, so the flag cannot
 * be turned on by a stray environment variable in the Vercel project settings.
 *
 * NODE_ENV is deliberately not used as the signal — `next start` sets it to
 * "production" for any local production build, which is exactly how the team
 * demos the app.
 */
export function isProductionDeploy(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.TEDU_PASS_ENV === "production";
}

export function devLoginEnabled(): boolean {
  return process.env.DEV_LOGIN === "1" && !isProductionDeploy();
}
