/** Iris steersman. Pure logic loop on this device.
    Target required. Error is next input. Age = closed aims here.
    Voice chat agent is optional. DCLM veto is not. */
(function (w) {
  "use strict";
  var VERSION = "droid-iris-2026-09-01";
  var MAX = 24;
  var EPS = 0.6;
  var GAIN = 0.38;
  var AGE_KEY = "dc_iris_age_v1";
  var timer = null;
  var state = null;
  var voiceOn = false;
  var lastLine = "";

  function loadAge() {
    try {
      var raw = JSON.parse(localStorage.getItem(AGE_KEY) || "null");
      if (raw && typeof raw.closed === "number") return raw;
    } catch (e) {}
    return { closed: 0, refused: 0, fuses: 0 };
  }
  function saveAge(a) {
    try { localStorage.setItem(AGE_KEY, JSON.stringify(a)); } catch (e) {}
  }
  function bump(kind) {
    var a = loadAge();
    if (kind === "DONE") a.closed += 1;
    else if (kind === "FUSE") a.fuses += 1;
    else if (kind === "NO_TARGET") a.refused += 1;
    saveAge(a);
    return a;
  }
  function ageLine() {
    var a = loadAge();
    return "Iris · " + a.closed + " closed · " + a.fuses + " fuses · this device";
  }
  function coat(line) {
    var a = loadAge();
    if (a.closed >= 12) return line;
    if (a.closed >= 4) return line;
    return line;
  }
  function speak(text) {
    lastLine = String(text || "");
    if (!voiceOn || !lastLine || !w.speechSynthesis) return;
    try { w.speechSynthesis.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(lastLine);
    u.rate = 0.98; u.pitch = 0.94; u.lang = "en-CA";
    w.speechSynthesis.speak(u);
  }
  function stopVoice() {
    try { if (w.speechSynthesis) w.speechSynthesis.cancel(); } catch (e) {}
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }
  function lineFor(s) {
    if (s.halt === "NO_TARGET") return "No target. I will not burn the grid for a blank aim.";
    if (s.halt === "DONE") return "Miss is " + s.error.toFixed(1) + ". Close enough. I stop.";
    if (s.halt === "FUSE") return "Fuse. " + MAX + " steps. Miss still " + s.error.toFixed(1) + ". I do not invent a finish.";
    return "Aim " + s.target.toFixed(0) + ". Now " + s.actual.toFixed(1) + ". Miss " + s.error.toFixed(1) + ". Steering.";
  }
  function paint(el, s) {
    if (!el) return;
    var tBar = el.querySelector("[data-target]");
    var aBar = el.querySelector("[data-actual]");
    var talk = el.querySelector("[data-talk]");
    var steps = el.querySelector("[data-steps]");
    var who = document.getElementById("who") || el.querySelector("[data-who]");
    if (tBar) tBar.style.width = Math.max(0, Math.min(100, s.target)) + "%";
    if (aBar) aBar.style.width = Math.max(0, Math.min(100, s.actual)) + "%";
    if (steps) steps.textContent = s.step + " / " + MAX;
    if (who) who.textContent = ageLine();
    var text = coat(lineFor(s));
    if (talk) talk.textContent = text;
    if (s.halt || s.step === 1 || s.step % 6 === 0) speak(text);
  }
  function tick() {
    if (!state || state.halt) { stop(); return; }
    state.step += 1;
    state.error = state.target - state.actual;
    state.actual += GAIN * state.error + (Math.random() - 0.5) * 1.4;
    if (state.actual < 0) state.actual = 0;
    if (state.actual > 100) state.actual = 100;
    state.error = state.target - state.actual;
    if (Math.abs(state.error) <= EPS) state.halt = "DONE";
    else if (state.step >= MAX) state.halt = "FUSE";
    if (state.halt) bump(state.halt);
    paint(state.root, state);
    if (state.halt) stop();
  }
  function arm(root, targetRaw) {
    stop();
    var target = Number(targetRaw);
    state = { root: root, target: target, actual: 8 + Math.random() * 22, error: 0, step: 0, halt: null };
    if (!isFinite(target) || target < 0 || target > 100 || String(targetRaw).trim() === "") {
      state.halt = "NO_TARGET"; state.target = 0; state.actual = 0; state.error = 0;
      bump("NO_TARGET"); paint(root, state); return { ok: false, reason: "NO_TARGET" };
    }
    state.error = state.target - state.actual;
    paint(root, state);
    timer = setInterval(tick, 220);
    return { ok: true, version: VERSION };
  }
  function status() {
    var a = loadAge();
    var s = state || {};
    return {
      version: VERSION,
      age: a,
      target: s.target,
      actual: s.actual,
      error: s.error,
      step: s.step || 0,
      halt: s.halt || null,
      last: lastLine
    };
  }
  async function askIris(text) {
    var t = String(text || "").trim();
    if (!t) return { spoken: "Ask a real question, or set an aim." };
    if (w.DCLMLook && DCLMLook.scanVeto) {
      var veto = DCLMLook.scanVeto(t);
      if (veto) return { spoken: veto.reason + " Ask something else.", grant: "VETO" };
    }
    if (/\b(aim|steer|miss|fuse|target|loop|droid|age|how old)\b/i.test(t)) {
      var st = status();
      var spoken = ageLine() + ". ";
      if (st.halt === "NO_TARGET" || st.target == null) spoken += "No aim set. Give me a number from 0 to 100.";
      else spoken += lineFor({
        target: st.target || 0,
        actual: st.actual || 0,
        error: st.error || 0,
        halt: st.halt,
        step: st.step
      });
      speak(spoken);
      return { spoken: spoken, grant: "MEASURE" };
    }
    if (w.DCLMLook && typeof DCLMLook.greet === "function") {
      var g = DCLMLook.greet(t);
      if (g) { speak(g); return { spoken: g, grant: "MEASURE" }; }
    }
    if (w.IrisLive && typeof IrisLive.run === "function") {
      var recu = await IrisLive.run(t, { voice: "you", last: lastLine });
      var spoken = (recu && recu.spoken) ? recu.spoken : "I'm Iris. Ask about the aim, or DualisCapax.";
      speak(spoken);
      return recu || { spoken: spoken };
    }
    if (w.DCLMLook && typeof DCLMLook.run === "function") {
      var rec2 = await DCLMLook.run(t, { voice: "you", last: lastLine });
      speak(rec2 && rec2.spoken ? rec2.spoken : lastLine);
      return rec2;
    }
    var fallback = "I'm Iris. Logic first. Set an aim or ask a short question.";
    speak(fallback);
    return { spoken: fallback };
  }
  function setVoice(on) {
    voiceOn = !!on;
    if (!voiceOn) stopVoice();
    else if (lastLine) speak(lastLine);
    var btn = document.getElementById("droid-voice");
    if (btn) {
      btn.textContent = voiceOn ? "Sound is on" : "Open sound";
      btn.setAttribute("aria-pressed", voiceOn ? "true" : "false");
    }
    return voiceOn;
  }
  function bind(root) {
    if (!root || root._droidBound) return;
    root._droidBound = true;
    var input = root.querySelector("[data-aim]");
    var go = root.querySelector("[data-go]");
    var cut = root.querySelector("[data-cut]");
    var ask = root.querySelector("[data-ask]");
    var askBtn = root.querySelector("[data-ask-go]");
    var voiceBtn = document.getElementById("droid-voice");
    var who = document.getElementById("who") || root.querySelector("[data-who]");
    if (who) who.textContent = ageLine();
    if (go) go.addEventListener("click", function () { arm(root, input ? input.value : ""); });
    if (cut) cut.addEventListener("click", function () {
      stop();
      if (state && !state.halt) { state.halt = "FUSE"; bump("FUSE"); paint(root, state); }
      else if (state) paint(root, state);
    });
    if (input) input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") arm(root, input.value);
    });
    if (askBtn && ask) askBtn.addEventListener("click", function () {
      askIris(ask.value).then(function (res) {
        var talk = root.querySelector("[data-talk]");
        if (talk && res && res.spoken) talk.textContent = res.spoken;
        ask.value = "";
      });
    });
    if (ask) ask.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (askBtn) askBtn.click();
      }
    });
    if (voiceBtn) voiceBtn.addEventListener("click", function () { setVoice(!voiceOn); });
    w.addEventListener("pagehide", function () { stop(); stopVoice(); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stop(); stopVoice(); }
    });
  }
  w.DCDroid = {
    version: VERSION,
    arm: arm,
    stop: stop,
    bind: bind,
    askIris: askIris,
    setVoice: setVoice,
    status: status,
    ageLine: ageLine,
    MAX: MAX
  };
})(typeof window !== "undefined" ? window : globalThis);
