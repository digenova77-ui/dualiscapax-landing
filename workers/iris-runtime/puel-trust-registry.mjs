/**
 * PUEL root-signed trust registry v0.1.
 *
 * The root public key is a trust anchor supplied by the deployment/operator.
 * This code verifies a registry against that anchor; it does not decide how
 * the root key was established or protect it from replacement in deployment.
 */
import { puelCanonicalJson } from "./puel-signatures.mjs";

const KEY_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;
const ROLE_RE = /^[a-z][a-z0-9-]{0,63}$/;
const isRecord = (value) => !!value && typeof value === "object" && !Array.isArray(value);

function decodeBase64(value) {
  if (typeof value !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error("invalid-base64");
  }
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function unique(values) {
  return new Set(values).size === values.length;
}

export async function verifyPuelTrustRegistry({ registry, rootPublicKeySpkiBase64, now = Date.now() }) {
  const errors = [];
  if (!isRecord(registry)) return { valid: false, status: "TRUST_REGISTRY_REJECTED", errors: ["registry-must-be-object"] };
  const allowed = ["contract", "version", "issued_at", "expires_at", "keys", "revoked_key_ids", "root_signature_base64"];
  if (Object.keys(registry).some((key) => !allowed.includes(key))) errors.push("unknown-registry-field");
  if (registry.contract !== "dualis.puel.trust-registry.v1") errors.push("invalid-registry-contract");
  if (!Number.isSafeInteger(registry.version) || registry.version < 1) errors.push("invalid-registry-version");

  const issuedAt = typeof registry.issued_at === "string" ? Date.parse(registry.issued_at) : NaN;
  const expiresAt = typeof registry.expires_at === "string" ? Date.parse(registry.expires_at) : NaN;
  if (!Number.isFinite(issuedAt)) errors.push("invalid-issued-at");
  if (!Number.isFinite(expiresAt)) errors.push("invalid-expires-at");
  if (Number.isFinite(issuedAt) && issuedAt > now + 30000) errors.push("registry-from-future");
  if (Number.isFinite(expiresAt) && expiresAt <= now) errors.push("registry-expired");
  if (Number.isFinite(issuedAt) && Number.isFinite(expiresAt) && expiresAt <= issuedAt) errors.push("invalid-registry-validity-window");

  if (!Array.isArray(registry.keys) || registry.keys.length > 256) errors.push("invalid-registry-keys");
  if (!Array.isArray(registry.revoked_key_ids) || registry.revoked_key_ids.some((id) => !KEY_ID_RE.test(id || ""))) errors.push("invalid-revocation-list");

  const keys = Array.isArray(registry.keys) ? registry.keys : [];
  const keyIds = keys.map((key) => key?.key_id);
  if (!unique(keyIds)) errors.push("duplicate-key-id");
  const revoked = Array.isArray(registry.revoked_key_ids) ? registry.revoked_key_ids : [];
  if (!unique(revoked)) errors.push("duplicate-revocation");

  for (const [index, key] of keys.entries()) {
    if (!isRecord(key) || Object.keys(key).some((field) => !["key_id", "issuer_id", "algorithm", "roles", "public_key_spki_base64", "not_before", "not_after"].includes(field))) {
      errors.push("invalid-key-record-" + index);
      continue;
    }
    if (!KEY_ID_RE.test(key.key_id || "") || !KEY_ID_RE.test(key.issuer_id || "")) errors.push("invalid-key-identity-" + index);
    if (key.algorithm !== "Ed25519") errors.push("unsupported-key-algorithm-" + index);
    if (!Array.isArray(key.roles) || !key.roles.length || key.roles.some((role) => !ROLE_RE.test(role || "")) || !unique(key.roles)) errors.push("invalid-key-roles-" + index);
    try { decodeBase64(key.public_key_spki_base64); } catch { errors.push("invalid-public-key-" + index); }
    const notBefore = typeof key.not_before === "string" ? Date.parse(key.not_before) : NaN;
    const notAfter = typeof key.not_after === "string" ? Date.parse(key.not_after) : NaN;
    if (!Number.isFinite(notBefore) || !Number.isFinite(notAfter) || notAfter <= notBefore) errors.push("invalid-key-validity-" + index);
    if (Number.isFinite(issuedAt) && Number.isFinite(notBefore) && notBefore < issuedAt) errors.push("key-predates-registry-" + index);
    if (Number.isFinite(expiresAt) && Number.isFinite(notAfter) && notAfter > expiresAt) errors.push("key-outlives-registry-" + index);
  }

  if (errors.length) return { valid: false, status: "TRUST_REGISTRY_REJECTED", errors };

  const { root_signature_base64, ...signedPayload } = registry;
  try {
    const rootKey = await crypto.subtle.importKey(
      "spki",
      decodeBase64(rootPublicKeySpkiBase64),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const signature = decodeBase64(root_signature_base64);
    const valid = await crypto.subtle.verify(
      { name: "Ed25519" },
      rootKey,
      signature,
      new TextEncoder().encode(puelCanonicalJson(signedPayload)),
    );
    if (!valid) return { valid: false, status: "TRUST_REGISTRY_REJECTED", errors: ["root-signature-invalid"] };
  } catch {
    return { valid: false, status: "TRUST_REGISTRY_REJECTED", errors: ["root-signature-verification-error"] };
  }

  const trustedKeys = Object.fromEntries(keys.map((key) => [key.key_id, {
    issuer_id: key.issuer_id,
    algorithm: key.algorithm,
    roles: key.roles,
    public_key_spki_base64: key.public_key_spki_base64,
    not_before: key.not_before,
    not_after: key.not_after,
    revoked: revoked.includes(key.key_id),
  }]));

  return {
    valid: true,
    status: "ROOT_SIGNATURE_VERIFIED",
    registry_version: registry.version,
    expires_at: registry.expires_at,
    trust_scope: "pinned-root-public-key",
    trusted_keys: trustedKeys,
    revoked_key_ids: revoked,
  };
}
