/**
 * Dualis Ice — nearest-ruler skills panel (additive).
 * Does not replace ice-portal.js Me clocks / meAlikePct.
 * cite-ready NONE. Never invent EDGE/Sportlogiq. Never destiny.
 */
(function (g) {
  "use strict";
  var SEAT_KEY = "dc.ice.seat";
  var ARCH_KEY = "dc.ice.me.archetype";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function lsJson(k) {
    try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; }
  }
  function isDomSeat(seat) {
    return !!(seat && Number(seat.jersey) === 29 &&
      String(seat.last || "").toLowerCase().indexOf("di genova") !== -1);
  }
  function skillsFor(seat, arch) {
    arch = arch || {};
    var powerF = /power\s*f/i.test(String(arch.style || ""));
    var row = {
      cite_ready: "NONE",
      nearest_ruler: "",
      akin_to: "",
      not_akin: "Gretzky vision 1.000 unless tape says otherwise",
      train_toward: "",
      rewrite_if: "Tape stamps next_node (look-off, extra beat, occupied square) or a different axis.",
      skills: [
        { axis: "vision", ruler: "Gretzky", status: "EMPTY", note: "Not the spine until Eyes stamps next_node." },
        { axis: "shot_power", ruler: "MacInnis / Iafrate / Chara", status: "EMPTY", note: "Axis only — not an identity claim." },
        { axis: "d_mobility", ruler: "Orr", status: "n/a", note: "Orr axis is for D seats." },
        { axis: "recover_finish", ruler: "Henderson / McCarty", status: "EMPTY", note: "Await tape." }
      ]
    };
    var pos = String((seat && seat.pos) || arch.pos || "").toUpperCase();
    if (/\bD\b|DEFEN/.test(pos)) {
      row.skills[2].status = "EMPTY";
      row.skills[2].note = "D seat — Orr axis is live and EMPTY until tape.";
    }
    if (isDomSeat(seat)) {
      row.nearest_ruler = "shot_power";
      row.akin_to = "Developing power forward — shot in traffic, puck protection";
      row.not_akin = "Gretzky vision / scoring 1.000";
      row.train_toward = "Push shot impact + Power F tools. Do not train as a playmaking-center poster.";
      row.rewrite_if = "If tape shows look-off / extra-beat / occupied next square, move vision off EMPTY and reconsider the spine.";
      row.skills[1].status = "cited-echo";
      row.skills[1].note = "NCSA: above-average shot. Marker axis = MacInnis / Iafrate / Chara. Distance EMPTY (no gun, no EDGE).";
      row.skills[0].note = "Not akin to Gretzky on vision. Keep EMPTY. Train the nearer path.";
      if (powerF) row.skills[3].note = "Power F recover-and-finish is the cousin axis — still EMPTY until tape.";
    } else if (powerF) {
      row.nearest_ruler = "shot_power";
      row.akin_to = "Power F (style echo)";
      row.train_toward = "Shot impact and protection — not Gretzky vision unless tape rewrites.";
    }
    return row;
  }
  function panelHtml(sk) {
    var rows = (sk.skills || []).map(function (x) {
      var stClass = String(x.status || "EMPTY").replace(/[^A-Za-z0-9]+/g, "-");
      return '<div class="ice-skill-row">' +
        '<span class="ice-skill-axis">' + esc(x.axis) + "</span>" +
        '<span class="ice-skill-ruler">' + esc(x.ruler) + "</span>" +
        '<span class="ice-skill-st st-' + esc(stClass) + '">' + esc(x.status || "EMPTY") + "</span>" +
        '<span class="ice-skill-note">' + esc(x.note || "") + "</span></div>";
    }).join("");
    var path = sk.nearest_ruler
      ? ('<p class="ice-skill-path"><strong>Train toward</strong> ' + esc(sk.akin_to || sk.nearest_ruler) +
         ". <em>Not akin:</em> " + esc(sk.not_akin || "") + "</p>")
      : '<p class="ice-skill-path">Nearest ruler EMPTY — identify a skill before choosing a path.</p>';
    return '<section class="ice-skills" aria-label="Skill rulers">' +
      '<h2 class="ice-skills-h">Skills · rulers</h2>' +
      '<p class="ice-skills-sub">One skill, one marker. cite-ready ' + esc(sk.cite_ready) + ".</p>" +
      path +
      '<div class="ice-skill-table">' + rows + "</div>" +
      (sk.train_toward ? ('<p class="ice-skill-train">' + esc(sk.train_toward) + "</p>") : "") +
      (sk.rewrite_if ? ('<p class="ice-skill-rewrite"><span>Rewrite if</span> ' + esc(sk.rewrite_if) + "</p>") : "") +
    "</section>";
  }
  function inject() {
    var stage = document.getElementById("iceStage");
    if (!stage) return;
    if (!document.getElementById("meHdbForm") && !stage.querySelector(".ice-me-dims")) return;
    if (stage.querySelector(".ice-skills")) return;
    var seat = lsJson(SEAT_KEY) || {};
    var arch = lsJson(ARCH_KEY) || {};
    var wrap = document.createElement("div");
    wrap.innerHTML = panelHtml(skillsFor(seat, arch));
    var node = wrap.firstChild;
    var form = document.getElementById("meHdbForm");
    if (form && form.parentNode) form.parentNode.insertBefore(node, form);
    else stage.appendChild(node);
  }
  function boot() {
    var stage = document.getElementById("iceStage");
    if (stage && typeof MutationObserver !== "undefined") {
      new MutationObserver(function () { inject(); }).observe(stage, { childList: true, subtree: true });
    }
    inject();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  g.DCIceSkills = { skillsFor: skillsFor };
})(typeof window !== "undefined" ? window : this);
