/** Time law: no freeze. Access is live or it is gone. */
(function () {
  document.documentElement.classList.add('watch');
  document.body.classList.add('watch');
  window.DUALIS_LIVE = true;
  function block(e) { e.preventDefault(); }
  ['copy', 'cut', 'contextmenu', 'dragstart', 'selectstart'].forEach(function (ev) {
    document.addEventListener(ev, block, { capture: true });
  });
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === 'c' || k === 'x' || k === 's' || k === 'u' || k === 'p' || k === 'a')) e.preventDefault();
  }, { capture: true });
  function uncompute() {
    window.DUALIS_LIVE = false;
    document.body.style.opacity = '0';
    var cvs = document.querySelectorAll('canvas');
    for (var i = 0; i < cvs.length; i++) {
      var c = cvs[i];
      var ctx = c.getContext && c.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, c.width, c.height);
      c.width = c.width;
    }
  }
  function resume() {
    window.DUALIS_LIVE = true;
    document.body.style.opacity = '1';
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) uncompute();
    else resume();
  });
  window.addEventListener('blur', uncompute);
  window.addEventListener('pagehide', uncompute);
  window.addEventListener('freeze', uncompute);
})();
