/** Dualis surface field — quarks + pointer affinity. Simple to the eye. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;width:100%;height:100%';
  document.body.prepend(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, pts = [], N = 36;
  var mx = -9999, my = -9999, down = false;
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function seed() {
    pts = [];
    for (var i = 0; i < N; i++) {
      pts.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.5 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.1,
        phase: Math.random() * Math.PI * 2,
        speed: 0.006 + Math.random() * 0.018
      });
    }
  }
  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.phase += p.speed;
      var dx = mx - p.x, dy = my - p.y;
      var d2 = dx * dx + dy * dy;
      if (d2 < 220 * 220 && d2 > 1) {
        var pull = (down ? 0.018 : 0.008) / Math.sqrt(d2);
        p.vx += dx * pull; p.vy += dy * pull;
      }
      p.vx *= 0.98; p.vy *= 0.98;
      p.x += p.vx; p.y += p.vy;
      if (p.x < -8) p.x = W + 8; if (p.x > W + 8) p.x = -8;
      if (p.y < -8) p.y = H + 8; if (p.y > H + 8) p.y = -8;
      var pulse = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(p.phase));
      var r = p.r * (0.7 + 0.45 * pulse);
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
      g.addColorStop(0, 'rgba(158,197,255,' + (0.55 * pulse) + ')');
      g.addColorStop(0.4, 'rgba(74,143,216,' + (0.18 * pulse) + ')');
      g.addColorStop(1, 'rgba(74,143,216,0)');
      ctx.beginPath(); ctx.fillStyle = g; ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle = 'rgba(232,241,255,' + (0.7 * pulse) + ')'; ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  function move(e) {
    var t = e.touches ? e.touches[0] : e;
    if (!t) return;
    mx = t.clientX; my = t.clientY;
  }
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('touchmove', move, { passive: true });
  window.addEventListener('pointerdown', function (e) {
    down = true; move(e);
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (err) {}
  }, { passive: true });
  window.addEventListener('pointerup', function () { down = false; }, { passive: true });
  window.addEventListener('resize', function () { resize(); });
  resize(); seed(); requestAnimationFrame(frame);
})();
