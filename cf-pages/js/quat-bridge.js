(function (w) {
  var VERSION = "quat-bridge-2026-09-22";
  function load(src) {
    return new Promise(function (resolve) {
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
    el.style.cssText = "margin:0;padding:.2rem .85rem .45rem;font:600 .68rem/1.35 ui-monospace,Menlo,monospace;color:rgba(148,163,184,.95)";
    var feel = document.getElementById("feel") || document.getElementById("presence");
    if (feel && feel.parentNode) feel.parentNode.insertBefore(el, feel.nextSibling);
    else document.body.appendChild(el);
    return el;
  }
  function paint() {
    var pose = w.IrisSphere && IrisSphere.pose ? IrisSphere.pose() : null;
    var step = w.CosmicRuntime && CosmicRuntime.state ? CosmicRuntime.state() : null;
    hud().textContent = pose
      ? "quaternion w=" + pose.w.toFixed(3) + " x=" + pose.x.toFixed(3) + " y=" + pose.y.toFixed(3) + " z=" + pose.z.toFixed(3) + (step ? " osc q=" + Number(step.q).toFixed(3) : "")
      : "quaternion loading";
  }
  function mountSphere() {
    var host = document.getElementById("presence");
    if (!host || !w.IrisSphere || !IrisSphere.mount) return false;
    host.style.width = "min(52vw,13rem)";
    host.style.height = "min(52vw,13rem)";
    host.style.borderRadius = "50%";
    host.style.overflow = "hidden";
    host.innerHTML = "";
    IrisSphere.mount(host);
    if (IrisSphere.setWoken) IrisSphere.setWoken(true);
    return true;
  }
  function start() {
    Promise.all([load("/js/iris-sphere.js"), load("/js/cosmic-runtime.js")]).then(function () {
      mountSphere();
      function loop() { paint(); w.requestAnimationFrame(loop); }
      loop();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  w.QuatBridge = { version: VERSION, mount: mountSphere, paint: paint };
})(window);
