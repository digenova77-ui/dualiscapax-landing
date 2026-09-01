/**
 * Helix Tongue — draw a Dualis cell as DNA in a cube.
 * BIND stays the number. This is how the cell is seen.
 */
(function (w) {
  var VERSION = "helix-tongue-2026-09-01";
  var RATCHET = ["INDEXED", "CATALOGED", "SOURCED", "REVIEWED", "SEALED", "LIVE"];
  var STREAMS = ["bus", "care", "event", "portal", "pt", "sport", "office"];
  var FACES = ["L1", "L2", "L3", "L4", "L5", "L6"];

  function log10(n) {
    return Math.log(Math.max(0, Number(n) || 0) + 1) / Math.LN10;
  }

  function ratchetIndex(status) {
    var i = RATCHET.indexOf(String(status || "INDEXED"));
    return i < 0 ? 0 : i;
  }

  function streamsLit(streams) {
    var n = 0;
    STREAMS.forEach(function (s) { if (streams && streams[s]) n += 1; });
    return n;
  }

  function facesLit(faces) {
    var n = 0;
    FACES.forEach(function (f) { if (faces && faces[f]) n += 1; });
    return n;
  }

  function measure(cell) {
    if (!cell || cell.merger === "HOLE" || cell.id === "M-HOLE") {
      return {
        hole: true,
        twist: 0, pitch: 1, amplitude: 0, frequency: 0, phase: 0,
        chirality: "R", pairing: 0, residual: "SEED", wavelength: 7,
        radius: 0, volume: 0, coherence: 0, groove: "major",
        world: 0, api: "1", worldline: "", pack: "H:0:1:0:0:R:0"
      };
    }
    var bytes = (cell.physical && cell.physical.bytes) || 0;
    var numbers = cell.numbers || 0;
    var amp = log10(bytes || numbers);
    var litS = streamsLit(cell.streams);
    var litF = facesLit(cell.faces);
    var idx = ratchetIndex(cell.status);
    var paired = (cell.physical && (cell.physical.ulin || cell.physical.bytes || cell.physical.kind)) && cell.logical ? 1 : 0;
    var world = (w.DC_WORLD === 1 || (cell.logical && /PLAYGROUND|L2/.test(cell.logical.layer || ""))) ? 1 : 0;
    var m = {
      hole: false,
      twist: idx + 1,
      pitch: 1,
      amplitude: Math.round(amp * 1000) / 1000,
      frequency: Math.round((litS / 7) * 1000) / 1000,
      phase: Math.round((idx / 5) * 1000) / 1000,
      chirality: "R",
      pairing: paired,
      residual: cell.residual_unit || "SEED",
      wavelength: litS ? Math.round((7 / litS) * 1000) / 1000 : 7,
      radius: Math.round(log10(bytes) * 1000) / 1000,
      volume: paired * Math.max(1, litF),
      coherence: (cell.hash && paired) ? 1 : 0,
      groove: world === 1 ? "minor" : "major",
      world: world,
      api: world === 1 ? "2" : "1",
      worldline: cell.stamp || "",
      id: cell.id,
      pack: ""
    };
    m.pack = "H:" + m.twist + ":" + m.pitch + ":" + m.amplitude + ":" + m.phase + ":R:" + m.pairing;
    return m;
  }

  function draw(canvas, cell) {
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext("2d");
    var wdt = canvas.width = canvas.clientWidth || 640;
    var hgt = canvas.height = canvas.clientHeight || 420;
    ctx.clearRect(0, 0, wdt, hgt);
    var m = measure(cell);
    var cx = wdt * 0.5;
    var top = hgt * 0.12;
    var bot = hgt * 0.88;
    var turns = Math.max(1, m.twist);
    var amp = 28 + m.amplitude * 18;
    var t, i, x1, x2, y, phase;

    ctx.strokeStyle = "rgba(158,197,255,0.22)";
    ctx.lineWidth = 1;
    for (i = 0; i < 6; i++) {
      var ang = (Math.PI / 3) * i - Math.PI / 2;
      var hx = cx + Math.cos(ang) * (amp + 64);
      var hy = (top + bot) / 2 + Math.sin(ang) * (amp + 24);
      ctx.beginPath();
      ctx.arc(hx, hy, 7, 0, Math.PI * 2);
      var faceOn = cell && cell.faces && cell.faces[FACES[i]];
      ctx.fillStyle = faceOn ? "rgba(158,197,255,0.85)" : "rgba(158,197,255,0.12)";
      ctx.fill();
      ctx.stroke();
    }

    if (m.hole) {
      ctx.strokeStyle = "rgba(158,197,255,0.35)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, (top + bot) / 2, 46, 0, Math.PI * 2);
      ctx.stroke();
      return m;
    }

    ctx.strokeStyle = "rgba(245,215,110,0.55)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (t = 0; t <= 1; t += 0.01) {
      phase = t * turns * Math.PI * 2;
      x1 = cx + Math.sin(phase) * amp;
      y = top + t * (bot - top);
      if (t === 0) ctx.moveTo(x1, y); else ctx.lineTo(x1, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(96,165,250,0.7)";
    ctx.beginPath();
    for (t = 0; t <= 1; t += 0.01) {
      phase = t * turns * Math.PI * 2;
      x2 = cx - Math.sin(phase) * amp;
      y = top + t * (bot - top);
      if (t === 0) ctx.moveTo(x2, y); else ctx.lineTo(x2, y);
    }
    ctx.stroke();

    var rungs = 4 + turns;
    for (i = 0; i < rungs; i++) {
      t = (i + 0.5) / rungs;
      phase = t * turns * Math.PI * 2;
      x1 = cx + Math.sin(phase) * amp;
      x2 = cx - Math.sin(phase) * amp;
      y = top + t * (bot - top);
      ctx.strokeStyle = m.pairing ? "rgba(30,58,95,0.95)" : "rgba(255,180,180,0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath(); ctx.arc(x1, y, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath(); ctx.arc(x2, y, 4.2, 0, Math.PI * 2); ctx.fill();
    }

    STREAMS.forEach(function (s, idx) {
      if (!cell || !cell.streams || !cell.streams[s]) return;
      var yy = top + ((idx + 0.5) / 7) * (bot - top);
      ctx.strokeStyle = "rgba(200,240,210,0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var k = 0; k < 40; k++) {
        var xx = cx - amp - 70 + k * 3.6;
        var wave = Math.sin(k / m.wavelength + idx) * (6 + m.frequency * 8);
        if (k === 0) ctx.moveTo(xx, yy + wave); else ctx.lineTo(xx, yy + wave);
      }
      ctx.stroke();
    });

    return m;
  }

  function mount(el, cell) {
    var canvas = el;
    if (el && el.tagName !== "CANVAS") {
      canvas = el.querySelector("canvas") || document.createElement("canvas");
      if (!canvas.parentNode) el.appendChild(canvas);
    }
    if (canvas) {
      canvas.style.width = "100%";
      canvas.style.height = canvas.style.height || "420px";
    }
    return draw(canvas, cell || (w.DCMatrix && w.DCMatrix.load && w.DCMatrix.load()) || null);
  }

  w.HelixTongue = {
    version: VERSION,
    law: "SHAPE_IS_THE_FILE",
    measure: measure,
    draw: draw,
    mount: mount
  };
})(typeof window !== "undefined" ? window : globalThis);
