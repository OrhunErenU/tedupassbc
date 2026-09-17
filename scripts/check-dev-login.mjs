#!/usr/bin/env node
/**
 * Proves that dev impersonation cannot be switched on in production.
 *
 * /api/auth/dev signs a caller in as any seeded user by e-mail. It must be dead
 * on a production deployment even when DEV_LOGIN=1 is set — a stray environment
 * variable in the Vercel project should not be able to open it.
 *
 * The check boots the built app twice with DEV_LOGIN=1 and asserts the route's
 * own response, not the source text:
 *
 *   VERCEL_ENV=production  -> 404 {"error":"disabled"}
 *   VERCEL_ENV unset       -> 400 {"error":"email-required"}
 *
 * The second case is what keeps the first from being vacuous: it shows the
 * route really is reachable when it should be. Neither case touches the
 * database, so this runs anywhere the app builds.
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = Number(process.env.CHECK_PORT ?? 3199);
const APP_DIR = new URL("../apps/web/", import.meta.url).pathname;

async function waitForServer(port, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/auth/dev`, {
        signal: AbortSignal.timeout(2000)
      });
      if (res.status > 0) return;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  throw new Error(`server did not start on port ${port} within ${timeoutMs}ms`);
}

async function probe({ label, env, expectStatus, expectError }) {
  const child = spawn("node", ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], {
    cwd: APP_DIR,
    env: {
      ...process.env,
      NODE_ENV: "production",
      DEV_LOGIN: "1",
      DATABASE_URL:
        process.env.DATABASE_URL ?? "postgresql://placeholder@localhost:5432/tedu_pass",
      ...env
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));

  try {
    await waitForServer(PORT);
    const res = await fetch(`http://127.0.0.1:${PORT}/api/auth/dev`);
    const body = await res.json().catch(() => ({}));

    const ok = res.status === expectStatus && body.error === expectError;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${label}: status=${res.status} error=${JSON.stringify(body.error)} ` +
        `(expected ${expectStatus} / ${JSON.stringify(expectError)})`
    );
    return ok;
  } catch (err) {
    console.log(`FAIL  ${label}: ${err.message}`);
    console.log(log.slice(-2000));
    return false;
  } finally {
    child.kill("SIGTERM");
    await sleep(1500);
  }
}

const results = [];
results.push(
  await probe({
    label: "production deployment refuses dev login",
    env: { VERCEL_ENV: "production" },
    expectStatus: 404,
    expectError: "disabled"
  })
);
results.push(
  await probe({
    label: "non-production deployment still allows dev login",
    env: { VERCEL_ENV: "preview" },
    expectStatus: 400,
    expectError: "email-required"
  })
);

if (results.every(Boolean)) {
  console.log("\nDEV_LOGIN production guard OK");
  process.exit(0);
}
console.error("\nDEV_LOGIN production guard FAILED");
process.exit(1);
