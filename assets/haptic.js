/**
 * DualisCapax · light haptic on control taps
 * Progressive: only if navigator.vibrate exists (mostly mobile).
 * Short pulse so users feel the press without noise.
 */
(function () {
  if (typeof document === 'undefined') return;

  function pulse() {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(10);
      }
    } catch (e) {}
  }

  function isControl(el) {
    if (!el || el.nodeType !== 1) return false;
    var tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A') return true;
    if (el.getAttribute('role') === 'button') return true;
    if (el.classList && (el.classList.contains('burger') || el.classList.contains('jump') || el.classList.contains('skip'))) return true;
    return false;
  }

  document.addEventListener(
    'pointerdown',
    function (e) {
      if (e.button != null && e.button !== 0) return;
      var t = e.target;
      if (!t || !t.closest) return;
      var el = t.closest('button, a, [role="button"], .burger, .jump, .skip');
      if (!el || !isControl(el)) return;
      if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;
      pulse();
    },
    { passive: true, capture: true }
  );
})();
