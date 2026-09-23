/** Greet WAV on top of TTS. Replies stay speechSynthesis. */
(function (w) {
  var FILES = ["audio/iris-greet.wav", "audio/iris-greet.mp3"];
  var el = null;
  var chimeEl = null;

  function jewel(text) {
    try {
      if (w.DSAP && DSAP.unlock) DSAP.unlock();
      if (w.DSAP && DSAP.speakField && text) DSAP.speakField(String(text).slice(0, 180));
    } catch (e) {}
  }

  function attach(audio) {
    if (!(w.DSAP && DSAP.attach)) return Promise.resolve(false);
    try {
      var hooked = DSAP.attach(audio);
      return hooked && hooked.then ? hooked.catch(function () { return false; }) : Promise.resolve(!!hooked);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  function mark(on) {
    if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(!!on);
  }

  function playChime() {
    try {
      var sr = 22050, n = Math.floor(sr * 0.38);
      var buf = new ArrayBuffer(44 + n * 2);
      var v = new DataView(buf);
      function str(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
      str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVE");
      str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
      v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
      v.setUint16(32, 2, true); v.setUint16(34, 16, true);
      str(36, "data"); v.setUint32(40, n * 2, true);
      for (var i = 0; i < n; i++) {
        var t = i / sr, env = Math.exp(-t * 8);
        var s = 0.18 * env * (Math.sin(2 * Math.PI * 523.25 * t) + 0.4 * Math.sin(2 * Math.PI * 784 * t));
        v.setInt16(44 + i * 2, Math.max(-32767, Math.min(32767, s * 32767)), true);
      }
      var url = URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
      if (chimeEl) { try { chimeEl.pause(); } catch (e0) {} }
      chimeEl = new Audio(url);
      chimeEl.volume = 0.28;
      chimeEl.play().catch(function () {});
      chimeEl.onended = function () { try { URL.revokeObjectURL(url); } catch (e1) {} };
      return true;
    } catch (e) {
      return false;
    }
  }

  function playSrc(src) {
    return new Promise(function (resolve) {
      try {
        if (el) { try { el.pause(); } catch (e) {} }
        el = new Audio(src);
        el.preload = "auto";
        var done = false;
        function fin(v) { if (!done) { done = true; resolve(!!v); } }
        el.onended = function () { fin(true); };
        el.onerror = function () { fin(false); };
        setTimeout(function () { if (!done) fin(el && el.currentTime > 0.2); }, 14000);
        attach(el).then(function () {
          var p = el.play();
          if (p && p.catch) p.catch(function () { fin(false); });
        });
      } catch (e) {
        resolve(false);
      }
    });
  }

  function sources() {
    var list = FILES.slice();
    try {
      if (w.IrisGreet && IrisGreet.src) {
        var s = typeof IrisGreet.src === "function" ? IrisGreet.src() : IrisGreet.src;
        if (s) list.push(s);
      }
    } catch (e) {}
    return list;
  }

  function greetWav() {
    mark(true);
    jewel((w.IrisGreet && IrisGreet.text) || "");
    playChime();
    var list = sources();
    var i = 0;
    function next() {
      if (i >= list.length) return Promise.resolve(false);
      return playSrc(list[i++]).then(function (ok) { return ok ? true : next(); });
    }
    return next().then(function (ok) {
      mark(false);
      return ok;
    });
  }

  function stop() {
    if (el) { try { el.pause(); el.currentTime = 0; } catch (e) {} }
    if (chimeEl) { try { chimeEl.pause(); } catch (e) {} }
    mark(false);
  }

  function hook() {
    if (!w.IrisAV || IrisAV.__wavHook) return;
    IrisAV.__wavHook = true;
    IrisAV.greetWav = greetWav;
    IrisAV.stopWav = stop;
    var inner = IrisAV.speak;
    IrisAV.speakGreet = function (line) {
      return greetWav().then(function (ok) {
        if (ok) return true;
        if (typeof inner === "function") return inner.call(IrisAV, line);
        return false;
      });
    };
    IrisAV.greet = function (line) {
      var t = line || (w.IrisGreet && IrisGreet.text) || "Hey. I'm Iris.";
      return IrisAV.speakGreet(t);
    };
  }

  w.IrisWav = { greet: greetWav, stop: stop, src: FILES, hook: hook };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
})(window);
