/**
 * Holo sense. One energy drives depth, space, tone, tap, and mood.
 * Twig on iris-hologram. Does not replace it. Not a person.
 */
(function (w) {
  var VERSION = "holo-sense-2026-09-01-d";
  var ctx = null;
  var oscA = null;
  var oscB = null;
  var oscC = null;
  var noise = null;
  var gain = null;
  var air = null;
  var filt = null;
  var panner = null;
  var delay = null;
  var delayGain = null;
  var comp = null;
  var unlocked = false;
  var energy = 0.18;
  var raf = 0;
  var leanX = 0;
  var leanY = 0;
  var buzz = 0;

  function hole(reason) {
    return { status: "HOLE", reason: reason || "HOLE_NOT_ZERO", scientific_validation: false };
  }

  function capLayers() {
    var reduced = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return 0;
    var wide = w.innerWidth || 0;
    if (wide < 700) return 48;
    if (wide < 1100) return 120;
    return 280;
  }

  function well() {
    var host = document.getElementById("holo-well");
    if (!host) {
      host = document.createElement("div");
      host.id = "holo-well";
      host.setAttribute("aria-hidden", "true");
      document.body.insertBefore(host, document.body.firstChild);
    }
    if (host.childNodes.length) return host;
    var n = capLayers();
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var el = document.createElement("i");
      el.style.setProperty("--z", (-18 * i) + "px");
      el.style.setProperty("--s", String(1 + i * 0.0045));
      el.style.opacity = String(0.03 + (i % 11) * 0.006);
      frag.appendChild(el);
    }
    host.appendChild(frag);
    document.documentElement.classList.add("holo-on");
    document.body.classList.add("holo-on");
    return host;
  }

  function noiseBuffer(ac) {
    var len = ac.sampleRate * 2;
    var buf = ac.createBuffer(1, len, ac.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.18;
    return buf;
  }

  function unlock() {
    if (unlocked) return Promise.resolve(true);
    var AC = w.AudioContext || w.webkitAudioContext;
    if (!AC) return Promise.resolve(false);
    ctx = ctx || new AC();
    return ctx.resume().then(function () {
      gain = ctx.createGain();
      gain.gain.value = 0.0001;
      air = ctx.createGain();
      air.gain.value = 0.00004;
      filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 380;
      panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      delay = ctx.createDelay(1.2);
      delay.delayTime.value = 0.22;
      delayGain = ctx.createGain();
      delayGain.gain.value = 0.12;
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -28;
      oscA = ctx.createOscillator();
      oscB = ctx.createOscillator();
      oscC = ctx.createOscillator();
      oscA.type = "sine";
      oscB.type = "triangle";
      oscC.type = "sine";
      oscA.frequency.value = 55;
      oscB.frequency.value = 82.5;
      oscC.frequency.value = 165;
      noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer(ctx);
      noise.loop = true;
      oscA.connect(filt);
      oscB.connect(filt);
      oscC.connect(filt);
      noise.connect(air);
      filt.connect(gain);
      air.connect(gain);
      gain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(gain);
      if (panner) { gain.connect(panner); panner.connect(comp); }
      else gain.connect(comp);
      comp.connect(ctx.destination);
      try { oscA.start(); oscB.start(); oscC.start(); noise.start(); } catch (e) {}
      unlocked = true;
      return true;
    }).catch(function () { return false; });
  }

  function setEnergy(n) {
    energy = Math.max(0, Math.min(1, n));
    if (w.IrisHolo && IrisHolo.setEnergy) IrisHolo.setEnergy(energy);
    if (!unlocked || !gain || !ctx) return energy;
    var now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.linearRampToValueAtTime(0.0006 + energy * 0.028, now + 0.06);
    air.gain.linearRampToValueAtTime(0.00003 + energy * 0.008, now + 0.08);
    filt.frequency.linearRampToValueAtTime(220 + energy * 1480, now + 0.1);
    oscA.frequency.linearRampToValueAtTime(48 + energy * 28, now + 0.12);
    oscB.frequency.linearRampToValueAtTime(72 + energy * 48, now + 0.12);
    oscC.frequency.linearRampToValueAtTime(144 + energy * 96, now + 0.12);
    return energy;
  }

  function tap(kind) {
    if (!navigator.vibrate) return false;
    if (kind === "listen") navigator.vibrate([16, 28, 16, 28, 40]);
    else if (kind === "agree") navigator.vibrate([12, 18, 12, 18, 28]);
    else if (kind === "lost") navigator.vibrate([30, 40, 18, 40, 30]);
    else if (kind === "curious") navigator.vibrate([8, 16, 8, 16, 8]);
    else if (kind === "intend") navigator.vibrate([10, 14, 10, 14, 10, 14, 36]);
    else if (kind === "seat") navigator.vibrate([22, 18, 44]);
    else navigator.vibrate(10);
    return true;
  }

  function pulse(kind) {
    var map = {
      listen: ["listen", 0.62],
      agree: ["agree", 0.7],
      lost: ["lost", 0.34],
      curious: ["curious", 0.58],
      intend: ["intend", 0.88],
      speak: ["intend", 0.9],
      seat: ["agree", 0.74],
      rest: ["rest", 0.18]
    };
    var row = map[kind] || map.rest;
    if (w.IrisHolo && IrisHolo.setMood) IrisHolo.setMood(row[0]);
    setEnergy(row[1]);
    if (kind === "listen" && w.IrisHolo && IrisHolo.setListening) IrisHolo.setListening(true);
    if (kind === "rest" && w.IrisHolo) {
      if (IrisHolo.setSpeaking) IrisHolo.setSpeaking(false);
      if (IrisHolo.setListening) IrisHolo.setListening(false);
    }
    tap(kind === "speak" ? "intend" : kind);
    return energy;
  }

  function loop() {
    raf = w.requestAnimationFrame(loop);
    var wellEl = document.getElementById("holo-well");
    if (!wellEl) return;
    var t = performance.now() / 1000;
    wellEl.style.transform =
      "translateZ(" + (-80 - energy * 220) + "px) rotateX(" + (leanY * 8) + "deg) rotateY(" + (leanX * 10) + "deg) rotateZ(" + (t * 2.2) + "deg)";
    if (panner) panner.pan.value = Math.max(-0.85, Math.min(0.85, leanX));
    if (unlocked && energy > 0.7 && navigator.vibrate && (t - buzz) > 1.6) {
      navigator.vibrate(8);
      buzz = t;
    }
  }

  function point(e) {
    var x = (e.clientX || 0) / Math.max(1, w.innerWidth);
    var y = (e.clientY || 0) / Math.max(1, w.innerHeight);
    leanX = (x - 0.5) * 2;
    leanY = (y - 0.5) * 2;
    if (w.IrisHolo && IrisHolo.lookAt) IrisHolo.lookAt(leanX, leanY);
    setEnergy(0.22 + Math.min(0.55, Math.abs(leanX) * 0.2 + Math.abs(leanY) * 0.12));
  }

  function tilt(e) {
    if (typeof e.gamma !== "number" || typeof e.beta !== "number") return;
    leanX = Math.max(-1, Math.min(1, e.gamma / 28));
    leanY = Math.max(-1, Math.min(1, (e.beta - 40) / 36));
    if (w.IrisHolo && IrisHolo.lookAt) IrisHolo.lookAt(leanX, leanY);
  }

  function mount(target) {
    well();
    if (w.IrisHolo && IrisHolo.mount) {
      var host = typeof target === "string" ? document.querySelector(target) : (target || document.getElementById("holo-stage") || document.getElementById("holo"));
      if (!host) {
        host = document.createElement("div");
        host.id = "holo-stage";
        host.className = "holo-front";
        var site = document.querySelector(".site");
        if (site) site.insertBefore(host, site.children[2] || site.firstChild);
        else document.body.appendChild(host);
      }
      IrisHolo.mount(host);
    }
    function once() {
      unlock();
      tap("look");
      document.removeEventListener("pointerdown", once);
    }
    document.addEventListener("pointerdown", once);
    document.addEventListener("pointermove", point, { passive: true });
    w.addEventListener("deviceorientation", tilt);
    if (!raf) loop();
    return VERSION;
  }

  w.HoloSense = {
    version: VERSION,
    law: "ONE_ENERGY_MOOD_SENSES",
    mount: mount,
    unlock: unlock,
    setEnergy: setEnergy,
    pulse: pulse,
    tap: tap,
    hole: hole
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { mount(); });
  } else {
    mount();
  }
})(typeof window !== "undefined" ? window : globalThis);
