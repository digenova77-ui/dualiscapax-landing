import {
  getIrisRuntimeConfig,
  PRODUCTION_IRIS_CONFIG,
  resolveIrisRuntime,
} from "../shared/iris-staging-config.mjs";

const AI_WORLD_PATH = "/holographic-core/v2/";
const DISCOVERABLE_SUBJECT = "__DISCOVERABLE_PASSKEY__";
const HANDOFF_TTL_SECONDS = 30;
const HANDOFF_PROOF_VERSION = 2;
const HANDOFF_ACTION = "OPEN_PROTECTED_WORLD";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const CHALLENGE_TTL_MS = 2 * 60 * 1000;
const RATE_WINDOW_MS = 5 * 60 * 1000;
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, private",
  pragma: "no-cache",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...HEADERS, ...extraHeaders },
  });
}

function denied() {
  return json({ ok: false, status: "NOT_GRANTED", code: "NOT_GRANTED" }, 403);
}

function unavailable() {
  return json({ ok: false, status: "NOT_GRANTED", code: "AUTHENTICATION_UNAVAILABLE" }, 503);
}

function isOrigin(request, allowedOrigin, allowedHost) {
  const url = new URL(request.url);
  return url.protocol === "https:" &&
    url.hostname.toLowerCase() === allowedHost &&
    request.headers.get("Origin") === allowedOrigin;
}

function isExpectedFetchSite(request, expected) {
  const value = request.headers.get("Sec-Fetch-Site");
  return value === null || value === expected;
}

function configured(env) {
  return Boolean(
    env &&
    env.IDENTITY_DB &&
    typeof env.IDENTITY_DB.prepare === "function" &&
    typeof env.IDENTITY_HANDOFF_SECRET === "string" &&
    encoder.encode(env.IDENTITY_HANDOFF_SECRET).length >= 32
  );
}

async function handoffProofStoreReady(db) {
  if (!db || typeof db.prepare !== "function") return false;
  try {
    const row = await first(
      db,
      "SELECT version FROM identity_handoff_contract_version WHERE version = ?1",
      HANDOFF_PROOF_VERSION,
    );
    return Number(row?.version) === HANDOFF_PROOF_VERSION;
  } catch {
    return false;
  }
}

function b64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("bad base64url");
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(bytes) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

async function sha256Hex(bytes) {
  return hex(await sha256(bytes));
}

async function verifiedAssertionDigest({ credentialId, clientDataRaw, authData, signature }) {
  const components = {
    credentialId: await sha256Hex(encoder.encode(credentialId)),
    clientData: await sha256Hex(clientDataRaw),
    authenticatorData: await sha256Hex(authData),
    signature: await sha256Hex(signature),
  };
  return sha256Hex(encoder.encode(JSON.stringify(components)));
}

function randomBytes(length = 32) {
  return crypto.getRandomValues(new Uint8Array(length));
}

async function readBody(request, maxBytes = 32768) {
  const length = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(length) && length > maxBytes) throw new Error("body too large");
  if (!request.body) throw new Error("empty body");
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("body too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const text = decoder.decode(bytes);
  return JSON.parse(text);
}

async function first(db, sql, ...values) {
  return db.prepare(sql).bind(...values).first();
}

async function run(db, sql, ...values) {
  return db.prepare(sql).bind(...values).run();
}

function changes(result) {
  return result && result.meta && typeof result.meta.changes === "number" ? result.meta.changes : 0;
}

function validChange(result) {
  return changes(result) === 1;
}

function cborLength(bytes, offset, additional) {
  if (additional < 24) return { value: additional, offset };
  if (additional === 24) return { value: bytes[offset], offset: offset + 1 };
  if (additional === 25) return { value: (bytes[offset] << 8) | bytes[offset + 1], offset: offset + 2 };
  if (additional === 26) {
    return {
      value: bytes[offset] * 0x1000000 + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3],
      offset: offset + 4,
    };
  }
  throw new Error("unsupported CBOR length");
}

function decodeCbor(bytes, start = 0, depth = 0) {
  if (depth > 24 || start >= bytes.length) throw new Error("invalid CBOR");
  const initial = bytes[start];
  const major = initial >> 5;
  const additional = initial & 31;
  if (additional === 31) throw new Error("indefinite CBOR is unsupported");
  let offset = start + 1;
  if (major === 7) {
    if (additional === 20) return { value: false, offset };
    if (additional === 21) return { value: true, offset };
    if (additional === 22) return { value: null, offset };
    throw new Error("unsupported CBOR simple value");
  }
  const lengthInfo = cborLength(bytes, offset, additional);
  const length = lengthInfo.value;
  offset = lengthInfo.offset;
  if (!Number.isSafeInteger(length) || length < 0) throw new Error("invalid CBOR length");
  if (major === 0) return { value: length, offset };
  if (major === 1) return { value: -1 - length, offset };
  if (major === 2 || major === 3) {
    const end = offset + length;
    if (end > bytes.length) throw new Error("truncated CBOR string");
    const data = bytes.slice(offset, end);
    return { value: major === 2 ? data : decoder.decode(data), offset: end };
  }
  if (major === 4) {
    const result = [];
    for (let i = 0; i < length; i += 1) {
      const item = decodeCbor(bytes, offset, depth + 1);
      result.push(item.value);
      offset = item.offset;
    }
    return { value: result, offset };
  }
  if (major === 5) {
    const result = new Map();
    for (let i = 0; i < length; i += 1) {
      const key = decodeCbor(bytes, offset, depth + 1);
      const value = decodeCbor(bytes, key.offset, depth + 1);
      if (result.has(key.value)) throw new Error("duplicate CBOR map key");
      result.set(key.value, value.value);
      offset = value.offset;
    }
    return { value: result, offset };
  }
  throw new Error("unsupported CBOR type");
}

