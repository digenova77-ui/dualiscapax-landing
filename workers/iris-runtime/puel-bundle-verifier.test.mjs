import test from "node:test";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { puelCanonicalJson } from "./puel-signatures.mjs";
import { verifyPuelBundle } from "./puel-bundle-verifier.mjs";

const now = Date.parse("2026-10-24T15:00:00.000Z");
const pair = generateKeyPairSync("ed25519");
const publicKey = pair.publicKey.export({ type: "spki", format: "der" }).toString("base64");
const roles = ["identity-attestation", "trinity-decision", "execution-receipt", "resource-measurement"];
const trustedKeys = {
  "key-puel-test": {
    issuer_id: "issuer-puel-test",
    algorithm: "Ed25519",
    roles,
    public_key_spki_base64: publicKey,
    revoked: false,
    not_before: "2026-01-01T00:00:00.000Z",
    not_after: "2027-01-01T00:00:00.000Z",
  },
};
const hash = (char) => char.repeat(64);
const bundle = () => ({
  contract: "dualis.puel.evidence.v1",
  work_envelope: {
    contract: "dualis.work.v1",
    request_id: "request-puel-0001",
    input_sha256: hash("a"),
    unity_id: "unity_test_123",
    action: "compute.evaluate",
    module: "dclm.v1",
    policy_version: "trinity.v1",
    complexity: { class: "unknown", features: { input_items: 1 }, estimate_basis: "Uncalibrated workload descriptor" },
    resource_budget: { cpu_ms: 1000, memory_bytes: 1048576 },
    verification: { class: "deterministic-check", acceptance_criterion: "Output digest matches the persisted result." },
  },
  identity_evidence: {
    contract: "dualis.identity.attestation.v1", verified: true, unity_id: "unity_test_123",
    request_id: "request-puel-0001", input_sha256: hash("a"), evidence_ref: "identity-log:record-1",
  },
  trinity_decision: {
    contract: "dualis.trinity.decision.v1", decision: "allow", authorized: true,
    unity_id: "unity_test_123", request_id: "request-puel-0001", action: "compute.evaluate",
    input_sha256: hash("a"), policy_version: "trinity.v1", evidence_ref: "trinity-log:decision-1",
  },
  execution_receipt: {
    contract: "dualis.receipt.v1", unity_id: "unity_test_123", request_id: "request-puel-0001",
    action: "compute.evaluate", input_sha256: hash("a"), result_sha256: hash("b"),
    receipt_id: "receipt-1", receipt_sha256: hash("c"), evidence_ref: "receipt-store:receipt-1",
  },
  resource_measurements: [{
    contract: "dualis.resource-measurement.v1", request_id: "request-puel-0001",
    resource: "cpu-time", value: 12, unit: "ms", classification: "provider-reported",
    source_id: "worker-runtime", observed_at: "2026-10-24T14:59:00.000Z",
    evidence_ref: "sha256:" + hash("d"), uncertainty: 0,
  }],
});

async function attestationFor(role, evidence) {
  const signed_at = "2026-10-24T14:59:00.000Z";
  const payload_sha256 = createHash("sha256").update(puelCanonicalJson(evidence)).digest("hex");
  const statement = {
    contract: "dualis.puel.attestation.v1",
    issuer_id: "issuer-puel-test",
    key_id: "key-puel-test",
    role,
    signed_at,
    payload_sha256,
  };
  return {
    role,
    evidence,
    attestation: {
      ...statement,
      signature_base64: sign(null, Buffer.from(puelCanonicalJson(statement)), pair.privateKey).toString("base64"),
    },
  };
}

async function attestBundle(value) {
  return Promise.all([
    attestationFor("identity-attestation", value.identity_evidence),
    attestationFor("trinity-decision", value.trinity_decision),
    attestationFor("execution-receipt", value.execution_receipt),
    ...value.resource_measurements.map((measurement) => attestationFor("resource-measurement", measurement)),
  ]);
}

test("verifies all required PUEL evidence roles cryptographically", async () => {
  const value = bundle();
  const result = await verifyPuelBundle({ bundle: value, attestations: await attestBundle(value), trustedKeys, now });
  assert.equal(result.valid, true);
  assert.equal(result.status, "SIGNED_EVIDENCE_VERIFIED");
  assert.equal(result.verified_roles.length, 4);
  assert.equal(result.trust_scope, "caller-supplied-key-registry");
});

test("rejects a bundle when one evidence role is unsigned", async () => {
  const value = bundle();
  const attestations = await attestBundle(value);
  attestations.splice(1, 1);
  const result = await verifyPuelBundle({ bundle: value, attestations, trustedKeys, now });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("missing-signed-evidence-trinity-decision"));
});

test("rejects an attestation whose evidence does not match the bundle", async () => {
  const value = bundle();
  const attestations = await attestBundle(value);
  attestations[2].evidence = { ...attestations[2].evidence, result_sha256: hash("e") };
  const result = await verifyPuelBundle({ bundle: value, attestations, trustedKeys, now });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("missing-signed-evidence-execution-receipt"));
});

test("rejects duplicate or extra attestations rather than ignoring them", async () => {
  const value = bundle();
  const attestations = await attestBundle(value);
  attestations.push(attestations[0]);
  const result = await verifyPuelBundle({ bundle: value, attestations, trustedKeys, now });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("unexpected-or-duplicate-attestation"));
});
