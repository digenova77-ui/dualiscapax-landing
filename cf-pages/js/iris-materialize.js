/** Iris pours a prompt onto the field. Lock of the house does not move. */
(function (w) {
  var VERSION = "iris-materialize-2026-09-01";

  function rephrase(line) {
    var s = String(line || "").replace(/\s+/g, " ").trim();
    if (!s) return "";
    if (/\?$/.test(s)) {
      return "Ask it this way. " + s.replace(/\?+$/, ".") + " What has to be true for that to hold?";
    }
    return s;
  }

  function equations(line) {
    var s = String(line || "");
    var out = [];
    var parts = s.split(/[.;\n]/);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (!p) continue;
      if (/[=^]/.test(p) || /\d+\s*[+\-*/]\s*\d+/.test(p)) out.push(p.slice(0, 80));
    }
    return out;
  }

  function pour(line) {
    var said = String(line || "").trim();
    if (!said) return { status: "HOLE", reason: "NO_PROMPT" };
    var next = rephrase(said);
    var eqs = equations(said);
    if (w.IrisHolo && IrisHolo.setMood) IrisHolo.setMood("intend");
    if (w.DCPresent && DCPresent.recalibrate) {
      DCPresent.recalibrate(next, eqs);
      return { status: "ONE", narrative: next, equations: eqs, lock: "HELD" };
    }
    return { status: "HOLE", reason: "NO_FIELD" };
  }

  function inject() {
    if (document.getElementById("iris-pour")) return;
    var host = document.querySelector(".site") || document.body;
    var box = document.createElement("input");
    box.id = "iris-pour";
    box.type = "text";
    box.placeholder = "Give Iris a line. She will put it in the air.";
    box.setAttribute("autocomplete", "off");
    box.style.cssText = "position:relative;z-index:30;width:100%;min-height:2.6rem;margin:0 0 1rem;padding:.7rem;border:1px solid rgba(158,197,255,.4);background:#05070c;color:#f5f5f5;font:500 1rem \"IBM Plex Sans\",system-ui,sans-serif";
    box.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      pour(box.value);
    });
    var holo = document.getElementById("holo-stage");
    if (holo && holo.parentNode) holo.parentNode.insertBefore(box, holo.nextSibling);
    else host.insertBefore(box, host.firstChild);
  }

  function mount() {
    inject();
    return VERSION;
  }

  w.DCIrisLife = {
    version: VERSION,
    law: "RECALIBRATE_NOT_UNLOCK",
    rephrase: rephrase,
    equations: equations,
    pour: pour,
    mount: mount
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})(typeof window !== "undefined" ? window : globalThis);
