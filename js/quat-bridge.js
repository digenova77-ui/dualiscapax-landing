/** Debug pose HUD. Off on the public lab unless ?debug=1 */
(function (w) {
  var VERSION = "quat-bridge-2026-09-22-quiet";
  var debug = /(?:\?|&)debug=1(?:&|$)/.test(String(w.location && location.search || ""));
  function load(src) {
    return new Promise(function (resolve) {
      var base = src.split("?")[0];
      var hit = false;
      document.querySelectorAll("script").forEach(function (el) {
        if (el.src && el.src.indexOf(base) !== -1) hit = true;
      });
      if (hit) { resolve(true); return; }
      var s = document.createElement("script");
      s.src = src;
      s.onload = function () { resolve(true); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
  }
  function hud() {
    var el = document.getElementById("quat-hud");
    if (el) return el;
    if (!debug) return null;
    el = document.createElement("p");
    el.id = "quat-hud";
    el.style.cssText = "margin:0;padding:.2rem .85rem .45rem;font:600 .68rem/1.35 ui-monospace,monospace;color:rgba(148,163,184,.95)";
    var feel = document.getElementById("feel") || document.getElementById("presence");
    if (feel && feel.parentNode) feel.parentNode.insertBefore(el, feel.nextSibling);
    else document.body.appendChild(el);
    return el;
  }
  function paint() {
    var el = hud();
    if (!el) return;
    var pose = w.IrisSphere && IrisSphere.pose ? IrisSphere.pose() : null;
    var step = w.CosmicRuntime && CosmicRuntime.state ? CosmicRuntime.state() : null;
    if (!pose) { el.textContent = ""; return; }
    el.textContent =
      "quaternion w=" + pose.w.toFixed(3) +
      " x=" + pose.x.toFixed(3) +
      " y=" + pose.y.toFixed(3) +
      " z=" + pose.z.toFixed(3) +
      (step ? " osc q=" + Number(step.q).toFixed(3) : "");
  }
  function start() {
    if (!debug) return;
    Promise.all([
      load("/js/iris-sphere.js"),
      load("/js/cosmic-runtime.js")
    ]).then(function () {
      paint();
      if (!w.__quatLoop) {
        w.__quatLoop = true;
        (function loop() { paint(); w.requestAnimationFrame(loop); })();
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  w.QuatBridge = { version: VERSION, paint: paint };
})(window);
