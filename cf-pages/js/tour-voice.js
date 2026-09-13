/**
 * DualisCapax tour voice — REAL AUDIO ONLY
 *
 * No synthetic speechSynthesis voices. No oscillator drones.
 * If assets/audio/narrator.mp3 (or per-step file) is missing, this is silent.
 * Stop always cancels any playing source.
 */
(function (w) {
  var KEY = "dc_narrator";
  var audioEl = null;
  var currentUrl = null;

  var PATH_PROFILES = {
    healthcare: { pace: "measured", rate: 0.92, style: "clinical-curious" },
    neurological: { pace: "measured", rate: 0.9, style: "clinical-curious" },
    engineering: { pace: "tight", rate: 1.02, style: "technical-precision" },
    default: { pace: "even", rate: 0.96, style: "institutional" }
  };

  function pathKey() {
    var p = (location.pathname || "").toLowerCase();
    if (p.indexOf("/engineering") !== -1) return "engineering";
    if (p.indexOf("/neurological") !== -1 || p.indexOf("/als") !== -1) return "neurological";
    if (p.indexOf("/healthcare") !== -1 || p.indexOf("/medical") !== -1) return "healthcare";
    return "default";
  }

  function getVoicePref() {
    try { return localStorage.getItem(KEY) || "female"; } catch (e) { return "female"; }
  }
  function setVoicePref(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  function ensureAudio() {
    if (!audioEl) {
      audioEl = new Audio();
      audioEl.preload = "auto";
    }
    return audioEl;
  }

  // Hard stop: pause, reset, drop the element reference so nothing leaks.
  function stop() {
    if (audioEl) {
      try { audioEl.pause(); } catch (e) {}
      try { audioEl.removeAttribute("src"); audioEl.load(); } catch (e) {}
    }
    audioEl = null;
    currentUrl = null;
    // Belt-and-suspenders: cancel any legacy speechSynthesis if a stale page had it.
    if (w.speechSynthesis) {
      try { w.speechSynthesis.cancel(); } catch (e) {}
    }
  }

  // Speak only if a real file exists at the given URL. Silent otherwise.
  function speak(url, opts) {
    if (!url) { stop(); return { ok: false, reason: "no-url" }; }
    var a = ensureAudio();
    // If same file already playing, leave it.
    if (currentUrl === url && !a.paused) {
      return { ok: true, reason: "already-playing" };
    }
    stop();
    a = ensureAudio();
    a.src = url;
    currentUrl = url;
    var p = a.play();
    if (p && p.catch) {
      p.catch(function () {
        // Autoplay blocked or file missing — stay silent, no error spam.
        stop();
      });
    }
    return { ok: true };
  }

  // Probe whether a narrator file is actually present (HEAD request).
  function probe(url) {
    return fetch(url, { method: "HEAD", cache: "no-store" })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
  }

  w.DCTourVoice = {
    pathKey: pathKey,
    profile: function () { return PATH_PROFILES[pathKey()] || PATH_PROFILES.default; },
    getGender: getVoicePref,
    setGender: setVoicePref,
    speak: speak,
    stop: stop,
    probe: probe,
    PATH_PROFILES: PATH_PROFILES,
    hasRealAudio: function () { return !!currentUrl; }
  };
})(window);