function cborMap(value) {
  if (!(value instanceof Map)) throw new Error("CBOR map required");
  return value;
}

function clientData(credential, expectedType, config = PRODUCTION_IRIS_CONFIG) {
  if (!credential || credential.type !== "public-key" || !credential.response) throw new Error("bad credential");
  if (typeof credential.id !== "string" || !/^[A-Za-z0-9_-]{1,1024}$/.test(credential.id)) {
    throw new Error("bad credential id");
  }
  if (credential.rawId && credential.rawId !== credential.id) throw new Error("credential id mismatch");
  const raw = fromB64url(credential.response.clientDataJSON);
  const data = JSON.parse(decoder.decode(raw));
  if (
    data.type !== expectedType ||
    data.origin !== config.identityIssuerOrigin ||
    (typeof data.crossOrigin !== "undefined" && data.crossOrigin !== false) ||
    typeof data.challenge !== "string"
  ) throw new Error("client data mismatch");
  return { raw, data, id: credential.id };
}

function hasExactKeys(value, expected) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  );
}

function validWebAuthnCredential(credential, ceremonyType) {
  const responseKeys = ceremonyType === "webauthn.get"
    ? ["clientDataJSON", "authenticatorData", "signature"]
    : ["clientDataJSON", "attestationObject"];
  return hasExactKeys(credential, ["id", "rawId", "type", "response"]) &&
    credential.type === "public-key" &&
    typeof credential.id === "string" &&
    typeof credential.rawId === "string" &&
    hasExactKeys(credential.response, responseKeys) &&
    responseKeys.every((key) => typeof credential.response[key] === "string");
}

function authDataParts(authData, requireAttested) {
  if (!(authData instanceof Uint8Array) || authData.length < 37) throw new Error("bad authenticator data");
  const flags = authData[32];
  const signCount = new DataView(authData.buffer, authData.byteOffset + 33, 4).getUint32(0, false);
  if (!(flags & 0x01) || !(flags & 0x04)) throw new Error("user presence or verification missing");
  const backupEligible = Boolean(flags & 0x08);
  const backupState = Boolean(flags & 0x10);
  if (backupState && !backupEligible) throw new Error("invalid backup flags");
  if (requireAttested && !(flags & 0x40)) throw new Error("attested credential data missing");
  return { flags, signCount, backupEligible, backupState };
}

async function verifyRpId(authData, rpId) {
  const expected = await sha256(encoder.encode(rpId));
  for (let i = 0; i < expected.length; i += 1) if (authData[i] !== expected[i]) return false;
  return true;
}

function cosePublicKey(coseBytes) {
  const decoded = decodeCbor(coseBytes);
  const cose = cborMap(decoded.value);
  if (decoded.offset !== coseBytes.length) throw new Error("trailing COSE key data");
  const kty = cose.get(1);
  const alg = cose.get(3);
  if (kty === 2 && alg === -7 && cose.get(-1) === 1) {
    const x = cose.get(-2);
    const y = cose.get(-3);
    if (!(x instanceof Uint8Array) || x.length !== 32 || !(y instanceof Uint8Array) || y.length !== 32) {
      throw new Error("invalid P-256 public key");
    }
    return {
      alg,
      jwk: { kty: "EC", crv: "P-256", x: b64url(x), y: b64url(y), ext: true, key_ops: ["verify"] },
    };
  }
  if (kty === 3 && alg === -257) {
    const n = cose.get(-1);
    const e = cose.get(-2);
    if (!(n instanceof Uint8Array) || n.length < 256 || n.length > 512 ||
        !(e instanceof Uint8Array) || e.length < 1 || e.length > 8) {
      throw new Error("invalid RSA public key");
    }
    return {
      alg,
      jwk: { kty: "RSA", n: b64url(n), e: b64url(e), alg: "RS256", ext: true, key_ops: ["verify"] },
    };
  }
  throw new Error("unsupported COSE algorithm");
}

function derEcdsaToRaw(bytes, width = 32) {
  if (bytes.length === width * 2) return bytes;
  if (bytes.length < 8 || bytes[0] !== 0x30 || bytes[1] !== bytes.length - 2 || bytes[2] !== 0x02) {
    throw new Error("invalid ECDSA signature");
  }
  const rLength = bytes[3];
  const rStart = 4;
  const sTag = rStart + rLength;
  if (bytes[sTag] !== 0x02) throw new Error("invalid ECDSA signature");
  const sLength = bytes[sTag + 1];
  const sStart = sTag + 2;
  if (!rLength || !sLength || sStart + sLength !== bytes.length) throw new Error("invalid ECDSA signature");
  const trim = (part) => {
    if (part[0] & 0x80) throw new Error("negative ECDSA integer");
    if (part.length > 1 && part[0] === 0 && !(part[1] & 0x80)) {
      throw new Error("noncanonical ECDSA integer");
    }
    const out = part.length > 1 && part[0] === 0 ? part.slice(1) : part;
    if (out.length > width) throw new Error("invalid ECDSA integer");
    const padded = new Uint8Array(width);
    padded.set(out, width - out.length);
    return padded;
  };
  const r = trim(bytes.slice(rStart, sTag));
  const s = trim(bytes.slice(sStart));
  const raw = new Uint8Array(width * 2);
  raw.set(r, 0);
  raw.set(s, width);
  return raw;
}

