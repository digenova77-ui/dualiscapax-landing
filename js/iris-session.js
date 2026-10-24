/**
 * IrisSession — one environment.
 * The clerk stage precedes think(): admit() then LOOK before the external model call.
 * When IrisAuthorize and a signing secret are available, the clerk calls /v1/authorize.
 */
(function (w) {
  var VERSION = "iris-session-2026-10-24-authorize";
  var STATE = { IDLE: "idle", LISTEN: "listen", THINK: "think", SPEAK: "speak", WORK: "work" };
  var id = "iris-" + Date.now().toString(36);
  var state = STATE.IDLE;
  var last = { text: "", spoken: "", job: null, ticket: null, rec: null, auth: null };
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

  function admit(text) {
    if (w.IrisFuel && IrisFuel.admit) return IrisFuel.admit(text);
    return { ok: true, paid: false, grade: { lane: "LOOK", burn: 0, grant: "LOOK" } };
  }

  function getSigningSecret() {
    // Staging-only compatibility hook. Any value exposed to browser JavaScript
    // is public to that browser; production must use a server-side signer.
    return w.IrisSigningSecret || null;
  }

  function canAuthorize() {
    if (!w.IrisAuthorize || typeof w.IrisAuthorize.authorize !== "function") return false;
    if (w.IrisSigningSecret) return true;
    if (w.IrisAuthorizeBase) return true;
    return false;
  }

  function receiptOk(ticket) {
    var r = ticket && (ticket.receipt || (ticket.auth && ticket.auth.receipt));
    if (w.IrisReceipt && IrisReceipt.validReceipt) return IrisReceipt.validReceipt(r);
    if (!r || typeof r !== "object") return false;
    if (r.contract !== "dualis.receipt.v1") return false;
    if (typeof r.id !== "string" || r.id.indexOf("rct_") !== 0) return false;
    if (typeof r.sha256 !== "string" || !/^[0-9a-f]{64}$/i.test(r.sha256)) return false;
    if (typeof r.request_id !== "string" || !r.request_id) return false;
    return true;
  }

  async function buildAuthBody(text, ticket) {
    var lane = (ticket && ticket.grade && ticket.grade.lane) || "LOOK";
    var action = lane === "DEPTH" ? "iris.turn.depth" : lane === "WORK" ? "iris.turn.work" : "iris.turn.look";
    var input = String(text || "");
    var digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    var inputSha256 = Array.from(new Uint8Array(digest))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
    return {
      request_id: id + "-" + Date.now().toString(36),
      action: action,
      input_sha256: inputSha256,
      principal: { unity_id: id },
      compute_lane: lane.toLowerCase(),
      memory_requested: false,
      text: input
    };
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
    last.ticket = admit(last.text);
    setState(STATE.THINK);
    emit("think", { text: last.text, ticket: last.ticket });

    var secret = getSigningSecret();
    var authPromise;
    if (!last.ticket || last.ticket.ok !== true) {
      last.ticket = { ok: false, deny: { spoken: "Not authorized." }, reason: "clerk-denied" };
      authPromise = Promise.resolve(null);
    } else if (!canAuthorize()) {
      last.ticket = { ok: false, deny: { spoken: "Not authorized." }, reason: "authorize-unavailable" };
      last.auth = { error: "authorize-unavailable" };
      emit("authorize-error", { error: "authorize-unavailable" });
      authPromise = Promise.resolve(null);
    } else {
      authPromise = buildAuthBody(last.text, last.ticket).then(function (body) {
        return w.IrisAuthorize.authorize(body, secret);
      }).then(function (res) {
        last.auth = res;
        emit("authorize", res);
        if (!res || !res.ok || !res.data || res.data.authorized !== true || !receiptOk({ receipt: res.data && res.data.receipt })) {
          last.ticket = { ok: false, deny: { spoken: "Not authorized." }, reason: "authorize-denied" };
        } else {
          last.ticket.receipt = res.data.receipt;
          last.ticket.auth = res.data;
        }
        return res;
      }).catch(function (err) {
        last.auth = { error: String(err) };
        last.ticket = { ok: false, deny: { spoken: "Not authorized." }, reason: "authorize-error" };
        emit("authorize-error", { error: String(err) });
        return null;
      });
    }

    return authPromise.then(function () {
      if (last.ticket && last.ticket.ok === false) {
        return { spoken: (last.ticket.deny && last.ticket.deny.spoken) || "Not authorized.", lane: "DENIED" };
      }
      var lane = last.ticket && last.ticket.grade && last.ticket.grade.lane;
      if ((lane === "DEPTH" || lane === "WORK") && !receiptOk(last.ticket)) {
        return { spoken: "Not authorized.", lane: "DENIED", reason: "receipt-required" };
      }
      if (w.DCLMLook && DCLMLook.run) return Promise.resolve(DCLMLook.run(last.text, last.ticket)).then(function (rec) {
        last.rec = rec || null;
        return rec;
      });
      if (w.IrisLive && IrisLive.run) {
        if (!receiptOk(last.ticket)) return { spoken: "Not authorized.", lane: "DENIED", reason: "receipt-required" };
        return Promise.resolve(IrisLive.run(last.text, last.ticket.receipt));
      }
      if (w.IrisLearn && IrisLearn.step) {
        if (!receiptOk(last.ticket)) return { spoken: "Not authorized.", lane: "DENIED", reason: "receipt-required" };
        return Promise.resolve(IrisLearn.step(last.text, last.ticket.receipt));
      }
      return Promise.resolve({ spoken: last.text || "I'm Iris.", lane: "LOOK" });
    });
  }

  function speak(rec) {
    rec = rec || last.rec || {};
    last.spoken = rec.spoken || rec.text || "";
    last.rec = rec;
    setState(STATE.SPEAK);
    emit("speak", { spoken: last.spoken, grant: rec.grant, lane: rec.lane });
    var done = function () { setState(STATE.IDLE); return rec; };
    if (w.IrisAV && IrisAV.speak && last.spoken) {
      return Promise.resolve(IrisAV.speak(last.spoken)).then(done, done);
    }
    return Promise.resolve(done());
  }

  function work(job) {
    last.job = job || { kind: "tick" };
    var depth = last.ticket && last.ticket.ok && last.ticket.grade && last.ticket.grade.lane === "DEPTH";
    var receipt = receiptOk(last.ticket);
    setState(STATE.WORK);
    emit("work", { job: last.job, depth: !!depth, receipt: receipt });
    if (depth && receipt && w.CosmicRuntime && CosmicRuntime.step) {
      try { last.job.runtime = CosmicRuntime.step(); } catch (e) {}
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
      hasFuel: !!(w.IrisFuel && IrisFuel.admit),
      hasFactory: !!(w.CosmicFactory && CosmicFactory.tick),
      hasRuntime: !!(w.CosmicRuntime && CosmicRuntime.step),
      hasAuthorize: !!(w.IrisAuthorize && IrisAuthorize.authorize)
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
    admit: admit,
    state: function () { return state; },
    id: function () { return id; },
    snapshot: snapshot,
    on: function (fn) { if (typeof fn === "function") listeners.push(fn); }
  };
})(window);
