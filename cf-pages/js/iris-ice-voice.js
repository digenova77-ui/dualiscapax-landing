/**
 * Ice mouth. Same Iris. Prefers a stadium-style local voice when the phone has one.
 * Does not rename her. Does not touch L0.
 */
(function (w) {
  var picked = null;
  var WANT = [/daniel/i,/alex/i,/david/i,/fred/i,/tom/i,/gordon/i,/oliver/i,/ravi/i,/aaron/i,/male/i,/baritone/i,/premium male/i,/english \(uk\) male/i,/google uk english male/i,/microsoft david/i,/microsoft mark/i,/microsoft guy/i];
  function score(v) {
    var n = (v.name || "") + " " + (v.lang || "");
    var s = 0;
    if (/^en/i.test(v.lang)) s += 4;
    if (/en-CA|en-GB|en-US/i.test(v.lang)) s += 2;
    WANT.forEach(function (re) { if (re.test(n)) s += 6; });
    if (/female|samantha|karen|moira|aria|jenny|zira|siri/i.test(n)) s -= 8;
    if (/compact|eloq|robot|novelty/i.test(n)) s -= 6;
    return s;
  }
  function pick() {
    if (!w.speechSynthesis) return null;
    var list = w.speechSynthesis.getVoices() || [];
    if (!list.length) return null;
    picked = list.slice().sort(function (a, b) { return score(b) - score(a); })[0];
    return picked;
  }
  if (w.speechSynthesis) {
    pick();
    w.speechSynthesis.addEventListener("voiceschanged", pick);
  }
  function announce(text, seat) {
    if (!text || !w.speechSynthesis) return;
    var said = text;
    if (w.IrisVoice && w.IrisVoice.silent) said = w.IrisVoice.silent(text);
    var u = new SpeechSynthesisUtterance(String(said).slice(0, 280));
    var v = picked || pick();
    if (v) u.voice = v;
    u.lang = (v && v.lang) || "en-CA";
    u.rate = 0.92;
    u.pitch = 0.82;
    u.volume = 1;
    w.speechSynthesis.cancel();
    w.speechSynthesis.speak(u);
    if (w.DSAP) {
      try { w.DSAP.wake(); w.DSAP.place("whistle", seat || 0); } catch (e) {}
    }
  }
  w.IrisIceVoice = { announce: announce, pick: pick, voice: function () { return picked; } };
})(window);
