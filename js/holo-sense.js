/**
 * Holo sense. One energy drives depth, tone, and tap.
 * Twig on iris-hologram + iris-av. Does not replace them.
 */
(function (w) {
  var VERSION = "holo-sense-2026-09-01";
  var LAYERS = 100;
  var ctx = null;
  var oscA = null;
  var oscB = null;
  var gain = null;
  var filt = null;
  var unlocked = false;
  var energy = 0.18;
  var raf = 0;

  function hole(reason) {
    return { status: "HOLE", reason: reason || "HOLE_NOT_ZERO", scientific_validation: false };
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
    var reduced = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var n = reduced ? 0 : (w.innerWidth < 700 ? 36 : LAYERS);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var el = document.createElement("i");
      el.style.setProperty("--z", (-6 * i) + "px");
      el.style.setProperty("--s", String(1 + i * 0.003));
      el.style.opacity = String(0.045 + (i % 7) * 0.008);
      frag.appendChild(el);
    }
    host.appendChild(frag);
    document.documentElement.classList.add("holo-on");
    document.body.classList.add("holo-on");
    return host;
  }

  function unlock() {
    if (unlocked) return Promise.resolve(true);
    var AC = w.AudioContext || w.webkitAudioContext;
    if (!AC) return Promise.resolve(false);
    ctx = ctx || new AC();
    return ctx.resume().then(function () {
      gain = ctx.createGain();
      gain.gain.value = 0.0001;
      filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 420;
      oscA = ctx.createOscillator();
      oscB = ctx.createOscillator();
      oscA.type = "sine";
      oscB.type = "triangle";
      oscA.frequency.value = 110;
      oscB.frequency.value = 165;
      oscA.connect(filt);
      oscB.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      try { oscA.start(); oscB.start(); } catch (e) {}
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
    gain.gain.linearRampToValueAtTime(0.0008 + energy * 0.018, now + 0.08);
    filt.frequency.linearRampToValueAtTime(280 + energy * 720, now + 0.1);
    oscA.frequency.linearRampToValueAtTime(96 + energy * 40, now + 0.12);
    oscB.frequency.linearRampToValueAtTime(144 + energy * 70, now + 0.12);
    return energy;
  }

  function tap(kind) {
    if (!navigator.vibrate) return false;
    if (kind === "listen") navigator.vibrate([12, 30, 12]);
    else if (kind === "speak") navigator.vibrate([8, 18, 8, 18, 24]);
    else if (kind === "seat") navigator.vibrate(18);
    else navigator.vibrate(8);
    return true;
  }

  function pulse(kind) {
    if (kind === "listen") {
      setEnergy(0.55);
      if (w.IrisHolo && IrisHolo.setListening) IrisHolo.setListening(true);
      tap("listen");
    } else if (kind === "speak") {
      setEnergy(0.82);
      if (w.IrisHolo && IrisHolo.setSpeaking) IrisHolo.setSpeaking(true);
      tap("speak");
    } else if (kind === "rest") {
      setEnergy(0.2);
      if (w.IrisHolo) {
        if (IrisHolo.setSpeaking) IrisHolo.setSpeaking(false);
        if (IrisHolo.setListening) IrisHolo.setListening(false);
      }
    }
    return energy;
  }

  function loop() {
    raf = w.requestAnimationFrame(loop);
    var wellEl = document.getElementById("holo-well");
    if (!wellEl) return;
    var t = (performance.now() / 1000);
    wellEl.style.transform = "translateZ(" + (-40 - energy * 80) + "px) rotateZ(" + (t * 1.4) + "deg");
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
      document.removeEventListener("pointerdown", once);
    }
    document.addEventListener("pointerdown", once);
    if (!raf) loop();
    return VERSION;
  }

  w.HoloSense = {
    version: VERSION,
    law: "ONE_ENERGY_THREE_SENSES",
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
