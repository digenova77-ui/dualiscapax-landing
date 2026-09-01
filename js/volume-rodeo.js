/**
 * Joe shuffling rodeo. Smash a grain against every model until
 * one sit is homeostasis in One. Then stop. Keep going is force.
 */
(function (w) {
  var VERSION = "volume-rodeo-2026-09-01";
  var LAPS = 3;

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

  function shuffle(list) {
    var a = list.slice();
    var i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function homeostasis(row) {
    if (!row || row.veto) return false;
    if (row.status !== "ONE") return false;
    var aff = (row.affinity || []).length;
    var fri = (row.friction || []).length;
    if (aff < 1) return false;
    if (fri > aff) return false;
    if (row.model && row.model.family === "face" && row.model.id === "L4") return false;
    if (row.model && row.model.family === "face" && row.model.id === "L6") return false;
    return true;
  }

  function rodeo(grain) {
    if (!w.DCFit || !DCFit.models || !DCFit.smashOne) {
      return hole("NO_FIT_ENGINE");
    }
    var cx = DCFit.complexity(grain);
    if (cx.status === "HOLE") return hole("GRAIN_HOLE", { complexity: cx });

    var tried = [];
    var lap, ring, i, row;
    for (lap = 0; lap < LAPS; lap++) {
      ring = shuffle(DCFit.models());
      for (i = 0; i < ring.length; i++) {
        row = DCFit.smashOne(grain, ring[i]);
        row.lap = lap;
        tried.push(row);
        if (homeostasis(row)) {
          return {
            status: "ONE",
            homeostasis: true,
            sit: row,
            laps: lap + 1,
            tried: tried.length,
            complexity: cx,
            scientific_validation: false,
            v: VERSION
          };
        }
      }
    }
    return hole("NO_HOMEOSTASIS", {
      homeostasis: false,
      laps: LAPS,
      tried: tried.length,
      complexity: cx,
      best: tried.slice().sort(function (a, b) { return (b.score || 0) - (a.score || 0); })[0] || null
    });
  }

  w.DCRodeo = {
    version: VERSION,
    law: "SHUFFLE_UNTIL_HOMEOSTASIS",
    homeostasis: homeostasis,
    rodeo: rodeo,
    hole: hole
  };
})(typeof window !== "undefined" ? window : globalThis);
