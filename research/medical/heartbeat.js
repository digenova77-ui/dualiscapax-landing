/* Dualis field pulse — not a Foundation logo.
   Their mark is the runner / baton / Finish It.
   This is leftover cadence after Thunder Bay.
   Requires a tap. Browsers will not haptic without a gesture.
*/
(function () {
  var armed = false;
  var timer = null;
  function beat() {
    if (!navigator.vibrate) return;
    try { navigator.vibrate([42, 160, 72]); } catch (e) {}
  }
  function start() {
    if (armed) return;
    armed = true;
    beat();
    timer = setInterval(beat, 920);
  }
  function stop() {
    armed = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (navigator.vibrate) try { navigator.vibrate(0); } catch (e) {}
  }
  var field = document.querySelector('.field-wrap') || document.querySelector('.portrait');
  if (field) {
    field.style.cursor = 'pointer';
    field.addEventListener('pointerdown', start, { passive: true });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
  });
})();
