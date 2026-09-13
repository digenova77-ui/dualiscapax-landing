/* DualisCapax sense — hall tone, spoken card, haptic.
   Sound off until a tap. Mic off until a second tap.
   NO_FORCE · HOST_SAFE · CLEANUP_FIRST · TRUTH_OR_NOTHING */
(function (w) {
  "use strict";
  var VERSION = "sense-2026-09-01";
  var ctx = null;
  var master = null;
  var pad = null;
  var armed = false;
  var voiceOn = false;
  var lastSpeak = "";
  var lastSpeakAt = 0;
  var rec = null;
  var listening = false;

  function reduce() {
    return w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function muted() {
    try { return w.localStorage.getItem("dc_field_mute") === "1"; } catch (e) { return false; }
  }
  function canHaptic() {
    return !reduce() && typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  }
  function haptic(kind) {
    if (!canHaptic()) return;
    var map = {
      tap: [12],
      enter: [8, 30, 16],
      confirm: [18, 40, 18, 40, 28],
      back: [10, 20, 10]
    };
    try { navigator.vibrate(map[kind] || map.tap); } catch (e) {}
  }
  function ensureCtx() {
    if (ctx) return ctx;
    var AC = w.AudioContext || w.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    return ctx;
  }
  function tone(freq, dur, gain, type) {
    if (!armed || muted() || !ensureCtx()) return;
    if (ctx.state === "suspended") ctx.resume();
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    g.gain.value = 0;
    osc.connect(g); g.connect(master);
    var now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(gain || 0.035, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, now + (dur || 0.18));
    osc.start(now);
    osc.stop(now + (dur || 0.18) + 0.04);
  }
  function startPad() {
    if (!armed || muted() || pad || !ensureCtx()) return;
    if (ctx.state === "suspended") ctx.resume();
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 92;
    g.gain.value = 0.012;
    osc.connect(g); g.connect(master);
    osc.start();
    pad = { osc: osc, g: g };
    master.gain.setTargetAtTime(1, ctx.currentTime, 0.08);
  }
  function stopPad() {
    if (!pad || !ctx) return;
    try {
      pad.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
      pad.osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
    pad = null;
  }
  function speak(text) {
    if (!armed || !voiceOn || muted()) return;
    if (!w.speechSynthesis) return;
    var t = String(text || "").replace(/\s+/g, " ").trim();
    if (!t || t.length > 180) return;
    var now = Date.now();
    if (t === lastSpeak && now - lastSpeakAt < 900) return;
    lastSpeak = t; lastSpeakAt = now;
    try { w.speechSynthesis.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(t);
    u.rate = 0.96; u.pitch = 0.92; u.volume = 0.9;
    u.lang = "en-CA";
    w.speechSynthesis.speak(u);
    tone(220, 0.09, 0.02);
    haptic("enter");
  }
  function arm() {
    if (reduce()) return { ok: false, reason: "REDUCED" };
    armed = true;
    voiceOn = true;
    try { w.localStorage.setItem("dc_field_mute", "0"); } catch (e) {}
    ensureCtx();
    if (ctx && ctx.state === "suspended") ctx.resume();
    startPad();
    tone(164, 0.16, 0.04);
    haptic("confirm");
    speak("Sound is on. Same hall. Same door.");
    paint();
    return { ok: true };
  }
  function disarm() {
    armed = false;
    voiceOn = false;
    stopListen();
    stopPad();
    try { if (w.speechSynthesis) w.speechSynthesis.cancel(); } catch (e) {}
    if (ctx && ctx.state !== "closed") {
      try { master.gain.setTargetAtTime(0, ctx.currentTime, 0.05); } catch (e2) {}
    }
    haptic("back");
    paint();
    return { ok: true };
  }
  function hear(text) {
    var t = String(text || "").toLowerCase();
    if (/(shut up|be quiet|sound off|stop talking|mute)/i.test(t)) return disarm();
    if (/(sound on|talk again|keep going)/i.test(t)) return arm();
    return { ok: false, reason: "NO_COMMAND" };
  }
  function listen() {
    if (!armed) return { ok: false, reason: "NOT_ARMED" };
    var Rec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Rec) return { ok: false, reason: "NO_RECOGNITION" };
    if (listening) return { ok: true, already: true };
    rec = new Rec();
    rec.lang = "en-CA";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = function (ev) {
      var last = ev.results[ev.results.length - 1];
      if (last && last[0]) hear(last[0].transcript);
    };
    rec.onend = function () {
      if (listening && armed) {
        try { rec.start(); } catch (e) {}
      }
    };
    try { rec.start(); listening = true; } catch (e2) { return { ok: false }; }
    return { ok: true };
  }
  function stopListen() {
    listening = false;
    if (rec) {
      try { rec.onend = null; rec.stop(); } catch (e) {}
      rec = null;
    }
  }
  function askMic() {
    if (!armed) arm();
    var media = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    if (!media) return Promise.resolve(listen());
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      stream.getTracks().forEach(function (tr) { tr.stop(); });
      return listen();
    }).catch(function () { return { ok: false, reason: "MIC_DENIED" }; });
  }
  function paint() {
    var on = document.getElementById("sense-on");
    var off = document.getElementById("sense-off");
    var note = document.getElementById("sense-note") || document.getElementById("unity-note");
    if (on) on.textContent = armed ? "Sound is on" : "Open sound";
    if (off) off.hidden = !armed;
    if (note) note.textContent = armed
      ? "This device is talking. Say quiet, or tap quiet. Nothing is uploaded."
      : "Sound is off until you ask. Looking does not require it.";
  }
  function bindHall() {
    var table = document.getElementById("seat-table");
    if (!table || table._senseBound) return;
    table._senseBound = true;
    table.addEventListener("pointerover", function (ev) {
      var card = ev.target.closest(".seat-card");
      if (!card || !armed) return;
      var talk = table.querySelector(".seat-talk");
      if (talk) speak(talk.textContent);
      else {
        var wEl = card.querySelector(".seat-word");
        var hEl = card.querySelector(".seat-hint");
        speak(((wEl && wEl.textContent) || "") + ". " + ((hEl && hEl.textContent) || ""));
      }
    });
    table.addEventListener("click", function (ev) {
      if (ev.target.closest("[data-back]")) { haptic("back"); tone(140, 0.1, 0.02); return; }
      if (ev.target.closest(".seat-card")) { haptic("enter"); tone(196, 0.12, 0.03); }
    });
  }
  function inject() {
    if (document.getElementById("sense-dock")) { paint(); bindHall(); return; }
    var dock = document.createElement("div");
    dock.id = "sense-dock";
    dock.innerHTML = '<button class="act" type="button" id="sense-on">Open sound</button>' +
      '<button class="act ghost" type="button" id="sense-off" hidden>Quiet</button>' +
      '<button class="act ghost" type="button" id="sense-mic">Listen for quiet</button>' +
      '<p class="note" id="sense-note">Sound is off until you ask. Looking does not require it.</p>';
    var host = document.getElementById("stop-1") || document.querySelector(".seat-stage") || document.querySelector(".site");
    if (host) host.appendChild(dock);
    document.getElementById("sense-on").addEventListener("click", function () {
      if (armed) disarm(); else arm();
    });
    document.getElementById("sense-off").addEventListener("click", disarm);
    document.getElementById("sense-mic").addEventListener("click", function () {
      askMic().then(function (res) {
        var note = document.getElementById("sense-note");
        if (note) note.textContent = res && res.ok
          ? "Listening on this device only. Say quiet to stop."
          : "Microphone refused. Use the Quiet button.";
      });
    });
    var unity = document.getElementById("unity-btn");
    if (unity) {
      unity.textContent = "Open sound";
      unity.addEventListener("click", function (ev) { ev.preventDefault(); arm(); });
    }
    paint(); bindHall();
  }
  function cleanup() {
    stopListen();
    stopPad();
    try { if (w.speechSynthesis) w.speechSynthesis.cancel(); } catch (e) {}
  }
  w.addEventListener("pagehide", cleanup);
  w.addEventListener("visibilitychange", function () {
    if (document.hidden) cleanup();
    else if (armed) startPad();
  });
  w.DCSense = { version: VERSION, arm: arm, disarm: disarm, speak: speak, haptic: haptic, hear: hear, askMic: askMic };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject);
  else inject();
})(typeof window !== "undefined" ? window : globalThis);
