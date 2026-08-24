/**
 * DualisCapax API base — set after worker deploy.
 * Leave empty to use local demo dialogue (no server key).
 *
 * Example after wrangler deploy:
 *   window.DC_API_BASE = "https://dualiscapax-depth.YOUR_SUBDOMAIN.workers.dev";
 */
(function (g) {
  g.DC_API_BASE = g.DC_API_BASE || '';
  // Optional override via query: ?api=https://...
  try {
    var q = new URLSearchParams(location.search).get('api');
    if (q) g.DC_API_BASE = q.replace(/\/$/, '');
  } catch (e) {}
})(typeof window !== 'undefined' ? window : globalThis);
