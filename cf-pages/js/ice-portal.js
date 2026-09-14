/**
 * Ice portal entry.
 * Full engine pinned to last-good commit e6db8ff after a placeholder wipe.
 * Pair with js/ice-seat-teamsnap-only.js to hide Spordle on Seat.
 */
(function () {
  if (window.__DC_ICE_PORTAL_LOADING) return;
  window.__DC_ICE_PORTAL_LOADING = true;
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/gh/digenova77-ui/dualiscapax-landing@e6db8ff2b85d89bb64662f2196bb34e0d750ad1d/cf-pages/js/ice-portal.js";
  s.async = false;
  s.onload = function () {
    try { document.dispatchEvent(new Event("dc-ice-portal-ready")); } catch (e0) {}
  };
  document.head.appendChild(s);
})();
