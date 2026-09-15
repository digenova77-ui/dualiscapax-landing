/**
 * DSAP-1.0 as API V2 jacket.
 * Mind: window.dcChatV2 → DC_API_BASE + /v2/chat.
 * Body: 64-point ring. Tap wakes. Hide sleeps.
 * Does not replace IrisLive. V1 helpers stay.
 */
(function (w) {
  if (w.DSAPJacket) return;
  function fuelEmpty(err) {
    var code = err && (err.code || (err.data && err.data.code));
    return code === "FUEL" || /fuel/i.test((err && err.message) || "");
  }
  function speakPlaced(text, seat) {
    if (!w.DSAP || !w.speechSynthesis) return;
    w.DSAP.wake();
    w.DSAP.place("puck", seat || 0);
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    w.speechSynthesis.cancel();
    w.speechSynthesis.speak(u);
  }
  async function ask(text, opts) {
    opts = opts || {};
    if (!w.dcChatV2) throw new Error("API V2 jacket missing dcChatV2");
    if (w.DSAP) w.DSAP.wake();
    try {
      var data = await w.dcChatV2([{ role: "user", content: text }], opts);
      var reply = (data && (data.reply || data.text || data.message)) || "";
      if (reply) speakPlaced(reply, opts.seat || 16);
      return data;
    } catch (err) {
      if (fuelEmpty(err)) {
        speakPlaced("we need more fuel boss if you want to ride any further", 48);
      }
      throw err;
    }
  }
  w.DSAPJacket = {
    version: "DSAP-1.0",
    api: "v2",
    ask: ask,
    path: function () {
      return (w.DC_API_BASE || "") + (w.DC_API_PATH || "/v2/chat");
    }
  };
})(window);
