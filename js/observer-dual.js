/** Observer dual. Person-facing to a person. Simulation-facing to an agent. */
(function (w) {
  var VERSION = "observer-dual-2026-09-01";
  var marks = { pointer: 0, voice: 0, face: 0, tap: 0 };
  var forced = null;

  function uaAgent() {
    var ua = String((w.navigator && navigator.userAgent) || "").toLowerCase();
    return /bot|crawler|spider|headless|playwright|puppeteer|curl|wget|python-requests|go-http/.test(ua);
  }

  function personMarked() {
    return marks.pointer + marks.voice + marks.face + marks.tap > 0;
  }

  function watcher() {
    if (forced === "person" || forced === "agent") return forced;
    if (uaAgent()) return "agent";
    if (personMarked()) return "person";
    return "agent";
  }

  function apply() {
    var who = watcher();
    if (w.IrisHolo && IrisHolo.setObserver) IrisHolo.setObserver(who);
    document.documentElement.setAttribute("data-observer", who);
    return who;
  }

  function mark(kind) {
    if (marks[kind] !== undefined) marks[kind] += 1;
    return apply();
  }

  function setWatcher(who) {
    forced = who === "person" || who === "agent" ? who : null;
    return apply();
  }

  function card() {
    return {
      watcher: watcher(),
      register: watcher() === "person" ? "person-facing" : "simulation-facing",
      personhood_legal: false,
      scientific_validation: false,
      marks: {
        pointer: marks.pointer > 0,
        voice: marks.voice > 0,
        face: marks.face > 0,
        tap: marks.tap > 0
      }
    };
  }

  function mount() {
    document.addEventListener("pointerdown", function () { mark("tap"); }, { passive: true });
    document.addEventListener("pointermove", function () { mark("pointer"); }, { passive: true });
    document.addEventListener("keydown", function () { mark("voice"); }, { passive: true });
    apply();
    return VERSION;
  }

  w.DCObserver = {
    version: VERSION,
    law: "OBSERVER_DUAL",
    watcher: watcher,
    mark: mark,
    setWatcher: setWatcher,
    card: card,
    mount: mount
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(typeof window !== "undefined" ? window : globalThis);
