import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import test from "node:test";
import { attachIdentityBatch } from "./identity-batch-fixture.mjs";

import {
  handleAiIdentityRequest,
  handleComIdentityRequest,
} from "../server/identity.js";

// TEST_FIXTURE_ONLY: signing key and claims below never authorize a live service.
const ISSUER = "https://dualiscapax.com";
const RECEIVER = "https://dualiscapax.ai";
const SECRET = "local-only-test-handoff-secret-at-least-32-bytes";
const encoder = new TextEncoder();

function b64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function makeHandoff({ iat, exp, claims = {}, rowChanges = {} }) {
  const payload = {
    v: 2,
    iss: ISSUER,
    aud: RECEIVER,
    origin: ISSUER,
    rp_id: "dualiscapax.com",
    target_origin: RECEIVER,
    target_path: "/holographic-core/v2/",
    action: "OPEN_PROTECTED_WORLD",
    request_id: "123e4567-e89b-42d3-a456-426614174000",
    sub: "unity-test-subject",
    assertion_digest: hash("verified assertion fixture"),
    session_binding: b64url(new Uint8Array(32).fill(23)),
    iat,
    exp,
    jti: b64url(new Uint8Array(32).fill(11)),
    nonce: b64url(new Uint8Array(32).fill(17)),
    ...claims,
  };
  const headerPart = b64url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "DC-HANDOFF" })));
  const payloadPart = b64url(encoder.encode(JSON.stringify(payload)));
  const unsigned = `${headerPart}.${payloadPart}`;
  const key = await webcrypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await webcrypto.subtle.sign("HMAC", key, encoder.encode(unsigned));
  return {
    payload,
    rowChanges,
    token: `${unsigned}.${b64url(new Uint8Array(signature))}`,
  };
}

function createIdentityDb(payload = null, {
  proofStore = true,
  rowChanges = {},
  includeV2Record = true,
  includeLegacyRecord = false,
} = {}) {
  const proofRow = payload ? {
    jti_hash: hash(payload.jti),
    nonce_hash: hash(payload.nonce),
    subject_id: payload.sub,
    expires_at: payload.exp * 1000,
    consumed_at: null,
    revoked_at: null,
    proof_version: payload.v,
    state: "ISSUED",
    issuer_origin: payload.origin,
    rp_id: payload.rp_id,
    target_origin: payload.target_origin,
    target_path: payload.target_path,
    action: payload.action,
    request_id: payload.request_id,
    assertion_digest: payload.assertion_digest,
    session_binding_hash: hash(payload.session_binding),
    issued_at: payload.iat * 1000,
    challenge_expires_at: (payload.iat + 120) * 1000,
    session_hash: null,
    ...rowChanges,
  } : null;
  const state = {
    row: includeV2Record ? proofRow : null,
    legacyRow: includeLegacyRecord ? proofRow && { ...proofRow } : null,
    proofStore,
    schemaChecks: 0,
    selects: 0,
    updates: 0,
    legacyReads: 0,
    legacyWrites: 0,
    sessions: [],
  };
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (sql.includes("FROM identity_handoff_contract_version")) {
                state.schemaChecks += 1;
                return state.proofStore ? { version: 2 } : null;
              }
              if (!sql.includes("FROM identity_handoff_proof_v2")) {
                if (sql.includes("FROM identity_handoff ")) {
                  state.legacyReads += 1;
                  return state.legacyRow ? { ...state.legacyRow } : null;
                }
                throw new Error(`Unexpected identity test SELECT: ${sql}`);
              }
              state.selects += 1;
              return state.row ? { ...state.row } : null;
            },
            async run() {
              if (sql.includes("UPDATE identity_handoff_proof_v2") && sql.includes("state = 'CONSUMED'")) {
                state.updates += 1;
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
                const current = state.row;
                if (
                  !current ||
                  current.jti_hash !== jtiHash ||
                  current.nonce_hash !== nonceHash ||
                  current.request_id !== requestId ||
                  current.proof_version !== proofVersion ||
                  current.subject_id !== subjectId ||
                  current.action !== action ||
                  current.assertion_digest !== assertionDigest ||
                  current.session_binding_hash !== sessionBindingHash ||
                  current.state !== "ISSUED" ||
                  current.session_hash !== null ||
                  current.consumed_at !== null ||
                  current.revoked_at !== null ||
                  current.expires_at <= consumedAt
                ) return { meta: { changes: 0 } };
                current.state = "CONSUMED";
                current.consumed_at = consumedAt;
                current.session_hash = sessionHash;
                return { meta: { changes: 1 } };
              }
              if (sql.includes("UPDATE identity_handoff_proof_v2 SET state = 'REVOKED'")) {
                state.updates += 1;
                const [revokedAt, jtiHash, nonceHash, proofVersion, requestId, action] = values;
                const current = state.row;
                if (
                  !current ||
                  current.jti_hash !== jtiHash ||
                  current.nonce_hash !== nonceHash ||
                  current.proof_version !== proofVersion ||
                  current.request_id !== requestId ||
                  current.action !== action ||
                  current.state !== "ISSUED" ||
                  current.consumed_at !== null ||
                  current.revoked_at !== null ||
                  current.expires_at <= revokedAt
                ) return { meta: { changes: 0 } };
                current.state = "REVOKED";
                current.revoked_at = revokedAt;
                return { meta: { changes: 1 } };
              }
              if (sql.includes("INSERT INTO identity_session")) {
                state.sessions.push(values);
                return { meta: { changes: 1 } };
              }
              if (sql.includes("UPDATE identity_handoff ")) {
                state.legacyWrites += 1;
                if (!state.legacyRow) return { meta: { changes: 0 } };
                return { meta: { changes: 1 } };
              }
              throw new Error(`Unexpected identity test write: ${sql}`);
            },
          };
        },
      };
    },
  };
  attachIdentityBatch(db, state);
  return { db, state };
}

