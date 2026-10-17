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
  var MAX_TEXT_BYTES = 5 * 1024 * 1024;
  var MAX_WORKBOOK_BYTES = 25 * 1024 * 1024;

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
    try {
      row.storage = "LOCAL_STORAGE";
      localStorage.setItem(KEY, JSON.stringify(row));
    } catch (e) {
      row.storage = "MEMORY_ONLY";
    }
    return row;
  }

  function clear() {
    var ok = true;
    try { localStorage.removeItem(KEY); } catch (e) { ok = false; }
    try { if (w.DCMatrix && typeof w.DCMatrix.clear === "function") w.DCMatrix.clear(); } catch (e2) { ok = false; }
    try { if (w.OneNet && typeof w.OneNet.releaseAll === "function") w.OneNet.releaseAll(); } catch (e3) { ok = false; }
    return ok;
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

  function splitDelimited(text, delimiter) {
    var rows = [], row = [], cell = "", quoted = false;
    var source = String(text || "");
    for (var i = 0; i < source.length; i++) {
      var ch = source.charAt(i);
      if (ch === '"') {
        if (quoted && source.charAt(i + 1) === '"') { cell += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === delimiter && !quoted) {
        row.push(cell); cell = "";
      } else if ((ch === "\n" || ch === "\r") && !quoted) {
        if (ch === "\r" && source.charAt(i + 1) === "\n") i++;
        row.push(cell); cell = "";
        if (row.some(function (v) { return String(v).trim(); })) rows.push(row);
        row = [];
      } else {
        cell += ch;
      }
    }
    row.push(cell);
    if (row.some(function (v) { return String(v).trim(); })) rows.push(row);
    return rows;
  }

  function delimiterCount(line, delimiter) {
    var count = 0, quoted = false, source = String(line || "");
    for (var i = 0; i < source.length; i++) {
      var ch = source.charAt(i);
      if (ch === '"') {
        if (quoted && source.charAt(i + 1) === '"') i++;
        else quoted = !quoted;
      } else if (ch === delimiter && !quoted) count++;
    }
    return count;
  }

  function parseTable(text) {
    var source = String(text || "");
    var first = source.split(/\r?\n/).filter(function (line) { return line.trim(); })[0];
    if (!first) return { numbers: 0, headers: [], residualNamed: false, rows: 0 };
    var delimiter = delimiterCount(first, "\t") > delimiterCount(first, ",") ? "\t" : ",";
    var rows = splitDelimited(source, delimiter);
    if (!rows.length) return { numbers: 0, headers: [], residualNamed: false, rows: 0 };
    var headers = rows[0].map(function (h) { return String(h).trim(); });
    var numbers = 0;
    var labeledTotal = headers.some(function (h) { return /^total$/i.test(h); });
    for (var r = 1; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        var raw = String(rows[r][c]);
        var n = Number(raw.replace(/[$,\s]/g, ""));
        if (isFinite(n) && /[0-9]/.test(raw)) numbers++;
      }
    }
    return { numbers: numbers, headers: headers, residualNamed: labeledTotal, rows: Math.max(0, rows.length - 1) };
  }

  function countJsonNumbers(value) {
    if (typeof value === "number" && isFinite(value)) return 1;
    if (!value || typeof value !== "object") return 0;
    var count = 0;
    Object.keys(value).forEach(function (key) { count += countJsonNumbers(value[key]); });
    return count;
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
      if (file.size > MAX_WORKBOOK_BYTES) return refuse("FILE_TOO_LARGE", { name: name, bytes: file.size });
      var hash = await sha256(name + "|" + file.size + "|" + file.lastModified);
      return seat({
        kind: kind,
        analysis: "METADATA_ONLY",
        name: name,
        bytes: file.size,
        hash: hash,
        hash_basis: "NAME_SIZE_LAST_MODIFIED",
        headers: [],
        numbers: 0,
        residual_named: false,
        residual_unit: "SEED",
        note: "Workbook fingerprinted from filename, size, and modified time only. Cell values were not parsed; no leftover invented."
      });
    }

    if (file.size > MAX_TEXT_BYTES) return refuse("FILE_TOO_LARGE", { name: name, bytes: file.size });
    var text = await file.text();
    if (SECRET.test(text.slice(0, 4000))) return refuse("SECRET_IN_FILE");
    var hash = await sha256(text);
    var stats = { numbers: 0, residualNamed: false };
    if (kind === "json") {
      try {
        var node = JSON.parse(text);
        stats.numbers = countJsonNumbers(node);
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
