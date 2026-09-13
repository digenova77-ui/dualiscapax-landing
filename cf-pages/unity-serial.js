/** Public serial — 16 digits, hatches to U1. Not a secret. Not a card. */
(function (w) {
  var SERIAL = "8610-0144-7001-0001";
  var COMPACT = "8610014470010001";
  var HATCH = {
    human: "U1",
    seed: 1,
    seat: "operator_first",
    public: "DC1-H1-0001",
    serial: SERIAL
  };
  function hatch(s) {
    var n = String(s || "").replace(/\D/g, "");
    if (n === COMPACT || s === SERIAL || s === "U1" || s === "DC1-H1-0001") return HATCH;
    return null;
  }
  w.UnitySerial = { SERIAL: SERIAL, COMPACT: COMPACT, HATCH: HATCH, hatch: hatch };
})(window);
