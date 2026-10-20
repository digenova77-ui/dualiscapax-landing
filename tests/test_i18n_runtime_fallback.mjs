import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const runtime = fs.readFileSync(new URL("../js/i18n.js", import.meta.url), "utf8");

function createHarness({ failFrench = false, malformedFrench = false, storageBlocked = false, navigatorLanguage = "en", fetchDelays = {} } = {}) {
  const stored = new Map();
  const switcher = {
    value: "",
    dataset: {},
    addEventListener() {},
  };
  const documentAttributes = new Map();
  const makeElement = (initial = {}) => {
    const attributes = new Map(Object.entries(initial));
    return {
      attributes,
      getAttribute(name) { return attributes.has(name) ? attributes.get(name) : null; },
      setAttribute(name, value) { attributes.set(name, String(value)); },
    };
  };
  const placeholder = makeElement({ "data-i18n-placeholder": "form.prompt" });
  const ariaLabel = makeElement({ "data-i18n-aria-label": "nav.home" });
  const title = makeElement({ "data-i18n-title": "nav.look" });
  const metaContent = makeElement({ "data-i18n-content": "meta.description" });
  const textTarget = makeElement({ "data-i18n": "greeting" });
  textTarget.childElementCount = 0;
  textTarget.textContent = "Original";
  const nestedTextNode = { nodeType: 3, nodeValue: "Original label" };
  const nestedIcon = { nodeType: 1, marker: "icon-preserved" };
  const nestedTarget = makeElement({ "data-i18n": "nav.home" });
  nestedTarget.childElementCount = 1;
  nestedTarget.childNodes = [nestedTextNode, nestedIcon];
  nestedTarget.hasAttribute = name => nestedTarget.attributes.has(name);
  const warnings = [];
  const callbackCalls = [];
  const fetchCalls = [];

  const documentHandlers = new Map();
  const document = {
    documentElement: {
      setAttribute(name, value) {
        documentAttributes.set(name, value);
      },
    },
    querySelectorAll(selector) {
      if (selector === "#dc-lang-switch") return [switcher];
      if (selector === "[data-i18n]") return [textTarget, nestedTarget];
      if (selector === "[data-i18n-placeholder]") return [placeholder];
      if (selector === "[data-i18n-aria-label]") return [ariaLabel];
      if (selector === "[data-i18n-title]") return [title];
      if (selector === "[data-i18n-content]") return [metaContent];
      return [];
    },
    addEventListener(name, callback) { documentHandlers.set(name, callback); },
  };

  const window = {
    localStorage: {
      getItem(key) { if (storageBlocked) throw new Error("storage blocked"); return stored.has(key) ? stored.get(key) : null; },
      setItem(key, value) { if (storageBlocked) throw new Error("storage blocked"); stored.set(key, value); },
    },
    DC_i18n_onChange(locale, catalog) {
      callbackCalls.push({ locale, catalog });
    },
  };

  async function fetch(url) {
    fetchCalls.push(url);
    const locale = url.split("/").pop().replace(".json", "");
    if (fetchDelays[locale]) await new Promise(resolve => setTimeout(resolve, fetchDelays[locale]));
    if (locale === "fr" && failFrench) {
      return { ok: false, status: 503, async json() { return {}; } };
    }
    const catalog = locale === "fr"
      ? { greeting: "Bonjour", "form.prompt": "Posez une question", "nav.home": "Accueil", "nav.look": "Découvrir", "meta.description": "Description française" }
      : locale === "es"
        ? { greeting: "Hola", "form.prompt": "Haga una pregunta", "nav.home": "Inicio", "nav.look": "Explorar", "meta.description": "Descripción en español" }
        : { greeting: "Hello", "form.prompt": "Ask a question", "nav.home": "Home", "nav.look": "Look", "meta.description": "English description" };
    return { ok: true, status: 200, async json() { return malformedFrench && locale === "fr" ? [] : catalog; } };
  }

  const context = {
    window,
    document,
    navigator: { language: navigatorLanguage },
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
    placeholder,
    ariaLabel,
    title,
    metaContent,
    textTarget,
    nestedTarget,
    nestedTextNode,
    nestedIcon,
    start() { const handler = documentHandlers.get("DOMContentLoaded"); if (handler) handler(); },
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


test("regional browser locale works when storage is blocked", async () => {
  const h = createHarness({ storageBlocked: true, navigatorLanguage: "fr-CA" });
  h.start();
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(h.api.current(), "fr");
  assert.equal(h.documentAttributes.get("lang"), "fr");
  assert.equal(h.switcher.value, "fr");
  assert.equal(h.api.get("greeting"), "Bonjour");
});

test("malformed locale catalog fails closed to English", async () => {
  const h = createHarness({ malformedFrench: true });
  await h.api.setLang("fr");

  assert.equal(h.api.current(), "en");
  assert.equal(h.documentAttributes.get("lang"), "en");
  assert.equal(h.switcher.value, "en");
  assert.equal(h.api.get("greeting"), "Hello");
});

test("late stale locale response cannot overwrite the newest selection", async () => {
  const h = createHarness({ fetchDelays: { fr: 25 } });
  const french = h.api.setLang("fr");
  await new Promise(resolve => setTimeout(resolve, 0));
  const spanish = h.api.setLang("es");
  await spanish;
  await french;

  assert.equal(h.api.current(), "es");
  assert.equal(h.documentAttributes.get("lang"), "es");
  assert.equal(h.switcher.value, "es");
  assert.equal(h.api.get("greeting"), "Hola");
});

test("localizes placeholders, accessibility labels, titles, and metadata", async () => {
  const h = createHarness();
  await h.api.setLang("fr");

  assert.equal(h.placeholder.attributes.get("placeholder"), "Posez une question");
  assert.equal(h.ariaLabel.attributes.get("aria-label"), "Accueil");
  assert.equal(h.title.attributes.get("title"), "Découvrir");
  assert.equal(h.metaContent.attributes.get("content"), "Description française");
});


test("updates translated text while preserving nested icon elements", async () => {
  const h = createHarness();
  await h.api.setLang("fr");

  assert.equal(h.textTarget.textContent, "Bonjour");
  assert.equal(h.nestedTextNode.nodeValue, "Accueil");
  assert.equal(h.nestedTarget.childNodes[1], h.nestedIcon);
  assert.equal(h.nestedIcon.marker, "icon-preserved");
});
