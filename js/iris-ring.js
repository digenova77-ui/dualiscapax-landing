/**
 * Iris ring — greet → listen → think → speak → listen.
 * A missed hear is not sleep. Mute is the only off switch.
 */
(function (w) {
  var VERSION = "iris-ring-2026-09-23-awake";
  var MUTE = "dc-iris-mute";
  var running = false;
  var muted = false;
  var greeted = false;
  var hint;
  var watch = 0;
  var turns = 0;

  try { muted = localStorage.getItem(MUTE) === "1"; } catch (e) {}

  function roomLine() {
    if (w.IRIS_ROOM && IRIS_ROOM.iris) return IRIS_ROOM.iris;
    return "Hey. I'm Iris. Ask anything small. Heavy work I'll price first.";
  }

  function think(said) {
    var t = String(said || "").toLowerCase();
    if (!t) return "I didn't catch that. Say it again.";
    if (/\b(hall|rooms|map)\b/.test(t)) return "The hall is the map of the other rooms. Look is free. Functions wait on a Unity sitting.";
    if (/\b(lab|camera|see me)\b/.test(t)) return "The lab is the same conversation. Camera only if you tap it. I don't watch the rest of your phone.";
    if (/\b(cost|price|pay|fuel|money)\b/.test(t)) return "Asking is free. A fuel pack is prepaid compute. Look stays zero.";
    if (/\b(ice|hockey|rink)\b/.test(t)) return "Ice is a room in the hall. If the door fails to open, it isn't open.";
    if (/\b(coin|efuse|token)\b/.test(t)) return "eFuse is the protocol in the repo. This site points at it. Not a checkout button.";
    if (/\b(who are you|your name|iris)\b/.test(t)) return "I'm Iris. I live on this site. Coffee-shop talk. I know these rooms.";
    if (/\b(david|founder|ceo)\b/.test(t)) return "David Di Genova founded DualisCapax. Canadian. I don't hand out a home address.";
    if (/\b(hello|hi|hey)\b/.test(t)) return "Hey. I'm here. Hall, lab, or what it costs?";
    if (w.DCLMLook && DCLMLook.run) {
      try {
        var rec = DCLMLook.run(said);
        if (rec && (rec.spoken || rec.text)) return rec.spoken || rec.text;
      } catch (e) {}
    }
    return "This page is the front door. Hall is the map. Lab is the camera if you want it. What do you want to open?";
  }

  function paint(msg) {
    hint = hint || document.getElementById("hint");
    if (hint && msg) hint.textContent = msg;
  }

  function isMuted() {
    try { muted = localStorage.getItem(MUTE) === "1"; } catch (e) {}
    return muted;
  }

  function speak(line) {
    paint(line);
    if (isMuted()) return Promise.resolve(false);
    var first = !greeted && w.IrisAV && IrisAV.speakGreet;
    var fn = first ? IrisAV.speakGreet : (w.IrisAV && IrisAV.speak);
    if (fn) return fn.call(IrisAV, line).catch(function () { return false; });
    if (w.speechSynthesis) {
      var u = new SpeechSynthesisUtterance(line);
      if (w.IrisVoice && IrisVoice.applyUtterance) IrisVoice.applyUtterance(u);
      try { speechSynthesis.cancel(); } catch (e) {}
      speechSynthesis.speak(u);
    }
    return Promise.resolve(true);
  }

  function listenTurn() {
    if (isMuted() || !running) return Promise.resolve();
    paint("Listening.");
    if (!w.IrisAV || !IrisAV.listen) {
      paint("This browser has no listen. Tap Talk and I'll still speak.");
      return Promise.resolve();
    }
    return IrisAV.listen().then(function (said) {
      if (!running || isMuted()) return;
      turns += 1;
      if (!said) {
        paint("Still here. Say it again.");
        return listenTurn();
      }
      paint(said);
      return speak(think(said)).then(function () {
        if (running && !isMuted()) return listenTurn();
      });
    }).catch(function () {
      if (running && !isMuted()) return listenTurn();
    });
  }

  function watchdog() {
    if (watch) clearInterval(watch);
    watch = setInterval(function () {
      if (!running || isMuted()) return;
      var st = w.IrisAV && IrisAV.state ? IrisAV.state() : {};
      if (st.speaking || st.listening) return;
      listenTurn();
    }, 4000);
  }

  function kick() {
    running = true;
    try {
      if (w.IrisAV && IrisAV.arm) IrisAV.arm();
      if (w.DSAP && DSAP.unlock) DSAP.unlock();
    } catch (e) {}
    var line = greeted ? "I'm listening." : roomLine();
    paint(line);
    watchdog();
    return speak(line).then(function () {
      greeted = true;
      if (running && !isMuted()) return listenTurn();
    });
  }

  function stop() {
    running = false;
    if (watch) { clearInterval(watch); watch = 0; }
    if (w.IrisAV && IrisAV.stop) IrisAV.stop();
    paint(isMuted() ? "Voice off." : "Ring paused.");
  }

  function bind() {
    hint = document.getElementById("hint");
    function tap(el, fn) {
      if (!el || el.dataset.irisRing) return;
      el.dataset.irisRing = "1";
      el.addEventListener("click", function (e) {
        e.stopImmediatePropagation();
        fn();
      }, true);
    }
    tap(document.getElementById("talk"), kick);
    tap(document.getElementById("meet"), kick);
    var plate = document.getElementById("iris-plate");
    if (plate && !plate.dataset.irisRing) {
      plate.dataset.irisRing = "1";
      plate.addEventListener("pointerdown", function (e) {
        e.stopImmediatePropagation();
        kick();
      }, true);
    }
    var voice = document.getElementById("voice");
    if (voice && !voice.dataset.irisRingWatch) {
      voice.dataset.irisRingWatch = "1";
      voice.addEventListener("click", function () {
        setTimeout(function () {
          if (isMuted()) stop();
          else if (!running) kick();
        }, 0);
      });
    }
    var skip = document.getElementById("skip");
    if (skip) skip.addEventListener("click", stop);
    w.addEventListener("pageshow", function () {
      if (running && !isMuted()) listenTurn();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && running && !isMuted()) listenTurn();
    });
  }

  w.IrisRing = {
    version: VERSION,
    kick: kick,
    stop: stop,
    think: think,
    running: function () { return running; },
    turns: function () { return turns; }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})(window);
