/**
 * L2 Playground — plug and play, not hope and pray.
 * File or link either SEATS or REFUSES with one reason.
 * Cells never leave this device. Secrets refuse. Silence is HOLE not zero.
 */
(function (w) {
  var VERSION = "l2-plug-2026-09-01";
  var KEY = "dc.l2.plug.v1";
  var SECRET = /(password|passwd|secret|token|apikey|api_key|bearer|authorization|private[_-]?key)/i;
  var MONEY = /(amount|total|wage|tax|payroll|revenue|expense|debit|credit|cad|usd|balance|cost|pay)/i;

  function now() { return new Date().toISOString(); }

  function sha256(text) {
    var enc = new TextEncoder().encode(String(text || ""));
    return crypto.subtle.digest("SHA-256", enc).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
    catch (e) { return null; }
  }

  function save(row) {
    localStorage.setItem(KEY, JSON.stringify(row));
    return row;
  }

  function clear() {
    localStorage.removeItem(KEY);
    if (w.DCMatrix && typeof w.DCMatrix.clear === "function") w.DCMatrix.clear();
    if (w.OneNet && typeof w.OneNet.releaseAll === "function") w.OneNet.releaseAll();
  }

  function refuse(reason, extra) {
    var row = {
      v: VERSION,
      status: "REFUSED",
      reason: reason,
      stays: "device",
      scientific_validation: false,
      ts: now()
    };
    if (extra) Object.keys(extra).forEach(function (k) { row[k] = extra[k]; });
    return save(row);
  }

  function seat(row) {
    row.v = VERSION;
    row.status = "PLUGGED";
    row.stays = "device";
    row.scientific_validation = false;
    row.ts = now();
    var saved = save(row);
    var next = Promise.resolve(saved);
    if (w.DCMatrix && typeof w.DCMatrix.merge === "function") {
      next = w.DCMatrix.merge(saved).then(function (cell) {
        saved.matrix = cell;
        return save(saved);
      });
    }
    return next.then(function (row2) {
      if (w.OneNet && typeof w.OneNet.lease === "function") {
        return w.OneNet.lease(row2).then(function (lease) {
          row2.lease = lease;
          return save(row2);
        });
      }
      return row2;
    });
  }

  function parseTable(text) {
    var lines = String(text || "").split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!lines.length) return { numbers: 0, headers: [], residualNamed: false };
    var delim = (lines[0].split("\t").length > lines[0].split(",").length) ? "\t" : ",";
    var headers = lines[0].split(delim).map(function (h) { return h.trim(); });
    var numbers = 0;
    var labeledTotal = headers.some(function (h) { return /^total$/i.test(h.trim()); });
    for (var r = 1; r < lines.length; r++) {
      var cells = lines[r].split(delim);
      for (var c = 0; c < cells.length; c++) {
        var n = Number(String(cells[c]).replace(/[$,\s]/g, ""));
        if (isFinite(n) && String(cells[c]).search(/[0-9]/) >= 0) numbers += 1;
      }
    }
    return { numbers: numbers, headers: headers, residualNamed: labeledTotal, rows: Math.max(0, lines.length - 1) };
  }

  async function plugFile(file) {
    if (!file) return refuse("NO_FILE");
    var name = String(file.name || "sheet");
    var lower = name.toLowerCase();
    if (SECRET.test(name)) return refuse("SECRET_IN_NAME");
    var kind = "file";
    if (/\.(csv|tsv|txt)$/.test(lower)) kind = "sheet";
    else if (/\.json$/.test(lower)) kind = "json";
    else if (/\.xlsx$|\.xls$/.test(lower)) kind = "workbook";
    else return refuse("UNKNOWN_PLUG", { name: name });

    if (kind === "workbook") {
      var hash = await sha256(name + "|" + file.size + "|" + file.lastModified);
      return seat({
        kind: kind,
        name: name,
        bytes: file.size,
        hash: hash,
        headers: [],
        numbers: 0,
        residual_named: false,
        residual_unit: "SEED",
        note: "Workbook stayed on this device. No leftover invented from a closed book."
      });
    }

    var text = await file.text();
    if (SECRET.test(text.slice(0, 4000))) return refuse("SECRET_IN_FILE");
    var hash = await sha256(text);
    var stats = { numbers: 0, residualNamed: false };
    if (kind === "json") {
      try {
        var node = JSON.parse(text);
        var blob = JSON.stringify(node);
        var matches = blob.match(/-?\d+(\.\d+)?/g);
        stats.numbers = matches ? matches.length : 0;
      } catch (e) {
        return refuse("INVALID_JSON");
      }
    } else {
      stats = parseTable(text);
    }
    return seat({
      kind: kind,
      name: name,
      bytes: file.size,
      hash: hash,
      headers: stats.headers || [],
      numbers: stats.numbers,
      residual_named: !!stats.residualNamed,
      residual_unit: stats.residualNamed ? "NAMED" : "SEED"
    });
  }

  async function plugUrl(raw) {
    var url = String(raw || "").trim();
    if (!url) return refuse("NO_URL");
    if (SECRET.test(url)) return refuse("SECRET_IN_URL");
    var parsed;
    try { parsed = new URL(url); }
    catch (e) { return refuse("BAD_URL"); }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return refuse("BAD_URL");
    if (parsed.username || parsed.password) return refuse("SECRET_IN_URL");
    var hostPath = parsed.host + parsed.pathname;
    var hash = await sha256(hostPath);
    return seat({
      kind: "books_url",
      domain: parsed.host,
      hash: hash,
      headers: [],
      numbers: 0,
      residual_named: false,
      residual_unit: "SEED",
      note: "Link stored as a hash of host and path. Logins refused."
    });
  }

  w.DCL2 = {
    version: VERSION,
    law: "PLUG_AND_PLAY_NOT_HOPE_AND_PRAY",
    layer: "L2_PLAYGROUND",
    load: load,
    save: save,
    clear: clear,
    plugFile: plugFile,
    plugUrl: plugUrl,
    refuse: refuse
  };
})(window);
