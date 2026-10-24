/**
 * Project-wide receipt gate tests.
 *
 * Purpose
 * -------
 * Lock the rule that DEPTH, work, and learning side effects require a
 * dualis.receipt.v1 receipt from an authorized decision. A missing or
 * malformed receipt fails closed.
 *
 * How to run
 * ----------
 *   node --test tests/iris-receipt-gate.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const receiptSource = fs.readFileSync(new URL("../js/iris-receipt.js", import.meta.url), "utf8");
const sessionSource = fs.readFileSync(new URL("../js/iris-session.js", import.meta.url), "utf8");

function loadReceipt() {
  const context = { window: {}, globalThis: {} };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(receiptSource, context, { filename: "js/iris-receipt.js" });
  return context.IrisReceipt;
}

function loadSession(extra) {
  const window = Object.assign({
    IrisFuel: { admit() { return { ok: true, grade: { lane: "DEPTH", burn: 1, grant: "FUEL" } }; } },
  }, extra || {});
  const context = {
    window,
    crypto: globalThis.crypto,
    TextEncoder: globalThis.TextEncoder,
    TextDecoder: globalThis.TextDecoder,
  };
  vm.runInNewContext(receiptSource, context, { filename: "js/iris-receipt.js" });
  // Browser scripts treat window properties as globals.
  context.IrisFuel = window.IrisFuel;
  context.IrisReceipt = context.IrisReceipt || window.IrisReceipt;
  context.IrisAuthorize = window.IrisAuthorize;
  context.DCLMLook = window.DCLMLook;
  context.IrisLive = window.IrisLive;
  context.CosmicRuntime = window.CosmicRuntime;
  vm.runInNewContext(sessionSource, context, { filename: "js/iris-session.js" });
  return { window, session: window.IrisSession };
}

test("validator rejects a missing receipt", () => {
  const IrisReceipt = loadReceipt();
  assert.equal(IrisReceipt.validReceipt(null), false);
  assert.equal(IrisReceipt.validAuthorized({ authorized: true }), false);
});

test("validator accepts a well-formed dualis.receipt.v1 receipt", () => {
  const IrisReceipt = loadReceipt();
  const receipt = {
    contract: "dualis.receipt.v1",
    id: "rct_req-1",
    sha256: "b".repeat(64),
    request_id: "req-1",
  };
  assert.equal(IrisReceipt.validReceipt(receipt), true);
  assert.equal(IrisReceipt.validAuthorized({ authorized: true, receipt }), true);
});

test("production path with base and no secret can authorize when receipt is valid", async () => {
  const calls = [];
  const { window, session } = loadSession({
    IrisAuthorizeBase: "https://example.test",
    IrisAuthorize: {
      authorize: async () => ({
        status: 200,
        ok: true,
        data: {
          authorized: true,
          receipt: {
            contract: "dualis.receipt.v1",
            id: "rct_prod-1",
            sha256: "c".repeat(64),
            request_id: "prod-1",
          },
        },
      }),
    },
    DCLMLook: { run(text, ticket) { calls.push(ticket); return { spoken: "ok", lane: "DEPTH" }; } },
  });
  const rec = await session.think("build it");
  assert.equal(calls.length, 1);
  assert.equal(rec.spoken, "ok");
  assert.equal(window.IrisSigningSecret, undefined);
});

test("authorized response without a receipt does not reach DCLMLook", async () => {
  const calls = [];
  const { session } = loadSession({
    IrisAuthorizeBase: "https://example.test",
    IrisAuthorize: {
      authorize: async () => ({ status: 200, ok: true, data: { authorized: true } }),
    },
    DCLMLook: { run() { calls.push("dclm"); return { spoken: "should-not-run" }; } },
  });
  const rec = await session.think("build it");
  assert.equal(calls.length, 0);
  assert.equal(rec.lane, "DENIED");
});

test("work does not step the runtime without a receipt", () => {
  const steps = [];
  const { session } = loadSession({
    CosmicRuntime: { step() { steps.push("step"); return "ran"; } },
  });
  session.work({ kind: "tick" });
  assert.equal(steps.length, 0);
});
