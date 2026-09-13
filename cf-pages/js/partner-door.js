/**
 * Partner-door AV sleeve — Hear / Greet on residual, finance, and house pages.
 * Jacket only. Does not write PII. NO_FORCE: audio starts on a tap.
 * VERSION partner-door-2026-09-01
 */
(function (w) {
  var GREET = {
    "partners.html": "I'm Iris. These doors are invitations. Dualis hosts the ruler. The kitchens and the wards stay theirs.",
    "tomassos.html": "I'm Iris. Tomasso's is a Belleville kitchen. Dualis measures leftover. It does not take the keys.",
    "jims.html": "I'm Iris. Jim's is the second kitchen of the same house. Same ruler. Different tickets.",
    "hpedsb.html": "I'm Iris. Hastings and Prince Edward. Thirty-eight schools. We read the public books. We do not invent a thirteen million dollar save.",
    "qhc.html": "I'm Iris. Quinte Health. Four hospitals. No patient file lives on this site.",
    "ontario.html": "I'm Iris. Ontario is the first scale above a single board. Looking costs nothing.",
    "canada.html": "I'm Iris. Canada door. A Belleville company. PIPEDA. Zero retained names.",
    "residual-law.html": "I'm Iris. Every decision leaves a leftover. See it before you lock a door.",
    "finance.html": "I'm Iris. Money is a receipt. Loss is a leftover. This page is not a share.",
    "look.html": "I'm Iris. Looking is free. A first talk is free. A seat hash stays on this device."
  };

  var SEAT = {
    "tomassos.html": "shop",
    "jims.html": "shop",
    "hpedsb.html": "school",
    "qhc.html": "clinic",
    "ontario.html": "province",
    "canada.html": "country",
    "finance.html": "firm",
    "partners.html": "visitor",
    "residual-law.html": "visitor",
    "look.html": "visitor"
  };

  function page() {
    try {
      return (location.pathname.split("/").pop() || "").toLowerCase();
    } catch (e) {
      return "";
    }
  }

  function ensureBar() {
    if (document.getElementById("hear")) return;
    var host = document.querySelector(".site header") || document.querySelector(".site") || document.body;
    var bar = document.createElement("div");
    bar.className = "avbar";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Iris voice");
    bar.innerHTML =
      '<button type="button" id="hear" class="on" aria-pressed="true">Hear</button>' +
      '<button type="button" id="greet">Iris greet</button>' +
      '<a class="avlink" href="onboard.html?seat=' + (SEAT[page()] || "visitor") + '">Seat</a>';
    var lede = document.querySelector(".lede");
    if (lede && lede.parentNode) lede.parentNode.insertBefore(bar, lede);
    else host.appendChild(bar);
  }

  function bind() {
    var hear = document.getElementById("hear");
    var greet = document.getElementById("greet");
    if (hear && !hear._dcBound) {
      hear._dcBound = true;
      hear.addEventListener("click", function () {
        var on = hear.classList.toggle("on");
        hear.setAttribute("aria-pressed", on ? "true" : "false");
        if (!on && w.speechSynthesis) speechSynthesis.cancel();
        if (!on && w.DSAP && DSAP.stop) DSAP.stop();
      });
    }
    if (greet && !greet._dcBound) {
      greet._dcBound = true;
      greet.addEventListener("click", function () {
        var line = GREET[page()] || "I'm Iris. Looking is free. A seat hash stays on this device.";
        if (w.IrisAV && IrisAV.greet) IrisAV.greet(line);
        else if (w.speechSynthesis) {
          var u = new SpeechSynthesisUtterance(line);
          speechSynthesis.cancel();
          speechSynthesis.speak(u);
        }
      });
    }
  }

  function boot() {
    ensureBar();
    bind();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  w.DCPartnerDoor = { version: "partner-door-2026-09-01", greet: GREET, seat: SEAT };
})(window);
