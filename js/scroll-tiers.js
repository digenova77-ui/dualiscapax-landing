/**
 * DualisCapax — scroll-driven glass tiers.
 * Visual only. Respects reduced motion.
 */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var bands = [];
  var ticking = false;

  function collect() {
    bands = Array.prototype.slice.call(document.querySelectorAll(".band.glass"));
  }

  function setVars(el, tx, ty, tz, rx, ry, on) {
    el.style.setProperty("--tx", tx + "px");
    el.style.setProperty("--ty", ty + "px");
    el.style.setProperty("--tz", tz + "px");
    el.style.setProperty("--rx", rx + "deg");
    el.style.setProperty("--ry", ry + "deg");
    el.classList.toggle("is-on", on);
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight || 1;
    var mid = vh * 0.46;
    if (reduce.matches) {
      bands.forEach(function (el) { setVars(el, 0, 0, 0, 0, 0, true); });
      return;
    }
    bands.forEach(function (el, i) {
      var r = el.getBoundingClientRect();
      var c = r.top + r.height * 0.5;
      var t = (c - mid) / vh;
      var axis = el.getAttribute("data-axis") || (i % 2 ? "right" : "left");
      var depth = [-36, 28, -18, 42, -48, 16, 34, -24][i % 8];
      var on = r.bottom > 40 && r.top < vh - 20;
      var fade = Math.max(0, 1 - Math.abs(t) * 0.85);
      var tz = depth + (-t * 54);
      var rx = Math.max(-9, Math.min(9, t * 11));
      var ry = 0, tx = 0, ty = t * -16;
      if (axis === "left") { tx = t * 28; ry = t * -7; }
      else if (axis === "right") { tx = t * -28; ry = t * 7; }
      else if (axis === "back") { tz -= 40; ty += t * 10; }
      else if (axis === "forward") { tz += 36; }
      el.style.opacity = String(0.42 + fade * 0.58);
      setVars(el, tx, ty, tz, rx, ry, on);
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  function pointer(e) {
    if (reduce.matches) return;
    var x = (e.clientX / (window.innerWidth || 1)) - 0.5;
    var y = (e.clientY / (window.innerHeight || 1)) - 0.5;
    document.documentElement.style.setProperty("--mx", x.toFixed(3));
    document.documentElement.style.setProperty("--my", y.toFixed(3));
  }

  collect();
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("pointermove", pointer, { passive: true });
  if (reduce.addEventListener) reduce.addEventListener("change", update);
  else if (reduce.addListener) reduce.addListener(update);
})();
