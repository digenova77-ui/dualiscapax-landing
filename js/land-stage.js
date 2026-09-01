/**
 * Landing stage — hologram in front, glass dropped back.
 * Sound on is law. Shut up still works after Unity preview.
 * Theme is painted before the visitor sits.
 * Current as of: 2026-09-01g
 */
(function (w) {
  var VERSION = "land-stage-v3-20260901g";

  function well() {
    if (document.getElementById("holo-well")) return;
    var host = document.createElement("div");
    host.id = "holo-well";
    host.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 10; i++) {
      var ring = document.createElement("i");
      ring.style.setProperty("--z", String(-280 - i * 240) + "px");
      ring.style.setProperty("--s", String(0.42 + i * 0.11));
      host.appendChild(ring);
    }
    document.body.insertBefore(host, document.body.firstChild);
  }

  function bootHolo() {
    var stage = document.getElementById("iris-stage");
    if (!stage || !w.IrisHolo) return;
    IrisHolo.mount(stage);
    IrisHolo.setForm("orb");
    IrisHolo.setMood("curious");
    IrisHolo.setEnergy(0.48);
    w.addEventListener("pointermove", function (ev) {
      var x = (ev.clientX / Math.max(1, w.innerWidth)) * 2 - 1;
      var y = (ev.clientY / Math.max(1, w.innerHeight)) * 2 - 1;
      IrisHolo.lookAt(x, y);
      var near = Math.abs(x) < 0.14 && Math.abs(y) < 0.22;
      IrisHolo.setMood(near ? "agree" : "curious");
    }, { passive: true });
  }

  function caption(text) {
    var el = document.getElementById("iris-line");
    if (!el) return;
    el.textContent = text;
  }

  function greet() {
    if (w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!w.speechSynthesis) return;
    var muted = false;
    try { muted = localStorage.getItem("dc_field_mute") === "1"; } catch (e) {}
    if (muted) { caption("Sound is off. You can turn it on."); return; }
    function say() {
      if (w.DCMute && DCMute.muted && DCMute.muted()) return;
      var line = "Truth prevails. Take a seat. Onboard is the goal of every room.";
      caption(line);
      var u = new SpeechSynthesisUtterance(line);
      u.rate = 0.96;
      u.pitch = 1;
      u.onstart = function () {
        if (w.IrisHolo) { IrisHolo.setSpeaking(true); IrisHolo.setMood("intend"); IrisHolo.setEnergy(0.72); }
      };
      u.onend = function () {
        if (w.IrisHolo) { IrisHolo.setSpeaking(false); IrisHolo.setMood("listen"); IrisHolo.setEnergy(0.42); }
      };
      try { speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e2) {}
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(say, 500); });
    else setTimeout(say, 700);
  }

  function boot() {
    document.documentElement.classList.add("holo-on", "land-direct");
    document.body.classList.add("holo-on");
    well();
    bootHolo();
    if (w.DCTheme && DCTheme.apply) DCTheme.apply("nation", { keyword: "Nation" });
    greet();
  }

  w.DCLand = { version: VERSION, boot: boot };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : globalThis);
