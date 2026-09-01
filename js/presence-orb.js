/** Presence as a glowing orb. Loads viewer shift and sprite reader. */
(function (w) {
  var VERSION = "presence-orb-2026-09-01-c";

  function load(src) {
    if (document.querySelector('script[src="' + src + '"]')) return;
    var s = document.createElement("script");
    s.src = src;
    document.head.appendChild(s);
  }

  function css(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }

  function mount() {
    var saved = null;
    try { saved = w.localStorage.getItem("dc_presence_form"); } catch (e) {}
    if (w.IrisHolo && IrisHolo.setForm) IrisHolo.setForm(saved || "orb");
    css("css/sprite-read.css");
    load("js/presence-shift.js");
    load("js/sprite-read.js");
    return VERSION;
  }

  w.DCOrb = { version: VERSION, law: "PRESENCE_ORB", mount: mount };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})(typeof window !== "undefined" ? window : globalThis);
