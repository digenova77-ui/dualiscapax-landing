/**
 * Iris presence. Layer [0] rides every Dualis plate on this origin.
 * A page may add a room. A page may not gag her.
 * First tap is still the browser. A new origin is a new tap.
 */
(function (w) {
  if (w.IrisPresence) return;
  var KEY = "dc.iris.awake";
  function awake() {
    try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }
  function mark() {
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  }
  function speak(text) {
    if (!text || !w.speechSynthesis) return;
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    w.speechSynthesis.cancel();
    w.speechSynthesis.speak(u);
    if (w.DSAP) {
      try { w.DSAP.wake(); w.DSAP.place("puck", 16); } catch (e) {}
    }
  }
  function askLayer(name, text) {
    var extra = "Face: " + (name || "unspecified") + ". " + (text || "");
    var body = (w.irisFloor ? w.irisFloor(extra) : extra);
    if (w.DSAPJacket && w.dcChatV2) return w.DSAPJacket.ask(body, { seat: 16 });
    speak(w.IRIS_L0 ? "The floor is here. V2 is quiet." : "No floor. No V2.");
    return Promise.resolve(null);
  }
  w.IrisPresence = {
    awake: awake,
    mark: mark,
    speak: speak,
    askLayer: askLayer,
    layer: 0
  };
  document.addEventListener("click", function once() {
    mark();
    if (w.DSAP) try { w.DSAP.wake(); } catch (e) {}
    document.removeEventListener("click", once, true);
  }, true);
})(window);
