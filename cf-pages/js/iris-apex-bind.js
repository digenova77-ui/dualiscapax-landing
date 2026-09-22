/**
 * Apex / Iris bind. One gesture wakes audio + picture.
 * Does not speak on load. Does not load dsap-engine on the lander.
 */
(function (w) {
  var VERSION = "iris-apex-bind-2026-09-22";
  if (w.__IRIS_APEX_BIND) return;
  w.__IRIS_APEX_BIND = true;
  var woken = false;

  function plateHost() {
    return document.querySelector(".lander-geo-wrap") ||
      document.getElementById("ask-iris") ||
      document.querySelector(".iris-spark-shell") ||
      document.querySelector(".lander-mark") ||
      document.body;
  }
  function ensurePlate() {
    var host = plateHost();
    if (!host) return null;
    var canvas = document.getElementById("iris-sphere") || host.querySelector("canvas.iris-sphere-plate");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "iris-sphere";
      canvas.className = "iris-sphere-plate";
      canvas.setAttribute("aria-label", "Iris sphere");
      if (host.classList && host.classList.contains("lander-geo-wrap")) {
        host.classList.add("has-sphere");
        host.style.width = "168px";
        host.style.height = "168px";
        host.appendChild(canvas);
      } else {
        canvas.style.width = "100%";
        canvas.style.maxWidth = "280px";
        canvas.style.height = "220px";
        canvas.style.display = "block";
        canvas.style.margin = "0.4rem auto";
        host.insertBefore(canvas, host.firstChild);
      }
    }
    if (w.IrisSphere && IrisSphere.mount) IrisSphere.mount(canvas);
    if (w.DSAP && DSAP.listen && w.IrisSphere && IrisSphere.pulse) {
      DSAP.listen(function (kind, i) { IrisSphere.pulse(i); });
    }
    return canvas;
  }
  function wake() {
    if (woken) return;
    woken = true;
    w.__IRIS_WAKE_AT = (w.performance && performance.now) ? performance.now() : Date.now();
    w.__IRIS_WAKE_ISO = new Date().toISOString();
    var canvas = ensurePlate();
    try {
      if (w.DualisAV && DualisAV.wake) DualisAV.wake(canvas, "whistle", 0);
      else if (w.DSAP && DSAP.wake) { DSAP.wake(); if (DSAP.place) DSAP.place("whistle", 0); }
      else if (w.DSAP && DSAP.unlock) DSAP.unlock();
    } catch (e) {}
    if (w.IrisSphere && IrisSphere.setWoken) IrisSphere.setWoken(true);
    if (w.IrisAV && IrisAV.unlock) {
      try { IrisAV.unlock(); } catch (e3) {}
    }
    var line = "I'm Iris. Looking is free. That tap sat a seat.";
    if (w.IrisPageVoice && IrisPageVoice.line) {
      var L = IrisPageVoice.line();
      if (L) line = L;
    }
    if (w.IrisAV && IrisAV.speak) {
      try { IrisAV.speak(line); if (w.IrisSphere) IrisSphere.setSpeaking(true); } catch (e4) {}
      setTimeout(function () { if (w.IrisSphere) IrisSphere.setSpeaking(false); }, 2400);
    } else if (w.IrisPageVoice && IrisPageVoice.invoke) {
      try { IrisPageVoice.invoke(); } catch (e5) {}
    }
  }
  function boot() {
    ensurePlate();
    w.addEventListener("pointerdown", wake, { capture: true, once: true });
    w.addEventListener("keydown", wake, { capture: true, once: true });
    w.addEventListener("pointermove", function (e) {
      if (!w.IrisSphere || !IrisSphere.lookAt) return;
      var x = (e.clientX / Math.max(1, w.innerWidth) - 0.5) * 2;
      var y = (e.clientY / Math.max(1, w.innerHeight) - 0.5) * 2;
      IrisSphere.lookAt(x, y);
    }, { passive: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  w.IrisApexBind = { version: VERSION, wake: wake };
})(window);
