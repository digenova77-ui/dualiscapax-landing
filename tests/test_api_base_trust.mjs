import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const configSource = fs.readFileSync(new URL("../js/api-config.js", import.meta.url), "utf8");
const unifiedSource = fs.readFileSync(new URL("../js/api-unified.js", import.meta.url), "utf8");

test("api-config ignores URL api override and keeps deployment-configured origin", () => {
  const window = { DC_API_BASE: "https://trusted.example" };
  vm.runInNewContext(configSource, {
    window,
    location: { search: "?api=https%3A%2F%2Fevil.example&world=0" },
    URLSearchParams,
    String,
    Math,
    Date,
    crypto: { randomUUID: () => "test-id" },
  });
  assert.equal(window.DC_API_BASE, "https://trusted.example");
  assert.equal(window.DC_API_PATH, "/v1/chat");
});

test("api-unified never sends session or fuel headers to a query-selected origin", async () => {
  const captured = [];
  const window = {
    DC_API_BASE: "https://trusted.example",
    DC_SESSION: "client-correlation-only",
    performance: { now: () => 1 },
    crypto: { randomUUID: () => "test-id" },
  };
  const context = {
    window,
    location: { search: "?api=https%3A%2F%2Fevil.example" },
    URLSearchParams,
    URL,
    String,
    Math,
    Date,
    performance: window.performance,
    crypto: window.crypto,
    fetch: async (url, options) => {
      captured.push({ url: String(url), headers: options.headers });
      return { status: 200, json: async () => ({ ok: true }) };
    },
  };
  vm.runInNewContext(unifiedSource, context);
  await window.dcApi.health();
  assert.equal(captured.length, 1);
  assert.equal(captured[0].url, "https://trusted.example/health");
  assert.equal(captured[0].headers["X-DC-Session"], "client-correlation-only");
  assert.equal(captured[0].url.includes("evil.example"), false);
});
