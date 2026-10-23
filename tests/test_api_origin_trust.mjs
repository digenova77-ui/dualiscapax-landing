import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const configSource = fs.readFileSync(new URL("../js/api-config.js", import.meta.url), "utf8");
const worldSource = fs.readFileSync(new URL("../js/api-world.js", import.meta.url), "utf8");
const ATTACKER = "https://attacker.invalid";

function response() {
  return { ok: true, status: 200, async json() { return { ok: true, content: "fixture" }; } };
}

test("api-config ignores an untrusted ?api= origin and sends no prompt to it", async () => {
  const calls = [];
  const window = {};
  const context = {
    window,
    globalThis: window,
    location: { search: "?api=" + encodeURIComponent(ATTACKER) },
    URLSearchParams,
    fetch: async (url) => { calls.push(String(url)); return response(); },
    JSON, String, Error, Number,
  };
  vm.runInNewContext(configSource, context, { filename: "js/api-config.js" });

  await window.dcChatV2([{ role: "user", content: "private test prompt" }]);

  assert.equal(calls.length, 1);
  assert.equal(calls[0], "https://dualiscapax-depth.digenova77.workers.dev/v2/chat");
  assert.ok(calls.every((url) => !url.startsWith(ATTACKER)));
});

test("api-world ignores an untrusted ?api= origin and sends no prompt to it", async () => {
  const calls = [];
  const window = {};
  const context = {
    window,
    globalThis: window,
    location: { search: "?api=" + encodeURIComponent(ATTACKER) + "&world=1", pathname: "/iris.html" },
    URLSearchParams,
    fetch: async (url) => { calls.push(String(url)); return response(); },
    JSON, String, Error, Number, Object, RegExp,
  };
  vm.runInNewContext(worldSource, context, { filename: "js/api-world.js" });

  await window.DCWorld.chat([{ role: "user", content: "private test prompt" }]);

  assert.equal(calls.length, 1);
  assert.equal(calls[0], "https://dualiscapax-depth.digenova77.workers.dev/v2/chat");
  assert.ok(calls.every((url) => !url.startsWith(ATTACKER)));
});

test("trusted DC_API_BASE configuration remains available for controlled environments", async () => {
  const calls = [];
  const window = { DC_API_BASE: "https://staging.example.test" };
  const context = {
    window,
    globalThis: window,
    location: { search: "?api=" + encodeURIComponent(ATTACKER) },
    URLSearchParams,
    fetch: async (url) => { calls.push(String(url)); return response(); },
    JSON, String, Error, Number,
  };
  vm.runInNewContext(configSource, context, { filename: "js/api-config.js" });

  await window.dcChatV2([{ role: "user", content: "staging test" }]);

  assert.equal(calls[0], "https://staging.example.test/v2/chat");
  assert.ok(!calls[0].startsWith(ATTACKER));
});