async function importVerifyKey(jwk, alg) {
  if (alg === -7) return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  if (alg === -257) return crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  throw new Error("unsupported key algorithm");
}

async function verifySignature(jwk, alg, signature, authenticatorData, clientDataRaw) {
  const key = await importVerifyKey(jwk, alg);
  const clientHash = await sha256(clientDataRaw);
  const signed = new Uint8Array(authenticatorData.length + clientHash.length);
  signed.set(authenticatorData);
  signed.set(clientHash, authenticatorData.length);
  const sig = alg === -7 ? derEcdsaToRaw(signature) : signature;
  const algorithm = alg === -7 ? { name: "ECDSA", hash: "SHA-256" } : { name: "RSASSA-PKCS1-v1_5" };
  return crypto.subtle.verify(algorithm, key, sig, signed);
}

async function rateAllowed(db, request, operation, limit) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = await sha256Hex(encoder.encode(`${operation}:${ip}`));
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const row = await first(
    db,
    `INSERT INTO identity_rate_limit (rate_key, window_start, attempts)
     VALUES (?1, ?2, 1)
     ON CONFLICT(rate_key) DO UPDATE SET
       attempts = CASE WHEN identity_rate_limit.window_start <= ?3 THEN 1 ELSE identity_rate_limit.attempts + 1 END,
       window_start = CASE WHEN identity_rate_limit.window_start <= ?3 THEN ?2 ELSE identity_rate_limit.window_start END
     RETURNING attempts`,
    key,
    now,
    cutoff,
  );
  return Boolean(row && row.attempts <= limit);
}

async function newChallenge(db, purpose, subjectId, credentialId = null, handoffContext = null) {
  const bytes = randomBytes(32);
  const challenge = b64url(bytes);
  const hash = await sha256Hex(encoder.encode(challenge));
  const now = Date.now();
  await run(
    db,
    "INSERT INTO identity_challenge (challenge_hash, purpose, subject_id, credential_id, created_at, expires_at, consumed_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL)",
    hash,
    purpose,
    subjectId,
    credentialId,
    now,
    now + CHALLENGE_TTL_MS,
  );
  if (purpose === "assertion" && handoffContext) {
    await run(
      db,
      `INSERT INTO identity_handoff_proof_v2
       (request_id, proof_version, challenge_hash, subject_id, issuer_origin, rp_id,
        target_origin, target_path, action, state, created_at, challenge_expires_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'CHALLENGE', ?10, ?11)`,
      handoffContext.requestId,
      HANDOFF_PROOF_VERSION,
      hash,
      subjectId,
      handoffContext.issuerOrigin,
      handoffContext.rpId,
      handoffContext.targetOrigin,
      handoffContext.targetPath,
      handoffContext.action,
      now,
      now + CHALLENGE_TTL_MS,
    );
  }
  return challenge;
}

async function loadChallenge(db, clientChallenge, purpose) {
  const hash = await sha256Hex(encoder.encode(clientChallenge));
  const row = await first(db, "SELECT * FROM identity_challenge WHERE challenge_hash = ?1", hash);
  if (!row || row.purpose !== purpose || row.consumed_at !== null || row.expires_at <= Date.now()) return null;
  return { ...row, challengeHash: hash };
}

async function consumeChallenge(db, challenge) {
  const result = await run(
    db,
    "UPDATE identity_challenge SET consumed_at = ?1 WHERE challenge_hash = ?2 AND purpose = ?3 AND consumed_at IS NULL AND expires_at > ?1",
    Date.now(),
    challenge.challengeHash,
    challenge.purpose,
  );
  return validChange(result);
}

function validHandoffChallengeContext(challenge, handoffProof, config) {
  return Boolean(
    challenge &&
    handoffProof &&
    handoffProof.proof_version === HANDOFF_PROOF_VERSION &&
    handoffProof.state === "CHALLENGE" &&
    handoffProof.challenge_hash === challenge.challengeHash &&
    handoffProof.subject_id === challenge.subject_id &&
    handoffProof.challenge_expires_at === challenge.expires_at &&
    handoffProof.challenge_expires_at > Date.now() &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      handoffProof.request_id,
    ) &&
    handoffProof.issuer_origin === config.identityIssuerOrigin &&
    handoffProof.rp_id === config.webauthnRpId &&
    handoffProof.target_origin === config.receiverOrigin &&
    handoffProof.target_path === AI_WORLD_PATH &&
    handoffProof.action === HANDOFF_ACTION
  );
}

