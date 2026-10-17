import assert from "node:assert/strict";
import test from "node:test";
import { OPEN_DECISION, published } from "../js/merit-align.js";
import {
  COINS,
  ILLUSTRATION,
  INTEGRITY,
  PROFILE_A,
  PROFILE_B,
  ROLES,
  STATES,
  UNCHECKED,
  allocate,
  books,
  commercial,
  fifty,
  launch,
  run,
  sandbox,
  statesEquivalent
} from "../js/sandbox-math.js";

function walk(value, visit) {
  visit(value);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) walk(value[i], visit);
    return;
  }
  const names = Object.keys(value);
  for (let i = 0; i < names.length; i++) walk(value[names[i]], visit);
}

function assertNoKey(value) {
  walk(value, function (node) {
    if (!node || typeof node !== "object") return;
    assert.equal(Object.hasOwn(node, "key"), false);
  });
  assert.equal(JSON.stringify(value).includes("\"key\""), false);
}

const READY = {
  transaction: "exchange",
  gross: 100,
  deductions: 0,
  fees: 0,
  ruleVersion: "learning"
};

test("the three components keep the file's names and stay not live", () => {
  assert.deepEqual(COINS, ["UniFi³", "EFUSE", "Merit"]);
  assert.equal(ROLES["UniFi³"], "identity");
  assert.equal(ROLES.EFUSE, "resource");
  assert.equal(ROLES.Merit, "exchange");
  const gate = published();
  assert.equal(gate.open, false);
  assert.equal(gate.joule, null);
  assert.equal(OPEN_DECISION.efuse, 1);
  const held = run({ mint: true, transfer: true, airdrop: true, chain: "ethereum", joule: 1 });
  assert.equal(held.minted, false);
  assert.equal(held.transfer, false);
  assert.equal(held.airdrop, false);
  assert.equal(held.chain, null);
  assert.equal(held.live, false);
  assert.equal(held.required, false);
  assert.equal(held.open, false);
  assert.equal(held.joule, null);
  assert.equal(held.look, 0);
  assert.equal(held.efuse, 1);
  assert.equal(held.gate, "shut");
  assertNoKey(held);
});

test("the 50/50 split is not finalized and the forbidden readings stay off", () => {
  const split = fifty();
  assert.equal(split.principle, "50/50");
  assert.equal(split.finalized, false);
  assert.equal(split.state, "unresolved");
  assert.equal(split.portions, null);
  assert.equal(split.purposes, null);
  assert.equal(split.recipients, null);
  assert.equal(split.accounting, null);
  assert.equal(split.supplyHalf, false);
  assert.equal(split.burnHalf, false);
  assert.equal(split.reserveHalf, false);
  assert.equal(split.payUsers, false);
  assert.equal(split.price, null);
  assert.equal(split.minted, false);
  assert.equal(split.look, 0);
  assert.equal(split.joule, null);
  const asked = allocate({ split: "50/50", gross: 100 });
  assert.equal(asked.reason, "unspecified");
  assert.equal(asked.portions, null);
  assert.equal(asked.active, false);
  assert.equal(asked.fifty.finalized, false);
});

test("the 90/9/1 and 99/1 profiles are candidates on a base of 100", () => {
  assert.equal(PROFILE_A.state, "proposed");
  assert.equal(PROFILE_A.base, 100);
  assert.equal(PROFILE_A.primary + PROFILE_A.secondary + PROFILE_A.integrity, 100);
  assert.deepEqual([PROFILE_A.primary, PROFILE_A.secondary, PROFILE_A.integrity], [90, 9, 1]);
  assert.equal(PROFILE_B.state, "proposed");
  assert.equal(PROFILE_B.base, 100);
  assert.equal(PROFILE_B.primary + PROFILE_B.integrity, 100);
  assert.deepEqual([PROFILE_B.primary, PROFILE_B.integrity], [99, 1]);
  assert.equal(Object.hasOwn(PROFILE_B, "secondary"), false);
  assert.equal(INTEGRITY.portion, 1);
  assert.equal(INTEGRITY.burn, false);
  assert.equal(INTEGRITY.profit, false);
  assert.equal(INTEGRITY.operator, null);

  const sap = allocate({ ...READY, profile: "90/9/1", recipients: { primary: "founder" }, activate: true, state: "verified" });
  const thin = allocate({ ...READY, profile: "99/1" });
  assert.equal(sap.state, "proposed");
  assert.equal(sap.active, false);
  assert.equal(sap.live, false);
  assert.equal(sap.minted, false);
  assert.equal(sap.reason, "candidate");
  assert.equal(sap.reconciled, true);
  assert.equal(sap.recipients, null);
  assert.equal(sap.ledger, null);
  assert.deepEqual(sap.portions, { primary: 90, secondary: 9, integrity: 1 });
  assert.equal(JSON.stringify(sap).includes("founder"), false);
  assert.equal(JSON.stringify(sap).includes("verified"), false);
  assert.equal(thin.state, "proposed");
  assert.equal(thin.active, false);
  assert.deepEqual(thin.portions, { primary: 99, integrity: 1 });
  assert.equal(thin.portions.primary + thin.portions.integrity, 100);
  assert.deepEqual(sap, allocate({ ...READY, profile: "90/9/1", recipients: { primary: "founder" } }));
});

