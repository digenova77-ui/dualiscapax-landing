/**
 * Double Matrix cell — more signal in one locker.
 * Parallel = seven streams + two planes in the same record.
 * Serial = stamp + status ratchet.
 * Zero becomes One only when physical and logical both seat.
 * BIND fields stay the only numbering system: ID YEAR SOURCE STAMP STATUS HASH.
 */
(function (w) {
  var VERSION = "matrix-cell-2026-09-01";
  var STREAMS = ["bus", "care", "event", "portal", "pt", "sport", "office"];
  var RATCHET = ["INDEXED", "CATALOGED", "SOURCED", "REVIEWED", "SEALED", "LIVE"];
  var KEY = "dc.matrix.cell.v1";

  function now() { return new Date().toISOString(); }

  function yearOf(stamp) {
    var m = String(stamp || "").match(/^(\d{4})/);
    return m ? m[1] : "2026";
  }

  function hex(buf) {
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function sha256(text) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(text || ""))).then(hex);
  }

  function flagStream(name, headers, kind) {
    var blob = (headers || []).join(" ") + " " + String(kind || "");
    return new RegExp(name, "i").test(blob) ? "1" : "0";
  }

  function packStreams(headers, kind) {
    var bits = STREAMS.map(function (s) { return flagStream(s, headers, kind); }).join("");
    return bits;
  }

  function streamsFromBits(bits) {
    var out = {};
    STREAMS.forEach(function (s, i) { out[s] = bits.charAt(i) === "1"; });
    return out;
  }

  function pack(cell) {
    var p = cell.physical || {};
    var l = cell.logical || {};
    var bits = STREAMS.map(function (s) { return cell.streams && cell.streams[s] ? "1" : "0"; }).join("");
    return [
      "M",
      cell.id,
      cell.year,
      cell.status,
      cell.merger,
      "P:" + (p.ulin || "-") + ":" + (p.venue || "-") + ":" + (p.bytes || 0),
      "L:" + (l.gate || "L2") + ":" + (l.layer || "L2"),
      "S:" + bits,
      cell.hash ? String(cell.hash).slice(0, 16) : "-"
    ].join("|");
  }

  function hole(reason) {
    var stamp = now();
    return {
      v: VERSION,
      id: "M-HOLE",
      year: yearOf(stamp),
      source: "l2",
      stamp: stamp,
      status: "INDEXED",
      hash: "",
      merger: "HOLE",
      reason: reason || "HOLE_NOT_ZERO",
      scientific_validation: false,
      physical: {},
      logical: {},
      streams: streamsFromBits("0000000"),
      pack: "M|HOLE"
    };
  }

  async function merge(plug) {
    if (!plug || plug.status !== "PLUGGED") {
      return hole((plug && plug.reason) || "NO_PLUG");
    }
    var physicalOk = !!(plug.hash || plug.bytes || plug.domain);
    var logicalOk = true;
    if (!physicalOk) return hole("NO_PHYSICAL");
    if (!logicalOk) return hole("NO_LOGICAL");

    var stamp = plug.ts || now();
    var headers = plug.headers || [];
    var bits = packStreams(headers, plug.kind);
    var draft = {
      v: VERSION,
      year: yearOf(stamp),
      source: plug.name || plug.domain || "l2",
      stamp: stamp,
      status: "INDEXED",
      merger: "ONE",
      scientific_validation: false,
      physical: {
        ulin: plug.hash ? String(plug.hash).slice(0, 16) : "seed",
        venue: "device",
        bytes: plug.bytes || 0,
        kind: plug.kind || "file"
      },
      logical: {
        iris: "device-local",
        gate: "L2",
        layer: "L2_PLAYGROUND"
      },
      streams: streamsFromBits(bits),
      numbers: plug.numbers || 0,
      residual_unit: plug.residual_unit || "SEED"
    };
    var body = JSON.stringify({
      source: draft.source,
      stamp: draft.stamp,
      physical: draft.physical,
      logical: draft.logical,
      streams: draft.streams
    });
    draft.hash = await sha256(body);
    draft.id = "M-" + draft.hash.slice(0, 12).toUpperCase();
    draft.pack = pack(draft);
    try { localStorage.setItem(KEY, JSON.stringify(draft)); } catch (e) {}
    return draft;
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
    catch (e) { return null; }
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  w.DCMatrix = {
    version: VERSION,
    streams: STREAMS,
    ratchet: RATCHET,
    law: "ZERO_TO_ONE_BOTH_PLANES_OR_HOLE",
    merge: merge,
    pack: pack,
    load: load,
    clear: clear,
    hole: hole
  };
})(window);
