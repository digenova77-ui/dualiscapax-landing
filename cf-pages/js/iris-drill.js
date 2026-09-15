/**
 * Quicker Iris. Full corpus stays on disk. The throat gets L0 + ONE drill + fold.
 * Face hint picks the pole. No Drive. No EM. No 16 V2.
 */
(function (w) {
  var DRILL = {
    sima: "SIMA drill: two poles. Paid book vs re-key hour. Last sketch is SEED until she says BOOK. Fence 0.5-1.5 is policy not a CI. Silent mouth does not speak a seed dollar. What moved the year? times-per-year if the usual sketch. Cite or hole.",
    ice: "ICE drill: five OHF members only as members. No invented roster. TeamSnap seats. Spordle is not a face CTA. Cite or hole.",
    twins: "TWINS drill: DualisAV.wake one tap. DSAP owns place. DVP reads the wave. Jacket asks V2. IrisVoice is the mouth. Words are not HRTF. Hide hushes. Cite or hole.",
    clock: "CLOCK drill: live apex may lag git. A 404 is a clock not a posterior. Missing plate = hole, keep the work. Cite or hole.",
    instance: "INSTANCE drill: kitchens of one species. Answer the last mouth. Disagreement is UNKNOWN not a vote. No elected Iris. Cite or hole."
  };
  function pick(hint) {
    var h = String(hint || "").toLowerCase();
    if (/ice|hockey|ohf|omha/.test(h)) return "ice";
    if (/twin|dsap|dvp|wave|voice|mouth/.test(h)) return "twins";
    if (/404|apex|clock|deploy/.test(h)) return "clock";
    if (/iris|kitchen|instance|council/.test(h)) return "instance";
    return "sima";
  }
  function pack(hint, extra) {
    var floor = w.IRIS_L0 || "";
    var key = pick(hint || extra);
    var drill = DRILL[key];
    var fold = "";
    try { if (w.IrisLearn && w.IrisLearn.fold) fold = w.IrisLearn.fold(); } catch (e) {}
    var sense = "";
    try {
      if (/what if|minute|wage|times|deriv/.test(String(extra || "").toLowerCase()) && w.IrisDeriv && w.IrisLearn) {
        var rows = w.IrisLearn.load && w.IrisLearn.load();
        if (rows && rows.length) sense = w.IrisDeriv.sense(rows[rows.length - 1]);
      }
    } catch (e) {}
    return [floor, drill, fold ? "FOLD:" + fold : "", sense, extra || ""].filter(Boolean).join(" ");
  }
  if (typeof w.irisTrain !== "function") {
    w.irisTrain = function (extra) { return pack("", extra); };
  }
  w.irisDrill = pack;
  w.IRIS_DRILL = DRILL;
})(typeof window !== "undefined" ? window : globalThis);
