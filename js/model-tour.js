/**
 * DualisCapax model tour — 12s section spots
 * Fade-in commercial per complexity step on Next.
 * Drop MP4/WebM at assets/tour/<id>.mp4 when ready; poster + copy always work.
 */
(function () {
  var STEPS = [
    {
      id: "open",
      title: "Open",
      line: "Research free. Full clinical surface. No Fusion Meter required to learn.",
      voice: "Open the journals. Read without a ticket. DualisCapax starts with information, not a paywall."
    },
    {
      id: "prove",
      title: "Prove",
      line: "Boundary first: settlement and identity before Adaptive depth.",
      voice: "Prove in. Money and KYC meet at the white ledger — then the door to depth can open."
    },
    {
      id: "depth",
      title: "Depth",
      line: "Adaptive AI and sandbox sim. Fusion Meter pays real session cost.",
      voice: "Depth is Adaptive compute. Fusion Meter burns with the cost of the run — not a souvenir token."
    },
    {
      id: "seal",
      title: "Seal",
      line: "IP and production math stay on the black ledger.",
      voice: "Seal holds the core. What you explore in Open stays complete. What is sealed stays sealed."
    },
    {
      id: "fm",
      title: "Fusion Meter",
      line: "Closed prepaid pay-down. Not an open-market coin.",
      voice: "Fusion Meter covers the session. Cost-first. The plane stays solvent."
    },
    {
      id: "dual",
      title: "Dual capacity",
      line: "Enterprise funds the plane. Individuals keep Open access.",
      voice: "Capacity for enterprise. Open for everyone who comes to learn. Two doors, one plane."
    },
    {
      id: "clock",
      title: "Singularity clock",
      line: "Plane residual progress — not your wallet.",
      voice: "The clock tracks residual runway. Fusion Meter tracks your session. Side by side — not the same balance."
    },
    {
      id: "unity",
      title: "Unity",
      line: "Truth and Unity Prevail. Same mathematics. Computational analysis.",
      voice: "No monopoly on meaning. Another way to look at the same mathematics — built to analyze, not to preach."
    }
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

  function fadeIn() {
    if (!stage) return;
    stage.classList.remove("is-in");
    void stage.offsetWidth;
    stage.classList.add("is-in");
  }

  function show(idx) {
    i = (idx + STEPS.length) % STEPS.length;
    var s = STEPS[i];
    if (titleEl) titleEl.textContent = s.title;
    if (lineEl) lineEl.textContent = s.line;
    if (stepEl) stepEl.textContent = i + 1 + " / " + STEPS.length;
    if (video) {
      var src = "assets/tour/" + s.id + ".mp4";
      video.removeAttribute("src");
      video.poster = "assets/tour/" + s.id + ".jpg";
      // Try media; if missing, poster + copy still carry the commercial
      video.src = src;
      video.load();
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
    fadeIn();
  }

  if (btnNext) btnNext.addEventListener("click", function () { show(i + 1); });
  if (btnPrev) btnPrev.addEventListener("click", function () { show(i - 1); });

  show(0);
})();
