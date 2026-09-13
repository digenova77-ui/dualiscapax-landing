/** DualisCapax haptic. Android vibrate. iOS no-op. Reduced motion silent. */
(function () {
  if (typeof document === "undefined") return;
  var last = 0;
  function pulse(ms) {
    var now = Date.now();
    if (now - last < 32) return;
    last = now;
    try {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.DCSense && DCSense.haptic) { DCSense.haptic("tap"); return; }
      if (typeof navigator.vibrate === "function") navigator.vibrate(ms || 12);
    } catch (e) {}
  }
  function hit(t) {
    if (!t || !t.closest) return null;
    return t.closest("button, a, [role='button'], [data-haptic], .seat-card, .seat-back, .iris-mark, .row, .act");
  }
  document.addEventListener("pointerdown", function (e) {
    if (e.button != null && e.button !== 0) return;
    var el = hit(e.target);
    if (!el || el.hasAttribute("disabled")) return;
    pulse(el.classList && el.classList.contains("seat-card") ? 16 : 12);
  }, { passive: true, capture: true });
})();
