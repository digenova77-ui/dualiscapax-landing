/**
 * DualisCapax intro — Unity arc
 * Void → quarks assemble the question → hold assembled glyphs → seed/bang → lander
 * No Matrix rain. No HTML sentence fade/drop-in after assembly.
 * Lander (.site) structure unchanged.
 */
(function () {
  var intro = document.getElementById('intro');
  var video = document.getElementById('nasa-bb');
  var smoke = document.getElementById('smoke');
  var skip = document.getElementById('skip-intro');
  var question = document.getElementById('question');
  var seed = document.getElementById('seed');
  var canvas = document.getElementById('matrix');
  if (!intro || !video) return;

  if (document.documentElement.classList.contains('land-direct')) {
    try { intro.remove(); } catch (e) {}
    try { if (smoke) smoke.remove(); } catch (e) {}
    document.body.classList.add('is-live');
    return;
  }

  var done = false;
  var phase = 'void';
  var residualLive = false;
  var crossfading = false;
  var audioCtx = null;
  var osc = null;
  var gain = null;
  var collapseStart = 0;

  var T = {
    assemble1: 1.35,
    assemble2: 1.15,
    hold: 1.55,
    collapse: 0.7,
    bangDelay: 0.08,
    crossfadeAt: 0.32,
    introOut: 1.35,
    hardFail: 16000
  };

  function lineTexts() {
    var out = [];
    if (question) {
      var ps = question.querySelectorAll('p');
      for (var i = 0; i < ps.length; i++) out.push(ps[i].textContent.trim());
    }
    if (!out.length) {
      out = ['Every decision leaves a residual.', 'What will yours cost?'];
    }
    return out;
  }

  function ensureCtx() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(function () {});
      return audioCtx;
    } catch (e) {
      return null;
    }
  }

  function startResidual() {
    if (residualLive && audioCtx && audioCtx.state !== 'closed') {
      ensureCtx();
      return;
    }
    residualLive = true;
    try {
      var ctx = ensureCtx();
      if (!ctx) return;
      osc = ctx.createOscillator();
      gain = ctx.createGain();
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 180;
      osc.type = 'sawtooth';
      osc.frequency.value = 42;
      gain.gain.value = 0.0001;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      var now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.55);
    } catch (e) {
      residualLive = false;
    }
  }

  function fireBang() {
    var ctx = ensureCtx();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;
      if (gain) {
        gain.gain.cancelScheduledValues(now);
        var cur = Math.max(gain.gain.value, 0.0001);
        gain.gain.setValueAtTime(cur, now);
        gain.gain.exponentialRampToValueAtTime(0.28, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.14, now + 0.7);
      }
      var boom = ctx.createOscillator();
      var boomGain = ctx.createGain();
      boom.type = 'sine';
      boom.frequency.value = 28;
      boomGain.gain.value = 0.0001;
      boom.connect(boomGain);
      boomGain.connect(ctx.destination);
      boom.start();
      boomGain.gain.setValueAtTime(0.0001, now);
      boomGain.gain.exponentialRampToValueAtTime(0.26, now + 0.03);
      boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      boom.stop(now + 1.0);
    } catch (e) {}
  }

  function stopResidual(then) {
    try {
      if (gain && audioCtx) {
        var now = audioCtx.currentTime;
        gain.gain.cancelScheduledValues(now);
        var cur = Math.max(gain.gain.value, 0.0001);
        gain.gain.setValueAtTime(cur, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      }
    } catch (e) {}
    setTimeout(function () {
      try {
        if (osc) osc.stop();
      } catch (e) {}
      residualLive = false;
      if (typeof then === 'function') then();
    }, 480);
  }

  function beginCrossfade() {
    if (done || crossfading) return;
    done = true;
    crossfading = true;
    phase = 'crossfade';
    document.body.classList.add('is-live');
    if (smoke) smoke.classList.add('is-clear');
    stopResidual(function () {});
    setTimeout(function () {
      intro.classList.add('is-out');
      video.classList.add('is-fade');
    }, 60);
    setTimeout(function () {
      try { intro.remove(); } catch (e) {}
      try { if (smoke) smoke.remove(); } catch (e) {}
    }, 60 + T.introOut * 1000 + 150);
  }

  function startVideo() {
    if (phase === 'video' || done) return;
    phase = 'video';
    if (canvas) {
      canvas.classList.remove('is-on');
      canvas.classList.add('is-fade');
    }
    if (seed) {
      seed.classList.add('is-on');
      seed.classList.add('is-bloom');
      setTimeout(function () {
        if (seed) seed.classList.add('is-gone');
      }, 520);
    }
    fireBang();
    video.classList.add('is-on');
    try {
      video.playbackRate = 1.35;
    } catch (e) {}
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  function runAssembly() {
    phase = 'assemble';
    var lines = lineTexts();

    if (question) {
      question.classList.remove('is-in');
      question.classList.add('is-ghost');
    }

    if (!canvas || !canvas.getContext) {
      setTimeout(startVideo, 400);
      return;
    }

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var particles = [];
    var started = performance.now();
    var stage = 0;
    var assembledAt = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function fontPx() {
      return Math.max(32, Math.min(56, Math.floor(Math.min(W, 720) / 11)));
    }

    function measureLine(text, fontSize) {
      ctx.font = '800 ' + fontSize + 'px Inter, system-ui, sans-serif';
      return ctx.measureText(text).width;
    }

    function spawnForLine(text, lineIndex, duration) {
      var fontSize = fontPx();
      var maxW = Math.min(W * 0.92, 36 * 16);
      while (measureLine(text, fontSize) > maxW && fontSize > 22) fontSize -= 1;
      ctx.font = '800 ' + fontSize + 'px Inter, system-ui, sans-serif';
      var tw = ctx.measureText(text).width;
      var x0 = (W - tw) / 2;
      var gap = fontSize * 1.15;
      var y0 = H * 0.48 + (lineIndex === 0 ? -gap : gap);
      var chars = text.split('');
      var cx = x0;
      for (var i = 0; i < chars.length; i++) {
        var ch = chars[i];
        var cw = ctx.measureText(ch).width;
        if (ch !== ' ') {
          var n = 5 + Math.floor(Math.random() * 3);
          for (var k = 0; k < n; k++) {
            var angle = Math.random() * Math.PI * 2;
            var dist = Math.min(W, H) * (0.28 + Math.random() * 0.42);
            particles.push({
              ch: ch,
              tx: cx + cw * 0.08 + Math.random() * cw * 0.2,
              ty: y0 + (Math.random() - 0.5) * fontSize * 0.06,
              x: W * 0.5 + Math.cos(angle) * dist,
              y: H * 0.5 + Math.sin(angle) * dist,
              size: fontSize * (0.92 + Math.random() * 0.12),
              alpha: 0,
              t0: performance.now() + Math.random() * 90,
              dur: duration * 1000 * (0.78 + Math.random() * 0.22),
              locked: false
            });
          }
        }
        cx += cw;
      }
    }

    function beginCollapse() {
      if (phase !== 'assembled') return;
      phase = 'collapse';
      collapseStart = performance.now();
      for (var i = 0; i < particles.length; i++) {
        particles[i].locked = false;
      }
    }

    function frame(now) {
      if (done || phase === 'video' || phase === 'crossfade') return;

      ctx.fillStyle = phase === 'assembled' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.28)';
      ctx.fillRect(0, 0, W, H);

      var allLocked = particles.length > 0;
      var cx = W * 0.5;
      var cy = H * 0.5;
      var collapseU = 0;
      if (phase === 'collapse') {
        collapseU = Math.min(1, (now - collapseStart) / (T.collapse * 1000));
      }

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var age = now - p.t0;
        if (age < 0 && phase !== 'collapse') continue;

        if (phase === 'collapse') {
          var e = 1 - Math.pow(1 - collapseU, 2);
          p.x = p.x + (cx - p.x) * (0.16 + e * 0.22);
          p.y = p.y + (cy - p.y) * (0.16 + e * 0.22);
          p.alpha = Math.max(0, 1 - e);
          p.size = p.size * (1 - e * 0.55);
        } else {
          var u = Math.min(1, age / p.dur);
          var ease = 1 - Math.pow(1 - u, 3);
          p.x = p.x + (p.tx - p.x) * (0.12 + ease * 0.16);
          p.y = p.y + (p.ty - p.y) * (0.12 + ease * 0.16);
          p.alpha = Math.min(1, ease * 1.2);
          if (u >= 0.97) p.locked = true;
          if (!p.locked) allLocked = false;
        }

        if (p.alpha <= 0.02) continue;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#f4f7ff';
        ctx.shadowColor = 'rgba(158,197,255,0.55)';
        ctx.shadowBlur = phase === 'assembled' ? 10 : 6;
        ctx.font = '800 ' + Math.round(p.size) + 'px Inter, system-ui, sans-serif';
        ctx.fillText(p.ch, p.x, p.y);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (phase === 'collapse') {
        if (collapseU >= 1) {
          startVideo();
          return;
        }
        requestAnimationFrame(frame);
        return;
      }

      if (stage === 0 && particles.length === 0) {
        spawnForLine(lines[0] || 'Every decision leaves a residual.', 0, T.assemble1);
      }
      if (stage === 0 && allLocked && particles.length > 0 && now - started > T.assemble1 * 1000) {
        stage = 1;
        if (lines[1]) spawnForLine(lines[1], 1, T.assemble2);
        else stage = 2;
      }
      if (stage === 1 && allLocked && now - started > (T.assemble1 + T.assemble2) * 1000) {
        stage = 2;
      }
      if (stage === 2 && phase === 'assemble') {
        phase = 'assembled';
        assembledAt = now;
      }
      if (phase === 'assembled' && now - assembledAt > T.hold * 1000) {
        beginCollapse();
      }

      requestAnimationFrame(frame);
    }

    canvas.classList.add('is-on');
    resize();
    window.addEventListener('resize', resize);
    startResidual();
    setTimeout(function () {
      requestAnimationFrame(frame);
    }, 120);
  }

  function unlock() {
    ensureCtx();
  }
  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, unlock, { passive: true, once: true });
  });

  video.addEventListener('timeupdate', function () {
    if (phase !== 'video' || done) return;
    var d = video.duration;
    if (!d || !isFinite(d)) return;
    if (video.currentTime / d >= T.crossfadeAt) beginCrossfade();
  });
  video.addEventListener('ended', function () {
    if (!done) beginCrossfade();
  });
  video.addEventListener('error', function () {
    if (phase === 'video' && !done) beginCrossfade();
  });

  if (skip) {
    skip.addEventListener('click', function () {
      if (done) return;
      beginCrossfade();
    });
  }

  setTimeout(function () {
    if (!done && phase === 'video' && video.readyState < 2) beginCrossfade();
  }, 9000);
  setTimeout(function () {
    if (!done) beginCrossfade();
  }, T.hardFail);

  runAssembly();
})();
