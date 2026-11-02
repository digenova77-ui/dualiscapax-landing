/**
 * /v1/authorize — authenticated-session identity tests.
 *
 * The handler must authenticate the caller from the identity issuer's
 * session (the __Host-dc_ai_session cookie, stored server-side as a
 * SHA-256 hash in env.IDENTITY_DB) and must never treat a
 * body-supplied principal.unity_id as authentication on its own.
 *
 * Against the ORIGINAL handler these tests fail: it authorized a
 * request carrying a valid HMAC and a self-declared unity_id with no
 * session at all. Against the fixed handler they pass.
 *
 * Run: node --test tests/authorize-session-identity.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import worker from "../_worker.js";

const SECRET = "test-signing-secret";
const SUBJECT = "unity-subject-a";
const OTHER = "unity-subject-b";
const SESSION_ID = "test-session-id-000000000000000000000000000a";

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const SESSION_HASH = sha256(SESSION_ID);

// In-memory stand-in for the identity store (D1-shaped): rows keyed by
// session_hash, honouring expiry and revocation like the issuer's SQL.
function makeIdentityDb(rows) {
  return {
    prepare() {
      return {
        bind(hash, now) {
          return {
            async first() {
              const row = rows.get(hash);
              if (!row || row.expires_at <= now || row.revoked_at !== null) return null;
              return { subject_id: row.subject_id, expires_at: row.expires_at };
            },
          };
        },
      };
    },
  };
}

function liveSessionDb() {
  return makeIdentityDb(new Map([
    [SESSION_HASH, { subject_id: SUBJECT, expires_at: Date.now() + 3_600_000, revoked_at: null }],
  ]));
}

function stubNamespace(responder) {
  return {
    idFromName: (name) => name,
    get: () => ({ fetch: async (url, opts) => responder(url, opts) }),
  };
}

function makeEnv({ identityDb } = {}) {
  const env = {
    ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
    SIGNING_SECRET: SECRET,
    RATE_LIMITER: stubNamespace(async () =>
      Response.json({ allowed: true, remaining: 9, resetAt: Date.now() + 60_000 })),
    AUDIT_LOG: stubNamespace(async (url) =>
      url.includes("/claim")
        ? Response.json({ claimed: true, claimed_at: new Date().toISOString() })
        : Response.json({ ok: true })),
  };
  if (identityDb !== undefined) env.IDENTITY_DB = identityDb;
  return env;
}

let seq = 0;
function authorizeRequest({ body = {}, cookie, omitPrincipal = false } = {}) {
  const text = "hello";
  const fullBody = {
    request_id: `req-${++seq}`,
    action: "iris.turn.look",
    input_sha256: sha256(text),
    compute_lane: "look",
    memory_requested: false,
    text,
    ...body,
  };
  if (omitPrincipal) delete fullBody.principal;
  else if (!("principal" in fullBody)) fullBody.principal = { unity_id: SUBJECT };
  const bodyText = JSON.stringify(fullBody);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", SECRET).update(`${timestamp}.${bodyText}`).digest("hex");
  const headers = {
    "content-type": "application/json",
    "x-timestamp": timestamp,
    "x-signature": signature,
  };
  if (cookie) headers.cookie = cookie;
  return new Request("https://example.com/v1/authorize", {
    method: "POST",
    headers,
    body: bodyText,
  });
}

const sessionCookie = `__Host-dc_ai_session=${SESSION_ID}`;

test("valid HMAC + self-declared unity_id but NO session is refused", async () => {
  const res = await worker.fetch(authorizeRequest(), makeEnv({ identityDb: liveSessionDb() }));
  const data = await res.json();
  assert.equal(res.status, 401);
  assert.equal(data.reason, "session-required");
  assert.equal(data.authorized, false);
});

test("session subject cannot be overridden by body.principal.unity_id", async () => {
  const req = authorizeRequest({ body: { principal: { unity_id: OTHER } }, cookie: sessionCookie });
  const res = await worker.fetch(req, makeEnv({ identityDb: liveSessionDb() }));
  const data = await res.json();
  assert.equal(res.status, 403);
  assert.equal(data.reason, "principal-mismatch");
  assert.equal(data.authorized, false);
});

test("live session + matching principal is allowed, principal is the session subject", async () => {
  const res = await worker.fetch(
    authorizeRequest({ cookie: sessionCookie }),
    makeEnv({ identityDb: liveSessionDb() })
  );
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.authorized, true);
  assert.equal(data.principal.unity_id, SUBJECT);
});

test("live session alone (no principal in body) is allowed as the session subject", async () => {
  const res = await worker.fetch(
    authorizeRequest({ cookie: sessionCookie, omitPrincipal: true }),
    makeEnv({ identityDb: liveSessionDb() })
  );
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.principal.unity_id, SUBJECT);
});

test("unknown or expired session cookie is refused", async () => {
  const req = authorizeRequest({ cookie: "__Host-dc_ai_session=not-a-real-session-id-000000000" });
  const res = await worker.fetch(req, makeEnv({ identityDb: liveSessionDb() }));
  const data = await res.json();
  assert.equal(res.status, 401);
  assert.equal(data.reason, "session-required");
});

test("no identity store bound fails closed instead of trusting the body", async () => {
  const res = await worker.fetch(
    authorizeRequest({ cookie: sessionCookie }),
    makeEnv({ identityDb: undefined })
  );
  const data = await res.json();
  assert.equal(res.status, 503);
  assert.equal(data.reason, "session-store-unavailable");
  assert.equal(data.authorized, false);
});

// ---------------------------------------------------------------------------
// Browser helper: HMAC header alignment with the Worker
// ---------------------------------------------------------------------------

function loadHelper({ signerHook } = {}) {
  const calls = [];
  const sandbox = {
    console,
    TextEncoder,
    crypto: globalThis.crypto,
    setTimeout,
    clearTimeout,
    fetch: async (url, opts) => {
      calls.push({ url, opts });
      return { status: 200, ok: true, json: async () => ({ authorized: true }) };
    },
  };
  sandbox.window = sandbox;
  sandbox.IrisAuthorizeBase = "https://example.com";
  if (signerHook) sandbox.IrisRequestSigner = signerHook;
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(new URL("../js/iris-authorize.js", import.meta.url), "utf8"), sandbox);
  return { helper: sandbox.IrisAuthorize, calls };
}

test("helper production path attaches the Worker's HMAC headers and the session cookie channel", async () => {
  const { helper, calls } = loadHelper({
    signerHook: async () => ({ timestamp: "1700000000", signature: "ab12cd" }),
  });
  const body = { request_id: "r1", action: "iris.turn.look" };
  await helper.authorizeProduction(body);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].opts.headers["x-timestamp"], "1700000000");
  assert.equal(calls[0].opts.headers["x-signature"], "ab12cd");
  assert.equal(calls[0].opts.credentials, "same-origin");
});
