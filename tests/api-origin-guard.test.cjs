const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadConfig(search, origin = "https://dualiscapax.ai") {
  const window = { location: { origin, search, pathname: "/playground.html" } };
  const context = { window, location: window.location, URL, URLSearchParams, Promise, String, Date, Math };
  vm.runInNewContext(fs.readFileSync("js/api-config.js", "utf8"), context);
  return window;
}

function loadWorld(search, origin = "https://dualiscapax.ai") {
  const window = { location: { origin, search, pathname: "/playground.html" } };
  const context = { window, location: window.location, URL, URLSearchParams, Promise, String, Date, Math };
  vm.runInNewContext(fs.readFileSync("js/api-world.js", "utf8"), context);
  return window;
}

const trusted = "https://dualiscapax-depth.digenova77.workers.dev";
assert.equal(loadConfig("?api=https%3A%2F%2Fevil.example").DC_API_BASE, trusted);
assert.equal(loadConfig("?api=https%3A%2F%2Fevil.example").DC_API_BASE, trusted);
assert.equal(loadConfig("?api=%2Fapi").DC_API_BASE, "https://dualiscapax.ai/api");
assert.equal(loadConfig("?api=https%3A%2F%2Fdualiscapax-depth.digenova77.workers.dev").DC_API_BASE, trusted);
assert.equal(loadWorld("?api=https%3A%2F%2Fevil.example").DCWorld.chat ? "loaded" : "missing", "loaded");
assert.equal(loadWorld("?api=https%3A%2F%2Fevil.example").DCWorld.version, "api-world-2026-10-17-origin-guard");
console.log("API origin guard tests: 6 assertions passed");
