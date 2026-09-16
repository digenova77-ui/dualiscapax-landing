/**
 * Decisions collapse. Layers stack. She is expert: one seat, then the next question stands on it.
 */
(function (w) {
  var layers = [];
  function collapse(q) {
    var step = (w.IrisPick32 && w.IrisPick32.pick) ? w.IrisPick32.pick(q) : { i: 11, said: "hole", why: "no picker" };
    var floor = layers.length ? layers[layers.length - 1] : null;
    var row = {
      q: String(q || "").slice(0, 160),
      i: step.i,
      said: step.said,
      why: step.why,
      on: floor ? floor.i : null
    };
    layers.push(row);
    if (layers.length > 16) layers.shift();
    return row;
  }
  function stack() { return layers.slice(); }
  function last() { return layers.length ? layers[layers.length - 1] : null; }
  w.IrisCollapse = { collapse: collapse, stack: stack, last: last };
})(typeof window !== "undefined" ? window : globalThis);
