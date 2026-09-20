#!/usr/bin/env node
/**
 * TipSeal generator — Dual-Control Deploy/Promote v1.0
 * Fail-closed: refuses empty tree.
 *
 * Modes:
 *   --worker <name>           Hash workers/<name> (default dualis-gate)
 *   --payload-dir <path>      Hash a Pages/static deploy tree (e.g. cf-pages or
 *                             extracted deploy-payload). Paths in the manifest
 *                             are relative to that directory so package-job and
 *                             deploy-job seals compare on content_sha256.
 *   --out <path>              Write TipSeal JSON
 *   --sealer <id>             Sealer identity (default TIPSEAL_SEALER / dclm)
 *
 * When --payload-dir is set, --worker names the rail identity for gate-deploy
 * (--expect-worker). Default worker id for payload mode is "pages".
 */
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, isAbsolute } from "node:path";

const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
const outPath = flag("--out");
const payloadDirArg = flag("--payload-dir");
const worker =
  flag("--worker") || (payloadDirArg ? "pages" : "dualis-gate");
const sealer = flag("--sealer") || process.env.TIPSEAL_SEALER || "dclm";
const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
const tip_sha = execSync("git rev-parse HEAD", { encoding: "utf8", cwd: root }).trim();
const tip_branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8", cwd: root }).trim();

function walkWorker(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".") || name === "wrangler.deploy.toml") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkWorker(p, acc);
    else if (/\.(js|mjs|cjs|toml|sql|md)$/.test(name) || name === "wrangler.toml") acc.push(p);
  }
  return acc;
}

/** Pages / static artifact: hash every regular file (integrity of what wrangler uploads). */
function walkPayload(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "_peel-backup" || name === ".DS_Store") continue;
    if (name.startsWith(".") && name !== ".well-known") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkPayload(p, acc);
    else if (st.isFile()) acc.push(p);
  }
  return acc;
}

let files;
let pathBase;
let payload_dir = null;

if (payloadDirArg) {
  const abs = isAbsolute(payloadDirArg) ? payloadDirArg : resolve(process.cwd(), payloadDirArg);
  let st;
  try {
    st = statSync(abs);
  } catch {
    console.error("FAIL_CLOSED: --payload-dir not found:", abs);
    process.exit(2);
  }
  if (!st.isDirectory()) {
    console.error("FAIL_CLOSED: --payload-dir is not a directory:", abs);
    process.exit(2);
  }
  pathBase = abs;
  payload_dir = abs;
  files = walkPayload(abs).sort();
} else {
  const workerDir = join(root, "workers", worker);
  let st;
  try {
    st = statSync(workerDir);
  } catch {
    console.error("FAIL_CLOSED: worker dir missing:", workerDir);
    process.exit(2);
  }
  if (!st.isDirectory()) {
    console.error("FAIL_CLOSED: worker path is not a directory:", workerDir);
    process.exit(2);
  }
  pathBase = root;
  files = walkWorker(workerDir).sort();
}

if (!files.length) {
  console.error("FAIL_CLOSED: no files to hash");
  process.exit(2);
}

const h = createHash("sha256");
const manifest = [];
for (const f of files) {
  const rel = relative(pathBase, f).split("\\").join("/");
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
if (payload_dir) {
  tipseal.payload_mode = "pages";
  // Relative to repo when under root; else absolute (CI extract path).
  const relPayload = relative(root, payload_dir).split("\\").join("/");
  tipseal.payload_dir = relPayload && !relPayload.startsWith("..") ? relPayload : payload_dir;
}

const json = JSON.stringify(tipseal, null, 2) + "\n";
if (outPath) writeFileSync(outPath, json);
process.stdout.write(json);
