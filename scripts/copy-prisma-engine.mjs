// Ensures the Prisma query engine for the Vercel serverless runtime is bundled.
// Walks the pnpm store, logs every engine found, and copies the rhel engine into
// apps/web/.next/server (a path the lambda searches). Never throws → never fails build.
import { readdirSync, copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ENGINE = "libquery_engine-rhel-openssl-3.0.x.so.node";
const TARGET_DIRS = ["apps/web/.next/server"];
const found = [];

function walk(dir, depth) {
  if (depth > 7) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === ".next" || e.name === ".git" || e.name === ".cache") continue;
      walk(p, depth + 1);
    } else if (e.name.startsWith("libquery_engine-")) {
      found.push(p);
    }
  }
}

walk("node_modules/.pnpm", 0);
console.log("[copy-engine] engines found:", found);

const engine = found.find((p) => p.endsWith(ENGINE));
if (!engine) {
  console.log("[copy-engine] WARNING: rhel-openssl-3.0.x engine not found in pnpm store");
} else {
  for (const dir of TARGET_DIRS) {
    try {
      mkdirSync(dir, { recursive: true });
      copyFileSync(engine, join(dir, ENGINE));
      console.log(`[copy-engine] copied -> ${dir}/${ENGINE}`);
    } catch (e) {
      console.log(`[copy-engine] copy to ${dir} failed:`, String(e?.message ?? e));
    }
  }
}
