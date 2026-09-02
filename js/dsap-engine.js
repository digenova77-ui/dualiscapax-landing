/**
 * DSAP-1.0 holographic spatial audio engine — browser sleeve + felt roar.
 * Spec: encyclopedia/governance_and_protocols/dclm_dsap_holographic_spatial_audio_protocol_and_engine_spec.md
 *
 * Felt layer: proximity bass under 0.4 m while speaking. Word pulses on the ring.
 * Not a codec. Not KEMAR. Not WebTransport.
 */
(function (w) {
  var VERSION = "dsap-1.0-felt-2026-09-01";
  var SPEAKERS = 64;
  var STEP = 360 / SPEAKERS;
  var ALPHA = 0.998;
  var PROX_M = 1.2;
  var R_EFF = 4.18e-13;

  var ctx = null;
  var master = null;
  var convolver = null;
  var wet = null;
  var dry = null;
  var bass = null;
  var bassGain = null;
  var ring = [];
  var ready = false;
  var lastAz = 0;
  var lastDist = 1.6;
  var felt = false;

  function lawFloor() {
    return Object.freeze({
      layer: "DCLM_L0",
      axioms: ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"],
      residual_floor: R_EFF,
      anechoic_alpha: ALPHA
    });
  }

  function ensure() {
    if (ready && ctx && ctx.state !== "closed") return Promise.resolve(ctx);
    var AC = w.AudioContext || w.webkitAudioContext;
    if (!AC) return Promise.reject(new Error("NO_AUDIO"));
    ctx = ctx || new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = 0.72;
    dry = ctx.createGain();
    dry.gain.value = ALPHA;
    wet = ctx.createGain();
    wet.gain.value = 1 - ALPHA;
    convolver = ctx.createConvolver();
    convolver.buffer = tinyImpulse(ctx);
    bass = ctx.createOscillator();
    bass.type = "sine";
    bass.frequency.value = 42;
    bassGain = ctx.createGain();
    bassGain.gain.value = 0;
    try { bass.start(); } catch (e) {}

    dry.connect(master);
    wet.connect(master);
    convolver.connect(wet);
    bass.connect(bassGain);
    bassGain.connect(master);
    master.connect(ctx.destination);

    ring = [];
    for (var i = 0; i < SPEAKERS; i++) {
      var az = i * STEP;
      var p = ctx.createPanner();
      p.panningModel = "HRTF";
      p.distanceModel = "inverse";
      p.refDistance = 1;
      p.maxDistance = 12;
      p.rolloffFactor = 1.05;
      p.coneInnerAngle = 360;
      p.coneOuterAngle = 360;
      place(p, az, 1.6);
      var g = ctx.createGain();
      g.gain.value = 0;
      g.connect(p);
      p.connect(dry);
      p.connect(convolver);
      ring.push({ az: az, panner: p, gain: g });
    }
    ready = true;
    return ctx.resume().then(function () { return ctx; }).catch(function () { return ctx; });
  }

  function tinyImpulse(ac) {
    var n = Math.floor(ac.sampleRate * 0.18);
    var buf = ac.createBuffer(2, n, ac.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < n; i++) {
        var env = Math.pow(1 - i / n, 6);
        d[i] = (Math.random() * 2 - 1) * env * 0.018;
      }
    }
    return buf;
  }

  function place(panner, azDeg, dist) {
    var rad = (azDeg * Math.PI) / 180;
    var r = Math.max(0.35, dist);
    panner.positionX.value = Math.sin(rad) * r;
    panner.positionY.value = 0;
    panner.positionZ.value = Math.cos(rad) * r;
  }

  function nearest(az) {
    var i = Math.round(((az % 360) + 360) % 360 / STEP) % SPEAKERS;
    return ring[i];
  }

  function setProximity(dist) {
    if (!bassGain) return;
    var d = Math.max(0.2, dist);
    lastDist = d;
    var near = d < PROX_M ? (PROX_M - d) / PROX_M : 0;
    var amp = felt ? 0.16 : 0.08;
    bassGain.gain.setTargetAtTime(near * amp, ctx ? ctx.currentTime : 0, 0.08);
  }

  function setFelt(on) {
    felt = !!on;
    setProximity(felt ? 0.38 : 1.6);
    if (bass && ctx) {
      try { bass.frequency.setTargetAtTime(felt ? 36 : 42, ctx.currentTime, 0.12); } catch (e) {}
    }
  }

  function pulse(az, dist, ms) {
    if (!ready) return;
    lastAz = az;
    setProximity(dist == null ? lastDist : dist);
    var node = nearest(az);
    if (!node) return;
    var now = ctx.currentTime;
    var dur = Math.max(0.08, (ms || 420) / 1000);
    var peak = felt ? 0.28 : 0.22;
    node.gain.gain.cancelScheduledValues(now);
    node.gain.gain.setValueAtTime(0.0001, now);
    node.gain.gain.exponentialRampToValueAtTime(peak, now + 0.03);
    node.gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  }

  function tone(az, freq, ms) {
    if (!ready || !ctx) return;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq || 196;
    g.gain.value = 0.0001;
    osc.connect(g);
    var node = nearest(az == null ? lastAz : az);
    if (node) g.connect(node.gain);
    else g.connect(dry);
    var now = ctx.currentTime;
    var dur = Math.max(0.12, (ms || 280) / 1000);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function speakField(text) {
    var n = Math.min(64, Math.max(8, String(text || "").length / 6));
    for (var i = 0; i < n; i++) {
      (function (k) {
        setTimeout(function () {
          pulse((k * 17.2 + lastAz) % 360, lastDist, 160);
        }, k * 70);
      })(i);
    }
  }

  function roar(text) {
    setFelt(true);
    var words = String(text || "").split(/\s+/).filter(Boolean);
    var n = Math.min(48, Math.max(4, words.length));
    for (var i = 0; i < n; i++) {
      (function (k) {
        setTimeout(function () {
          pulse((k * 23 + lastAz) % 360, 0.38, 130 + Math.min(80, (words[k] || "").length * 8));
        }, k * 88);
      })(i);
    }
  }

  function unlock() {
    return ensure();
  }

  function stop() {
    if (!ready) return;
    felt = false;
    try {
      ring.forEach(function (n) { n.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05); });
      if (bassGain) bassGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    } catch (e) {}
  }

  function cleanup() {
    stop();
    try { if (ctx && ctx.state !== "closed") ctx.suspend(); } catch (e) {}
  }

  w.DSAP = {
    version: VERSION,
    speakers: SPEAKERS,
    alpha: ALPHA,
    residual_floor: R_EFF,
    law: lawFloor,
    unlock: unlock,
    pulse: pulse,
    tone: tone,
    speakField: speakField,
    roar: roar,
    setFelt: setFelt,
    setProximity: setProximity,
    stop: stop,
    cleanup: cleanup,
    state: function () {
      return {
        ready: ready,
        ctx: ctx ? ctx.state : "none",
        az: lastAz,
        dist: lastDist,
        felt: felt,
        speakers: SPEAKERS
      };
    }
  };
})(window);
