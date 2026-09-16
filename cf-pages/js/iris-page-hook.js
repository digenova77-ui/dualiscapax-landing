/**
 * One listener. First tap in this room may invoke the page line.
 * No load speech. No second hello.
 */
(function (w) {
  if (w.__IRIS_PAGE_HOOK) return;
  w.__IRIS_PAGE_HOOK = true;
  function go() {
    w.removeEventListener("pointerdown", go, true);
    w.removeEventListener("keydown", go, true);
    try {
      if (w.IrisPageVoice && w.IrisPageVoice.invoke) w.IrisPageVoice.invoke();
    } catch (e) {}
  }
  w.addEventListener("pointerdown", go, true);
  w.addEventListener("keydown", go, true);
})(window);
