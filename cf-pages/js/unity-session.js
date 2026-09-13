/* Unity session — local, $0, no Ontario default.
   KYC later. OAuth later. Operator house does not become the visitor's desk. */
(function () {
  var KEY = "dc.unity.session";
  var JX_KEY = "dc_jural";

  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    return [...b].map(function (x) { return x.toString(16).padStart(2, "0"); }).join("").replace(
      /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
      "$1-$2-$3-$4-$5"
    );
  }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    try {
      if (s && s.jx) {
        sessionStorage.setItem(JX_KEY, s.jx);
        localStorage.setItem(JX_KEY, s.jx);
      }
    } catch (e) {}
    return s;
  }

  function hintFromDevice() {
    var tz = "";
    var lang = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    try { lang = (navigator.language || "").toLowerCase(); } catch (e) {}
    var map = {
      "America/Edmonton": { jx: "CA-AB", place: "Alberta", country: "Canada" },
      "America/Calgary": { jx: "CA-AB", place: "Alberta", country: "Canada" },
      "America/Vancouver": { jx: "CA-BC", place: "British Columbia", country: "Canada" },
      "America/Montreal": { jx: "CA-QC", place: "Québec", country: "Canada" },
      "America/Toronto": { jx: "WORLD", place: "", country: "", note: "hint only — not an Ontario land" },
      "Asia/Kathmandu": { jx: "NP", place: "Nepal", country: "Nepal" }
    };
    var hit = map[tz] || { jx: "WORLD", place: "", country: "", note: "undeclared" };
    hit.tz = tz;
    hit.lang = lang;
    hit.hint_only = true;
    return hit;
  }

  function mint(fields) {
    var now = new Date().toISOString();
    var prev = read() || {};
    var hint = hintFromDevice();
    var jx = String((fields && fields.jx) || "").toUpperCase() || "WORLD";
    if (jx === "ON") jx = "CA-ON";
    if (jx === "QC" || jx === "QUEBEC") jx = "CA-QC";
    if (jx === "AB") jx = "CA-AB";
    if (jx === "BC") jx = "CA-BC";
    if (jx === "NP" || jx === "NEPAL") jx = "NP";
    var session = {
      schema: "unity.session.v1",
      unity_id: prev.unity_id || uuid(),
      created_at: prev.created_at || now,
      updated_at: now,
      name: (fields && fields.name) || prev.name || "",
      country: (fields && fields.country) || "",
      region: (fields && fields.region) || "",
      place: (fields && fields.place) || "",
      jx: jx,
      kyc: "UNBOUND",
      oauth: { google: false, microsoft: false, meta: false },
      device_hint: hint,
      cost: 0,
      note: "Look is free. This ID is $0. KYC later. Not a government stamp."
    };
    return write(session);
  }

  function requireOrRedirect(next) {
    var s = read();
    if (s && s.unity_id) return s;
    var dest = "curtain.html";
    if (next) dest += "?next=" + encodeURIComponent(next);
    location.replace(dest);
    return null;
  }

  function landPath(s) {
    var jx = (s && s.jx) || "WORLD";
    if (jx === "CA-ON") return "on.html?jx=CA-ON";
    if (jx === "CA-QC") return "qc.html?jx=CA-QC";
    if (jx === "CA-AB") return "ab.html?jx=CA-AB";
    if (jx === "CA-BC") return "onboard.html?jx=CA-BC";
    if (jx === "NP") return "np.html?jx=NP";
    return "world.html";
  }

  window.DC_UNITY = {
    read: read,
    mint: mint,
    hint: hintFromDevice,
    require: requireOrRedirect,
    landPath: landPath
  };
})();
