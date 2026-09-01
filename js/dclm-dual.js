/**
 * Dual DCLM. Friction and affinity run together on one prompt, then smash.
 * One pipe alone is a hole.
 */
(function (w) {
  var VERSION = "dclm-dual-2026-09-01";
  var AXIOMS = ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"];
  var FACES = ["L1", "L2", "L3", "L4", "L5", "L6"];

  function hole(reason, extra) {
    var out = {
      status: "HOLE",
      reason: reason || "HOLE_NOT_ZERO",
      scientific_validation: false,
      ts: new Date().toISOString(),
      v: VERSION
    };
    if (extra) {
      for (var k in extra) out[k] = extra[k];
    }
    return out;
  }

  function friction(job) {
    job = job || {};
    var broken = AXIOMS.filter(function (a) {
      return job.axioms && job.axioms[a] === false;
    });
    var holes = [];
    if (broken.length) holes.push("AXIOM_VETO " + broken.join(","));
    if (!job.refuse) holes.push("NO_REFUSE");
    if (job.world === 1 && job.faces && job.faces.L4) holes.push("ONE_CANNOT_LIGHT_OWNERSHIP");
    if (job.faces && job.faces.L6 && job.publish) holes.push("ROOT_DOES_NOT_PUBLISH");
    if (job.invent) holes.push("TRUTH_OR_NOTHING");
    return {
      pipe: "F",
      veto: holes.length > 0,
      holes: holes,
      refuse: job.refuse ? String(job.refuse).slice(0, 240) : ""
    };
  }

  function affinity(job) {
    job = job || {};
    var faces = job.faces || {};
    var bits = FACES.map(function (f) { return faces[f] ? "1" : "0"; }).join("");
    var world = job.world === 1 ? 1 : 0;
    var binds = job.binds || [];
    return {
      pipe: "A",
      world: world,
      api: world === 1 ? "2" : "1",
      faces: bits,
      binds: binds,
      directive: job.directive ? String(job.directive).slice(0, 240) : "",
      stream: job.stream || ""
    };
  }

  function smash(job) {
    job = job || {};
    var f = friction(job);
    var a = affinity(job);
    if (f.veto) return hole(f.holes[0], { friction: f, affinity: a });
    if (!a.directive) return hole("NO_DIRECTIVE", { friction: f, affinity: a });
    if (!a.binds.length && !job.cell) {
      if (!job.faces || !job.faces.L1) return hole("NO_BIND", { friction: f, affinity: a });
    }
    return {
      status: job.cell ? "ONE" : "INDEXED",
      smash: "F\u2297A",
      world: a.world,
      api: a.api,
      faces: a.faces,
      directive: a.directive,
      refuse: f.refuse,
      stream: a.stream,
      scientific_validation: false,
      ts: new Date().toISOString(),
      v: VERSION,
      friction: f,
      affinity: a
    };
  }

  w.DCDual = {
    version: VERSION,
    law: "DUAL_DCLM_ONE_PROMPT",
    axioms: AXIOMS,
    faces: FACES,
    friction: friction,
    affinity: affinity,
    smash: smash
  };

  if (w.DCJob) w.DCJob.dual = smash;
})(typeof window !== "undefined" ? window : globalThis);
