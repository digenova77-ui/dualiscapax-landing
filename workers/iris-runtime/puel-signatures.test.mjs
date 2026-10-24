import test from "node:test";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { puelCanonicalJson, verifyPuelAttestation } from "./puel-signatures.mjs";

const now = Date.parse("2026-10-24T15:00:00.000Z");
const evidence = {
  contract: "dualis.receipt.v1",
  request_id: "request-puel-0001",
  unity_id: "unity_test_123",
  action: "compute.evaluate",
  input_sha256: "a".repeat(64),
  result_sha256: "b".repeat(64),
};
const pair = generateKeyPairSync("ed25519");
const publicKey = pair.publicKey.export({ type: "spki", format: "der" }).toString("base64");
const trustedKeys = {
  "key-issuer-1": {
    issuer_id: "issuer-test-1",
    algorithm: "Ed25519",
    roles: ["execution-receipt"],
    public_key_spki_base64: publicKey,
    revoked: false,
    not_before: "2026-01-01T00:00:00.000Z",
    not_after: "2027-01-01T00:00:00.000Z",
  },
};

async function makeAttestation(overrides = {}) {
  const signed_at = "2026-10-24T14:59:00.000Z";
  const base = {
    contract: "dualis.puel.attestation.v1",
    issuer_id: "issuer-test-1",
    key_id: "key-issuer-1",
    role: "execution-receipt",
    signed_at,
    payload_sha256: createHash("sha256").update(puelCanonicalJson(evidence)).digest("hex"),
    ...overrides,
  };
  const statement = {
    contract: base.contract,
    issuer_id: base.issuer_id,
    key_id: base.key_id,
    role: base.role,
    signed_at: base.signed_at,
    payload_sha256: base.payload_sha256,
  };
  return {
    ...base,
    signature_base64: sign(null, Buffer.from(puelCanonicalJson(statement)), pair.privateKey).toString("base64"),
  };
}

test("verifies a trusted Ed25519 attestation bound to the exact evidence digest", async () => {
  const result = await verifyPuelAttestation({ attestation: await makeAttestation(), evidence, trustedKeys, now });
  assert.equal(result.valid, true);
  assert.equal(result.status, "CRYPTOGRAPHICALLY_VERIFIED_ATTESTATION");
  assert.equal(result.trust_scope, "caller-supplied-key-registry");
});

test("rejects evidence altered after signing", async () => {
  const result = await verifyPuelAttestation({
    attestation: await makeAttestation(),
    evidence: { ...evidence, result_sha256: "c".repeat(64) },
    trustedKeys,
    now,
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("payload-digest-mismatch"));
});

test("rejects an untrusted key", async () => {
  const attestation = await makeAttestation({ key_id: "unknown-key" });
  const result = await verifyPuelAttestation({ attestation, evidence, trustedKeys, now });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("untrusted-key"));
});

test("rejects a key that is not authorized for the evidence role", async () => {
  const attestation = await makeAttestation({ role: "identity" });
  const result = await verifyPuelAttestation({ attestation, evidence, trustedKeys, now });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("key-not-authorized-for-role"));
});

test("rejects signatures changed after signing", async () => {
  const attestation = await makeAttestation();
  attestation.signature_base64 = Buffer.alloc(64, 0).toString("base64");
  const result = await verifyPuelAttestation({ attestation, evidence, trustedKeys, now });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("signature-verification-failed"));
});

test("rejects stale, future, and revoked-key attestations", async () => {
  const stale = await makeAttestation({ signed_at: "2026-10-20T00:00:00.000Z" });
  assert.ok((await verifyPuelAttestation({ attestation: stale, evidence, trustedKeys, now })).errors.includes("attestation-stale"));
  const future = await makeAttestation({ signed_at: "2026-10-24T16:00:00.000Z" });
  assert.ok((await verifyPuelAttestation({ attestation: future, evidence, trustedKeys, now })).errors.includes("attestation-from-future"));
  const revokedKeys = { ...trustedKeys, "key-issuer-1": { ...trustedKeys["key-issuer-1"], revoked: true } };
  assert.ok((await verifyPuelAttestation({ attestation: await makeAttestation(), evidence, trustedKeys: revokedKeys, now })).errors.includes("key-revoked"));
});

test("canonical JSON uses Unicode scalar ordering and rejects non-integer numbers", () => {
  assert.equal(puelCanonicalJson({ "\u{10000}": 1, "\uE000": 2 }), '{"\uE000":2,"\u{10000}":1}'.replace("\\u{10000}", "\u{10000}"));
  assert.throws(() => puelCanonicalJson({ measurement: 0.25 }), /non-canonical-number/);
});
