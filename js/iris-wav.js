/** Greet WAV on top of TTS. Replies stay speechSynthesis. */
(function (w) {
  var SRC = ["audio/iris-greet.wav", "audio/iris-greet.mp3"];
  var el = null;

  function playOne(src) {
    return new Promise(function (resolve) {
      try {
        if (el) { try { el.pause(); } catch (e) {} }
        el = new Audio(src);
        el.preload = "auto";
        var done = false;
        function fin(v) { if (!done) { done = true; resolve(v); } }
        el.onended = function () { fin(true); };
        el.onerror = function () { fin(false); };
        setTimeout(function () { if (!done) fin(false); }, 9000);
        var p = el.play();
        if (p && p.catch) p.catch(function () { fin(false); });
      } catch (e) {
        resolve(false);
      }
    });
  }

  function greetWav() {
    var i = 0;
    function next() {
      if (i >= SRC.length) return Promise.resolve(false);
      return playOne(SRC[i++]).then(function (ok) { return ok ? true : next(); });
    }
    if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(true);
    try { if (w.DSAP && DSAP.unlock) DSAP.unlock(); } catch (e) {}
    return next().then(function (ok) {
      if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(false);
      return ok;
    });
  }

  function stop() {
    if (el) { try { el.pause(); el.currentTime = 0; } catch (e) {} }
  }

  function hook() {
    if (!w.IrisAV) return;
    IrisAV.greetWav = greetWav;
    IrisAV.stopWav = stop;
    var inner = IrisAV.speak;
    if (IrisAV.__wavHook) return;
    IrisAV.__wavHook = true;
    IrisAV.speakGreet = function (line) {
      return greetWav().then(function (ok) {
        if (ok) return true;
        return inner.call(IrisAV, line);
      });
    };
  }

  w.IrisWav = { greet: greetWav, stop: stop, src: SRC, hook: hook };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
})(window);
