/**
 * DualisCapax Video Engine v1.1
 * Always show residual canvas motion first. Swap to mp4 only if it actually loads.
 */
(function (global) {
  var STEPS = [
    { id: 'open', title: 'Open', line: 'Research free. Full clinical surface. No Fusion Meter required to learn.' },
    { id: 'prove', title: 'Prove', line: 'Boundary first: settlement and identity before Adaptive depth.' },
    { id: 'depth', title: 'Depth', line: 'Adaptive AI and sandbox sim. Fusion Meter pays real session cost.' },
    { id: 'seal', title: 'Seal', line: 'IP and production math stay on the black ledger.' },
    { id: 'fm', title: 'Fusion Meter', line: 'Closed prepaid pay-down. Not an open-market coin.' },
    { id: 'dual', title: 'Dual capacity', line: 'Enterprise funds the plane. Individuals keep Open access.' },
    { id: 'clock', title: 'Singularity clock', line: 'Plane residual progress — not your wallet.' },
    { id: 'unity', title: 'Unity', line: 'Truth and Unity Prevail. Same mathematics. Computational analysis.' }
  ];

  function DualisVideoEngine(opts) {
    this.root = typeof opts.root === 'string' ? document.querySelector(opts.root) : opts.root;
    this.base = opts.mediaBase || 'assets/tour/';
    this.autoplay = opts.autoplay !== false;
    this.onStep = opts.onStep || function () {};
    this.i = 0;
    this.video = null;
    this.canvas = null;
    this.raf = 0;
    this._build();
  }

  DualisVideoEngine.prototype._build = function () {
    if (!this.root) return;
    var stage = this.root.querySelector('.tour-stage') || this.root;
    this.video = stage.querySelector('video') || document.createElement('video');
    this.video.setAttribute('playsinline', '');
    this.video.muted = true;
    this.video.loop = true;
    this.video.preload = 'none';
    this.video.style.display = 'none';
    if (!this.video.parentNode) stage.insertBefore(this.video, stage.firstChild);

    this.canvas = stage.querySelector('canvas.dc-video-engine') || document.createElement('canvas');
    this.canvas.className = 'dc-video-engine';
    this.canvas.style.cssText = 'display:block;width:100%;aspect-ratio:16/9;background:#050508';
    if (!this.canvas.parentNode) {
      if (this.video.nextSibling) stage.insertBefore(this.canvas, this.video.nextSibling);
      else stage.appendChild(this.canvas);
    }
    this.titleEl = this.root.querySelector('.tour-title');
    this.lineEl = this.root.querySelector('.tour-line');
    this.stepEl = this.root.querySelector('.tour-step');
  };

  DualisVideoEngine.prototype.steps = function () { return STEPS; };

  DualisVideoEngine.prototype.go = function (idx) {
    this.i = ((idx % STEPS.length) + STEPS.length) % STEPS.length;
    var s = STEPS[this.i];
    if (this.titleEl) this.titleEl.textContent = s.title;
    if (this.lineEl) this.lineEl.textContent = s.line;
    if (this.stepEl) this.stepEl.textContent = this.i + 1 + ' / ' + STEPS.length;
    // Motion first — never blank while probing for mp4
    this.video.style.display = 'none';
    this.canvas.style.display = 'block';
    this._drawResidual(s);
    this._tryMp4(s);
    this.onStep(s, this.i);
  };

  DualisVideoEngine.prototype.next = function () { this.go(this.i + 1); };
  DualisVideoEngine.prototype.prev = function () { this.go(this.i - 1); };

  DualisVideoEngine.prototype._tryMp4 = function (step) {
    var self = this;
    var url = this.base + step.id + '.mp4';
    var probe = document.createElement('video');
    probe.muted = true;
    probe.preload = 'auto';
    probe.playsInline = true;
    var done = false;
    function fail() {
      if (done) return;
      done = true;
      probe.removeAttribute('src');
      try { probe.load(); } catch (e) {}
    }
    function ok() {
      if (done) return;
      done = true;
      cancelAnimationFrame(self.raf);
      self.video.src = url;
      self.video.style.display = 'block';
      self.canvas.style.display = 'none';
      self.video.load();
      if (self.autoplay) {
        var p = self.video.play();
        if (p && p.catch) p.catch(function () {
          self.video.style.display = 'none';
          self.canvas.style.display = 'block';
          self._drawResidual(step);
        });
      }
    }
    probe.onloadeddata = ok;
    probe.onerror = fail;
    probe.src = url;
    probe.load();
    setTimeout(fail, 800);
  };

  DualisVideoEngine.prototype._drawResidual = function (step) {
    var canvas = this.canvas;
    cancelAnimationFrame(this.raf);
    var w = canvas.clientWidth || canvas.parentElement.clientWidth || 640;
    var h = Math.round((w * 9) / 16) || 360;
    var dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = '100%';
    canvas.style.aspectRatio = '16/9';
    var ctx = canvas.getContext('2d');
    var t0 = performance.now();
    var self = this;
    function frame(now) {
      var t = (now - t0) / 1000;
      var cw = canvas.width, ch = canvas.height;
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, cw, ch);
      var cx = cw * 0.5, cy = ch * 0.42, R = Math.min(cw, ch) * 0.22;
      ctx.strokeStyle = 'rgba(201,162,39,0.95)';
      ctx.lineWidth = Math.max(2, cw * 0.004);
      ctx.beginPath();
      ctx.arc(cx, cy, R, t * 0.4, t * 0.4 + Math.PI * 1.65);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = Math.max(1, cw * 0.002);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.25, -t * 0.25, -t * 0.25 + Math.PI * 1.2);
      ctx.stroke();
      for (var n = 0; n < 120; n++) {
        var a = t * 0.4 + n * 0.55;
        var r = R * (0.25 + (n % 10) * 0.07);
        ctx.fillStyle = 'rgba(212,180,60,' + (0.15 + (n % 6) * 0.1) + ')';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a * 1.08) * r * 0.55, Math.max(1.5, cw * 0.002), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(201,162,39,0.9)';
      ctx.font = '600 ' + Math.round(cw * 0.02) + 'px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DUALISCAPAX', cx, ch * 0.12);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 ' + Math.round(cw * 0.05) + 'px system-ui,sans-serif';
      ctx.fillText(step.title, cx, cy + R + ch * 0.12);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '400 ' + Math.round(cw * 0.022) + 'px system-ui,sans-serif';
      var line = step.line;
      if (line.length > 48) {
        var cut = line.lastIndexOf(' ', 48);
        if (cut < 20) cut = 48;
        ctx.fillText(line.slice(0, cut), cx, cy + R + ch * 0.18);
        ctx.fillText(line.slice(cut).trim(), cx, cy + R + ch * 0.23);
      } else {
        ctx.fillText(line, cx, cy + R + ch * 0.18);
      }
      self.raf = requestAnimationFrame(frame);
    }
    this.raf = requestAnimationFrame(frame);
  };

  DualisVideoEngine.prototype.start = function () {
    var self = this;
    // layout pass then start so canvas has width on mobile
    requestAnimationFrame(function () {
      self.go(0);
    });
    return this;
  };

  global.DualisVideoEngine = DualisVideoEngine;
  global.DUALIS_STORYBOARD_STEPS = STEPS;
})(typeof window !== 'undefined' ? window : globalThis);
