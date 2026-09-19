#!/usr/bin/env node
/**
 * Stamp DC_ARTIFACT_TIP in a wrangler --outdir package with the git tip SHA.
 * Source trees stay UNSTAMPED. Deploy of an UNSTAMPED body is unauthorized.
 *
 * Usage: node factory/tools/stamp_artifact_tip.mjs <outdir> [tipSha]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

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
let n = 0;
for (const name of readdirSync(outdir)) {
  if (!name.endsWith(".js") || name.endsWith(".map")) continue;
  const path = join(outdir, name);
  if (!statSync(path).isFile()) continue;
  let body = readFileSync(path, "utf8");
  if (!body.includes(UNSTAMPED) && !body.includes(`DC_ARTIFACT_TIP = "${tip}"`)) {
    console.error("missing DC_ARTIFACT_TIP in", path);
    process.exit(1);
  }
  if (body.includes(UNSTAMPED)) {
    body = body.split(UNSTAMPED).join(stamped);
    writeFileSync(path, body);
    n += 1;
  }
}
if (n < 1) {
  console.error("no UNSTAMPED markers replaced in", outdir);
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, tip, files_stamped: n, outdir }));
