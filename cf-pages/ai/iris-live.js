(function (w) {
  function load(src) {
    var s = document.createElement("script");
    s.src = src;
    document.head.appendChild(s);
  }
  load("/js/quat-bridge.js");
  w.IrisLive = {
    version: "iris-live-quat",
    run: function (text, opt) {
      if (w.DCLMLook && DCLMLook.run) return DCLMLook.run(text, opt);
      return Promise.resolve({ spoken: "I'm Iris. Refresh this page." });
    }
  };
})(window);
