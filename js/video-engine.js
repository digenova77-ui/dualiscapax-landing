/**
 * DualisCapax Video Engine v1
 * Storyboard timeline: play mp4 when present, else residual canvas renderer.
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
    this.video.preload = 'metadata';
    if (!this.video.parentNode) stage.insertBefore(this.video, stage.firstChild);
    this.canvas = stage.querySelector('canvas.dc-video-engine') || document.createElement('canvas');
    this.canvas.className = 'dc-video-engine';
    this.canvas.style.cssText = 'display:none;width:100%;aspect-ratio:16/9;background:#050508';
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
    this._playMedia(s);
    this.onStep(s, this.i);
  };

  DualisVideoEngine.prototype.next = function () { this.go(this.i + 1); };
  DualisVideoEngine.prototype.prev = function () { this.go(this.i - 1); };

  DualisVideoEngine.prototype._playMedia = function (step) {
    var self = this;
    var settled = false;
    cancelAnimationFrame(this.raf);
    function fallback() {
      if (settled) return;
      settled = true;
      self.video.style.display = 'none';
      self.canvas.style.display = 'block';
      self._drawResidual(step);
    }
    function ok() {
      if (settled) return;
      settled = true;
      cancelAnimationFrame(self.raf);
      self.canvas.style.display = 'none';
      self.video.style.display = 'block';
    }
    this.video.onloadeddata = ok;
    this.video.onerror = fallback;
    this.video.src = this.base + step.id + '.mp4';
    this.video.poster = this.base + step.id + '.jpg';
    this.video.load();
    if (this.autoplay) {
      var p = this.video.play();
      if (p && p.catch) p.catch(function () {});
    }
    setTimeout(function () {
      if (!settled && (self.video.readyState < 2 || self.video.networkState === 3)) fallback();
    }, 1500);
  };

  DualisVideoEngine.prototype._drawResidual = function (step) {
    var canvas = this.canvas;
    var w = (canvas.width = canvas.clientWidth * (devicePixelRatio || 1) || 1280);
    var h = (canvas.height = Math.round((w * 9) / 16));
    var ctx = canvas.getContext('2d');
    var t0 = performance.now();
    var self = this;
    function frame(now) {
      var t = (now - t0) / 1000;
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, w, h);
      var cx = w * 0.5, cy = h * 0.42, R = Math.min(w, h) * 0.2;
      ctx.strokeStyle = 'rgba(201,162,39,0.9)';
      ctx.lineWidth = Math.max(2, w * 0.003);
      ctx.beginPath();
      ctx.arc(cx, cy, R, t * 0.3, t * 0.3 + Math.PI * 1.7);
      ctx.stroke();
      for (var n = 0; n < 90; n++) {
        var a = t * 0.35 + n * 0.7;
        var r = R * (0.3 + (n % 8) * 0.08);
        ctx.fillStyle = 'rgba(212,180,60,' + (0.2 + (n % 5) * 0.1) + ')';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a * 1.05) * r * 0.55, Math.max(1.2, w * 0.0018), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(201,162,39,0.85)';
      ctx.font = '600 ' + Math.round(w * 0.018) + 'px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DUALISCAPAX', cx, h * 0.12);
      ctx.fillStyle = '#fff';
      ctx.font = '600 ' + Math.round(w * 0.045) + 'px system-ui,sans-serif';
      ctx.fillText(step.title, cx, cy + R + h * 0.1);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '400 ' + Math.round(w * 0.02) + 'px system-ui,sans-serif';
      ctx.fillText(step.line, cx, cy + R + h * 0.16);
      self.raf = requestAnimationFrame(frame);
    }
    this.raf = requestAnimationFrame(frame);
  };

  DualisVideoEngine.prototype.start = function () {
    this.go(0);
    return this;
  };

  global.DualisVideoEngine = DualisVideoEngine;
  global.DUALIS_STORYBOARD_STEPS = STEPS;
})(typeof window !== 'undefined' ? window : globalThis);
