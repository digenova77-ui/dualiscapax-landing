/**
 * Iris AV — camera, mic, device voice, optional xAI TTS.
 * Lens is video-only. SpeechRecognition owns the mic on TALK.
 */
(function (w) {
  var VERSION = "iris-av-v4-2026-09-22-lens";
  var state = {
    cam: null,
    mic: null,
    screen: null,
    rec: null,
    speaking: false,
    spatial: false,
    voice: null,
    armed: false,
    lastKind: "device"
  };

  function err(msg) {
    var el = document.getElementById("err");
    if (!el) return;
    if (!msg) { el.hidden = true; el.textContent = ""; return; }
    el.hidden = false;
    el.textContent = msg;
  }

  function setToggle(id, on, onLabel, offLabel) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("on", !!on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
    if (onLabel || offLabel) el.setAttribute("aria-label", on ? (onLabel || "on") : (offLabel || "off"));
  }

  function hearOn() {
    var hear = document.getElementById("hear");
    if (!hear) return true;
    return hear.classList.contains("on") || state.armed;
  }

  function loc() {
    if (w.IrisVoice && IrisVoice.locale) return IrisVoice.locale();
    return String((w.navigator && (navigator.languages && navigator.languages[0] || navigator.language)) || "en");
  }

  function markSpeaking(on) {
    state.speaking = !!on;
    if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(!!on);
  }

  function dropAudio(stream) {
    if (!stream || !stream.getAudioTracks) return;
    stream.getAudioTracks().forEach(function (t) {
      try { t.stop(); stream.removeTrack(t); } catch (e) { try { t.stop(); } catch (e2) {} }
    });
  }

  function releaseMic() {
    dropAudio(state.cam);
    dropAudio(state.screen);
    if (state.mic && state.mic !== state.cam && state.mic !== state.screen) {
      try { state.mic.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    }
    state.mic = null;
    if (state.rec && state.rec.stop) {
      try { state.rec.stop(); } catch (e2) {}
    }
    state.rec = null;
  }

  function enableHear() {
    state.armed = true;
    setToggle("hear", true, "Voice on", "Voice off. Tap to hear Iris.");
    if (w.DSAP && DSAP.unlock) {
      return DSAP.unlock().then(function () { state.spatial = true; }).catch(function () { return null; });
    }
    return Promise.resolve(null);
  }

  function pickVoice() {
    if (w.IrisVoice && IrisVoice.pickDevice) {
      state.voice = IrisVoice.pickDevice();
      return state.voice;
    }
    if (!w.speechSynthesis) return null;
    var list = w.speechSynthesis.getVoices() || [];
    if (!list.length) return null;
    var tag = loc().toLowerCase();
    var pre = tag.split("-")[0];
    var hit = list.filter(function (v) { return String(v.lang || "").toLowerCase().indexOf(pre) === 0; });
    state.voice = hit[0] || list[0] || null;
    return state.voice;
  }

  function deviceSpeak(text, done) {
    if (!w.speechSynthesis) {
      if (done) done();
      return;
    }
    var u = new SpeechSynthesisUtterance(String(text).slice(0, 900));
    if (w.IrisVoice && IrisVoice.applyUtterance) {
      IrisVoice.applyUtterance(u);
      state.voice = u.voice || state.voice;
    } else {
      var voice = state.voice || pickVoice();
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || loc();
      u.rate = 0.98;
      u.pitch = 1;
    }
    markSpeaking(true);
    state.lastKind = "device";
    u.onend = function () { markSpeaking(false); if (done) done(); };
    u.onerror = function () { markSpeaking(false); if (done) done(); };
    try { w.speechSynthesis.resume(); } catch (e0) {}
    try { w.speechSynthesis.speak(u); } catch (e) {
      markSpeaking(false);
      if (done) done();
    }
  }

  async function neuralSpeak(text) {
    if (!(w.DCByok && DCByok.tts)) return false;
    if (!(DCByok.present && DCByok.present())) return false;
    var opts = (w.IrisVoice && IrisVoice.ttsOpts) ? IrisVoice.ttsOpts() : { voice_id: "iris", language: "auto" };
    try {
      var rec = await DCByok.tts(String(text).slice(0, 1200), opts);
      if (!rec || !rec.ok || !rec.blob) return false;
      var url = URL.createObjectURL(rec.blob);
      var audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      markSpeaking(true);
      state.lastKind = "xai-tts";
      if (w.DSAP && DSAP.unlock) {
        try { await DSAP.unlock(); } catch (eU) {}
      }
      if (w.DSAP && DSAP.attach) {
        try {
          var hooked = DSAP.attach(audio);
          if (hooked && hooked.then) await hooked;
        } catch (e0) {}
      }
      await new Promise(function (resolve) {
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(resolve);
      });
      markSpeaking(false);
      try { URL.revokeObjectURL(url); } catch (e) {}
      return true;
    } catch (e) {
      markSpeaking(false);
      return false;
    }
  }

  function speak(text, done) {
    if (!text) { if (done) done(); return; }
    enableHear();
    if (w.DSAP) {
      if (DSAP.unlock) DSAP.unlock().catch(function () {});
      if (DSAP.speakField) DSAP.speakField(String(text).slice(0, 180));
      else if (DSAP.pulse) DSAP.pulse(0, 0.42, 220);
    }
    if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(true);
    var android = false;
    try { android = /Android/i.test(navigator.userAgent || ""); } catch (eA) {}
    if (android) {
      deviceSpeak(text, done);
      return;
    }
    neuralSpeak(text).then(function (ok) {
      if (ok) { if (done) done(); return; }
      if (!w.speechSynthesis) {
        if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(false);
        if (done) done();
        return;
      }
      deviceSpeak(text, done);
    });
  }

  async function camera(on) {
    var stage = document.getElementById("stage") || document.getElementById("pip");
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
    var stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
    } catch (e) {
      err("Camera blocked.");
      return { live: false, kind: "camera" };
    }
    dropAudio(stream);
    state.cam = stream;
    if (vid) vid.srcObject = stream;
    if (stage) stage.classList.add("on");
    err("");
    return { live: true, kind: "camera", audio: false };
  }

  async function mic(on) {
    if (!on) {
      if (state.rec && state.rec.stop) try { state.rec.stop(); } catch (e) {}
      state.rec = null;
      if (state.mic && state.mic !== state.cam) {
        try { state.mic.getTracks().forEach(function (t) { if (t.kind === "audio") t.stop(); }); } catch (e2) {}
      }
      state.mic = null;
      return { live: false, kind: "mic" };
    }
    dropAudio(state.cam);
    dropAudio(state.screen);
    var SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SR) {
      var rec = new SR();
      rec.lang = loc();
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = function (e) {
        var said = e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript;
        var box = document.getElementById("input");
        if (said && box) {
          box.value = said;
          box.dispatchEvent(new Event("input"));
        }
        if (said && w.IrisSession && IrisSession.say && !box) {
          IrisSession.say(said);
        }
      };
      rec.onerror = function () { err("Mic heard nothing."); };
      rec.onend = function () { setToggle("talk", false, "Talk", "Talk"); };
      state.rec = rec;
      rec.start();
      err("");
      return { live: true, kind: "mic-speech", lang: rec.lang };
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      err("Mic did not open on this device.");
      return { live: false, kind: "mic" };
    }
    state.mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    err("Mic is live. Speech-to-text is not on this browser.");
    return { live: true, kind: "mic-stream" };
  }

  async function arm(on) {
    if (!on) {
      await camera(false);
      await mic(false);
      setToggle("cam", false, "Open camera", "Open camera");
      setToggle("talk", false, "Talk", "Talk");
      return { live: false, kind: "arm" };
    }
    await enableHear();
    var cam = await camera(true);
    var micr = { live: false };
    try { micr = await mic(true); } catch (e) { micr = { live: false, kind: "mic-blocked" }; }
    setToggle("cam", !!cam.live, "Camera on", "Open camera");
    setToggle("talk", !!micr.live, "Talk", "Talk");
    if (w.IrisSphere) {
      if (IrisSphere.setListening) IrisSphere.setListening(!!micr.live);
      if (IrisSphere.setWoken) IrisSphere.setWoken(true);
    }
    return { live: !!(cam.live || micr.live), cam: cam, mic: micr, kind: "arm" };
  }

  async function screen(on) {
    var stage = document.getElementById("stage") || document.getElementById("pip");
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
    var stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false });
    dropAudio(stream);
    state.screen = stream;
    if (vid) vid.srcObject = stream;
    if (stage) stage.classList.add("on");
    return { live: true, kind: "screen" };
  }

  function snapshot() {
    var vid = document.getElementById("you");
    if (!vid || !vid.srcObject) return null;
    var c = document.createElement("canvas");
    c.width = vid.videoWidth || 640;
    c.height = vid.videoHeight || 360;
    c.getContext("2d").drawImage(vid, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.72);
  }

  function stopAll() {
    camera(false);
    mic(false);
    screen(false);
    releaseMic();
    if (w.speechSynthesis) w.speechSynthesis.cancel();
    if (w.DSAP && DSAP.cleanup) DSAP.cleanup();
    markSpeaking(false);
  }

  function loadSphere() {
    if (w.IrisSphere && IrisSphere.mount) {
      var host = document.getElementById("presence");
      if (host) {
        IrisSphere.mount(host);
        if (IrisSphere.setWoken) IrisSphere.setWoken(true);
      }
      return;
    }
    if (document.getElementById("dc-iris-sphere-src")) return;
    var s = document.createElement("script");
    s.id = "dc-iris-sphere-src";
    s.src = "/js/iris-sphere.js?v=53";
    s.onload = function () { loadSphere(); };
    document.head.appendChild(s);
  }

  if (w.speechSynthesis) {
    pickVoice();
    if (w.speechSynthesis.addEventListener) w.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    else w.speechSynthesis.onvoiceschanged = pickVoice;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadSphere);
  else loadSphere();

  w.IrisAV = {
    version: VERSION,
    state: state,
    speak: speak,
    camera: camera,
    mic: mic,
    arm: arm,
    screen: screen,
    snapshot: snapshot,
    stopAll: stopAll,
    releaseMic: releaseMic,
    enableHear: enableHear,
    hearOn: hearOn,
    greet: function (line) { var t = line || "I'm Iris. Looking is free."; speak(t); return t; },
    unlock: function () { return enableHear(); },
    locale: loc,
    selftest: function () {
      return {
        version: VERSION,
        locale: loc(),
        voice: state.voice && (state.voice.lang + " " + state.voice.name),
        hasArm: typeof arm === "function",
        hasSpeak: typeof speak === "function",
        hasByokTts: !!(w.DCByok && DCByok.tts),
        byokPresent: !!(w.DCByok && DCByok.present && DCByok.present()),
        hasSphere: !!(w.IrisSphere && IrisSphere.mount),
        lastKind: state.lastKind,
        dsapWave: !!(w.DSAP && typeof DSAP.wave === "function"),
        dsapAttach: !!(w.DSAP && typeof DSAP.attach === "function"),
        dsapEnergy: !!(w.DSAP && typeof DSAP.energy === "function")
      };
    }
  };

  w.addEventListener("pagehide", function () { stopAll(); });
})(window);
