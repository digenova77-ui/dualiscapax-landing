/** Iris live bridge — veto/greet/look first, then depth worker (Grok). No book. */
(function (w) {
  var VERSION = "iris-live-2026-08-31c";
  var DEFAULT_BASE = "https://dualiscapax-depth.digenova77.workers.dev";

  function apiBase() {
    var base = (w.DC_API_BASE || DEFAULT_BASE || "").replace(/\/$/, "");
    try {
      var q = new URLSearchParams(location.search).get("api");
      if (q) base = String(q).replace(/\/$/, "");
    } catch (e) {}
    return base;
  }

  function historyFrom(log, text) {
    var rows = [];
    if (log) {
      log.querySelectorAll(".bubble").forEach(function (b) {
        rows.push({
          role: b.classList.contains("you") ? "user" : "assistant",
          content: b.getAttribute("data-text") || b.textContent || ""
        });
      });
    }
    rows.push({ role: "user", content: text });
    return rows.slice(-12);
  }

  async function remote(text, opt) {
    var base = apiBase();
    if (!base) return null;
    var messages = historyFrom(opt && opt.log, text);
    // Prefer unified client when present
    if (w.dcApi && typeof w.dcApi.chat === "function") {
      try {
        var data = await w.dcApi.chat(messages, {
          channel: "open",
          fuelBalance: (w.DCFuel && w.DCFuel.balance) ? w.DCFuel.balance() : 1,
          max_tokens: 400
        });
        if (data && data.ok !== false) {
          var spoken = String(data.content || data.response_text || "").trim();
          if (spoken) return spoken.slice(0, 900);
        }
      } catch (e) {}
    }
    // Direct worker POST (same path the kernel uses)
    try {
      var res = await fetch(base + "/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-DC-Fuel": "1" },
        body: JSON.stringify({
          api_version: "2",
          messages: messages,
          max_tokens: 400
        })
      });
      var body = await res.json().catch(function () { return {}; });
      if (body && body.ok && (body.content || body.response_text)) {
        return String(body.content || body.response_text).trim().slice(0, 900);
      }
    } catch (e) {}
    return null;
  }

  async function run(text, opt) {
    opt = opt || {};
    if (!w.DCLMLook || typeof w.DCLMLook.run !== "function") {
      var spoken0 = await remote(text, opt);
      if (spoken0) return { grant: "MEASURE", kernel: VERSION, id: "remote", spoken: spoken0 };
      return { grant: "SEED", kernel: VERSION, spoken: "I'm Iris. Ask about DualisCapax, Fuel, Donate, Bind, or Measure." };
    }
    var recu = await w.DCLMLook.run(text, opt);
    if (recu && recu.grant === "VETO") return recu;
    if (recu && recu.grant !== "SEED") return recu;
    try {
      var spoken = await remote(text, opt);
      if (spoken) {
        return { grant: "MEASURE", voice: (opt && opt.voice) || "you", kernel: VERSION, id: "remote", spoken: spoken };
      }
    } catch (e) {}
    return recu || { grant: "SEED", kernel: VERSION, spoken: "I'm Iris. Ask about DualisCapax, Fuel, Donate, Bind, or Measure." };
  }

  w.IrisLive = { version: VERSION, run: run, apiBase: apiBase };
})(window);
