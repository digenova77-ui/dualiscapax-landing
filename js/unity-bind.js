/**
 * Unity bind — local tag + room hook.
 * Look is free. Invoke after bind.
 * DEMO: U1 may invoke every house pack on this device (test).
 * LIVE: U1 is a member. Rink creator-comp only. No god mode. No other people's seats.
 */
(function (w) {
  var VERSION = "unity-bind-2026-09-22-grant";
  var ID_KEY = "dc.unity.id";
  var BIND_KEY = "dc.unity.bind";

  function read(key) {
    try { return JSON.parse(w.localStorage.getItem(key) || "null"); } catch (e) { return null; }
  }
  function write(key, val) {
    try { w.localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
    return val;
  }

  function current() {
    return read(ID_KEY);
  }

  function binds() {
    return read(BIND_KEY) || {};
  }

  function hasId() {
    var id = current();
    return !!(id && (id.public || id.human));
  }

  function isU1() {
    var id = current();
    if (!id) return false;
    return id.human === "U1" || id.public === "DC1-H1-0001" || id.seat === "operator_first";
  }

  function isLive() {
    if (w.DC_LIVE === true) return true;
    try { return w.localStorage.getItem("dc.unity.live") === "1"; } catch (e) { return false; }
  }

  function isDemo() {
    return !isLive();
  }

  function mintVisitor() {
    var exist = current();
    if (exist && exist.public) return exist;
    var serial = 1000 + Math.floor(Math.random() * 8999);
    var unity = (w.UnityID && UnityID.publicOf)
      ? UnityID.publicOf(1, 2, serial)
      : { public: "DC1-H2-" + String(serial).padStart(4, "0"), check: "00", human: "U" + serial };
    var packet = {
      schema: "unity.id.v1",
      version: VERSION,
      human: unity.human || ("U" + serial),
      public: unity.public,
      check: unity.check,
      seat: "visitor",
      seed: 2,
      serial: serial,
      parent: "DC1-H1-0001",
      can_hatch: true,
      kyc: "SELF_DECLARED",
      at: new Date().toISOString()
    };
    return write(ID_KEY, packet);
  }

  function bind(pack) {
    var id = current() || mintVisitor();
    var room = String(pack || "house");
    var map = binds();
    map[room] = { public: id.public, human: id.human, at: Date.now() };
    write(BIND_KEY, map);
    return { ok: true, id: id, pack: room, bound: true };
  }

  function bound(pack) {
    if (!hasId()) return false;
    var room = String(pack || "");
    if (!room) return false;
    var map = binds();
    return !!(map[room] && map[room].public);
  }

  function canLook() {
    return true;
  }

  function canInvoke(pack) {
    if (!hasId()) return false;
    var room = String(pack || "house");
    if (isDemo() && isU1()) return true;
    if (isLive() && isU1() && room === "rink") return true;
    return bound(room);
  }

  function snapshot() {
    return {
      version: VERSION,
      hasId: hasId(),
      demo: isDemo(),
      u1: isU1(),
      id: current(),
      binds: binds()
    };
  }

  w.UnityBind = {
    version: VERSION,
    current: current,
    hasId: hasId,
    isU1: isU1,
    isDemo: isDemo,
    mint: mintVisitor,
    bind: bind,
    bound: bound,
    canLook: canLook,
    canInvoke: canInvoke,
    snapshot: snapshot
  };
})(window);
