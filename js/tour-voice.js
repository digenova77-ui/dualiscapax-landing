/**
 * DualisCapax tour voice + path tone
 * Logo / pace consistent; narration adapts by directory path.
 * voice: male | female (toggle; Web Speech when no MP4 VO)
 */
(function (w) {
  var KEY = "dc_narrator";

  var PATH_PROFILES = {
    healthcare: {
      pace: "measured",
      rate: 0.92,
      style: "clinical-curious",
      prompt:
        "Tone: healthcare path. Ask why standard therapies stall. What-if framing. Why a residual Adaptive view of ALS can make sense without claiming a cure. Calm, precise, never hype."
    },
    neurological: {
      pace: "measured",
      rate: 0.9,
      style: "clinical-curious",
      prompt:
        "Tone: neurological. Focus on mechanism gaps, trial phases, why many approaches fail patients. ALS as a serious worked example. Empathetic, scientific."
    },
    engineering: {
      pace: "tight",
      rate: 1.02,
      style: "technical-precision",
      prompt:
        "Tone: engineering path. Short clauses. Systems, interfaces, residual cost, sealed vs open. Technical precision. No medical emotion."
    },
    default: {
      pace: "even",
      rate: 0.96,
      style: "institutional",
      prompt:
        "Tone: DualisCapax institutional. Open, Prove, Depth, Seal. Black/white clarity. Logo presence. Same mathematics, computational analysis."
    }
  };

  function pathKey() {
    var p = (location.pathname || "").toLowerCase();
    if (p.indexOf("/engineering") !== -1) return "engineering";
    if (p.indexOf("/neurological") !== -1 || p.indexOf("/als") !== -1) return "neurological";
    if (p.indexOf("/healthcare") !== -1 || p.indexOf("/medical") !== -1) return "healthcare";
    return "default";
  }

  function getVoicePref() {
    try {
      return localStorage.getItem(KEY) || "female";
    } catch (e) {
      return "female";
    }
  }

  function setVoicePref(v) {
    try {
      localStorage.setItem(KEY, v);
    } catch (e) {}
  }

  function pickUtteranceVoice(gender) {
    if (!w.speechSynthesis) return null;
    var list = w.speechSynthesis.getVoices() || [];
    var g = (gender || "female").toLowerCase();
    var prefer =
      g === "male"
        ? /male|david|daniel|mark|george|alex/i
        : /female|samantha|victoria|karen|moira|zira|fiona/i;
    for (var i = 0; i < list.length; i++) {
      if (prefer.test(list[i].name)) return list[i];
    }
    return list[0] || null;
  }

  function speak(text, opts) {
    if (!w.speechSynthesis || !text) return;
    w.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    var profile = PATH_PROFILES[pathKey()] || PATH_PROFILES.default;
    u.rate = (opts && opts.rate) || profile.rate;
    u.pitch = opts && opts.gender === "male" ? 0.9 : 1.05;
    var voice = pickUtteranceVoice((opts && opts.gender) || getVoicePref());
    if (voice) u.voice = voice;
    w.speechSynthesis.speak(u);
  }

  w.DCTourVoice = {
    pathKey: pathKey,
    profile: function () {
      return PATH_PROFILES[pathKey()] || PATH_PROFILES.default;
    },
    getGender: getVoicePref,
    setGender: setVoicePref,
    speak: speak,
    PATH_PROFILES: PATH_PROFILES
  };

  if (w.speechSynthesis) {
    w.speechSynthesis.onvoiceschanged = function () {};
  }
})(window);
