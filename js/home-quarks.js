(function(){
  var canvas = document.getElementById('quarks');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0;
  var N = 56;
  var pts = [];
  function resize(){
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function seed(){
    pts = [];
    for (var i = 0; i < N; i++) {
      pts.push({x: Math.random() * W,y: Math.random() * H,r: 0.35 + Math.random() * 0.95,vx: (Math.random() - 0.5) * 0.14,vy: (Math.random() - 0.5) * 0.11,phase: Math.random() * Math.PI * 2,speed: 0.01 + Math.random() * 0.018});
    }
  }
  function drawGrid(){
    var t = performance.now() * 0.00004;
    var step = 56;
    var ox = reduce ? 0 : (t * 18) % step;
    var oy = reduce ? 0 : (t * 10) % step;
    ctx.lineWidth = 1;
    for (var x = -step + ox; x <= W + step; x += step) {
      var fadeX = 1 - Math.abs((x / W) - 0.5) * 1.35; if (fadeX < 0) fadeX = 0;
      ctx.strokeStyle = 'rgba(158,197,255,' + (0.035 * fadeX) + ')';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = -step + oy; y <= H + step; y += step) {
      var fadeY = 1 - Math.abs((y / H) - 0.5) * 1.2; if (fadeY < 0) fadeY = 0;
      ctx.strokeStyle = 'rgba(158,197,255,' + (0.03 * fadeY) + ')';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }
  function drawSprites(){
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (!reduce) {
        p.phase += p.speed; p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
      }
      var pulse = 0.45 + 0.45 * (0.5 + 0.5 * Math.sin(p.phase));
      var r = p.r * (0.82 + 0.28 * pulse);
      var halo = r * 2.15;
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, halo);
      g.addColorStop(0, 'rgba(210,228,255,' + (0.88 * pulse) + ')');
      g.addColorStop(0.42, 'rgba(126,182,255,' + (0.28 * pulse) + ')');
      g.addColorStop(1, 'rgba(74,143,216,0)');
      ctx.beginPath(); ctx.fillStyle = g; ctx.arc(p.x, p.y, halo, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle = 'rgba(236,244,255,' + (0.92 * pulse) + ')'; ctx.arc(p.x, p.y, Math.max(0.38, r * 0.36), 0, Math.PI * 2); ctx.fill();
      if (i % 5 === 0) {
        ctx.save(); ctx.translate(p.x + 4, p.y - 6); ctx.rotate(0.32);
        ctx.beginPath(); ctx.moveTo(0, -r * 1.7);
        ctx.bezierCurveTo(r * 0.75, -r * 0.55, r * 0.6, r * 0.85, 0, r * 1.8);
        ctx.bezierCurveTo(-r * 0.6, r * 0.85, -r * 0.75, -r * 0.55, 0, -r * 1.7);
        ctx.fillStyle = 'rgba(180,220,255,' + (0.14 * pulse) + ')'; ctx.fill(); ctx.restore();
      }
    }
  }
  function frame(){
    if (!document.body.classList.contains('is-live')) { requestAnimationFrame(frame); return; }
    ctx.clearRect(0, 0, W, H); drawGrid(); drawSprites();
    if (!reduce) requestAnimationFrame(frame);
  }
  resize(); seed();
  window.addEventListener('resize', function(){ resize(); seed(); if (reduce) frame(); });
  requestAnimationFrame(frame);
})();
