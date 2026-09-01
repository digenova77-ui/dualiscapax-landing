/**
 * AV V2 jacket. Does not replace IrisLive / DCLMLook / dcApi.
 * Attaches hologram + DSAP + device AV to the existing chat path.
 */
(function (w) {
  var VERSION = "av-bridge-v2-2026-09-01";
  var FUEL_LINE = "We need more fuel boss if you want to ride any further.";
  var mounted = false;

  function fuelEmpty(text) {
    var t = String(text || "");
    return /403|429|insufficient|out of credits|no credits|empty tank|quota/i.test(t);
  }

  function caps() {
    var have = ["text"];
    if (w.IrisAV) {
      if (w.IrisAV.state && w.IrisAV.state.cam) have.push("vision");
      if (w.IrisAV.state && (w.IrisAV.state.mic || w.IrisAV.state.rec)) have.push("audio");
      if (w.IrisAV.state && w.IrisAV.state.screen) have.push("screen");
      if (w.IrisAV.state && w.IrisAV.state.spatial) have.push("spatial");
    }
    return { want: ["text", "audio", "vision"], have: have, api: "v2", jacket: VERSION };
  }

  function speak(text) {
    var line = String(text || "");
    if (fuelEmpty(line)) line = FUEL_LINE;
    if (w.IrisHolo) {
      w.IrisHolo.setSpeaking(true);
      w.IrisHolo.setEnergy(0.8);
      setTimeout(function () { w.IrisHolo.setSpeaking(false); w.IrisHolo.setEnergy(0.22); }, Math.min(8000, 80 * line.length));
    }
    if (w.IrisAV && w.IrisAV.speak) w.IrisAV.speak(line);
    else if (w.speechSynthesis) {
      var u = new SpeechSynthesisUtterance(line.slice(0, 900));
      u.rate = 0.98; u.pitch = 0.96;
      w.speechSynthesis.cancel();
      w.speechSynthesis.speak(u);
    }
    return line;
  }

  function decorateChatOpts(opts) {
    opts = opts || {};
    opts.capabilities = caps();
    opts.api_version = "2";
    return opts;
  }

  function hookUnified() {
    if (!w.dcApi || w.dcApi.__avHooked) return;
    var orig = w.dcApi.chat.bind(w.dcApi);
    w.dcApi.chat = function (messages, opts) {
      return orig(messages, decorateChatOpts(opts));
    };
    w.dcApi.__avHooked = true;
  }

  function wireButtons() {
    var cam = document.getElementById("cam");
    var talk = document.getElementById("talk");
    var screenBtn = document.getElementById("screen") || document.getElementById("field");
    var hear = document.getElementById("hear");
    if (cam && w.IrisAV) {
      cam.addEventListener("click", function () {
        var on = !cam.classList.contains("on");
        w.IrisAV.camera(on).then(function (res) {
          cam.classList.toggle("on", !!(res && res.live));
          cam.setAttribute("aria-pressed", res && res.live ? "true" : "false");
          if (w.IrisHolo) w.IrisHolo.bindVideo(document.getElementById("you"));
        }).catch(function () {});
      });
    }
    if (talk && w.IrisAV) {
      talk.addEventListener("click", function () {
        var on = !talk.classList.contains("on");
        if (w.IrisHolo) w.IrisHolo.setListening(on);
        w.IrisAV.mic(on).then(function (res) {
          talk.classList.toggle("on", !!(res && res.live));
          talk.setAttribute("aria-pressed", res && res.live ? "true" : "false");
        }).catch(function () {});
      });
    }
    if (screenBtn && w.IrisAV) {
      screenBtn.addEventListener("click", function () {
        var on = !screenBtn.classList.contains("on");
        w.IrisAV.screen(on).then(function (res) {
          screenBtn.classList.toggle("on", !!(res && res.live));
          screenBtn.setAttribute("aria-pressed", res && res.live ? "true" : "false");
        }).catch(function () {});
      });
    }
    if (hear) {
      hear.addEventListener("click", function () {
        if (hear.classList.contains("on") && w.DSAP && w.DSAP.unlock) w.DSAP.unlock();
      });
    }
  }

  function mount() {
    if (mounted) return VERSION;
    mounted = true;
    var stage = document.getElementById("stage") || document.getElementById("log");
    if (w.IrisHolo && stage) {
      var wrap = document.getElementById("holo") || document.createElement("div");
      wrap.id = "holo";
      wrap.className = "holo";
      if (!wrap.parentNode && stage.parentNode) stage.parentNode.insertBefore(wrap, stage);
      else if (!wrap.parentNode) document.body.appendChild(wrap);
      w.IrisHolo.mount(wrap);
      w.IrisHolo.bindVideo(document.getElementById("you"));
    }
    hookUnified();
    wireButtons();
    if (w.DSAP && w.DSAP.unlock) {
      document.addEventListener("pointerdown", function once() {
        w.DSAP.unlock();
        document.removeEventListener("pointerdown", once);
      });
    }
    return VERSION;
  }

  w.IrisAVBridge = {
    version: VERSION,
    mount: mount,
    speak: speak,
    caps: caps,
    fuelLine: FUEL_LINE,
    decorate: decorateChatOpts
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(window);
