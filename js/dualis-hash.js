var DualisHash = (function () {
  var KEYISH = /(password\s*=|api[_-]?key|sk_live_|sk_test_|whsec_|bearer\s+[a-z0-9]|begin [a-z ]*private)/i;

  function looksSpeech(s) {
    return KEYISH.test(String(s || ""));
  }

  function u32be(n) {
    return new Uint8Array([
      (n >>> 24) & 255,
      (n >>> 16) & 255,
      (n >>> 8) & 255,
      n & 255
    ]);
  }

  function concat(parts) {
    var n = 0, i, out, o = 0;
    for (i = 0; i < parts.length; i++) n += parts[i].length;
    out = new Uint8Array(n);
    for (i = 0; i < parts.length; i++) {
      out.set(parts[i], o);
      o += parts[i].length;
    }
    return out;
  }

  function hex(buf) {
    var h = "", i, b;
    for (i = 0; i < buf.length; i++) {
      b = buf[i].toString(16);
      if (b.length < 2) b = "0" + b;
      h += b;
    }
    return h;
  }

  function tagged(dst, body) {
    if (looksSpeech(dst) || looksSpeech(body)) {
      return Promise.resolve({ stamp: "HOLE", hex: "" });
    }
    var enc = new TextEncoder();
    var d = enc.encode(String(dst || ""));
    var b = enc.encode(String(body || ""));
    var msg = concat([d, u32be(b.length), b]);
    return crypto.subtle.digest("SHA-256", msg).then(function (ab) {
      return { stamp: "1", hex: hex(new Uint8Array(ab)) };
    });
  }

  function gateDigest(id, version, predicate) {
    var body =
      String(id || "") +
      "\n" +
      String(version || "1") +
      "\n" +
      String(predicate || "");
    return tagged("dualis.gate.v1", body);
  }

  function match(got, expect) {
    if (!got || got.stamp === "HOLE") return "HOLE";
    var e = String(expect || "").trim().toLowerCase();
    if (!e) return "0";
    var g = got.hex;
    if (e.length <= 16) return g.slice(0, e.length) === e ? "1" : "0";
    return g === e ? "1" : "0";
  }

  return {
    looksSpeech: looksSpeech,
    tagged: tagged,
    gateDigest: gateDigest,
    match: match
  };
})();
