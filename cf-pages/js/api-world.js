/**
 * Seat API v1 on Ground Zero (0) and API v2 on One (1).
 * Does not invent a third rail. Does not put secrets in the page.
 */
(function (g) {
  var VERSION = "api-world-2026-09-01";

  function detectWorld() {
    try {
      var q = new URLSearchParams(location.search).get("world");
      if (q === "1" || /^one$/i.test(q)) return 1;
      if (q === "0" || /^zero$/i.test(q) || /^gz$/i.test(q)) return 0;
    } catch (e) {}
    if (typeof g.DC_WORLD === "number") return g.DC_WORLD === 1 ? 1 : 0;
    try {
      var p = String(location.pathname || "").toLowerCase();
      if (/playground|\/one(\/|$)/.test(p)) return 1;
    } catch (e2) {}
    return 0;
  }

  function apply(world) {
    world = world === 1 ? 1 : 0;
    g.DC_WORLD = world;
    g.DC_WORLD_NAME = world === 1 ? "ONE" : "GROUND_ZERO";
    g.DC_API_VERSION = world === 1 ? "2" : "1";
    g.DC_API_PATH = world === 1 ? "/v2/chat" : "/v1/chat";
    return world;
  }

  var world = apply(detectWorld());

  function baseUrl() {
    var base = (g.DC_API_BASE || "https://dualiscapax-depth.digenova77.workers.dev").replace(/\/$/, "");
    try {
      var q = new URLSearchParams(location.search).get("api");
      if (q) base = String(q).replace(/\/$/, "");
    } catch (e) {}
    return base;
  }

  function caps() {
    if (world === 0) return { want: ["text"], have: ["text"], api: "v1", world: 0 };
    if (g.IrisAVBridge && typeof g.IrisAVBridge.caps === "function") return g.IrisAVBridge.caps();
    return { want: ["text", "audio", "vision"], have: ["text"], api: "v2", world: 1 };
  }

  async function post(path, body, headers) {
    var res = await fetch(baseUrl() + path, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body)
    });
    var data = await res.json().catch(function () {
      return { ok: false, error: "BAD_JSON" };
    });
    data._http = res.status;
    data._path = path;
    data.world = world;
    data.api_version = g.DC_API_VERSION;
    return data;
  }

  async function chat(messages, opts) {
    opts = opts || {};
    var headers = {
      "Content-Type": "application/json",
      "X-DC-World": String(world),
      "X-DC-API-Version": String(g.DC_API_VERSION)
    };
    if (opts.fuelBalance != null) headers["X-DC-Fuel"] = String(opts.fuelBalance);
    var body = {
      world: world,
      api_version: g.DC_API_VERSION,
      messages: messages || [],
      channel: opts.channel || (world === 1 ? "depth" : "open"),
      max_tokens: opts.max_tokens || 1024,
      capabilities: caps(),
      scientific_validation: false
    };
    var data = await post(g.DC_API_PATH, body, headers);
    if (world === 0 && data && (data._http === 404 || data.code === "NO_ROUTE")) {
      body.fallback = "v2_text_only";
      data = await post("/v2/chat", body, headers);
    }
    return data;
  }

  g.DCWorld = {
    version: VERSION,
    world: world,
    name: g.DC_WORLD_NAME,
    apiVersion: g.DC_API_VERSION,
    path: g.DC_API_PATH,
    detect: detectWorld,
    apply: apply,
    caps: caps,
    chat: chat
  };

  if (g.dcApi && typeof g.dcApi.chat === "function" && !g.dcApi.__worldHooked) {
    var orig = g.dcApi.chat.bind(g.dcApi);
    g.dcApi.chat = function (messages, opts) {
      opts = opts || {};
      opts.world = world;
      opts.api_version = g.DC_API_VERSION;
      return orig(messages, opts);
    };
    g.dcApi.__worldHooked = true;
  }
})(typeof window !== "undefined" ? window : globalThis);
