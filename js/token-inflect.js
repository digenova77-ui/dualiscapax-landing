/** Inflection from seat in the phrase. Not a phonetic lab. */
(function (w) {
  var VERSION = "token-inflect-2026-09-01";
  var SMALL = /^(the|a|an|of|and|or|to|in|on|for|is|are|was|be|it|as|at|by|with|from|that|this|not)$/i;

  function bare(text) {
    return String(text || "").replace(/[^A-Za-z0-9']/g, "");
  }

  function seat(words, i) {
    var list = words || [];
    var word = list[i];
    if (!word) return { pitch: 1, rate: 1, volume: 1, pause: 0, kind: "none" };
    var raw = String(word.text || "");
    var prev = list[i - 1];
    var next = list[i + 1];
    var first = i === 0 || (prev && /[.!?]$/.test(String(prev.text || "")));
    var end = /[.!?]$/.test(raw);
    var question = /\?$/.test(raw) || (end === false && next && /\?$/.test(String(next.text || "")) && !list[i + 2]);
    var comma = /[,;:—–]$/.test(raw);
    var small = SMALL.test(bare(raw));
    var last = end || !next;
    var pitch = question ? 1.2 : last ? 0.84 : first ? 1.08 : small ? 0.92 : 1;
    var rate = small ? 1.14 : last ? 0.86 : comma ? 0.9 : 0.98;
    var volume = small ? 0.7 : 1;
    var pause = end ? 320 : comma ? 160 : 0;
    var kind = question ? "ask" : last ? "settle" : first ? "open" : comma ? "breath" : small ? "light" : "hold";
    return { pitch: pitch, rate: rate, volume: volume, pause: pause, kind: kind };
  }

  function apply(utterance, mark) {
    if (!utterance || !mark) return utterance;
    utterance.pitch = mark.pitch;
    utterance.rate = mark.rate;
    utterance.volume = mark.volume;
    return utterance;
  }

  w.DCInflect = {
    version: VERSION,
    law: "SEAT_IN_THE_PHRASE",
    seat: seat,
    apply: apply
  };
})(typeof window !== "undefined" ? window : globalThis);
