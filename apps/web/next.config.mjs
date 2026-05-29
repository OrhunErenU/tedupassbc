import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";

// The repo keeps env at the monorepo root (.env.local / .env). Next only auto-loads
// env from the app dir, so load the root files here for local dev. On Vercel, env
// comes from the dashboard and these files are absent — this becomes a no-op.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
for (const file of [".env", ".env.local"]) {
  const p = resolve(repoRoot, file);
  if (!existsSync(p)) continue;
  for (const raw of readFileSync(p, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Trace from the monorepo root so the Prisma query engine (in the pnpm store)
  // is bundled into the serverless functions on Vercel.
  outputFileTracingRoot: repoRoot,
  // Force the Prisma native query engine (pnpm store) into every serverless
  // function bundle — node-file-trace otherwise misses the dynamically-loaded .node.
  outputFileTracingIncludes: {
    "/**": [
      "../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/*.node",
      "../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/**",
      "../../node_modules/.pnpm/prisma@*/node_modules/prisma/**"
    ]
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
    // Keep Prisma out of the bundle so it loads from node_modules at runtime,
    // where its native query engine lives (fixes "could not locate Query Engine").
    serverComponentsExternalPackages: ["@prisma/client", "prisma", ".prisma/client"]
  },
  transpilePackages: ["@tedu-pass/db"]
};

export default nextConfig;
