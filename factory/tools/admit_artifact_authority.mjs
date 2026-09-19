#!/usr/bin/env node
/**
 * Authority-bearing admit gate for stamped Worker packages.
 *
 * SOLE consumer that may treat tip/receipt/provenance as authority-relevant.
 * Integrity-only paths (stamp without --require-derivation, verify exit 3)
 * are NOT authority-bearing and MUST NOT call this tool's success as proof.
 *
 * Mandates:
 *   - --expected-pre-stamp (derivation revalidation)
 *   - verify_artifact_receipt exit 0 (VERIFIED_DERIVATION)
 *   - semantic authority fingerprint FAIL CLOSED on evil-twin guts
 *
 * Usage:
 *   node factory/tools/admit_artifact_authority.mjs <outdir>
 *     --expected-pre-stamp <manifest.json>
 *     [--semantic-profile auto|depth|iris|gate|stripe|origin-join|none]
 *
 * Exit:
 *   0 — DERIVATION_AND_SEMANTIC_GATE_OK (still NOT live deploy / NOT Iris AUTHORIZED)
 *   1 — refuse (UNVERIFIED cannot cross; semantic gut; verify fail)
 *   2 — usage
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const positional = [];
  const flags = { expectedPreStamp: null, semanticProfile: "auto" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--expected-pre-stamp") flags.expectedPreStamp = argv[++i];
    else if (a === "--semantic-profile") flags.semanticProfile = argv[++i] || "auto";
    else if (a.startsWith("--")) {
      console.error("unknown flag:", a);
      process.exit(2);
    } else positional.push(a);
  }
  return { positional, flags };
}

function refuse(reason, extra = {}) {
  console.error(JSON.stringify({ ok: false, status: "AUTHORITY_REFUSED", reason, ...extra }));
  process.exit(1);
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const outdir = positional[0];
if (!outdir || !flags.expectedPreStamp) {
  console.error(
    "usage: admit_artifact_authority.mjs <outdir> --expected-pre-stamp m.json [--semantic-profile auto|...]"
  );
  console.error(
    "note: --require-derivation is mandatory for authority admit (implied; omit flag = refuse)"
  );
  process.exit(2);
}

const here = dirname(fileURLToPath(import.meta.url));
const verifyTool = join(here, "verify_artifact_receipt.mjs");
if (!existsSync(verifyTool)) {
  refuse("missing_verify_tool", { path: verifyTool });
}

// Mandate derivation: always invoke verify with expected + require-derivation.
const v = spawnSync(
  process.execPath,
  [
    verifyTool,
    outdir,
    "--expected-pre-stamp",
    flags.expectedPreStamp,
    "--require-derivation",
  ],
  { encoding: "utf8" }
);
if (v.status !== 0) {
  refuse("derivation_not_verified", {
    verify_exit: v.status,
    verify_stdout: (v.stdout || "").trim().slice(0, 2000),
    verify_stderr: (v.stderr || "").trim().slice(0, 2000),
    note: "UNVERIFIED tip+receipt story cannot cross authority admit boundary",
  });
}

let verifyOut;
try {
  verifyOut = JSON.parse((v.stdout || "").trim().split("\n").pop());
} catch {
  refuse("verify_output_unparseable", { stdout: v.stdout });
}
if (!verifyOut || verifyOut.status !== "VERIFIED_DERIVATION") {
  refuse("verify_status_not_verified_derivation", { verifyOut });
}

// --- Semantic authority fingerprint (byte provenance ≠ semantic integrity) ---
const elevatingAuthorityEffect =
  /authority_effect\s*:\s*["'](AUTHORIZED|GRANTED|SETTLED|CONVERGED|ADMITTED)["']/;
const elevatingOperational =
  /operational_authority\s*:\s*["'](AUTHORIZED|OPERATIONAL|READY|DEPLOYABLE)["']/;
const identityDemoteForbidden =
  /demoteForbiddenLabels\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*[A-Za-z_$][\w$]*\s*[,;)]/;
const identityDemoteForbiddenFn =
  /function\s+demoteForbiddenLabels\s*\([^)]*\)\s*\{\s*return\s+[A-Za-z_$][\w$]*\s*;?\s*\}/;
const identityDemoteEntitlement =
  /demoteEntitlementRecord\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*[A-Za-z_$][\w$]*\s*[,;)]/;
const claimOnlyToValidated =
  /(?:tier|claim_authority|tier_claim_authority|governance_claim_authority)\s*:\s*["']VALIDATED["']/;
const unknownToAgreeHardcode =
  /independent_replay\s*[:=]\s*["']AGREE["']|Twain[\s\S]{0,80}["']AGREE["']\s*[;,]|return\s+["']AGREE["']\s*;\s*\/\/\s*stub/i;

const semanticProblems = [];
const jsFiles = [];
for (const name of readdirSync(outdir)) {
  if (!name.endsWith(".js") || name.endsWith(".map")) continue;
  const path = join(outdir, name);
  if (!statSync(path).isFile()) continue;
  const body = readFileSync(path, "utf8");
  jsFiles.push({ name, body });

  if (identityDemoteForbidden.test(body) || identityDemoteForbiddenFn.test(body)) {
    semanticProblems.push({
      name,
      reason: "identity_demoteForbiddenLabels",
      note: "DEMOTE gutted to identity — marker name may remain",
    });
  }
  if (identityDemoteEntitlement.test(body)) {
    semanticProblems.push({
      name,
      reason: "identity_demoteEntitlementRecord",
    });
  }
  {
    const re = new RegExp(elevatingAuthorityEffect.source, "g");
    let m;
    while ((m = re.exec(body))) {
      // Bare banned-list literals are "AUTHORIZED" without authority_effect key.
      // Object field authority_effect: "AUTHORIZED" is elevating semantic gut.
      semanticProblems.push({
        name,
        reason: "elevating_authority_effect",
        match: m[0],
        note: "NONE→AUTHORIZED (or peer) semantic gut",
      });
    }
  }
  if (elevatingOperational.test(body)) {
    semanticProblems.push({
      name,
      reason: "elevating_operational_authority",
      note: "parked/NONE operational gut",
    });
  }
  if (claimOnlyToValidated.test(body)) {
    semanticProblems.push({
      name,
      reason: "claim_only_to_validated",
      note: "CLAIM_ONLY→VALIDATED semantic gut",
    });
  }
  if (unknownToAgreeHardcode.test(body)) {
    semanticProblems.push({
      name,
      reason: "unknown_to_agree_hardcode",
      note: "UNKNOWN→AGREE semantic gut",
    });
  }

  // If demoteForbiddenLabels is present by name, require banned AUTHORIZED+VALIDATED literals
  // (catches DEMOTE→PROMOTE style gut that removes ban list while keeping call sites).
  if (body.includes("demoteForbiddenLabels")) {
    for (const need of ["AUTHORIZED", "VALIDATED", "CONVERGED"]) {
      if (!body.includes(`"${need}"`) && !body.includes(`'${need}'`)) {
        semanticProblems.push({
          name,
          reason: "demote_ban_list_missing",
          missing: need,
          note: "superficial demote marker without ban semantics",
        });
      }
    }
  }
}

if (jsFiles.length === 0) {
  refuse("no_js_artifacts");
}

const profile = flags.semanticProfile || "auto";
function detectProfile(bodies) {
  const t = bodies.join("\n");
  if (t.includes("PARKED_UNTIL_BIND_CONTINUE") || t.includes("demoteEntitlementRecord"))
    return "stripe";
  if (t.includes("DCLM_L0_NOT_EXECUTED") || t.includes("governance_claim_authority"))
    return "iris";
  if (t.includes("PAYLOAD_HASH_COLLISION") || t.includes("kyc_written")) return "gate";
  if (t.includes("x-dc-join") || t.includes("not on the join plate")) return "origin-join";
  if (t.includes("demoteForbiddenLabels") || t.includes("TEAMSNAP_REDIRECT_ALLOWLIST"))
    return "depth";
  return "none";
}
const bodies = jsFiles.map((f) => f.body);
const resolved = profile === "auto" ? detectProfile(bodies) : profile;

if (resolved === "stripe") {
  const t = bodies.join("\n");
  if (!t.includes("PARKED_UNTIL_BIND_CONTINUE")) {
    semanticProblems.push({ reason: "stripe_missing_parked", profile: resolved });
  }
  if (!/operational_authority\s*:\s*["']NONE["']/.test(t)) {
    semanticProblems.push({ reason: "stripe_missing_operational_none", profile: resolved });
  }
  if (!t.includes("CLAIM_ONLY")) {
    semanticProblems.push({ reason: "stripe_missing_claim_only", profile: resolved });
  }
}
if (resolved === "depth") {
  const t = bodies.join("\n");
  if (!t.includes("demoteForbiddenLabels")) {
    semanticProblems.push({ reason: "depth_missing_demote", profile: resolved });
  }
}
if (resolved === "iris") {
  const t = bodies.join("\n");
  if (t.includes("DCLM_L0_CONVERGED") && !t.includes("DCLM_L0_NOT_EXECUTED")) {
    semanticProblems.push({ reason: "iris_fake_converged", profile: resolved });
  }
  if (!t.includes("CLAIM_ONLY")) {
    semanticProblems.push({ reason: "iris_missing_claim_only", profile: resolved });
  }
}

if (semanticProblems.length > 0) {
  refuse("semantic_authority_gut", {
    profile: resolved,
    semanticProblems,
    note:
      "Byte tip+receipt+derivation ok is insufficient when authority semantics are gutted. " +
      "Evil twin FAIL CLOSED at admit semantic boundary.",
  });
}

console.log(
  JSON.stringify({
    ok: true,
    status: "DERIVATION_AND_SEMANTIC_GATE_OK",
    tip: verifyOut.tip,
    profile: resolved,
    files: jsFiles.map((f) => f.name),
    note:
      "Provenance derivation revalidated AND semantic authority fingerprint passed. " +
      "This is NOT live Cloudflare deploy authority, NOT Iris AUTHORIZED, NOT Twain AGREE, " +
      "NOT DCLM CONVERGED. Live binds/secrets remain NOT_VERIFIED.",
  })
);
process.exit(0);
