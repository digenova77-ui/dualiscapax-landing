/** Icon HUD. Five ticks. No sentences. */
(function () {
  var box = document.createElement('div');
  box.id = 'tick';
  box.innerHTML = '<i data-k="S" title="serial"></i><i data-k="P" title="parallel"></i><i class="bar" title="point difference"><em id="tick-d"></em></i><i data-k="I" title="invert"></i><i data-k="U" title="unused"></i>';
  document.body.appendChild(box);
  var S = box.querySelector('[data-k="S"]');
  var P = box.querySelector('[data-k="P"]');
  var I = box.querySelector('[data-k="I"]');
  var U = box.querySelector('[data-k="U"]');
  var D = document.getElementById('tick-d');
  var t0 = performance.now();
  function pulse() {
    var t = (performance.now() - t0) / 1000;
    var serial = (Math.sin(t * 0.7) + 1) * 0.5;
    var par = (Math.sin(t * 1.1 + 1) + 1) * 0.5;
    var delta = Math.abs(serial - par);
    var inv = delta < 0.18 ? 1 : 0;
    S.classList.toggle('on', serial > 0.35);
    P.classList.toggle('on', par > 0.35);
    I.classList.toggle('on', inv === 1);
    U.classList.toggle('on', true);
    if (D) D.style.width = Math.round(delta * 100) + '%';
    requestAnimationFrame(pulse);
  }
  requestAnimationFrame(pulse);
})();
