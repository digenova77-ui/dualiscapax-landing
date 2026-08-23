/**
 * DualisCapax mobile dual-scroll depth
 * Content micro-lags with scroll; counter-layer moves opposite → height on the frame.
 * No-op on desktop width, reduced-motion, or missing nodes.
 */
(function () {
  "use strict";

  var mq = window.matchMedia("(max-width: 1023px)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var ticking = false;

  function active() {
    return mq.matches && !reduce.matches;
  }

  function update() {
    ticking = false;
    if (!active()) {
      document.documentElement.style.setProperty("--dc-shift-y", "0px");
      document.documentElement.style.setProperty("--dc-content-y", "0px");
      document.querySelectorAll(".dc-frame").forEach(function (el) {
        el.style.setProperty("--dc-frame-shift", "0px");
      });
      return;
    }

    var y = window.scrollY || window.pageYOffset || 0;
    // Counter-layer: opposite direction (down when you scroll up)
    var shift = Math.round(y * 0.22);
    // Content: slight lag in same direction for separation
    var content = Math.round(y * -0.04);

    document.documentElement.style.setProperty("--dc-shift-y", shift + "px");
    document.documentElement.style.setProperty("--dc-content-y", content + "px");

    var vh = window.innerHeight || 1;
    document.querySelectorAll(".dc-frame").forEach(function (el) {
      var r = el.getBoundingClientRect();
      var mid = r.top + r.height * 0.5;
      var t = (mid - vh * 0.5) / vh; // -0.5..0.5-ish when near viewport
      var local = Math.round(-t * 28); // opposite of vertical position → height
      el.style.setProperty("--dc-frame-shift", local + "px");
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  function bind() {
    update();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  if (mq.addEventListener) mq.addEventListener("change", bind);
  else if (mq.addListener) mq.addListener(bind);
  if (reduce.addEventListener) reduce.addEventListener("change", bind);
  else if (reduce.addListener) reduce.addListener(bind);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
