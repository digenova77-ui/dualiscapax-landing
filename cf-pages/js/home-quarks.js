(function(){
  var canvas = document.getElementById('quarks');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0;
  var N_NEAR = 36;
  var N_OPEN = 52;
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
    var cy = hole.r ? hole.cy : H * 0.38;
    clouds = [
      {x: cx, y: cy, r: Math.max(W, H) * 0.42, c0: 'rgba(40,84,160,0.18)', c1: 'rgba(40,84,160,0)'},
      {x: W * 0.18, y: H * 0.78, r: Math.max(W, H) * 0.22, c0: 'rgba(70,40,120,0.10)', c1: 'rgba(70,40,120,0)'},
      {x: W * 0.86, y: H * 0.16, r: Math.max(W, H) * 0.18, c0: 'rgba(180,150,70,0.07)', c1: 'rgba(180,150,70,0)'}
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
      pts.push({
        x: x, y: y,
        r: 0.45 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.035,
        vy: (Math.random() - 0.5) * 0.028,
        phase: Math.random() * Math.PI * 2,
        speed: 0.004 + Math.random() * 0.008,
        warm: Math.random() > 0.88
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
        }
      }
      if (insideHole(p.x, p.y, 4)) continue;
      pulse = 0.45 + 0.28 * (0.5 + 0.5 * Math.sin(p.phase));
      r = p.r * (0.9 + 0.12 * pulse);
      halo = r * 2.1;
      g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, halo);
      if (p.warm) {
        g.addColorStop(0, 'rgba(255,248,230,' + (0.55 * pulse) + ')');
        g.addColorStop(1, 'rgba(180,140,60,0)');
      } else {
        g.addColorStop(0, 'rgba(210,228,255,' + (0.5 * pulse) + ')');
        g.addColorStop(1, 'rgba(80,140,230,0)');
      }
      ctx.beginPath(); ctx.fillStyle = g; ctx.arc(p.x, p.y, halo, 0, Math.PI * 2); ctx.fill();
    }
  }
  function glowBehind(){
    measureHole();
    if (hole.r <= 0) return;
    var g = ctx.createRadialGradient(hole.cx, hole.cy, hole.r * 0.08, hole.cx, hole.cy, hole.r * 1.2);
    g.addColorStop(0, 'rgba(90,150,255,0.16)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hole.cx, hole.cy, hole.r * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  var lastMode = true;
  function frame(){
    var on = sphereVisible();
    if (on !== lastMode) { lastMode = on; seed(); }
    ctx.clearRect(0, 0, W, H);
    drawWash();
    glowBehind();
    drawSprites();
    if (!reduce) requestAnimationFrame(frame);
  }
  resize(); seed();
  window.addEventListener('resize', function(){ resize(); seed(); if (reduce) frame(); });
  window.addEventListener('scroll', function(){ measureHole(); seedClouds(); }, {passive:true});
  requestAnimationFrame(frame);
})();
