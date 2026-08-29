/**
 * DualisCapax intro — seed, then the locked lander.
 * We do not copy a NASA tape. We do not load that MP4.
 * We do not rewrite the four lines. Iris sits bottom right.
 */
(function () {
  var intro = document.getElementById('intro');
  var smoke = document.getElementById('smoke');
  var skip = document.getElementById('skip-intro');
  var seed = document.getElementById('seed');
  var canvas = document.getElementById('matrix');
  if (!intro) return;

  if (document.documentElement.classList.contains('land-direct')) {
    try { intro.remove(); } catch (e) {}
    try { if (smoke) smoke.remove(); } catch (e) {}
    document.body.classList.add('is-live');
    return;
  }

  var done = false;
  var residualLive = false;
  var audioCtx = null;
  var osc = null;
  var gain = null;
  var T = { bloom: 520, introOut: 1350, hardFail: 4200 };

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

  function stopResidual() {
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
      try { if (osc) osc.stop(); } catch (e) {}
      residualLive = false;
    }, 480);
  }

  function beginCrossfade() {
    if (done) return;
    done = true;
    document.body.classList.add('is-live');
    if (smoke) smoke.classList.add('is-clear');
    stopResidual();
    intro.classList.add('is-out');
    if (canvas) canvas.classList.add('is-fade');
    setTimeout(function () {
      try { intro.remove(); } catch (e) {}
      try { if (smoke) smoke.remove(); } catch (e) {}
    }, T.introOut + 150);
  }

  function bloom() {
    if (done) return;
    if (canvas) canvas.classList.add('is-on');
    if (seed) {
      seed.classList.add('is-on');
      seed.classList.add('is-bloom');
      setTimeout(function () { if (seed) seed.classList.add('is-gone'); }, T.bloom);
    }
    setTimeout(function () { if (!done) beginCrossfade(); }, T.bloom + 400);
  }

  function unlock() { ensureCtx(); }
  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, unlock, { passive: true, once: true });
  });
  if (skip) skip.addEventListener('click', function () { if (!done) beginCrossfade(); });
  setTimeout(function () { if (!done) beginCrossfade(); }, T.hardFail);

  startResidual();
  bloom();
})();
