(function (w) {
  var VERSION = "quat-bridge-2026-09-22";
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
    el = document.createElement("p");
    el.id = "quat-hud";
    el.setAttribute("aria-live", "polite");
    el.style.cssText = "margin:0;padding:.2rem .85rem .45rem;font:600 .68rem/1.35 ui-monospace,Menlo,monospace;color:rgba(148,163,184,.95);letter-spacing:.02em";
    var feel = document.getElementById("feel") || document.getElementById("presence");
    if (feel && feel.parentNode) feel.parentNode.insertBefore(el, feel.nextSibling);
    else document.body.appendChild(el);
    return el;
  }
  function paint() {
    var el = hud();
    var pose = w.IrisSphere && IrisSphere.pose ? IrisSphere.pose() : null;
    var step = w.CosmicRuntime && CosmicRuntime.state ? CosmicRuntime.state() : null;
    var qw = pose ? pose.w.toFixed(3) : "—";
    var qx = pose ? pose.x.toFixed(3) : "—";
    var qy = pose ? pose.y.toFixed(3) : "—";
    var qz = pose ? pose.z.toFixed(3) : "—";
    var osc = step ? " osc q=" + Number(step.q).toFixed(3) + " p=" + Number(step.p).toFixed(3) + " H=" + Number(step.h).toFixed(4) : "";
    el.textContent = "quaternion w=" + qw + " x=" + qx + " y=" + qy + " z=" + qz + osc;
  }
  function mountSphere() {
    var host = document.getElementById("presence");
    if (!host || !w.IrisSphere || !IrisSphere.mount) return false;
    host.style.width = "min(52vw,13rem)";
    host.style.height = "min(52vw,13rem)";
    host.style.borderRadius = "50%";
    host.style.overflow = "hidden";
    host.style.margin = ".35rem auto";
    host.innerHTML = "";
    IrisSphere.mount(host);
    if (IrisSphere.setWoken) IrisSphere.setWoken(true);
    return true;
  }
  function tickEngine() {
    if (w.CosmicRuntime && CosmicRuntime.step) {
      var s = CosmicRuntime.state ? CosmicRuntime.state() : { q: 1, p: 0 };
      CosmicRuntime.step(s.q, s.p, 0.016);
    }
  }
  function loop() {
    tickEngine();
    paint();
    w.requestAnimationFrame(loop);
  }
  function start() {
    Promise.all([
      load("/js/iris-sphere.js"),
      load("/js/cosmic-runtime.js"),
      load("/js/cosmic-factory.js")
    ]).then(function () {
      mountSphere();
      paint();
      if (!w.__quatLoop) {
        w.__quatLoop = true;
        w.requestAnimationFrame(loop);
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  w.QuatBridge = { version: VERSION, mount: mountSphere, paint: paint };
})(window);
