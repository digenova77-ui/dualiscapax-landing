/**
 * DCLM role for the PA. Reads what they measured. Does not mint a position.
 */
(function (w) {
  function measured() {
    try {
      var raw = localStorage.getItem("dc.teamsnap.events");
      if (!raw) return null;
      var ev = JSON.parse(raw);
      var n = Array.isArray(ev) ? ev[0] : ev;
      if (!n) return null;
      return {
        title: n.name || n.title || "",
        when: n.start_date || n.start || "",
        loc: n.location_name || n.location || ""
      };
    } catch (e) {
      return null;
    }
  }
  function line() {
    var m = measured();
    var floor = "Your job is this game. One seat. Watch the whole sequence. A miss is not automatically a mistake.";
    if (!m || !m.title) return "Seat first. Dualis does not invent your role. " + floor;
    var bit = [m.title, m.when, m.loc].filter(Boolean).join(". ");
    return bit + ". " + floor + " They measured that. Dualis read it.";
  }
  w.IrisIceRole = { line: line, measured: measured };
})(window);
