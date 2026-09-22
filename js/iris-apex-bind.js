(function (w) {
  if (w.__IRIS_APEX_BIND) return; w.__IRIS_APEX_BIND = true;
  var woken = false;
  function ensure() {
    var host = document.getElementById("iris-plate") || document.getElementById("ask-iris") || document.body;
    var canvas = document.getElementById("iris-sphere");
    if (!canvas) { canvas = document.createElement("canvas"); canvas.id = "iris-sphere"; canvas.width = 220; canvas.height = 220; host.insertBefore(canvas, host.firstChild); }
    if (w.IrisSphere && IrisSphere.mount) IrisSphere.mount(canvas);
    if (w.DSAP && DSAP.listen && w.IrisSphere && IrisSphere.pulse) DSAP.listen(function (k, i) { IrisSphere.pulse(i); });
    return canvas;
  }
  function wake() {
    if (woken) return; woken = true; ensure();
    try { if (w.DualisAV && DualisAV.wake) DualisAV.wake(null, "whistle", 0); else if (w.DSAP && DSAP.wake) { DSAP.wake(); DSAP.place("whistle", 0); } } catch (e) {}
    if (w.IrisSphere && IrisSphere.setWoken) IrisSphere.setWoken(true);
  }
  function boot() {
    ensure();
    w.addEventListener("pointerdown", wake, { capture: true, once: true });
    w.addEventListener("keydown", wake, { capture: true, once: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  w.IrisApexBind = { wake: wake };
})(window);
