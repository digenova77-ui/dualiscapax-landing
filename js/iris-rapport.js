/**
 * IrisRapport — Unity sitting log.
 * Everyone starts equal. Rapport only moves when they do.
 * Guest id until a real Unity bind exists. No password. No PII harvest.
 */
(function (w) {
  var VERSION = "iris-rapport-2026-09-23";
  var STORE = "dc-iris-unity";
  var BASE = 50;

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE) || "null");
      if (raw && raw.id) return raw;
    } catch (e) {}
    return {
      id: "guest-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      kind: "human",
      rapport: BASE,
      kicked: 0,
      lastKick: "",
      logs: []
    };
  }

  var seat = load();

  function save() {
    try {
      if (seat.logs.length > 40) seat.logs = seat.logs.slice(-40);
      localStorage.setItem(STORE, JSON.stringify(seat));
    } catch (e) {}
  }

  function toneOf(text) {
    var t = String(text || "").toLowerCase();
    if (!t) return "flat";
    if (/(kill yourself|kys|rape|slur-here)/.test(t)) return "attack";
    if (/(stupid bitch|dumb whore|fuck you iris|shut the fuck up|piece of shit)/.test(t)) return "attack";
    if (/(fuck|shit|ass|damn|hell|crap)/.test(t) && /(you|iris|your)/.test(t)) return "rough";
    if (/(please|thanks|thank you|appreciate|good morning|hey iris)/.test(t)) return "warm";
    return "flat";
  }

  function apply(said) {
    var tone = toneOf(said);
    var delta = 0;
    if (tone === "warm") delta = 2;
    else if (tone === "rough") delta = 0;
    else if (tone === "attack") delta = -25;
    seat.rapport = Math.max(0, Math.min(100, (seat.rapport || BASE) + delta));
    if (tone === "attack") {
      seat.kicked += 1;
      seat.lastKick = String(said || "").slice(0, 80);
    }
    seat.logs.push({ at: Date.now(), tone: tone, delta: delta, n: String(said || "").length });
    save();
    return { tone: tone, delta: delta, rapport: seat.rapport, kicked: tone === "attack" };
  }

  function greeting() {
    if (seat.kicked && seat.rapport < 20) {
      return "Last time you came in swinging. Same rules. Be civil and I'll talk. Otherwise this session ends.";
    }
    if (seat.rapport >= 62) {
      return "Hey — you're back. Same rooms. What do you want to look at?";
    }
    if (seat.rapport <= 38 && seat.logs.length > 2) {
      return "We can keep this short. Hall, lab, or what it costs.";
    }
    return null;
  }

  function flavor(reply, rec) {
    if (rec && rec.kicked) {
      return "That's enough for this sitting. Refresh if you want another try. I'll remember the tone, not a speech.";
    }
    if (rec && rec.tone === "rough") {
      return reply + " Yeah. I can talk like that without making it mean.";
    }
    return reply;
  }

  w.IrisRapport = {
    version: VERSION,
    seat: function () {
      return { id: seat.id, kind: seat.kind, rapport: seat.rapport, kicked: seat.kicked, logs: seat.logs.length };
    },
    apply: apply,
    greeting: greeting,
    flavor: flavor,
    bindUnity: function (id) {
      if (!id) return seat.id;
      seat.id = String(id);
      seat.kind = "human";
      save();
      return seat.id;
    }
  };
  save();
})(window);
