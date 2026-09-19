#!/usr/bin/env node
/**
 * Verify .dc_artifact_tip_receipt.json against outdir bytes.
 *
 * Distinguishes:
 *   INTEGRITY_OK_DERIVATION_UNVERIFIED — tip + file hashes match; no re-proven derivation
 *   VERIFIED_DERIVATION — integrity ok AND --expected-pre-stamp re-validates pre-stamp bodies
 *   FAIL — hash/tip mismatch, inconsistent pre_stamp, or require-derivation without proof
 *
 * Exit codes:
 *   0 — VERIFIED_DERIVATION (only when --expected-pre-stamp re-validates)
 *   3 — INTEGRITY_OK_DERIVATION_UNVERIFIED (honest story-without-reproven-derivation)
 *   1 — FAIL
 *
 * Usage:
 *   node factory/tools/verify_artifact_receipt.mjs <outdir>
 *     [--expected-pre-stamp m.json] [--require-derivation]
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

function parseArgs(argv) {
  const positional = [];
  const flags = { expectedPreStamp: null, requireDerivation: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--expected-pre-stamp") flags.expectedPreStamp = argv[++i];
    else if (a === "--require-derivation") flags.requireDerivation = true;
    else if (a.startsWith("--")) {
      console.error("unknown flag:", a);
      process.exit(2);
    } else positional.push(a);
  }
  return { positional, flags };
}

function sha256utf8(s) {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const outdir = positional[0];
if (!outdir) {
  console.error(
    "usage: verify_artifact_receipt.mjs <outdir> [--expected-pre-stamp m.json] [--require-derivation]"
  );
  process.exit(2);
}

if (flags.requireDerivation && !flags.expectedPreStamp) {
  console.error(
    JSON.stringify({
      ok: false,
      status: "FAIL",
      reason: "require_derivation_needs_expected_pre_stamp",
    })
  );
  process.exit(1);
}

const receiptPath = join(outdir, ".dc_artifact_tip_receipt.json");
if (!existsSync(receiptPath)) {
  console.error(JSON.stringify({ ok: false, status: "FAIL", reason: "missing_receipt" }));
  process.exit(1);
}

let receipt;
try {
  receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
} catch (e) {
  console.error(
    JSON.stringify({ ok: false, status: "FAIL", reason: "receipt_parse", error: String(e) })
  );
  process.exit(1);
}

const tip = receipt.tip;
if (!tip || !/^[0-9a-f]{40}$/i.test(tip)) {
  console.error(JSON.stringify({ ok: false, status: "FAIL", reason: "bad_tip" }));
  process.exit(1);
}

if (!Array.isArray(receipt.files) || receipt.files.length === 0) {
  console.error(JSON.stringify({ ok: false, status: "FAIL", reason: "no_files" }));
  process.exit(1);
}

const tipRe = /DC_ARTIFACT_TIP\s*=\s*"([0-9a-fA-F]{40}|UNSTAMPED)"/;
const UNSTAMPED = 'DC_ARTIFACT_TIP = "UNSTAMPED"';
const stamped = `DC_ARTIFACT_TIP = "${tip}"`;
const fileProblems = [];
const reconstructed = {};

for (const f of receipt.files) {
  const path = join(outdir, f.name);
  if (!existsSync(path)) {
    fileProblems.push({ name: f.name, reason: "missing_file" });
    continue;
  }
  const body = readFileSync(path, "utf8");
  const sha = sha256utf8(body);
  if (sha !== f.sha256) {
    fileProblems.push({
      name: f.name,
      reason: "sha256_mismatch",
      expected: f.sha256,
      actual: sha,
    });
  }
  const m = body.match(tipRe);
  if (!m || m[1].toLowerCase() !== tip.toLowerCase()) {
    fileProblems.push({
      name: f.name,
      reason: "tip_embed_mismatch",
      expected: tip,
      actual: m ? m[1] : null,
    });
  }
  // Reconstruct UNSTAMPED body and check pre_stamp consistency when claimed.
  const preBody = body.includes(stamped)
    ? body.split(stamped).join(UNSTAMPED)
    : body.includes(UNSTAMPED)
      ? body
      : null;
  if (preBody != null) {
    const preSha = sha256utf8(preBody);
    reconstructed[f.name] = preSha;
    if (f.pre_stamp_sha256 && f.pre_stamp_sha256.toLowerCase() !== preSha.toLowerCase()) {
      fileProblems.push({
        name: f.name,
        reason: "pre_stamp_inconsistent_with_body",
        receipt_pre: f.pre_stamp_sha256,
        reconstructed: preSha,
      });
    }
  }
}

if (fileProblems.length > 0) {
  console.error(
    JSON.stringify({ ok: false, status: "FAIL", reason: "integrity", fileProblems })
  );
  process.exit(1);
}

// External expected re-validation → only path to exit 0 VERIFIED_DERIVATION
if (flags.expectedPreStamp) {
  let expected = JSON.parse(readFileSync(flags.expectedPreStamp, "utf8"));
  if (expected && typeof expected === "object" && expected.files) expected = expected.files;
  const mismatches = [];
  for (const f of receipt.files) {
    const want = expected[f.name];
    const got = reconstructed[f.name];
    if (!want) {
      mismatches.push({ name: f.name, reason: "missing_from_expected_manifest" });
    } else if (!got || want.toLowerCase() !== got.toLowerCase()) {
      mismatches.push({
        name: f.name,
        reason: "pre_stamp_sha256_mismatch",
        expected: want,
        actual: got || null,
      });
    }
  }
  if (mismatches.length > 0) {
    console.error(
      JSON.stringify({
        ok: false,
        status: "FAIL",
        reason: "derivation_revalidation_failed",
        mismatches,
      })
    );
    process.exit(1);
  }
  console.log(
    JSON.stringify({
      ok: true,
      status: "VERIFIED_DERIVATION",
      tip,
      files: receipt.files.length,
      source_fingerprint: receipt.source_fingerprint || null,
      revalidated_with: flags.expectedPreStamp,
    })
  );
  process.exit(0);
}

// No external expected: cannot re-prove derivation (receipt claim alone is not enough).
if (flags.requireDerivation) {
  console.error(
    JSON.stringify({
      ok: false,
      status: "FAIL",
      reason: "require_derivation_without_expected",
    })
  );
  process.exit(1);
}

const claimed = receipt.derivation_state || "UNVERIFIED";
console.log(
  JSON.stringify({
    ok: true,
    status: "INTEGRITY_OK_DERIVATION_UNVERIFIED",
    tip,
    derivation_state_claimed: claimed,
    files: receipt.files.length,
    note:
      "Tip+receipt integrity ok. Derivation not re-proven. " +
      "Pass --expected-pre-stamp to obtain VERIFIED_DERIVATION (exit 0). " +
      "Receipt derivation_state alone is not demonstrable derivation.",
  })
);
process.exit(3);
