/** Viewer mute. Scroll then only shows or hides the word. */
(function (w) {
  var VERSION = "viewer-mute-2026-09-01";
  var KEY = "dc_field_mute";

  function muted() {
    try { return w.localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }

  function setMute(on) {
    try { w.localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
    if (on) {
      if (w.speechSynthesis) w.speechSynthesis.cancel();
      if (w.DCPresent && DCPresent.mute) DCPresent.mute(true);
    } else if (w.DCPresent && DCPresent.mute) {
      DCPresent.mute(false);
    }
    paint();
    return { status: "ONE", muted: muted() };
  }

  function paint() {
    var btn = document.getElementById("dc-mute");
    if (btn) btn.textContent = muted() ? "Sound off" : "Sound on";
    document.documentElement.classList.toggle("sound-off", muted());
  }

  function inject() {
    if (document.getElementById("dc-mute")) return;
    var btn = document.createElement("button");
    btn.id = "dc-mute";
    btn.type = "button";
    btn.style.cssText = "position:relative;z-index:40;margin:.4rem 0;min-height:2.2rem;padding:.35rem .7rem;border:1px solid rgba(158,197,255,.45);background:transparent;color:#e8f1ff;text-transform:uppercase;letter-spacing:.1em;font:700 .7rem \"IBM Plex Mono\",monospace;cursor:pointer";
    btn.addEventListener("click", function () { setMute(!muted()); });
    var host = document.getElementById("holo-stage");
    if (host && host.parentNode) host.parentNode.insertBefore(btn, host.nextSibling);
    else (document.querySelector(".site") || document.body).appendChild(btn);
    paint();
  }

  function hook() {
    if (w.speechSynthesis && !w.speechSynthesis._dcMuteHook) {
      var speak = w.speechSynthesis.speak.bind(w.speechSynthesis);
      w.speechSynthesis.speak = function (u) {
        if (muted()) return;
        return speak(u);
      };
      w.speechSynthesis._dcMuteHook = true;
    }
    if (w.DCPresent) {
      DCPresent.muted = muted;
      var orig = DCPresent.speak;
      if (orig && !DCPresent._muteWrapped) {
        DCPresent.speak = function (from) {
          if (muted()) return { status: "ONE", muted: true };
          return orig.call(DCPresent, from);
        };
        DCPresent._muteWrapped = true;
      }
    }
  }

  function mount() {
    inject();
    hook();
    w.addEventListener("wheel", function () {
      if (!muted()) return;
      if (w.speechSynthesis) w.speechSynthesis.cancel();
    }, { capture: true, passive: true });
    return VERSION;
  }

  w.DCMute = { version: VERSION, law: "MUTE_IS_SHOW_HIDE", muted: muted, set: setMute, mount: mount };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})(typeof window !== "undefined" ? window : globalThis);
