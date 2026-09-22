(function (w) {
  w.IrisLive = {
    version: "iris-live-2026-09-22-quiet",
    run: function (text, opt) {
      if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(true);
      var done = (w.DCLMLook && DCLMLook.run)
        ? DCLMLook.run(text, opt)
        : Promise.resolve({ spoken: "I'm Iris." });
      return Promise.resolve(done).then(function (rec) {
        if (w.IrisSphere && IrisSphere.setSpeaking) IrisSphere.setSpeaking(false);
        return rec;
      });
    }
  };
})(window);