async function registrationOptions(request, env) {
  const db = env.IDENTITY_DB;
  const config = getIrisRuntimeConfig(env);
  if (!(await rateAllowed(db, request, "register", 5))) return denied();
  const subjectId = crypto.randomUUID();
  const challenge = await newChallenge(db, "register", subjectId);
  const userId = randomBytes(32);
  return json({
    ok: true,
    publicKey: {
      challenge,
      rp: { id: config.webauthnRpId, name: "DualisCapax" },
      user: {
        id: b64url(userId),
        name: "DualisCapax",
        displayName: "DualisCapax",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      timeout: CHALLENGE_TTL_MS,
      attestation: "none",
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
    },
  });
}

async function verifyRegistration(request, env) {
  const db = env.IDENTITY_DB;
  const config = getIrisRuntimeConfig(env);
  if (!(await rateAllowed(db, request, "register-verify", 10))) return denied();
  try {
    const body = await readBody(request);
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !Object.hasOwn(body, "credential") ||
      !validWebAuthnCredential(body.credential, "webauthn.create")
    ) return denied();
    const { raw: clientDataRaw, data, id } = clientData(body.credential, "webauthn.create", config);
    const challenge = await loadChallenge(db, data.challenge, "register");
    if (!challenge) return denied();
    const attestationBytes = fromB64url(body.credential.response.attestationObject);
    const decoded = decodeCbor(attestationBytes);
    const attestation = cborMap(decoded.value);
    if (decoded.offset !== attestationBytes.length || attestation.get("fmt") !== "none") return denied();
    const statement = cborMap(attestation.get("attStmt"));
    if (statement.size !== 0) return denied();
    const authData = attestation.get("authData");
    if (!(authData instanceof Uint8Array) || !(await verifyRpId(authData, config.webauthnRpId))) return denied();
    const parts = authDataParts(authData, true);
    if (parts.flags & 0x80) return denied();
    const credentialOffset = 37 + 16;
    if (authData.length < credentialOffset + 2) return denied();
    const credentialLength = (authData[credentialOffset] << 8) | authData[credentialOffset + 1];
    const idStart = credentialOffset + 2;
    const idEnd = idStart + credentialLength;
    if (!credentialLength || idEnd >= authData.length) return denied();
    const attestedCredentialId = b64url(authData.slice(idStart, idEnd));
    if (attestedCredentialId !== id) return denied();
    const cose = cosePublicKey(authData.slice(idEnd));
    await importVerifyKey(cose.jwk, cose.alg);
    if (!(await consumeChallenge(db, challenge))) return denied();
    await run(
      db,
      `INSERT INTO identity_credential
       (credential_id, subject_id, public_key_json, algorithm, sign_count, backup_eligible, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)`,
      id,
      challenge.subject_id,
      JSON.stringify(cose.jwk),
      cose.alg,
      parts.signCount,
      parts.backupEligible ? 1 : 0,
      Date.now(),
    );
    return json({ ok: true, status: "REGISTERED" });
  } catch {
    return denied();
  }
}

async function assertionOptions(request, env) {
  const db = env.IDENTITY_DB;
  const config = getIrisRuntimeConfig(env);
  if (!(await rateAllowed(db, request, "assertion", 10))) return denied();
  try {
    const body = await readBody(request, 4096);
    if (!body || typeof body !== "object" || Array.isArray(body)) return denied();
    let credential = null;
    if (body.credential_id !== undefined && body.credential_id !== null) {
      if (typeof body.credential_id !== "string" || !/^[A-Za-z0-9_-]{1,1024}$/.test(body.credential_id)) return denied();
      credential = await first(
        db,
        "SELECT credential_id, subject_id FROM identity_credential WHERE credential_id = ?1",
        body.credential_id,
      );
      if (!credential) return denied();
    }
    const handoffContext = {
      requestId: crypto.randomUUID(),
      issuerOrigin: config.identityIssuerOrigin,
      rpId: config.webauthnRpId,
      targetOrigin: config.receiverOrigin,
      targetPath: AI_WORLD_PATH,
      action: HANDOFF_ACTION,
    };
    const challenge = await newChallenge(
      db,
      "assertion",
      credential ? credential.subject_id : DISCOVERABLE_SUBJECT,
      credential ? credential.credential_id : null,
      handoffContext,
    );
    return json({
      ok: true,
      publicKey: {
        challenge,
        rpId: config.webauthnRpId,
        allowCredentials: credential ? [{ type: "public-key", id: credential.credential_id }] : [],
        userVerification: "required",
        timeout: CHALLENGE_TTL_MS,
      },
    });
  } catch {
    return denied();
  }
}

