/**
 * Iris voice sleeve. Uses the best local Speech Synthesis voice.
 * Dry path. No scraped IR. No extra hiss.
 * Not in the HRTF ring — that hole stays named.
 */
(function (w) {
  if (w.IrisVoice) return;
  var picked = null;
  var PREFER = [/samantha/i,/aria/i,/jenny/i,/google us english/i,/google uk english female/i,/karen/i,/moira/i,/ava/i,/natural/i,/premium/i];
  function score(v) {
    var n = (v.name || "") + " " + (v.lang || "");
    var s = 0;
    if (/^en/i.test(v.lang)) s += 4;
    if (/en-CA|en-GB|en-US/i.test(v.lang)) s += 2;
    PREFER.forEach(function (re) { if (re.test(n)) s += 5; });
    if (/compact|eloq|robot|novelty/i.test(n)) s -= 6;
    return s;
  }
  function pick() {
    if (!w.speechSynthesis) return null;
    var list = w.speechSynthesis.getVoices() || [];
    if (!list.length) return null;
    list = list.slice().sort(function (a, b) { return score(b) - score(a); });
    picked = list[0];
    return picked;
  }
  if (w.speechSynthesis) {
    pick();
    w.speechSynthesis.onvoiceschanged = pick;
  }
  function speak(text) {
    if (!text || !w.speechSynthesis) return;
    var u = new SpeechSynthesisUtterance(String(text).slice(0, 420));
    var v = picked || pick();
    if (v) u.voice = v;
    u.lang = (v && v.lang) || "en-CA";
    u.rate = 1.02;
    u.pitch = 1.0;
    u.volume = 1;
    w.speechSynthesis.cancel();
    w.speechSynthesis.speak(u);
    if (w.DSAP) {
      try { w.DSAP.wake(); w.DSAP.place("puck", 16); } catch (e) {}
    }
  }
  w.IrisVoice = { speak: speak, pick: pick, voice: function () { return picked; } };
})(window);
