import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function makeElement(tag) {
  return {
    tagName: tag, children: [], attributes: {}, listeners: {}, value: "", textContent: "",
    scrollTop: 0, scrollHeight: 0,
    className: "",
    setAttribute(k, v) { this.attributes[k] = v; },
    appendChild(node) { this.children.push(node); return node; },
    addEventListener(k, fn) { this.listeners[k] = fn; }
  };
}

function loadIris({ withStream = false, withInput = false, withSend = false } = {}) {
  const stream = withStream ? makeElement("div") : null;
  const input = withInput ? makeElement("input") : null;
  const send = withSend ? makeElement("button") : null;
  const document = {
    readyState: "complete",
    addEventListener() {},
    createElement: makeElement,
    getElementById(id) {
      return id === "embeddedIrisStream" ? stream : id === "irisInput" ? input : id === "irisSendBtn" ? send : null;
    },
    querySelector() { return null; }
  };
  const window = {};
  vm.runInNewContext(fs.readFileSync("js/iris-cognitive-engine.js", "utf8"), { window, document, Promise, String });
  return { api: window.IrisCognitiveEngine, window, stream, input, send };
}

test("local fallback is honest about absent verified reasoning service", () => {
  const { api } = loadIris();
  const answer = api.responseFor("analyze this");
  assert.match(answer, /local interface mode/i);
  assert.match(answer, /not connected/i);
  assert.doesNotMatch(answer, /verified registry|3\.82ms|95\.0%|sealed/i);
});

test("policy veto is applied before a response is returned", () => {
  const { api, window } = loadIris();
  window.IrisPolicy = { veto: () => ({ grant: "VETO", spoken: "Refused by policy." }) };
  assert.equal(api.responseFor("anything"), "Refused by policy.");
});

test("messages render untrusted input as text, not executable markup", () => {
  const { api, stream, input } = loadIris({ withStream: true, withInput: true });
  input.value = '<img src=x onerror="alert(1)">';
  assert.equal(api.submit(), true);
  const userBubble = stream.children[0];
  const body = userBubble.children[1];
  assert.equal(body.textContent, '<img src=x onerror="alert(1)">');
  assert.equal(body.children.length, 0);
});

test("oversized input is rejected without appending user content", () => {
  const { api, stream } = loadIris({ withStream: true });
  assert.equal(api.submit("x".repeat(api.maxInputChars + 1)), false);
  assert.equal(stream.children.length, 1);
  assert.match(stream.children[0].children[1].textContent, /too long/i);
});

test("empty input does nothing and adapter exposes its version", () => {
  const { api, stream } = loadIris({ withStream: true });
  assert.equal(api.submit("  "), false);
  assert.equal(stream.children.length, 0);
  assert.match(api.version, /trinity/i);
});
