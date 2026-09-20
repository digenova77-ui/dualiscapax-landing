#!/usr/bin/env node
/**
 * Dual-control deploy gate — TipSeal + David YES (tip_sha).
 * Does NOT call Cloudflare. Exit 0 only when warrants present.
 * Env: DAVID_YES_TIP_SHA must equal TipSeal.tip_sha
 * Args: --tipseal <path> [--expect-worker dualis-gate]
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
const tipsealPath = flag("--tipseal");
const expectWorker = flag("--expect-worker") || "dualis-gate";
if (!tipsealPath) {
  console.error("FAIL_CLOSED: --tipseal required");
  process.exit(2);
}
let seal;
try {
  seal = JSON.parse(readFileSync(tipsealPath, "utf8"));
} catch (e) {
  console.error("FAIL_CLOSED: TipSeal unreadable", e.message);
  process.exit(2);
}
if (seal.schema !== "TipSeal/v1") {
  console.error("FAIL_CLOSED: bad schema", seal.schema);
  process.exit(2);
}
if (!/^[0-9a-f]{40}$/.test(seal.tip_sha || "")) {
  console.error("FAIL_CLOSED: tip_sha not 40-hex");
  process.exit(2);
}
if (!/^[0-9a-f]{64}$/.test(seal.content_sha256 || "")) {
  console.error("FAIL_CLOSED: content_sha256 not 64-hex");
  process.exit(2);
}
if (seal.worker !== expectWorker) {
  console.error("FAIL_CLOSED: worker mismatch", seal.worker, "!=", expectWorker);
  process.exit(2);
}
const david = (process.env.DAVID_YES_TIP_SHA || "").trim();
if (!david) {
  console.error("FAIL_CLOSED: DAVID_YES_TIP_SHA missing (Warrant-B)");
  process.exit(3);
}
if (david !== seal.tip_sha) {
  console.error("FAIL_CLOSED: DAVID_YES_TIP_SHA != TipSeal.tip_sha");
  process.exit(3);
}
console.log(JSON.stringify({ ok: true, tip_sha: seal.tip_sha, content_sha256: seal.content_sha256, worker: seal.worker }, null, 2));
