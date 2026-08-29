(function(){
  var canvas = document.getElementById('quarks');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0;
  var N = 22;
  var pts = [];
  var hole = {cx: 0, cy: 0, r: 0};

  function measureHole(){
    var el = document.getElementById('geo-earth') || document.querySelector('.geo-wrap');
    if (!el) { hole.r = 0; return; }
    var b = el.getBoundingClientRect();
    hole.cx = b.left + b.width / 2;
    hole.cy = b.top + b.height / 2;
    hole.r = Math.min(b.width, b.height) * 0.56;
  }
  function insideHole(x, y, pad){
    if (hole.r <= 0) return false;
    var dx = x - hole.cx, dy = y - hole.cy;
    var rr = hole.r + (pad || 0);
    return dx * dx + dy * dy < rr * rr;
  }
  function resize(){
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    measureHole();
  }
  function seed(){
    measureHole();
    pts = [];
    var guard = 0;
    while (pts.length < N && guard < N * 12) {
      guard++;
      var x = Math.random() * W;
      var y = Math.random() * H;
      if (insideHole(x, y, 12)) continue;
      pts.push({
        x: x, y: y,
        r: 0.55 + Math.random() * 1.15,
        vx: (Math.random() - 0.5) * 0.11,
        vy: (Math.random() - 0.5) * 0.09,
        phase: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.016
      });
    }
  }
  function drawGrid(){
    var t = performance.now() * 0.00004;
    var step = 72;
    var ox = reduce ? 0 : (t * 14) % step;
    var oy = reduce ? 0 : (t * 8) % step;
    ctx.lineWidth = 1;
    for (var x = -step + ox; x <= W + step; x += step) {
      var fadeX = 1 - Math.abs((x / W) - 0.5) * 1.35; if (fadeX < 0) fadeX = 0;
      ctx.strokeStyle = 'rgba(158,197,255,' + (0.04 * fadeX) + ')';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = -step + oy; y <= H + step; y += step) {
      var fadeY = 1 - Math.abs((y / H) - 0.5) * 1.2; if (fadeY < 0) fadeY = 0;
      ctx.strokeStyle = 'rgba(158,197,255,' + (0.032 * fadeY) + ')';
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
        if (insideHole(p.x, p.y, 8)) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          if (insideHole(p.x, p.y, 8)) { p.x = 12; p.y = 12; }
        }
      }
      if (insideHole(p.x, p.y, 6)) continue;
      var pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(p.phase));
      var r = p.r * (0.85 + 0.3 * pulse);
      var halo = r * 2.6;
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, halo);
      g.addColorStop(0, 'rgba(210,228,255,' + (0.9 * pulse) + ')');
      g.addColorStop(0.35, 'rgba(158,197,255,' + (0.48 * pulse) + ')');
      g.addColorStop(1, 'rgba(74,143,216,0)');
      ctx.beginPath(); ctx.fillStyle = g; ctx.arc(p.x, p.y, halo, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle = 'rgba(236,244,255,' + (0.92 * pulse) + ')'; ctx.arc(p.x, p.y, Math.max(0.5, r * 0.4), 0, Math.PI * 2); ctx.fill();
    }
  }
  function punch(){
    measureHole();
    if (hole.r <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(hole.cx, hole.cy, hole.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function frame(){
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawSprites();
    punch();
    if (!reduce) requestAnimationFrame(frame);
  }
  resize(); seed();
  window.addEventListener('resize', function(){ resize(); seed(); if (reduce) frame(); });
  window.addEventListener('scroll', function(){ measureHole(); }, {passive:true});
  requestAnimationFrame(frame);
})();
