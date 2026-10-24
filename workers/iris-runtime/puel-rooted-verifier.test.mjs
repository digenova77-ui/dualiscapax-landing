import test from "node:test";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { puelCanonicalJson } from "./puel-signatures.mjs";
import { verifyRootedPuelBundle } from "./puel-rooted-verifier.mjs";

const now = Date.parse("2026-10-24T15:00:00.000Z");
const root = generateKeyPairSync("ed25519");
const issuer = generateKeyPairSync("ed25519");
const rootPublic = root.publicKey.export({ type: "spki", format: "der" }).toString("base64");
const issuerPublic = issuer.publicKey.export({ type: "spki", format: "der" }).toString("base64");
const hash = (char) => char.repeat(64);
const roles = ["identity-attestation", "trinity-decision", "execution-receipt", "resource-measurement"];

const registryPayload = (version = 2) => ({
  contract: "dualis.puel.trust-registry.v1",
  version,
  issued_at: "2026-10-24T14:00:00.000Z",
  expires_at: "2026-10-25T14:00:00.000Z",
  keys: [{
    key_id: "issuer-key-1", issuer_id: "issuer-1", algorithm: "Ed25519",
    roles, public_key_spki_base64: issuerPublic,
    not_before: "2026-10-24T14:00:00.000Z", not_after: "2026-10-25T14:00:00.000Z",
  }],
  revoked_key_ids: [],
});
const registry = (version = 2) => {
  const payload = registryPayload(version);
  return { ...payload, root_signature_base64: sign(null, Buffer.from(puelCanonicalJson(payload)), root.privateKey).toString("base64") };
};

const bundle = () => ({
  contract: "dualis.puel.evidence.v1",
  work_envelope: {
    contract: "dualis.work.v1", request_id: "request-puel-0001", input_sha256: hash("a"),
    unity_id: "unity_test_123", action: "compute.evaluate", module: "dclm.v1", policy_version: "trinity.v1",
    complexity: { class: "unknown", features: { input_items: 1 }, estimate_basis: "Uncalibrated workload descriptor" },
    resource_budget: { cpu_ms: 1000, memory_bytes: 1048576 },
    verification: { class: "deterministic-check", acceptance_criterion: "Output digest matches the persisted result." },
  },
  identity_evidence: {
    contract: "dualis.identity.attestation.v1", verified: true, unity_id: "unity_test_123",
    request_id: "request-puel-0001", input_sha256: hash("a"), evidence_ref: "identity:1",
  },
  trinity_decision: {
    contract: "dualis.trinity.decision.v1", decision: "allow", authorized: true,
    unity_id: "unity_test_123", request_id: "request-puel-0001", action: "compute.evaluate",
    input_sha256: hash("a"), policy_version: "trinity.v1", evidence_ref: "trinity:1",
  },
  execution_receipt: {
    contract: "dualis.receipt.v1", unity_id: "unity_test_123", request_id: "request-puel-0001",
    action: "compute.evaluate", input_sha256: hash("a"), result_sha256: hash("b"),
    receipt_id: "receipt-1", receipt_sha256: hash("c"), evidence_ref: "receipt:1",
  },
  resource_measurements: [{
    contract: "dualis.resource-measurement.v1", request_id: "request-puel-0001", resource: "cpu-time",
    value: 12, unit: "ms", classification: "provider-reported", source_id: "worker-runtime",
    observed_at: "2026-10-24T14:59:00.000Z", evidence_ref: "sha256:" + hash("d"), uncertainty: 0,
  }],
});

async function attest(role, evidence) {
  const signed_at = "2026-10-24T14:59:00.000Z";
  const payload_sha256 = createHash("sha256").update(puelCanonicalJson(evidence)).digest("hex");
  const statement = { contract: "dualis.puel.attestation.v1", issuer_id: "issuer-1", key_id: "issuer-key-1", role, signed_at, payload_sha256 };
  return {
    role, evidence,
    attestation: { ...statement, signature_base64: sign(null, Buffer.from(puelCanonicalJson(statement)), issuer.privateKey).toString("base64") },
  };
}

async function attestAll(value) {
  return Promise.all([
    attest("identity-attestation", value.identity_evidence),
    attest("trinity-decision", value.trinity_decision),
    attest("execution-receipt", value.execution_receipt),
    ...value.resource_measurements.map((measurement) => attest("resource-measurement", measurement)),
  ]);
}

test("verifies the bundle through the root-signed registry entry point", async () => {
  const value = bundle();
  const result = await verifyRootedPuelBundle({
    bundle: value, attestations: await attestAll(value), registry: registry(), rootPublicKeySpkiBase64: rootPublic, now,
  });
  assert.equal(result.valid, true);
  assert.equal(result.status, "ROOTED_PUEL_EVIDENCE_VERIFIED");
  assert.equal(result.trust_registry.registry_version, 2);
});

test("rejects registry versions below the configured minimum", async () => {
  const value = bundle();
  const result = await verifyRootedPuelBundle({
    bundle: value, attestations: await attestAll(value), registry: registry(1),
    rootPublicKeySpkiBase64: rootPublic, now, minimumRegistryVersion: 2,
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("trust-registry-version-rollback"));
});

test("rejects issuer evidence when the root-signed registry revokes its key", async () => {
  const value = bundle();
  const payload = { ...registryPayload(2), revoked_key_ids: ["issuer-key-1"] };
  const signedRegistry = { ...payload, root_signature_base64: sign(null, Buffer.from(puelCanonicalJson(payload)), root.privateKey).toString("base64") };
  const result = await verifyRootedPuelBundle({
    bundle: value, attestations: await attestAll(value), registry: signedRegistry, rootPublicKeySpkiBase64: rootPublic, now,
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.endsWith("key-revoked")));
});

test("rejects a registry signed by an unpinned root", async () => {
  const value = bundle();
  const otherRoot = generateKeyPairSync("ed25519");
  const payload = registryPayload(2);
  const badRegistry = { ...payload, root_signature_base64: sign(null, Buffer.from(puelCanonicalJson(payload)), otherRoot.privateKey).toString("base64") };
  const result = await verifyRootedPuelBundle({
    bundle: value, attestations: await attestAll(value), registry: badRegistry, rootPublicKeySpkiBase64: rootPublic, now,
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("trust-root-signature-invalid"));
});