async function createHandoff(db, env, subjectId, handoffProof, assertionDigest) {
  const config = getIrisRuntimeConfig(env);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const jti = b64url(randomBytes(32));
  const nonce = b64url(randomBytes(32));
  const sessionBinding = b64url(randomBytes(32));
  const payload = {
    v: HANDOFF_PROOF_VERSION,
    iss: config.identityIssuerOrigin,
    aud: config.receiverOrigin,
    origin: handoffProof.issuer_origin,
    rp_id: handoffProof.rp_id,
    target_origin: handoffProof.target_origin,
    target_path: handoffProof.target_path,
    action: handoffProof.action,
    request_id: handoffProof.request_id,
    sub: subjectId,
    assertion_digest: assertionDigest,
    session_binding: sessionBinding,
    iat: nowSeconds,
    exp: nowSeconds + HANDOFF_TTL_SECONDS,
    jti,
    nonce,
  };
  const token = await signHandoff(payload, env.IDENTITY_HANDOFF_SECRET);
  const issuedAt = nowSeconds * 1000;
  const result = await run(
    db,
    `UPDATE identity_handoff_proof_v2
     SET state = 'ISSUED', subject_id = ?1, assertion_digest = ?2, jti_hash = ?3,
         nonce_hash = ?4, session_binding_hash = ?5, issued_at = ?6, expires_at = ?7
     WHERE request_id = ?8 AND challenge_hash = ?9 AND proof_version = ?10
       AND subject_id = ?11 AND issuer_origin = ?12 AND rp_id = ?13
       AND target_origin = ?14 AND target_path = ?15 AND action = ?16
       AND state = 'CHALLENGE' AND challenge_expires_at > ?6`,
    subjectId,
    assertionDigest,
    await sha256Hex(encoder.encode(jti)),
    await sha256Hex(encoder.encode(nonce)),
    await sha256Hex(encoder.encode(sessionBinding)),
    issuedAt,
    payload.exp * 1000,
    payload.request_id,
    handoffProof.challenge_hash,
    HANDOFF_PROOF_VERSION,
    handoffProof.subject_id,
    payload.origin,
    payload.rp_id,
    payload.target_origin,
    payload.target_path,
    payload.action,
  );
  return validChange(result) ? token : null;
}

async function verifyAssertion(request, env) {
  const db = env.IDENTITY_DB;
  const config = getIrisRuntimeConfig(env);
  if (!(await rateAllowed(db, request, "assertion-verify", 12))) return denied();
  try {
    const body = await readBody(request);
    // The browser may submit only the WebAuthn credential. Identity assertions
    // do not accept a caller-provided digest, principal, or authorization claim.
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !Object.hasOwn(body, "credential") ||
      !validWebAuthnCredential(body.credential, "webauthn.get")
    ) return denied();
    const { raw: clientDataRaw, data, id } = clientData(body.credential, "webauthn.get", config);
    const challenge = await loadChallenge(db, data.challenge, "assertion");
    if (!challenge) return denied();
    const handoffProof = await first(
      db,
      "SELECT * FROM identity_handoff_proof_v2 WHERE challenge_hash = ?1",
      challenge.challengeHash,
    );
    if (
      !validHandoffChallengeContext(challenge, handoffProof, config) ||
      (challenge.credential_id && challenge.credential_id !== id)
    ) return denied();
    const credential = await first(db, "SELECT * FROM identity_credential WHERE credential_id = ?1", id);
    if (
      !credential ||
      (challenge.subject_id !== DISCOVERABLE_SUBJECT && credential.subject_id !== challenge.subject_id)
    ) return denied();

    const authData = fromB64url(body.credential.response.authenticatorData);
    const signature = fromB64url(body.credential.response.signature);
    if (!(await verifyRpId(authData, config.webauthnRpId))) return denied();
    const parts = authDataParts(authData, false);
    if (parts.flags & 0x80) return denied();
    if (parts.backupEligible !== Boolean(credential.backup_eligible)) return denied();
    const storedCount = Number(credential.sign_count) >>> 0;
    if (!parts.backupEligible && storedCount > 0 && parts.signCount <= storedCount) return denied();
    const validSignature = await verifySignature(
      JSON.parse(credential.public_key_json),
      Number(credential.algorithm),
      signature,
      authData,
      clientDataRaw,
    );
    if (!validSignature) return denied();
    const assertionDigest = await verifiedAssertionDigest({
      credentialId: id,
      clientDataRaw,
      authData,
      signature,
    });

    if (!parts.backupEligible && parts.signCount !== storedCount) {
      const update = await run(
        db,
        "UPDATE identity_credential SET sign_count = ?1, updated_at = ?2 WHERE credential_id = ?3 AND sign_count = ?4 AND backup_eligible = 0",
        parts.signCount,
        Date.now(),
        id,
        storedCount,
      );
      if (!validChange(update)) return denied();
    } else if (parts.backupEligible && parts.signCount > storedCount) {
      await run(
        db,
        "UPDATE identity_credential SET sign_count = ?1, updated_at = ?2 WHERE credential_id = ?3 AND sign_count <= ?1",
        parts.signCount,
        Date.now(),
        id,
      );
    }
    if (!(await consumeChallenge(db, challenge))) return denied();
    const handoff = await createHandoff(
      db,
      env,
      credential.subject_id,
      handoffProof,
      assertionDigest,
    );
    if (!handoff) return denied();
    return json({
      ok: true,
      status: "VERIFIED",
      handoffProofVersion: HANDOFF_PROOF_VERSION,
      handoff,
    });
  } catch {
    return denied();
  }
}

async function signHandoff(payload, secret) {
  const header = b64url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "DC-HANDOFF" })));
  const body = b64url(encoder.encode(JSON.stringify(payload)));
  const unsigned = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(unsigned));
  return `${unsigned}.${b64url(new Uint8Array(signature))}`;
}

