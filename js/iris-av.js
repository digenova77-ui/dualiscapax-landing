/**
 * Iris AV V2.1 sleeve — camera, mic, screen, DSAP spatial voice.
 * Jacket only. Does not replace IrisLive / DCLMLook.
 * Not a cloned voice. Not a codec. Not photoreal.
 */
(function (w) {
  var VERSION = "iris-av-v2.1-2026-09-01";
  var state = {
    cam: null,
    mic: null,
    screen: null,
    rec: null,
    speaking: false,
    spatial: false,
    voicesReady: false
  };

  function err(msg) {
    var el = document.getElementById("err");
    if (!el) return;
    if (!msg) { el.hidden = true; el.textContent = ""; return; }
    el.hidden = false;
    el.textContent = msg;
  }

  function emit(kind, extra) {
    state.speaking = kind === "start";
    try {
      w.dispatchEvent(new CustomEvent("irisav", { detail: { kind: kind, extra: extra || null } }));
    } catch (e) {}
  }

  function scoreVoice(v) {
    var n = (v.name || "").toLowerCase();
    var lang = (v.lang || "").toLowerCase();
    var s = 0;
    if (/^en/.test(lang)) s += 8;
    if (/en-ca/.test(lang)) s += 4;
    if (/en-us|en-gb/.test(lang)) s += 2;
    if (/neural|premium|natural|enhanced/.test(n)) s += 6;
    if (/samantha|daniel|aria|jenny|google uk|google us|siri/.test(n)) s += 3;
    if (v.localService) s += 1;
    if (/compact|eloquence|novelty/.test(n)) s -= 4;
    return s;
  }

  function studioVoice() {
    if (!w.speechSynthesis) return null;
    var list = w.speechSynthesis.getVoices() || [];
    if (!list.length) return null;
    var ranked = list.slice().sort(function (a, b) { return scoreVoice(b) - scoreVoice(a); });
    return ranked[0] && scoreVoice(ranked[0]) > 0 ? ranked[0] : list[0];
  }

  function warmVoices() {
    if (!w.speechSynthesis) return;
    var list = w.speechSynthesis.getVoices() || [];
    if (list.length) state.voicesReady = true;
  }

  function hearOn() {
    var hear = document.getElementById("hear");
    if (!hear) return false;
    return hear.classList.contains("on");
  }

  function speak(text) {
    if (!text) return;
    if (!hearOn()) return;
    var line = String(text).replace(/\s+/g, " ").trim().slice(0, 900);
    if (!line) return;

    if (w.DSAP && DSAP.unlock) {
      DSAP.unlock().then(function () {
        if (!hearOn()) return;
        state.spatial = true;
        if (DSAP.speakField) DSAP.speakField(line);
      }).catch(function () {});
    }
    if (!w.speechSynthesis) return;

    var u = new SpeechSynthesisUtterance(line);
    var voice = studioVoice();
    if (voice) u.voice = voice;
    u.lang = (voice && voice.lang) || "en-CA";
    u.rate = 0.98;
    u.pitch = 1;
    u.volume = 1;
    u.onstart = function () { emit("start", line); };
    u.onend = function () {
      emit("end");
      if (w.DSAP && DSAP.stop) DSAP.stop();
    };
    u.onerror = function () {
      emit("error");
      if (w.DSAP && DSAP.stop) DSAP.stop();
    };
    try { w.speechSynthesis.cancel(); } catch (e) {}
    w.speechSynthesis.speak(u);
    if (!state.voicesReady) {
      setTimeout(function () {
        if (state.speaking || !hearOn()) return;
        var again = studioVoice();
        if (again && again !== voice) {
          try { w.speechSynthesis.cancel(); } catch (e2) {}
          u.voice = again;
          w.speechSynthesis.speak(u);
        }
      }, 180);
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
      emit("listen-off");
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
        emit("listen-off");
      };
      state.rec = rec;
      rec.start();
      emit("listen-on");
      err("");
      return { live: true, kind: "mic-speech" };
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      err("Mic did not open on this device.");
      return { live: false, kind: "mic" };
    }
    state.mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    emit("listen-on");
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
    if (w.speechSynthesis) try { w.speechSynthesis.cancel(); } catch (e) {}
    if (w.DSAP && DSAP.cleanup) DSAP.cleanup();
    emit("end");
  }

  function greet(line) {
    var text = line || "I'm Iris. Looking is free. A seat hash stays on this device.";
    speak(text);
    return text;
  }

  if (w.speechSynthesis) {
    warmVoices();
    w.speechSynthesis.addEventListener("voiceschanged", warmVoices);
  }
  w.addEventListener("pagehide", function () { stopAll(); });
  w.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (w.speechSynthesis) try { w.speechSynthesis.cancel(); } catch (e) {}
      if (w.DSAP && DSAP.stop) DSAP.stop();
      emit("end");
    }
  });

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
})(window);
