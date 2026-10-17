function quiet(extra) {
  return {
    ...(extra || {}),
    stored: false,
    media: null,
    look: 0,
    joule: null,
    gate: "shut",
    open: false,
    minted: false,
    coin: null
  };
}

function streamHandle(stream) {
  return {
    stop: function () {
      const tracks = typeof stream.getTracks === "function" ? stream.getTracks() : [];
      for (let i = 0; i < tracks.length; i++) tracks[i].stop();
    }
  };
}

function devices() {
  const nav = globalThis.navigator;
  if (!nav || !nav.mediaDevices) return null;
  return nav.mediaDevices;
}

function userMedia(constraints) {
  const media = devices();
  if (!media || typeof media.getUserMedia !== "function") return Promise.reject(new Error("denied"));
  return media.getUserMedia(constraints).then(streamHandle);
}

function displayMedia() {
  const media = devices();
  if (!media || typeof media.getDisplayMedia !== "function") return Promise.reject(new Error("denied"));
  return media.getDisplayMedia({ video: true, audio: false }).then(streamHandle);
}

function place() {
  return new Promise(function (resolve, reject) {
    const geo = globalThis.navigator && globalThis.navigator.geolocation;
    if (!geo || typeof geo.getCurrentPosition !== "function") {
      reject(new Error("denied"));
      return;
    }
    geo.getCurrentPosition(function () {
      resolve({ stop: function () {} });
    }, function () {
      reject(new Error("denied"));
    }, { timeout: 8000, maximumAge: 0 });
  });
}

function reading(name, event) {
  if (!event) return false;
  if (name === "motion") {
    const accel = event.accelerationIncludingGravity || event.acceleration || null;
    const rate = event.rotationRate || null;
    if (accel && (typeof accel.x === "number" || typeof accel.y === "number" || typeof accel.z === "number")) return true;
    if (rate && (typeof rate.alpha === "number" || typeof rate.beta === "number" || typeof rate.gamma === "number")) return true;
    return false;
  }
  return typeof event.alpha === "number" || typeof event.beta === "number" || typeof event.gamma === "number";
}

function waitForReading(root, name) {
  return new Promise(function (resolve) {
    const eventName = name === "motion" ? "devicemotion" : "deviceorientation";
    let settled = false;
    function finish(ok) {
      if (settled) return;
      settled = true;
      root.removeEventListener(eventName, onEvent);
      resolve(ok === true);
    }
    function onEvent(event) {
      if (reading(name, event)) finish(true);
    }
    root.addEventListener(eventName, onEvent);
    root.setTimeout(function () { finish(false); }, 800);
  });
}

function spatial(name) {
  const root = typeof window === "undefined" ? null : window;
  if (!root) return Promise.reject(new Error("denied"));
  const Orientation = root.DeviceOrientationEvent || globalThis.DeviceOrientationEvent;
  const Motion = root.DeviceMotionEvent || globalThis.DeviceMotionEvent;
  const Ctor = name === "motion" ? Motion : Orientation;
  const readingPromise = function () {
    return waitForReading(root, name).then(function (ok) {
      if (ok) return { stop: function () {} };
      throw new Error("denied");
    });
  };
  if (Ctor && typeof Ctor.requestPermission === "function") {
    return Ctor.requestPermission().then(function (answer) {
      if (answer !== "granted") throw new Error("denied");
      return readingPromise();
    });
  }
  return readingPromise();
}

function openSense(name) {
  if (name === "microphone") return userMedia({ audio: true, video: false });
  if (name === "front") return userMedia({ audio: false, video: { facingMode: "user" } });
  if (name === "rear") return userMedia({ audio: false, video: { facingMode: "environment" } });
  if (name === "screen") return displayMedia();
  if (name === "place") return place();
  if (name === "gyroscope" || name === "motion" || name === "orientation") return spatial(name);
  return Promise.reject(new Error("denied"));
}

export function askSense(name, held) {
  if (held && typeof held.stop === "function") {
    return Promise.resolve(quiet({ granted: true, same: true, handle: held }));
  }
  return openSense(name).then(function (handle) {
    return quiet({ granted: true, same: false, handle: handle });
  }).catch(function () {
    return quiet({ granted: false, same: false, handle: null });
  });
}
