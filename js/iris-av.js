/**
 * IrisAV — speak / listen / camera.
 * Camera is video only. Mic is SpeechRecognition so the two don't fight.
 * Listen always settles. no-speech is not a crash.
 */
(function (w) {
  var VERSION = "iris-av-2026-09-23-keep";
  var speaking = false;
  var listening = false;
  var rec = null;
  var camStream = null;
  var facing = "user";
  var lastText = "";
  var listenTimer = 0;

  function voicesReady() {
    return new Promise(function (resolve) {
      if (!w.speechSynthesis) return resolve(false);
      if ((speechSynthesis.getVoices() || []).length) return resolve(true);
      var done = false;
      function ok() { if (!done) { done = true; resolve(true); } }
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
          if ((acc + bits[j]).length > 240 && acc) { out.push(acc); acc = bits[j]; }
          else acc = acc ? acc + ", " + bits[j] : bits[j];
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
        else { u.rate = 0.96; u.pitch = 1.02; }
        var done = false;
        function fin(v) { if (!done) { done = true; resolve(!!v); } }
        u.onend = function () { fin(true); };
        u.onerror = function () { fin(false); };
        setTimeout(function () { fin(true); }, Math.min(12000, 800 + line.length * 80));
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
    try { if (w.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
    return next();
  }

  function stopTalk() {
    speaking = false;
    try { if (w.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
    if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(false);
  }

  function listen() {
    var SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return Promise.resolve(null);
    stopListen();
    return new Promise(function (resolve) {
      var settled = false;
      function fin(v) {
        if (settled) return;
        settled = true;
        if (listenTimer) { clearTimeout(listenTimer); listenTimer = 0; }
        stopListen();
        resolve(v || null);
      }
      rec = new SR();
      rec.lang = (w.IrisVoice && IrisVoice.locale && IrisVoice.locale()) || (navigator.language || "en-US");
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      rec.onresult = function (ev) {
        var said = ev.results && ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript;
        fin(said || null);
      };
      rec.onerror = function (ev) {
        var err = ev && ev.error;
        if (err === "no-speech" || err === "aborted") return fin(null);
        fin(null);
      };
      rec.onend = function () { fin(null); };
      listening = true;
      if (w.IrisSphere && IrisSphere.setListening) IrisSphere.setListening(true);
      listenTimer = setTimeout(function () { fin(null); }, 8000);
      try { rec.start(); } catch (e) { fin(null); }
    });
  }

  function stopListen() {
    listening = false;
    if (listenTimer) { clearTimeout(listenTimer); listenTimer = 0; }
    if (w.IrisSphere && IrisSphere.setListening) IrisSphere.setListening(false);
    try { if (rec) rec.stop(); } catch (e) {}
    rec = null;
  }

  function stopCam() {
    if (camStream && camStream.getTracks) camStream.getTracks().forEach(function (t) { t.stop(); });
    camStream = null;
    var el = document.getElementById("you");
    if (el) { el.srcObject = null; el.style.display = "none"; }
  }

  function camera(on, opts) {
    opts = opts || {};
    var el = opts.video || document.getElementById("you");
    if (opts.facing === "environment" || opts.facing === "user") facing = opts.facing;
    if (!on) {
      stopCam();
      return Promise.resolve({ live: false, facing: facing });
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error("NO_CAM"));
    }
    stopCam();
    var constraints = {
      video: { facingMode: { ideal: facing } },
      audio: false
    };
    return navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      camStream = stream;
      if (el) {
        el.srcObject = stream;
        el.style.display = "block";
        el.style.transform = facing === "user" ? "scaleX(-1)" : "none";
      }
      return { live: true, facing: facing };
    }).catch(function () {
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function (stream) {
        camStream = stream;
        if (el) {
          el.srcObject = stream;
          el.style.display = "block";
        }
        return { live: true, facing: facing, fallback: true };
      });
    });
  }

  function flip() {
    facing = facing === "user" ? "environment" : "user";
    if (!camStream) return Promise.resolve({ live: false, facing: facing });
    return camera(true, { facing: facing });
  }

  function arm() {
    try { if (w.DSAP && DSAP.unlock) DSAP.unlock(); } catch (e) {}
    return voicesReady();
  }

  w.IrisAV = {
    version: VERSION,
    speak: speak,
    listen: listen,
    stop: function () { stopTalk(); stopListen(); },
    camera: camera,
    flip: flip,
    facing: function () { return facing; },
    mic: function (on) { return on ? listen() : (stopListen(), Promise.resolve({ live: false })); },
    arm: arm,
    last: function () { return lastText; },
    state: function () {
      return {
        speaking: speaking,
        listening: listening,
        cam: !!camStream,
        facing: facing,
        rec: listening,
        hasSpeech: !!w.speechSynthesis,
        hasListen: !!(w.SpeechRecognition || w.webkitSpeechRecognition),
        version: VERSION
      };
    }
  };
})(window);
