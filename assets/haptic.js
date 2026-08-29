/**
 * DualisCapax · haptic on tap
 * navigator.vibrate on Android. iOS Safari has no vibrate API — silent no-op.
 */
(function () {
  if (typeof document === 'undefined') return;
  var last = 0;

  function pulse() {
    var now = Date.now();
    if (now - last < 50) return;
    last = now;
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(12);
      }
    } catch (e) {}
  }

  function hit(t) {
    if (!t || !t.closest) return null;
    return t.closest('button, a, [role="button"], .burger, .jump, .skip, .line, .hud-donate, .iris-mark, .pack, .geo-wrap, #geo-earth');
  }

  function onTap(e) {
    if (e.button != null && e.button !== 0) return;
    var el = hit(e.target);
    if (!el) return;
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;
    pulse();
  }

  document.addEventListener('pointerdown', onTap, { passive: true, capture: true });
})();
