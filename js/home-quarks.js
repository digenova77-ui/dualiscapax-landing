(function(){
  var canvas = document.getElementById('quarks');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0;
  var N_NEAR = 56;
  var N_OPEN = 96;
  var N = N_NEAR;
  var pts = [];
  var hole = {cx: 0, cy: 0, r: 0};
  var sphereOn = false;

  function sphereVisible(){
    var el = document.getElementById('geo-earth') || document.querySelector('.geo-wrap');
    if (!el) return false;
    var b = el.getBoundingClientRect();
    if (b.width < 48 || b.height < 48) return false;
    return b.bottom > 72 && b.top < (window.innerHeight - 48);
  }
  function measureHole(){
    sphereOn = sphereVisible();
    var el = document.getElementById('geo-earth') || document.querySelector('.geo-wrap');
    if (!el || !sphereOn) { hole.r = 0; return; }
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
    N = sphereOn ? N_NEAR : N_OPEN;
    pts = [];
    var guard = 0;
    while (pts.length < N && guard < N * 16) {
      guard++;
      var x = Math.random() * W;
      var y = Math.random() * H;
      if (insideHole(x, y, 12)) continue;
      pts.push({
        x: x, y: y,
        r: 0.7 + Math.random() * 1.45,
        vx: (Math.random() - 0.5) * 0.13,
        vy: (Math.random() - 0.5) * 0.1,
        phase: Math.random() * Math.PI * 2,
        speed: 0.012 + Math.random() * 0.02
      });
    }
  }
  function drawWash(){
    var g = ctx.createRadialGradient(W * 0.5, H * 0.28, 20, W * 0.5, H * 0.42, Math.max(W, H) * 0.72);
    g.addColorStop(0, 'rgba(20,42,78,0.28)');
    g.addColorStop(0.55, 'rgba(8,16,32,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  function drawGrid(){
    var t = performance.now() * 0.00004;
    var step = 64;
    var ox = reduce ? 0 : (t * 14) % step;
    var oy = reduce ? 0 : (t * 8) % step;
    ctx.lineWidth = 1;
    for (var x = -step + ox; x <= W + step; x += step) {
      var fadeX = 1 - Math.abs((x / W) - 0.5) * 1.2; if (fadeX < 0) fadeX = 0;
      ctx.strokeStyle = 'rgba(158,197,255,' + ((sphereOn ? 0.055 : 0.08) * fadeX) + ')';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = -step + oy; y <= H + step; y += step) {
      var fadeY = 1 - Math.abs((y / H) - 0.5) * 1.05; if (fadeY < 0) fadeY = 0;
      ctx.strokeStyle = 'rgba(158,197,255,' + ((sphereOn ? 0.045 : 0.07) * fadeY) + ')';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }
  function drawSprites(){
    var boost = sphereOn ? 1 : 1.35;
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
      var pulse = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(p.phase));
      var r = p.r * (0.9 + 0.28 * pulse) * boost;
      var halo = r * 3.1;
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, halo);
      g.addColorStop(0, 'rgba(230,240,255,' + (0.95 * pulse) + ')');
      g.addColorStop(0.32, 'rgba(158,197,255,' + (0.62 * pulse) + ')');
      g.addColorStop(1, 'rgba(74,143,216,0)');
      ctx.beginPath(); ctx.fillStyle = g; ctx.arc(p.x, p.y, halo, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle = 'rgba(244,248,255,' + (0.98 * pulse) + ')'; ctx.arc(p.x, p.y, Math.max(0.55, r * 0.42), 0, Math.PI * 2); ctx.fill();
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
  var lastMode = true;
  function frame(){
    var on = sphereVisible();
    if (on !== lastMode) { lastMode = on; seed(); }
    ctx.clearRect(0, 0, W, H);
    drawWash();
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
