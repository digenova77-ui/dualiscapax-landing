/**
 * IrisSession — one environment.
 * Gemini splits Live (orb + call) from Spark (jobs after hangup).
 * Dualis does not. Listen, think, speak, and work share one id and one orb.
 */
(function (w) {
  var VERSION = "iris-session-2026-09-22-one";
  var STATE = { IDLE: "idle", LISTEN: "listen", THINK: "think", SPEAK: "speak", WORK: "work" };
  var id = "iris-" + Date.now().toString(36);
  var state = STATE.IDLE;
  var last = { text: "", spoken: "", job: null };
  var listeners = [];

  function emit(kind, extra) {
    var ev = {
      id: id,
      kind: kind,
      state: state,
      at: Date.now(),
      pose: w.IrisSphere && IrisSphere.pose ? IrisSphere.pose() : null,
      extra: extra || null
    };
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](ev); } catch (e) {}
    }
    if (w.CosmicFactory && CosmicFactory.tick) {
      try { CosmicFactory.tick(kind, ev); } catch (e2) {}
    }
    return ev;
  }

  function paint() {
    if (!w.IrisSphere) return;
    if (IrisSphere.setListening) IrisSphere.setListening(state === STATE.LISTEN);
    if (IrisSphere.setSpeaking) IrisSphere.setSpeaking(state === STATE.SPEAK || state === STATE.WORK);
    if (IrisSphere.setWoken) IrisSphere.setWoken(state !== STATE.IDLE);
    if (IrisSphere.setEnergy) {
      IrisSphere.setEnergy(state === STATE.SPEAK ? 0.72 : state === STATE.WORK ? 0.48 : state === STATE.LISTEN ? 0.34 : 0.16);
    }
  }

  function setState(next) {
    if (state === next) return state;
    state = next;
    paint();
    emit("state", { state: next });
    return state;
  }

  function attach(host) {
    if (w.IrisSphere && IrisSphere.mount) {
      try { IrisSphere.mount(host || "#presence" || "#iris-sphere"); } catch (e) {}
    }
    if (w.IrisAV && IrisAV.arm) {
      try { IrisAV.arm(); } catch (e2) {}
    }
    setState(STATE.IDLE);
    emit("attach", { href: String(location && location.pathname || "") });
    return snapshot();
  }

  function listen() {
    setState(STATE.LISTEN);
    if (w.IrisAV && IrisAV.listen) return IrisAV.listen();
    return Promise.resolve(null);
  }

  function think(text) {
    last.text = text || "";
    setState(STATE.THINK);
    emit("think", { text: last.text });
    if (w.DCLMLook && DCLMLook.run) return Promise.resolve(DCLMLook.run(last.text));
    if (w.IrisLive && IrisLive.run) return Promise.resolve(IrisLive.run(last.text));
    return Promise.resolve({ spoken: last.text || "I'm Iris." });
  }

  function speak(rec) {
    rec = rec || {};
    last.spoken = rec.spoken || rec.text || "";
    setState(STATE.SPEAK);
    emit("speak", { spoken: last.spoken });
    var done = function () { setState(STATE.IDLE); return rec; };
    if (w.IrisAV && IrisAV.speak && last.spoken) {
      return Promise.resolve(IrisAV.speak(last.spoken)).then(done, done);
    }
    return Promise.resolve(done());
  }

  function work(job) {
    last.job = job || { kind: "tick" };
    setState(STATE.WORK);
    emit("work", last.job);
    if (w.CosmicRuntime && CosmicRuntime.step) {
      try { CosmicRuntime.step(); } catch (e) {}
    }
    if (w.CosmicFactory && CosmicFactory.tick) {
      try { CosmicFactory.tick("work", last.job); } catch (e2) {}
    }
    return snapshot();
  }

  function say(text) {
    return think(text).then(speak);
  }

  function interrupt() {
    if (w.IrisAV && IrisAV.stop) {
      try { IrisAV.stop(); } catch (e) {}
    }
    setState(STATE.LISTEN);
    emit("barge");
  }

  function snapshot() {
    return {
      version: VERSION,
      id: id,
      state: state,
      last: last,
      pose: w.IrisSphere && IrisSphere.pose ? IrisSphere.pose() : null,
      hasAv: !!(w.IrisAV && IrisAV.speak),
      hasLook: !!(w.DCLMLook && DCLMLook.run),
      hasFactory: !!(w.CosmicFactory && CosmicFactory.tick),
      hasRuntime: !!(w.CosmicRuntime && CosmicRuntime.step)
    };
  }

  w.IrisSession = {
    version: VERSION,
    STATES: STATE,
    attach: attach,
    listen: listen,
    think: think,
    speak: speak,
    work: work,
    say: say,
    interrupt: interrupt,
    state: function () { return state; },
    id: function () { return id; },
    snapshot: snapshot,
    on: function (fn) { if (typeof fn === "function") listeners.push(fn); }
  };
})(window);
