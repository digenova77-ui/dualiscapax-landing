/**
 * DSAP-1.0 sleeve. Storyboard was av/storyboard.html.
 * 64-point ring. Tap wakes. Hide suspends. No NHL horn. No filmed avatar.
 */
(function (w) {
  if (w.DSAP) return;
  var ctx, ring = [], woken = false;
  function ac() {
    if (!ctx) ctx = new (w.AudioContext || w.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function wake() {
    var c = ac();
    if (woken && ring.length) return c;
    ring = [];
    for (var i = 0; i < 64; i++) {
      var p = c.createPanner();
      p.panningModel = "HRTF";
      p.distanceModel = "inverse";
      p.refDistance = 1;
      var a = (i / 64) * Math.PI * 2;
      p.setPosition(Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2);
      p.connect(c.destination);
      ring.push(p);
    }
    woken = true;
    return c;
  }
  function place(kind, index) {
    var c = wake();
    var i = ((index % 64) + 64) % 64;
    var t = c.currentTime;
    var o = c.createOscillator();
    var g = c.createGain();
    if (kind === "whistle") {
      o.type = "sine";
      o.frequency.setValueAtTime(2100, t);
      o.frequency.linearRampToValueAtTime(2350, t + 0.16);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.stop(t + 0.32);
    } else {
      o.type = "triangle";
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(60, t + 0.1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.stop(t + 0.15);
    }
    o.connect(g); g.connect(ring[i]);
    o.start(t);
  }
  function sleep() {
    if (ctx && ctx.state === "running") ctx.suspend();
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) sleep();
  });
  w.DSAP = { wake: wake, place: place, sleep: sleep, version: "DSAP-1.0" };
})(window);
