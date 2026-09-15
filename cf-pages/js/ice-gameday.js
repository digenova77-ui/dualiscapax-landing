/**
 * Game stage additive. No fake clock. No invented score.
 * Reads TeamSnap cache if present. Else leaves the hole.
 */
(function () {
  if (window.__DC_ICE_GAMEDAY) return;
  window.__DC_ICE_GAMEDAY = true;
  function nextEvent() {
    try {
      var raw = localStorage.getItem("dc.teamsnap.events");
      if (!raw) return null;
      var ev = JSON.parse(raw);
      if (Array.isArray(ev)) return ev[0] || null;
      return ev;
    } catch (e) {
      return null;
    }
  }
  function paint(root) {
    if (!root) return;
    var n = nextEvent();
    var hole = root.querySelector("[data-gameday-next]");
    if (!hole) return;
    if (!n) {
      hole.textContent = "No next game on this phone yet. TeamSnap fills this. Dualis does not invent it.";
      return;
    }
    var title = n.name || n.title || "Next event";
    var when = n.start_date || n.start || "";
    var loc = n.location_name || n.location || "";
    hole.textContent = [title, when, loc].filter(Boolean).join(" · ");
  }
  document.addEventListener("dc-ice-stage", function (e) {
    if (e && e.detail && e.detail.stage === "game") paint(document.getElementById("iceStage"));
  });
  paint(document.getElementById("iceStage"));
})();
