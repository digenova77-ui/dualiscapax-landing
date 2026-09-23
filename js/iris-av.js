/**
 * IrisAV — speak path for the street.
 * Foundation: Web Speech + IrisVoice picker. DSAP is spatial jewelry, not words.
 * Do not claim this is a custom codec or xAI TTS unless a key is present.
 */
(function (w) {
  var VERSION = "iris-av-2026-09-23-speak";
  var speaking = false;
  var listening = false;
  var rec = null;
  var camStream = null;
  var lastText = "";

  function voicesReady() {
    return new Promise(function (resolve) {
      if (!w.speechSynthesis) return resolve(false);
      var list = speechSynthesis.getVoices() || [];
      if (list.length) return resolve(true);
      var done = false;
      function ok() {
        if (done) return;
        done = true;
        resolve(true);
      }
      if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", ok, { once: true });
      else speechSynthesis.onvoiceschanged = ok;
      setTimeout(ok, 700);
    });
  }

  function chunks(text) {
    var raw = String(text || "").replace(/\s+/g, " ").trim();
    if (!raw) return [];
    var parts = raw.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [raw];
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (p.length > 280) {
        var bits = p.split(/,\s+/);
        var acc = "";
        for (var j = 0; j < bits.length; j++) {
          if ((acc + bits[j]).length > 240 && acc) {
            out.push(acc);
            acc = bits[j];
          } else acc = acc ? acc + ", " + bits[j] : bits[j];
        }
        if (acc) out.push(acc);
      } else if (p) out.push(p);
    }
    return out;
  }

  function jewel(line) {
    try {
      if (w.DSAP && DSAP.unlock) DSAP.unlock();
      if (w.DSAP && DSAP.speakField) DSAP.speakField(line);
    } catch (e) {}
  }

  function speakOne(line) {
    return voicesReady().then(function () {
      return new Promise(function (resolve) {
        if (!w.speechSynthesis) return resolve(false);
        var u = new SpeechSynthesisUtterance(line);
        if (w.IrisVoice && IrisVoice.applyUtterance) IrisVoice.applyUtterance(u);
        else {
          u.rate = 0.96;
          u.pitch = 1.02;
        }
        u.onend = function () { resolve(true); };
        u.onerror = function () { resolve(false); };
        speechSynthesis.speak(u);
      });
    });
  }

  function speak(text) {
    var line = String(text || "").trim();
    lastText = line;
    if (!line) return Promise.resolve(false);
    stopTalk();
    speaking = true;
    if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(true);
    jewel(line);
    var parts = chunks(line);
    var i = 0;
    function next() {
      if (!speaking || i >= parts.length) {
        speaking = false;
        if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(false);
        return Promise.resolve(true);
      }
      return speakOne(parts[i++]).then(next);
    }
    try {
      if (w.speechSynthesis) speechSynthesis.cancel();
    } catch (e) {}
    return next();
  }

  function stopTalk() {
    speaking = false;
    try {
      if (w.speechSynthesis) speechSynthesis.cancel();
    } catch (e) {}
    if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(false);
  }

  function listen() {
    var SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return Promise.resolve(null);
    stopListen();
    return new Promise(function (resolve) {
      rec = new SR();
      rec.lang = (w.IrisVoice && IrisVoice.locale && IrisVoice.locale()) || (navigator.language || "en-US");
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = function (ev) {
        var said = ev.results && ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript;
        stopListen();
        resolve(said || null);
      };
      rec.onerror = function () {
        stopListen();
        resolve(null);
      };
      rec.onend = function () {
        if (listening) {
          listening = false;
          resolve(null);
        }
      };
      listening = true;
      if (w.IrisSphere && IrisSphere.setListening) IrisSphere.setListening(true);
      try { rec.start(); } catch (e) { stopListen(); resolve(null); }
    });
  }

  function stopListen() {
    listening = false;
    if (w.IrisSphere && IrisSphere.setListening) IrisSphere.setListening(false);
    try { if (rec) rec.stop(); } catch (e) {}
    rec = null;
  }

  function camera(on, video) {
    var el = video || document.getElementById("you");
    if (!on) {
      if (camStream && camStream.getTracks) camStream.getTracks().forEach(function (t) { t.stop(); });
      camStream = null;
      if (el) { el.srcObject = null; el.style.display = "none"; }
      return Promise.resolve({ live: false });
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error("NO_CAM"));
    }
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then(function (stream) {
      camStream = stream;
      if (el) {
        el.srcObject = stream;
        el.style.display = "block";
      }
      return { live: true };
    });
  }

  function arm() {
    try {
      if (w.DSAP && DSAP.unlock) DSAP.unlock();
    } catch (e) {}
    return voicesReady();
  }

  w.IrisAV = {
    version: VERSION,
    speak: speak,
    listen: listen,
    stop: function () { stopTalk(); stopListen(); },
    camera: camera,
    mic: function (on) { return on ? listen() : (stopListen(), Promise.resolve({ live: false })); },
    arm: arm,
    last: function () { return lastText; },
    state: function () {
      return {
        speaking: speaking,
        listening: listening,
        cam: !!camStream,
        rec: listening,
        hasSpeech: !!w.speechSynthesis,
        hasListen: !!(w.SpeechRecognition || w.webkitSpeechRecognition),
        voice: w.IrisVoice && IrisVoice.pickDevice ? (IrisVoice.pickDevice() && IrisVoice.pickDevice().name) : null,
        version: VERSION
      };
    }
  };
})(window);
