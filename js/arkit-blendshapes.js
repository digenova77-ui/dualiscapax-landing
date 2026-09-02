/**
 * ARKit 52 + Azure FacialExpression 55 name table.
 * Maps arrays to named weights. Does not draw a face.
 * Not a clone. Not loaded by /ai/app.
 */
(function (w) {
  var VERSION = "arkit-blend-2026-09-01";

  var ARKIT_52 = [
    "eyeBlinkLeft", "eyeLookDownLeft", "eyeLookInLeft", "eyeLookOutLeft", "eyeLookUpLeft",
    "eyeSquintLeft", "eyeWideLeft",
    "eyeBlinkRight", "eyeLookDownRight", "eyeLookInRight", "eyeLookOutRight", "eyeLookUpRight",
    "eyeSquintRight", "eyeWideRight",
    "jawForward", "jawLeft", "jawRight", "jawOpen",
    "mouthClose", "mouthFunnel", "mouthPucker", "mouthLeft", "mouthRight",
    "mouthSmileLeft", "mouthSmileRight", "mouthFrownLeft", "mouthFrownRight",
    "mouthDimpleLeft", "mouthDimpleRight", "mouthStretchLeft", "mouthStretchRight",
    "mouthRollLower", "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper",
    "mouthPressLeft", "mouthPressRight", "mouthLowerDownLeft", "mouthLowerDownRight",
    "mouthUpperUpLeft", "mouthUpperUpRight",
    "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight",
    "cheekPuff", "cheekSquintLeft", "cheekSquintRight",
    "noseSneerLeft", "noseSneerRight",
    "tongueOut"
  ];

  var AZURE_EXTRA = ["headRoll", "leftEyeRoll", "rightEyeRoll"];
  var AZURE_55 = ARKIT_52.concat(AZURE_EXTRA);

  function clamp01(n) {
    n = Number(n);
    if (!isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }

  function fromAzure(frame) {
    var out = {};
    var src = frame || [];
    var i;
    for (i = 0; i < AZURE_55.length; i++) out[AZURE_55[i]] = clamp01(src[i]);
    return out;
  }

  function toAzure(dict) {
    var src = dict || {};
    var out = new Array(AZURE_55.length);
    var i;
    for (i = 0; i < AZURE_55.length; i++) out[i] = clamp01(src[AZURE_55[i]]);
    return out;
  }

  function fromArkit(dict) {
    var src = dict || {};
    var out = {};
    var i;
    for (i = 0; i < ARKIT_52.length; i++) out[ARKIT_52[i]] = clamp01(src[ARKIT_52[i]]);
    return out;
  }

  function arkitOnly(weights) {
    var src = weights || {};
    var out = {};
    var i;
    for (i = 0; i < ARKIT_52.length; i++) out[ARKIT_52[i]] = clamp01(src[ARKIT_52[i]]);
    return out;
  }

  function maxMerge(a, b) {
    var out = fromArkit(a);
    var src = b || {};
    var k;
    for (k in src) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
      if (!out.hasOwnProperty(k)) continue;
      var n = clamp01(src[k]);
      if (n > out[k]) out[k] = n;
    }
    return out;
  }

  w.ARKitBlend = {
    version: VERSION,
    ARKIT_52: ARKIT_52.slice(),
    AZURE_55: AZURE_55.slice(),
    fromAzure: fromAzure,
    toAzure: toAzure,
    fromArkit: fromArkit,
    arkitOnly: arkitOnly,
    maxMerge: maxMerge
  };
})(window);
