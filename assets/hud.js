/** Icon HUD. Five ticks. No sentences. A sine is not a point. */
(function () {
  var box = document.createElement('div');
  box.id = 'tick';
  box.innerHTML = '<i data-k="S" title="serial unset"></i><i data-k="P" title="parallel unset"></i><i class="bar" title="point unset"><em id="tick-d"></em></i><i data-k="I" title="invert off"></i><i data-k="U" title="unused"></i>';
  document.body.appendChild(box);
  var D = document.getElementById('tick-d');
  if (D) D.style.width = '0%';
})();
