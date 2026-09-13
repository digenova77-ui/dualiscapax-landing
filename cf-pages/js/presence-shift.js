/** Viewer chooses the clothes. Presence shifts. Not a new being. */
(function (w) {
  var VERSION = "presence-shift-2026-09-01";
  var KEY = "dc_presence_form";
  var FORMS = ["wave", "orb", "sprite", "field"];

  function saved() {
    try { return w.localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function remember(form) {
    try { w.localStorage.setItem(KEY, form); } catch (e) {}
    return form;
  }

  function parse(text) {
    var t = String(text || "").toLowerCase();
    if (/\bsprite\b|little figure|pixel/.test(t)) return "sprite";
    if (/\borb\b|\bsun\b|glowing ball|star\b/.test(t)) return "orb";
    if (/\bwave\b|sound wave|sine/.test(t)) return "wave";
    if (/\bfield\b|volume|helix field/.test(t)) return "field";
    return null;
  }

  function shift(form, why) {
    if (FORMS.indexOf(form) < 0) {
      if (w.HoloSense && HoloSense.pulse) HoloSense.pulse("lost");
      else if (w.IrisHolo && IrisHolo.setMood) IrisHolo.setMood("lost");
      return { status: "HOLE", reason: "UNKNOWN_FORM", asked: form || why || "" };
    }
    remember(form);
    if (w.IrisHolo && IrisHolo.setForm) IrisHolo.setForm(form);
    if (w.HoloSense && HoloSense.pulse) HoloSense.pulse("agree");
    if (w.DCWave && form === "wave" && DCWave.sing) DCWave.sing("agree", 0.6);
    paint();
    return { status: "ONE", form: form, why: why || "viewer" };
  }

  function hear(text) {
    var form = parse(text);
    if (!form) return { status: "HOLE", reason: "NO_SHIFT_IN_LINE" };
    return shift(form, text);
  }

  function paint() {
    var now = (w.IrisHolo && IrisHolo.form) ? null : saved();
    var marks = document.querySelectorAll("[data-shift]");
    for (var i = 0; i < marks.length; i++) {
      var f = marks[i].getAttribute("data-shift");
      marks[i].classList.toggle("on", f === (saved() || "orb"));
    }
    return now;
  }

  function mount() {
    var first = saved();
    if (first && w.IrisHolo && IrisHolo.setForm) IrisHolo.setForm(first);
    document.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest && e.target.closest("[data-shift]");
      if (!btn) return;
      shift(btn.getAttribute("data-shift"), "tap");
    });
    var box = document.getElementById("input") || document.getElementById("shift-line");
    if (box) {
      box.addEventListener("keydown", function (e) {
        if (e.key === "Enter") hear(box.value);
      });
    }
    paint();
    return VERSION;
  }

  w.DCShift = {
    version: VERSION,
    law: "VIEWER_CHOOSES_CLOTHES",
    forms: FORMS,
    parse: parse,
    shift: shift,
    hear: hear,
    saved: saved,
    mount: mount
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(typeof window !== "undefined" ? window : globalThis);