export async function verifyHandoffToken(
  token,
  secret,
  nowSeconds = Math.floor(Date.now() / 1000),
  config = PRODUCTION_IRIS_CONFIG,
) {
  if (typeof token !== "string" || token.length > 2048) return null;
  try {
    const pieces = token.split(".");
    if (pieces.length !== 3) return null;
    const [headerPart, payloadPart, signaturePart] = pieces;
    const header = JSON.parse(decoder.decode(fromB64url(headerPart)));
    const payload = JSON.parse(decoder.decode(fromB64url(payloadPart)));
    if (
      header.alg !== "HS256" ||
      header.typ !== "DC-HANDOFF" ||
      Object.keys(header).length !== 2 ||
      Object.keys(payload).length !== 16 ||
      payload.v !== HANDOFF_PROOF_VERSION ||
      payload.iss !== config.identityIssuerOrigin ||
      payload.aud !== config.receiverOrigin ||
      payload.origin !== config.identityIssuerOrigin ||
      payload.rp_id !== config.webauthnRpId ||
      payload.target_origin !== config.receiverOrigin ||
      payload.target_path !== AI_WORLD_PATH ||
      payload.action !== HANDOFF_ACTION ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.request_id) ||
      typeof payload.sub !== "string" ||
      payload.sub.length < 1 ||
      payload.sub.length > 200 ||
      !/^[0-9a-f]{64}$/.test(payload.assertion_digest) ||
      !Number.isSafeInteger(payload.iat) ||
      !Number.isSafeInteger(payload.exp) ||
      payload.iat > nowSeconds + 5 ||
      payload.exp <= nowSeconds ||
      payload.exp <= payload.iat ||
      payload.exp - payload.iat > HANDOFF_TTL_SECONDS ||
      !/^[A-Za-z0-9_-]{43}$/.test(payload.jti) ||
      !/^[A-Za-z0-9_-]{43}$/.test(payload.nonce) ||
      !/^[A-Za-z0-9_-]{43}$/.test(payload.session_binding)
    ) return null;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromB64url(signaturePart),
      encoder.encode(`${headerPart}.${payloadPart}`),
    );
    return valid ? payload : null;
  } catch {
    return null;
  }
}

async function revokeHandoff(request, env) {
  try {
    const body = await readBody(request, 4096);
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      typeof body.handoff !== "string"
    ) return denied();
    const config = getIrisRuntimeConfig(env);
    const payload = await verifyHandoffToken(
      body.handoff,
      env.IDENTITY_HANDOFF_SECRET,
      undefined,
      config,
    );
    if (!payload) return denied();
    const jtiHash = await sha256Hex(encoder.encode(payload.jti));
    const result = await run(
      env.IDENTITY_DB,
      "UPDATE identity_handoff_proof_v2 SET state = 'REVOKED', revoked_at = ?1 WHERE jti_hash = ?2 AND nonce_hash = ?3 AND proof_version = ?4 AND request_id = ?5 AND action = ?6 AND state = 'ISSUED' AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at > ?1",
      Date.now(),
      jtiHash,
      await sha256Hex(encoder.encode(payload.nonce)),
      HANDOFF_PROOF_VERSION,
      payload.request_id,
      HANDOFF_ACTION,
    );
    if (!validChange(result)) return denied();
    return json({ ok: true, status: "REVOKED" });
  } catch {
    return denied();
  }
}

