/**
 * DualisCapax intro — direct Big Bang
 * Void → seed bloom → NASA Big Bang → lander
 * No residual sentences. No glyph assembly.
 */
(function () {
  var intro = document.getElementById('intro');
  var video = document.getElementById('nasa-bb');
  var smoke = document.getElementById('smoke');
  var skip = document.getElementById('skip-intro');
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

  var T = {
    bangDelay: 0.12,
    crossfadeAt: 0.32,
    introOut: 1.35,
    hardFail: 12000
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

  /* Direct path: residual tone → seed + Big Bang */
  startResidual();
  setTimeout(startVideo, T.bangDelay * 1000);
})();
