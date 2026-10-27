/**
 * Standalone tests: node --test tests/hud-command-resolver.test.cjs
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const resolver = require("../js/hud-command-resolver.js");

test("empty input asks for clarification", () => {
  assert.equal(resolver.resolve("   ").status, "clarify");
});

test("create intent yields a proposal and never executes", () => {
  const result = resolver.resolve("Please design a solar farm");
  assert.equal(result.status, "proposal");
  assert.equal(result.intent, "board.create");
  assert.equal(result.execute, false);
  assert.equal(result.authority, "trinity_server_only");
});

test("normalization handles punctuation and case", () => {
  assert.equal(resolver.resolve("SHOW ME the energy map!").intent, "board.explore");
});

test("edit without a target fails to clarification", () => {
  const result = resolver.resolve("move");
  assert.equal(result.status, "clarify");
  assert.equal(result.reason, "target_required");
});

test("edit with an explicit selected target remains a proposal", () => {
  const result = resolver.resolve("move the selected object");
  assert.equal(result.status, "proposal");
  assert.equal(result.intent, "board.edit");
  assert.equal(result.execute, false);
});

test("unknown language is unsupported, not guessed", () => {
  assert.equal(resolver.resolve("make the impossible happen").status, "unsupported");
});

test("money-related intent is high-risk and explicitly gated", () => {
  const result = resolver.resolve("send money to the supplier");
  assert.equal(result.status, "proposal");
  assert.equal(result.intent, "wallet.prepare_transfer");
  assert.equal(result.risk, "high");
  assert.equal(result.protected, true);
  assert.equal(result.confirmation, "explicit");
  assert.equal(result.execute, false);
});

test("longer trigger wins over generic overlapping trigger", () => {
  const result = resolver.resolve("make it bigger");
  assert.equal(result.status, "proposal");
  assert.equal(result.intent, "board.edit");
});

test("proposal has no authorization side effects or hidden success claim", () => {
  const result = resolver.resolve("simulate a factory energy plan");
  assert.equal(result.intent, "board.simulate");
  assert.equal(result.execute, false);
  assert.match(result.notes.join(" "), /No operation was executed/);
});
