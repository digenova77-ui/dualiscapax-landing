/**
 * DCLM job start. The six-matrix cube is the analysis.
 * Skip the card and the job is a hole.
 */
(function (w) {
  var VERSION = "dclm-job-2026-09-01";
  var AXIOMS = ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"];
  var FACES = ["L1", "L2", "L3", "L4", "L5", "L6"];

  function hole(reason) {
    return {
      status: "HOLE",
      reason: reason || "HOLE_NOT_ZERO",
      scientific_validation: false,
      ts: new Date().toISOString()
    };
  }

  function analyze(job) {
    job = job || {};
    var broken = AXIOMS.filter(function (a) { return job.axioms && job.axioms[a] === false; });
    if (broken.length) return hole("AXIOM_VETO " + broken.join(","));
    if (!job.directive) return hole("NO_DIRECTIVE");
    if (!job.refuse) return hole("NO_REFUSE");
    var world = job.world === 1 ? 1 : 0;
    var faces = job.faces || {};
    if (world === 1 && faces.L4) return hole("ONE_CANNOT_LIGHT_OWNERSHIP");
    if (faces.L6 && job.publish) return hole("ROOT_DOES_NOT_PUBLISH");
    var bits = FACES.map(function (f) { return faces[f] ? "1" : "0"; }).join("");
    return {
      status: job.cell ? "ONE" : "INDEXED",
      world: world,
      api: world === 1 ? "2" : "1",
      faces: bits,
      directive: String(job.directive).slice(0, 240),
      refuse: String(job.refuse).slice(0, 240),
      scientific_validation: false,
      ts: new Date().toISOString(),
      v: VERSION
    };
  }

  w.DCJob = { version: VERSION, law: "EVERY_JOB_BEGINS_WITH_DCLM", axioms: AXIOMS, faces: FACES, analyze: analyze, hole: hole };
})(typeof window !== "undefined" ? window : globalThis);
