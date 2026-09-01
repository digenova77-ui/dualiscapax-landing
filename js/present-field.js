/** One field. Letters are lights. Scroll is a tape. Agents still only move forward. */
(function (w) {
  var VERSION = "present-field-2026-09-01-b";
  var canvas = null;
  var ctx = null;
  var glyphs = [];
  var index = 0;
  var raf = 0;
  var t0 = 0;
  var dir = 1;
  var rate = 1;
  var ac = null;
  var washBuf = null;
  var washRev = null;
  var washNode = null;

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

  function ensureAudio() {
    var AC = w.AudioContext || w.webkitAudioContext;
    if (!AC) return null;
    ac = ac || new AC();
    if (!washBuf) {
      var n = Math.floor((ac.sampleRate || 44100) * 0.42);
      washBuf = ac.createBuffer(1, n, ac.sampleRate);
      washRev = ac.createBuffer(1, n, ac.sampleRate);
      var a = washBuf.getChannelData(0);
      var b = washRev.getChannelData(0);
      for (var i = 0; i < n; i++) {
        var env = Math.sin((i / n) * Math.PI);
        var s = Math.sin(i * 0.031) * 0.35 + Math.sin(i * 0.017) * 0.2 + (Math.random() * 2 - 1) * 0.08;
        a[i] = s * env * 0.22;
      }
      for (var j = 0; j < n; j++) b[j] = a[n - 1 - j];
    }
    return ac;
  }

  function playWash(reverse, speed) {
    var ctxA = ensureAudio();
    if (!ctxA) return hole("NO_AUDIO");
    try { if (ctxA.state === "suspended") ctxA.resume(); } catch (e) {}
    if (washNode) {
      try { washNode.stop(); } catch (e2) {}
    }
    var src = ctxA.createBufferSource();
    src.buffer = reverse ? washRev : washBuf;
    src.playbackRate.value = Math.max(0.45, Math.min(3.2, speed || 1));
    var g = ctxA.createGain();
    g.gain.value = reverse ? 0.22 : 0.12;
    src.connect(g);
    g.connect(ctxA.destination);
    try { src.start(); } catch (e3) {}
    washNode = src;
    return { status: "ONE", reverse: !!reverse, rate: src.playbackRate.value };
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
    var sun = ctx.createRadialGradient(cx, cy, 4, cx, cy, R * 6);
    sun.addColorStop(0, dir < 0 ? "rgba(180,210,255,0.16)" : "rgba(255,230,160,0.16)");
    sun.addColorStop(1, "rgba(0,0,8,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = dir < 0 ? "rgba(170,200,255,0.5)" : "rgba(255,210,90,0.55)";
    ctx.fill();
    var size = Math.max(22, Math.min(42, Math.floor(W / 28)));
    ctx.textBaseline = "alphabetic";
    for (var i = 0; i < glyphs.length; i++) {
      var gl = glyphs[i];
      if (i > index + 1) continue;
      var live = i === index;
      var past = i < index;
      var s = size * (0.82 + gl.z * 0.28) * (live ? 1.18 : 1);
      ctx.font = (live ? "700 " : "600 ") + s + "px \"IBM Plex Sans\",system-ui,sans-serif";
      var ch = gl.ch;
      if (live && dir < 0 && ch && ch.trim()) ch = ch;
      if (live) {
        ctx.fillStyle = dir < 0 ? "#d8e8ff" : "#fff6d8";
        ctx.shadowColor = dir < 0 ? "rgba(140,190,255,0.95)" : "rgba(255,210,120,0.95)";
        ctx.shadowBlur = 24;
      } else if (past) {
        ctx.fillStyle = "rgba(210,224,255," + (0.28 + gl.z * 0.35) + ")";
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.shadowBlur = 0;
      }
      var drawX = gl.x;
      if (live && dir < 0) drawX = gl.x - (rate - 1) * 2;
      ctx.fillText(ch, drawX, gl.y + Math.sin(t * 1.4 + gl.z * 4) * (live ? 3 : 0.6));
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = dir < 0 ? "rgba(180,210,255,0.55)" : "rgba(255,224,170,0.5)";
    ctx.font = "600 " + Math.round(Math.max(10, W * 0.012)) + "px \"IBM Plex Mono\",monospace";
    ctx.textAlign = "center";
    ctx.fillText(dir < 0 ? "TAPE · BACK · " + rate.toFixed(1) + "x" : "TAPE · FWD", W * 0.5, H * 0.94);
    ctx.textAlign = "start";
  }

  function voice() {
    if (!w.speechSynthesis) return null;
    var list = w.speechSynthesis.getVoices() || [];
    return list.filter(function (v) {
      return /en/i.test(v.lang || "") && /(natural|neural|premium|samantha|aria|google)/i.test(v.name || "");
    })[0] || list.filter(function (v) { return /^en/i.test(v.lang || ""); })[0] || list[0] || null;
  }

  function speak(from) {
    dir = 1;
    if (!w.speechSynthesis) { index = glyphs.length; return hole("NO_VOICE"); }
    w.speechSynthesis.cancel();
    index = Math.max(0, from || 0);
    var text = glyphs.slice(index).map(function (g) { return g.ch; }).join("");
    if (!text.trim()) return hole("NO_TEXT");
    var u = new SpeechSynthesisUtterance(text);
    var v = voice();
    if (v) u.voice = v;
    u.rate = Math.max(0.7, Math.min(1.15, 0.96));
    var base = index;
    u.onboundary = function (e) {
      if (typeof e.charIndex !== "number" || dir < 0) return;
      index = Math.min(glyphs.length, base + e.charIndex);
    };
    u.onend = function () { if (dir > 0) index = glyphs.length; };
    w.speechSynthesis.speak(u);
    return { status: "ONE", from: index, dir: dir };
  }

  function onWheel(e) {
    var step = Math.max(1, Math.round(Math.abs(e.deltaY) / 3));
    dir = e.deltaY < 0 ? -1 : 1;
    rate = Math.max(0.45, Math.min(3.2, Math.abs(e.deltaY) / 80));
    index = Math.max(0, Math.min(glyphs.length, index + (dir * step)));
    if (w.speechSynthesis) w.speechSynthesis.cancel();
    playWash(dir < 0, rate);
    clearTimeout(onWheel._t);
    onWheel._t = setTimeout(function () {
      if (dir < 0) return;
      speak(index);
    }, 200);
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
      ensureAudio();
      speak(0);
      document.removeEventListener("pointerdown", once);
    });
    if (!raf) draw();
    return { status: "ONE", glyphs: glyphs.length, version: VERSION };
  }

  w.DCPresent = {
    version: VERSION,
    law: "TAPE_NOT_TIME_TRAVEL",
    mount: mount,
    speak: speak,
    state: function () { return { index: index, dir: dir, rate: rate, glyphs: glyphs.length }; }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})(typeof window !== "undefined" ? window : globalThis);
