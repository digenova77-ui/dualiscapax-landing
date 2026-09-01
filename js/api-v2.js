/**
 * DualisCapax API v2 client helper — V1 compatible.
 * Live chat path is /v2/chat (unified). /api/v2/chat is an alias only.
 * Extra AV capability flags are additive. Workers that ignore them stay valid.
 */
(function (g) {
  var VERSION = "api-v2-compat-2026-09-01";

  function uuid() {
    if (g.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "dc-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function baseUrl() {
    var base = (g.DC_API_BASE || "").replace(/\/$/, "");
    try {
      var q = new URLSearchParams(location.search).get("api");
      if (q) base = q.replace(/\/$/, "");
    } catch (e) {}
    return base;
  }

  function avCaps(opts) {
    if (opts && opts.capabilities) return opts.capabilities;
    if (g.IrisAVBridge && g.IrisAVBridge.caps) return g.IrisAVBridge.caps();
    return { want: ["text"], have: ["text"] };
  }

  async function postChat(path, body, headers) {
    var base = baseUrl();
    if (!base) throw new Error("DC_API_BASE not set");
    var res = await fetch(base + path, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body)
    });
    var data = await res.json().catch(function () {
      return { v: 2, ok: false, error: { code: "BAD_JSON", message: "Invalid response" } };
    });
    data._http = res.status;
    data._path = path;
    return data;
  }

  g.dcApiV2Chat = async function dcApiV2Chat(opts) {
    opts = opts || {};
    if (g.dcApi && typeof g.dcApi.chat === "function") {
      return g.dcApi.chat(opts.messages || [], opts);
    }
    var headers = { "Content-Type": "application/json" };
    if (opts.fuelBalance != null) headers["X-DC-Fuel"] = String(opts.fuelBalance);
    if (opts.session) headers["X-DC-Session"] = opts.session;
    var body = {
      v: 2,
      api_version: "2",
      id: opts.id || uuid(),
      type: "chat.completion",
      plane: "dualiscapax",
      channel: opts.channel || "depth",
      payload: {
        messages: opts.messages || [],
        model: opts.model,
        max_tokens: opts.max_tokens || 1024,
        temperature: opts.temperature
      },
      messages: opts.messages || [],
      fuel: {
        intent: opts.channel === "open" ? "none" : "burn",
        units: opts.fuelUnits || 1
      },
      capabilities: avCaps(opts)
    };
    try {
      return await postChat("/v2/chat", body, headers);
    } catch (err) {
      return postChat("/api/v2/chat", body, headers);
    }
  };

  g.dcApiV1Chat = async function dcApiV1Chat(messages, opts) {
    opts = opts || {};
    if (g.dcChatV2) return g.dcChatV2(messages, opts);
    return g.dcApiV2Chat({ messages: messages, channel: "open", fuelUnits: 0 });
  };

  g.DC_API_V2_HELPER = VERSION;
})(typeof window !== "undefined" ? window : globalThis);
