/**
 * DualisCapax intro — shortened Unity arc
 * Void → granular assemble → brief hold → seed/bang → earlier crossfade into frozen lander
 * Lander (.site) structure unchanged. No Matrix rain.
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

  /* Tightened for one continuous Unity arc into the lander */
  var T = {
    assemble1: 1.15,
    assemble2: 0.95,
    hold: 1.35,
    fadeOut: 0.75,
    bangDelay: 0.1,
    crossfadeAt: 0.32,
    introOut: 1.35,
    hardFail: 16000
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

  function fadeQuestionThenBang() {
    if (phase !== 'assembled') return;
    phase = 'fadeq';
    question.classList.remove('is-in');
    question.classList.add('is-out');
    setTimeout(startVideo, T.fadeOut * 1000);
  }

  function runAssembly() {
    phase = 'assemble';
    var lines = [];
    var ps = question.querySelectorAll('p');
    for (var i = 0; i < ps.length; i++) lines.push(ps[i]);

    question.style.opacity = '0';
    for (var j = 0; j < lines.length; j++) {
      lines[j].style.opacity = '0';
    }

    if (!canvas || !canvas.getContext) {
      setTimeout(function () {
        revealAssembled();
      }, 280);
      return;
    }

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var particles = [];
    var started = performance.now();
    var stage = 0;

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
          var n = 2 + Math.floor(Math.random() * 2);
          for (var k = 0; k < n; k++) {
            particles.push({
              ch: ch,
              tx: cx + cw * 0.15 + Math.random() * cw * 0.5,
              ty: y0 + (Math.random() - 0.5) * fontSize * 0.15,
              x: W * (0.15 + Math.random() * 0.7),
              y: H * (0.1 + Math.random() * 0.8),
              size: fontSize * (0.55 + Math.random() * 0.35),
              alpha: 0,
              t0: performance.now() + Math.random() * 80,
              dur: duration * 1000 * (0.7 + Math.random() * 0.3),
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
        }, 450);
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
        var e = 1 - Math.pow(1 - u, 3);
        p.x = p.x + (p.tx - p.x) * (0.1 + e * 0.14);
        p.y = p.y + (p.ty - p.y) * (0.1 + e * 0.14);
        p.alpha = Math.min(1, e * 1.25);
        if (u >= 0.97) p.locked = true;
        if (!p.locked) allLocked = false;

        ctx.globalAlpha = p.alpha * 0.92;
        ctx.fillStyle = 'rgba(232,241,255,0.95)';
        ctx.font = '700 ' + Math.round(p.size) + 'px Inter, system-ui, sans-serif';
        ctx.fillText(p.ch, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      if (stage === 0 && now - started > T.assemble1 * 1000 * 0.12 && particles.length === 0) {
        spawnForLine(lines[0] ? lines[0].textContent.trim() : 'Between you and the future.', 0, T.assemble1);
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
    setTimeout(function () {
      spawnForLine(lines[0] ? lines[0].textContent.trim() : 'Between you and the future.', 0, T.assemble1);
      requestAnimationFrame(frame);
    }, 180);
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
