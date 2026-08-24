/**
 * DualisCapax model tour — video when present, canvas residual fallback when not
 */
(function () {
  var STEPS = [
    { id: "open", title: "Open", line: "Research free. Full clinical surface. No Fusion Meter required to learn.",
      voice: { default: "Open the journals. Read without a ticket. DualisCapax starts with information, not a paywall.",
        healthcare: "Open the clinical surface. Ask what standard care still cannot answer — then read the tables without buying depth.",
        engineering: "Open layer: public surface only. No auth, no Fusion Meter. Deterministic content delivery." } },
    { id: "prove", title: "Prove", line: "Boundary first: settlement and identity before Adaptive depth.",
      voice: { default: "Prove in. Money and identity meet at the white ledger — then the door to depth can open.",
        healthcare: "Before Adaptive depth, we verify a real participant. Clinical seriousness starts at the boundary.",
        engineering: "Prove: signed intake, KYC gate, then black mint. No depth without boundary events." } },
    { id: "depth", title: "Depth", line: "Adaptive AI and sandbox sim. Fusion Meter pays real session cost.",
      voice: { default: "Depth is Adaptive compute. Fusion Meter burns with the cost of the run — not a souvenir token.",
        healthcare: "Depth is where what-if meets data. Sandbox simulation is analysis — not a claim that production math is on the page.",
        engineering: "Depth operator: metered Adaptive runtime. Burn Fusion Meter proportional to measured cost." } },
    { id: "seal", title: "Seal", line: "IP and production math stay on the black ledger.",
      voice: { default: "Seal holds the core. What you explore in Open stays complete. What is sealed stays sealed.",
        healthcare: "The sealed core is not hidden care data — journals stay complete. Method and production systems stay sealed.",
        engineering: "Seal: encrypted black store. Production operators never exposed on the public surface." } },
    { id: "fm", title: "Fusion Meter", line: "Closed prepaid pay-down. Not an open-market coin.",
      voice: { default: "Fusion Meter covers the session. Cost-first. The plane stays solvent.",
        healthcare: "Fusion Meter pays for computational depth around questions like ALS — not for access to basic published clinical facts.",
        engineering: "Fusion Meter: closed credit. Mint on settlement. Burn on cost. No public order book." } },
    { id: "dual", title: "Dual capacity", line: "Enterprise funds the plane. Individuals keep Open access.",
      voice: { default: "Capacity for enterprise. Open for everyone who comes to learn. Two doors, one plane.",
        healthcare: "Enterprise capacity keeps research compute alive so grassroots readers still reach Open journals.",
        engineering: "Dual capacity: enterprise residual funding; individual Open path rate-limited but free of Fusion Meter." } },
    { id: "clock", title: "Singularity clock", line: "Plane residual progress — not your wallet.",
      voice: { default: "The clock tracks residual runway. Fusion Meter tracks your session. Side by side — not the same balance.",
        healthcare: "The clock is plane health, not a promise about a single disease timeline.",
        engineering: "Singularity clock: residual progress metric. Orthogonal to Fusion Meter balance." } },
    { id: "unity", title: "Unity", line: "Truth and Unity Prevail. Same mathematics. Computational analysis.",
      voice: { default: "No monopoly on meaning. Another way to look at the same mathematics — built to analyze, not to preach.",
        healthcare: "We do not claim a mystical cure narrative. We claim better questions, clearer tables, and cost-honest Adaptive tools.",
        engineering: "Unity as system coherence: one operator law across Open, Prove, Depth, and Seal." } }
  ];

  var i = 0;
  var root = document.getElementById("tour-root");
  if (!root) return;

  var stage = root.querySelector(".tour-stage");
  var video = root.querySelector("video");
  var titleEl = root.querySelector(".tour-title");
  var lineEl = root.querySelector(".tour-line");
  var stepEl = root.querySelector(".tour-step");
  var btnPrev = root.querySelector("[data-tour-prev]");
  var btnNext = root.querySelector("[data-tour-next]");
  var voiceBtns = root.querySelectorAll("[data-voice]");

  var canvas = root.querySelector("canvas.tour-fallback");
  if (!canvas && stage) {
    canvas = document.createElement("canvas");
    canvas.className = "tour-fallback";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "display:none;width:100%;aspect-ratio:16/9;background:#0a0a0a";
    if (video && video.parentNode) video.parentNode.insertBefore(canvas, video.nextSibling);
    else if (stage) stage.insertBefore(canvas, stage.firstChild);
  }
  var raf = 0;

  function pathTone() {
    if (window.DCTourVoice) return window.DCTourVoice.pathKey();
    return "default";
  }
  function lineFor(step) {
    var k = pathTone();
    if (step.voice && step.voice[k]) return step.voice[k];
    if (step.voice && step.voice.default) return step.voice.default;
    return step.line;
  }
  function fadeIn() {
    if (!stage) return;
    stage.classList.remove("is-in");
    void stage.offsetWidth;
    stage.classList.add("is-in");
  }
  function syncVoiceUi() {
    var g = window.DCTourVoice ? window.DCTourVoice.getGender() : "female";
    voiceBtns.forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-voice") === g);
    });
  }
  function narrate(step) {
    if (!window.DCTourVoice) return;
    window.DCTourVoice.speak(lineFor(step), { gender: window.DCTourVoice.getGender() });
  }

  function drawFallback(stepId, title) {
    if (!canvas) return;
    cancelAnimationFrame(raf);
    canvas.style.display = "block";
    if (video) video.style.display = "none";
    var w = canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1) || 1280;
    var h = canvas.height = Math.round(w * 9 / 16);
    var ctx = canvas.getContext("2d");
    var t0 = performance.now();
    function frame(now) {
      var t = (now - t0) / 1000;
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, w, h);
      var cx = w * 0.5, cy = h * 0.48, R = Math.min(w, h) * 0.22;
      ctx.strokeStyle = "rgba(201,162,39,0.85)";
      ctx.lineWidth = Math.max(2, w * 0.003);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      for (var n = 0; n < 80; n++) {
        var a = t * 0.4 + n * 0.79;
        var r = R * (0.35 + (n % 7) * 0.09);
        var x = cx + Math.cos(a) * r;
        var y = cy + Math.sin(a * 1.1) * r * 0.55;
        ctx.fillStyle = "rgba(212,180,60," + (0.25 + (n % 5) * 0.12) + ")";
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.5, w * 0.002), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "600 " + Math.round(w * 0.028) + "px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(title || stepId, cx, cy + R + h * 0.12);
      ctx.fillStyle = "rgba(201,162,39,0.7)";
      ctx.font = "500 " + Math.round(w * 0.014) + "px ui-monospace,monospace";
      ctx.fillText("DUALISCAPAX · residual field", cx, h * 0.92);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  function tryVideo(step) {
    if (!video) { drawFallback(step.id, step.title); return; }
    var settled = false;
    function fail() {
      if (settled) return;
      settled = true;
      drawFallback(step.id, step.title);
    }
    function ok() {
      if (settled) return;
      settled = true;
      cancelAnimationFrame(raf);
      if (canvas) canvas.style.display = "none";
      video.style.display = "block";
    }
    video.onloadeddata = ok;
    video.onerror = fail;
    video.src = "assets/tour/" + step.id + ".mp4";
    video.poster = "assets/tour/" + step.id + ".jpg";
    video.load();
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
    setTimeout(function () {
      if (!settled && (video.readyState < 2 || video.networkState === 3)) fail();
    }, 1200);
  }

  function show(idx) {
    i = (idx + STEPS.length) % STEPS.length;
    var s = STEPS[i];
    if (titleEl) titleEl.textContent = s.title;
    if (lineEl) lineEl.textContent = s.line;
    if (stepEl) stepEl.textContent = i + 1 + " / " + STEPS.length;
    tryVideo(s);
    fadeIn();
    narrate(s);
  }

  if (btnNext) btnNext.addEventListener("click", function () { show(i + 1); });
  if (btnPrev) btnPrev.addEventListener("click", function () { show(i - 1); });
  voiceBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var g = b.getAttribute("data-voice");
      if (window.DCTourVoice) window.DCTourVoice.setGender(g);
      syncVoiceUi();
      narrate(STEPS[i]);
    });
  });
  syncVoiceUi();
  show(0);
})();
