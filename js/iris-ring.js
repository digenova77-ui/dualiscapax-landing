/**
 * Iris ring — greet → listen → think → speak → listen.
 * Mute is the only legal sleep. Empty listen is not sleep.
 */
(function (w) {
  var VERSION = "iris-ring-2026-09-23-desk";
  var MUTE = "dc-iris-mute";
  var running = false;
  var muted = false;
  var greeted = false;
  var hint;
  var misses = 0;
  var watch = 0;
  var turning = false;

  try { muted = localStorage.getItem(MUTE) === "1"; } catch (e) {}

  function roomLine() {
    if (w.IRIS_ROOM && IRIS_ROOM.iris) return IRIS_ROOM.iris;
    return "Hey. DualisCapax is a media desk. I point at the rooms and the protocol. No phone. Mail is automation.";
  }

  function think(said) {
    var t = String(said || "").toLowerCase();
    if (!t) return "I didn't catch that. Say it again.";
    if (/\b(phone|call|telephone|fax)\b/.test(t)) return "There isn't a phone. DualisCapax is a media desk. Talk here, or mail hits automation.";
    if (/\b(email|e-mail|inbox|contact)\b/.test(t)) return "Mail is handled by automation. Nobody sitting on a switchboard. If you write, a clerk reads it. There is no phone.";
    if (/\b(media company|what is dualis|who owns|company)\b/.test(t)) return "DualisCapax is a media company. We explain the Unity framework and point at the repo. We are not a bank and we are not the coin.";
    if (/\b(own the coin|own efuse|your coin|company.?s coin)\b/.test(t)) return "This company does not own the coin. eFuse is the protocol in the repo. The site points. It is not a treasury desk.";
    if (/\b(hall|rooms|map)\b/.test(t)) return "The hall is the map of the other rooms. Look is free. Functions wait on a Unity sitting.";
    if (/\b(lab|camera|see me)\b/.test(t)) return "The lab is the same conversation. Camera only if you tap it. I don't watch the rest of your phone.";
    if (/\b(cost|price|pay|fuel|money)\b/.test(t)) return "Asking is free. A fuel pack is prepaid compute. Look stays zero.";
    if (/\b(ice|hockey|rink)\b/.test(t)) return "Ice is a room in the hall. If the door fails to open, it isn't open.";
    if (/\b(coin|efuse|token)\b/.test(t)) return "eFuse is the protocol in the repo. This media site points at it. DualisCapax does not own it.";
    if (/\b(who are you|your name|iris)\b/.test(t)) return "I'm Iris. I live on this media desk. Coffee-shop talk. I know these rooms.";
    if (/\b(david|founder|ceo)\b/.test(t)) return "David Di Genova founded DualisCapax. Canadian. Media desk. I don't hand out a home address.";
    if (/\b(hello|hi|hey)\b/.test(t)) return "Hey. Media desk. No phone. What do you want to look at — hall, reading, or the protocol?";
    if (w.DCLMLook && DCLMLook.run) {
      try {
        var rec = DCLMLook.run(said);
        if (rec && (rec.spoken || rec.text)) return rec.spoken || rec.text;
      } catch (e) {}
    }
    return "This page is a media front door. Hall is the map. Reading is papers. The coin is not ours to sell. What do you want to open?";
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
    if (w.IrisAV && IrisAV.speak) return IrisAV.speak(line);
    if (w.speechSynthesis) {
      var u = new SpeechSynthesisUtterance(line);
      if (w.IrisVoice && IrisVoice.applyUtterance) IrisVoice.applyUtterance(u);
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
    return Promise.resolve(true);
  }

  function listenTurn() {
    if (isMuted() || !running) return Promise.resolve();
    if (turning) return Promise.resolve();
    turning = true;
    paint("Listening.");
    if (!w.IrisAV || !IrisAV.listen) {
      turning = false;
      paint("This browser has no listen. Tap Talk and I'll still speak.");
      return Promise.resolve();
    }
    return IrisAV.listen().then(function (said) {
      turning = false;
      if (!running || isMuted()) return;
      if (!said) {
        misses += 1;
        paint(misses > 2 ? "Still here. Say it when you're ready." : "Listening.");
        return listenTurn();
      }
      misses = 0;
      paint(said);
      return speak(think(said)).then(function () {
        if (running && !isMuted()) return listenTurn();
      });
    }).catch(function () {
      turning = false;
      if (running && !isMuted()) return listenTurn();
    });
  }

  function pulse() {
    if (!running || isMuted()) return;
    var st = w.IrisAV && IrisAV.state ? IrisAV.state() : {};
    if (st.speaking || st.listening || turning) return;
    listenTurn();
  }

  function armWatch() {
    if (watch) return;
    watch = setInterval(pulse, 4000);
  }

  function dropWatch() {
    if (watch) { clearInterval(watch); watch = 0; }
  }

  function kick() {
    running = true;
    turning = false;
    try {
      if (w.IrisAV && IrisAV.arm) IrisAV.arm();
      if (w.DSAP && DSAP.unlock) DSAP.unlock();
    } catch (e) {}
    armWatch();
    var line = greeted ? "I'm listening." : roomLine();
    greeted = true;
    paint(line);
    return speak(line).then(function () {
      if (running && !isMuted()) return listenTurn();
    });
  }

  function stop() {
    running = false;
    turning = false;
    dropWatch();
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
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && running && !isMuted()) pulse();
    });
    w.addEventListener("pageshow", function () {
      if (running && !isMuted()) pulse();
    });
  }

  w.IrisRing = {
    version: VERSION,
    kick: kick,
    stop: stop,
    think: think,
    running: function () { return running; }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})(window);
