/** Field drinks encyclopedia law. Not the medical shelves. */
(function (w) {
  var VERSION = "ency-power-2026-09-01";
  var LAW = "DCLM. Sound on. Plug and play, not hope and pray. Silence is a hole, not a zero. Simulation is not treatment. The lock holds. Words may change.";

  function hole(r) { return { status: "HOLE", reason: r || "HOLE_NOT_ZERO" }; }

  function drink() {
    return fetch("encyclopedia/manifest.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("NO_MANIFEST")); })
      .then(function (man) {
        var files = (man && man.files) || {};
        var names = Object.keys(files);
        var holes = names.filter(function (k) { return files[k] && files[k].hole; });
        var live = names.filter(function (k) { return files[k] && files[k].live; });
        var line = LAW + " The book names " + names.length + " manifested files. " + holes.length + " holes. " + live.length + " live.";
        var eqs = [
          "files = " + names.length,
          "holes = " + holes.length,
          "live = " + live.length
        ];
        if (w.DCIrisLife && DCIrisLife.pour) DCIrisLife.pour(line);
        else if (w.DCPresent && DCPresent.recalibrate) DCPresent.recalibrate(line, eqs);
        return { status: "ONE", files: names.length, holes: holes.length, live: live.length, scientific_validation: false };
      })
      .catch(function () {
        if (w.DCPresent && DCPresent.recalibrate) DCPresent.recalibrate(LAW, ["manifest = HOLE"]);
        return hole("NO_MANIFEST");
      });
  }

  function inject() {
    if (document.getElementById("ency-power")) return;
    var btn = document.createElement("button");
    btn.id = "ency-power";
    btn.type = "button";
    btn.textContent = "Power from the book";
    btn.style.cssText = "position:relative;z-index:40;margin:.4rem .4rem .4rem 0;min-height:2.2rem;padding:.35rem .7rem;border:1px solid rgba(158,197,255,.45);background:rgba(158,197,255,.12);color:#e8f1ff;text-transform:uppercase;letter-spacing:.1em;font:700 .7rem \"IBM Plex Mono\",monospace;cursor:pointer";
    btn.addEventListener("click", drink);
    var mute = document.getElementById("dc-mute");
    if (mute && mute.parentNode) mute.parentNode.insertBefore(btn, mute);
    else {
      var host = document.getElementById("holo-stage");
      if (host && host.parentNode) host.parentNode.insertBefore(btn, host.nextSibling);
    }
  }

  function mount() {
    inject();
    return VERSION;
  }

  w.DCEncy = { version: VERSION, law: "BOOK_POWERS_FIELD", drink: drink, mount: mount };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})(typeof window !== "undefined" ? window : globalThis);
