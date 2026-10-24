/**
 * Experimental threshold gauntlet.
 *
 * This module compares interpretations of historical limits without wiring
 * any candidate into production authorization or payment behavior.
 * All amounts are canonical integer strings in a caller-declared common unit.
 * It does not claim that the historical $300/$500 values share these units.
 */

const INTEGER = /^(0|[1-9][0-9]*)$/;
const BPS_DENOMINATOR = 10_000n;

function parseUnits(value, name, { positive = false } = {}) {
  if (typeof value !== "string" || !INTEGER.test(value)) {
    throw new TypeError(name + "_must_be_canonical_nonnegative_integer_string");
  }
  const parsed = BigInt(value);
  if (positive && parsed === 0n) throw new RangeError(name + "_must_be_positive");
  return parsed;
}

function ratioPass(numerator, denominator, ratioBps) {
  if (!Number.isSafeInteger(ratioBps) || ratioBps < 0 || ratioBps > 10_000) {
    throw new RangeError("ratio_bps_must_be_integer_0_to_10000");
  }
  return numerator * BPS_DENOMINATOR <= denominator * BigInt(ratioBps);
}

function checkInput(proposal) {
  if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) {
    throw new TypeError("proposal_must_be_object");
  }
  const txUnits = parseUnits(proposal.txUnits, "tx_units", { positive: true });
  const poolUnits = parseUnits(proposal.poolUnits, "pool_units", { positive: true });
  const poolCapacityUnits = parseUnits(proposal.poolCapacityUnits, "pool_capacity_units", { positive: true });
  const occupiedUnits = parseUnits(proposal.occupiedUnits, "occupied_units");
  const reservationUnits = parseUnits(proposal.reservationUnits, "reservation_units", { positive: true });
  if (occupiedUnits + reservationUnits > poolCapacityUnits) {
    return { valid: false, reason: "physical_capacity_exceeded" };
  }
  return {
    valid: true,
    txUnits,
    poolUnits,
    poolCapacityUnits,
    occupiedUnits,
    reservationUnits,
    postReservationUnits: occupiedUnits + reservationUnits,
  };
}

/**
 * policy:
 *  {kind:"ratio", ratioBps, ratioMode:"tx_to_pool"|"post_reservation_utilization"}
 *  {kind:"absolute", maxSingleTxUnits, maxPoolUnits}
 *  {kind:"combined", ratioBps, ratioMode, maxSingleTxUnits, maxPoolUnits}
 *
 * Historical limits are candidates only. Callers must declare units and policy
 * version outside this helper before any enforcement use.
 */
export function evaluateThresholdCandidate(proposal, policy) {
  const checked = checkInput(proposal);
  if (!checked.valid) return { decision: "REJECT", reasons: [checked.reason] };
  if (!policy || !["ratio", "absolute", "combined"].includes(policy.kind)) {
    throw new TypeError("unknown_policy_kind");
  }

  const reasons = [];
  const { txUnits, poolUnits, poolCapacityUnits, postReservationUnits } = checked;

  if (policy.kind === "absolute" || policy.kind === "combined") {
    const maxTx = parseUnits(policy.maxSingleTxUnits, "max_single_tx_units", { positive: true });
    const maxPool = parseUnits(policy.maxPoolUnits, "max_pool_units", { positive: true });
    if (txUnits > maxTx) reasons.push("single_transaction_limit_exceeded");
    if (poolUnits > maxPool) reasons.push("pool_amount_limit_exceeded");
  }

  if (policy.kind === "ratio" || policy.kind === "combined") {
    if (!["tx_to_pool", "post_reservation_utilization"].includes(policy.ratioMode)) {
      throw new TypeError("unknown_ratio_mode");
    }
    const ratioNumerator = policy.ratioMode === "tx_to_pool" ? txUnits : postReservationUnits;
    const ratioDenominator = policy.ratioMode === "tx_to_pool" ? poolUnits : poolCapacityUnits;
    if (!ratioPass(ratioNumerator, ratioDenominator, policy.ratioBps)) {
      reasons.push(policy.ratioMode === "tx_to_pool"
        ? "transaction_to_pool_ratio_exceeded"
        : "post_reservation_utilization_ratio_exceeded");
    }
  }

  return {
    decision: reasons.length === 0 ? "ACCEPT" : "REJECT",
    reasons,
    measurements: {
      txUnits: txUnits.toString(),
      poolUnits: poolUnits.toString(),
      poolCapacityUnits: poolCapacityUnits.toString(),
      postReservationUnits: postReservationUnits.toString(),
    },
    policyKind: policy.kind,
    ratioMode: policy.ratioMode || null,
    ratioBps: policy.ratioBps ?? null,
  };
}

export function compareThresholdCandidates(proposal, policies) {
  if (!Array.isArray(policies) || policies.length === 0) {
    throw new TypeError("policies_must_be_nonempty_array");
  }
  return policies.map(({ name, policy }) => ({
    name,
    ...evaluateThresholdCandidate(proposal, policy),
  }));
}