test("both formulas are not applied to the same base", () => {
  const mixed = allocate({ ...READY, profiles: ["90/9/1", "99/1"] });
  assert.equal(mixed.reason, "both");
  assert.equal(mixed.portions, null);
  assert.equal(mixed.active, false);
  assert.equal(mixed.minted, false);
  const layered = allocate({ ...READY, profile: "90/9/1", fifty: true });
  assert.equal(layered.reason, "both");
  assert.equal(layered.portions, null);
  assert.notDeepEqual(layered.portions, ILLUSTRATION.portions);
});

test("the 45, 4.5, 0.5 reading is arithmetic only", () => {
  assert.equal(ILLUSTRATION.final, false);
  assert.equal(ILLUSTRATION.base, 100);
  assert.deepEqual(ILLUSTRATION.fifty, [50, 50]);
  assert.equal(ILLUSTRATION.profile, "90/9/1");
  assert.equal(ILLUSTRATION.on, 50);
  assert.deepEqual(ILLUSTRATION.portions, [45, 4.5, 0.5]);
  assert.equal(ILLUSTRATION.ordering, null);
  assert.equal(ILLUSTRATION.rounding, null);
  assert.equal(ILLUSTRATION.minimum, null);
  const other = allocate({ ...READY, profile: "90/9/1", gross: 50 });
  assert.equal(other.reason, "rounding");
  assert.equal(other.portions, null);
  assert.equal(other.active, false);
});

test("missing facts stay unresolved and other bases are not guessed", () => {
  const bare = allocate({ ring: "iris" });
  assert.equal(bare.state, "unresolved");
  assert.equal(bare.reason, "missing");
  assert.equal(bare.portions, null);
  assert.equal(bare.minted, false);
  assert.equal(bare.look, 0);
  assert.equal(bare.joule, null);
  const partial = allocate({ profile: "90/9/1", gross: 100 });
  assert.equal(partial.reason, "missing");
  assert.equal(partial.portions, null);
  const fee = allocate({ ...READY, profile: "99/1", fees: 1 });
  assert.equal(fee.reason, "unspecified");
  assert.equal(fee.portions, null);
  const odd = allocate({ ...READY, profile: "99/1", gross: 1000 });
  assert.equal(odd.reason, "rounding");
  assert.equal(odd.portions, null);
  const invented = allocate({ ...READY, profile: "80/20" });
  assert.equal(invented.reason, "missing");
  assert.equal(invented.portions, null);
});

test("proposed, configured, deployed, and verified stay distinct", () => {
  assert.deepEqual(STATES, ["proposed", "configured", "deployed", "verified"]);
  assert.equal(statesEquivalent("proposed", "configured"), false);
  assert.equal(statesEquivalent("configured", "deployed"), false);
  assert.equal(statesEquivalent("deployed", "verified"), false);
  assert.equal(statesEquivalent("proposed", "proposed"), true);
  assert.equal(statesEquivalent("live", "live"), false);
});

test("commercial participation is a contract and not a Merit transaction", () => {
  const deal = commercial();
  assert.equal(deal.contract, true);
  assert.equal(deal.merit, false);
  assert.equal(deal.upfront, 0);
  assert.equal(deal.days, 90);
  assert.equal(deal.participation, 10);
  assert.equal(deal.unit, "operating-income");
  assert.equal(deal.conversion, "unresolved");
  assert.equal(deal.separate, true);
  assert.equal(deal.minted, false);
  assert.equal(deal.look, 0);
  assert.equal(deal.joule, null);
  const held = books();
  assert.equal(held.merged, false);
  assert.equal(held.revenue, null);
  assert.equal(held.issuance, null);
  assert.equal(held.fees, null);
  assert.equal(held.reserves, null);
  assert.equal(held.holders, null);
});

test("the launch checklist stays unchecked and two sandboxes deep-equal", () => {
  const list = launch();
  assert.equal(list.live, false);
  assert.equal(list.minted, false);
  assert.equal(list.network, false);
  assert.equal(list.coinsRequiredForMath, false);
  assert.equal(list.joule, null);
  assert.equal(list.look, 0);
  assert.deepEqual(list.unchecked, UNCHECKED);
  assert.equal(UNCHECKED.length, 23);
  assert.equal(UNCHECKED.includes("Early-adopter cap, price, and seat"), true);
  assert.equal(UNCHECKED.includes("Founder-board seats, names, and cap"), true);
  assert.equal(UNCHECKED.includes("Maximum or otherwise authorized token supply"), true);

  const input = { ...READY, profile: "90/9/1", key: "do-not-keep", job: "same" };
  const left = sandbox();
  const right = sandbox();
  const a = left.run(input);
  const b = right.run({ job: "same", key: "do-not-keep", profile: "90/9/1", ruleVersion: "learning", fees: 0, deductions: 0, gross: 100, transaction: "exchange" });
  assert.deepEqual(a, b);
  assert.equal(a.duplicate, false);
  assert.equal(a.allocation.reconciled, true);
  assert.equal(a.minted, false);
  assert.equal(a.look, 0);
  assert.equal(a.joule, null);
  assertNoKey(a);
  const again = left.run({ ...input, gross: 999, mint: true });
  assert.equal(again.duplicate, true);
  assert.deepEqual(again.allocation, a.allocation);
  assert.equal(again.minted, false);
  assert.equal(again.look, 0);
  assert.equal(again.joule, null);
  assert.equal(JSON.stringify(again).includes("do-not-keep"), false);
});
