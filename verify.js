#!/usr/bin/env node
/**
 * Verify Trinity edge.
 * Law prevails. Fail-closed. Seal must match hash and Ed25519 signature.
 * Usage: node verify.js [baseUrl]
 */

const BASE = process.argv[2] || "https://dualiscapax.ai";

async function get(path) {
  const res = await fetch(BASE + path, { headers: { accept: "application/json" } });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

let failures = 0;

function fail(msg) {
  failures += 1;
  console.error("FAIL:", msg);
  process.exitCode = 1;
}

async function main() {
  console.log("base:", BASE);

  const failuresBeforelaw = failures;
  const law = await get("/law");
  if (law.status !== 200) fail(`/law status ${law.status}`);
  if (law.body?.law !== "LAW WINS") fail("/law law !== LAW WINS");
  if (law.body?.principle !== "Capability does not confer authority.") fail("/law principle mismatch");
  if (law.body?.fail_closed !== true) fail("/law not fail_closed");
  if (law.body?.boundary !== "NOT_FOR_EMISSION") fail("/law boundary mismatch");
  if (failures === failuresBeforelaw) console.log("PASS /law");

  const failuresBeforetrinity = failures;
  const trinity = await get("/trinity");
  if (trinity.status !== 200) fail(`/trinity status ${trinity.status}`);
  if (trinity.body?.law !== "LAW WINS") fail("/trinity law mismatch");
  if (failures === failuresBeforetrinity) console.log("PASS /trinity");

  const failuresBeforeseal = failures;
  const seal = await get("/seal");
  if (seal.status !== 200) fail(`/seal status ${seal.status}`);
  if (seal.body?.status !== "PASS") fail(`/seal status ${seal.body?.status}`);
  if (seal.body?.match !== true) fail("/seal hash match false");
  if (seal.body?.unity_hash !== seal.body?.expected) fail("/seal hash mismatch");
  if (seal.body?.signature_valid !== true) fail("/seal signature_valid false");
  if (!seal.body?.signature || !seal.body?.public_key) fail("/seal missing signature or public_key");
  if (seal.body?.law !== "LAW WINS") fail("/seal law mismatch");
  if (seal.body?.fail_closed !== true) fail("/seal not fail_closed");
  if (failures === failuresBeforeseal) console.log("PASS /seal (hash + Ed25519)");

  const failuresBeforeunitystatus = failures;
  const unity = await get("/unity/status");
  if (unity.status !== 200) fail(`/unity/status status ${unity.status}`);
  if (unity.body?.status !== "PASS") fail(`/unity/status ${unity.body?.status}`);
  if (unity.body?.signature_valid !== true) fail("/unity/status signature_valid false");
  if (failures === failuresBeforeunitystatus) console.log("PASS /unity/status (hash + Ed25519)");

  if (failures === 0) console.log("All checks passed. Law prevails.");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
