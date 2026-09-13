(function (w) {
  w.IrisLive = {
    version: "iris-live-nohang",
    run: function (text, opt) {
      if (w.DCLMLook && DCLMLook.run) return DCLMLook.run(text, opt);
      return Promise.resolve({ spoken: "I'm Iris. Refresh this page." });
    }
  };
})(window);
