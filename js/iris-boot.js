/**
 * IrisBoot — staging base wiring only.
 *
 * Reads <meta name="iris-authorize-base" content="..."> and sets
 * window.IrisAuthorizeBase when the content is non-empty.
 *
 * Never sets window.IrisSigningSecret. Never reads a secret.
 * Empty or missing meta leaves the production path unset.
 */
(function (w, d) {
  var VERSION = "iris-boot-2026-10-24";
  function readBase() {
    var meta = d.querySelector('meta[name="iris-authorize-base"]');
    if (!meta) return "";
    return String(meta.getAttribute("content") || "").trim();
  }
  var base = readBase();
  if (base) w.IrisAuthorizeBase = base;
  w.IrisBoot = { version: VERSION, base: base || null };
})(typeof window !== "undefined" ? window : globalThis, typeof document !== "undefined" ? document : { querySelector: function () { return null; } });
