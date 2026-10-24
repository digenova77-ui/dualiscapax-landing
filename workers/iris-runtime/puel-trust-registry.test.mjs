import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { puelCanonicalJson } from "./puel-signatures.mjs";
import { verifyPuelTrustRegistry } from "./puel-trust-registry.mjs";

const now = Date.parse("2026-10-24T15:00:00.000Z");
const root = generateKeyPairSync("ed25519");
const issuer = generateKeyPairSync("ed25519");
const rootPublic = root.publicKey.export({ type: "spki", format: "der" }).toString("base64");
const issuerPublic = issuer.publicKey.export({ type: "spki", format: "der" }).toString("base64");

function registry(overrides = {}) {
  return {
    contract: "dualis.puel.trust-registry.v1",
    version: 1,
    issued_at: "2026-10-24T14:00:00.000Z",
    expires_at: "2026-10-25T14:00:00.000Z",
    keys: [{
      key_id: "issuer-key-1",
      issuer_id: "issuer-1",
      algorithm: "Ed25519",
      roles: ["identity-attestation", "trinity-decision", "execution-receipt", "resource-measurement"],
      public_key_spki_base64: issuerPublic,
      not_before: "2026-10-24T14:00:00.000Z",
      not_after: "2026-10-25T14:00:00.000Z",
    }],
    revoked_key_ids: [],
    ...overrides,
  };
}

function signRegistry(value) {
  return {
    ...value,
    root_signature_base64: sign(null, Buffer.from(puelCanonicalJson(value)), root.privateKey).toString("base64"),
  };
}

test("verifies a root-signed registry and returns its key map", async () => {
  const result = await verifyPuelTrustRegistry({ registry: signRegistry(registry()), rootPublicKeySpkiBase64: rootPublic, now });
  assert.equal(result.valid, true);
  assert.equal(result.status, "ROOT_SIGNATURE_VERIFIED");
  assert.equal(result.trust_scope, "pinned-root-public-key");
  assert.equal(result.trusted_keys["issuer-key-1"].issuer_id, "issuer-1");
  assert.equal(result.trusted_keys["issuer-key-1"].revoked, false);
});

test("rejects a modified registry payload after root signing", async () => {
  const signed = signRegistry(registry());
  signed.version = 2;
  const result = await verifyPuelTrustRegistry({ registry: signed, rootPublicKeySpkiBase64: rootPublic, now });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("root-signature-invalid"));
});

test("rejects an expired registry and duplicate key identifiers", async () => {
  const expired = signRegistry(registry({ expires_at: "2026-10-24T14:59:00.000Z" }));
  assert.ok((await verifyPuelTrustRegistry({ registry: expired, rootPublicKeySpkiBase64: rootPublic, now })).errors.includes("registry-expired"));
  const duplicateKeys = registry();
  duplicateKeys.keys.push({ ...duplicateKeys.keys[0] });
  assert.ok((await verifyPuelTrustRegistry({ registry: signRegistry(duplicateKeys), rootPublicKeySpkiBase64: rootPublic, now })).errors.includes("duplicate-key-id"));
});

test("rejects a registry signed by a different root", async () => {
  const otherRoot = generateKeyPairSync("ed25519");
  const signed = {
    ...registry(),
    root_signature_base64: sign(null, Buffer.from(puelCanonicalJson(registry())), otherRoot.privateKey).toString("base64"),
  };
  const result = await verifyPuelTrustRegistry({ registry: signed, rootPublicKeySpkiBase64: rootPublic, now });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("root-signature-invalid"));
});

test("applies root-signed revocations to the resulting trusted key map", async () => {
  const result = await verifyPuelTrustRegistry({
    registry: signRegistry(registry({ revoked_key_ids: ["issuer-key-1"] })),
    rootPublicKeySpkiBase64: rootPublic,
    now,
  });
  assert.equal(result.valid, true);
  assert.equal(result.trusted_keys["issuer-key-1"].revoked, true);
});
