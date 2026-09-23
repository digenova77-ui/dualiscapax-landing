/**
 * Iris guest card. First name only. Coffee-shop greet.
 * Mic stays off until they tap Talk.
 */
(function (w) {
  var VERSION = "iris-guest-2026-09-23-cafe";
  var KEY = "dc.iris.guest";

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
      return {
        name: String(raw.name || "").replace(/[^A-Za-z][A-Za-z'-]{0,23}/, function (s) { return s; }).slice(0, 24),
        asked: !!raw.asked
      };
    } catch (e) {
      return { name: "", asked: false };
    }
  }

  function save(card) {
    try { localStorage.setItem(KEY, JSON.stringify({ name: card.name || "", asked: !!card.asked })); } catch (e) {}
    return card;
  }

  function cleanName(s) {
    var t = String(s || "").trim();
    t = t.replace(/["'`]/g, "");
    var m = t.match(/\b([A-Za-z][A-Za-z'-]{1,23})\b/);
    if (!m) return "";
    var n = m[1];
    if (/^(hey|hi|hello|iris|yes|yeah|yep|no|nope|ok|okay|please|thanks|thank|what|who|where|why|how|the|and)$/i.test(n)) return "";
    return n.charAt(0).toUpperCase() + n.slice(1);
  }

  function parseName(text) {
    var s = String(text || "").trim();
    var m = s.match(/^(?:i(?:['’]?m| am)|call me|my name(?:['’]?s| is)|it(?:['’]?s| is)|this is)\s+([A-Za-z][A-Za-z'-]{1,23})\b/i);
    if (m) return cleanName(m[1]);
    if (/^[A-Za-z][A-Za-z'-]{1,23}$/.test(s)) return cleanName(s);
    return "";
  }

  function greetLine() {
    var card = load();
    if (card.name) return "Hey " + card.name + ". I'm Iris. What's on your mind?";
    return "Hey. I'm Iris. I know this house. What should I call you? Tap Talk if you want to say it — I can hear you from there.";
  }

  function rememberFrom(text) {
    var n = parseName(text);
    if (!n) return load();
    return save({ name: n, asked: true });
  }

  function markAsked() {
    var card = load();
    card.asked = true;
    return save(card);
  }

  w.IrisGuest = {
    version: VERSION,
    load: load,
    save: save,
    parseName: parseName,
    greetLine: greetLine,
    rememberFrom: rememberFrom,
    markAsked: markAsked
  };
})(window);
