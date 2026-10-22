import test from "node:test";
import assert from "node:assert/strict";
import { authorizeIrisAction } from "./trinity-gate.mjs";

const request = { requestId: "req-test", headers: {} };
const verified = { verify: async () => ({ ok: true, actorId: "actor-test" }) };
const allow = async input => ({ allow: true, decisionId: "decision-test", authority: "NONE", input });

test("missing canonical verifier denies by default", async () => {
  const result = await authorizeIrisAction({ request, action: "iris.model.turn", lawDecision: allow });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "canonical-session-verifier-unavailable");
});

test("missing law decision denies even for a verified actor", async () => {
  const result = await authorizeIrisAction({ request, action: "iris.model.turn", sessionVerifier: verified });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "trinity-law-decision-unavailable");
});

test("unverified session and unbound actor deny before law decision", async () => {
  let calls = 0;
  const lawDecision = async () => { calls++; return { allow: true, decisionId: "x" }; };
  const invalid = await authorizeIrisAction({
    request, action: "iris.model.turn",
    sessionVerifier: { verify: async () => ({ ok: false, actorId: "actor-test" }) }, lawDecision,
  });
  const unbound = await authorizeIrisAction({
    request, action: "iris.model.turn",
    sessionVerifier: { verify: async () => ({ ok: true }) }, lawDecision,
  });
  assert.equal(invalid.ok, false);
  assert.equal(unbound.ok, false);
  assert.equal(calls, 0);
});

test("explicit law allow binds decision to verified actor and action", async () => {
  let input;
  const result = await authorizeIrisAction({
    request, action: "iris.model.turn", sessionVerifier: verified,
    lawDecision: async value => { input = value; return { allow: true, decisionId: "law-42" }; },
  });
  assert.equal(result.ok, true);
  assert.equal(result.actorId, "actor-test");
  assert.equal(result.decisionId, "law-42");
  assert.equal(input.actorId, "actor-test");
  assert.equal(input.action, "iris.model.turn");
  assert.equal(input.mutation, false);
  assert.equal(result.authority, "NONE");
});

test("denials, exceptions, and missing decision receipt fail closed", async () => {
  for (const lawDecision of [
    async () => ({ allow: false, decisionId: "denied" }),
    async () => ({ allow: true }),
    async () => { throw new Error("internal secret"); },
  ]) {
    const result = await authorizeIrisAction({ request, action: "iris.model.turn", sessionVerifier: verified, lawDecision });
    assert.equal(result.ok, false);
  }
});

test("write actions require explicit Father authority", async () => {
  const common = { request, action: "deployment.promote", sessionVerifier: verified };
  const denied = await authorizeIrisAction({
    ...common, lawDecision: async () => ({ allow: true, decisionId: "law-43", authority: "NONE" }),
  });
  const allowed = await authorizeIrisAction({
    ...common, lawDecision: async () => ({ allow: true, decisionId: "law-44", authority: "FATHER" }),
  });
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, "father-authority-required");
  assert.equal(allowed.ok, true);
  assert.equal(allowed.authority, "NONE");
});
