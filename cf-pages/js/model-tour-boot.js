/** Boot Dualis Video Engine on model.html */
(function () {
  function start() {
    if (!window.DualisVideoEngine) return;
    var root = document.getElementById('tour-root');
    if (!root) return;
    var engine = new DualisVideoEngine({ root: root, mediaBase: 'assets/tour/' });
    engine.start();
    window.DCVideoEngine = engine;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
