/**
 * PUEL Ed25519 attestation verifier v0.1.
 *
 * Trust is supplied explicitly by the caller; this module does not invent a
 * root of trust or claim that an arbitrary caller-supplied registry is trusted.
 * Signatures cover a canonical statement that binds the digest of the evidence.
 */
const HASH_RE = /^[a-f0-9]{64}$/;
const KEY_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;
const ROLE_RE = /^[a-z][a-z0-9-]{0,63}$/;
const isRecord = (value) => !!value && typeof value === "object" && !Array.isArray(value);

function compareUnicodeScalars(a, b) {
  const left = Array.from(a, (character) => character.codePointAt(0));
  const right = Array.from(b, (character) => character.codePointAt(0));
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return left.length - right.length;
}

export function puelCanonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("non-canonical-number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(puelCanonicalJson).join(",") + "]";
  if (!isRecord(value)) throw new Error("non-canonical-value");
  const keys = Object.keys(value).sort(compareUnicodeScalars);
  return "{" + keys.map((key) => JSON.stringify(key) + ":" + puelCanonicalJson(value[key])).join(",") + "}";
}

function decodeBase64(value) {
  if (typeof value !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error("invalid-base64");
  }
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyPuelAttestation({ attestation, evidence, trustedKeys, now = Date.now(), maxAgeMs = 86400000 }) {
  const errors = [];
  if (!isRecord(attestation) || !isRecord(evidence) || !isRecord(trustedKeys)) {
    return { valid: false, status: "ATTESTATION_INVALID", errors: ["invalid-verifier-input"] };
  }

  const allowed = ["contract", "issuer_id", "key_id", "role", "signed_at", "payload_sha256", "signature_base64"];
  if (Object.keys(attestation).some((key) => !allowed.includes(key))) errors.push("unknown-attestation-field");
  if (attestation.contract !== "dualis.puel.attestation.v1") errors.push("invalid-attestation-contract");
  if (!KEY_ID_RE.test(attestation.issuer_id || "")) errors.push("invalid-issuer-id");
  if (!KEY_ID_RE.test(attestation.key_id || "")) errors.push("invalid-key-id");
  if (!ROLE_RE.test(attestation.role || "")) errors.push("invalid-role");
  if (!HASH_RE.test(attestation.payload_sha256 || "")) errors.push("invalid-payload-digest");

  const signedAt = typeof attestation.signed_at === "string" ? Date.parse(attestation.signed_at) : NaN;
  if (!Number.isFinite(signedAt)) errors.push("invalid-signed-at");
  else {
    if (signedAt > now + 30000) errors.push("attestation-from-future");
    if (now - signedAt > maxAgeMs) errors.push("attestation-stale");
  }

  let canonicalEvidence;
  try { canonicalEvidence = puelCanonicalJson(evidence); }
  catch { errors.push("evidence-not-canonicalizable"); }
  if (canonicalEvidence !== undefined) {
    const actualDigest = await sha256Hex(canonicalEvidence);
    if (actualDigest !== attestation.payload_sha256) errors.push("payload-digest-mismatch");
  }

  const key = trustedKeys[attestation.key_id];
  if (!isRecord(key)) errors.push("untrusted-key");
  else {
    if (key.issuer_id !== attestation.issuer_id) errors.push("issuer-key-mismatch");
    if (key.algorithm !== "Ed25519") errors.push("unsupported-key-algorithm");
    if (!Array.isArray(key.roles) || !key.roles.includes(attestation.role)) errors.push("key-not-authorized-for-role");
    if (typeof key.public_key_spki_base64 !== "string") errors.push("missing-public-key");
    if (key.revoked === true) errors.push("key-revoked");
    const notBefore = key.not_before ? Date.parse(key.not_before) : NaN;
    const notAfter = key.not_after ? Date.parse(key.not_after) : NaN;
    if (Number.isFinite(notBefore) && Number.isFinite(signedAt) && signedAt < notBefore) errors.push("key-not-yet-valid");
    if (Number.isFinite(notAfter) && Number.isFinite(signedAt) && signedAt > notAfter) errors.push("key-expired");
  }

  if (errors.length) return { valid: false, status: "ATTESTATION_INVALID", errors };

  const statement = {
    contract: attestation.contract,
    issuer_id: attestation.issuer_id,
    key_id: attestation.key_id,
    role: attestation.role,
    signed_at: attestation.signed_at,
    payload_sha256: attestation.payload_sha256,
  };
  try {
    const publicKey = await crypto.subtle.importKey(
      "spki",
      decodeBase64(key.public_key_spki_base64),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const signature = decodeBase64(attestation.signature_base64);
    const valid = await crypto.subtle.verify(
      { name: "Ed25519" },
      publicKey,
      signature,
      new TextEncoder().encode(puelCanonicalJson(statement)),
    );
    if (!valid) return { valid: false, status: "ATTESTATION_INVALID", errors: ["signature-verification-failed"] };
  } catch {
    return { valid: false, status: "ATTESTATION_INVALID", errors: ["signature-verification-error"] };
  }

  return {
    valid: true,
    status: "CRYPTOGRAPHICALLY_VERIFIED_ATTESTATION",
    issuer_id: attestation.issuer_id,
    key_id: attestation.key_id,
    role: attestation.role,
    payload_sha256: attestation.payload_sha256,
    trust_scope: "caller-supplied-key-registry",
  };
}
