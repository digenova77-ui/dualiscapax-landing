/**
 * Iris AV V2 sleeve — camera, mic, screen, DSAP unlock.
 * Dry words: speechSynthesis (best available device voice).
 * Felt layer: DSAP roar/speakField under the words when present.
 * Not a cloned voice. Not a codec.
 */
(function (w) {
  var VERSION = "iris-av-v2-2026-09-13-speak";
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

  function hearOn() {
    /* Mute only when Hear exists AND is explicitly off */
    var hear = document.getElementById("hear");
    if (!hear) return true;
    if (hear.getAttribute("aria-pressed") === "false") return false;
    if (hear.classList.contains("on")) return true;
    /* partner-door starts with class on; ai/app starts pressed false */
    return hear.classList.contains("on");
  }

  function pickVoice() {
    if (!w.speechSynthesis) return null;
    var list = w.speechSynthesis.getVoices() || [];
    if (!list.length) return null;
    var score = function (v) {
      var n = (v.name || "").toLowerCase();
      var lang = (v.lang || "").toLowerCase();
      var s = 0;
      if (/^en/.test(lang)) s += 10;
      if (lang.indexOf("en-ca") === 0 || lang.indexOf("en-us") === 0 || lang.indexOf("en-gb") === 0) s += 4;
      /* Prefer natural / neural / premium female-leaning system voices */
      if (/natural|neural|premium|enhanced|studio|super/.test(n)) s += 12;
      if (/samantha|karen|moira|fiona|victoria|susan|zoe|ava|aria|jenny|google uk english female|microsoft aria|microsoft jenny|microsoft sara|siri/.test(n)) s += 14;
      if (/female|woman|girl/.test(n)) s += 3;
      if (/google/.test(n)) s += 2;
      if (/compact|eloquence|whisper|novelty|bad news|good news|bells|organ|zarvox/.test(n)) s -= 20;
      if (/male|daniel|alex|fred|ralph|bruce|tom|david|mark|guy/.test(n) && !/female/.test(n)) s -= 2;
      return s;
    };
    list = list.slice().sort(function (a, b) { return score(b) - score(a); });
    state.voice = list[0] || null;
    return state.voice;
  }

  function unlockAudioSync() {
    try {
      var AC = w.AudioContext || w.webkitAudioContext;
      if (AC) {
        if (!w.__irisAudioCtx) w.__irisAudioCtx = new AC();
        if (w.__irisAudioCtx.state === "suspended") w.__irisAudioCtx.resume();
      }
    } catch (e) {}
    try {
      if (w.speechSynthesis) {
        w.speechSynthesis.resume();
        w.speechSynthesis.getVoices();
      }
    } catch (e2) {}
    if (w.DSAP && typeof DSAP.unlock === "function") {
      try {
        var p = DSAP.unlock();
        if (p && p.then) p.then(function () { state.spatial = true; }).catch(function () {});
        else state.spatial = true;
      } catch (e3) {}
    }
  }

  function dsapFelt(text) {
    if (!(w.DSAP)) return;
    try {
      if (typeof DSAP.setFelt === "function") DSAP.setFelt(true);
      if (typeof DSAP.roar === "function") DSAP.roar(text);
      else if (typeof DSAP.speakField === "function") DSAP.speakField(text);
    } catch (e) {}
  }

  function dsapClear() {
    if (!(w.DSAP)) return;
    try {
      if (typeof DSAP.setFelt === "function") DSAP.setFelt(false);
      if (typeof DSAP.stop === "function") DSAP.stop();
    } catch (e) {}
  }

  function isAndroid() {
    try { return /Android/i.test(navigator.userAgent || ""); } catch (e) { return false; }
  }

  function surfaceSpokenText(clean) {
    /* Always echo words on-screen — Android TTS is often silent even when “allowed” */
    try {
      var textDiv = document.getElementById("irisTextReply");
      var resBox = document.getElementById("irisResponseBox");
      if (textDiv) textDiv.textContent = clean;
      if (resBox) resBox.style.display = "block";
      var badge = document.getElementById("irisVoiceStatusBadge");
      if (badge) {
        badge.style.display = "inline-flex";
        badge.textContent = isAndroid() ? "Iris (text + DSAP)…" : "Iris speaking…";
      }
      var lab = document.getElementById("heroSpeakLabel");
      if (lab) lab.textContent = "Iris speaking…";
    } catch (e) {}
  }

  function speak(text, done) {
    if (!text) {
      if (done) done();
      return;
    }
    if (!hearOn()) {
      if (done) done();
      return;
    }
    if (!w.speechSynthesis) {
      err("This browser has no speech voice.");
      if (done) done();
      return;
    }

    unlockAudioSync();
    var clean = String(text).replace(/[*_#`~↳•■]/g, " ").replace(/\s+/g, " ").trim().slice(0, 900);
    if (!clean) {
      if (done) done();
      return;
    }

    surfaceSpokenText(clean);
    /* DSAP felt under the words — spatial ring, not a voice clone */
    dsapFelt(clean);

    var finished = false;
    var android = isAndroid();
    function finish() {
      if (finished) return;
      finished = true;
      state.speaking = false;
      dsapClear();
      try {
        var lab = document.getElementById("heroSpeakLabel");
        if (lab) lab.textContent = "Speak with Iris";
        var badge = document.getElementById("irisVoiceStatusBadge");
        if (badge) badge.style.display = "none";
      } catch (e) {}
      if (done) done();
    }

    function fire() {
      var u = new SpeechSynthesisUtterance(clean);
      /*
       * Android Chrome residual: assigning .voice or delaying past the user gesture
       * often yields total silence even with Microphone/Site allow. Keep sync + default voice.
       */
      if (!android) {
        var voice = state.voice || pickVoice();
        if (voice) {
          u.voice = voice;
          u.lang = voice.lang || "en-CA";
        } else {
          u.lang = "en-CA";
        }
      } else {
        u.lang = "en-US";
      }
      u.rate = android ? 1.0 : 0.96;
      u.pitch = 1.0;
      u.volume = 1;
      state.speaking = true;
      var started = false;
      u.onstart = function () { started = true; state.speaking = true; };
      u.onend = finish;
      u.onerror = function () { finish(); };
      try {
        if (!android && (w.speechSynthesis.speaking || w.speechSynthesis.pending)) {
          try { w.speechSynthesis.cancel(); } catch (c) {}
        }
        w.speechSynthesis.resume();
        w.speechSynthesis.speak(u);
        setTimeout(function () {
          try { if (w.speechSynthesis.paused) w.speechSynthesis.resume(); } catch (e) {}
        }, 60);
        /* If Android never starts utterance, we still showed text + DSAP felt — finish cleanly */
        setTimeout(function () {
          if (android && !started && !finished) {
            err("Chrome on this phone stayed silent on TTS. Words are on-screen; DSAP felt still ran. Try typing, or another browser.");
            finish();
          }
        }, 1200);
      } catch (e) {
        finish();
      }
    }

    /* Android: never wait for voiceschanged — that leaves the tap gesture and kills speak */
    if (android) {
      fire();
      return;
    }

    var voices = w.speechSynthesis.getVoices() || [];
    if (!voices.length) {
      var once = function () {
        try { w.speechSynthesis.removeEventListener("voiceschanged", once); } catch (e) {}
        pickVoice();
        fire();
      };
      try { w.speechSynthesis.addEventListener("voiceschanged", once); } catch (e) {
        w.speechSynthesis.onvoiceschanged = once;
      }
      setTimeout(function () {
        pickVoice();
        if (!finished && !state.speaking) fire();
      }, 180);
    } else {
      pickVoice();
      fire();
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
    /* Always open mic stream first (mobile requirement), then speech recognition */
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      err("Mic did not open on this device.");
      return { live: false, kind: "mic" };
    }
    try {
      state.mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (eMic) {
      err("Mic permission blocked. Allow microphone, then try again.");
      return { live: false, kind: "mic" };
    }
    var SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SR) {
      var rec = new SR();
      rec.lang = "en-CA";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      rec.onresult = function (e) {
        var said = e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript;
        var box = document.getElementById("input") || document.getElementById("irisInput") || document.querySelector("textarea, input[type=text]");
        if (said && box) {
          box.value = said;
          box.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (said && typeof w.handleIrisVoiceTranscript === "function") {
          try { w.handleIrisVoiceTranscript(said); } catch (eH) {}
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
      try { rec.start(); } catch (eStart) {}
      err("");
      return { live: true, kind: "mic-speech" };
    }
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
    dsapClear();
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
    unlock: function () {
      unlockAudioSync();
      return w.DSAP && DSAP.unlock ? DSAP.unlock() : Promise.resolve(null);
    }
  };

  w.addEventListener("pagehide", function () { stopAll(); });
  w.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      if (w.speechSynthesis) w.speechSynthesis.cancel();
      dsapClear();
      if (w.DSAP && DSAP.stop) DSAP.stop();
      state.speaking = false;
    }
  });
})(window);
