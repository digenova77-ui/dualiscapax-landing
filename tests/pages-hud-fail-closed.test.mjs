import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../_worker.js", import.meta.url), "utf8")
  .replace("export default {", "globalThis.__pagesWorker = {");
const context = {
  URL, Request, Response, TextEncoder, Uint8Array,
  crypto: globalThis.crypto,
  fetch: async () => { throw new Error("HUD upstream must not be fetched by fallback"); },
  globalThis: {},
};
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "_worker.js" });
const worker = context.__pagesWorker;

function env() {
  const calls = [];
  return {
    calls,
    ASSETS: {
      async fetch(request) {
        calls.push(new URL(request.url).pathname);
        return new Response("public asset", { status: 200 });
      },
    },
  };
}

test("Pages fallback never serves HUD bytes without a verified session-gated route", async () => {
  const e = env();
  for (const path of [
    "/holographic-core/v2",
    "/holographic-core/v2/",
    "/holographic-core/v2/index.html",
    "/assets/holographic-hostess-40/hostess.svg",
  ]) {
    const response = await worker.fetch(new Request("https://dualiscapax.com" + path), e);
    assert.equal(response.status, 503, path);
    assert.equal(response.headers.get("x-dc-iris"), "session-gate-unverified", path);
    assert.match(await response.text(), /session-gated route unavailable/);
  }
  assert.deepEqual(e.calls, []);
});

test("Iris status reports HUD unavailable until the session-gated route is proven", async () => {
  const e = env();
  const response = await worker.fetch(new Request("https://dualiscapax.com/iris/status"), e);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.hud_available, false);
  assert.equal(body.reason, "session-gated-origin-route-not-verified");
});

test("ordinary public landing assets still pass through to Pages assets", async () => {
  const e = env();
  const response = await worker.fetch(new Request("https://dualiscapax.com/"), e);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "public asset");
  assert.deepEqual(e.calls, ["/"]);
});
