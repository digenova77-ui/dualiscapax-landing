#!/usr/bin/env node
/**
 * Stamp DC_ARTIFACT_TIP in a wrangler --outdir package with the git tip SHA.
 * Source trees stay UNSTAMPED. Deploy of an UNSTAMPED body is unauthorized.
 *
 * PROVENANCE DISTINCTION (egg 2026-09-19):
 * - Tip string + matching receipt file hashes = integrity story only.
 * - That story does NOT prove the outdir was derived from tip sources.
 * - derivation_state is UNVERIFIED unless --expected-pre-stamp matches
 *   pre-stamp package body hashes (and optionally --source-inputs fingerprint).
 * - --require-derivation FAIL CLOSED when expected binding is missing/mismatched.
 * - VERIFIED_DERIVATION on the receipt is a stamp-time claim; re-prove with
 *   verify_artifact_receipt.mjs --expected-pre-stamp (exit 0 only then).
 *
 * Usage:
 *   node factory/tools/stamp_artifact_tip.mjs <outdir> [tipSha] [flags]
 * Flags:
 *   --expected-pre-stamp <manifest.json>  { "worker.js": "<sha256 of UNSTAMPED body>" }
 *   --source-inputs <path,path,...>       tip-tree source files to fingerprint
 *   --require-derivation                  refuse unless expected match
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

function parseArgs(argv) {
  const positional = [];
  const flags = {
    expectedPreStamp: null,
    sourceInputs: null,
    requireDerivation: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--expected-pre-stamp") {
      flags.expectedPreStamp = argv[++i];
    } else if (a === "--source-inputs") {
      flags.sourceInputs = argv[++i];
    } else if (a === "--require-derivation") {
      flags.requireDerivation = true;
    } else if (a.startsWith("--")) {
      console.error("unknown flag:", a);
      process.exit(2);
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

function sha256utf8(s) {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function sha256bytes(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function fingerprintSources(csv, repoRoot) {
  if (!csv) return null;
  const paths = csv
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .sort();
  if (paths.length === 0) return null;
  const parts = [];
  for (const rel of paths) {
    const abs = resolve(repoRoot, rel);
    if (!existsSync(abs)) {
      console.error("source input missing:", rel);
      process.exit(1);
    }
    const body = readFileSync(abs);
    parts.push(`${rel}\0${sha256bytes(body)}\n`);
  }
  return {
    algorithm: "sha256-path-nul-content-lf",
    paths,
    sha256: sha256utf8(parts.join("")),
  };
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const outdir = positional[0];
if (!outdir) {
  console.error(
    "usage: stamp_artifact_tip.mjs <outdir> [tipSha] [--expected-pre-stamp m.json] [--source-inputs a,b] [--require-derivation]"
  );
  process.exit(2);
}
const tip =
  (positional[1] && /^[0-9a-f]{40}$/i.test(positional[1]) ? positional[1] : null) ||
  execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
if (!/^[0-9a-f]{40}$/i.test(tip)) {
  console.error("refusing non-SHA tip:", tip);
  process.exit(2);
}

const repoRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
const sourceFingerprint = fingerprintSources(flags.sourceInputs, repoRoot);

let expected = null;
if (flags.expectedPreStamp) {
  expected = JSON.parse(readFileSync(flags.expectedPreStamp, "utf8"));
  if (expected && typeof expected === "object" && expected.files) {
    expected = expected.files;
  }
}

if (flags.requireDerivation && !expected) {
  console.error(
    "refuse: --require-derivation needs --expected-pre-stamp (cannot fake VERIFIED_DERIVATION)"
  );
  process.exit(1);
}

const UNSTAMPED = 'DC_ARTIFACT_TIP = "UNSTAMPED"';
const stamped = `DC_ARTIFACT_TIP = "${tip}"`;
const tipRe = /DC_ARTIFACT_TIP\s*=\s*"([0-9a-fA-F]{40}|UNSTAMPED)"/;
let n = 0;
const files = [];
const mismatches = [];
const expectedBound = {};

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

  const preStampBody = body.includes(UNSTAMPED)
    ? body
    : body.split(`DC_ARTIFACT_TIP = "${tip}"`).join(UNSTAMPED);
  const preStampSha256 = sha256utf8(preStampBody);

  if (expected) {
    const want = expected[name];
    if (!want) {
      mismatches.push({ name, reason: "missing_from_expected_manifest" });
    } else if (want.toLowerCase() !== preStampSha256.toLowerCase()) {
      mismatches.push({
        name,
        reason: "pre_stamp_sha256_mismatch",
        expected: want,
        actual: preStampSha256,
      });
    } else {
      expectedBound[name] = want.toLowerCase();
    }
  }

  if (body.includes(UNSTAMPED)) {
    body = body.split(UNSTAMPED).join(stamped);
    writeFileSync(path, body);
    n += 1;
  }
  const sha256 = sha256utf8(body);
  files.push({
    name,
    sha256,
    pre_stamp_sha256: preStampSha256,
    tip_embedded: tip,
  });
}

if (n < 1 && files.length === 0) {
  console.error("no JS artifacts in", outdir);
  process.exit(1);
}
if (n < 1) {
  console.error("no UNSTAMPED markers replaced in", outdir);
  process.exit(1);
}

if (mismatches.length > 0) {
  if (flags.requireDerivation) {
    console.error(
      "refuse: derivation mismatch (--require-derivation FAIL CLOSED):",
      JSON.stringify(mismatches)
    );
    process.exit(1);
  }
}

let derivationState = "UNVERIFIED";
if (expected && mismatches.length === 0 && files.length > 0) {
  derivationState = "VERIFIED_DERIVATION";
}

if (flags.requireDerivation && derivationState !== "VERIFIED_DERIVATION") {
  console.error("refuse: --require-derivation but derivation_state is not VERIFIED_DERIVATION");
  process.exit(1);
}

const receipt = {
  ok: true,
  tip,
  files_stamped: n,
  outdir,
  correspondence: "UNVERIFIED_STRING_REWRITE_ONLY",
  derivation_state: derivationState,
  source_fingerprint: sourceFingerprint,
  expected_pre_stamp_bound: Boolean(expected) && mismatches.length === 0,
  expected_pre_stamp: expected && mismatches.length === 0 ? expectedBound : null,
  derivation_mismatches: mismatches,
  note:
    "Tip string + receipt file hashes prove post-stamp integrity only. " +
    "derivation_state=VERIFIED_DERIVATION is a stamp-time claim when --expected-pre-stamp matched. " +
    "Re-prove with verify_artifact_receipt.mjs --expected-pre-stamp (exit 0 only). " +
    "Orphan/old UNSTAMPED bodies stamp as UNVERIFIED. " +
    "--require-derivation refuses story-without-derivation.",
  files,
};

writeFileSync(
  join(outdir, ".dc_artifact_tip_receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n"
);
console.log(
  JSON.stringify({
    ok: true,
    tip,
    files_stamped: n,
    outdir,
    receipt_files: files.length,
    derivation_state: derivationState,
  })
);
