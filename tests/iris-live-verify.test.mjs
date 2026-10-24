/**
 * Unit tests for the live staging verifier and the boot base reader.
 * These do not call a live Worker.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkHealth, checkDeny, checkAllow } from "../workers/iris-runtime/verify-live.mjs";

test("health passes only when ok and missing is empty", () => {
  assert.equal(checkHealth({ status: 200, data: { ok: true, missing: [] } }).ok, true);
  assert.equal(checkHealth({ status: 200, data: { ok: false, missing: ["TRINITY_LAW"] } }).ok, false);
  assert.equal(checkHealth({ status: 503, data: null }).ok, false);
});

test("deny passes only when authorized is false", () => {
  assert.equal(checkDeny({ data: { authorized: false, reason: "policy" } }).ok, true);
  assert.equal(checkDeny({ data: { authorized: true } }).ok, false);
});

test("allow passes only with a dualis.receipt.v1 receipt", () => {
  const good = {
    data: {
      authorized: true,
      receipt: {
        contract: "dualis.receipt.v1",
        id: "rct_allow-1",
        unity_id: "unity-1",
        sha256: "d".repeat(64),
        request_id: "allow-1",
      },
    },
  };
  assert.equal(checkAllow(good).ok, true);
  assert.equal(checkAllow(good, "unity-1").ok, true);
  assert.equal(checkAllow(good, "different-unity").ok, false);
  assert.equal(checkAllow({ data: { authorized: true } }).ok, false);
  assert.equal(checkAllow({ data: { authorized: true, receipt: { contract: "other", id: "rct_x", sha256: "d".repeat(64), request_id: "x" } } }).ok, false);
});