function consumeRequest(token, origin = ISSUER, accept = "application/json") {
  return new Request(`${RECEIVER}/auth/consume`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Sec-Fetch-Site": "cross-site",
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: accept,
    },
    body: new URLSearchParams({ handoff: token }).toString(),
  });
}

function consumeJsonRequest(body, origin = ISSUER, accept = "application/json") {
  return new Request(`${RECEIVER}/auth/consume`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Sec-Fetch-Site": "cross-site",
      "Content-Type": "application/json",
      Accept: accept,
    },
    body: JSON.stringify(body),
  });
}

function revokeRequest(token) {
  return new Request(`${ISSUER}/auth/handoff/revoke`, {
    method: "POST",
    headers: {
      Origin: ISSUER,
      "Sec-Fetch-Site": "same-origin",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ handoff: token }),
  });
}

function assertNoAuthority(response, state, status, sessionCount = 0) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.headers.get("set-cookie"), null);
  if (state) assert.equal(state.sessions.length, sessionCount);
}

test("batch insert exception rolls back consumption; a fresh retry can succeed", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload);
  const env = { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET };
  state.insertFailure = true;
  const failure = await handleAiIdentityRequest(consumeRequest(token, ISSUER, "text/html"), env);
  assertNoAuthority(failure, state, 403);
  assert.equal(state.row.state, "ISSUED");
  assert.equal(state.row.session_hash, null);
  assert.equal(state.row.consumed_at, null);
  state.insertFailure = false;
  const retry = await handleAiIdentityRequest(consumeRequest(token), env);
  assert.equal(retry.status, 200);
  assert.equal(state.sessions.length, 1);
  assert.equal(state.row.state, "CONSUMED");
});

test("missing batch capability is unavailable without consuming the proof", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload);
  delete db.batch;
  const response = await handleAiIdentityRequest(consumeRequest(token), {
    IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET,
  });
  assertNoAuthority(response, state, 503);
  assert.equal((await response.json()).code, "AUTHENTICATION_UNAVAILABLE");
  assert.equal(state.updates, 0);
});

test("every malformed, unsuccessful or zero-change batch result denies without cookie or redirect", async (t) => {
  const good = () => ({ success: true, meta: { changes: 1 } });
  const cases = [
    ["undefined", undefined],
    ["null", null],
    ["object", { 0: good(), 1: good(), length: 2 }],
    ["empty", []],
    ["short", [good()]],
    ["extra", [good(), good(), good()]],
    ["sparse", new Array(2)],
    ["sparse insert", [good(), ,]],
    ["failed consume", [{ success: false, meta: { changes: 1 } }, good()]],
    ["failed insert", [good(), { success: false, meta: { changes: 1 } }]],
    ["zero consume", [{ success: true, meta: { changes: 0 } }, good()]],
    ["zero insert", [good(), { success: true, meta: { changes: 0 } }]],
    ["missing success", [good(), { meta: { changes: 1 } }]],
    ["missing metadata", [good(), { success: true }]],
    ["string count", [good(), { success: true, meta: { changes: "1" } }]],
    ["extra changes", [good(), { success: true, meta: { changes: 2 } }]],
    ["null entry", [good(), null]],
    ["throwing getter", [good(), { get success() { throw new Error("fixture"); } }]],
  ];
  for (const [name, result] of cases) await t.test(name, async () => {
    const now = Math.floor(Date.now() / 1000);
    const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
    const { db, state } = createIdentityDb(payload);
    db.batch = async () => result;
    const response = await handleAiIdentityRequest(consumeRequest(token, ISSUER, "text/html"), {
      IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET,
    });
    assertNoAuthority(response, state, 403);
    assert.equal(state.row.state, "ISSUED");
  });
});

