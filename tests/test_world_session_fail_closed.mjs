import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const page = fs.readFileSync(new URL("../website-packages/unified-frontend/world.html", import.meta.url), "utf8");
const scripts = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const source = scripts.at(-1)?.[1];
assert.ok(source, "world page must contain its inline door-check script");

function harness({ verifyStatus = 404, verifyBody = { valid: false }, token = "test-session" } = {}) {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        textContent: "",
        classList: { remove() {}, add() {} },
      });
    }
    return elements.get(id);
  }
  const calls = [];
  const document = { getElementById: element };
  const sessionStorage = { getItem(key) { return key === "uf_session_token" ? token : null; } };
  const location = { hostname: "example.test" };
  async function fetch(url) {
    calls.push(String(url));
    if (String(url).endsWith("/api/session/verify")) {
      return { ok: verifyStatus >= 200 && verifyStatus < 300, status: verifyStatus, async json() { return verifyBody; } };
    }
    return { ok: true, status: 200, async json() { return { entries: 0 }; } };
  }
  const context = {
    document, sessionStorage, location, fetch,
    setTimeout(fn) { return { fn }; }, clearTimeout() {},
    String, Object, Error, Promise, JSON, Array,
  };
  vm.runInNewContext(source, context, { filename: "website-packages/unified-frontend/world.html" });
  return { elements, calls };
}

test("HTTP 404 with valid:false is UNKNOWN, not a claim that the session ended", async () => {
  const h = harness({ verifyStatus: 404, verifyBody: { valid: false, reason_class: "not_found" } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.elements.get("door-title").textContent, "Your session cannot be checked from here.");
  assert.match(h.elements.get("door-out").textContent, /UNKNOWN/);
  assert.ok(!h.elements.get("door-out").textContent.includes("session has ended"));
});

test("a successful verifier response with valid:false means the session has ended", async () => {
  const h = harness({ verifyStatus: 200, verifyBody: { valid: false, reason_class: "expired" } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.elements.get("door-title").textContent, "This session has ended.");
});

test("session verification uses the same-origin configured route and no token in URL", async () => {
  const h = harness();
  await new Promise((resolve) => setImmediate(resolve));
  const call = h.calls.find((url) => url.endsWith("/api/session/verify"));
  assert.equal(call, "/api/session/verify");
  assert.ok(!call.includes("test-session"));
});
