import test from "node:test";
import assert from "node:assert/strict";
import { compareThresholdCandidates, evaluateThresholdCandidate } from "./threshold-gauntlet.mjs";

const ratio60 = { kind: "ratio", ratioBps: 6000, ratioMode: "tx_to_pool" };
const absolute300500 = { kind: "absolute", maxSingleTxUnits: "300", maxPoolUnits: "500" };
const combined60 = { kind: "combined", ratioBps: 6000, ratioMode: "tx_to_pool", maxSingleTxUnits: "300", maxPoolUnits: "500" };

function proposal(txUnits, poolUnits, poolCapacityUnits = "1000", occupiedUnits = "0", reservationUnits = "1") {
  return { txUnits, poolUnits, poolCapacityUnits, occupiedUnits, reservationUnits };
}

test("exact ratio comparison is integer arithmetic at, below, and above 0.60", () => {
  assert.equal(evaluateThresholdCandidate(proposal("300", "500"), ratio60).decision, "ACCEPT");
  assert.equal(evaluateThresholdCandidate(proposal("299", "500"), ratio60).decision, "ACCEPT");
  assert.equal(evaluateThresholdCandidate(proposal("301", "500"), ratio60).decision, "REJECT");
});

test("0.60 is not inferred as a hard cap: ratio-only and absolute-only differ at scale", () => {
  const scaled = proposal("312", "520");
  assert.equal(evaluateThresholdCandidate(scaled, ratio60).decision, "ACCEPT");
  assert.equal(evaluateThresholdCandidate(scaled, absolute300500).decision, "REJECT");
  assert.equal(evaluateThresholdCandidate(scaled, combined60).decision, "REJECT");
});

test("same tx-to-pool ratio is scale-invariant for ratio-only policy", () => {
  for (const [tx, pool] of [["216", "360"], ["252", "420"], ["312", "520"]]) {
    assert.equal(evaluateThresholdCandidate(proposal(tx, pool), ratio60).decision, "ACCEPT");
  }
});

test("post-reservation utilization is a different hypothesis from tx-to-pool ratio", () => {
  const p = proposal("1", "100", "1000", "600", "1");
  assert.equal(evaluateThresholdCandidate(p, {
    kind: "ratio", ratioBps: 6000, ratioMode: "tx_to_pool",
  }).decision, "ACCEPT");
  assert.equal(evaluateThresholdCandidate(p, {
    kind: "ratio", ratioBps: 6000, ratioMode: "post_reservation_utilization",
  }).decision, "REJECT");
});

test("physical capacity overflow rejects before policy comparison", () => {
  const result = evaluateThresholdCandidate(proposal("1", "100", "100", "99", "2"), ratio60);
  assert.deepEqual(result, { decision: "REJECT", reasons: ["physical_capacity_exceeded"] });
});

test("malformed, negative, fractional, leading-zero and zero transaction values fail closed", () => {
  for (const txUnits of ["-1", "1.5", "01", "", "0", 1, null]) {
    assert.throws(() => evaluateThresholdCandidate(proposal(txUnits, "500"), ratio60));
  }
});

test("candidate comparison exposes disagreements instead of choosing a canonical law", () => {
  const results = compareThresholdCandidates(proposal("312", "520"), [
    { name: "ratio-60", policy: ratio60 },
    { name: "absolute-300-500", policy: absolute300500 },
    { name: "combined-60", policy: combined60 },
  ]);
  assert.deepEqual(results.map((r) => [r.name, r.decision]), [
    ["ratio-60", "ACCEPT"],
    ["absolute-300-500", "REJECT"],
    ["combined-60", "REJECT"],
  ]);
});
