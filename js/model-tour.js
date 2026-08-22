/**
 * DualisCapax model tour — 12s section spots
 * Consistent logo · narrator (male/female toggle) · path-aware pace
 */
(function () {
  var STEPS = [
    {
      id: "open",
      title: "Open",
      line: "Research free. Full clinical surface. No Fusion Meter required to learn.",
      voice: {
        default: "Open the journals. Read without a ticket. DualisCapax starts with information, not a paywall.",
        healthcare:
          "Open the clinical surface. Ask what standard care still cannot answer — then read the tables without buying depth.",
        engineering:
          "Open layer: public surface only. No auth, no Fusion Meter. Deterministic content delivery."
      }
    },
    {
      id: "prove",
      title: "Prove",
      line: "Boundary first: settlement and identity before Adaptive depth.",
      voice: {
        default:
          "Prove in. Money and identity meet at the white ledger — then the door to depth can open.",
        healthcare:
          "Before Adaptive depth, we verify a real participant. Clinical seriousness starts at the boundary.",
        engineering:
          "Prove: signed intake, KYC gate, then black mint. No depth without boundary events."
      }
    },
    {
      id: "depth",
      title: "Depth",
      line: "Adaptive AI and sandbox sim. Fusion Meter pays real session cost.",
      voice: {
        default:
          "Depth is Adaptive compute. Fusion Meter burns with the cost of the run — not a souvenir token.",
        healthcare:
          "Depth is where what-if meets data. Sandbox simulation is analysis — not a claim that production math is on the page.",
        engineering:
          "Depth operator: metered Adaptive runtime. Burn Fusion Meter proportional to measured cost."
      }
    },
    {
      id: "seal",
      title: "Seal",
      line: "IP and production math stay on the black ledger.",
      voice: {
        default:
          "Seal holds the core. What you explore in Open stays complete. What is sealed stays sealed.",
        healthcare:
          "The sealed core is not hidden care data — journals stay complete. Method and production systems stay sealed.",
        engineering:
          "Seal: encrypted black store. Production operators never exposed on the public surface."
      }
    },
    {
      id: "fm",
      title: "Fusion Meter",
      line: "Closed prepaid pay-down. Not an open-market coin.",
      voice: {
        default: "Fusion Meter covers the session. Cost-first. The plane stays solvent.",
        healthcare:
          "Fusion Meter pays for computational depth around questions like ALS — not for access to basic published clinical facts.",
        engineering: "Fusion Meter: closed credit. Mint on settlement. Burn on cost. No public order book."
      }
    },
    {
      id: "dual",
      title: "Dual capacity",
      line: "Enterprise funds the plane. Individuals keep Open access.",
      voice: {
        default:
          "Capacity for enterprise. Open for everyone who comes to learn. Two doors, one plane.",
        healthcare:
          "Enterprise capacity keeps research compute alive so grassroots readers still reach Open journals.",
        engineering:
          "Dual capacity: enterprise residual funding; individual Open path rate-limited but free of Fusion Meter."
      }
    },
    {
      id: "clock",
      title: "Singularity clock",
      line: "Plane residual progress — not your wallet.",
      voice: {
        default:
          "The clock tracks residual runway. Fusion Meter tracks your session. Side by side — not the same balance.",
        healthcare:
          "The clock is plane health, not a promise about a single disease timeline.",
        engineering:
          "Singularity clock: residual progress metric. Orthogonal to Fusion Meter balance."
      }
    },
    {
      id: "unity",
      title: "Unity",
      line: "Truth and Unity Prevail. Same mathematics. Computational analysis.",
      voice: {
        default:
          "No monopoly on meaning. Another way to look at the same mathematics — built to analyze, not to preach.",
        healthcare:
          "We do not claim a mystical cure narrative. We claim better questions, clearer tables, and cost-honest Adaptive tools.",
        engineering:
          "Unity as system coherence: one operator law across Open, Prove, Depth, and Seal."
      }
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
  var voiceBtns = root.querySelectorAll("[data-voice]");

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
    var text = lineFor(step);
    window.DCTourVoice.speak(text, { gender: window.DCTourVoice.getGender() });
  }

  function show(idx) {
    i = (idx + STEPS.length) % STEPS.length;
    var s = STEPS[i];
    if (titleEl) titleEl.textContent = s.title;
    if (lineEl) lineEl.textContent = s.line;
    if (stepEl) stepEl.textContent = i + 1 + " / " + STEPS.length;
    if (video) {
      video.src = "assets/tour/" + s.id + ".mp4";
      video.poster = "assets/tour/" + s.id + ".jpg";
      video.load();
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
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
