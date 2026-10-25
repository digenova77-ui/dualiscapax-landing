import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../js/iris-authorize.js", import.meta.url), "utf8");

function loadAuthorize({ href = "https://dualiscapax.com/app", base = "/api/iris", sessionToken = null } = {}) {
  const calls = [];
  const window = { location: { href }, IrisAuthorizeBase: base, sessionStorage: { getItem: (key) => key === "uf_session_token" ? sessionToken : null } };
  const context = {
    window,
    URL,
    TextEncoder,
    crypto: globalThis.crypto,
    setTimeout,
    clearTimeout,
    fetch: async (url, init) => {
      calls.push({ url, init });
      return { status: 200, ok: true, json: async () => ({ authorized: false }) };
    },
  };
  vm.runInNewContext(source, context, { filename: "js/iris-authorize.js" });
  return { authorize: window.IrisAuthorize, calls, window };
}

test("production authorize sends only to the same-origin HTTPS signer", async () => {
  const { authorize, calls } = loadAuthorize();
  const result = await authorize.authorizeProduction({ request_id: "same-origin" });
  assert.equal(result.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://dualiscapax.com/api/iris/v1/authorize");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.equal(calls[0].init.headers["x-signature"], undefined);
});

test("production authorize forwards the existing tab session token only to the same-origin proxy", async () => {
  const { authorize, calls } = loadAuthorize({ sessionToken: "opaque-session-token" });
  await authorize.authorizeProduction({ request_id: "session-forward" });
  assert.equal(calls[0].url, "https://dualiscapax.com/api/iris/v1/authorize");
  assert.equal(calls[0].init.headers["x-iris-session-token"], "opaque-session-token");
});

test("production authorize rejects a cross-origin signing base before network access", async () => {
  const { authorize, calls } = loadAuthorize({ base: "https://untrusted.example" });
  await assert.rejects(
    authorize.authorizeProduction({ request_id: "cross-origin" }),
    /authorize-cross-origin-denied/
  );
  assert.equal(calls.length, 0);
});

test("production authorize rejects insecure non-local origins", async () => {
  const { authorize, calls } = loadAuthorize({ href: "http://dualiscapax.com/app", base: "/api/iris" });
  await assert.rejects(
    authorize.authorizeProduction({ request_id: "insecure-origin" }),
    /authorize-insecure-origin-denied/
  );
  assert.equal(calls.length, 0);
});

test("production authorize permits localhost HTTP for local development", async () => {
  const { authorize, calls } = loadAuthorize({ href: "http://localhost:3000/app", base: "/api/iris" });
  const result = await authorize.authorizeProduction({ request_id: "local-dev" });
  assert.equal(result.status, 200);
  assert.equal(calls[0].url, "http://localhost:3000/api/iris/v1/authorize");
});
