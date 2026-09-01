/** After Unity preview grant: shut up mutes. Start talking opens sound. */
(function (w) {
  var VERSION = "voice-mute-2026-09-01";
  var rec = null;
  var granted = false;

  function hear(text) {
    var t = String(text || "").toLowerCase();
    if (/(shut up|be quiet|stop talking|mute|hush|silence)/.test(t)) {
      if (w.DCMute && DCMute.set) DCMute.set(true);
      else try { w.localStorage.setItem("dc_field_mute", "1"); } catch (e) {}
      if (w.speechSynthesis) w.speechSynthesis.cancel();
      return { status: "ONE", muted: true };
    }
    if (/(start talking|talk again|sound on|unmute|speak up|okay start)/.test(t)) {
      if (w.DCMute && DCMute.set) DCMute.set(false);
      else try { w.localStorage.setItem("dc_field_mute", "0"); } catch (e2) {}
      if (w.DCPresent && DCPresent.speak) DCPresent.speak(0);
      return { status: "ONE", muted: false };
    }
    return { status: "HOLE", reason: "NO_VOICE_COMMAND" };
  }

  function listen() {
    var Rec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Rec) return { status: "HOLE", reason: "NO_RECOGNITION" };
    if (rec) {
      try { rec.start(); } catch (e) {}
      return { status: "ONE", already: true };
    }
    rec = new Rec();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = function (ev) {
      var last = ev.results[ev.results.length - 1];
      if (!last || !last[0]) return;
      hear(last[0].transcript);
    };
    rec.onend = function () {
      if (granted) {
        try { rec.start(); } catch (e2) {}
      }
    };
    try { rec.start(); } catch (e3) {}
    return { status: "ONE" };
  }

  function grant() {
    var media = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    if (!media) {
      granted = true;
      return Promise.resolve(listen());
    }
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      granted = true;
      if (stream && stream.getTracks) stream.getTracks().forEach(function (t) { /* keep alive for recognition */ });
      listen();
      return { status: "ONE", grant: true };
    }).catch(function () {
      return { status: "HOLE", reason: "MIC_DENIED" };
    });
  }

  function inject() {
    if (document.getElementById("unity-preview")) return;
    var btn = document.createElement("button");
    btn.id = "unity-preview";
    btn.type = "button";
    btn.textContent = "Unity preview";
    btn.style.cssText = "min-height:2.2rem;padding:.35rem .7rem;border:1px solid rgba(158,197,255,.45);background:rgba(158,197,255,.12);color:#e8f1ff;text-transform:uppercase;letter-spacing:.1em;font:700 .7rem \"IBM Plex Mono\",monospace;cursor:pointer";
    btn.addEventListener("click", grant);
    var note = document.createElement("p");
    note.style.cssText = "font:500 .82rem \"IBM Plex Sans\",system-ui,sans-serif;color:rgba(245,245,245,.62);margin:.35rem 0 .7rem;max-width:36rem";
    note.textContent = "Unity preview may use the microphone so you can say shut up or start talking. Sound on is the default. You can refuse.";
    var dock = document.querySelector(".hud-act") || document.getElementById("holo-stage") || document.querySelector(".site");
    if (dock && dock.classList && dock.classList.contains("hud-act")) {
      dock.appendChild(btn);
      dock.parentNode && dock.parentNode.appendChild(note);
    } else if (dock && dock.parentNode) {
      dock.parentNode.insertBefore(btn, dock.nextSibling);
      dock.parentNode.insertBefore(note, btn.nextSibling);
    }
  }

  w.DCVoiceMute = { version: VERSION, law: "SAY_SHUT_UP", hear: hear, grant: grant, listen: listen };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject);
  else inject();
})(typeof window !== "undefined" ? window : globalThis);
