/** DualisCapax medical door.
 *  Open to every qualifying house:
 *    — institutional email on .org
 *    — institutional email on .gov
 *    — ranking affiliate at top SEAL tier (Dualis-issued mark)
 *  Simulation is not treatment. Not a diagnosis. Not a cure.
 */
(function () {
  var KEY = "dc.medical.gate.v1";
  var DOOR = "/research/healthcare/locked.html";
  var ROOT = "/research/healthcare/";

  /* Ranking marks at SEAL tier 1. Bind more here. Never print live wallet keys. */
  var RANKING = {
    "SEAL-1": 1,
    "SEAL-T1": 1,
    "DC-SEAL-1": 1
  };

  function norm(s) {
    return String(s || "").trim().toLowerCase();
  }
  function hostOf(email) {
    var e = norm(email);
    var at = e.lastIndexOf("@");
    if (at < 1 || at === e.length - 1) return "";
    return e.slice(at + 1).replace(/\.+$/, "");
  }
  function isOrg(host) {
    return /(?:^|\.)org(?:\.[a-z]{2})?$/.test(host);
  }
  function isGov(host) {
    return /(?:^|\.)gov(?:\.[a-z]{2})?$/.test(host) || /(?:^|\.)gc\.ca$/.test(host);
  }
  function rankingMark(raw) {
    var m = String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!m) return "";
    if (RANKING[m]) return m;
    var head = m.split(/[\/:_-]/)[0] + (m.indexOf("-") > -1 ? "-" + m.split(/[-_\/:]/)[1] : "");
    if (RANKING[head]) return head;
    if (/^SEAL-?1/.test(m) || /^DC-SEAL-?1/.test(m) || /^SEAL-T1/.test(m)) return m;
    return "";
  }
  function read() {
    try {
      var raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function write(rec) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(rec));
    } catch (e) {}
  }
  function granted() {
    var g = read();
    return !!(g && g.ok && (g.kind === "org" || g.kind === "gov" || g.kind === "affiliate"));
  }
  function decide(email, mark) {
    var host = hostOf(email);
    if (host && isGov(host)) return { ok: true, kind: "gov", host: host };
    if (host && isOrg(host)) return { ok: true, kind: "org", host: host };
    var seal = rankingMark(mark);
    if (seal) return { ok: true, kind: "affiliate", host: host || "rank", seal: seal };
    return { ok: false, kind: "", host: host };
  }

  window.DC_MEDICAL = {
    granted: granted,
    read: read,
    decide: decide,
    open: function (email, org, mark) {
      var d = decide(email, mark);
      if (!d.ok) return d;
      d.org = String(org || "").trim();
      d.email = norm(email);
      d.at = Date.now();
      write(d);
      document.documentElement.classList.add("is-med-open");
      return d;
    }
  };

  if (granted()) document.documentElement.classList.add("is-med-open");

  var depth = document.documentElement.getAttribute("data-medical-depth") === "1";
  if (depth && !granted()) {
    var here = location.pathname.replace(/index\.html$/, "");
    if (here !== ROOT && here !== DOOR && here.indexOf("/research/healthcare/locked") === -1) {
      location.replace(DOOR);
      return;
    }
  }

  function paintGrant() {
    var slot = document.getElementById("med-grant");
    var form = document.getElementById("med-form");
    var rooms = document.getElementById("med-rooms");
    var g = read();
    if (slot && g && g.ok) {
      slot.hidden = false;
      slot.textContent =
        "Door open · " +
        (g.kind === "gov" ? ".gov" : g.kind === "org" ? ".org" : "ranking SEAL") +
        (g.host ? " · " + g.host : "");
    }
    if (form && g && g.ok) form.hidden = true;
    if (rooms && g && g.ok) rooms.hidden = false;
  }

  function ready() {
    paintGrant();
    var form = document.getElementById("med-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (document.getElementById("med-email") || {}).value || "";
      var org = (document.getElementById("med-org") || {}).value || "";
      var mark = (document.getElementById("med-seal") || {}).value || "";
      var note = document.getElementById("med-note");
      var d = window.DC_MEDICAL.open(email, org, mark);
      if (!d.ok) {
        if (note) {
          note.hidden = false;
          note.textContent =
            d.host
              ? d.host + " is not .org or .gov, and no top-SEAL ranking mark matched."
              : "Use a work address on .org or .gov, or a ranking SEAL mark at tier 1.";
        }
        return;
      }
      paintGrant();
      if (location.pathname.indexOf("locked") !== -1) location.replace(ROOT);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
