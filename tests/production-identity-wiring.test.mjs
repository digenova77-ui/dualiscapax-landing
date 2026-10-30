import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("primary Iris page leaves production authorize base unset and denies closed", async () => {
  const html = read("ai/app.html");
  assert.match(html, /<meta name="iris-authorize-base" content="">/);

  const context = { Promise, Date };
  context.window = context;
  context.document = { querySelector: () => ({ getAttribute: () => "" }) };
  vm.runInNewContext(read("js/iris-boot.js"), context);
  assert.equal(context.IrisAuthorizeBase, undefined);
  assert.equal(context.IrisBoot.base, null);

  context.IrisFuel = { admit: () => ({ ok: true, grade: { lane: "LOOK" } }) };
  vm.runInNewContext(read("js/iris-session.js"), context);
  const result = await context.IrisSession.think("hello");
  assert.equal(result.lane, "DENIED");
  assert.equal(result.spoken, "Not authorized.");
});

test("IrisSession source marks its local ID as the submitted Unity principal", () => {
  const session = read("js/iris-session.js");
  assert.match(session, /var id = "iris-" \+ Date\.now\(\)\.toString\(36\)/);
  assert.match(session, /principal: \{ unity_id: id \}/);
});

test("production browser helper sends no HMAC headers while Pages endpoint requires them", async () => {
  const calls = [];
  const window = { IrisAuthorizeBase: "https://pages.example.invalid" };
  const fetch = async (url, options) => {
    calls.push({ url, options });
    return { status: 200, ok: true, json: async () => ({ authorized: false }) };
  };
  vm.runInNewContext(read("js/iris-authorize.js"), {
    window, fetch, Promise, Date, setTimeout, clearTimeout,
  });
  await window.IrisAuthorize.authorizeProduction({ request_id: "contract-test" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://pages.example.invalid/v1/authorize");
  assert.equal(calls[0].options.headers["x-timestamp"], undefined);
  assert.equal(calls[0].options.headers["x-signature"], undefined);

  const pagesWorker = read("_worker.js");
  assert.match(pagesWorker, /request\.headers\.get\("x-timestamp"\)/);
  assert.match(pagesWorker, /request\.headers\.get\("x-signature"\)/);
});

test("staging identity test is explicitly a permissive mock, not production identity", () => {
  const endpointTest = read("tests/iris-authorize-endpoint.test.mjs");
  assert.match(endpointTest, /verified: !!unityId/);
  const stagingDocs = read("workers/iris-runtime/STAGING.md");
  assert.ok(stagingDocs.includes("real identity verification"));
});
