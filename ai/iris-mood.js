/** Iris delivery mood. Logic stays exact. Tone is the coat. Learns on this device. */
(function (w) {
  var KEY = "dc_iris_mood";
  var MOODS = {
    casual: {
      id: "casual",
      label: "Casual",
      greet: "Hi. I'm Iris. Ask me like you would a person at the table.",
      sleeve: "Delivery coat: casual kitchen-table friend. Facts stay exact. No slogans. No invented seats, cures, or prices."
    },
    secretary: {
      id: "secretary",
      label: "Secretary",
      greet: "Good day. I'm Iris. What should we take first?",
      sleeve: "Delivery coat: composed professional secretary at a quiet desk. Short complete sentences. Facts stay exact. No slogans. No invented seats, cures, or prices."
    },
    sexy: {
      id: "sexy",
      label: "Sexy",
      greet: "I'm here. Ask. I'll keep the facts straight and the voice close.",
      sleeve: "Delivery coat: warm, low, adult, close. Flirt is allowed. Facts stay exact. No slogans. No invented seats, cures, or prices."
    }
  };

  function deskKey() {
    try {
      var desk = localStorage.getItem("dc_portal_desk") || localStorage.getItem("dc_phrase_id") || "anon";
      return KEY + ":" + String(desk).slice(0, 24);
    } catch (e) {
      return KEY;
    }
  }

  function blank() {
    return { id: "casual", locked: false, samples: 0, seen: { casual: 0, secretary: 0, sexy: 0 } };
  }

  function load() {
    try {
      var raw = localStorage.getItem(deskKey());
      if (!raw) return blank();
      var st = JSON.parse(raw);
      if (!st || !MOODS[st.id]) return blank();
      st.seen = st.seen || { casual: 0, secretary: 0, sexy: 0 };
      return st;
    } catch (e) {
      return blank();
    }
  }

  function save(st) {
    try { localStorage.setItem(deskKey(), JSON.stringify(st)); } catch (e) {}
  }

  function get() {
    var st = load();
    return MOODS[st.id] || MOODS.casual;
  }

  function set(id, locked) {
    if (!MOODS[id]) id = "casual";
    var st = load();
    st.id = id;
    if (locked !== false) st.locked = true;
    save(st);
    paint();
    return get();
  }

  function sleeve(text) {
    return get().sleeve + "\n\n" + String(text || "");
  }

  function greet() {
    return get().greet;
  }

  function learn(text) {
    var st = load();
    if (st.locked) return get();
    var s = String(text || "");
    if (/\b(hey|yeah|yep|lol|lmao|boss|gonna|wanna|kinda)\b/i.test(s)) st.seen.casual++;
    if (/\b(please|regarding|would you|kindly|dear|thank you)\b/i.test(s) || /\.$/.test(s) && s.length > 80) st.seen.secretary++;
    if (/\b(baby|sexy|gorgeous|tonight|close|darling)\b/i.test(s)) st.seen.sexy++;
    st.samples++;
    if (st.samples >= 5) {
      var best = "casual";
      var n = st.seen.casual;
      if (st.seen.secretary > n) { best = "secretary"; n = st.seen.secretary; }
      if (st.seen.sexy > n) best = "sexy";
      st.id = best;
    }
    save(st);
    paint();
    return get();
  }

  function paint() {
    var bar = document.getElementById("moods");
    if (!bar) return;
    var cur = load().id;
    bar.querySelectorAll("[data-mood]").forEach(function (b) {
      var on = b.getAttribute("data-mood") === cur;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var who = document.getElementById("who");
    if (who) who.textContent = "Iris · " + (MOODS[cur] ? MOODS[cur].label : "Casual");
  }

  function mount() {
    if (document.getElementById("moods")) { paint(); return; }
    var chips = document.getElementById("chips");
    var dock = document.querySelector(".dock");
    if (!dock) return;
    var bar = document.createElement("div");
    bar.className = "chips moods";
    bar.id = "moods";
    bar.setAttribute("aria-label", "Iris voice");
    ["casual", "secretary", "sexy"].forEach(function (id) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("data-mood", id);
      b.textContent = MOODS[id].label;
      b.addEventListener("click", function () { set(id, true); });
      bar.appendChild(b);
    });
    if (chips && chips.parentNode) chips.parentNode.insertBefore(bar, chips);
    else dock.insertBefore(bar, dock.firstChild);
    paint();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  w.DCIrisMood = { moods: MOODS, get: get, set: set, sleeve: sleeve, greet: greet, learn: learn, paint: paint };
})(window);
