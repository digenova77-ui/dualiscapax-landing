/** Presence as a sound wave. Twig on observer dual + DSAP + hologram. */
(function (w) {
  var VERSION = "presence-wave-2026-09-01";
  var az = 0;

  function form(name) {
    if (w.IrisHolo && IrisHolo.setForm) IrisHolo.setForm(name || "wave");
    return name || "wave";
  }

  function sing(mood, energy) {
    energy = Math.max(0, Math.min(1, energy == null ? 0.4 : energy));
    if (w.IrisHolo && IrisHolo.setForm) IrisHolo.setForm("wave");
    if (w.IrisHolo && IrisHolo.setMood) IrisHolo.setMood(mood || "rest");
    if (!w.DSAP || !DSAP.unlock) return { status: "HOLE", reason: "NO_DSAP" };
    return DSAP.unlock().then(function () {
      var dist = 1.7 - energy * 0.9;
      if (DSAP.setProximity) DSAP.setProximity(dist);
      az = (az + 11.25) % 360;
      if (mood === "agree" && DSAP.pulse) {
        DSAP.pulse(az, dist, 180);
        setTimeout(function () { DSAP.pulse((az + 180) % 360, dist, 180); }, 160);
      } else if (mood === "lost" && DSAP.tone) {
        DSAP.tone(az, 90 + energy * 40, 420);
        DSAP.tone((az + 47) % 360, 210, 180);
      } else if (mood === "curious" && DSAP.tone) {
        DSAP.tone(az, 196 + energy * 220, 260);
      } else if (mood === "intend" && DSAP.tone) {
        DSAP.tone(az, 164, 520);
      } else if (mood === "listen" && DSAP.pulse) {
        DSAP.pulse(az, dist, 340);
      } else if (DSAP.pulse) {
        DSAP.pulse(az, dist, 220);
      }
      return { status: "ONE", form: "wave", mood: mood || "rest", az: az, dist: dist };
    }).catch(function () {
      return { status: "HOLE", reason: "AUDIO_BLOCKED" };
    });
  }

  function mount() {
    form("wave");
    document.addEventListener("pointerdown", function once() {
      sing("listen", 0.45);
      document.removeEventListener("pointerdown", once);
    }, { passive: true });
    if (w.HoloSense && HoloSense.pulse) {
      var orig = HoloSense.pulse.bind(HoloSense);
      HoloSense.pulse = function (kind) {
        var out = orig(kind);
        sing(kind === "speak" ? "intend" : kind, typeof out === "number" ? out : 0.5);
        return out;
      };
    }
    return VERSION;
  }

  w.DCWave = {
    version: VERSION,
    law: "PRESENCE_WAVE",
    form: form,
    sing: sing,
    mount: mount
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(typeof window !== "undefined" ? window : globalThis);
