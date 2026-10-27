"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "api-unified.js"), "utf8");

function makeClient({ base = "https://api.example.test", timings = [10, 11], response = { ok: true, status: "OK" } } = {}) {
  let timingIndex = 0;
  let request = null;
  const sandbox = {
    URLSearchParams,
    URL,
    TextEncoder,
    location: { search: "" },
    performance: { now: () => timings[Math.min(timingIndex++, timings.length - 1)] },
    fetch: async (url, opts) => {
      request = { url, opts };
      return { status: 200, json: async () => ({ ...response }) };
    },
    console,
  };
  sandbox.window = sandbox;
  sandbox.DC_API_BASE = base;
  sandbox.crypto = { randomUUID: () => "test-uuid" };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "js/api-unified.js" });
  return { api: sandbox.dcApi, sandbox, getRequest: () => request };
}

test("missing API base fails closed without making a request", async () => {
  const client = makeClient({ base: "" });
  const result = await client.api.health();
  assert.equal(result.ok, false);
  assert.equal(result.status, "FAIL_CLOSED_NO_BASE");
  assert.equal(result.code, "NO_BASE");
  assert.equal(client.getRequest(), null);
});

test("client records elapsed request time and flags a request at the 4.20 ms threshold", async () => {
  const client = makeClient({ timings: [100, 104.2] });
  const result = await client.api.health();
  assert.equal(result.circuit_breaker_latency_ms, 4.2);
  assert.equal(result.circuit_note, "client_observed_over_sla");
});

test("client does not flag a request below the 4.20 ms threshold", async () => {
  const client = makeClient({ timings: [100, 104.19] });
  const result = await client.api.health();
  assert.equal(result.circuit_breaker_latency_ms, 4.19);
  assert.equal(result.circuit_note, undefined);
});

test("wrap request sends configured residual target as a policy parameter, not a measured result", async () => {
  const client = makeClient({ timings: [0, 1] });
  await client.api.wrap({ model: "test-model", messages: [{ role: "user", content: "test" }] });
  const request = client.getRequest();
  assert.match(request.url, /\/v2\/dclm\/inference\/wrap$/);
  const body = JSON.parse(request.opts.body);
  assert.equal(body.confinement_rules.target_residual_floor, 4.18e-13);
  assert.equal(body.confinement_rules.fail_closed_on_drift, true);
});

test("sandbox execute sends a sandbox request and preserves caller text", async () => {
  const client = makeClient({ timings: [0, 1] });
  await client.api.sandboxExecute({ text: "diamond-test", voice: "citizen", case_id: "case-1" });
  const body = JSON.parse(client.getRequest().opts.body);
  assert.equal(client.getRequest().url, "https://api.example.test/v2/dclm/sandbox/execute");
  assert.equal(body.text, "diamond-test");
  assert.equal(body.voice, "citizen");
  assert.equal(body.case_id, "case-1");
});

test("purge clears the client-side session token after the request resolves", async () => {
  const client = makeClient({ timings: [0, 1] });
  client.sandbox.DC_SESSION = "session-test";
  await client.api.purge();
  assert.equal(client.sandbox.DC_SESSION, "");
  assert.equal(JSON.parse(client.getRequest().opts.body).session_token, "session-test");
});
