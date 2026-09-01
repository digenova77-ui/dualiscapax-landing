/** DualisCapax BYOK — visitor xAI key stays in this browser only. Never git. */
(function (w) {
  var STORE = "dc.byok.xai";
  var XAI = "https://api.x.ai/v1/chat/completions";
  var IRIS_SYSTEM =
    "You are Agent Iris, public face of DualisCapax. First person. Short. Veto first. " +
    "Do not invent treatment, diagnosis, securities, or coins. Simulation is not treatment. Ontario law applies.";

  function read() {
    try {
      return String(sessionStorage.getItem(STORE) || "").trim();
    } catch (e) {
      return "";
    }
  }

  function normalize(raw) {
    var k = String(raw || "").trim();
    if (/^bearer\s+/i.test(k)) k = k.replace(/^bearer\s+/i, "").trim();
    return k;
  }

  function valid(k) {
    return /^xai-[A-Za-z0-9_\-]{16,}$/.test(k || "");
  }

  function write(raw) {
    var k = normalize(raw);
    if (k && !valid(k)) return false;
    try {
      if (!k) sessionStorage.removeItem(STORE);
      else sessionStorage.setItem(STORE, k);
    } catch (e) {
      return false;
    }
    return true;
  }

  function present() {
    return valid(read());
  }

  async function chat(messages, opt) {
    opt = opt || {};
    var k = read();
    if (!valid(k)) return { ok: false, code: "NO_BYOK" };
    var body = {
      model: opt.model || "grok-4-fast",
      temperature: 0.3,
      max_tokens: opt.max_tokens || 400,
      messages: [{ role: "system", content: IRIS_SYSTEM }].concat(messages || [])
    };
    var res = await fetch(XAI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + k
      },
      body: JSON.stringify(body)
    });
    var data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) {
      var msg =
        (data && data.error && data.error.message) ||
        data.error ||
        data.detail ||
        "HTTP " + res.status;
      return { ok: false, status: res.status, error: String(msg) };
    }
    var text =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;
    return { ok: true, content: String(text || "").trim() };
  }

  function promptForKey() {
    var next = w.prompt(
      "Paste YOUR xAI key (starts with xai-). It stays in this browser tab only. Dualis does not keep it. Leave blank to clear.",
      ""
    );
    if (next === null) return present();
    if (!String(next).trim()) {
      write("");
      return false;
    }
    if (!write(next)) {
      w.alert("That does not look like an xai- key.");
      return present();
    }
    return true;
  }

  w.DCByok = {
    read: read,
    write: write,
    valid: valid,
    present: present,
    chat: chat,
    promptForKey: promptForKey
  };
})(typeof window !== "undefined" ? window : globalThis);
