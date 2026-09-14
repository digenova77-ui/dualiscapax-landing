/**
 * Player Bind on seating = TeamSnap only.
 * Strips leftover Spordle prove buttons / Apps tiles / copy from last-good portal.
 */
(function () {
  function scrub(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('[data-prove="spordle"]').forEach(function (el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    root.querySelectorAll('[data-open-bind="spordle"]').forEach(function (el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    root.querySelectorAll("p, .ice-p, .ice-note, button, a, span").forEach(function (el) {
      if (!el.childNodes || el.childNodes.length !== 1 || el.childNodes[0].nodeType !== 3) return;
      var t = el.textContent || "";
      if (t.indexOf("Continue with Spordle") !== -1 && el.parentNode) {
        el.parentNode.removeChild(el);
        return;
      }
      if (t.indexOf("TeamSnap or Spordle") !== -1) el.textContent = t.replace(/TeamSnap or Spordle/g, "TeamSnap");
      if (t.indexOf("TeamSnap / Spordle") !== -1) el.textContent = t.replace(/TeamSnap \/ Spordle/g, "TeamSnap");
      if (t.indexOf("TeamSnap/Spordle") !== -1) el.textContent = t.replace(/TeamSnap\/Spordle/g, "TeamSnap");
    });
  }
  function boot() {
    var stage = document.getElementById("iceStage");
    var sheet = document.getElementById("iceSheet");
    scrub(document.body);
    if (stage && typeof MutationObserver !== "undefined") {
      new MutationObserver(function () { scrub(stage); if (sheet) scrub(sheet); }).observe(stage, { childList: true, subtree: true });
    }
    if (sheet && typeof MutationObserver !== "undefined") {
      new MutationObserver(function () { scrub(sheet); }).observe(sheet, { childList: true, subtree: true });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  document.addEventListener("dc-ice-portal-ready", boot);
})();