async function consumeHandoff(request, env) {
  try {
    const config = getIrisRuntimeConfig(env);
    const contentType = request.headers.get("Content-Type")?.split(";")[0];
    let body;
    if (contentType === "application/json") {
      body = await readBody(request, 4096);
    } else if (contentType === "application/x-www-form-urlencoded") {
      const text = await readText(request, 4096);
      if (text === null) return denied();
      const params = new URLSearchParams(text);
      if (params.size !== 1 || !params.has("handoff")) return denied();
      body = { handoff: params.get("handoff") };
    } else {
      return denied();
    }
    const payload = await verifyHandoffToken(
      body.handoff,
      env.IDENTITY_HANDOFF_SECRET,
      undefined,
      config,
    );
    if (!payload) return denied();
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      typeof body.handoff !== "string"
    ) return denied();
    const receiverUrl = new URL(request.url);
    if (
      receiverUrl.origin !== config.receiverOrigin ||
      receiverUrl.pathname !== "/auth/consume" ||
      receiverUrl.search ||
      receiverUrl.hash
    ) return denied();
    const jtiHash = await sha256Hex(encoder.encode(payload.jti));
    const nonceHash = await sha256Hex(encoder.encode(payload.nonce));
    const handoff = await first(
      env.IDENTITY_DB,
      "SELECT * FROM identity_handoff_proof_v2 WHERE jti_hash = ?1",
      jtiHash,
    );
    if (
      !handoff ||
      handoff.state !== "ISSUED" ||
      handoff.proof_version !== HANDOFF_PROOF_VERSION ||
      handoff.subject_id !== payload.sub ||
      handoff.challenge_expires_at <= handoff.issued_at ||
      handoff.issued_at !== payload.iat * 1000 ||
      handoff.nonce_hash !== nonceHash ||
      handoff.expires_at !== payload.exp * 1000 ||
      handoff.issuer_origin !== payload.origin ||
      handoff.rp_id !== payload.rp_id ||
      handoff.target_origin !== payload.target_origin ||
      handoff.target_path !== payload.target_path ||
      handoff.action !== payload.action ||
      handoff.request_id !== payload.request_id ||
      handoff.assertion_digest !== payload.assertion_digest ||
      handoff.session_binding_hash !== await sha256Hex(encoder.encode(payload.session_binding)) ||
      handoff.session_hash !== null ||
      handoff.consumed_at !== null ||
      handoff.revoked_at !== null ||
      handoff.expires_at <= Date.now()
    ) return denied();
    const consumedAt = Date.now();
    const sessionId = b64url(randomBytes(32));
    const sessionHash = await sha256Hex(encoder.encode(sessionId));
    const expiresAt = consumedAt + SESSION_TTL_SECONDS * 1000;
    if (typeof env.IDENTITY_DB.batch !== "function") return unavailable();
    const bindings = [
      consumedAt,
      sessionHash,
      jtiHash,
      nonceHash,
      payload.request_id,
      HANDOFF_PROOF_VERSION,
      payload.sub,
      HANDOFF_ACTION,
      payload.assertion_digest,
      await sha256Hex(encoder.encode(payload.session_binding)),
    ];
    // A zero-row UPDATE is not an SQL error. The INSERT must be guarded by
    // this attempt's random session hash so a losing consumer cannot mint one.
    const results = await env.IDENTITY_DB.batch([
      env.IDENTITY_DB.prepare(
      `UPDATE identity_handoff_proof_v2
       SET state = 'CONSUMED', consumed_at = ?1, session_hash = ?2
       WHERE jti_hash = ?3 AND nonce_hash = ?4 AND request_id = ?5
         AND proof_version = ?6 AND subject_id = ?7 AND action = ?8
         AND assertion_digest = ?9 AND session_binding_hash = ?10
         AND state = 'ISSUED' AND consumed_at IS NULL AND revoked_at IS NULL
         AND session_hash IS NULL AND expires_at > ?1`,
      ).bind(...bindings),
      env.IDENTITY_DB.prepare(
        `INSERT INTO identity_session
           (session_hash, subject_id, created_at, expires_at, revoked_at)
         SELECT session_hash, subject_id, ?1, ?11, NULL
           FROM identity_handoff_proof_v2
          WHERE jti_hash = ?3 AND nonce_hash = ?4 AND request_id = ?5
            AND proof_version = ?6 AND subject_id = ?7 AND action = ?8
            AND assertion_digest = ?9 AND session_binding_hash = ?10
            AND state = 'CONSUMED' AND consumed_at = ?1
            AND session_hash = ?2 AND revoked_at IS NULL AND expires_at > ?1`,
      ).bind(...bindings, expiresAt),
    ]);
    if (
      !Array.isArray(results) ||
      results.length !== 2 ||
      ![results[0], results[1]].every((result) => result?.success === true && validChange(result))
    ) return denied();
    return json(
      { ok: true, status: "GRANTED" },
      200,
      {
        "set-cookie": `__Host-dc_ai_session=${sessionId}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`,
      },
    );
  } catch {
    return denied();
  }
}

async function readText(request, maxBytes) {
  const length = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(length) && length > maxBytes || !request.body) return null;
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return decoder.decode(bytes);
  } catch {
    return null;
  }
}

function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

async function readAiSessionContext(request, env) {
  const id = cookieValue(request, "__Host-dc_ai_session");
  if (!id) return null;
  try {
    const hash = await sha256Hex(encoder.encode(id));
    const session = await first(
      env.IDENTITY_DB,
      "SELECT subject_id, expires_at FROM identity_session WHERE session_hash = ?1 AND expires_at > ?2 AND revoked_at IS NULL",
      hash,
      Date.now(),
    );
    if (
      typeof session?.subject_id !== "string" ||
      !session.subject_id.trim() ||
      session.subject_id.length > 200 ||
      !Number.isSafeInteger(session.expires_at)
    ) return null;
    return {
      subjectId: session.subject_id,
      sessionHash: hash,
      expiresAt: session.expires_at,
    };
  } catch {
    return null;
  }
}

/**
 * Internal Worker-only verifier for routes that need to bind an operation to the
 * same canonical receiver session as /auth/session. Never return this subject to
 * browser-facing JSON; callers use it only for server-side ownership checks.
 */
export async function verifyAiSessionSubject(request, env) {
  const runtime = resolveIrisRuntime(env, "identity");
  if (!runtime.ok) return null;
  env = runtime.env;
  const config = getIrisRuntimeConfig(env);
  const url = new URL(request.url);
  if (
    !configured(env) ||
    url.protocol !== "https:" ||
    url.hostname.toLowerCase() !== config.receiverHost ||
    (request.headers.get("Origin") !== null &&
      !isOrigin(request, config.receiverOrigin, config.receiverHost))
  ) return null;
  const session = await readAiSessionContext(request, env);
  return session ? { verified: true, ...session } : null;
}

async function readAiSession(request, env) {
  const session = await verifyAiSessionSubject(request, env);
  return session
    ? json({ ok: true, status: "GRANTED" })
    : denied();
}

