/**
 * Volume fit. In One, only geometry complexity differentiates occupants.
 * Small grains sit inside larger pits. Fit is Dual DCLM smash, not a name.
 */
(function (w) {
  var VERSION = "volume-fit-2026-09-01";
  var FACES = ["L1", "L2", "L3", "L4", "L5", "L6"];
  var STREAMS = ["bus", "care", "event", "portal", "pt", "sport", "office"];
  var PIPES = ["FRICTION", "AFFINITY"];
  var WORLDS = [0, 1];

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

  function asGrain(raw) {
    raw = raw || {};
    var faces = raw.faces || {};
    var streams = raw.streams || {};
    var glyphs = raw.glyphs || [];
    var fill = Number(raw.fill);
    if (!isFinite(fill)) {
      fill = glyphs.reduce(function (n, g) { return n + (Number(g && g.fill) || 0); }, 0);
    }
    if (fill > 1) fill = 1;
    return {
      id: raw.id || "",
      glyphs: glyphs,
      faces: faces,
      streams: streams,
      pair: raw.pair ? 1 : 0,
      fill: fill,
      world: raw.world === 1 ? 1 : 0
    };
  }

  function complexity(raw) {
    var g = asGrain(raw);
    if (!g.glyphs.length && !g.pair && g.fill <= 0) {
      return hole("HOLE_NOT_ZERO", { complexity: 0, parts: 0, fill: 0 });
    }
    var solids = {};
    g.glyphs.forEach(function (x) {
      if (x && x.solid) solids[x.solid] = true;
    });
    var faceN = 0, streamN = 0;
    FACES.forEach(function (f) { if (g.faces[f]) faceN += 1; });
    STREAMS.forEach(function (s) { if (g.streams[s]) streamN += 1; });
    var parts = Math.max(g.glyphs.length, 1);
    var kinds = Object.keys(solids).length;
    var score = parts + kinds + faceN + streamN + g.pair + g.fill;
    return {
      status: "INDEXED",
      complexity: Math.round(score * 1000) / 1000,
      parts: parts,
      solids: kinds,
      faces: faceN,
      streams: streamN,
      pair: g.pair,
      fill: Math.round(g.fill * 1000) / 1000,
      scientific_validation: false
    };
  }

  function models() {
    var out = [];
    FACES.forEach(function (f) { out.push({ family: "face", id: f }); });
    STREAMS.forEach(function (s) { out.push({ family: "stream", id: s }); });
    PIPES.forEach(function (p) { out.push({ family: "pipe", id: p }); });
    WORLDS.forEach(function (n) { out.push({ family: "world", id: n === 1 ? "ONE" : "ZERO" }); });
    return out;
  }

  function smashOne(grain, model) {
    grain = asGrain(grain);
    model = model || {};
    var friction = [];
    var affinity = [];

    if (!grain.glyphs.length && !grain.pair && grain.fill <= 0) {
      friction.push("GRAIN_HOLE");
    }
    if (model.family === "face" && model.id === "L4" && grain.world === 1) {
      friction.push("ONE_CANNOT_LIGHT_OWNERSHIP");
    }
    if (model.family === "face" && model.id === "L6" && grain.world === 1) {
      friction.push("ROOT_DOES_NOT_PUBLISH");
    }

    if (model.family === "face" && grain.faces[model.id]) affinity.push("FACE_BIND");
    if (model.family === "stream" && grain.streams[model.id]) affinity.push("STREAM_BIND");
    if (model.family === "pipe" && model.id === "FRICTION") affinity.push("PIPE_F");
    if (model.family === "pipe" && model.id === "AFFINITY") affinity.push("PIPE_A");
    if (model.family === "world" && model.id === "ONE" && grain.world === 1) affinity.push("WORLD_BIND");
    if (model.family === "world" && model.id === "ZERO" && grain.world === 0) affinity.push("WORLD_BIND");

    if (model.family === "face" && !grain.faces[model.id] && model.id !== "L1") {
      friction.push("NO_FACE");
    }
    if (model.family === "stream" && !grain.streams[model.id]) {
      friction.push("NO_STREAM");
    }

    var veto = friction.indexOf("GRAIN_HOLE") >= 0
      || friction.indexOf("ONE_CANNOT_LIGHT_OWNERSHIP") >= 0
      || friction.indexOf("ROOT_DOES_NOT_PUBLISH") >= 0;

    var score = veto ? 0 : (affinity.length - friction.length);
    return {
      model: model,
      friction: friction,
      affinity: affinity,
      veto: veto,
      score: score,
      status: veto ? "HOLE" : (affinity.length ? "ONE" : "HOLE"),
      scientific_validation: false
    };
  }

  function fit(grain) {
    grain = asGrain(grain);
    var cx = complexity(grain);
    if (cx.status === "HOLE") return hole(cx.reason, { complexity: cx });
    var rows = models().map(function (m) { return smashOne(grain, m); });
    rows.sort(function (a, b) { return b.score - a.score; });
    var best = rows[0] || null;
    return {
      status: best && best.status === "ONE" ? "ONE" : "HOLE",
      complexity: cx,
      best: best,
      rows: rows,
      scientific_validation: false
    };
  }

  function fitAll(grains) {
    var list = Array.isArray(grains) ? grains : [];
    if (!list.length) return hole("NO_GRAIN");
    return {
      status: "INDEXED",
      results: list.map(function (g, i) {
        var row = fit(g);
        row.index = i;
        return row;
      }),
      scientific_validation: false
    };
  }

  function nest(pit, grain) {
    var sit = fit(grain);
    if (sit.status === "HOLE") return hole(sit.best && sit.best.friction && sit.best.friction[0] || "NO_FIT", { sit: sit });
    pit = asGrain(pit);
    grain = asGrain(grain);
    var next = {
      id: pit.id || "PIT",
      glyphs: pit.glyphs.concat(grain.glyphs.length ? grain.glyphs : [{ solid: "tetra", fill: grain.fill || 0.08 }]),
      faces: pit.faces,
      streams: pit.streams,
      pair: pit.pair || grain.pair,
      fill: Math.min(1, pit.fill + (grain.fill || 0.08)),
      world: pit.world
    };
    FACES.forEach(function (f) { if (grain.faces[f]) next.faces[f] = true; });
    STREAMS.forEach(function (s) { if (grain.streams[s]) next.streams[s] = true; });
    return {
      status: "ONE",
      pit: next,
      complexity: complexity(next),
      grainSit: sit.best,
      scientific_validation: false
    };
  }

  w.DCFit = {
    version: VERSION,
    law: "COMPLEXITY_ONLY",
    models: models,
    complexity: complexity,
    smashOne: smashOne,
    fit: fit,
    fitAll: fitAll,
    nest: nest,
    hole: hole
  };
})(typeof window !== "undefined" ? window : globalThis);
