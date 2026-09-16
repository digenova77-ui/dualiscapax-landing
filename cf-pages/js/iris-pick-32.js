/**
 * 32 choices in view. One logical step. Cite or closer. Not a vote. Not pretty.
 */
(function (w) {
  var MAP = [
    { re: /smash|leftover|wide|fast/i, i: 0 },
    { re: /clerk|closer|succession/i, i: 1 },
    { re: /center|expand|bang/i, i: 2 },
    { re: /photon|ray|flight/i, i: 3 },
    { re: /\byin\b|slow|aimed/i, i: 4 },
    { re: /\byang\b|chest|pa |announcer/i, i: 5 },
    { re: /\bl0\b|dense|floor/i, i: 6 },
    { re: /friction|until.*hole/i, i: 7 },
    { re: /fold|this phone|dedup/i, i: 8 },
    { re: /seed|fence|0\.5/i, i: 9 },
    { re: /\bbook\b|paid hour/i, i: 10 },
    { re: /hole|unknown|missing plate/i, i: 11 },
    { re: /flatten|teamsnap|opponent|id is not/i, i: 12 },
    { re: /ohf|omha|roster|gthl|noha|owha|alliance/i, i: 13 },
    { re: /stadium|mouth|sleeve/i, i: 14 },
    { re: /invoke|first tap|autoload|on load/i, i: 15 },
    { re: /role|measured|gameday job|one seat/i, i: 16 },
    { re: /against|\bvs\b|opponent name/i, i: 17 },
    { re: /availab|rsvp|twelve going/i, i: 18 },
    { re: /twin|dsap|dvp|wake|wave/i, i: 19 },
    { re: /\bv2\b|worker|second brain/i, i: 20 },
    { re: /look|\$0|stripe|paid closed/i, i: 21 },
    { re: /sku|029|atlas/i, i: 22 },
    { re: /factory|drive dump|shelf/i, i: 23 },
    { re: /apex|404|clock|lag/i, i: 24 },
    { re: /32|kitchens|species|instances/i, i: 25 },
    { re: /next smash|depends|succession/i, i: 26 },
    { re: /two poles|dualis/i, i: 27 },
    { re: /treatment|stamp|shares|simulation/i, i: 28 },
    { re: /route|\/ice|sima-dclm/i, i: 29 },
    { re: /no force|gesture|host_safe/i, i: 30 },
    { re: /last mouth|vote|elect/i, i: 31 }
  ];
  function pick(q) {
    var t = String(q || "");
    if (w.IrisFriction && w.IrisFriction.vet) {
      var v = w.IrisFriction.vet(t);
      if (v && v.ok === false) return { i: 11, said: v.said, why: "friction named a hole" };
    }
    for (var n = 0; n < MAP.length; n++) {
      if (MAP[n].re.test(t)) {
        var i = MAP[n].i;
        var said = (w.IrisRing32 && w.IrisRing32.at) ? w.IrisRing32.at(i) : ("seat " + i);
        return { i: i, said: said, why: "matched this hole" };
      }
    }
    return {
      i: 11,
      said: (w.IrisRing32 && w.IrisRing32.at) ? w.IrisRing32.at(11) : "Missing plate is a hole. Keep the work.",
      why: "no seat matched — UNKNOWN, not a vote"
    };
  }
  w.IrisPick32 = { pick: pick };
})(typeof window !== "undefined" ? window : globalThis);
