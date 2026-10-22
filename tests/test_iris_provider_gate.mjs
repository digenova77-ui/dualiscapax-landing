import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../ai/dclm-look.js", import.meta.url), "utf8");
const fuelSource = fs.readFileSync(new URL("../js/iris-fuel-gate.js", import.meta.url), "utf8");
const appPage = fs.readFileSync(new URL("../ai/app.html", import.meta.url), "utf8");
const legacyPage = fs.readFileSync(new URL("../ai/iris.html", import.meta.url), "utf8");
const legacyChatPage = fs.readFileSync(new URL("../ai/chat.html", import.meta.url), "utf8");
const legacyEngine = fs.readFileSync(new URL("../js/iris-cognitive-engine.js", import.meta.url), "utf8");


function fuelHarness({ balance = 1, burn, byok = false } = {}) {
  const fuel = { balance: () => balance };
  if (burn !== undefined) fuel.burn = burn;
  const dcByok = byok ? { present: () => true } : null;
  const window = { DCFuel: fuel, DCByok: dcByok };
  const context = { window, DCFuel: fuel, DCByok: dcByok, String, Number, isFinite };
  vm.runInNewContext(fuelSource, context, { filename: "js/iris-fuel-gate.js" });
  return window.IrisFuel;
}

function harness() {
  let providerCalls = 0;
  const window = {
    DCByok: {
      present() { return true; },
      async chat() {
        providerCalls += 1;
        return { ok: true, content: "Verified provider response" };
      },
    },
    IrisPolicy: { veto() { return null; }, systemLine() { return "You are Iris."; } },
  };
  const document = { documentElement: { lang: "en" } };
  const context = {
    window,
    IrisPolicy: window.IrisPolicy,
    document,
    localStorage: { getItem() { return null; } },
    fetch: async () => ({ async json() { return [null, [], []]; } }),
    AbortController,
    setTimeout,
    encodeURIComponent,
    String,
    Promise,
  };
  vm.runInNewContext(source, context, { filename: "ai/dclm-look.js" });
  return { api: window.DCLMLook, getProviderCalls: () => providerCalls };
}

test("denied DEPTH ticket blocks provider before any external model call", async () => {
  const h = harness();
  const ticket = {
    ok: false,
    grade: { lane: "DEPTH", burn: 0, grant: "FUEL" },
    deny: { spoken: "Depth needs Fuel.", grant: "FUEL", lane: "DEPTH" },
  };

  const result = await h.api.run("build me a new application", ticket);

  assert.equal(result.spoken, "Depth needs Fuel.");
  assert.equal(h.getProviderCalls(), 0);
});

test("admitted DEPTH ticket permits one provider call", async () => {
  const h = harness();
  const ticket = {
    ok: true,
    grade: { lane: "DEPTH", burn: 1, grant: "FUEL" },
  };

  const result = await h.api.run("build me a new application", ticket);

  assert.equal(result.spoken, "Verified provider response");
  assert.equal(result.lane, "DEPTH");
  assert.equal(result.ticket, ticket);
  assert.equal(h.getProviderCalls(), 1);
});

test("LOOK request does not invoke the external model provider", async () => {
  const h = harness();
  const ticket = {
    ok: true,
    grade: { lane: "LOOK", burn: 0, grant: "LOOK" },
  };

  await h.api.run("tell me something", ticket);

  assert.equal(h.getProviderCalls(), 0);
});

test("primary Iris page loads BYOK before Fuel admission", () => {
  assert.ok(appPage.indexOf('/js/byok.js?v=54') < appPage.indexOf('/js/iris-fuel-gate.js?v=54'));
});

test("legacy Iris chat passes its admission ticket into DCLMLook", () => {
  assert.ok(legacyPage.indexOf('/js/byok.js') < legacyPage.indexOf('/js/iris-fuel-gate.js'));
  assert.match(legacyPage, /IrisFuel\.admit\(text\)[\s\S]*DCLMLook\.run\(text,ticket\)/);
});

test("legacy chat uses the governed request path and contains no fabricated capability claims", () => {
  assert.match(legacyChatPage, /DCLMLook\.run\(txt, ticket\)/);
  assert.doesNotMatch(legacyChatPage, /generateIrisResponse|1,000-Indication|95\.0%|10\.42M|4\.20ms/);
});

test("legacy cognitive engine is explicitly disabled instead of fabricating answers", () => {
  assert.match(legacyEngine, /available: false/);
  assert.doesNotMatch(legacyEngine, /95\.0%|10\.42M|99\.6%|zero motive bias/);
});

test("Fuel balance without a debit function fails closed", () => {
  const fuel = fuelHarness({ balance: 1 });
  const result = fuel.admit("build me a new application");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "fuel-debit-unavailable");
});

test("Fuel debit failure or unconfirmed asynchronous debit fails closed", () => {
  const throwing = fuelHarness({ balance: 1, burn() { throw new Error("ledger unavailable"); } });
  assert.equal(throwing.admit("build me a new application").ok, false);

  const asynchronous = fuelHarness({ balance: 1, burn() { return Promise.resolve(true); } });
  assert.equal(asynchronous.admit("build me a new application").ok, false);
});

test("confirmed synchronous Fuel debit permits Depth", () => {
  let debits = 0;
  const fuel = fuelHarness({ balance: 1, burn(amount, reason) { debits += amount; assert.equal(reason, "iris-depth"); } });
  const result = fuel.admit("build me a new application");
  assert.equal(result.ok, true);
  assert.equal(result.paid, true);
  assert.equal(debits, 1);
});

test("valid BYOK path does not require a Fuel debit", () => {
  const fuel = fuelHarness({ balance: 0, byok: true });
  const result = fuel.admit("build me a new application");
  assert.equal(result.ok, true);
  assert.equal(result.byok, true);
});
