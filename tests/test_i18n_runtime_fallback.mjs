import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const runtime = fs.readFileSync(new URL("../js/i18n.js", import.meta.url), "utf8");

function createHarness({ failFrench = false } = {}) {
  const stored = new Map();
  const switcher = {
    value: "",
    dataset: {},
    addEventListener() {},
  };
  const documentAttributes = new Map();
  const warnings = [];
  const callbackCalls = [];
  const fetchCalls = [];

  const document = {
    documentElement: {
      setAttribute(name, value) {
        documentAttributes.set(name, value);
      },
    },
    querySelectorAll(selector) {
      if (selector === "#dc-lang-switch") return [switcher];
      return [];
    },
    addEventListener() {},
  };

  const window = {
    localStorage: {
      getItem(key) { return stored.has(key) ? stored.get(key) : null; },
      setItem(key, value) { stored.set(key, value); },
    },
    DC_i18n_onChange(locale, catalog) {
      callbackCalls.push({ locale, catalog });
    },
  };

  async function fetch(url) {
    fetchCalls.push(url);
    const locale = url.split("/").pop().replace(".json", "");
    if (locale === "fr" && failFrench) {
      return { ok: false, status: 503, async json() { return {}; } };
    }
    const catalog = locale === "fr" ? { greeting: "Bonjour" } : { greeting: "Hello" };
    return { ok: true, status: 200, async json() { return catalog; } };
  }

  const context = {
    window,
    document,
    navigator: { language: "en" },
    Node: { TEXT_NODE: 3 },
    fetch,
    console: { warn(...args) { warnings.push(args); } },
    Array,
    Object,
    String,
    Error,
  };
  vm.runInNewContext(runtime, context, { filename: "js/i18n.js" });

  return {
    api: window.DC_i18n,
    stored,
    switcher,
    documentAttributes,
    callbackCalls,
    fetchCalls,
    warnings,
  };
}

test("failed French catalog falls back to English and aligns locale metadata", async () => {
  const h = createHarness({ failFrench: true });
  await h.api.setLang("fr");

  assert.equal(h.api.current(), "en");
  assert.equal(h.stored.get("dc-lang"), "en");
  assert.equal(h.documentAttributes.get("lang"), "en");
  assert.equal(h.switcher.value, "en");
  assert.equal(h.api.get("greeting"), "Hello");
  assert.equal(h.callbackCalls.length, 1);
  assert.equal(h.callbackCalls[0].locale, "en");
  assert.deepEqual(h.fetchCalls, ["/i18n/en.json", "/i18n/fr.json", "/i18n/en.json"]);
});

test("successful French catalog remains French", async () => {
  const h = createHarness();
  await h.api.setLang("fr");

  assert.equal(h.api.current(), "fr");
  assert.equal(h.stored.get("dc-lang"), "fr");
  assert.equal(h.documentAttributes.get("lang"), "fr");
  assert.equal(h.switcher.value, "fr");
  assert.equal(h.api.get("greeting"), "Bonjour");
  assert.equal(h.callbackCalls.length, 1);
  assert.equal(h.callbackCalls[0].locale, "fr");
});
