(function () {
  var intro = document.getElementById('intro');
  var video = document.getElementById('nasa-bb');
  var smoke = document.getElementById('smoke');
  var skip = document.getElementById('skip-intro');
  var question = document.getElementById('question');
  var seed = document.getElementById('seed');
  if (!intro || !video || !question) return;

  if (document.documentElement.classList.contains('land-direct')) {
    try { intro.remove(); } catch (e) {}
    try { if (smoke) smoke.remove(); } catch (e) {}
    document.body.classList.add('is-live');
    return;
  }

  var done = false;
  var phase = 'matrix';
  var residualLive = false;
  var crossfading = false;
  var audioCtx = null;
  var osc = null;
  var gain = null;
  var PLAYBACK_RATE = 2;
  var CROSSFADE_AT = 0.74;

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
      gain.gain.exponentialRampToValueAtTime(0.22, now + 1.0);
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
        gain.gain.exponentialRampToValueAtTime(0.32, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.9);
      }
      var boom = ctx.createOscillator();
      var boomGain = ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(55, now);
      boom.frequency.exponentialRampToValueAtTime(28, now + 0.55);
      boomGain.gain.setValueAtTime(0.0001, now);
      boomGain.gain.exponentialRampToValueAtTime(0.55, now + 0.03);
      boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      boom.connect(boomGain);
      boomGain.connect(ctx.destination);
      boom.start(now);
      boom.stop(now + 0.75);
      var frames = Math.floor(ctx.sampleRate * 0.18);
      var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 2.2);
      var noise = ctx.createBufferSource();
      noise.buffer = buffer;
      var noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 420;
      noiseFilter.Q.value = 0.7;
      var noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  function stopResidual(then) {
    residualLive = false;
    if (seed) seed.style.transform = '';
    if (audioCtx && gain) {
      try {
        var now = audioCtx.currentTime;
        gain.gain.cancelScheduledValues(now);
        var cur = Math.max(gain.gain.value, 0.0001);
        gain.gain.setValueAtTime(cur, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        setTimeout(function () {
          try { if (osc) osc.stop(); } catch (e) {}
          try { if (audioCtx) audioCtx.close(); } catch (e) {}
          osc = null;
          gain = null;
          audioCtx = null;
          if (typeof then === 'function') then();
        }, 420);
        return;
      } catch (e) {}
    }
    try { if (osc) osc.stop(); } catch (e) {}
    try { if (audioCtx) audioCtx.close(); } catch (e) {}
    osc = null;
    gain = null;
    audioCtx = null;
    if (typeof then === 'function') then();
  }

  function beginCrossfade() {
    if (done || crossfading) return;
    crossfading = true;
    done = true;
    stopResidual(function () {
      video.classList.add('is-fade');
      if (smoke) smoke.classList.add('is-on');
      intro.classList.add('is-out');
      document.body.classList.add('is-live');
      setTimeout(function () {
        if (smoke) smoke.classList.add('is-clear');
      }, 1200);
      setTimeout(function () {
        try { video.pause(); } catch (e) {}
        try {
          intro.remove();
          if (smoke) smoke.remove();
        } catch (e) {}
      }, 2600);
    });
  }

  function startVideo() {
    if (phase === 'video' || done) return;
    phase = 'video';
    try {
      if (seed) seed.classList.add('is-gone');
    } catch (e) {}
    video.classList.add('is-on');
    try {
      video.currentTime = 0;
    } catch (e) {}
    try {
      video.playbackRate = PLAYBACK_RATE;
    } catch (e) {}
    ensureCtx();
    // Bang at the true beginning of the Big Bang clip
    fireBang();
    startResidual();
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  function fadeQuestionThenBang() {
    if (phase !== 'question' && phase !== 'matrix') return;
    phase = 'fadeq';
    question.classList.remove('is-in');
    question.classList.add('is-out');
    var mx = document.getElementById('matrix');
    if (mx) mx.classList.add('is-fade');
    setTimeout(startVideo, 1400);
  }

  function solidifyQuestion() {
    if (done) return;
    phase = 'question';
    question.classList.add('is-in');
    setTimeout(fadeQuestionThenBang, 3000);
  }

  function unlock() {
    ensureCtx();
  }

  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, unlock, { once: true, passive: true });
  });

  video.addEventListener('timeupdate', function () {
    if (phase !== 'video' || done) return;
    var d = video.duration;
    if (!d || !isFinite(d)) return;
    if (video.currentTime / d >= CROSSFADE_AT) beginCrossfade();
  });
  video.addEventListener('ended', function () {
    if (!done) beginCrossfade();
  });
  video.addEventListener('error', function () {
    if (phase === 'video' && !done) beginCrossfade();
  });

  if (skip) {
    skip.addEventListener('click', function () {
      unlock();
      try {
        video.pause();
      } catch (e) {}
      beginCrossfade();
    });
  }

  (function runMatrix() {
    var canvas = document.getElementById('matrix');
    if (!canvas) {
      setTimeout(solidifyQuestion, 400);
      return;
    }
    var ctx = canvas.getContext('2d');
    if (!ctx) {
      setTimeout(solidifyQuestion, 400);
      return;
    }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0,
      H = 0,
      cols = [],
      fontSize = 14;
    var glyphs = '01デュアリス残余01001 Residual 01CAPAX01';
    var started = performance.now();
    var solidified = false;
    canvas.classList.add('is-on');

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fontSize = Math.max(12, Math.floor(W / 42));
      var n = Math.ceil(W / fontSize);
      cols = [];
      for (var i = 0; i < n; i++) {
        cols.push({ y: Math.random() * H, speed: 2 + Math.random() * 5 });
      }
    }

    function frame(now) {
      if (done || phase === 'video' || phase === 'fadeq') return;
      var t = (now - started) / 1000;
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, 0, W, H);
      ctx.font =
        '600 ' +
        fontSize +
        'px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      var dens = Math.min(1, t / 2.1);
      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        var x = i * fontSize;
        var ch = glyphs.charAt((i * 7 + Math.floor(c.y / fontSize)) % glyphs.length);
        var alpha =
          (0.15 + dens * 0.75) * (0.55 + 0.45 * Math.sin((c.y + i) * 0.02));
        ctx.fillStyle = 'rgba(158,197,255,' + alpha + ')';
        ctx.fillText(ch, x, c.y);
        c.y += c.speed * (0.7 + dens);
        if (c.y > H + fontSize) c.y = -Math.random() * H * 0.3;
      }
      if (dens > 0.55) {
        var g = ctx.createRadialGradient(
          W / 2,
          H / 2,
          0,
          W / 2,
          H / 2,
          Math.min(W, H) * 0.45
        );
        g.addColorStop(0, 'rgba(0,0,0,' + 0.35 * dens + ')');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      if (!solidified && t >= 2.2) {
        solidified = true;
        solidifyQuestion();
      }
      if (phase === 'question' || phase === 'matrix' || !solidified) {
        requestAnimationFrame(frame);
      }
    }

    phase = 'matrix';
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  })();

  setTimeout(function () {
    if (!done && phase === 'video' && video.readyState < 2) beginCrossfade();
  }, 14000);
  setTimeout(function () {
    if (!done) beginCrossfade();
  }, 28000);
})();
