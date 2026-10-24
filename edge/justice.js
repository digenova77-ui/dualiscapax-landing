/**
 * Diamond justice contract.
 * The project's own rules. Not a state. Not a theory of the whole society.
 * LAW WINS. NOT_FOR_EMISSION.
 */
export const JUSTICE = {
  protocol: "DIAMOND.JUSTICE.v1",
  law: "LAW WINS",
  origin: "immutable",
  boundary: "NOT_FOR_EMISSION",
  order: ["need", "labor", "fruit", "merit"],
  principles: {
    look: "free",
    ability: "earns nothing alone",
    merit: "follows proof. not for sale",
    efuse: "ceiling and covenant. not a tradeable charm",
    unifi3: "identity. bound by evidence",
    peg: "same for all. no preferred tribe",
    worth: "not scored"
  },
  spend: "none"
};

export function gradeClaim(claim) {
  if (!claim || typeof claim !== "object") return { ok: false, reason: "bad claim" };
  if (claim.look === true && claim.pay) return { ok: false, reason: "looking is free" };
  if (claim.merit && !claim.proof) return { ok: false, reason: "merit requires proof" };
  if (claim.sell === "merit") return { ok: false, reason: "merit is not for sale" };
  if (claim.trade === "efuse") return { ok: false, reason: "efuse is not a tradeable charm" };
  if (claim.emit) return { ok: false, reason: "NOT_FOR_EMISSION" };
  if (claim.worth != null) return { ok: false, reason: "worth is not scored" };
  if (claim.tribe) return { ok: false, reason: "no preferred tribe" };
  return { ok: true, protocol: JUSTICE.protocol, boundary: JUSTICE.boundary };
}

export function report() {
  return JUSTICE;
}
