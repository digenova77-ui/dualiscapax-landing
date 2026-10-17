/**
 * IrisSession — one environment.
 * Truthful state tracking for the Iris page. UI speech is owned by the page;
 * this module must never claim that the browser is speaking when it is not.
 */
(function (w) {
  var VERSION = "iris-session-2026-10-17-state-recovery";
  var STATE = { IDLE: "idle", LISTEN: "listen", THINK: "think", SPEAK: "speak", WORK: "work" };
  var id = "iris-" + Date.now().toString(36);
  var state = STATE.IDLE;
  var last = { text: "", spoken: "", job: null, ticket: null, rec: null };
  var listeners = [];

  function emit(kind, extra) {
    var ev = { id: id, kind: kind, state: state, at: Date.now(),
      pose: w.IrisSphere && w.IrisSphere.pose ? w.IrisSphere.pose() : null, extra: extra || null };
    for (var i = 0; i < listeners.length; i++) { try { listeners[i](ev); } catch (e) {} }
    if (w.CosmicFactory && w.CosmicFactory.tick) { try { w.CosmicFactory.tick(kind, ev); } catch (e2) {} }
    return ev;
  }
  function paint() {
    if (!w.IrisSphere) return;
    if (w.IrisSphere.setListening) w.IrisSphere.setListening(state === STATE.LISTEN);
    if (w.IrisSphere.setSpeaking) w.IrisSphere.setSpeaking(state === STATE.SPEAK || state === STATE.WORK);
    if (w.IrisSphere.setWoken) w.IrisSphere.setWoken(state !== STATE.IDLE);
    if (w.IrisSphere.setEnergy) w.IrisSphere.setEnergy(state === STATE.SPEAK ? 0.72 : state === STATE.WORK ? 0.48 : state === STATE.LISTEN ? 0.34 : state === STATE.THINK ? 0.42 : 0.16);
  }
  function setState(next) {
    if (state === next) return state;
    state = next; paint(); emit("state", { state: next }); return state;
  }
  function admit(text) {
    if (w.IrisFuel && w.IrisFuel.admit) return w.IrisFuel.admit(text);
    return { ok: true, paid: false, grade: { lane: "LOOK", burn: 0, grant: "LOOK" } };
  }
  function attach(host) {
    if (w.IrisSphere && w.IrisSphere.mount) { try { w.IrisSphere.mount(host || "#presence"); } catch (e) {} }
    if (w.IrisAV && w.IrisAV.arm) { try { w.IrisAV.arm(); } catch (e2) {} }
    setState(STATE.IDLE); emit("attach", { href: String(w.location && w.location.pathname || "") }); return snapshot();
  }
  function listen() {
    setState(STATE.LISTEN);
    if (w.IrisAV && w.IrisAV.listen) return w.IrisAV.listen();
    return Promise.resolve(null);
  }
  function think(text, options) {
    options = options || {};
    last.text = String(text || "");
    var input = typeof options.prompt === "string" ? options.prompt : last.text;
    last.ticket = admit(last.text);
    setState(STATE.THINK);
    emit("think", {
      characters: last.text.length,
      hasLocalFile: !!(w.IrisFile && w.IrisFile.snapshot && w.IrisFile.snapshot().loaded),
      ticket: last.ticket
    });
    var task;
    try {
      if (w.DCLMLook && w.DCLMLook.run) task = Promise.resolve(w.DCLMLook.run(input, last.ticket, options));
      else if (w.IrisLive && w.IrisLive.run) task = Promise.resolve(w.IrisLive.run(input));
      else task = Promise.resolve({ grant: "UNAVAILABLE", lane: "ERROR", spoken: "I can't reach an answer engine in this session. Please try again later." });
    } catch (error) { task = Promise.reject(error); }
    return task.then(function (rec) {
      last.rec = rec || null;
      last.spoken = rec && (rec.spoken || rec.text) || "";
      if (state === STATE.THINK) setState(STATE.IDLE);
      emit("result", { grant: rec && rec.grant || "UNSPECIFIED", lane: rec && rec.lane || "UNSPECIFIED", available: !!(rec && (rec.spoken || rec.text)) });
      return rec || { grant: "EMPTY", lane: "ERROR", spoken: "I didn't receive an answer. Please try again." };
    }, function () {
      if (state === STATE.THINK) setState(STATE.IDLE);
      var rec = { grant: "ERROR", lane: "ERROR", spoken: "I couldn't complete that request just now. Please try again." };
      last.rec = rec; last.spoken = rec.spoken; emit("error", { code: "THINK_FAILED" }); return rec;
    });
  }
  function speak(rec) {
    rec = rec || last.rec || {}; last.spoken = rec.spoken || rec.text || ""; last.rec = rec;
    setState(STATE.SPEAK); emit("speak", { spoken: last.spoken, grant: rec.grant, lane: rec.lane });
    var done = function () { setState(STATE.IDLE); return rec; };
    if (w.IrisAV && w.IrisAV.speak && last.spoken) return Promise.resolve(w.IrisAV.speak(last.spoken)).then(done, done);
    return Promise.resolve(done());
  }
  function work(job) {
    last.job = job || { kind: "tick" };
    var depth = last.ticket && last.ticket.ok && last.ticket.grade && last.ticket.grade.lane === "DEPTH";
    setState(STATE.WORK); emit("work", { job: last.job, depth: !!depth });
    if (depth && w.CosmicRuntime && w.CosmicRuntime.step) { try { last.job.runtime = w.CosmicRuntime.step(); } catch (e) {} }
    if (w.CosmicFactory && w.CosmicFactory.tick) { try { w.CosmicFactory.tick("work", last.job); } catch (e2) {} }
    return snapshot();
  }
  function say(text) { return think(text).then(speak); }
  function interrupt() {
    if (w.IrisAV && w.IrisAV.stop) { try { w.IrisAV.stop(); } catch (e) {} }
    setState(STATE.LISTEN); emit("barge");
  }
  function snapshot() {
    return { version: VERSION, id: id, state: state, last: last,
      pose: w.IrisSphere && w.IrisSphere.pose ? w.IrisSphere.pose() : null,
      hasAv: !!(w.IrisAV && w.IrisAV.speak), hasLook: !!(w.DCLMLook && w.DCLMLook.run),
      hasFuel: !!(w.IrisFuel && w.IrisFuel.admit), hasFactory: !!(w.CosmicFactory && w.CosmicFactory.tick),
      hasRuntime: !!(w.CosmicRuntime && w.CosmicRuntime.step) };
  }
  w.IrisSession = { version: VERSION, STATES: STATE, attach: attach, listen: listen, think: think, speak: speak,
    work: work, say: say, interrupt: interrupt, admit: admit, state: function () { return state; },
    id: function () { return id; }, snapshot: snapshot, on: function (fn) { if (typeof fn === "function") listeners.push(fn); } };
})(window);
