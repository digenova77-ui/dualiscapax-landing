#!/usr/bin/env node
/**
 * TipSeal generator — Dual-Control Deploy/Promote v1.0
 * Fail-closed: refuses empty tree.
 */
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
const outPath = flag("--out");
const worker = flag("--worker") || "dualis-gate";
const sealer = flag("--sealer") || process.env.TIPSEAL_SEALER || "dclm";
const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
const tip_sha = execSync("git rev-parse HEAD", { encoding: "utf8", cwd: root }).trim();
const tip_branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8", cwd: root }).trim();

const workerDir = join(root, "workers", worker);
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".") || name === "wrangler.deploy.toml") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(js|mjs|cjs|toml|sql|md)$/.test(name) || name === "wrangler.toml") acc.push(p);
  }
  return acc;
}
const files = walk(workerDir).sort();
if (!files.length) {
  console.error("FAIL_CLOSED: no worker files to hash");
  process.exit(2);
}
const h = createHash("sha256");
const manifest = [];
for (const f of files) {
  const rel = relative(root, f).split("\\").join("/");
  const buf = readFileSync(f);
  const fh = createHash("sha256").update(buf).digest("hex");
  h.update(rel);
  h.update("\0");
  h.update(buf);
  manifest.push({ path: rel, sha256: fh, bytes: buf.length });
}
const content_sha256 = h.digest("hex");

const tipseal = {
  tip_repo: "digenova77-ui/dualiscapax-landing",
  tip_sha,
  tip_branch,
  worker,
  sealed_at: new Date().toISOString(),
  sealer,
  content_sha256,
  manifest,
  schema: "TipSeal/v1",
};

const json = JSON.stringify(tipseal, null, 2) + "\n";
if (outPath) writeFileSync(outPath, json);
process.stdout.write(json);
