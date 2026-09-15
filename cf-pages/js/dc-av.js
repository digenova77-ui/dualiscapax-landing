/**
 * One wake. Audio and picture start in the same gesture.
 * DVP reads the live wave. No second tap. No video-first mute.
 */
(function (w) {
  function wake(canvas, kind, seat) {
    if (w.DSAP) w.DSAP.wake();
    if (w.DVP && canvas) w.DVP.mount(canvas);
    if (w.DSAP) w.DSAP.place(kind || "whistle", seat || 0);
    return { audio: !!w.DSAP, picture: !!(w.DVP && canvas) };
  }
  w.DualisAV = { wake: wake, version: "AV-1.0" };
})(window);
