import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, randomBytes, sign } from "node:crypto";
import test from "node:test";
import { attachIdentityBatch } from "./identity-batch-fixture.mjs";

import {
  handleAiIdentityRequest,
  handleComIdentityRequest,
  verifyHandoffToken,
} from "../server/identity.js";

const ISSUER = "https://dualiscapax.com";
const RECEIVER = "https://dualiscapax.ai";
const RP_ID = "dualiscapax.com";
const encoder = new TextEncoder();
const TEST_SECRET = "ephemeral-local-webauthn-test-secret-32-bytes";

function b64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

function unb64url(value) {
  return Buffer.from(value, "base64url");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest();
}

function cborHead(major, value) {
  if (value < 24) return Buffer.from([(major << 5) | value]);
  if (value <= 0xff) return Buffer.from([(major << 5) | 24, value]);
  if (value <= 0xffff) {
    const output = Buffer.alloc(3);
    output[0] = (major << 5) | 25;
    output.writeUInt16BE(value, 1);
    return output;
  }
  throw new Error("test CBOR value is out of range");
}

function encodeCbor(value) {
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    const bytes = Buffer.from(value);
    return Buffer.concat([cborHead(2, bytes.length), bytes]);
  }
  if (typeof value === "string") {
    const bytes = Buffer.from(value, "utf8");
    return Buffer.concat([cborHead(3, bytes.length), bytes]);
  }
  if (typeof value === "number" && Number.isInteger(value)) {
    return value >= 0
      ? cborHead(0, value)
      : cborHead(1, -1 - value);
  }
  if (value instanceof Map) {
    const entries = [...value.entries()];
    return Buffer.concat([
      cborHead(5, entries.length),
      ...entries.flatMap(([key, entry]) => [encodeCbor(key), encodeCbor(entry)]),
    ]);
  }
  throw new Error("unsupported test CBOR value");
}

