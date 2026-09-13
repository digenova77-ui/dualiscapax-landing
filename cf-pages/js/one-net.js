/**
 * One Name System + One Locker Handshake.
 * Yearbook and locker keys for the playground only.
 * Does not talk to public DNS. Does not hand out IP addresses.
 * BIND fields stay the number: ID YEAR SOURCE STAMP STATUS HASH.
 */
(function (w) {
  var VERSION = "one-net-2026-09-01";
  var KEY = "dc.one.net.v1";
  var ZONE = ".one";
  var SECRET = /(password|passwd|secret|token|apikey|api_key|bearer|authorization|private[_-]?key)/i;

  function now() { return new Date().toISOString(); }

  function empty() {
    return { v: VERSION, zone: ZONE, leases: {}, names: {} };
  }

  function loadBook() {
    try {
      var book = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!book || typeof book !== "object") return empty();
      book.leases = book.leases || {};
      book.names = book.names || {};
      return book;
    } catch (e) {
      return empty();
    }
  }

  function saveBook(book) {
    localStorage.setItem(KEY, JSON.stringify(book));
    return book;
  }

  function slug(raw) {
    var s = String(raw || "sheet").toLowerCase();
    s = s.replace(/\.[a-z0-9]{1,5}$/i, "");
    s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!s) s = "sheet";
    if (s.length > 40) s = s.slice(0, 40).replace(/-+$/g, "");
    return s;
  }

  function hole(reason) {
    return {
      status: "HOLE",
      reason: reason || "HOLE_NOT_ZERO",
      name: "",
      id: "",
      scientific_validation: false,
      ts: now()
    };
  }

  function lease(row) {
    if (!row || row.status !== "PLUGGED") return Promise.resolve(hole((row && row.reason) || "NO_PLUG"));
    var cell = row.matrix || {};
    var id = cell.id || row.hash || "";
    if (!id || id === "M-HOLE") return Promise.resolve(hole("NO_CELL"));
    var seed = row.name || row.domain || "sheet";
    if (SECRET.test(String(seed))) return Promise.resolve(hole("SECRET_IN_NAME"));
    var name = slug(seed) + ZONE;
    var book = loadBook();
    var taken = book.names[name];
    if (taken && book.leases[taken] && book.leases[taken].hash && row.hash && book.leases[taken].hash !== row.hash) {
      name = slug(seed) + "-" + String(row.hash).slice(0, 6) + ZONE;
    }
    var rec = {
      status: "LEASED",
      id: id,
      name: name,
      year: cell.year || String((row.ts || now()).slice(0, 4)),
      source: seed,
      stamp: row.ts || cell.stamp || now(),
      hash: row.hash || cell.hash || "",
      pack: cell.pack || "",
      face: "L2",
      cube: cell.cube || { x: id, y: "device", z: "L2", t: row.ts || now() },
      ttl: "session",
      stays: "device",
      scientific_validation: false
    };
    book.leases[id] = rec;
    book.names[name] = id;
    saveBook(book);
    return Promise.resolve(rec);
  }

  function resolve(q) {
    var query = String(q || "").trim().toLowerCase();
    if (!query) return hole("NO_NAME");
    var book = loadBook();
    if (book.names[query]) {
      return book.leases[book.names[query]] || hole("NAME_WITHOUT_LEASE");
    }
    if (book.names[query + ZONE]) {
      return book.leases[book.names[query + ZONE]] || hole("NAME_WITHOUT_LEASE");
    }
    if (book.leases[q] || book.leases[query.toUpperCase()]) {
      return book.leases[q] || book.leases[query.toUpperCase()];
    }
    return hole("NXONE");
  }

  function releaseAll() {
    localStorage.removeItem(KEY);
  }

  w.OneNet = {
    version: VERSION,
    zone: ZONE,
    law: "ONE_YEARBOOK_NOT_PUBLIC_DNS",
    lease: lease,
    resolve: resolve,
    releaseAll: releaseAll,
    loadBook: loadBook
  };
})(window);
