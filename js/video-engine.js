/**
 * DualisCapax Cinematic Engine — storyboard as auto-playing film
 * Residual canvas sequences per beat; auto-advance; not a dead click-through.
 */
(function (global) {
  var STEPS = [
    { id: 'open', title: 'Open', line: 'Research free. Full surface. Learn without a gate.', color: '#3B82F6', dur: 5.5 },
    { id: 'prove', title: 'Prove', line: 'Boundary first. Settlement and identity before depth.', color: '#C9A227', dur: 5.5 },
    { id: 'depth', title: 'Depth', line: 'Adaptive intelligence. Real session cost. Real work.', color: '#22C55E', dur: 5.5 },
    { id: 'seal', title: 'Seal', line: 'Production math stays sealed. Truth in the residual.', color: '#EF4444', dur: 5.5 },
    { id: 'fm', title: 'Fusion Meter', line: 'Closed prepaid capacity. Not an open-market toy.', color: '#EAB308', dur: 5.5 },
    { id: 'dual', title: 'Dual capacity', line: 'Enterprise funds the plane. Individuals keep Open.', color: '#60A5FA', dur: 5.5 },
    { id: 'clock', title: 'Singularity clock', line: 'Plane residual advances. Not your wallet spectacle.', color: '#A78BFA', dur: 5.5 },
    { id: 'unity', title: 'Unity', line: 'Same standard. Same mathematics. Truth and Unity.', color: '#C9A227', dur: 6.5 }
  ];

  function Engine(opts) {
    this.root = typeof opts.root === 'string' ? document.querySelector(opts.root) : opts.root;
    this.i = 0;
    this.raf = 0;
    this.timer = null;
    this.t0 = 0;
    this.running = true;
    this._build();
  }

  Engine.prototype._build = function () {
    if (!this.root) return;
    var stage = this.root.querySelector('.tour-stage') || this.root;
    this.canvas = stage.querySelector('canvas.dc-film') || document.createElement('canvas');
    this.canvas.className = 'dc-film';
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;background:#020203';
    stage.innerHTML = '';
    stage.appendChild(this.canvas);
    this.titleEl = this.root.querySelector('.tour-title');
    this.lineEl = this.root.querySelector('.tour-line');
    this.stepEl = this.root.querySelector('.tour-step');
    this.progressEl = this.root.querySelector('.tour-progress-bar');
  };

  Engine.prototype.steps = function () { return STEPS; };

  Engine.prototype.go = function (idx, auto) {
    var self = this;
    clearTimeout(this.timer);
    this.i = ((idx % STEPS.length) + STEPS.length) % STEPS.length;
    var s = STEPS[this.i];
    if (this.titleEl) this.titleEl.textContent = s.title;
    if (this.lineEl) this.lineEl.textContent = s.line;
    if (this.stepEl) this.stepEl.textContent = (this.i + 1) + ' / ' + STEPS.length;
    this.t0 = performance.now();
    this._paintLoop(s);
    if (auto !== false && this.running) {
      this.timer = setTimeout(function () { self.go(self.i + 1, true); }, s.dur * 1000);
    }
  };

  Engine.prototype.next = function () { this.go(this.i + 1, true); };
  Engine.prototype.prev = function () { this.go(this.i - 1, true); };
  Engine.prototype.pause = function () {
    this.running = !this.running;
    clearTimeout(this.timer);
    if (this.running) this.go(this.i, true);
  };

  Engine.prototype._size = function () {
    var c = this.canvas;
    var parent = c.parentElement;
    var w = parent.clientWidth || window.innerWidth || 640;
    var h = parent.clientHeight || Math.round(w * 9 / 16) || 360;
    if (h < 180) h = Math.round(w * 9 / 16);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    c.style.width = w + 'px';
    c.style.height = h + 'px';
    return { w: c.width, h: c.height, dpr: dpr, cssW: w, cssH: h };
  };

  Engine.prototype._paintLoop = function (step) {
    var self = this;
    cancelAnimationFrame(this.raf);
    function frame(now) {
      var dim = self._size();
      var ctx = self.canvas.getContext('2d');
      var t = (now - self.t0) / 1000;
      var prog = Math.min(1, t / step.dur);
      if (self.progressEl) self.progressEl.style.width = (prog * 100) + '%';
      self._scene(ctx, dim, step, t, prog);
      self.raf = requestAnimationFrame(frame);
    }
    this.raf = requestAnimationFrame(frame);
  };

  Engine.prototype._scene = function (ctx, dim, step, t, prog) {
    var w = dim.w, h = dim.h;
    // void
    ctx.fillStyle = '#020203';
    ctx.fillRect(0, 0, w, h);

    // nebula wash
    var g = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.55);
    g.addColorStop(0, hexAlpha(step.color, 0.18));
    g.addColorStop(0.45, 'rgba(30,40,80,0.12)');
    g.addColorStop(1, 'rgba(2,2,3,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // star field
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (var i = 0; i < 80; i++) {
      var sx = ((i * 97 + t * 8) % w);
      var sy = ((i * 53 + 20) % h);
      var sr = (i % 3 === 0) ? 1.8 : 1;
      ctx.globalAlpha = 0.15 + (i % 5) * 0.08;
      ctx.beginPath();
      ctx.arc(sx, sy, sr * dim.dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // dual helix waves
    drawHelix(ctx, w, h, t, step.color);

    // orbital ring
    var cx = w * 0.5, cy = h * 0.42;
    var R = Math.min(w, h) * 0.2;
    ctx.strokeStyle = hexAlpha(step.color, 0.9);
    ctx.lineWidth = Math.max(2, w * 0.0035);
    ctx.beginPath();
    ctx.arc(cx, cy, R, t * 0.5, t * 0.5 + Math.PI * 1.7);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.28, -t * 0.3, -t * 0.3 + Math.PI * 1.3);
    ctx.stroke();

    // five residual nodes
    var nodes = ['#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#888'];
    for (var n = 0; n < 5; n++) {
      var ang = t * 0.35 + n * (Math.PI * 2 / 5);
      var nx = cx + Math.cos(ang) * R * 0.72;
      var ny = cy + Math.sin(ang) * R * 0.72;
      ctx.fillStyle = nodes[n];
      ctx.beginPath();
      ctx.arc(nx, ny, Math.max(3, w * 0.006), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // wordmark
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '600 ' + Math.round(w * 0.028) + 'px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DualisCapax', cx, h * 0.1);

    // beat title
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 ' + Math.round(w * 0.055) + 'px system-ui,sans-serif';
    ctx.fillText(step.title, cx, cy + R + h * 0.12);

    // line
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.font = '400 ' + Math.round(w * 0.022) + 'px system-ui,sans-serif';
    wrapText(ctx, step.line, cx, cy + R + h * 0.18, w * 0.8, Math.round(w * 0.028));

    // progress tick
    ctx.fillStyle = hexAlpha(step.color, 0.85);
    ctx.fillRect(w * 0.15, h * 0.94, w * 0.7 * prog, Math.max(2, h * 0.006));
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(w * 0.15, h * 0.94, w * 0.7, Math.max(2, h * 0.006));
  };

  function drawHelix(ctx, w, h, t, color) {
    ctx.save();
    ctx.translate(0, h * 0.5);
    for (var strand = 0; strand < 2; strand++) {
      ctx.beginPath();
      for (var x = 0; x <= w; x += 4) {
        var phase = x * 0.012 + t * 1.2 + strand * Math.PI;
        var y = Math.sin(phase) * h * 0.12 + (strand ? 6 : -6);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = strand === 0 ? hexAlpha(color, 0.55) : 'rgba(96,165,250,0.5)';
      ctx.lineWidth = Math.max(2, w * 0.0025);
      ctx.stroke();
    }
    ctx.restore();
  }

  function wrapText(ctx, text, x, y, maxW, lineH) {
    var words = text.split(' ');
    var line = '';
    var yy = y;
    for (var n = 0; n < words.length; n++) {
      var test = line + words[n] + ' ';
      if (ctx.measureText(test).width > maxW && n > 0) {
        ctx.fillText(line.trim(), x, yy);
        line = words[n] + ' ';
        yy += lineH;
      } else line = test;
    }
    ctx.fillText(line.trim(), x, yy);
  }

  function hexAlpha(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  Engine.prototype.start = function () {
    var self = this;
    this.running = true;
    requestAnimationFrame(function () { self.go(0, true); });
    return this;
  };

  global.DualisVideoEngine = Engine;
  global.DUALIS_STORYBOARD_STEPS = STEPS;
})(typeof window !== 'undefined' ? window : globalThis);
