import test from "node:test";
import assert from "node:assert/strict";
import { trilogyAssetPolicy, validateTrilogyIntent } from "./trilogy-asset-contract.mjs";

const intent = (asset, action) => ({
  contract: "dualis.trilogy.intent.v1",
  asset,
  action,
  request_id: "trilogy-request-001",
  principal_id: "unity_principal_001",
  evidence_sha256: "a".repeat(64),
  policy_version: "trilogy-policy.v1",
});

test("eFuse accepts measurement and quote intents but not transfer or redemption", () => {
  assert.equal(validateTrilogyIntent(intent("efuse", "record-measurement")).valid, true);
  assert.equal(validateTrilogyIntent(intent("efuse", "quote-resource-cost")).valid, true);
  assert.ok(validateTrilogyIntent(intent("efuse", "transfer")).errors.includes("action-prohibited-for-asset"));
  assert.ok(validateTrilogyIntent(intent("efuse", "redeem")).errors.includes("action-prohibited-for-asset"));
});

test("Merit is an access entitlement in this policy, not a transferable coin", () => {
  assert.equal(validateTrilogyIntent(intent("merit", "evaluate-access")).valid, true);
  assert.equal(validateTrilogyIntent(intent("merit", "grant-access")).valid, true);
  assert.ok(validateTrilogyIntent(intent("merit", "transfer")).errors.includes("action-prohibited-for-asset"));
  assert.ok(validateTrilogyIntent(intent("merit", "cash-out")).errors.includes("action-prohibited-for-asset"));
});

test("Unity is an identity credential and cannot be traded or transferred", () => {
  assert.equal(validateTrilogyIntent(intent("unity", "verify-identity")).valid, true);
  assert.equal(validateTrilogyIntent(intent("unity", "bind-principal")).valid, true);
  assert.ok(validateTrilogyIntent(intent("unity", "transfer")).errors.includes("action-prohibited-for-asset"));
  assert.ok(validateTrilogyIntent(intent("unity", "trade")).errors.includes("action-prohibited-for-asset"));
});

test("rejects unknown asset actions and unknown fields", () => {
  assert.ok(validateTrilogyIntent(intent("merit", "mint")).errors.includes("action-not-allowlisted-for-asset"));
  assert.ok(validateTrilogyIntent({ ...intent("unity", "verify-identity"), bypass_trinity: true }).errors.includes("unknown-intent-field"));
});

test("valid intent never claims authorization, issuance, transfer, ledger write, or settlement", () => {
  const result = validateTrilogyIntent(intent("efuse", "verify-measurement-evidence"));
  assert.equal(result.valid, true);
  assert.equal(result.authorization_performed, false);
  assert.equal(result.ledger_write_performed, false);
  assert.equal(result.issuance_performed, false);
  assert.equal(result.transfer_performed, false);
  assert.equal(result.settlement_performed, false);
});

test("policy inventory explicitly reports the three assets as not deployed", () => {
  const policy = trilogyAssetPolicy();
  assert.deepEqual(Object.keys(policy).sort(), ["efuse", "merit", "unity"]);
  for (const item of Object.values(policy)) {
    assert.equal(item.implemented_token, false);
    assert.equal(item.live_balance_verified, false);
    assert.equal(item.settlement_enabled, false);
  }
});
