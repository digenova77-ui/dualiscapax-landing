/** DualisCapax apex hook — R2.
 *  Load AFTER lander scripts. Keeps the five-card template.
 *  02 → engineering Look pane. 04 → medical Look pane. Never ALS body.
 */
(function () {
  var ENG = "/research/doc-pane.html?class=engineering";
  var MED = "/research/doc-pane.html?class=medical";

  function halfOpen(url) {
    var w = Math.max(320, Math.round((window.screen.availWidth || 800) * 0.5));
    var h = Math.max(420, Math.round((window.screen.availHeight || 800) * 0.5));
    var x = Math.max(0, Math.round(((window.screen.availWidth || 800) - w) / 2));
    var y = Math.max(0, Math.round(((window.screen.availHeight || 800) - h) / 2));
    var win = window.open(url, "dc-join", "popup=yes,width=" + w + ",height=" + h + ",left=" + x + ",top=" + y + ",resizable=yes,scrollbars=yes");
    if (!win) location.href = url;
    return win;
  }
  function openEng() {
    if (window.DC_DOCS && DC_DOCS.openClass) return DC_DOCS.openClass("engineering");
    return halfOpen(ENG);
  }
  function openMed() {
    if (window.DC_DOCS && DC_DOCS.openClass) return DC_DOCS.openClass("medical");
    return halfOpen(MED);
  }

  var prevSector = window.openDualisSector;
  window.openDualisSector = function (key) {
    if (key === "municipalities" || key === "engineering") return openEng();
    if (typeof prevSector === "function") return prevSector.apply(this, arguments);
  };
  window.openDocument = function () { return openMed(); };

  function scrub(root) {
    var walk = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walk.nextNode())) {
      var t = node.nodeValue;
      if (!t) continue;
      if (/117-Indication|117 indications|Master Compendium · CAD \$1,499|instant cryptographic unlock|atomistic pharmacokinetic/i.test(t)) {
        node.nodeValue = t
          .replace(/Order 117-Indication Master Compendium · CAD \$1,499\.00\s*⚡/gi, "SKU-029 atlas/index · CAD $1,499 · CLOSED")
          .replace(/Complete cross-domain biophysical AI simulation compendium across all 117 indications[^.\n]*/gi, "Atlas/index seat only. Not ALS. Not MS. Not the vault.")
          .replace(/Instant cryptographic unlock of 3D atomistic pharmacokinetic model/gi, "Look is free. Depth stays gated.");
      }
    }
  }
  function rebind() {
    document.querySelectorAll(".foundation-card.f-blue").forEach(function (el) {
      el.setAttribute("onclick", "");
      el.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); openEng(); });
    });
    document.querySelectorAll(".foundation-card.f-purple").forEach(function (el) {
      el.setAttribute("onclick", "");
      el.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); openMed(); });
    });
  }
  function ready() { try { scrub(document.body); } catch (e) {} try { rebind(); } catch (e) {} }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
