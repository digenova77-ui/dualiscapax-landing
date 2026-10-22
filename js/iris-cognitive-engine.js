/* Legacy compatibility shim.
 * The former heuristic response generator returned unsupported financial,
 * medical, and performance claims. It is intentionally disabled.
 * The canonical governed interface is /ai/app.html.
 */
(function (w) {
  function disabledResponse() {
    return "The legacy simulated response engine is disabled. Open /ai/app.html for the governed Iris interface.";
  }
  w.generateIrisResponse = disabledResponse;
  w.IrisCognitiveEngine = {
    version: "legacy-disabled",
    available: false,
    run: async function () {
      return {
        available: false,
        lane: "UNAVAILABLE",
        spoken: disabledResponse()
      };
    }
  };
})(window);
