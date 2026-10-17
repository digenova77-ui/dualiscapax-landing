const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("js/api-unified.js", "utf8");
const TRUSTED = "https://dualiscapax-depth.digenova77.workers.dev";

function makeClient({ search = "", base = TRUSTED, fetchImpl, timeoutImmediately = false } = {}) {
  const calls = [];
  const win = {
    URL,
    URLSearchParams,
    AbortController,
    Date,
    Math,
    crypto: { randomUUID: () => "test-request-id" },
    location: { origin: "https://dualiscapax.ai", search },
    performance: { now: () => 1 },
    DC_API_BASE: base,
    setTimeout(fn) {
      if (timeoutImmediately) {
        fn();
        return 99;
      }
      return setTimeout(fn, 15000);
    },
    clearTimeout(id) {
      if (!timeoutImmediately) clearTimeout(id);
    },
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (fetchImpl) return fetchImpl(url, options);
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, text: "fixture response" })
      };
    }
  };
  vm.runInNewContext(source, {
    window: win,
    URL,
    URLSearchParams,
    AbortController,
    Date,
    Math,
    crypto: win.crypto,
    setTimeout,
    clearTimeout,
    Promise,
    Error,
    Object,
    String,
    Array
  });
  return { api: win.dcApi, win, calls };
}

test("untrusted ?api= destination cannot receive a prompt", async () => {
  const client = makeClient({ search: "?api=https%3A%2F%2Fevil.example" });
  await client.api.chat([{ role: "user", content: "private prompt" }]);
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].url, TRUSTED + "/v2/chat");
  assert.equal(client.calls[0].url.includes("evil.example"), false);
});

test("URL credentials, paths, query strings, and fragments are not accepted as API bases", async () => {
  for (const bad of [
    "https://user:pass@dualiscapax-depth.digenova77.workers.dev",
    "https://dualiscapax-depth.digenova77.workers.dev/attacker-path",
    "https://dualiscapax-depth.digenova77.workers.dev/?next=https://evil.example",
    "https://dualiscapax-depth.digenova77.workers.dev/#fragment"
  ]) {
    const client = makeClient({ search: "?api=" + encodeURIComponent(bad) });
    await client.api.chat([{ role: "user", content: "prompt" }]);
    assert.equal(client.calls[0].url, TRUSTED + "/v2/chat", bad);
  }
});

test("same-origin and trusted API origin are allowed, but credentials are omitted", async () => {
  const client = makeClient({ search: "?api=" + encodeURIComponent("https://dualiscapax.ai") });
  await client.api.chat([{ role: "user", content: "prompt" }]);
  assert.equal(client.calls[0].url, "https://dualiscapax.ai/v2/chat");
  assert.equal(client.calls[0].options.credentials, "omit");
  assert.equal(client.calls[0].options.redirect, "error");
  assert.ok(client.calls[0].options.signal);
});

test("non-2xx responses cannot be reported as successful even if body says ok", async () => {
  const client = makeClient({
    fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({ ok: true, text: "not a valid success" }) })
  });
  const result = await client.api.chat([{ role: "user", content: "prompt" }]);
  assert.equal(result.ok, false);
  assert.equal(result._http, 503);
  assert.equal(result.code, "HTTP_ERROR");
});

test("malformed JSON is converted to a bounded structured failure", async () => {
  const client = makeClient({
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new Error("bad json"); } })
  });
  const result = await client.api.chat([{ role: "user", content: "prompt" }]);
  assert.equal(result.ok, false);
  assert.equal(result.code, "BAD_JSON");
});

test("API request timeout is surfaced with a stable error code", async () => {
  const client = makeClient({
    timeoutImmediately: true,
    fetchImpl: () => new Promise(() => {})
  });
  await assert.rejects(client.api.chat([{ role: "user", content: "prompt" }]), (error) => error.code === "API_TIMEOUT");
});

test("invalid configured base falls back to the fixed trusted API origin", async () => {
  const client = makeClient({ base: "https://evil.example" });
  await client.api.health();
  assert.equal(client.calls[0].url, TRUSTED + "/health");
});
