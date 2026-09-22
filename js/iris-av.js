/**
 * Iris AV — camera, mic, device voice, optional xAI TTS.
 * Step 1: one gesture can arm cam + mic + hear.
 * Step 3: DCByok.tts if a tab key exists, else speechSynthesis.
 * Not a cloned voice. No key in this file.
 */
(function (w) {
  var VERSION = "iris-av-v3-2026-09-22-arm";
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

  function enableHear() {
    state.armed = true;
    setToggle("hear", true, "Voice on", "Voice off. Tap to hear Iris.");
    if (w.DSAP && DSAP.unlock) {
      return DSAP.unlock().then(function () { state.spatial = true; }).catch(function () { return null; });
    }
    return Promise.resolve(null);
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

  function deviceSpeak(text, done) {
    if (!w.speechSynthesis) {
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
    state.lastKind = "device";
    u.onend = function () { state.speaking = false; if (done) done(); };
    u.onerror = function () { state.speaking = false; if (done) done(); };
    w.speechSynthesis.cancel();
    try { w.speechSynthesis.speak(u); } catch (e) {
      state.speaking = false;
      if (done) done();
    }
  }

  async function neuralSpeak(text) {
    if (!(w.DCByok && DCByok.tts)) return false;
    if (!(DCByok.present && DCByok.present())) return false;
    try {
      var rec = await DCByok.tts(String(text).slice(0, 1200), { voice_id: "eve", language: "en" });
      if (!rec || !rec.ok || !rec.blob) return false;
      var url = URL.createObjectURL(rec.blob);
      var audio = new Audio(url);
      state.speaking = true;
      state.lastKind = "xai-tts";
      await new Promise(function (resolve) {
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(resolve);
      });
      state.speaking = false;
      try { URL.revokeObjectURL(url); } catch (e) {}
      return true;
    } catch (e) {
      state.speaking = false;
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
    neuralSpeak(text).then(function (ok) {
      if (ok) { if (done) done(); return; }
      if (!w.speechSynthesis) { if (done) done(); return; }
      deviceSpeak(text, done);
    });
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
    var stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
    } catch (e) {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });
    }
    state.cam = stream;
    if (vid) vid.srcObject = stream;
    if (stage) stage.classList.add("on");
    if (stream.getAudioTracks && stream.getAudioTracks().length) state.mic = stream;
    err("");
    return { live: true, kind: "camera", audio: !!(stream.getAudioTracks && stream.getAudioTracks().length) };
  }

  async function mic(on) {
    if (!on) {
      if (state.rec && state.rec.stop) try { state.rec.stop(); } catch (e) {}
      state.rec = null;
      if (state.mic && state.mic !== state.cam) state.mic.getTracks().forEach(function (t) {
        if (t.kind === "audio") t.stop();
      });
      if (state.mic !== state.cam) state.mic = null;
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
      rec.onend = function () { setToggle("talk", false, "Talk", "Talk"); };
      state.rec = rec;
      rec.start();
      err("");
      return { live: true, kind: "mic-speech" };
    }
    if (state.cam && state.cam.getAudioTracks && state.cam.getAudioTracks().length) {
      state.mic = state.cam;
      err("Mic is live. Speech-to-text is not on this browser — type the words.");
      return { live: true, kind: "mic-from-camera" };
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      err("Mic did not open on this device.");
      return { live: false, kind: "mic" };
    }
    state.mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    err("Mic is live. Speech-to-text is not on this browser — type the words.");
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
    var stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false });
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
    if (w.speechSynthesis) w.speechSynthesis.cancel();
    if (w.DSAP && DSAP.cleanup) DSAP.cleanup();
    state.speaking = false;
  }

  function loadSphere() {
    if (w.IrisSphere && IrisSphere.mount) {
      var host = document.getElementById("presence");
      if (host) {
        host.style.width = "min(46vw,12rem)";
        host.style.height = "min(46vw,12rem)";
        host.style.borderRadius = "50%";
        IrisSphere.mount(host);
        if (IrisSphere.setWoken) IrisSphere.setWoken(true);
      }
      return;
    }
    if (document.getElementById("dc-iris-sphere-src")) return;
    var s = document.createElement("script");
    s.id = "dc-iris-sphere-src";
    s.src = "/js/iris-sphere.js?v=35a";
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
    enableHear: enableHear,
    hearOn: hearOn,
    greet: function (line) { var t = line || "I'm Iris. Looking is free."; speak(t); return t; },
    unlock: function () { return enableHear(); },
    selftest: function () {
      return {
        version: VERSION,
        hasArm: typeof arm === "function",
        hasSpeak: typeof speak === "function",
        hasByokTts: !!(w.DCByok && DCByok.tts),
        byokPresent: !!(w.DCByok && DCByok.present && DCByok.present()),
        hasSphere: !!(w.IrisSphere && IrisSphere.mount),
        lastKind: state.lastKind
      };
    }
  };

  w.addEventListener("pagehide", function () { stopAll(); });
})(window);
