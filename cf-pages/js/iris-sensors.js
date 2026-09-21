/**
 * Iris lander sensors — mic / camera (front|back) / screen
 * Cross-browser permission + stream helpers for DualisCapax.ai
 * Must run in a secure context (https or localhost).
 */
(function (w) {
  "use strict";

  var VERSION = "iris-sensors-2026-09-20-voice";
  var facingMode = "user"; // user = front, environment = back
  var cameraStream = null;
  var screenStream = null;
  var micStream = null;

  function isSecure() {
    try {
      if (w.isSecureContext) return true;
      var h = (w.location && w.location.hostname) || "";
      return h === "localhost" || h === "127.0.0.1";
    } catch (e) {
      return false;
    }
  }

  function ensureMediaDevices() {
    if (!navigator.mediaDevices) navigator.mediaDevices = {};
    if (!navigator.mediaDevices.getUserMedia) {
      var legacy =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
      if (legacy) {
        navigator.mediaDevices.getUserMedia = function (constraints) {
          return new Promise(function (resolve, reject) {
            legacy.call(navigator, constraints, resolve, reject);
          });
        };
      }
    }
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  function softChime() {
    try {
      var Ctx = w.AudioContext || w.webkitAudioContext;
      if (!Ctx) return;
      if (!w.__irisAudioCtx) w.__irisAudioCtx = new Ctx();
      var ctx = w.__irisAudioCtx;
      if (ctx.state === "suspended") ctx.resume();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(ctx.destination);
      var t = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.03, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.start(t);
      o.stop(t + 0.13);
    } catch (e) {}
  }

  function status(msg) {
    try {
      var el = document.getElementById("irisTextReply") || document.getElementById("irisResponseBox");
      if (el && msg) {
        if (el.id === "irisResponseBox") {
          var t = document.getElementById("irisTextReply");
          if (t) t.textContent = msg;
          el.style.display = "block";
        } else {
          el.textContent = msg;
        }
      }
    } catch (e) {}
    console.log("[IrisSensors]", msg);
  }

  function permissionDeniedMessage(kind, err) {
    var name = (err && (err.name || err.message)) || "denied";
    if (/NotAllowed|PermissionDenied|security/i.test(name)) {
      return kind + " permission blocked. Tap the lock/tune icon in the address bar → Allow " + kind + ", then try again.";
    }
    if (/NotFound|DevicesNotFound/i.test(name)) {
      return "No " + kind + " device found on this machine.";
    }
    if (/NotReadable|TrackStart|Abort/i.test(name)) {
      return kind + " is in use by another app. Close it and retry.";
    }
    if (/Overconstrained/i.test(name)) {
      return kind + " constraints not supported; retrying with defaults.";
    }
    return kind + " failed: " + name;
  }

  async function requestMicStream() {
    if (!isSecure()) throw new Error("Needs HTTPS for microphone.");
    if (!ensureMediaDevices()) throw new Error("getUserMedia unsupported.");
    // Prefer detailed constraints; fall back for older iOS/Android
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
    } catch (e1) {
      return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }
  }

  async function requestCameraStream(mode) {
    if (!isSecure()) throw new Error("Needs HTTPS for camera.");
    if (!ensureMediaDevices()) throw new Error("getUserMedia unsupported.");
    mode = mode || facingMode;
    var attempts = [
      { video: { facingMode: { ideal: mode } }, audio: false },
      { video: { facingMode: mode }, audio: false },
      { video: true, audio: false }
    ];
    var lastErr = null;
    for (var i = 0; i < attempts.length; i++) {
      try {
        return await navigator.mediaDevices.getUserMedia(attempts[i]);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("camera failed");
  }

  async function requestScreenStream() {
    if (!isSecure()) throw new Error("Needs HTTPS for screen share.");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error("Screen capture unsupported on this mobile browser. Use Camera or Files instead.");
    }
    return await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 15 } },
      audio: false
    });
  }

  function stopStream(stream) {
    if (!stream) return;
    try {
      stream.getTracks().forEach(function (t) { t.stop(); });
    } catch (e) {}
  }

  function attachVideo(stream) {
    var vid = document.getElementById("irisCameraVideo");
    var box = document.getElementById("irisOpticalViewfinder");
    if (vid) {
      vid.setAttribute("playsinline", "");
      vid.setAttribute("muted", "");
      vid.muted = true;
      vid.srcObject = stream;
      var playPromise = vid.play();
      if (playPromise && playPromise.catch) playPromise.catch(function () {});
    }
    if (box) {
      box.removeAttribute("hidden");
      box.classList.add("active");
      box.style.display = "flex";
    }
  }

  function detachVideo() {
    var vid = document.getElementById("irisCameraVideo");
    var box = document.getElementById("irisOpticalViewfinder");
    if (vid) {
      try { vid.pause(); } catch (e) {}
      vid.srcObject = null;
    }
    if (box) {
      box.classList.remove("active");
      box.setAttribute("hidden", "");
      box.style.display = "";
    }
  }

  // ---- public API used by lander ----
  w.playIrisChime = function () {
    softChime();
  };

  w.snapOpticalFrame = function () {
    softChime();
    var vid = document.getElementById("irisCameraVideo");
    if (!vid || !vid.srcObject || !vid.videoWidth) {
      status("Open camera first, then ingest a frame.");
      return null;
    }
    var c = document.createElement("canvas");
    c.width = vid.videoWidth;
    c.height = vid.videoHeight;
    c.getContext("2d").drawImage(vid, 0, 0);
    var dataUrl = c.toDataURL("image/jpeg", 0.72);
    // Ephemeral: keep only in memory for this session if needed
    w.__irisLastFrame = dataUrl;
    status("Frame held in RAM (" + c.width + "×" + c.height + "). Not uploaded.");
    if (typeof w.speakText === "function") w.speakText("Frame ingested in local memory.");
    return dataUrl;
  };

  w.closeOpticalViewfinder = function () {
    softChime();
    stopStream(cameraStream);
    cameraStream = null;
    detachVideo();
    if (typeof w.updateSensorVisual === "function") {
      w.updateSensorVisual("camera", "off", "📷 Camera: OFF");
    }
    if (w.SENSOR_STATE) w.SENSOR_STATE.camera = false;
  };

  w.flipIrisCamera = async function () {
    softChime();
    var prevMode = facingMode;
    var prevStream = cameraStream;
    var nextMode = facingMode === "user" ? "environment" : "user";
    facingMode = nextMode;
    try {
      var next = await requestCameraStream(nextMode);
      /* Only stop old stream after new one succeeds — stops the “flips then goes back dead” residual */
      stopStream(prevStream);
      cameraStream = next;
      attachVideo(cameraStream);
      if (typeof w.updateSensorVisual === "function") {
        w.updateSensorVisual(
          "camera",
          "active-live",
          facingMode === "user" ? "📷 Front camera" : "📷 Rear camera"
        );
      }
      status(facingMode === "user" ? "Front camera live." : "Rear camera live.");
    } catch (err) {
      facingMode = prevMode;
      cameraStream = prevStream;
      if (prevStream) attachVideo(prevStream);
      var name = (err && (err.name || err.message)) || "";
      // Never open the mic #permissionGuidanceModal for camera failures.
      if (/NotAllowed|PermissionDenied|security/i.test(String(name))) {
        status(permissionDeniedMessage("Camera", err));
        if (typeof w.irisSoftNotice === "function") {
          w.irisSoftNotice("Camera permission blocked. Tap lock/tune → Camera Allow, then retry.");
        }
      } else if (/NotReadable|TrackStart|Abort|Overconstrained|NotFound/i.test(String(name))) {
        status(permissionDeniedMessage("Camera", err));
        if (typeof w.irisSoftNotice === "function") {
          w.irisSoftNotice("Camera busy or unavailable (" + name + "). Staying on " + (prevMode === "user" ? "front" : "rear") + ".");
        }
      } else {
        status("That lens isn’t available on this phone. Staying on " + (prevMode === "user" ? "front" : "rear") + ".");
      }
    }
  };

  w.irisRequestMicPermission = async function () {
    softChime();
    try {
      stopStream(micStream);
      micStream = await requestMicStream();
      // Keep briefly so permission sticks, then release tracks for recognition path
      // Caller may reuse; we stop after grant to avoid LED stuck-on unless listening.
      var tracks = micStream.getTracks();
      tracks.forEach(function (t) { t.stop(); });
      micStream = null;
      status("Microphone allowed.");
      return true;
    } catch (err) {
      status(permissionDeniedMessage("Microphone", err));
      var name = (err && (err.name || err.message)) || "";
      // Only real site-permission deny opens the walkthrough modal.
      if (/NotAllowed|PermissionDenied|security/i.test(String(name))) {
        if (typeof w.showPermissionModal === "function") w.showPermissionModal();
      } else if (typeof w.irisSoftNotice === "function") {
        w.irisSoftNotice(permissionDeniedMessage("Microphone", err));
      }
      return false;
    }
  };

  // Patch helpers exposed for lander rewrites
  w.IrisSensors = {
    version: VERSION,
    isSecure: isSecure,
    ensureMediaDevices: ensureMediaDevices,
    permissionDeniedMessage: permissionDeniedMessage,
    requestMicStream: requestMicStream,
    requestCameraStream: requestCameraStream,
    requestScreenStream: requestScreenStream,
    getFacingMode: function () { return facingMode; },
    setFacingMode: function (m) { facingMode = m === "environment" ? "environment" : "user"; },
    getCameraStream: function () { return cameraStream; },
    setCameraStream: function (s) { cameraStream = s; },
    getScreenStream: function () { return screenStream; },
    setScreenStream: function (s) { screenStream = s; },
    stopStream: stopStream,
    attachVideo: attachVideo,
    detachVideo: detachVideo,
    permissionDeniedMessage: permissionDeniedMessage,
    softChime: softChime
  };

  console.log("[IrisSensors]", VERSION, "secure=", isSecure());
})(window);
