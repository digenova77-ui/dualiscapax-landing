/**
 * Law refine. Grow a twig. Do not saw the block.
 */
(function (w) {
  var VERSION = "law-refine-2026-09-01";
  var TOP = ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"];

  function hole(reason, extra) {
    var out = {
      status: "HOLE",
      reason: reason || "HOLE_NOT_ZERO",
      scientific_validation: false,
      ts: new Date().toISOString(),
      v: VERSION
    };
    if (extra) Object.keys(extra).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }

  function walk(card) {
    card = card || {};
    var missing = [];
    TOP.forEach(function (wrd) {
      if (card.floor && card.floor[wrd] === false) missing.push("VETO_" + wrd);
      else if (card.floor && card.floor[wrd] == null && card[wrd] === false) missing.push("VETO_" + wrd);
    });
    if (!card.jobStart) missing.push("NO_JOB_START");
    if (!card.parent) missing.push("NO_PARENT_BLOCK");
    if (!card.tip) missing.push("NO_TIP");
    if (card.override && !card.walkedTop) missing.push("OVERRIDE_WITHOUT_WALK");
    if (missing.length) return hole(missing[0], { missing: missing });
    return { status: "ONE", walked: true, scientific_validation: false };
  }

  function twig(spec) {
    spec = spec || {};
    if (spec.remove || spec.deleteParent) return hole("CANNOT_REMOVE_PARENT");
    if (spec.rewriteParent) return hole("CANNOT_REWRITE_BLOCK");
    if (spec.override && !spec.walkedTop) return hole("OVERRIDE_WITHOUT_WALK");
    var gate = walk(spec);
    if (gate.status === "HOLE") return gate;
    if (!spec.definition) return hole("NO_FURTHER_DEFINITION");
    return {
      status: "ONE",
      kind: "TWIG",
      parent: spec.parent,
      definition: spec.definition,
      scientific_validation: false,
      v: VERSION
    };
  }

  w.DCRefine = {
    version: VERSION,
    law: "TWIG_NOT_SAW",
    top: TOP,
    walk: walk,
    twig: twig,
    hole: hole
  };
})(typeof window !== "undefined" ? window : globalThis);