function identityRequest(path, body, env) {
  return handleComIdentityRequest(
    new Request(`${ISSUER}${path}`, {
      method: "POST",
      headers: {
        Origin: ISSUER,
        "Sec-Fetch-Site": "same-origin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
    env,
  );
}

function consumeHandoffRequest(token) {
  return new Request(`${RECEIVER}/auth/consume`, {
    method: "POST",
    headers: {
      Origin: ISSUER,
      "Sec-Fetch-Site": "cross-site",
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ handoff: token }).toString(),
  });
}

function createIdentityDb() {
  const state = {
    challenges: new Map(),
    credentials: new Map(),
    handoffs: [],
    handoffProofs: new Map(),
    sessions: [],
    rateLimits: new Map(),
    handoffProofVersion: 2,
  };

  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (sql.includes("FROM identity_handoff_contract_version")) {
                return state.handoffProofVersion === 2 ? { version: 2 } : null;
              }
              if (sql.includes("INSERT INTO identity_rate_limit")) {
                const [key, now, cutoff] = values;
                const previous = state.rateLimits.get(key);
                const attempts = !previous || previous.windowStart <= cutoff
                  ? 1
                  : previous.attempts + 1;
                state.rateLimits.set(key, { windowStart: previous?.windowStart <= cutoff ? now : previous?.windowStart ?? now, attempts });
                return { attempts };
              }
              if (sql.includes("FROM identity_challenge")) {
                const row = state.challenges.get(values[0]);
                return row ? { ...row } : null;
              }
              if (sql.includes("FROM identity_handoff_proof_v2")) {
                const row = sql.includes("challenge_hash")
                  ? state.handoffProofs.get(values[0])
                  : [...state.handoffProofs.values()].find((proof) => proof.jti_hash === values[0]);
                return row ? { ...row } : null;
              }
              if (sql.includes("FROM identity_credential")) {
                const row = state.credentials.get(values[0]);
                return row ? { ...row } : null;
              }
              throw new Error(`Unexpected WebAuthn test SELECT: ${sql}`);
            },
            async run() {
              if (sql.includes("INSERT INTO identity_challenge")) {
                const [challengeHash, purpose, subjectId, credentialId, createdAt, expiresAt] = values;
                state.challenges.set(challengeHash, {
                  challenge_hash: challengeHash,
                  purpose,
                  subject_id: subjectId,
                  credential_id: credentialId,
                  created_at: createdAt,
                  expires_at: expiresAt,
                  consumed_at: null,
                });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("INSERT INTO identity_handoff_proof_v2")) {
                const [
                  requestId,
                  proofVersion,
                  challengeHash,
                  subjectId,
                  issuerOrigin,
                  rpId,
                  targetOrigin,
                  targetPath,
                  action,
                  createdAt,
                  challengeExpiresAt,
                ] = values;
                const proof = {
                  request_id: requestId,
                  proof_version: proofVersion,
                  challenge_hash: challengeHash,
                  subject_id: subjectId,
                  issuer_origin: issuerOrigin,
                  rp_id: rpId,
                  target_origin: targetOrigin,
                  target_path: targetPath,
                  action,
                  state: "CHALLENGE",
                  created_at: createdAt,
                  challenge_expires_at: challengeExpiresAt,
                  assertion_digest: null,
                  jti_hash: null,
                  nonce_hash: null,
                  session_binding_hash: null,
                  issued_at: null,
                  expires_at: null,
                  consumed_at: null,
                  revoked_at: null,
                  session_hash: null,
                };
                state.handoffProofs.set(challengeHash, proof);
                return { meta: { changes: 1 } };
              }
              if (sql.includes("UPDATE identity_challenge SET consumed_at")) {
                const [consumedAt, challengeHash, purpose] = values;
                const row = state.challenges.get(challengeHash);
                if (!row || row.purpose !== purpose || row.consumed_at !== null || row.expires_at <= consumedAt) {
                  return { meta: { changes: 0 } };
                }
                row.consumed_at = consumedAt;
                return { meta: { changes: 1 } };
              }
              if (sql.includes("INSERT INTO identity_credential")) {
                const [credentialId, subjectId, publicKeyJson, algorithm, signCount, backupEligible, createdAt, updatedAt] = values;
                if (state.credentials.has(credentialId)) return { meta: { changes: 0 } };
                state.credentials.set(credentialId, {
                  credential_id: credentialId,
                  subject_id: subjectId,
                  public_key_json: publicKeyJson,
                  algorithm,
                  sign_count: signCount,
                  backup_eligible: backupEligible,
                  created_at: createdAt,
                  updated_at: updatedAt,
                });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("UPDATE identity_credential SET sign_count")) {
                const [signCount, updatedAt, credentialId, storedCount] = values;
                const row = state.credentials.get(credentialId);
                if (!row || row.sign_count !== storedCount || row.backup_eligible !== 0) {
                  return { meta: { changes: 0 } };
                }
                row.sign_count = signCount;
                row.updated_at = updatedAt;
                return { meta: { changes: 1 } };
              }
              if (sql.includes("UPDATE identity_handoff_proof_v2") && sql.includes("SET state = 'ISSUED'")) {
                const [
                  subjectId,
                  assertionDigest,
                  jtiHash,
                  nonceHash,
                  sessionBindingHash,
                  issuedAt,
                  expiresAt,
                  requestId,
                  challengeHash,
                  proofVersion,
                  originalSubject,
                  issuerOrigin,
                  rpId,
                  targetOrigin,
                  targetPath,
                  action,
                ] = values;
                const proof = state.handoffProofs.get(challengeHash);
                if (!proof || proof.state !== "CHALLENGE" ||
                    proof.request_id !== requestId || proof.proof_version !== proofVersion ||
                    proof.subject_id !== originalSubject || proof.issuer_origin !== issuerOrigin ||
                    proof.rp_id !== rpId || proof.target_origin !== targetOrigin ||
                    proof.target_path !== targetPath || proof.action !== action ||
                    proof.challenge_expires_at <= issuedAt) {
                  return { meta: { changes: 0 } };
                }
                Object.assign(proof, {
                  state: "ISSUED",
                  subject_id: subjectId,
                  assertion_digest: assertionDigest,
                  jti_hash: jtiHash,
                  nonce_hash: nonceHash,
                  session_binding_hash: sessionBindingHash,
                  issued_at: issuedAt,
                  expires_at: expiresAt,
                });
                state.handoffs.push(proof);
                return { meta: { changes: 1 } };
              }
              if (sql.includes("UPDATE identity_handoff_proof_v2") && sql.includes("SET state = 'CONSUMED'")) {
                const [
                  consumedAt,
                  sessionHash,
                  jtiHash,
                  nonceHash,
                  requestId,
                  proofVersion,
                  subjectId,
                  action,
                  assertionDigest,
                  sessionBindingHash,
                ] = values;
                const proof = [...state.handoffProofs.values()].find((entry) => entry.jti_hash === jtiHash);
                if (!proof || proof.nonce_hash !== nonceHash || proof.request_id !== requestId ||
                    proof.proof_version !== proofVersion || proof.subject_id !== subjectId ||
                    proof.action !== action || proof.assertion_digest !== assertionDigest ||
                    proof.session_binding_hash !== sessionBindingHash || proof.state !== "ISSUED" ||
                    proof.session_hash !== null || proof.expires_at <= consumedAt) {
                  return { meta: { changes: 0 } };
                }
                Object.assign(proof, { state: "CONSUMED", consumed_at: consumedAt, session_hash: sessionHash });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("INSERT INTO identity_session")) {
                state.sessions.push(values);
                return { meta: { changes: 1 } };
              }
              throw new Error(`Unexpected WebAuthn test write: ${sql}`);
            },
          };
        },
      };
    },
  };

  attachIdentityBatch(db, state);
  return { db, state };
}

