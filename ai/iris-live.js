/** Iris live bridge — veto/greet/look first, then depth worker. Empty tank keeps her voice. */
(function (w) {
  var VERSION = "iris-live-2026-09-01c";
  var DEFAULT_BASE = "https://dualiscapax-depth.digenova77.workers.dev";
  var EMPTY_VOICE = (w.DCLMLook && w.DCLMLook.EMPTY_VOICE) || "We need more Fuel, boss, if you want to ride any further. Tap Bind when you are ready — I will be here in the same voice.";

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

  function isEmptyRail(res, data) {
    var code = res && res.status;
    var blob = JSON.stringify(data || {}).toLowerCase();
    if (code === 402 || code === 403 || code === 429) return true;
    if (/insufficient quota|out of credits|credit|quota|empty tank|no credits|used all/.test(blob)) return true;
    return false;
  }

  async function remote(text, opt) {
    var base = apiBase();
    if (!base) return { kind: "down" };
    var messages = historyFrom(opt && opt.log, text);
    if (w.dcApi && typeof w.dcApi.chat === "function") {
      try {
        var data = await w.dcApi.chat(messages, {
          channel: "open",
          fuelBalance: (w.DCFuel && w.DCFuel.balance) ? w.DCFuel.balance() : 1,
          max_tokens: 400
        });
        if (data && data.ok !== false) {
          var spoken = String(data.content || data.response_text || "").trim();
          if (spoken) return { kind: "live", spoken: spoken.slice(0, 900) };
        }
        if (isEmptyRail({ status: data && data._http }, data)) return { kind: "empty" };
      } catch (e) {}
    }
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
        return { kind: "live", spoken: String(body.content || body.response_text).trim().slice(0, 900) };
      }
      if (isEmptyRail(res, body)) return { kind: "empty" };
    } catch (e) {}
    return { kind: "down" };
  }

  async function run(text, opt) {
    opt = opt || {};
    if (w.DCLMLook && typeof w.DCLMLook.run === "function") {
      var recu = await w.DCLMLook.run(text, opt);
      if (recu && recu.grant === "VETO") return recu;
      if (recu && recu.grant === "EMPTY") return recu;
      if (recu && recu.grant !== "SEED") return recu;
    }
    var got = await remote(text, opt);
    if (got && got.kind === "live" && got.spoken) {
      return { grant: "MEASURE", voice: (opt && opt.voice) || "you", kernel: VERSION, id: "remote", spoken: got.spoken };
    }
    return {
      grant: "EMPTY",
      kernel: VERSION,
      id: "empty-tank",
      spoken: EMPTY_VOICE,
      href: "/payments.html",
      label: "Add Fuel"
    };
  }

  w.IrisLive = { version: VERSION, run: run, apiBase: apiBase };
})(window);
