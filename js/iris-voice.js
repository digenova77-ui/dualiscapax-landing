/**
 * Iris voice locale.
 * System language first. Optional British for English.
 * Device voices cover sv/nb/da. xAI TTS listed langs do not include Swedish — use auto + OS fallback.
 */
(function (w) {
  var VERSION = "iris-voice-2026-09-22";
  var STORE = "dc-iris-voice";
  var XAI_OK = {
    en: "en", fr: "fr", de: "de", es: "es-ES", it: "it", ja: "ja", ko: "ko",
    zh: "zh", pt: "pt-BR", ru: "ru", ar: "ar-SA", hi: "hi", tr: "tr", vi: "vi",
    id: "id", bn: "bn"
  };

  function pref() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function save(p) {
    try { localStorage.setItem(STORE, JSON.stringify(p)); } catch (e) {}
  }

  function navLang() {
    var p = pref();
    if (p.lang) return String(p.lang);
    return String((w.navigator && (navigator.languages && navigator.languages[0] || navigator.language)) || "en");
  }

  function primary(tag) {
    return String(tag || "en").replace("_", "-").toLowerCase().split("-")[0];
  }

  function bcp47() {
    var raw = navLang().replace("_", "-");
    var p = pref();
    if ((p.accent === "gb" || p.accent === "uk" || p.accent === "british") && primary(raw) === "en") return "en-GB";
    return raw;
  }

  function xaiLang() {
    var tag = bcp47();
    var p = primary(tag);
    if (XAI_OK[tag]) return XAI_OK[tag];
    if (XAI_OK[p]) return XAI_OK[p];
    return "auto";
  }

  function scoreVoice(v, want) {
    var lang = String(v.lang || "").toLowerCase();
    var name = String(v.name || "").toLowerCase();
    var wp = primary(want);
    var n = 0;
    if (lang === want.toLowerCase()) n += 8;
    else if (lang.indexOf(wp) === 0) n += 5;
    if (/(natural|premium|neural|enhanced|samantha|daniel|karen|moira|alva|nora|sara)/.test(name)) n += 3;
    if (wp === "en" && /en-gb|google uk|daniel|moira|serena|british/.test(lang + " " + name)) n += (pref().accent === "gb" ? 4 : 1);
    return n;
  }

  function pickDevice() {
    if (!w.speechSynthesis) return null;
    var list = speechSynthesis.getVoices() || [];
    if (!list.length) return null;
    var want = bcp47();
    var best = null, bestN = -1;
    for (var i = 0; i < list.length; i++) {
      var n = scoreVoice(list[i], want);
      if (n > bestN) { bestN = n; best = list[i]; }
    }
    return best || list[0];
  }

  function xaiVoice() {
    var p = pref();
    return p.xaiVoice || "iris";
  }

  function applyUtterance(u) {
    var v = pickDevice();
    u.lang = (v && v.lang) || bcp47();
    if (v) u.voice = v;
    u.rate = 0.98;
    u.pitch = 1;
    return u;
  }

  function ttsOpts() {
    return { voice_id: xaiVoice(), language: xaiLang() };
  }

  w.IrisVoice = {
    version: VERSION,
    locale: bcp47,
    primary: function () { return primary(bcp47()); },
    xaiLang: xaiLang,
    xaiVoice: xaiVoice,
    ttsOpts: ttsOpts,
    pickDevice: pickDevice,
    applyUtterance: applyUtterance,
    setAccent: function (a) {
      var p = pref();
      p.accent = a;
      save(p);
    },
    setLang: function (tag) {
      var p = pref();
      p.lang = tag || "";
      save(p);
    },
    setXaiVoice: function (id) {
      var p = pref();
      p.xaiVoice = id || "iris";
      save(p);
    }
  };

  if (w.speechSynthesis) {
    if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", pickDevice);
    else speechSynthesis.onvoiceschanged = pickDevice;
  }
})(window);
