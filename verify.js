#!/usr/bin/env node
/**
 * Verify Trinity edge.
 * Law prevails. Fail-closed. Seal must match.
 * Usage: node verify.js [baseUrl]
 */

const BASE = process.argv[2] || "https://dualiscapax.ai";

async function get(path) {
  const res = await fetch(BASE + path, { headers: { accept: "application/json" } });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, headers: Object.fromEntries(res.headers), body };
}

function fail(msg) {
  console.error("FAIL:", msg);
  process.exitCode = 1;
}

async function main() {
  console.log("base:", BASE);

  const law = await get("/law");
  if (law.status !== 200) fail(`/law status ${law.status}`);
  if (law.body?.law !== "LAW WINS") fail("/law law !== LAW WINS");
  if (law.body?.principle !== "Capability does not confer authority.") fail("/law principle mismatch");
  if (law.body?.fail_closed !== true) fail("/law not fail_closed");
  if (law.body?.boundary !== "NOT_FOR_EMISSION") fail("/law boundary mismatch");
  console.log("PASS /law");

  const trinity = await get("/trinity");
  if (trinity.status !== 200) fail(`/trinity status ${trinity.status}`);
  if (trinity.body?.law !== "LAW WINS") fail("/trinity law mismatch");
  console.log("PASS /trinity");

  const seal = await get("/seal");
  if (seal.status !== 200) fail(`/seal status ${seal.status}`);
  if (seal.body?.status !== "PASS") fail(`/seal status ${seal.body?.status}`);
  if (seal.body?.match !== true) fail("/seal match false");
  if (seal.body?.unity_hash !== seal.body?.expected) fail("/seal hash mismatch");
  if (seal.body?.law !== "LAW WINS") fail("/seal law mismatch");
  if (seal.body?.fail_closed !== true) fail("/seal not fail_closed");
  console.log("PASS /seal");

  const unity = await get("/unity/status");
  if (unity.status !== 200) fail(`/unity/status status ${unity.status}`);
  if (unity.body?.status !== "PASS") fail(`/unity/status ${unity.body?.status}`);
  console.log("PASS /unity/status");

  if (!process.exitCode) console.log("All checks passed. Law prevails.");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
