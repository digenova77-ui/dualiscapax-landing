/**
 * Optional rink sounds. Mute on. Never autoplay.
 * Synthesized only — no NHL horns, no scraped broadcast.
 */
(function () {
  if (window.DCIceSound) return;
  var ctx;
  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function env(g, t, a, h, r) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(a, t + h);
    g.gain.exponentialRampToValueAtTime(0.0001, t + h + r);
  }
  function whistle() {
    var c = ac(), t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(2100, t);
    o.frequency.linearRampToValueAtTime(2400, t + 0.18);
    env(g, t, 0.08, 0.02, 0.28);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.32);
  }
  function puck() {
    var c = ac(), t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.09);
    env(g, t, 0.12, 0.008, 0.12);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.14);
  }
  function skate() {
    var c = ac(), t = c.currentTime, b = c.createBuffer(1, c.sampleRate * 0.22, c.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    var src = c.createBufferSource(); src.buffer = b;
    var f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 900;
    var g = c.createGain(); env(g, t, 0.05, 0.01, 0.2);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(t);
  }
  window.DCIceSound = { whistle: whistle, puck: puck, skate: skate };
})();
