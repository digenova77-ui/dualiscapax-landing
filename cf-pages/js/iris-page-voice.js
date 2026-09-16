/**
 * A page may have a line. It does not speak on load.
 * First gesture on that room may invoke it. Never forced.
 */
(function (w) {
  var said = {};
  var LINES = {
    gameday: "",
    schedule: "This window is the week. Game day is the shift.",
    ice: "This is the rink. Claim a seat when you are ready.",
    hockey: "Five members under the OHF. We do not invent a roster.",
    ohf: "The roof first. Then your member. Then the provincial weekend.",
    sima: "Two poles. Paid book or leftover hour. Look is free."
  };
  function which() {
    var p = (w.location && w.location.pathname) || "";
    if (/gameday/.test(p)) return "gameday";
    if (/schedule/.test(p)) return "schedule";
    if (/hockey/.test(p)) return "hockey";
    if (/ohf/.test(p)) return "ohf";
    if (/sima|rtesimadclm/.test(p)) return "sima";
    if (/ice/.test(p)) return "ice";
    return "";
  }
  function line() {
    var k = which();
    if (k === "gameday" && w.IrisIceRole && w.IrisIceRole.line) return w.IrisIceRole.line();
    return LINES[k] || "";
  }
  function invoke() {
    var k = which() || "page";
    if (said[k]) return;
    var t = line();
    if (!t) return;
    said[k] = true;
    if (w.IrisIceVoice && /ice|gameday|schedule|hockey|ohf/.test(k)) w.IrisIceVoice.announce(t, 0);
    else if (w.IrisVoice && w.IrisVoice.speak) w.IrisVoice.speak(t, 16);
  }
  w.IrisPageVoice = { invoke: invoke, line: line, which: which };
})(window);
