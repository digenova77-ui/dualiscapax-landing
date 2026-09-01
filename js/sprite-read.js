/** Sprite reader. Letters light as the voice walks. Scroll scrubs. */
(function (w) {
  var VERSION = "sprite-read-2026-09-01";
  var tokens = [];
  var index = 0;
  var talking = false;
  var scrub = 0;
  var resumeT = 0;
  var root = null;

  function hole(reason) {
    return { status: "HOLE", reason: reason || "HOLE_NOT_ZERO" };
  }

  function voice() {
    if (!w.speechSynthesis) return null;
    var list = w.speechSynthesis.getVoices() || [];
    var want = list.filter(function (v) {
      var n = (v.name || "").toLowerCase();
      var lang = (v.lang || "").toLowerCase();
      return /en/.test(lang) && /(natural|premium|neural|samantha|aria|google uk|google us|daniel)/.test(n);
    });
    return want[0] || list.filter(function (v) { return /^en/.test(v.lang || ""); })[0] || list[0] || null;
  }

  function skip(el) {
    if (!el || !el.closest) return true;
    return !!el.closest("script,style,canvas,input,textarea,button,nav,header,footer,[data-shift],#holo-stage,#helix");
  }

  function wrapText(node) {
    var text = node.nodeValue;
    if (!text || !text.trim()) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === "\n") {
        frag.appendChild(document.createTextNode(ch));
        continue;
      }
      var s = document.createElement("span");
      s.className = "spr";
      s.textContent = ch;
      frag.appendChild(s);
      if (ch.trim()) tokens.push({ el: s, text: ch, kind: "letter" });
    }
    node.parentNode.replaceChild(frag, node);
  }

  function walk(el) {
    if (!el || skip(el)) return;
    if (el.tagName === "IMG") {
      el.classList.add("spr-img");
      tokens.push({ el: el, text: el.getAttribute("alt") || "image", kind: "img" });
      return;
    }
    var kids = Array.prototype.slice.call(el.childNodes || []);
    for (var i = 0; i < kids.length; i++) {
      var n = kids[i];
      if (n.nodeType === 3) wrapText(n);
      else if (n.nodeType === 1) walk(n);
    }
  }

  function paint() {
    for (var i = 0; i < tokens.length; i++) {
      var el = tokens[i].el;
      el.classList.toggle("on", i === index);
      el.classList.toggle("past", i < index);
    }
  }

  function wordsFrom(start) {
    var out = [];
    var buf = "";
    for (var i = start; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.kind === "img") {
        if (buf) out.push(buf);
        out.push(t.text);
        buf = "";
      } else {
        buf += t.text;
      }
    }
    if (buf) out.push(buf);
    return out.join("").replace(/\s+/g, " ").trim();
  }

  function speakFrom(at) {
    if (!w.speechSynthesis) {
      index = tokens.length;
      paint();
      return hole("NO_VOICE");
    }
    w.speechSynthesis.cancel();
    index = Math.max(0, Math.min(tokens.length, at || 0));
    var text = wordsFrom(index);
    if (!text) return hole("NO_TEXT");
    var u = new SpeechSynthesisUtterance(text);
    var v = voice();
    if (v) u.voice = v;
    u.rate = 0.96;
    u.pitch = 1;
    u.volume = 1;
    talking = true;
    var base = index;
    u.onboundary = function (e) {
      if (typeof e.charIndex !== "number") return;
      var seen = 0;
      for (var i = base; i < tokens.length; i++) {
        seen += String(tokens[i].text).length;
        if (seen >= e.charIndex) {
          index = i;
          paint();
          break;
        }
      }
    };
    u.onend = function () {
      talking = false;
      index = tokens.length;
      paint();
    };
    paint();
    w.speechSynthesis.speak(u);
    return { status: "ONE", from: index };
  }

  function jump(n) {
    index = Math.max(0, Math.min(tokens.length, n));
    paint();
  }

  function onWheel(e) {
    if (!tokens.length) return;
    var step = Math.max(1, Math.round(Math.abs(e.deltaY) / 4));
    if (e.deltaY > 0) jump(index + step);
    else jump(index - step);
    if (w.speechSynthesis) w.speechSynthesis.cancel();
    talking = false;
    scrub = 1;
    clearTimeout(resumeT);
    resumeT = setTimeout(function () {
      scrub = 0;
      speakFrom(index);
    }, 220);
  }

  function mount(sel) {
    if (w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return hole("REDUCED_MOTION");
    }
    root = typeof sel === "string" ? document.querySelector(sel) : (sel || document.querySelector(".site"));
    if (!root) return hole("NO_ROOT");
    if (root.getAttribute("data-read") === "on") return { status: "ONE", already: true };
    tokens = [];
    index = 0;
    walk(root);
    root.classList.add("read-on");
    root.setAttribute("data-read", "on");
    paint();
    function once() {
      speakFrom(0);
      document.removeEventListener("pointerdown", once);
    }
    document.addEventListener("pointerdown", once);
    w.addEventListener("wheel", onWheel, { passive: true });
    return { status: "ONE", tokens: tokens.length, version: VERSION };
  }

  w.DCRead = {
    version: VERSION,
    law: "READ_OR_SCRUB",
    mount: mount,
    start: function () { return speakFrom(index); },
    jump: jump,
    stop: function () {
      talking = false;
      if (w.speechSynthesis) w.speechSynthesis.cancel();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { mount(".site"); });
  } else {
    mount(".site");
  }
})(typeof window !== "undefined" ? window : globalThis);
