(function (w) {
  function wake(canvas, kind, seat) {
    if (w.DSAP && DSAP.wake) DSAP.wake();
    if (w.DVP && canvas && canvas.id !== "iris-sphere") DVP.mount(canvas);
    if (w.DSAP && DSAP.place) DSAP.place(kind || "whistle", seat || 0);
    return { audio: !!w.DSAP };
  }
  w.DualisAV = { wake: wake, version: "AV-1.1" };
})(window);
