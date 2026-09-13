/** After Unity preview grant: intent mutes or plays again. Apology first. */
(function (w) {
  var VERSION = "voice-mute-2026-09-01-b";
  var rec = null;
  var granted = false;

  var PLAY = /(didn['’]?t mean|did not mean|sorry.{0,24}(shut|quiet|mute|stop)|my bad|i take it back|play again|start (talking|up|over|again)|talk again|keep (going|talking|reading)|go on|continue|resume|sound on|unmute|speak up|you can talk|it'?s ok(ay)? (to )?talk|turn (the )?sound (back )?on|read again|okay (start|talk|play))/i;
  var STOP = /(shut up|shut it|be quiet|quiet down|stop talking|stop reading|stop speaking|stop that|that'?s enough|enough already|cut it out|knock it off|zip it|hush|silence|mute|sound off|turn (the )?sound off|i don'?t want to hear|no more talking|can you stop|please stop|hold on|pause)/i;

  function setMuted(on) {
    if (w.DCMute && DCMute.set) DCMute.set(!!on);
    else try { w.localStorage.setItem("dc_field_mute", on ? "1" : "0"); } catch (e) {}
    if (on && w.speechSynthesis) w.speechSynthesis.cancel();
    if (!on && w.DCPresent && DCPresent.speak) DCPresent.speak(0);
  }

  function hear(text) {
    var t = String(text || "").toLowerCase();
    if (!t.trim()) return { status: "HOLE", reason: "EMPTY" };
    if (PLAY.test(t)) {
      setMuted(false);
      return { status: "ONE", muted: false, intent: "PLAY" };
    }
    if (STOP.test(t)) {
      setMuted(true);
      return { status: "ONE", muted: true, intent: "STOP" };
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
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function () {
      granted = true;
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
    note.textContent = "Unity preview may use the microphone so you can tell her to stop, or to play again. Sound on is the default. You can refuse.";
    var dock = document.querySelector(".hud-act") || document.getElementById("holo-stage") || document.querySelector(".site");
    if (dock && dock.classList && dock.classList.contains("hud-act")) {
      dock.appendChild(btn);
      if (dock.parentNode) dock.parentNode.appendChild(note);
    } else if (dock && dock.parentNode) {
      dock.parentNode.insertBefore(btn, dock.nextSibling);
      dock.parentNode.insertBefore(note, btn.nextSibling);
    }
  }

  w.DCVoiceMute = { version: VERSION, law: "INTENT_NOT_PASSWORD", hear: hear, grant: grant, listen: listen };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject);
  else inject();
})(typeof window !== "undefined" ? window : globalThis);
