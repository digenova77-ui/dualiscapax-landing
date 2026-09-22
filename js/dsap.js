/** DSAP-1.2 sleeve. Must not erase dsap-engine.js (1.0-felt). */
(function (w) {
  if (w.DSAP && w.DSAP.speakField) {
    if (!w.DSAP.wave && w.DSAP.unlock) {
      w.DSAP.unlock().then(function () {}).catch(function () {});
    }
    return;
  }
  if (w.DSAP && w.DSAP.version === "DSAP-1.2") return;
  var ctx, ring = [], woken = false, ears = [], master, analyser, bins;
  function ac() {
    if (!ctx) ctx = new (w.AudioContext || w.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function wake() {
    var c = ac();
    if (woken && ring.length) return c;
    master = c.createGain(); master.gain.value = 1; master.connect(c.destination);
    analyser = c.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.6;
    master.connect(analyser); bins = new Uint8Array(analyser.frequencyBinCount);
    ring = [];
    for (var i = 0; i < 64; i++) {
      var p = c.createPanner(); p.panningModel = "HRTF"; p.distanceModel = "inverse"; p.refDistance = 1;
      var a = (i / 64) * Math.PI * 2; p.setPosition(Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2);
      p.connect(master); ring.push(p);
    }
    woken = true; return c;
  }
  function wave() { if (!analyser) return null; analyser.getByteTimeDomainData(bins); return bins; }
  function place(kind, index) {
    var c = wake(); var i = ((index % 64) + 64) % 64; var t = c.currentTime;
    var o = c.createOscillator(); var g = c.createGain();
    if (kind === "whistle") {
      o.type = "sine"; o.frequency.setValueAtTime(2100, t); o.frequency.linearRampToValueAtTime(2350, t + 0.16);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.stop(t + 0.32);
    } else {
      o.type = "triangle"; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.1);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.stop(t + 0.15);
    }
    o.connect(g); g.connect(ring[i]); o.start(t);
    for (var n = 0; n < ears.length; n++) { try { ears[n](kind, i); } catch (e) {} }
  }
  function sleep() { if (ctx && ctx.state === "running") ctx.suspend(); }
  document.addEventListener("visibilitychange", function () { if (document.hidden) sleep(); });
  w.DSAP = { wake: wake, unlock: wake, place: place, sleep: sleep, listen: function (fn) { if (typeof fn === "function") ears.push(fn); }, wave: wave, version: "DSAP-1.2" };
})(window);