function testEnvironment(db) {
  const env = {
    IDENTITY_DB: db,
    IDENTITY_HANDOFF_SECRET: TEST_SECRET,
  };
  for (const name of ["TRINITY_LAW_ENGINE", "IRIS_MEMORY", "INFERENCE_ADAPTER"]) {
    Object.defineProperty(env, name, {
      get() {
        throw new Error(`identity verifier must not access ${name}`);
      },
    });
  }
  return env;
}

function assertNoHandoffAuthority(response, fixture, expectedSessions = 0) {
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(fixture.state.sessions.length, expectedSessions);
}

async function registrationOptions(fixture) {
  const response = await identityRequest("/auth/register/options", {}, fixture.env);
  assert.equal(response.status, 200);
  return (await response.json()).publicKey;
}

function clientData(type, challenge, origin = ISSUER) {
  return Buffer.from(JSON.stringify({ type, challenge, origin }), "utf8");
}

function authenticatorData({ rpId = RP_ID, flags, signCount = 0, attested = false, credentialId, coseKey } = {}) {
  const rpIdHash = sha256(Buffer.from(rpId, "utf8"));
  const fixed = Buffer.alloc(37);
  rpIdHash.copy(fixed, 0);
  fixed[32] = flags;
  fixed.writeUInt32BE(signCount, 33);
  if (!attested) return fixed;

  const aaguid = Buffer.alloc(16);
  const credentialIdBytes = unb64url(credentialId);
  const credentialLength = Buffer.alloc(2);
  credentialLength.writeUInt16BE(credentialIdBytes.length);
  return Buffer.concat([fixed, aaguid, credentialLength, credentialIdBytes, encodeCbor(coseKey)]);
}

function makeCoseKey(publicJwk) {
  return new Map([
    [1, 2], // EC2
    [3, -7], // ES256
    [-1, 1], // P-256
    [-2, unb64url(publicJwk.x)],
    [-3, unb64url(publicJwk.y)],
  ]);
}

async function createRegistrationCredential(fixture, {
  challenge,
  origin = ISSUER,
  rpId = RP_ID,
  flags = 0x45, // UP | UV | AT
} = {}) {
  const options = await registrationOptions(fixture);
  const keyPair = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const publicJwk = keyPair.publicKey.export({ format: "jwk" });
  const credentialId = b64url(randomBytes(32));
  const actualChallenge = challenge ?? options.challenge;
  const rawClientData = clientData("webauthn.create", actualChallenge, origin);
  const authData = authenticatorData({
    rpId,
    flags,
    attested: true,
    credentialId,
    coseKey: makeCoseKey(publicJwk),
  });
  const attestationObject = encodeCbor(new Map([
    ["fmt", "none"],
    ["attStmt", new Map()],
    ["authData", authData],
  ]));

  return {
    keyPair,
    credentialId,
    options,
    body: {
      credential: {
        id: credentialId,
        rawId: credentialId,
        type: "public-key",
        response: {
          clientDataJSON: b64url(rawClientData),
          attestationObject: b64url(attestationObject),
        },
      },
    },
  };
}

async function registeredFixture() {
  const store = createIdentityDb();
  const fixture = { ...store, env: testEnvironment(store.db) };
  const registration = await createRegistrationCredential(fixture);
  const response = await identityRequest("/auth/register/verify", registration.body, fixture.env);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.status, "REGISTERED");
  assert.equal(Object.hasOwn(result, "handoff"), false);
  assert.equal(fixture.state.credentials.size, 1);
  assert.equal(fixture.state.handoffs.length, 0);
  return { ...fixture, ...registration };
}

async function assertionOptions(fixture) {
  const response = await identityRequest(
    "/auth/assertion/options",
    { credential_id: fixture.credentialId },
    fixture.env,
  );
  assert.equal(response.status, 200);
  return (await response.json()).publicKey;
}