test("batch transport exception never returns authority", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload);
  db.batch = async () => { throw new Error("TEST_FIXTURE_ONLY ambiguous transport failure"); };
  const response = await handleAiIdentityRequest(consumeRequest(token), {
    IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET,
  });
  assertNoAuthority(response, state, 403);
});

test("ambiguous response loss after commit denies and never reopens a consumed proof", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload);
  const batch = db.batch;
  db.batch = async (statements) => {
    await batch(statements);
    throw new Error("TEST_FIXTURE_ONLY committed but response lost");
  };
  const env = { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET };
  const response = await handleAiIdentityRequest(consumeRequest(token, ISSUER, "text/html"), env);
  assertNoAuthority(response, state, 403, 1);
  assert.equal(state.row.state, "CONSUMED");
  db.batch = batch;
  const retry = await handleAiIdentityRequest(consumeRequest(token), env);
  assertNoAuthority(retry, state, 403, 1);
});

test("wrong issuer origin and missing verifier fail closed before issuing an .ai session", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload);

  const wrongOrigin = await handleAiIdentityRequest(
    consumeRequest(token, "https://dualiscapax.ai"),
    { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET },
  );
  assertNoAuthority(wrongOrigin, state, 403);
  assert.equal(state.selects, 0);

  const missingVerifier = await handleComIdentityRequest(
    new Request(`${ISSUER}/auth/config`, { method: "GET" }),
    {},
  );
  assertNoAuthority(missingVerifier, null, 503);
  assert.equal((await missingVerifier.json()).code, "AUTHENTICATION_UNAVAILABLE");
});

test("caller callbacks and client booleans do not count as server verification", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload);
  const response = await handleAiIdentityRequest(
    consumeJsonRequest({
      handoff: token,
      verified: true,
      serverVerified: true,
      assertionVerified: true,
      trinityAllowed: true,
    }),
    { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET },
  );
  assertNoAuthority(response, state, 403);
  assert.equal(state.selects, 0);
  assert.equal(state.updates, 0);
});

test("missing durable proof-store migration is unavailable and creates no session", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload, { proofStore: false });
  const response = await handleAiIdentityRequest(
    consumeRequest(token),
    { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET },
  );
  assertNoAuthority(response, state, 503);
  assert.equal((await response.json()).code, "AUTHENTICATION_UNAVAILABLE");
  assert.equal(state.selects, 0);
  assert.equal(state.updates, 0);
});

test("missing receiver binding fails closed without session or redirect", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload);
  const response = await handleAiIdentityRequest(
    consumeRequest(token),
    { IDENTITY_DB: db },
  );
  assertNoAuthority(response, state, 503);
  assert.equal((await response.json()).code, "AUTHENTICATION_UNAVAILABLE");
  assert.equal(state.selects, 0);
  assert.equal(state.updates, 0);
  assert.equal(state.sessions.length, 0);
});

test("legacy handoff rows are never used when the v2 proof row is missing", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload, {
    includeV2Record: false,
    includeLegacyRecord: true,
  });
  const response = await handleAiIdentityRequest(
    consumeRequest(token),
    { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET },
  );
  assertNoAuthority(response, state, 403);
  assert.equal(state.legacyReads, 0);
  assert.equal(state.legacyWrites, 0);
});

test("signed proof rejects wrong audience, issuer origin, RP ID, action, and request binding", async (t) => {
  const now = Math.floor(Date.now() / 1000);
  const badClaims = [
    ["wrong audience", { aud: "https://attacker.example.test" }],
    ["wrong issuer origin", { origin: "https://attacker.example.test" }],
    ["wrong RP ID", { rp_id: "attacker.example.test" }],
    ["wrong target", { target_origin: "https://attacker.example.test" }],
    ["unknown internal destination path", { target_path: "/holographic-core/v2/unknown" }],
    ["external destination URL", { target_path: "https://attacker.example.test/" }],
    ["wrong action", { action: "IRIS_COMPUTE" }],
    ["malformed request ID", { request_id: "client-controlled" }],
  ];
  for (const [name, claims] of badClaims) {
    await t.test(name, async () => {
      const { token } = await makeHandoff({ iat: now, exp: now + 30, claims });
      const { db, state } = createIdentityDb();
      const response = await handleAiIdentityRequest(
        consumeRequest(token),
        { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET },
      );
      assertNoAuthority(response, state, 403);
      assert.equal(state.selects, 0);
    });
  }
});

