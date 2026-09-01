(function(){
  var canvas = document.getElementById('quarks');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0;
  var N_NEAR = 360;
  var N_OPEN = 560;
  var N = N_NEAR;
  var pts = [];
  var clouds = [];
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
    hole.r = Math.min(b.width, b.height) * 0.38;
  }
  function insideHole(x, y, pad){
    if (hole.r <= 0) return false;
    var dx = x - hole.cx, dy = y - hole.cy;
    var rr = hole.r * 0.22 + (pad || 0);
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
  function seedClouds(){
    var cx = hole.r ? hole.cx : W * 0.5;
    var cy = hole.r ? hole.cy : H * 0.42;
    clouds = [
      {x: cx, y: cy, r: Math.max(W, H) * 0.58, c0: 'rgba(56,118,230,0.42)', c1: 'rgba(56,118,230,0)'},
      {x: cx - W * 0.12, y: cy + H * 0.04, r: Math.max(W, H) * 0.34, c0: 'rgba(128,62,196,0.30)', c1: 'rgba(128,62,196,0)'},
      {x: cx + W * 0.16, y: cy - H * 0.06, r: Math.max(W, H) * 0.28, c0: 'rgba(28,150,210,0.24)', c1: 'rgba(28,150,210,0)'},
      {x: W * 0.12, y: H * 0.82, r: Math.max(W, H) * 0.30, c0: 'rgba(120,60,180,0.22)', c1: 'rgba(120,60,180,0)'},
      {x: W * 0.92, y: H * 0.68, r: Math.max(W, H) * 0.26, c0: 'rgba(30,120,190,0.20)', c1: 'rgba(30,120,190,0)'},
      {x: W * 0.72, y: H * 0.18, r: Math.max(W, H) * 0.20, c0: 'rgba(210,170,80,0.14)', c1: 'rgba(210,170,80,0)'},
      {x: W * 0.22, y: H * 0.28, r: Math.max(W, H) * 0.18, c0: 'rgba(90,160,255,0.16)', c1: 'rgba(90,160,255,0)'}
    ];
  }
  function seed(){
    measureHole();
    seedClouds();
    N = sphereOn ? N_NEAR : N_OPEN;
    pts = [];
    var guard = 0;
    while (pts.length < N && guard < N * 20) {
      guard++;
      var x = Math.random() * W;
      var y = Math.random() * H;
      if (insideHole(x, y, 8)) continue;
      var roll = Math.random();
      var giant = roll > 0.97;
      var mid = !giant && roll > 0.86;
      pts.push({
        x: x, y: y,
        r: giant ? (2.2 + Math.random() * 2.4) : mid ? (1.15 + Math.random() * 1.1) : (0.55 + Math.random() * 0.85),
        vx: (Math.random() - 0.5) * (giant ? 0.04 : 0.09),
        vy: (Math.random() - 0.5) * (giant ? 0.03 : 0.07),
        phase: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.016,
        warm: Math.random() > 0.82,
        link: giant || mid
      });
    }
  }
  function drawWash(){
    var i, c, g;
    for (i = 0; i < clouds.length; i++) {
      c = clouds[i];
      g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      g.addColorStop(0, c.c0);
      g.addColorStop(1, c.c1);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }
  function drawGrid(){
    var t = performance.now() * 0.00005;
    var step = 56;
    var ox = reduce ? 0 : (t * 18) % step;
    var oy = reduce ? 0 : (t * 10) % step;
    ctx.lineWidth = 1;
    var x, y, fade;
    for (x = -step + ox; x <= W + step; x += step) {
      fade = 1 - Math.abs((x / W) - 0.5) * 1.15; if (fade < 0) fade = 0;
      ctx.strokeStyle = 'rgba(158,197,255,' + ((sphereOn ? 0.08 : 0.13) * fade) + ')';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (y = -step + oy; y <= H + step; y += step) {
      fade = 1 - Math.abs((y / H) - 0.5) * 1.05; if (fade < 0) fade = 0;
      ctx.strokeStyle = 'rgba(158,197,255,' + ((sphereOn ? 0.06 : 0.11) * fade) + ')';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }
  function drawLinks(){
    var i, j, a, b, dx, dy, d2, max = 90 * 90;
    ctx.lineWidth = 1;
    for (i = 0; i < pts.length; i++) {
      a = pts[i];
      if (!a.link) continue;
      if (insideHole(a.x, a.y, 4)) continue;
      for (j = i + 1; j < pts.length; j++) {
        b = pts[j];
        if (!b.link) continue;
        dx = a.x - b.x; dy = a.y - b.y;
        d2 = dx * dx + dy * dy;
        if (d2 > max || d2 < 80) continue;
        ctx.strokeStyle = 'rgba(170,205,255,' + (0.16 * (1 - d2 / max)) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
  function drawSprites(){
    var i, p, pulse, r, halo, g;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (!reduce) {
        p.phase += p.speed; p.x += p.vx; p.y += p.vy;
        if (p.x < -12) p.x = W + 12; if (p.x > W + 12) p.x = -12;
        if (p.y < -12) p.y = H + 12; if (p.y > H + 12) p.y = -12;
        if (insideHole(p.x, p.y, 6)) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          if (insideHole(p.x, p.y, 6)) { p.x = 16; p.y = 16; }
        }
      }
      if (insideHole(p.x, p.y, 4)) continue;
      pulse = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(p.phase));
      r = p.r * (0.92 + 0.22 * pulse);
      halo = r * 3.1;
      g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, halo);
      if (p.warm) {
        g.addColorStop(0, 'rgba(255,248,230,' + (1.0 * pulse) + ')');
        g.addColorStop(0.28, 'rgba(232,200,120,' + (0.70 * pulse) + ')');
        g.addColorStop(1, 'rgba(180,140,60,0)');
      } else {
        g.addColorStop(0, 'rgba(255,255,255,' + (1.0 * pulse) + ')');
        g.addColorStop(0.22, 'rgba(180,215,255,' + (0.88 * pulse) + ')');
        g.addColorStop(1, 'rgba(80,140,230,0)');
      }
      ctx.beginPath(); ctx.fillStyle = g; ctx.arc(p.x, p.y, halo, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = p.warm ? 'rgba(255,250,230,' + (0.95 * pulse) + ')' : 'rgba(255,255,255,' + (0.95 * pulse) + ')';
      ctx.arc(p.x, p.y, Math.max(0.45, r * 0.42), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function glowBehind(){
    measureHole();
    if (hole.r <= 0) return;
    var g = ctx.createRadialGradient(hole.cx, hole.cy, hole.r * 0.08, hole.cx, hole.cy, hole.r * 1.35);
    g.addColorStop(0, 'rgba(90,150,255,0.28)');
    g.addColorStop(0.35, 'rgba(70,90,210,0.16)');
    g.addColorStop(0.7, 'rgba(40,20,80,0.08)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hole.cx, hole.cy, hole.r * 1.35, 0, Math.PI * 2);
    ctx.fill();
  }
  var lastMode = true;
  function frame(){
    var on = sphereVisible();
    if (on !== lastMode) { lastMode = on; seed(); }
    ctx.clearRect(0, 0, W, H);
    drawWash();
    glowBehind();
    drawGrid();
    drawLinks();
    drawSprites();
    if (!reduce) requestAnimationFrame(frame);
  }
  resize(); seed();
  window.addEventListener('resize', function(){ resize(); seed(); if (reduce) frame(); });
  window.addEventListener('scroll', function(){ measureHole(); seedClouds(); }, {passive:true});
  requestAnimationFrame(frame);
})();
