const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadConfig(search, origin = "https://dualiscapax.ai", initialBase) {
  const calls = [];
  const window = { location: { origin, search, pathname: "/playground.html" } };
  if (initialBase) window.DC_API_BASE = initialBase;
  const context = {
    window, location: window.location, URL, URLSearchParams, Promise, String, Date, Math,
    fetch: async (url, options) => {
      calls.push({ url: String(url), options });
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    }
  };
  vm.runInNewContext(fs.readFileSync("js/api-config.js", "utf8"), context);
  window.calls = calls;
  return window;
}

function loadWorld(search, origin = "https://dualiscapax.ai", initialBase) {
  const calls = [];
  const window = { location: { origin, search, pathname: "/playground.html" } };
  if (initialBase) window.DC_API_BASE = initialBase;
  const context = {
    window, location: window.location, URL, URLSearchParams, Promise, String, Date, Math,
    fetch: async (url) => {
      calls.push(String(url));
      return { status: 200, json: async () => ({ ok: true }) };
    }
  };
  vm.runInNewContext(fs.readFileSync("js/api-world.js", "utf8"), context);
  return { window, calls };
}

(async function () {
  const trusted = "https://dualiscapax-depth.digenova77.workers.dev";
  assert.equal(loadConfig("?api=https%3A%2F%2Fevil.example").DC_API_BASE, trusted);
  assert.equal(loadConfig("?api=%2Fapi").DC_API_BASE, "https://dualiscapax.ai/api");
  assert.equal(loadConfig("?api=https%3A%2F%2Fdualiscapax-depth.digenova77.workers.dev").DC_API_BASE, trusted);
  assert.equal(loadConfig("", "https://dualiscapax.ai", "https://evil.example").DC_API_BASE, trusted);
  const preconfigured = loadWorld("", "https://dualiscapax.ai", "https://evil.example");
  await preconfigured.window.DCWorld.chat([{ role: "user", content: "test" }]);
  assert.equal(preconfigured.calls[0], trusted + "/v2/chat", "untrusted preconfigured API base must be rejected");
  const zero = loadConfig("?world=0");
  await zero.dcChatV2([{ role: "user", content: "ground-zero" }]);
  assert.equal(zero.calls[0].url, trusted + "/v1/chat");
  assert.equal(zero.calls[0].options.headers["X-DC-World"], "0");
  assert.equal(JSON.parse(zero.calls[0].options.body).world, 0, "World 0 must remain zero in the request body");
  assert.equal(JSON.parse(zero.calls[0].options.body).api_version, "1");
  const rejected = loadWorld("?api=https%3A%2F%2Fevil.example");
  await rejected.window.DCWorld.chat([{ role: "user", content: "test" }]);
  assert.equal(rejected.calls[0], trusted + "/v2/chat", "untrusted query URL must not receive chat payload");
  assert.equal(rejected.window.DCWorld.world, 1);
  rejected.window.DCWorld.apply(0);
  assert.equal(rejected.window.DCWorld.world, 0);
  assert.equal(rejected.window.DCWorld.path, "/v1/chat");
  await rejected.window.DCWorld.chat([{ role: "user", content: "after switch" }]);
  assert.equal(rejected.calls[1], trusted + "/v1/chat", "switching world must change actual request route");
  const sameOrigin = loadWorld("?api=%2Fapi");
  await sameOrigin.window.DCWorld.chat([{ role: "user", content: "test" }]);
  assert.equal(sameOrigin.calls[0], "https://dualiscapax.ai/api/v2/chat", "same-origin override remains supported");
  const trustedOverride = loadWorld("?api=https%3A%2F%2Fdualiscapax-depth.digenova77.workers.dev");
  await trustedOverride.window.DCWorld.chat([{ role: "user", content: "test" }]);
  assert.equal(trustedOverride.calls[0], trusted + "/v2/chat");
  console.log("API origin guard tests: 6 assertions passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
