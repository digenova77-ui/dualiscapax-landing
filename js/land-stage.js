/**
 * Landing stage — hologram in front, glass dropped back.
 * Sound on is law. Shut up still works after Unity preview.
 * Current as of: 2026-09-01
 */
(function (w) {
  var VERSION = "land-stage-v1-20260901";

  function well() {
    if (document.getElementById("holo-well")) return;
    var host = document.createElement("div");
    host.id = "holo-well";
    host.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 8; i++) {
      var ring = document.createElement("i");
      ring.style.setProperty("--z", String(-420 - i * 280) + "px");
      ring.style.setProperty("--s", String(0.55 + i * 0.12));
      host.appendChild(ring);
    }
    document.body.insertBefore(host, document.body.firstChild);
  }

  function bootHolo() {
    var stage = document.getElementById("iris-stage");
    if (!stage || !w.IrisHolo) return;
    IrisHolo.mount(stage);
    IrisHolo.setForm("orb");
    IrisHolo.setMood("listen");
    IrisHolo.setEnergy(0.42);
    w.addEventListener("pointermove", function (ev) {
      var x = (ev.clientX / Math.max(1, w.innerWidth)) * 2 - 1;
      var y = (ev.clientY / Math.max(1, w.innerHeight)) * 2 - 1;
      IrisHolo.lookAt(x, y);
      if (Math.abs(x) < 0.12 && Math.abs(y) < 0.18) IrisHolo.setMood("agree");
    }, { passive: true });
  }

  function greet() {
    if (w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!w.speechSynthesis) return;
    var muted = false;
    try { muted = localStorage.getItem("dc_field_mute") === "1"; } catch (e) {}
    if (muted) return;
    function say() {
      if (w.DCMute && DCMute.on && DCMute.on()) return;
      var u = new SpeechSynthesisUtterance("Truth prevails. Take a seat.");
      u.rate = 0.96;
      u.pitch = 1;
      try { speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e2) {}
      if (w.IrisHolo) { IrisHolo.setSpeaking(true); IrisHolo.setMood("intend"); }
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(say, 600); });
    else setTimeout(say, 800);
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