test("D1 proof row mismatch and malformed assertion binding fail closed", async (t) => {
  const now = Math.floor(Date.now() / 1000);
  await t.test("stored request ID does not match signed proof", async () => {
    const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
    const { db, state } = createIdentityDb(payload, { rowChanges: { request_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" } });
    const response = await handleAiIdentityRequest(
      consumeRequest(token),
      { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET },
    );
    assertNoAuthority(response, state, 403);
    assert.equal(state.updates, 0);
  });
  await t.test("stored principal does not match the signed subject", async () => {
    const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
    const { db, state } = createIdentityDb(payload, { rowChanges: { subject_id: "different-principal" } });
    const response = await handleAiIdentityRequest(
      consumeRequest(token),
      { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET },
    );
    assertNoAuthority(response, state, 403);
    assert.equal(state.updates, 0);
  });
  await t.test("stored destination path does not match the signed proof", async () => {
    const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
    const { db, state } = createIdentityDb(payload, {
      rowChanges: { target_path: "/holographic-core/v2/unknown" },
    });
    const response = await handleAiIdentityRequest(
      consumeRequest(token),
      { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET },
    );
    assertNoAuthority(response, state, 403);
    assert.equal(state.updates, 0);
  });
  await t.test("malformed assertion digest", async () => {
    const { token } = await makeHandoff({
      iat: now,
      exp: now + 30,
      claims: { assertion_digest: "not-a-digest" },
    });
    const { db, state } = createIdentityDb();
    const response = await handleAiIdentityRequest(
      consumeRequest(token),
      { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET },
    );
    assertNoAuthority(response, state, 403);
    assert.equal(state.selects, 0);
  });
  await t.test("persisted proof already expired", async () => {
    const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
    const { db, state } = createIdentityDb(payload, { rowChanges: { expires_at: Date.now() - 1 } });
    const response = await handleAiIdentityRequest(
      consumeRequest(token),
      { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET },
    );
    assertNoAuthority(response, state, 403);
    assert.equal(state.updates, 0);
  });
});

test("expired signed handoff is rejected before persistence lookup or session creation", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now - 61, exp: now - 1 });
  const { db, state } = createIdentityDb(payload);

  const response = await handleAiIdentityRequest(
    consumeRequest(token),
    { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET },
  );
  assertNoAuthority(response, state, 403);
  assert.equal(state.selects, 0);
});

test("valid handoff is atomically consumed once; replay is denied and creates no second session", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload);
  const env = { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET };

  const first = await handleAiIdentityRequest(consumeRequest(token), env);
  assert.equal(first.status, 200);
  assert.match(first.headers.get("set-cookie") ?? "", /__Host-dc_ai_session=.*Secure; HttpOnly; SameSite=Lax; Path=\//);
  assert.deepEqual(await first.json(), { ok: true, status: "GRANTED" });
  assert.equal(state.sessions.length, 1);
  assert.equal(state.row.state, "CONSUMED");
  assert.notEqual(state.row.consumed_at, null);
  assert.equal(state.legacyReads, 0);
  assert.equal(state.legacyWrites, 0);

  const replay = await handleAiIdentityRequest(consumeRequest(token), env);
  assertNoAuthority(replay, state, 403, 1);
});

test("concurrent valid handoff submissions create at most one session", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload);
  const env = { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET };

  const responses = await Promise.all([
    handleAiIdentityRequest(consumeRequest(token), env),
    handleAiIdentityRequest(consumeRequest(token), env),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 403]);
  assertNoAuthority(responses.find((response) => response.status === 403), state, 403, 1);
  assert.equal(state.updates, 2, "each contender must reach the atomic conditional update");
  assert.equal(state.sessions.length, 1);
});

test("issuer can revoke a v2 proof and the receiver then denies it", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload);
  const env = { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET };

  const revoked = await handleComIdentityRequest(revokeRequest(token), env);
  assert.equal(revoked.status, 200);
  assert.equal(state.row.state, "REVOKED");
  assert.equal(state.legacyReads, 0);
  assert.equal(state.legacyWrites, 0);

  const response = await handleAiIdentityRequest(consumeRequest(token), env);
  assertNoAuthority(response, state, 403);
});

test("browser handoff POST consumes once and redirects to the protected 3D world", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { payload, token } = await makeHandoff({ iat: now, exp: now + 30 });
  const { db, state } = createIdentityDb(payload);
  const env = { IDENTITY_DB: db, IDENTITY_HANDOFF_SECRET: SECRET };

  const first = await handleAiIdentityRequest(
    consumeRequest(token, ISSUER, "text/html"),
    env,
  );
  assert.equal(first.status, 303);
  assert.equal(first.headers.get("location"), "/holographic-core/v2/");
  assert.match(first.headers.get("set-cookie") ?? "", /__Host-dc_ai_session=/);
  assert.equal(state.sessions.length, 1);

  const replay = await handleAiIdentityRequest(
    consumeRequest(token, ISSUER, "text/html"),
    env,
  );
  assertNoAuthority(replay, state, 403, 1);
  assert.equal(state.sessions.length, 1);
});