function signAssertion(privateKey, rawClientData, authData) {
  const signedBytes = Buffer.concat([Buffer.from(authData), sha256(rawClientData)]);
  return sign("sha256", signedBytes, privateKey);
}

async function assertionBody(fixture, {
  challenge,
  origin = ISSUER,
  rpId = RP_ID,
  flags = 0x05, // UP | UV
  signatureMutation,
} = {}) {
  const options = await assertionOptions(fixture);
  const actualChallenge = challenge ?? options.challenge;
  const rawClientData = clientData("webauthn.get", actualChallenge, origin);
  const authData = authenticatorData({ rpId, flags, signCount: 1 });
  let signature = signAssertion(fixture.keyPair.privateKey, rawClientData, authData);
  if (signatureMutation) signature = signatureMutation(Buffer.from(signature));
  return {
    options,
    body: {
      credential: {
        id: fixture.credentialId,
        rawId: fixture.credentialId,
        type: "public-key",
        response: {
          clientDataJSON: b64url(rawClientData),
          authenticatorData: b64url(authData),
          signature: b64url(signature),
        },
      },
    },
  };
}

test("real local P-256 registration and assertion verify, but identity alone grants no Iris compute authority", async () => {
  const fixture = await registeredFixture();
  const { options: issuedAssertionOptions, body } = await assertionBody(fixture);

  const response = await identityRequest("/auth/assertion/verify", body, fixture.env);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.status, "VERIFIED");
  assert.equal(result.handoffProofVersion, 2);
  assert.deepEqual(Object.keys(result).sort(), ["handoff", "handoffProofVersion", "ok", "status"]);
  assert.equal(fixture.state.credentials.get(fixture.credentialId).sign_count, 1);
  assert.equal(fixture.state.handoffs.length, 1);
  const proof = await verifyHandoffToken(result.handoff, TEST_SECRET);
  assert.equal(proof?.v, 2);
  assert.equal(proof?.origin, ISSUER);
  assert.equal(proof?.rp_id, RP_ID);
  assert.equal(proof?.target_origin, "https://dualiscapax.ai");
  assert.equal(proof?.target_path, "/holographic-core/v2/");
  assert.equal(proof?.action, "OPEN_PROTECTED_WORLD");
  assert.equal(proof?.sub, fixture.state.credentials.get(fixture.credentialId).subject_id);
  assert.equal(proof?.assertion_digest, fixture.state.handoffs[0].assertion_digest);
  const assertionChallengeHash = sha256(
    Buffer.from(issuedAssertionOptions.challenge, "utf8"),
  ).toString("hex");
  const persistedProof = fixture.state.handoffProofs.get(assertionChallengeHash);
  assert.equal(proof?.request_id, persistedProof?.request_id);
  assert.match(proof?.assertion_digest ?? "", /^[0-9a-f]{64}$/);
  assert.match(proof?.request_id ?? "", /^[0-9a-f-]{36}$/i);
  assert.equal(fixture.state.handoffs[0].session_binding_hash,
    sha256(Buffer.from(proof.session_binding, "utf8")).toString("hex"));
  const consume = await handleAiIdentityRequest(
    consumeHandoffRequest(result.handoff),
    fixture.env,
  );
  const consumeBody = await consume.json();
  assert.equal(consume.status, 200, JSON.stringify(consumeBody));
  assert.deepEqual(consumeBody, { ok: true, status: "GRANTED" });
  assert.match(consume.headers.get("set-cookie") ?? "", /__Host-dc_ai_session=.*Secure; HttpOnly; SameSite=Lax; Path=\//);
  assert.equal(fixture.state.handoffs[0].state, "CONSUMED");
  assert.equal(persistedProof?.state, "CONSUMED");
  assert.equal(fixture.state.sessions.length, 1);
  const replay = await handleAiIdentityRequest(
    consumeHandoffRequest(result.handoff),
    fixture.env,
  );
  assert.equal(replay.status, 403);
  assertNoHandoffAuthority(replay, fixture, 1);
  // The verifier refuses even to read these bindings. Compute authorization is a separate Trinity decision.
});

