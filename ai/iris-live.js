(function (w) {
  function load(src) {
    return new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = function () { resolve(true); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
  }
  load("/js/quat-bridge.js");
  w.IrisLive = {
    version: "iris-live-quat",
    run: function (text, opt) {
      if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(true);
      var done = (w.DCLMLook && DCLMLook.run)
        ? DCLMLook.run(text, opt)
        : Promise.resolve({ spoken: "I'm Iris. Refresh this page." });
      return Promise.resolve(done).then(function (rec) {
        if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(false);
        if (w.CosmicFactory && CosmicFactory.tick) CosmicFactory.tick("speak", { text: text });
        return rec;
      });
    }
  };
})(window);
