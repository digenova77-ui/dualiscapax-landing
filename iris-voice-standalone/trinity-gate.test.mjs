import test from "node:test";
import assert from "node:assert/strict";
import { authorizeIrisAction } from "./trinity-gate.mjs";

const request = { requestId: "req-test", headers: {} };
const verified = { verify: async () => ({ ok: true, actorId: "actor-test" }) };
const allowRead = async () => ({ allow: true, decisionId: "law-read" });

test("missing verifier or law decision fails closed", async () => {
  assert.equal((await authorizeIrisAction({ request, action: "iris.model.turn", lawDecision: allowRead })).ok, false);
  assert.equal((await authorizeIrisAction({ request, action: "iris.model.turn", sessionVerifier: verified })).ok, false);
});

test("unknown actions fail before identity or law calls", async () => {
  let calls = 0;
  const result = await authorizeIrisAction({
    request, action: "anything.goes",
    sessionVerifier: { verify: async () => { calls++; return { ok: true, actorId: "actor" }; } },
    lawDecision: async () => { calls++; return { allow: true, decisionId: "x" }; },
  });
  assert.equal(result.reason, "action-not-allowlisted");
  assert.equal(calls, 0);
});

test("unverified or unbound sessions never reach law decision", async () => {
  let calls = 0;
  const lawDecision = async () => { calls++; return { allow: true, decisionId: "x" }; };
  for (const session of [{ ok: false, actorId: "actor" }, { ok: true }]) {
    const result = await authorizeIrisAction({
      request, action: "iris.model.turn",
      sessionVerifier: { verify: async () => session }, lawDecision,
    });
    assert.equal(result.ok, false);
  }
  assert.equal(calls, 0);
});

test("read action needs explicit law receipt bound to verified actor and action", async () => {
  let input;
  const result = await authorizeIrisAction({
    request, action: "iris.model.turn", sessionVerifier: verified,
    lawDecision: async value => { input = value; return { allow: true, decisionId: "law-42" }; },
  });
  assert.deepEqual({ ok: result.ok, actorId: result.actorId, decisionId: result.decisionId, authority: result.authority },
    { ok: true, actorId: "actor-test", decisionId: "law-42", authority: "NONE" });
  assert.equal(input.action, "iris.model.turn");
  assert.equal(input.mutation, false);
});

test("law denial, exception, and missing receipt fail closed", async () => {
  for (const lawDecision of [
    async () => ({ allow: false, decisionId: "denied" }),
    async () => ({ allow: true }),
    async () => { throw new Error("private diagnostic"); },
  ]) {
    const result = await authorizeIrisAction({ request, action: "iris.model.turn", sessionVerifier: verified, lawDecision });
    assert.equal(result.ok, false);
  }
});

test("write actions require explicit Father authority; gate itself still has no authority", async () => {
  const common = { request, action: "deployment.promote", sessionVerifier: verified };
  const denied = await authorizeIrisAction({
    ...common, lawDecision: async () => ({ allow: true, decisionId: "law-43", authority: "NONE" }),
  });
  const allowed = await authorizeIrisAction({
    ...common, lawDecision: async () => ({ allow: true, decisionId: "law-44", authority: "FATHER" }),
  });
  assert.equal(denied.reason, "father-authority-required");
  assert.equal(allowed.ok, true);
  assert.equal(allowed.authority, "NONE");
});
