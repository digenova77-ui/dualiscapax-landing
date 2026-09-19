#!/usr/bin/env node
/**
 * Stamp DC_ARTIFACT_TIP in a wrangler --outdir package with the git tip SHA.
 * Source trees stay UNSTAMPED. Deploy of an UNSTAMPED body is unauthorized.
 *
 * HONEST LIMITS (rabbit-hole 2026-09-19):
 * - String rewrite only — does NOT prove the outdir corresponds to tip sources.
 * - Does NOT prevent post-stamp mutation; receipt hashes detect it if re-checked.
 * - Old/orphan bodies with UNSTAMPED still stamp successfully (correspondence unverified).
 *
 * Usage: node factory/tools/stamp_artifact_tip.mjs <outdir> [tipSha]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const outdir = process.argv[2];
if (!outdir) {
  console.error("usage: stamp_artifact_tip.mjs <outdir> [tipSha]");
  process.exit(2);
}
const tip =
  process.argv[3] ||
  execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
if (!/^[0-9a-f]{40}$/i.test(tip)) {
  console.error("refusing non-SHA tip:", tip);
  process.exit(2);
}

const UNSTAMPED = 'DC_ARTIFACT_TIP = "UNSTAMPED"';
const stamped = `DC_ARTIFACT_TIP = "${tip}"`;
const tipRe = /DC_ARTIFACT_TIP\s*=\s*"([0-9a-fA-F]{40}|UNSTAMPED)"/;
let n = 0;
const files = [];
for (const name of readdirSync(outdir)) {
  if (!name.endsWith(".js") || name.endsWith(".map")) continue;
  const path = join(outdir, name);
  if (!statSync(path).isFile()) continue;
  let body = readFileSync(path, "utf8");
  const m = body.match(tipRe);
  if (!m) {
    console.error("missing DC_ARTIFACT_TIP in", path);
    process.exit(1);
  }
  if (m[1] !== "UNSTAMPED" && m[1].toLowerCase() !== tip.toLowerCase()) {
    console.error(
      "refusing foreign tip in",
      path,
      "found",
      m[1],
      "wanted UNSTAMPED or",
      tip
    );
    process.exit(1);
  }
  if (!body.includes(UNSTAMPED) && !body.includes(`DC_ARTIFACT_TIP = "${tip}"`)) {
    console.error("missing DC_ARTIFACT_TIP in", path);
    process.exit(1);
  }
  if (body.includes(UNSTAMPED)) {
    body = body.split(UNSTAMPED).join(stamped);
    writeFileSync(path, body);
    n += 1;
  }
  const sha256 = createHash("sha256").update(body, "utf8").digest("hex");
  files.push({ name, sha256, tip_embedded: tip });
}
if (n < 1 && files.length === 0) {
  console.error("no JS artifacts in", outdir);
  process.exit(1);
}
if (n < 1) {
  console.error("no UNSTAMPED markers replaced in", outdir);
  process.exit(1);
}
const receipt = {
  ok: true,
  tip,
  files_stamped: n,
  outdir,
  correspondence: "UNVERIFIED_STRING_REWRITE_ONLY",
  note:
    "Tip string rewrite does not prove source-tree correspondence. " +
    "Re-hash files and compare to this receipt to detect post-stamp mutation. " +
    "Orphan/old UNSTAMPED bodies can still receive the current tip.",
  files,
};
writeFileSync(
  join(outdir, ".dc_artifact_tip_receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n"
);
console.log(JSON.stringify({ ok: true, tip, files_stamped: n, outdir, receipt_files: files.length }));
