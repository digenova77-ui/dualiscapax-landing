/** Watch-only surface. Access is not export. */
(function () {
  document.documentElement.classList.add('watch');
  document.body.classList.add('watch');
  function block(e) { e.preventDefault(); }
  ['copy', 'cut', 'contextmenu', 'dragstart', 'selectstart'].forEach(function (ev) {
    document.addEventListener(ev, block, { capture: true });
  });
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === 'c' || k === 'x' || k === 's' || k === 'u' || k === 'p' || k === 'a')) {
      e.preventDefault();
    }
  }, { capture: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) document.body.style.filter = 'blur(18px) brightness(0.2)';
    else document.body.style.filter = '';
  });
})();
