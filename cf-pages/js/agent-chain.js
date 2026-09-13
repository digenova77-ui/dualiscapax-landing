/**
 * Forward chain. Agents pick up only from the latest tip.
 * Going back in time is a hole.
 */
(function (w) {
  var VERSION = "agent-chain-2026-09-01";
  var KEY = "dc_agent_tip_v1";

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

  function readTip() {
    try {
      var raw = w.localStorage && localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : (w.DC_AGENT_TIP || null);
    } catch (e) {
      return w.DC_AGENT_TIP || null;
    }
  }

  function writeTip(tip) {
    w.DC_AGENT_TIP = tip;
    try {
      if (w.localStorage) localStorage.setItem(KEY, JSON.stringify(tip));
    } catch (e) {}
    return tip;
  }

  function pickup(claimedParent) {
    var tip = readTip();
    if (!tip) return hole("NO_TIP");
    var live = tip.hash || tip.commit || "";
    if (!claimedParent) return hole("NO_PARENT", { tip: tip });
    if (String(claimedParent) !== String(live)) {
      return hole("STALE_PARENT", { wanted: live, claimed: claimedParent, tip: tip });
    }
    return {
      status: "ONE",
      tip: tip,
      parent: live,
      scientific_validation: false,
      v: VERSION
    };
  }

  function append(job) {
    job = job || {};
    var tip = readTip();
    var parent = tip ? (tip.hash || tip.commit) : "HOLE";
    if (job.parent && tip && String(job.parent) !== String(parent)) {
      return hole("STALE_PARENT", { wanted: parent, claimed: job.parent });
    }
    var next = {
      seq: tip ? (Number(tip.seq) || 0) + 1 : 1,
      stamp: new Date().toISOString(),
      parent: parent,
      commit: job.commit || parent,
      agent: job.agent || "unknown",
      job: job.job || "",
      status: job.status === "HOLE" ? "HOLE" : "ONE",
      hash: job.hash || ("T" + Date.now().toString(16))
    };
    writeTip(next);
    return { status: next.status === "HOLE" ? "HOLE" : "ONE", tip: next, scientific_validation: false };
  }

  w.DCChain = {
    version: VERSION,
    law: "PICKUP_FROM_TIP_ONLY",
    tip: readTip,
    pickup: pickup,
    append: append,
    hole: hole
  };
})(typeof window !== "undefined" ? window : globalThis);
