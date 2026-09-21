/**
 * Iris handoff — house depth worker first (native). BYOK optional.
 * No Connect Grok gate when house rail is bound.
 */
(function (w) {
  var IRIS_SYS =
    "You are Agent Iris of DualisCapax. First person. Short. Warm. " +
    "Answer greetings normally (hello → hello back). " +
    "No medical diagnosis or cure claims. Simulation is not treatment. Not securities. Ontario law.";

  function defaultFollowUps() {
    return [
      "What is DualisCapax in plain words?",
      "How does hockey à la carte work?",
      "What is Residual Law / money leak?"
    ];
  }

  function shape(answer, badge, badgeColor, followUps, rail) {
    return {
      answer: String(answer || "").trim(),
      badge: badge || "",
      badgeColor: badgeColor || "var(--accent-mint)",
      followUps: followUps && followUps.length ? followUps : defaultFollowUps(),
      rail: rail
    };
  }

  function isFuelGate(house) {
    if (!house) return false;
    var b = String(house.badge || "");
    var a = String(house.answer || "");
    return /Active Compute Modeling/i.test(b) || (/Fuel Units/i.test(a) && /Active Compute/i.test(b + a));
  }

  function extractRemoteText(data, rawText) {
    if (data && typeof data === "object") {
      var t = data.content || data.response_text || data.output || data.answer;
      if (!t && data.choices && data.choices[0] && data.choices[0].message) {
        t = data.choices[0].message.content;
      }
      if (t) return String(t).trim();
    }
    if (rawText && typeof rawText === "string") {
      var s = rawText.trim();
      if (s && s.charAt(0) !== "{" && s.charAt(0) !== "<") return s;
    }
    return "";
  }

  function pageAwareSystem(opts) {
    opts = opts || {};
    var path = String(opts.path || "").trim();
    var label = String(opts.plateLabel || "").trim();
    if (!path) return IRIS_SYS;
    var room = label ? (path + " (" + label + ")") : path;
    // Ephemeral room cue only — no PE invent, no Absolute crowning.
    return (
      IRIS_SYS +
      " User is viewing DualisCapax plate: " +
      room +
      ". Fit answers to that room. Do not invent Product Entities or crown Absolute."
    );
  }

  async function tryDepthWorker(prompt, pageOpts) {
    // Same-origin first = native on dualiscapax.ai (no visitor key).
    var urls = [
      "/api/v2/chat",
      "https://dualiscapax.ai/api/v2/chat",
      "https://dualiscapax-depth.digenova77.workers.dev/v2/chat"
    ];
    var body = JSON.stringify({
      world: 0,
      api_version: "2",
      messages: [
        { role: "system", content: pageAwareSystem(pageOpts) },
        { role: "user", content: String(prompt).slice(0, 2000) }
      ],
      max_tokens: 420
    });
    var lastErr = "";
    for (var i = 0; i < urls.length; i++) {
      try {
        var res = await fetch(urls[i], {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-DC-World": "0",
            "X-DC-API-Version": "2"
          },
          body: body,
          credentials: "omit",
          mode: "cors"
        });
        var raw = await res.text();
        var data = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch (eParse) {
          data = null;
        }
        if (!res.ok) {
          lastErr = (data && (data.error || data.message)) || ("HTTP " + res.status);
          continue;
        }
        var text = extractRemoteText(data, raw);
        if (text) {
          return shape(
            text.slice(0, 1600),
            "Iris",
            "var(--accent-cyan)",
            defaultFollowUps(),
            "grok-depth"
          );
        }
        lastErr = "empty reply";
      } catch (e) {
        lastErr = (e && e.message) || "network";
      }
    }
    return lastErr
      ? shape(
          "Iris hit a live-rail snag (" + String(lastErr).slice(0, 120) + "). Try once more — no key paste needed.",
          "⚠️ Live rail retry",
          "var(--accent-orange)",
          defaultFollowUps(),
          "depth-error"
        )
      : null;
  }

  async function tryByok(prompt, pageOpts) {
    if (!(w.DCByok && typeof w.DCByok.present === "function" && w.DCByok.present())) {
      return null;
    }
    try {
      var msgs = [];
      var sys = pageAwareSystem(pageOpts);
      if (sys && sys !== IRIS_SYS) {
        msgs.push({ role: "system", content: sys });
      }
      msgs.push({ role: "user", content: String(prompt) });
      var r = await w.DCByok.chat(msgs, {
        model: "grok-4-fast",
        max_tokens: 420
      });
      if (r && r.ok && r.content) {
        return shape(r.content, "Iris", "var(--accent-cyan)", defaultFollowUps(), "grok-byok");
      }
    } catch (e) {}
    return null;
  }

  async function ask(prompt, opts) {
    opts = opts || {};
    var house = opts.house || null;
    var pageOpts = {
      path: opts.path || (opts.pageContext && opts.pageContext.path) || "",
      plateLabel: opts.plateLabel || (opts.pageContext && opts.pageContext.plateLabel) || ""
    };

    var triage =
      typeof w.evaluateComputationalComplexity === "function"
        ? w.evaluateComputationalComplexity(prompt)
        : null;
    if ((triage && triage.isHeavy) || isFuelGate(house)) {
      if (house && house.answer) {
        return shape(
          house.answer,
          house.badge || "⚡ Fuel gate",
          house.badgeColor || "var(--accent-orange)",
          house.followUps,
          "fuel-gate"
        );
      }
      return shape(
        "That needs active compute Fuel — ask something lighter for free chat.",
        "⚡ Fuel gate",
        "var(--accent-orange)",
        defaultFollowUps(),
        "fuel-gate"
      );
    }

    var depth = await tryDepthWorker(prompt, pageOpts);
    if (depth) return depth;

    var byok = await tryByok(prompt, pageOpts);
    if (byok) return byok;

    return shape(
      "I’m Iris. Live brain is warming up — tap Ask again in a second. You shouldn’t need to paste any API key.",
      "⚪ Retry",
      "var(--text-secondary)",
      defaultFollowUps(),
      "retry"
    );
  }

  w.IrisHandoff = {
    ask: ask,
    needsRemote: function () { return true; },
    isFirmHouse: function () { return false; },
    freeRemaining: function () { return 0; },
    presentByok: function () {
      return !!(w.DCByok && w.DCByok.present && w.DCByok.present());
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
