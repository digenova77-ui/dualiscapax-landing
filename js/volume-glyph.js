/**
 * Volume glyphs. A solid in the cube stands in for a phrase or a page.
 * GitHub keeps English. One keeps the shape.
 */
(function (w) {
  var VERSION = "volume-glyph-2026-09-01";
  var BOOK = {
    HOLE: { id: "G-HOLE", solid: "ring", fill: 0, bind: "HOLE. Nothing seated." },
    ONE: { id: "G-ONE", solid: "tetra", fill: 0.22, bind: "ONE. First seated cell." },
    NO_FORCE: { id: "G-NF", solid: "wedge", fill: 0.18, bind: "NO_FORCE" },
    HOST_SAFE: { id: "G-HS", solid: "cube", fill: 0.34, bind: "HOST_SAFE" },
    CLEANUP_FIRST: { id: "G-CF", solid: "prism", fill: 0.2, bind: "CLEANUP_FIRST" },
    TRUTH_OR_NOTHING: { id: "G-TN", solid: "octa", fill: 0.28, bind: "TRUTH_OR_NOTHING" },
    L1: { id: "G-L1", solid: "tetra", fill: 0.16, yaw: 0, bind: "L1 look" },
    L2: { id: "G-L2", solid: "tetra", fill: 0.16, yaw: 60, bind: "L2 plug" },
    L3: { id: "G-L3", solid: "tetra", fill: 0.16, yaw: 120, bind: "L3 access" },
    L4: { id: "G-L4", solid: "tetra", fill: 0.16, yaw: 180, bind: "L4 ownership" },
    L5: { id: "G-L5", solid: "tetra", fill: 0.16, yaw: 240, bind: "L5 device" },
    L6: { id: "G-L6", solid: "tetra", fill: 0.16, yaw: 300, bind: "L6 root" },
    ZERO: { id: "G-W0", solid: "spindle", fill: 0.3, bind: "Ground Zero. API v1." },
    ONE_WORLD: { id: "G-W1", solid: "spindle", fill: 0.18, bind: "One. API v2." },
    FRICTION: { id: "G-F", solid: "tetra", fill: 0.2, bind: "Friction pipe" },
    AFFINITY: { id: "G-A", solid: "octa", fill: 0.2, bind: "Affinity pipe" },
    SMASH: { id: "G-X", solid: "kiss", fill: 0.26, bind: "Smash. One card." }
  };
  var BY_ID = {};
  Object.keys(BOOK).forEach(function (k) { BY_ID[BOOK[k].id] = BOOK[k]; });

  function hole(reason) {
    return { status: "HOLE", reason: reason || "HOLE_NOT_ZERO", token: "V|G-HOLE|ring|R|0|0", scientific_validation: false };
  }

  function tokenOf(g) {
    return ["V", g.id, g.solid, "R", String(g.fill == null ? 0 : g.fill), String(g.yaw || 0)].join("|");
  }

  function pack(phrase) {
    var key = String(phrase || "").trim();
    if (!key) return hole("NO_PHRASE");
    if (BOOK[key]) return { status: "ONE", token: tokenOf(BOOK[key]), glyph: BOOK[key], scientific_validation: false };
    var upper = key.toUpperCase().replace(/\s+/g, "_");
    if (BOOK[upper]) return { status: "ONE", token: tokenOf(BOOK[upper]), glyph: BOOK[upper], scientific_validation: false };
    if (key.indexOf("/") >= 0 || key.indexOf(".md") >= 0 || key.indexOf(".html") >= 0) return packPage(key);
    return hole("NO_BIND");
  }

  function unpack(token) {
    var parts = String(token || "").split("|");
    if (parts[0] !== "V" || parts.length < 3) return hole("BAD_TOKEN");
    if (parts[1] === "PAGE") {
      return {
        status: "INDEXED",
        token: token,
        glyph: { id: "PAGE", solid: "tetra", fill: 0.2, yaw: Number(parts[4]) || 0, bind: "page " + parts[2] },
        pageKey: parts[2],
        scientific_validation: false
      };
    }
    var g = BY_ID[parts[1]];
    if (!g) return hole("NO_BIND");
    return { status: "ONE", token: token, glyph: g, bind: g.bind, scientific_validation: false };
  }

  function fnv(s) {
    var h = 2166136261;
    s = String(s || "");
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function packPage(path) {
    var clean = String(path || "").replace(/^\.\//, "").replace(/\\/g, "/");
    if (!clean) return hole("NO_PAGE");
    var h = fnv(clean);
    var hex = ("00000000" + h.toString(16)).slice(-8);
    var yaw = h % 360;
    var fill = 0.14 + ((h >>> 8) % 18) / 100;
    var g = { id: "PAGE", solid: "tetra", fill: fill, yaw: yaw, bind: clean };
    return {
      status: "INDEXED",
      token: ["V", "PAGE", hex, "tetra", "R", String(fill), String(yaw)].join("|"),
      glyph: g,
      page: clean,
      scientific_validation: false
    };
  }

  function packCard(card) {
    card = card || {};
    var out = [];
    if (card.status === "HOLE") out.push(pack("HOLE"));
    else out.push(pack("ONE"));
    (card.refuse || "").split(/[.,;]/).forEach(function (bit) {
      var p = pack(bit.trim());
      if (p.status !== "HOLE") out.push(p);
    });
    if (card.faces) {
      ["L1", "L2", "L3", "L4", "L5", "L6"].forEach(function (f) {
        if (card.faces[f]) out.push(pack(f));
      });
    }
    if (card.world === 1) out.push(pack("ONE_WORLD"));
    else if (card.world === 0) out.push(pack("ZERO"));
    if (card.smash || card.friction || card.affinity) {
      out.push(pack("FRICTION"));
      out.push(pack("AFFINITY"));
      out.push(pack("SMASH"));
    }
    return {
      status: out.some(function (x) { return x.glyph && x.glyph.id === "G-HOLE"; }) && out.length === 1 ? "HOLE" : "INDEXED",
      tokens: out.map(function (x) { return x.token; }),
      glyphs: out.map(function (x) { return x.glyph; }).filter(Boolean),
      scientific_validation: false
    };
  }

  function drawSolid(ctx, cx, cy, r, solid, yaw) {
    var a = (yaw || 0) * Math.PI / 180;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.strokeStyle = "rgba(158,197,255,0.95)";
    ctx.fillStyle = "rgba(158,197,255,0.16)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (solid === "ring") {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (solid === "cube") {
      var s = r * 0.7;
      ctx.rect(-s, -s, s * 2, s * 2);
      ctx.fill(); ctx.stroke();
    } else if (solid === "octa") {
      ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (solid === "wedge") {
      ctx.moveTo(-r, r * 0.6); ctx.lineTo(r, r * 0.2); ctx.lineTo(-r * 0.2, -r); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (solid === "spindle") {
      ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.55, 0, 0, r); ctx.quadraticCurveTo(-r * 0.55, 0, 0, -r);
      ctx.fill(); ctx.stroke();
    } else if (solid === "kiss") {
      ctx.moveTo(-r * 0.2, -r); ctx.lineTo(-r, r * 0.6); ctx.lineTo(r * 0.15, r * 0.2); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r * 0.2, -r); ctx.lineTo(r, r * 0.6); ctx.lineTo(-r * 0.15, r * 0.2); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (solid === "prism") {
      ctx.moveTo(-r * 0.8, r * 0.5); ctx.lineTo(r * 0.8, r * 0.5); ctx.lineTo(r * 0.5, -r * 0.5); ctx.lineTo(-r * 0.5, -r * 0.5); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      ctx.moveTo(0, -r); ctx.lineTo(r * 0.86, r * 0.5); ctx.lineTo(-r * 0.86, r * 0.5); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function draw(canvas, packed) {
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext("2d");
    var wdt = canvas.width = canvas.clientWidth || 640;
    var hgt = canvas.height = canvas.clientHeight || 180;
    ctx.clearRect(0, 0, wdt, hgt);
    ctx.strokeStyle = "rgba(158,197,255,0.22)";
    ctx.strokeRect(12, 12, wdt - 24, hgt - 24);
    var glyphs = (packed && packed.glyphs) || [];
    if (!glyphs.length) {
      drawSolid(ctx, wdt / 2, hgt / 2, 28, "ring", 0);
      return packed;
    }
    var n = glyphs.length;
    var slot = Math.min(54, (wdt - 40) / n);
    glyphs.forEach(function (g, i) {
      var cx = 28 + slot * (i + 0.5);
      var r = 10 + (g.fill || 0) * 38;
      drawSolid(ctx, cx, hgt / 2, r, g.solid, g.yaw);
    });
    return packed;
  }

  w.DCGlyph = {
    version: VERSION,
    law: "SHAPE_FILLS_THE_CUBE",
    book: BOOK,
    pack: pack,
    unpack: unpack,
    packPage: packPage,
    packCard: packCard,
    draw: draw,
    hole: hole
  };
})(typeof window !== "undefined" ? window : globalThis);
