import test from "node:test";
import assert from "node:assert/strict";
import { isValidIrisStagingUrl } from "./staging-url.mjs";

test("accepts only the isolated Iris staging Worker origin", () => {
  assert.equal(isValidIrisStagingUrl("https://iris-runtime-staging.account123.workers.dev"), true);
  assert.equal(isValidIrisStagingUrl("https://iris-runtime-staging.a.workers.dev/"), true);
});

test("rejects unrelated workers.dev workers", () => {
  assert.equal(isValidIrisStagingUrl("https://dualiscapax.ai"), false);
  assert.equal(isValidIrisStagingUrl("https://iris-runtime.account123.workers.dev"), false);
  assert.equal(isValidIrisStagingUrl("https://production.account123.workers.dev"), false);
});

test("rejects insecure or credential-bearing URLs", () => {
  assert.equal(isValidIrisStagingUrl("http://iris-runtime-staging.account123.workers.dev"), false);
  assert.equal(isValidIrisStagingUrl("https://user:pass@iris-runtime-staging.account123.workers.dev"), false);
});

test("rejects non-default ports and URL suffixes", () => {
  assert.equal(isValidIrisStagingUrl("https://iris-runtime-staging.account123.workers.dev:8443"), false);
  assert.equal(isValidIrisStagingUrl("https://iris-runtime-staging.account123.workers.dev/health"), false);
  assert.equal(isValidIrisStagingUrl("https://iris-runtime-staging.account123.workers.dev/?target=production"), false);
  assert.equal(isValidIrisStagingUrl("https://iris-runtime-staging.account123.workers.dev/#fragment"), false);
});

test("rejects malformed, empty, whitespace-padded, and non-string input", () => {
  assert.equal(isValidIrisStagingUrl(""), false);
  assert.equal(isValidIrisStagingUrl(" https://iris-runtime-staging.account123.workers.dev"), false);
  assert.equal(isValidIrisStagingUrl("not-a-url"), false);
  assert.equal(isValidIrisStagingUrl(null), false);
});
