/** DualisCapax steersman. Wiener loop on this device.
    Target required. Error is the next input. Max steps then halt.
    NO_FORCE · HOST_SAFE · CLEANUP_FIRST · TRUTH_OR_NOTHING */
(function (w) {
  "use strict";
  var VERSION = "droid-2026-09-01";
  var MAX = 24;
  var EPS = 0.6;
  var GAIN = 0.38;
  var timer = null;
  var state = null;

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function paint(el, s) {
    if (!el) return;
    var tBar = el.querySelector("[data-target]");
    var aBar = el.querySelector("[data-actual]");
    var talk = el.querySelector("[data-talk]");
    var steps = el.querySelector("[data-steps]");
    if (tBar) tBar.style.width = Math.max(0, Math.min(100, s.target)) + "%";
    if (aBar) aBar.style.width = Math.max(0, Math.min(100, s.actual)) + "%";
    if (steps) steps.textContent = s.step + " / " + MAX;
    if (!talk) return;
    if (s.halt === "NO_TARGET") talk.textContent = "No target. I will not burn the grid for a blank aim.";
    else if (s.halt === "DONE") talk.textContent = "Miss is " + s.error.toFixed(1) + ". Close enough. I stop.";
    else if (s.halt === "FUSE") talk.textContent = "Fuse. " + MAX + " steps. Miss still " + s.error.toFixed(1) + ". I do not invent a finish.";
    else talk.textContent = "Aim " + s.target.toFixed(0) + ". Now " + s.actual.toFixed(1) + ". Miss " + s.error.toFixed(1) + ". Steering.";
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
    paint(state.root, state);
    if (state.halt) stop();
  }

  function arm(root, targetRaw) {
    stop();
    var target = Number(targetRaw);
    state = {
      root: root,
      target: target,
      actual: 8 + Math.random() * 22,
      error: 0,
      step: 0,
      halt: null
    };
    if (!isFinite(target) || target < 0 || target > 100 || String(targetRaw).trim() === "") {
      state.halt = "NO_TARGET";
      state.target = 0;
      state.actual = 0;
      state.error = 0;
      paint(root, state);
      return { ok: false, reason: "NO_TARGET" };
    }
    state.error = state.target - state.actual;
    paint(root, state);
    timer = setInterval(tick, 220);
    return { ok: true, version: VERSION };
  }

  function bind(root) {
    if (!root || root._droidBound) return;
    root._droidBound = true;
    var input = root.querySelector("[data-aim]");
    var go = root.querySelector("[data-go]");
    var cut = root.querySelector("[data-cut]");
    if (go) go.addEventListener("click", function () { arm(root, input ? input.value : ""); });
    if (cut) cut.addEventListener("click", function () {
      stop();
      if (state) { state.halt = "FUSE"; paint(root, state); }
    });
    if (input) input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") arm(root, input.value);
    });
    w.addEventListener("pagehide", stop);
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); });
  }

  w.DCDroid = { version: VERSION, arm: arm, stop: stop, bind: bind, MAX: MAX };
})(typeof window !== "undefined" ? window : globalThis);
