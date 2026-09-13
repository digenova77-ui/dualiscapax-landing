/* Compatibility alias. Mount docs named this file; the lock lives in js/apex-hook.js. */
(function () {
  if (window.__DC_APEX_HOOK__) return;
  var s = document.createElement("script");
  s.src = "/js/apex-hook.js";
  s.async = false;
  document.head.appendChild(s);
})();
