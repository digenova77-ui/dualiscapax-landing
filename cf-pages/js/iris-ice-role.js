/**
 * DCLM role for the PA. Forwards their measure. Does not mint X.
 */
(function (w) {
  function pick(n, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = n && n[keys[i]];
      if (v && String(v).trim()) return String(v).trim();
    }
    return "";
  }
  function measured() {
    try {
      var raw = localStorage.getItem("dc.teamsnap.events");
      if (!raw) return null;
      var ev = JSON.parse(raw);
      var n = Array.isArray(ev) ? ev[0] : ev;
      if (!n) return null;
      return {
        title: pick(n, ["name", "title", "event_name"]),
        vs: pick(n, ["opponent_name", "opponent", "against", "away_team", "home_team"]),
        when: pick(n, ["start_date", "start", "starts_at"]),
        loc: pick(n, ["location_name", "location", "venue"])
      };
    } catch (e) {
      return null;
    }
  }
  function line() {
    var m = measured();
    var job = "Your job is this game. One seat. Watch the whole sequence. A miss is not automatically a mistake.";
    if (!m) return "Seat first. Dualis does not invent the upcoming game. " + job;
    var vs = m.vs || "";
    if (!vs && m.title && /\bvs\.?\b|\bagainst\b/i.test(m.title)) vs = m.title;
    var head = vs
      ? "Here is your detailed information on the upcoming game against " + vs + "."
      : (m.title
          ? "Here is your detailed information on the upcoming game. " + m.title + "."
          : "Here is your detailed information on the upcoming game. The name is still a hole.");
    var rest = [m.when, m.loc].filter(Boolean).join(". ");
    return [head, rest, job, "They measured that. Dualis read it."].filter(Boolean).join(" ");
  }
  w.IrisIceRole = { line: line, measured: measured };
})(window);
