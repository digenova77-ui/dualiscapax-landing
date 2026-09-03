/* DualisCapax plate — header lockup + ledger HUD.
 * Clocks: T-LAUNCH 2026-08-24 00:00 UTC · T-SING-BASE 2036-08-24 00:00 UTC
 * Earned / pledged remain CAD $0 while ACCESS is CLOSED.
 */
(function () {
  var word = document.getElementById("word");
  if (word) {
    var dead = word.querySelector("img.lockup");
    if (dead) dead.remove();
    if (!word.querySelector(".rest")) {
      var s = document.createElement("span");
      s.className = "rest";
      s.textContent = "DualisCapax";
      word.appendChild(s);
    }
  }

  var LAUNCH = Date.UTC(2026, 7, 24, 0, 0, 0);
  var SING = Date.UTC(2036, 7, 24, 0, 0, 0);
  var EARNED = 0;
  var PLEDGED = 0;
  var RATE = 1000;
  var MAX_ADV = 3650;
  var FLOOR_DAYS = 30;

  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function fmtUTC(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
  }
  function age(from, to) {
    var sec = Math.max(0, Math.floor((to - from) / 1000));
    var d = Math.floor(sec / 86400);
    var h = Math.floor((sec % 86400) / 3600);
    var m = Math.floor((sec % 3600) / 60);
    return d + "d " + pad(h) + "h " + pad(m) + "m";
  }
  function singularity() {
    var adv = Math.min(MAX_ADV, Math.floor(PLEDGED / RATE));
    var target = SING - adv * 86400000;
    var floor = Date.now() + FLOOR_DAYS * 86400000;
    if (target < floor) target = floor;
    return target;
  }

  var liveEl = document.getElementById("hud-live");
  var earnedEl = document.getElementById("hud-earned");
  var singEl = document.getElementById("hud-sing");
  var stamp = document.getElementById("stamp");
  var fill = document.getElementById("gauge-fill");
  var read = document.getElementById("gauge-read");
  var irisPct = document.getElementById("iris-pct");

  if (earnedEl) earnedEl.textContent = "CAD $" + EARNED;
  if (stamp && !stamp.getAttribute("data-locked")) {
    stamp.textContent = "SHA \u00b7 storyboard-2026-09-03";
  }

  function paintGauge(n) {
    var v = Math.max(81, Math.min(100, n));
    if (fill) fill.style.strokeDasharray = v + " 100";
    if (read) read.textContent = Math.round(v) + "%";
    if (irisPct) irisPct.textContent = String(Math.round(v));
  }
  paintGauge(81);

  function tick() {
    var now = Date.now();
    if (liveEl) liveEl.textContent = age(LAUNCH, now);
    if (singEl) singEl.textContent = fmtUTC(singularity());
  }
  tick();
  setInterval(tick, 30000);

  window.DCX_PLATE = {
    earned: EARNED,
    pledged: PLEDGED,
    access: "CLOSED",
    launch: LAUNCH,
    singBase: SING,
    paintGauge: paintGauge
  };
})();
