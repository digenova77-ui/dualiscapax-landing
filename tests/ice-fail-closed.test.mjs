import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const runBrowserScript = (file, elements = {}) => {
  const window = {};
  const document = {
    readyState: "complete",
    getElementById: (id) => elements[id] || null,
    querySelectorAll: () => [],
  };
  let networkCalls = 0;
  const context = { window, document, fetch: async () => { networkCalls++; throw new Error("unexpected-network-call"); } };
  vm.runInNewContext(read(file), context, { filename: file });
  return { window, document, getNetworkCalls: () => networkCalls };
};

function element() {
  return {
    disabled: false, hidden: true, title: "", textContent: "", attributes: {}, listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    setAttribute(name, value) { this.attributes[name] = value; },
  };
}

test("passkey adapter explicitly fails closed and never performs hidden authentication", async () => {
  const { window, getNetworkCalls } = runBrowserScript("js/dc-passkey.js");
  assert.equal(window.DC_Passkey.available, false);
  assert.equal(window.DC_Passkey.status, "unconfigured");
  assert.deepEqual({ ...(await window.DC_Passkey.verify()) }, { ok: false, available: false, reason: "passkey-verifier-not-configured" });
  assert.deepEqual({ ...(await window.DC_Passkey.enroll()) }, { ok: false, available: false, reason: "passkey-verifier-not-configured" });
  assert.equal(getNetworkCalls(), 0);
});

test("TeamSnap adapter explicitly fails closed without OAuth or provider requests", async () => {
  const { window, getNetworkCalls } = runBrowserScript("js/teamsnap-oauth.js");
  assert.equal(window.DC_TeamSnap.available, false);
  assert.equal(window.DC_TeamSnap.status, "unconfigured");
  assert.equal((await window.DC_TeamSnap.beginAuthorization()).available, false);
  assert.equal((await window.DC_TeamSnap.getRoster()).available, false);
  assert.equal((await window.DC_TeamSnap.getSchedule()).available, false);
  assert.equal(getNetworkCalls(), 0);
});

test("Ice seat and development bypass controls remain disabled without verified adapters", () => {
  const ids = {
    seatChip: element(), iceDevFlag: element(), icePassGate: element(),
    icePassMsg: element(), btnIceUnlock: element(), btnIceMakeKey: element(),
  };
  const { getNetworkCalls } = runBrowserScript("js/ice-seat-teamsnap-only.js", ids);
  assert.equal(ids.iceDevFlag.disabled, true);
  assert.equal(ids.btnIceUnlock.disabled, true);
  assert.equal(ids.btnIceMakeKey.disabled, true);
  assert.equal(ids.btnIceMakeKey.hidden, false);
  assert.equal(ids.seatChip.textContent, "Seat unavailable");
  ids.seatChip.listeners.click();
  assert.equal(ids.icePassGate.hidden, false);
  assert.match(ids.icePassMsg.textContent, /No bypass is available/);
  assert.equal(getNetworkCalls(), 0);
});

test("Ice demo modules disclose unavailable live schedule and do not fabricate a roster", () => {
  const { window, getNetworkCalls } = runBrowserScript("js/ice-gameday.js");
  assert.equal(window.DC_ICE_GAMEDAY.available, false);
  assert.equal(window.DC_ICE_GAMEDAY.source, null);
  assert.match(window.DC_ICE_GAMEDAY.message, /no verified TeamSnap connection/);
  assert.equal(getNetworkCalls(), 0);
});

test("Ice practice cards are generic guidance, not personalized athlete data", () => {
  const { window, getNetworkCalls } = runBrowserScript("js/ice-skills.js");
  assert.equal(Array.isArray(window.DC_ICE_SKILLS), true);
  assert.equal(window.DC_ICE_SKILLS.length, 3);
  assert.ok(window.DC_ICE_SKILLS.every((item) => typeof item.title === "string" && typeof item.description === "string"));
  assert.ok(window.DC_ICE_SKILLS.every((item) => !("unity_id" in item) && !("athlete_id" in item)));
  assert.equal(getNetworkCalls(), 0);
});

test("all local script, stylesheet, manifest, and SVG references resolve in Ice entry pages", () => {
  const pages = ["ice.html", "rink.html", "sheet.html", "ice-desk/index.html", "rte/ice/index.html", "ai/app.html"];
  const missing = [];
  const pattern = /\b(?:src|href)\s*=\s*["']([^"'#]+)["']/gi;
  for (const page of pages) {
    const html = read(page);
    for (const match of html.matchAll(pattern)) {
      const raw = match[1];
      if (/^(?:https?:|data:|mailto:|javascript:|\/\/)/i.test(raw)) continue;
      const clean = raw.split(/[?#]/, 1)[0];
      if (!/\.(?:js|mjs|css|json|svg|png|jpe?g|webp|ico|woff2?)$/i.test(clean)) continue;
      const target = clean.startsWith("/")
        ? path.join(root, clean.slice(1))
        : path.resolve(root, path.dirname(page), clean);
      if (!existsSync(target)) missing.push(`${page} -> ${raw}`);
    }
  }
  assert.deepEqual(missing, []);
});
