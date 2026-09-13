/**
 * DualisCapax — one glass pane, mid-art drifts slower than the copy.
 * Visual only. Respects reduced motion.
 */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var pane = null;
  var art = null;
  var ticking = false;

  function collect() {
    pane = document.querySelector(".pane.glass");
    art = document.querySelector(".pane-art");
  }

  function update() {
    ticking = false;
    if (!pane || !art) return;
    if (reduce.matches) {
      art.style.transform = "translate3d(-50%,-50%,0)";
      pane.classList.add("is-on");
      return;
    }
    var r = pane.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    var traveled = Math.max(0, -r.top);
    var artY = traveled * 0.38;
    art.style.transform = "translate3d(-50%, calc(-50% + " + artY.toFixed(1) + "px), -48px)";
    pane.classList.toggle("is-on", r.bottom > 80 && r.top < vh - 40);
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