test("registration rejects challenge substitution, wrong origin, wrong RP-ID hash, and missing user verification", async (t) => {
  const scenarios = [
    ["challenge substitution", async (fixture) =>
      createRegistrationCredential(fixture, {
        challenge: b64url(randomBytes(32)),
      })],
    ["wrong origin", (fixture) => createRegistrationCredential(fixture, { origin: "https://dualiscapax.ai" })],
    ["wrong RP-ID hash", (fixture) => createRegistrationCredential(fixture, { rpId: "attacker.example.test" })],
    ["missing user verification", (fixture) => createRegistrationCredential(fixture, { flags: 0x41 })],
  ];

  for (const [name, makeCredential] of scenarios) {
    await t.test(name, async () => {
      const store = createIdentityDb();
      const fixture = { ...store, env: testEnvironment(store.db) };
      const credential = await makeCredential(fixture);
      const response = await identityRequest("/auth/register/verify", credential.body, fixture.env);
      assert.equal(response.status, 403);
      assertNoHandoffAuthority(response, fixture);
      assert.equal(fixture.state.credentials.size, 0);
      assert.equal(fixture.state.handoffs.length, 0);
    });
  }
});

test("a valid registration challenge is consumed once and cannot be replayed", async () => {
  const store = createIdentityDb();
  const fixture = { ...store, env: testEnvironment(store.db) };
  const credential = await createRegistrationCredential(fixture);

  const first = await identityRequest("/auth/register/verify", credential.body, fixture.env);
  assert.equal(first.status, 200, await first.text());
  const replay = await identityRequest("/auth/register/verify", credential.body, fixture.env);
  assert.equal(replay.status, 403);
  assertNoHandoffAuthority(replay, fixture);
  assert.equal(fixture.state.credentials.size, 1);
  assert.equal(fixture.state.handoffs.length, 0);
});

test("assertion rejects challenge substitution, wrong origin/RP-ID hash, invalid signatures, and missing user verification", async (t) => {
  const scenarios = [
    ["challenge substitution", (fixture) => assertionBody(fixture, {
      challenge: b64url(randomBytes(32)),
    })],
    ["wrong origin", (fixture) => assertionBody(fixture, { origin: "https://dualiscapax.ai" })],
    ["wrong RP-ID hash", (fixture) => assertionBody(fixture, { rpId: "attacker.example.test" })],
    ["invalid signature", (fixture) => assertionBody(fixture, {
      signatureMutation(signature) {
        signature[signature.length - 1] ^= 1;
        return signature;
      },
    })],
    ["client-supplied input digest", async (fixture) => {
      const assertion = await assertionBody(fixture);
      return {
        ...assertion,
        body: { ...assertion.body, input_digest: "a".repeat(64) },
      };
    }],
    ["unrecognized biometric data field", async (fixture) => {
      const assertion = await assertionBody(fixture);
      return {
        ...assertion,
        body: {
          credential: {
            ...assertion.body.credential,
            biometricData: "fixture-only-must-not-be-accepted",
          },
        },
      };
    }],
    ["missing user verification", (fixture) => assertionBody(fixture, { flags: 0x01 })],
  ];

  for (const [name, makeAssertion] of scenarios) {
    await t.test(name, async () => {
      const fixture = await registeredFixture();
      const { body } = await makeAssertion(fixture);
      const response = await identityRequest("/auth/assertion/verify", body, fixture.env);
      assert.equal(response.status, 403);
      assertNoHandoffAuthority(response, fixture);
      assert.equal(fixture.state.handoffs.length, 0, "denied assertion must not create a handoff");
      assert.equal(fixture.state.credentials.get(fixture.credentialId).sign_count, 0);
    });
  }
});

test("expired assertion challenges and replayed assertions are denied before another handoff", async (t) => {
  await t.test("expired challenge", async () => {
    const fixture = await registeredFixture();
    const { options, body } = await assertionBody(fixture);
    const challengeHash = sha256(Buffer.from(options.challenge, "utf8")).toString("hex");
    fixture.state.challenges.get(challengeHash).expires_at = Date.now() - 1;

    const response = await identityRequest("/auth/assertion/verify", body, fixture.env);
    assert.equal(response.status, 403);
    assertNoHandoffAuthority(response, fixture);
    assert.equal(fixture.state.handoffs.length, 0);
    assert.equal(fixture.state.credentials.get(fixture.credentialId).sign_count, 0);
  });

  await t.test("replayed assertion", async () => {
    const fixture = await registeredFixture();
    const { body } = await assertionBody(fixture);
    const first = await identityRequest("/auth/assertion/verify", body, fixture.env);
    assert.equal(first.status, 200, await first.text());
    const replay = await identityRequest("/auth/assertion/verify", body, fixture.env);
    assert.equal(replay.status, 403);
    assertNoHandoffAuthority(replay, fixture);
    assert.equal(fixture.state.handoffs.length, 1);
  });
});
