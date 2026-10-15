/** Serial ledger for reserved seats. Names are published only for white-ledger seats, by consent.
 *  Current as of: 2026-09-02
 */
(function (w) {
  var VERSION = "founder-ledger-2026-09-02";
  var SEATS = [
    {
      seat: 1,
      serial: "DC-F-DE51-FFD7",
      unityId: "DC-U-001",
      ledger: "WHITE",
      measure: 10000,
      label: "Reserved — seat 1",
      role: "Founding seat. Operator.",
      geodesic: true
    },
    { seat: 2, serial: "DC-F-3B06-260D", ledger: "WHITE", measure: 10000, label: "Reserved — seat 2", role: "Founding seat." },
    { seat: 3, serial: "DC-F-0505-E337", ledger: "BLACK", measure: 10000, role: "Undisclosed allocation." },
    { seat: 4, serial: "DC-F-7923-A1F3", ledger: "BLACK", measure: 10000, role: "Undisclosed allocation." },
    { seat: 5, serial: "DC-F-9B78-408E", ledger: "BLACK", measure: 10000, role: "Undisclosed allocation." },
    { seat: 6, serial: "DC-F-4CA0-75AB", ledger: "BLACK", measure: 1000, role: "Undisclosed allocation." },
    { seat: 7, serial: "DC-F-9D8F-FB45", ledger: "BLACK", measure: 1000, role: "Undisclosed allocation." },
    { seat: 8, serial: "DC-F-07A8-CB8F", ledger: "BLACK", measure: 1000, role: "Undisclosed allocation." },
    { seat: 9, serial: "DC-F-C087-92EE", ledger: "BLACK", measure: 10000, role: "Undisclosed allocation." },
    { seat: 10, serial: "DC-F-BD1C-7269", ledger: "BLACK", measure: 1000, role: "Undisclosed seat." }
  ];
  function publicRow(s) {
    return {
      seat: s.seat,
      serial: s.serial,
      unityId: s.unityId || null,
      ledger: s.ledger,
      measure: s.measure,
      role: s.role,
      title: s.title || null,
      geodesic: !!s.geodesic,
      name: s.ledger === "WHITE" ? s.label : null,
      status: "INDEXED",
      share: false
    };
  }
  function total() {
    return SEATS.reduce(function (n, s) { return n + s.measure; }, 0);
  }
  w.DCFounders = {
    version: VERSION,
    law: "SERIAL_THEN_LEDGER",
    seats: SEATS.map(publicRow),
    total: total,
    white: function () { return SEATS.filter(function (s) { return s.ledger === "WHITE"; }).map(publicRow); },
    black: function () { return SEATS.filter(function (s) { return s.ledger === "BLACK"; }).map(publicRow); }
  };
})(typeof window !== "undefined" ? window : globalThis);
