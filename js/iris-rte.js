/**
 * RTE session — one app shell. Website is a door. Packs load in a sandbox.
 * More than a page theme; not a second OS.
 */
(function (w) {
  var VERSION = "iris-rte-2026-09-22";
  var host = null;
  var frame = null;
  var pack = null;
  var listeners = [];

  function emit(kind, extra) {
    var ev = { kind: kind, pack: pack && pack.id, at: Date.now(), extra: extra || null };
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](ev); } catch (e) {}
    }
    if (w.IrisSession && IrisSession.on && kind === "boot") return ev;
    return ev;
  }

  function realm() {
    return (w.IrisRealm && IrisRealm.here && IrisRealm.here()) || {
      id: "house", spoken: "DualisCapax.", menu: [], cue: "none", pipe: null
    };
  }

  function paintChrome() {
    pack = realm();
    if (w.IrisRealm && IrisRealm.paint) IrisRealm.paint();
    if (!host) return pack;
    var stamp = host.querySelector("#realm-stamp") || w.document.getElementById("realm-stamp");
    if (stamp) stamp.textContent = "Demo · look $0 · " + (pack.room || pack.id);
    var nav = host.querySelector("#realm-menu");
    if (nav && pack.menu) {
      nav.innerHTML = "";
      pack.menu.forEach(function (m) {
        var a = w.document.createElement("a");
        a.href = m.href;
        a.textContent = m.label;
        nav.appendChild(a);
      });
    }
    return pack;
  }

  function sandbox(src) {
    if (!host || !src) return null;
    if (!frame) {
      frame = w.document.createElement("iframe");
      frame.id = "rte-pipe";
      frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
      frame.setAttribute("title", "Realm content");
      frame.style.cssText = "width:100%;height:100%;border:0;background:transparent";
      var stage = host.querySelector("#rte-stage") || host;
      stage.appendChild(frame);
    }
    frame.src = src;
    return frame;
  }

  function api(msg) {
    if (!msg || !msg.op) return { ok: false };
    if (msg.op === "here") return { ok: true, pack: pack || realm() };
    if (msg.op === "speak" && w.IrisAV && IrisAV.speak) {
      IrisAV.speak(String(msg.text || (pack && pack.spoken) || ""));
      return { ok: true };
    }
    if (msg.op === "cue" && w.IrisRealm && IrisRealm.cue) {
      return { ok: true, pack: IrisRealm.cue() };
    }
    if (msg.op === "admit" && w.IrisFuel && IrisFuel.admit) {
      return IrisFuel.admit(msg.text || "");
    }
    if (msg.op === "think" && w.IrisSession && IrisSession.think) {
      return IrisSession.think(msg.text || "");
    }
    return { ok: false, error: "unknown-op" };
  }

  function onMessage(ev) {
    if (!frame || ev.source !== frame.contentWindow) return;
    var out = api(ev.data || {});
    try { ev.source.postMessage({ rte: VERSION, reply: out }, "*"); } catch (e) {}
  }

  function attach(sel) {
    host = typeof sel === "string" ? w.document.querySelector(sel) : (sel || w.document.body);
    paintChrome();
    w.addEventListener("message", onMessage);
    if (w.IrisSession && IrisSession.attach) {
      try { IrisSession.attach("#presence"); } catch (e) {}
    }
    emit("boot", { href: String(location && location.pathname || "") });
    return snapshot();
  }

  function load(idOrUrl) {
    paintChrome();
    var src = idOrUrl;
    if (pack && pack.pipe && !src) src = pack.pipe;
    if (src && /^https?:|^\//.test(src)) sandbox(src);
    if (w.IrisRealm && IrisRealm.cue) {
      try { IrisRealm.cue(); } catch (e2) {}
    }
    emit("load", { src: src || null });
    return snapshot();
  }

  function snapshot() {
    return {
      version: VERSION,
      pack: pack || realm(),
      hasSession: !!(w.IrisSession && IrisSession.think),
      hasRealm: !!(w.IrisRealm && IrisRealm.here),
      sandboxed: !!(frame && frame.src)
    };
  }

  w.IrisRTE = {
    version: VERSION,
    attach: attach,
    load: load,
    api: api,
    snapshot: snapshot,
    on: function (fn) { if (typeof fn === "function") listeners.push(fn); }
  };
})(window);
