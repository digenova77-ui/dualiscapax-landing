/* Unity number: obscure public string, hatchable, old packets still parse. */
(function (w) {
  var CROCK = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  function pad(n, wth) { n = String(n); while (n.length < wth) n = "0" + n; return n; }
  function check2(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
    return CROCK[h % 32] + CROCK[(h >>> 5) % 32];
  }
  function publicOf(scheme, seed, serial) {
    var body = "DC" + scheme + "-H" + seed + "-" + pad(serial, 4);
    return { public: body, check: check2(body), human: "U" + serial };
  }
  function mintU1() {
    var p = publicOf(1, 1, 1);
    return {
      schema: "unity.id.v1",
      human: "U1",
      public: p.public,
      check: p.check,
      seat: "operator_first",
      seed: 1,
      serial: 1,
      path: "1",
      can_hatch: true,
      parent: null,
      founder_reserved: { human: "U0", public: "DC0-Z0-0000", unity_verification: "NOT_PASSED" },
    };
  }
  function hatch(parent, kindSeed, nextIndex) {
    var seed = kindSeed || (parent && parent.seed) || 1;
    var idx = nextIndex || 1;
    var serial = parent && parent.serial ? parent.serial : 1;
    var path = (parent && parent.path ? parent.path : "1") + "/" + idx;
    var p = publicOf(1, seed, serial);
    return {
      schema: "unity.id.v1",
      human: parent.human + "." + pad(idx, 2),
      public: p.public + "." + pad(idx, 2),
      check: check2(p.public + "." + pad(idx, 2)),
      seat: "hatch",
      seed: seed,
      serial: serial,
      path: path,
      parent: parent.public,
      can_hatch: true,
    };
  }
  function attach(packet, unity) {
    packet.unity = unity;
    return packet;
  }
  w.UnityID = { publicOf: publicOf, mintU1: mintU1, hatch: hatch, attach: attach, check2: check2 };
})(window);