export async function handleComIdentityRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === "/auth/config") {
    const runtime = resolveIrisRuntime(env, "identity");
    if (!runtime.ok) return unavailable();
    env = runtime.env;
    const config = getIrisRuntimeConfig(env);
    if (
      request.method !== "GET" ||
      url.origin !== config.identityIssuerOrigin ||
      (request.headers.get("Origin") !== null &&
        request.headers.get("Origin") !== config.identityIssuerOrigin)
    ) return denied();
    if (!configured(env) || !(await handoffProofStoreReady(env.IDENTITY_DB))) return unavailable();
    return json({
      ok: true,
      mode: config.mode,
      frontendOrigin: config.frontendOrigin,
      identityIssuerOrigin: config.identityIssuerOrigin,
      receiverOrigin: config.receiverOrigin,
      webauthnRpId: config.webauthnRpId,
      handoffProofVersion: HANDOFF_PROOF_VERSION,
    });
  }
  const routes = new Set([
    "/auth/register/options",
    "/auth/register/verify",
    "/auth/assertion/options",
    "/auth/assertion/verify",
    "/auth/handoff/revoke",
  ]);
  if (!routes.has(path)) return null;
  const runtime = resolveIrisRuntime(env, "identity");
  if (!runtime.ok) return unavailable();
  env = runtime.env;
  const config = getIrisRuntimeConfig(env);
  const issuerHost = new URL(config.identityIssuerOrigin).hostname;
  if (
    request.method !== "POST" ||
    !isOrigin(request, config.identityIssuerOrigin, issuerHost) ||
    !isExpectedFetchSite(request, "same-origin") ||
    request.headers.get("Content-Type")?.split(";")[0] !== "application/json"
  ) return denied();
  if (!configured(env) || !(await handoffProofStoreReady(env.IDENTITY_DB))) return unavailable();
  try {
    if (path === "/auth/register/options") return await registrationOptions(request, env);
    if (path === "/auth/register/verify") return await verifyRegistration(request, env);
    if (path === "/auth/assertion/options") return await assertionOptions(request, env);
    if (path === "/auth/assertion/verify") return await verifyAssertion(request, env);
    return await revokeHandoff(request, env);
  } catch {
    return denied();
  }
}

export async function handleAiIdentityRequest(request, env) {
  const path = new URL(request.url).pathname;
  if (path === "/auth/consume") {
    const runtime = resolveIrisRuntime(env, "identity");
    if (!runtime.ok) return unavailable();
    env = runtime.env;
    const config = getIrisRuntimeConfig(env);
    if (
      request.method !== "POST" ||
      !isOrigin(request, config.identityIssuerOrigin, config.receiverHost) ||
      !isExpectedFetchSite(request, "cross-site") ||
      !["application/json", "application/x-www-form-urlencoded"].includes(request.headers.get("Content-Type")?.split(";")[0])
    ) return denied();
    if (!configured(env)) return unavailable();
    if (!(await handoffProofStoreReady(env.IDENTITY_DB))) return unavailable();
    const response = await consumeHandoff(request, env);
    if (!request.headers.get("Accept")?.includes("text/html")) return response;
    if (!response.ok) {
      return new Response(
        `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Access not granted</title><main><h1>Access not granted</h1><p>The passkey handoff could not be verified or has expired. Nothing was opened.</p><a href="${config.identityIssuerOrigin}/#gate">Return to the only entry</a></main>`,
        {
          status: response.status,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store, private",
            "x-content-type-options": "nosniff",
            "referrer-policy": "no-referrer",
          },
        },
      );
    }
    const headers = new Headers(response.headers);
    headers.delete("content-type");
    headers.set("location", AI_WORLD_PATH);
    headers.set("cache-control", "no-store, private");
    return new Response(null, { status: 303, headers });
  }
  if (path === "/auth/session") {
    const runtime = resolveIrisRuntime(env, "identity");
    if (!runtime.ok) return unavailable();
    env = runtime.env;
    const config = getIrisRuntimeConfig(env);
    const url = new URL(request.url);
    if (
      !configured(env) ||
      request.method !== "GET" ||
      url.protocol !== "https:" ||
      url.hostname.toLowerCase() !== config.receiverHost ||
      (request.headers.get("Origin") !== null &&
        !isOrigin(request, config.receiverOrigin, config.receiverHost))
    ) return denied();
    return readAiSession(request, env);
  }
  return null;
}

export async function handleAiProtectedWorldRequest(request, env, fetchOrigin = fetch) {
  const url = new URL(request.url);
  if (url.pathname !== AI_WORLD_PATH.slice(0, -1) &&
      !url.pathname.startsWith(AI_WORLD_PATH)) return null;
  const runtime = resolveIrisRuntime(env, "identity");
  if (!runtime.ok) return unavailable();
  env = runtime.env;
  const config = getIrisRuntimeConfig(env);
  if (
    !configured(env) ||
    !["GET", "HEAD"].includes(request.method) ||
    url.protocol !== "https:" ||
    url.hostname.toLowerCase() !== config.receiverHost ||
    (request.headers.get("Origin") && request.headers.get("Origin") !== config.receiverOrigin)
  ) return denied();

  const session = await readAiSession(request, env);
  if (!session.ok) return session;

  const headers = new Headers(request.headers);
  const cookie = headers.get("Cookie");
  if (cookie) {
    const remaining = cookie
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part.split("=", 1)[0] !== "__Host-dc_ai_session");
    if (remaining.length) headers.set("Cookie", remaining.join("; "));
    else headers.delete("Cookie");
  }
  const upstreamRequest = new Request(request, { headers });
  let upstream;
  try {
    upstream = await fetchOrigin(upstreamRequest);
  } catch {
    return json({
      ok: false,
      status: "CLOSED",
      code: "WORLD_UNAVAILABLE",
      message: "The production 3D world is unavailable.",
    }, 503);
  }
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set("cache-control", "private, no-store");
  responseHeaders.set("referrer-policy", "no-referrer");
  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
