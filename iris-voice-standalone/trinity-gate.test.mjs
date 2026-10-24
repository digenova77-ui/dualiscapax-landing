import test from "node:test";
import assert from "node:assert/strict";
import { authorizeIrisAction } from "./trinity-gate.mjs";

const request = { requestId: "req-test", headers: {} };
const verified = { verify: async () => ({ ok: true, actorId: "actor-test" }) };
const receipt = (input, extra = {}) => ({
  allow: true, decisionId: "law-test", actorId: input.actorId,
  action: input.action, target: input.target, mutation: input.mutation, ...extra,
});
const allowRead = async input => receipt(input);

test("missing verifier or law decision fails closed", async () => {
  assert.equal((await authorizeIrisAction({ request, action: "iris.model.turn", lawDecision: allowRead })).ok, false);
  assert.equal((await authorizeIrisAction({ request, action: "iris.model.turn", sessionVerifier: verified })).ok, false);
});

test("unknown actions fail before identity or law calls", async () => {
  let calls = 0;
  const result = await authorizeIrisAction({
    request, action: "anything.goes",
    sessionVerifier: { verify: async () => { calls++; return { ok: true, actorId: "actor" }; } },
    lawDecision: async () => { calls++; return {}; },
  });
  assert.equal(result.reason, "action-not-allowlisted");
  assert.equal(calls, 0);
});

test("unverified or unbound sessions never reach law decision", async () => {
  let calls = 0;
  const lawDecision = async () => { calls++; return {}; };
  for (const session of [{ ok: false, actorId: "actor" }, { ok: true }]) {
    const result = await authorizeIrisAction({
      request, action: "iris.model.turn",
      sessionVerifier: { verify: async () => session }, lawDecision,
    });
    assert.equal(result.ok, false);
  }
  assert.equal(calls, 0);
});

test("verified receipt must bind the exact actor, action, target, and mutation class", async () => {
  let input;
  const result = await authorizeIrisAction({
    request, action: "iris.model.turn", sessionVerifier: verified,
    lawDecision: async value => { input = value; return receipt(value); },
  });
  assert.deepEqual({ ok: result.ok, actorId: result.actorId, decisionId: result.decisionId, authority: result.authority },
    { ok: true, actorId: "actor-test", decisionId: "law-test", authority: "NONE" });
  assert.deepEqual(input, {
    actorId: "actor-test", action: "iris.model.turn", target: "iris",
    mutation: false, requestId: "req-test",
  });
});

test("bare allows, missing receipts, and mismatched receipt bindings fail closed", async () => {
  const mismatches = [
    input => ({ allow: true, decisionId: "bare-only" }),
    input => receipt(input, { actorId: "other-actor" }),
    input => receipt(input, { action: "deployment.promote" }),
    input => receipt(input, { target: "other-target" }),
    input => receipt(input, { mutation: true }),
    input => ({ ...receipt(input), decisionId: "" }),
  ];
  for (const make of mismatches) {
    const result = await authorizeIrisAction({
      request, action: "iris.model.turn", sessionVerifier: verified,
      lawDecision: async input => make(input),
    });
    assert.equal(result.ok, false);
    assert.equal(result.authority, "NONE");
  }
});

test("law denial and exceptions fail closed", async () => {
  for (const lawDecision of [
    async input => ({ ...receipt(input), allow: false }),
    async () => { throw new Error("private diagnostic"); },
  ]) {
    const result = await authorizeIrisAction({ request, action: "iris.model.turn", sessionVerifier: verified, lawDecision });
    assert.equal(result.ok, false);
  }
});

test("write actions require Father authority in the bound receipt", async () => {
  const common = { request, action: "deployment.promote", sessionVerifier: verified };
  const denied = await authorizeIrisAction({
    ...common, lawDecision: async input => receipt(input, { authority: "NONE" }),
  });
  const allowed = await authorizeIrisAction({
    ...common, lawDecision: async input => receipt(input, { authority: "FATHER" }),
  });
  assert.equal(denied.reason, "father-authority-required");
  assert.equal(allowed.ok, true);
  assert.equal(allowed.authority, "NONE");
});
