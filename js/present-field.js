/** One field. Letters are lights. Voice walks. Scroll is time. */
(function (w) {
  var VERSION = "present-field-2026-09-01";
  var canvas = null;
  var ctx = null;
  var glyphs = [];
  var index = 0;
  var raf = 0;
  var t0 = 0;
  var talking = false;

  function hole(r) { return { status: "HOLE", reason: r || "HOLE_NOT_ZERO" }; }

  function takeText() {
    var root = document.querySelector(".site");
    if (!root) return "";
    var parts = [];
    var nodes = root.querySelectorAll("h1,.lede,.eyebrow,.law,.warn,p");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].closest("header,nav,button,input,footer,#holo-stage")) continue;
      var t = (nodes[i].innerText || "").trim();
      if (t) parts.push(t);
    }
    return parts.join(" \u2014 ");
  }

  function layout(text) {
    glyphs = [];
    var W = canvas.width, H = canvas.height;
    var size = Math.max(22, Math.min(42, Math.floor(W / 28)));
    ctx.font = "600 " + size + "px \"IBM Plex Sans\",system-ui,sans-serif";
    var x = W * 0.1, y = H * 0.28, line = size * 1.45, max = W * 0.9;
    var chars = String(text || "").split("");
    if (chars.length > 720) chars = chars.slice(0, 720);
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      var wdt = ctx.measureText(ch === " " ? " " : ch).width;
      if (x + wdt > max) { x = W * 0.1; y += line; }
      glyphs.push({ ch: ch, x: x, y: y, z: (Math.sin(i * 0.17) * 0.5 + 0.5), i: i });
      x += wdt;
    }
  }

  function size() {
    if (!canvas) return;
    var dpr = Math.min(w.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w.innerWidth * dpr);
    canvas.height = Math.floor(w.innerHeight * dpr);
    canvas.style.width = w.innerWidth + "px";
    canvas.style.height = w.innerHeight + "px";
    layout(takeText());
  }

  function draw(now) {
    raf = w.requestAnimationFrame(draw);
    if (!ctx) return;
    if (!t0) t0 = now || performance.now();
    var t = ((now || performance.now()) - t0) / 1000;
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    var cx = W * 0.5, cy = H * 0.42;
    var R = Math.min(W, H) * (0.09 + Math.sin(t * 1.2) * 0.008);
    var g = ctx.createRadialGradient(cx, cy, 4, cx, cy, R * 6);
    g.addColorStop(0, "rgba(255,230,160,0.16)");
    g.addColorStop(0.35, "rgba(255,170,60,0.06)");
    g.addColorStop(1, "rgba(0,0,8,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,210,90,0.55)";
    ctx.fill();
    var size = Math.max(22, Math.min(42, Math.floor(W / 28)));
    ctx.textBaseline = "alphabetic";
    for (var i = 0; i < glyphs.length; i++) {
      var gl = glyphs[i];
      if (i > index && i > index + 1) continue;
      var live = i === index;
      var past = i < index;
      var s = size * (0.82 + gl.z * 0.28) * (live ? 1.18 : 1);
      ctx.font = (live ? "700 " : "600 ") + s + "px \"IBM Plex Sans\",system-ui,sans-serif";
      if (live) {
        ctx.fillStyle = "#fff6d8";
        ctx.shadowColor = "rgba(255,210,120,0.95)";
        ctx.shadowBlur = 24;
      } else if (past) {
        ctx.fillStyle = "rgba(210,224,255," + (0.28 + gl.z * 0.35) + ")";
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.shadowBlur = 0;
      }
      ctx.fillText(gl.ch, gl.x, gl.y + Math.sin(t * 1.4 + gl.z * 4) * (live ? 3 : 0.6));
    }
    ctx.shadowBlur = 0;
  }

  function voice() {
    if (!w.speechSynthesis) return null;
    var list = w.speechSynthesis.getVoices() || [];
    return list.filter(function (v) {
      return /en/i.test(v.lang || "") && /(natural|neural|premium|samantha|aria|google)/i.test(v.name || "");
    })[0] || list.filter(function (v) { return /^en/i.test(v.lang || ""); })[0] || list[0] || null;
  }

  function speak(from) {
    if (!w.speechSynthesis) { index = glyphs.length; return hole("NO_VOICE"); }
    w.speechSynthesis.cancel();
    index = Math.max(0, from || 0);
    var text = glyphs.slice(index).map(function (g) { return g.ch; }).join("");
    if (!text.trim()) return hole("NO_TEXT");
    var u = new SpeechSynthesisUtterance(text);
    var v = voice();
    if (v) u.voice = v;
    u.rate = 0.96;
    talking = true;
    var base = index;
    u.onboundary = function (e) {
      if (typeof e.charIndex !== "number") return;
      index = Math.min(glyphs.length, base + e.charIndex);
    };
    u.onend = function () { talking = false; index = glyphs.length; };
    w.speechSynthesis.speak(u);
    return { status: "ONE", from: index };
  }

  function onWheel(e) {
    var step = Math.max(1, Math.round(Math.abs(e.deltaY) / 3));
    index = Math.max(0, Math.min(glyphs.length, index + (e.deltaY > 0 ? step : -step)));
    if (w.speechSynthesis) w.speechSynthesis.cancel();
    talking = false;
    clearTimeout(onWheel._t);
    onWheel._t = setTimeout(function () { speak(index); }, 200);
  }

  function mount() {
    if (w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches) return hole("REDUCED_MOTION");
    if (document.getElementById("present-field")) return { status: "ONE", already: true };
    canvas = document.createElement("canvas");
    canvas.id = "present-field";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d", { alpha: true });
    document.documentElement.classList.add("present-on");
    document.body.classList.add("present-on");
    size();
    w.addEventListener("resize", size);
    w.addEventListener("wheel", onWheel, { passive: true });
    document.addEventListener("pointerdown", function once() {
      speak(0);
      document.removeEventListener("pointerdown", once);
    });
    if (!raf) draw();
    return { status: "ONE", glyphs: glyphs.length, version: VERSION };
  }

  w.DCPresent = { version: VERSION, law: "FIELD_NOT_STACK", mount: mount, speak: speak };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})(typeof window !== "undefined" ? window : globalThis);
