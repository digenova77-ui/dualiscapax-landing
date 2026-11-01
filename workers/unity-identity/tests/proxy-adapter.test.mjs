import { test } from "node:test";
import assert from "node:assert/strict";
import { proxyUnityIdentity } from "../proxy-adapter.mjs";

function request(path, { origin = "https://dualiscapax.com", cookie = "sid=secret", method = "POST", body = "{}" } = {}) {
  return new Request("https://dualiscapax.com/api/unity" + path, {
    method, headers: { origin, cookie, "content-type": "application/json" }, body: method === "POST" ? body : undefined,
  });
}

test("proxy forwards only allowed route and same-origin cookie", async () => {
  let seen;
  const binding = { fetch: async req => {
    seen = req;
    return new Response(JSON.stringify({ options: true }), { status: 200, headers: { "set-cookie": "__Host-unity_session=token; Secure; HttpOnly; Path=/; SameSite=Strict" } });
  } };
  const response = await proxyUnityIdentity(request("/register/options"), binding);
  assert.equal(response.status, 200);
  assert.equal(new URL(seen.url).pathname, "/register/options");
  assert.equal(seen.headers.get("origin"), "https://dualiscapax.com");
  assert.equal(seen.headers.get("cookie"), "sid=secret");
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
});

test("proxy rejects hostile origin before calling service", async () => {
  let calls = 0;
  const response = await proxyUnityIdentity(request("/register/options", { origin: "https://dualiscapax.com.attacker.invalid" }), { fetch: async () => { calls++; } });
  assert.equal(response.status, 403);
  assert.equal(calls, 0);
});

test("proxy fails closed when service binding is missing", async () => {
  const response = await proxyUnityIdentity(request("/check"), null);
  assert.equal(response.status, 503);
});

test("proxy allows only the explicit endpoint list", async () => {
  const response = await proxyUnityIdentity(request("/admin"), { fetch: async () => { throw new Error("must not call"); } });
  assert.equal(response.status, 404);
});

test("proxy rejects oversized request bodies", async () => {
  const response = await proxyUnityIdentity(request("/register/options", { body: JSON.stringify({ data: "x".repeat(17_000) }) }), { fetch: async () => { throw new Error("must not call"); } });
  assert.equal(response.status, 413);
});
