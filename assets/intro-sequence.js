/**
 * DualisCapax intro sequence
 * Void → granular text assembly → hold → seed/bang → crossfade into frozen lander
 * Lander (.site) is never modified — only timing into it is refined.
 * No Matrix rain. Sentences assemble from particles, never fade-in as whole strings.
 */
(function () {
  var intro = document.getElementById('intro');
  var video = document.getElementById('nasa-bb');
  var smoke = document.getElementById('smoke');
  var skip = document.getElementById('skip-intro');
  var question = document.getElementById('question');
  var seed = document.getElementById('seed');
  var canvas = document.getElementById('matrix');
  if (!intro || !video || !question) return;

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

  /* Timing (seconds) — tuned for one continuous arc into the lander */
  var T = {
    assemble1: 1.8,   // first line coalesces
    assemble2: 1.4,   // second line coalesces
    hold: 2.2,        // read the assembled residual question
    fadeOut: 1.2,     // question out + seed bloom
    bangDelay: 0.15,  // seed → video
    crossfadeAt: 0.55,// fraction of video duration → start lander
    introOut: 2.0,    // intro opacity to 0
    hardFail: 26000   // absolute ms safety
  };

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
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.9);
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
        gain.gain.exponentialRampToValueAtTime(0.3, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.16, now + 0.85);
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
      boomGain.gain.exponentialRampToValueAtTime(0.28, now + 0.03);
      boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      boom.stop(now + 1.2);
    } catch (e) {}
  }

  function stopResidual(then) {
    try {
      if (gain && audioCtx) {
        var now = audioCtx.currentTime;
        gain.gain.cancelScheduledValues(now);
        var cur = Math.max(gain.gain.value, 0.0001);
        gain.gain.setValueAtTime(cur, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      }
    } catch (e) {}
    setTimeout(function () {
      try {
        if (osc) osc.stop();
      } catch (e) {}
      residualLive = false;
      if (typeof then === 'function') then();
    }, 650);
  }

  function beginCrossfade() {
    if (done || crossfading) return;
    done = true;
    crossfading = true;
    phase = 'crossfade';

    /* Bring lander up under the intro, then lift intro away */
    document.body.classList.add('is-live');
    if (smoke) smoke.classList.add('is-clear');

    stopResidual(function () {});

    setTimeout(function () {
      intro.classList.add('is-out');
      video.classList.add('is-fade');
    }, 80);

    setTimeout(function () {
      try { intro.remove(); } catch (e) {}
      try { if (smoke) smoke.remove(); } catch (e) {}
    }, 80 + T.introOut * 1000 + 200);
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
      }, 700);
    }
    fireBang();
    video.classList.add('is-on');
    try {
      video.playbackRate = 1.15;
    } catch (e) {}
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  function fadeQuestionThenBang() {
    if (phase !== 'assembled') return;
    phase = 'fadeq';
    question.classList.remove('is-in');
    question.classList.add('is-out');
    setTimeout(startVideo, T.fadeOut * 1000);
  }

  /**
   * Granular assembly: particles spawn from void and coalesce into the two lines.
   * No full-sentence fade-in. Build from nothing.
   */
  function runAssembly() {
    phase = 'assemble';
    var lines = [];
    var ps = question.querySelectorAll('p');
    for (var i = 0; i < ps.length; i++) lines.push(ps[i]);

    /* Hide native text until particles lock */
    question.style.opacity = '0';
    for (var j = 0; j < lines.length; j++) {
      lines[j].style.opacity = '0';
    }

    if (!canvas || !canvas.getContext) {
      /* Fallback: short delay then reveal assembled text */
      setTimeout(function () {
        revealAssembled();
      }, 400);
      return;
    }

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var particles = [];
    var started = performance.now();
    var stage = 0; /* 0 = line1, 1 = line2, 2 = done */

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function measureLine(text, fontSize) {
      ctx.font = '700 ' + fontSize + 'px Inter, system-ui, sans-serif';
      return ctx.measureText(text).width;
    }

    function spawnForLine(text, lineIndex, duration) {
      var fontSize = Math.max(18, Math.min(28, Math.floor(W / 18)));
      var maxW = Math.min(W * 0.88, 22 * 16);
      while (measureLine(text, fontSize) > maxW && fontSize > 14) fontSize -= 1;
      ctx.font = '700 ' + fontSize + 'px Inter, system-ui, sans-serif';
      var tw = ctx.measureText(text).width;
      var x0 = (W - tw) / 2;
      var y0 = H * 0.5 + (lineIndex === 0 ? -fontSize * 0.85 : fontSize * 1.05);
      var chars = text.split('');
      var cx = x0;
      for (var i = 0; i < chars.length; i++) {
        var ch = chars[i];
        var cw = ctx.measureText(ch).width;
        if (ch !== ' ') {
          /* Several particles per glyph for granular feel */
          var n = 3 + Math.floor(Math.random() * 3);
          for (var k = 0; k < n; k++) {
            particles.push({
              ch: ch,
              tx: cx + cw * 0.15 + Math.random() * cw * 0.5,
              ty: y0 + (Math.random() - 0.5) * fontSize * 0.15,
              x: W * (0.15 + Math.random() * 0.7),
              y: H * (0.1 + Math.random() * 0.8),
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              size: fontSize * (0.55 + Math.random() * 0.35),
              alpha: 0,
              t0: performance.now() + Math.random() * 120,
              dur: duration * 1000 * (0.75 + Math.random() * 0.35),
              locked: false
            });
          }
        }
        cx += cw;
      }
    }

    function revealAssembled() {
      phase = 'assembled';
      question.style.opacity = '';
      question.classList.add('is-in');
      for (var i = 0; i < lines.length; i++) {
        lines[i].style.opacity = '';
      }
      if (canvas) {
        canvas.classList.add('is-fade');
        setTimeout(function () {
          if (canvas) canvas.classList.remove('is-on');
        }, 600);
      }
      setTimeout(fadeQuestionThenBang, T.hold * 1000);
    }

    function frame(now) {
      if (done || phase === 'video' || phase === 'fadeq' || phase === 'crossfade') return;

      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, 0, W, H);

      var allLocked = particles.length > 0;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var age = now - p.t0;
        if (age < 0) continue;
        var u = Math.min(1, age / p.dur);
        /* ease-out cubic toward target */
        var e = 1 - Math.pow(1 - u, 3);
        p.x = p.x + (p.tx - p.x) * (0.08 + e * 0.12);
        p.y = p.y + (p.ty - p.y) * (0.08 + e * 0.12);
        p.alpha = Math.min(1, e * 1.2);
        if (u >= 0.98) p.locked = true;
        if (!p.locked) allLocked = false;

        ctx.globalAlpha = p.alpha * 0.92;
        ctx.fillStyle = 'rgba(232,241,255,0.95)';
        ctx.font = '700 ' + Math.round(p.size) + 'px Inter, system-ui, sans-serif';
        ctx.fillText(p.ch, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      if (stage === 0 && now - started > T.assemble1 * 1000 * 0.15 && particles.length === 0) {
        spawnForLine(lines[0] ? lines[0].textContent.trim() : 'Every decision leaves a residual.', 0, T.assemble1);
      }
      if (stage === 0 && allLocked && particles.length > 0 && now - started > T.assemble1 * 1000) {
        stage = 1;
        allLocked = false;
        if (lines[1]) {
          spawnForLine(lines[1].textContent.trim(), 1, T.assemble2);
        } else {
          stage = 2;
        }
      }
      if (stage === 1 && allLocked && now - started > (T.assemble1 + T.assemble2) * 1000) {
        stage = 2;
      }
      if (stage === 2) {
        revealAssembled();
        return;
      }

      requestAnimationFrame(frame);
    }

    canvas.classList.add('is-on');
    resize();
    window.addEventListener('resize', resize);
    startResidual();
    /* brief void, then particles */
    setTimeout(function () {
      spawnForLine(lines[0] ? lines[0].textContent.trim() : 'Every decision leaves a residual.', 0, T.assemble1);
      requestAnimationFrame(frame);
    }, 280);
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

  /* Safety nets */
  setTimeout(function () {
    if (!done && phase === 'video' && video.readyState < 2) beginCrossfade();
  }, 12000);
  setTimeout(function () {
    if (!done) beginCrossfade();
  }, T.hardFail);

  /* Go */
  runAssembly();
})();
