/**
 * IrisVoice — one mouth. Device TTS + puck. Words not in HRTF.
 * Silent product: do not speak a dollar from a SEED.
 */
(function (w) {
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
    picked = list.slice().sort(function (a, b) { return score(b) - score(a); })[0];
    return picked;
  }
  if (w.speechSynthesis) {
    pick();
    w.speechSynthesis.onvoiceschanged = pick;
  }
  function silent(text) {
    return String(text || "")
      .replace(/\$[\d,]+(?:\.\d+)?/g, "[seed dollar unpublished]")
      .replace(/\b[\d,]+\s*(?:CAD|cad)\b/g, "[seed dollar unpublished]")
      .replace(/\babout\s+[\d,]+(?:\.\d+)?\s*(?:a year|per year|/yr)\b/gi, "open seed, no year in CAD");
  }
  function speak(text, seat) {
    if (!text || !w.speechSynthesis) return;
    var said = silent(String(text).slice(0, 420));
    var u = new SpeechSynthesisUtterance(said);
    var v = picked || pick();
    if (v) u.voice = v;
    u.lang = (v && v.lang) || "en-CA";
    u.rate = 1.02;
    u.pitch = 1;
    u.volume = 1;
    w.speechSynthesis.cancel();
    w.speechSynthesis.speak(u);
    if (w.DSAP) {
      try { w.DSAP.wake(); w.DSAP.place("puck", seat || 16); } catch (e) {}
    }
  }
  function hush() {
    try { if (w.speechSynthesis) w.speechSynthesis.cancel(); } catch (e) {}
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) hush();
  });
  w.IrisVoice = { speak: speak, pick: pick, hush: hush, silent: silent, voice: function () { return picked; } };
})(window);
