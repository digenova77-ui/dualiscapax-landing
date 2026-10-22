import test from "node:test";
import assert from "node:assert/strict";
import { createProviderConnector } from "./provider-connector.mjs";

test("missing API key fails closed without making a network call", async () => {
  let calls = 0;
  const connector = createProviderConnector({
    apiKey: "",
    fetchImpl: async () => { calls++; throw new Error("must not run"); },
  });
  assert.deepEqual(await connector.turn({ text: "hello" }), {
    ok: false, reason: "provider-unconfigured", status: 503,
  });
  assert.equal(calls, 0);
});

test("empty and oversized input are rejected before provider access", async () => {
  let calls = 0;
  const connector = createProviderConnector({
    apiKey: "test-only",
    fetchImpl: async () => { calls++; return { ok: true, json: async () => ({ output_text: "ok" }) }; },
  });
  assert.equal((await connector.turn({ text: "  " })).reason, "empty-input");
  assert.equal((await connector.turn({ text: "x".repeat(24001) })).reason, "input-too-large");
  assert.equal(calls, 0);
});

test("successful Responses API output is normalized", async () => {
  let request;
  const connector = createProviderConnector({
    apiKey: "test-only",
    model: "grok-test",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, status: 200, json: async () => ({ output_text: "  Hello from Iris.  " }) };
    },
  });
  const result = await connector.turn({ text: "hello" });
  assert.deepEqual(result, { ok: true, data: { text: "Hello from Iris.", model: "grok-test" } });
  assert.equal(request.url, "https://api.x.ai/v1/responses");
  assert.equal(request.options.headers.authorization, "Bearer test-only");
  assert.deepEqual(JSON.parse(request.options.body), { model: "grok-test", input: "hello" });
});

test("nested output text is extracted and provider error bodies are not leaked", async () => {
  const nested = createProviderConnector({
    apiKey: "test-only",
    fetchImpl: async () => ({
      ok: true, status: 200,
      json: async () => ({ output: [{ content: [{ type: "output_text", text: "Nested answer" }] }] }),
    }),
  });
  assert.equal((await nested.turn({ text: "hello" })).data.text, "Nested answer");

  const failed = createProviderConnector({
    apiKey: "test-only",
    fetchImpl: async () => ({ ok: false, status: 401, text: async () => "secret internals" }),
  });
  const result = await failed.turn({ text: "hello" });
  assert.deepEqual(result, { ok: false, reason: "provider-credentials-rejected", status: 502 });
  assert.equal(JSON.stringify(result).includes("secret internals"), false);
});
