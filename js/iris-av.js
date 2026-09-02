/**
 * Iris AV V2 sleeve — camera, mic, screen, DSAP unlock.
 * Jacket only. Does not replace IrisLive / DCLMLook.
 * Dry words: speechSynthesis only. Felt layer is the house's job, once.
 * Not a cloned voice. Not a codec.
 */
(function (w) {
  var VERSION = "iris-av-v2-2026-09-01-dry";
  var state = {
    cam: null,
    mic: null,
    screen: null,
    rec: null,
    speaking: false,
    spatial: false,
    voice: null
  };

  function err(msg) {
    var el = document.getElementById("err");
    if (!el) return;
    if (!msg) { el.hidden = true; el.textContent = ""; return; }
    el.hidden = false;
    el.textContent = msg;
  }

  function pickVoice() {
    if (!w.speechSynthesis) return null;
    var list = w.speechSynthesis.getVoices() || [];
    if (!list.length) return null;
    var want = list.filter(function (v) {
      var n = (v.name || "").toLowerCase();
      var lang = (v.lang || "").toLowerCase();
      return /en/.test(lang) && /(natural|premium|samantha|daniel|karen|moira|google uk|google us|microsoft aria|neural)/.test(n);
    });
    state.voice = want[0] || list.filter(function (v) { return /^en/.test(v.lang || ""); })[0] || list[0] || null;
    return state.voice;
  }

  function hearOn() {
    var hear = document.getElementById("hear");
    if (!hear) return true;
    return hear.classList.contains("on");
  }

  function speak(text, done) {
    if (!text) {
      if (done) done();
      return;
    }
    if (w.DSAP && DSAP.unlock) {
      DSAP.unlock().then(function () { state.spatial = true; }).catch(function () {});
    }
    if (!w.speechSynthesis) {
      if (done) done();
      return;
    }
    if (!hearOn()) {
      if (done) done();
      return;
    }
    var u = new SpeechSynthesisUtterance(String(text).slice(0, 900));
    var voice = state.voice || pickVoice();
    if (voice) u.voice = voice;
    u.lang = (voice && voice.lang) || "en-CA";
    u.rate = 0.98;
    u.pitch = 0.96;
    u.volume = 1;
    state.speaking = true;
    u.onend = function () {
      state.speaking = false;
      if (done) done();
    };
    u.onerror = function () {
      state.speaking = false;
      if (done) done();
    };
    w.speechSynthesis.cancel();
    try { w.speechSynthesis.speak(u); } catch (e) {
      state.speaking = false;
      if (done) done();
    }
  }

  async function camera(on) {
    var stage = document.getElementById("stage");
    var vid = document.getElementById("you");
    if (!on) {
      if (state.cam) state.cam.getTracks().forEach(function (t) { t.stop(); });
      state.cam = null;
      if (stage && !state.screen) stage.classList.remove("on");
      if (vid && !state.screen) vid.srcObject = null;
      return { live: false, kind: "camera" };
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      err("Camera did not open on this device.");
      return { live: false, kind: "camera" };
    }
    var stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    state.cam = stream;
    if (vid) vid.srcObject = stream;
    if (stage) stage.classList.add("on");
    err("");
    return { live: true, kind: "camera" };
  }

  async function mic(on) {
    if (!on) {
      if (state.rec && state.rec.stop) try { state.rec.stop(); } catch (e) {}
      state.rec = null;
      if (state.mic) state.mic.getTracks().forEach(function (t) { t.stop(); });
      state.mic = null;
      return { live: false, kind: "mic" };
    }
    var SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SR) {
      var rec = new SR();
      rec.lang = "en-CA";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = function (e) {
        var said = e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript;
        var box = document.getElementById("input");
        if (said && box) {
          box.value = said;
          box.dispatchEvent(new Event("input"));
        }
      };
      rec.onerror = function () { err("Mic heard nothing. Type if you want."); };
      rec.onend = function () {
        var talk = document.getElementById("talk");
        if (talk) {
          talk.classList.remove("on");
          talk.setAttribute("aria-pressed", "false");
        }
      };
      state.rec = rec;
      rec.start();
      err("");
      return { live: true, kind: "mic-speech" };
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      err("Mic did not open on this device.");
      return { live: false, kind: "mic" };
    }
    state.mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    err("Mic is live. Speech-to-text is not on this browser — type the words.");
    return { live: true, kind: "mic-stream" };
  }

  async function screen(on) {
    var stage = document.getElementById("stage");
    var vid = document.getElementById("you");
    if (!on) {
      if (state.screen) state.screen.getTracks().forEach(function (t) { t.stop(); });
      state.screen = null;
      if (!state.cam && stage) stage.classList.remove("on");
      if (vid && !state.cam) vid.srcObject = null;
      return { live: false, kind: "screen" };
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      err("Screen share is not on this device.");
      return { live: false, kind: "screen" };
    }
    var stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 15 },
      audio: false
    });
    state.screen = stream;
    stream.getVideoTracks().forEach(function (t) {
      t.addEventListener("ended", function () {
        screen(false);
        var btn = document.getElementById("screen") || document.getElementById("field");
        if (btn) {
          btn.classList.remove("on");
          btn.setAttribute("aria-pressed", "false");
        }
      });
    });
    if (vid) vid.srcObject = stream;
    if (stage) stage.classList.add("on");
    err("");
    return { live: true, kind: "screen" };
  }

  function snapshot() {
    var vid = document.getElementById("you");
    if (!vid || !vid.srcObject) return null;
    var c = document.createElement("canvas");
    c.width = vid.videoWidth || 640;
    c.height = vid.videoHeight || 360;
    var ctx = c.getContext("2d");
    ctx.drawImage(vid, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.72);
  }

  function stopAll() {
    camera(false);
    mic(false);
    screen(false);
    if (w.speechSynthesis) w.speechSynthesis.cancel();
    if (w.DSAP && DSAP.cleanup) DSAP.cleanup();
    state.speaking = false;
  }

  function greet(line) {
    var text = line || "I'm Iris. Looking is free. A seat hash stays on this device.";
    speak(text);
    return text;
  }

  if (w.speechSynthesis) {
    pickVoice();
    if (w.speechSynthesis.addEventListener) {
      w.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    } else {
      w.speechSynthesis.onvoiceschanged = pickVoice;
    }
  }

  w.IrisAV = {
    version: VERSION,
    state: state,
    speak: speak,
    camera: camera,
    mic: mic,
    screen: screen,
    snapshot: snapshot,
    stopAll: stopAll,
    greet: greet,
    unlock: function () { return w.DSAP && DSAP.unlock ? DSAP.unlock() : Promise.resolve(null); }
  };

  w.addEventListener("pagehide", function () { stopAll(); });
  w.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      if (w.speechSynthesis) w.speechSynthesis.cancel();
      if (w.DSAP && DSAP.stop) DSAP.stop();
      state.speaking = false;
    }
  });
})(window);
