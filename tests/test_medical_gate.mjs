import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../js/medical-gate.js", import.meta.url), "utf8");
const healthcarePage = fs.readFileSync(new URL("../research/healthcare/index.html", import.meta.url), "utf8");
const lockedPage = fs.readFileSync(new URL("../research/healthcare/locked.html", import.meta.url), "utf8");

function harness() {
  const values = new Map();
  const sessionStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
  const document = {
    readyState: "complete",
    documentElement: { classList: { add() {} }, getAttribute() { return null; } },
    getElementById() { return null; },
    addEventListener() {},
  };
  const location = { pathname: "/research/healthcare/", replace() { throw new Error("unexpected-redirect"); } };
  let networkCalls = 0;
  const window = {};
  vm.runInNewContext(source, { window, document, sessionStorage, location, fetch: async () => { networkCalls++; } }, { filename: "js/medical-gate.js" });
  return { api: window.DC_MEDICAL, values, getNetworkCalls: () => networkCalls };
}

test("SEAL ranking marks require exact allowlisted values, not prefix-shaped strings", () => {
  const h = harness();
  assert.equal(h.api.decide("visitor@example.com", "SEAL-1").ok, true);
  assert.equal(h.api.decide("visitor@example.com", "SEAL-T1").ok, true);
  assert.equal(h.api.decide("visitor@example.com", "DC-SEAL-1").ok, true);
  assert.equal(h.api.decide("visitor@example.com", "SEAL-1-FAKE").ok, false);
  assert.equal(h.api.decide("visitor@example.com", "SEAL-1/attacker").ok, false);
  assert.equal(h.api.decide("visitor@example.com", "DC-SEAL-1BOGUS").ok, false);
});

test("local domain classification never elevates to seat, Iris, or economic authority", () => {
  const h = harness();
  const result = h.api.decide("worker@sample.org", "");
  assert.equal(result.ok, true);
  assert.equal(result.state, "CLIENT_LOCAL_UI_MARK");
  assert.equal(result.claim_authority, "CLAIM_ONLY");
  assert.equal(result.authority_effect, "NONE");
  assert.equal(result.seat_authority, false);
  assert.equal(result.iris_kernel_authorized, false);
  assert.equal(result.economic_authority, false);
  assert.equal(h.getNetworkCalls(), 0);
});

test("email and organization names are not persisted in the local demo session", () => {
  const h = harness();
  const result = h.api.open("private.person@hospital.org", "Private Health Organization", "");
  assert.equal(result.ok, true);
  assert.equal("email" in result, false);
  assert.equal("org" in result, false);
  const raw = [...h.values.values()].join("\n");
  assert.equal(raw.includes("private.person"), false);
  assert.equal(raw.includes("Private Health Organization"), false);
  assert.equal(raw.includes("hospital.org"), true);
});

test("healthcare pages disclose local-demo limitations and disable form autocomplete", () => {
  for (const page of [healthcarePage, lockedPage]) {
    assert.match(page, /does not verify ownership of an email domain/);
    assert.match(page, /not access control/);
    assert.match(page, /Do not enter sensitive personal or health information/);
    assert.match(page, /id="med-form" autocomplete="off"/);
  }
});
