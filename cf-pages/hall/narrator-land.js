/* cuts.v1 — recorded human VO first.
   speechSynthesis is OFF unless cuts.policy.ttsFallback === true.
   Missing audio → captions + land only. */
(function (global) {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  function reduced() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function playVideo(beat) {
    const v = $("#dc-stage-video");
    const frame = $("#dc-stage");
    if (!v) return Promise.resolve("none");
    if (reduced()) {
      if (beat.poster && frame) frame.style.backgroundImage = "url(" + beat.poster + ")";
      v.removeAttribute("src"); v.load();
      return Promise.resolve("still");
    }
    if (!beat.video) return Promise.resolve("none");
    return new Promise((resolve) => {
      v.muted = true; v.playsInline = true; v.setAttribute("playsinline", "");
      v.poster = beat.poster || ""; v.src = beat.video;
      const done = () => resolve("ok");
      v.addEventListener("ended", done, { once: true });
      v.addEventListener("error", () => resolve("missing"), { once: true });
      const p = v.play(); if (p && p.catch) p.catch(() => resolve("missing"));
    });
  }
  function playFile(src) {
    return new Promise((resolve) => {
      if (!src) return resolve("missing");
      const a = new Audio(src);
      currentAudio = a; a.preload = "auto";
      a.addEventListener("ended", () => resolve("ok"), { once: true });
      a.addEventListener("error", () => resolve("missing"), { once: true });
      const p = a.play(); if (p && p.catch) p.catch(() => resolve("missing"));
    });
  }
  function land(ids) {
    (ids || []).forEach((id) => {
      $$("[data-land='" + id + "']").forEach((el) => {
        el.classList.add("is-landed"); el.classList.remove("is-waiting");
      });
    });
  }
  function caption(text) {
    const el = $("#dc-caption"); if (el) el.textContent = text || "";
  }
  async function play(cuts) {
    if (reduced()) {
      $$("[data-land]").forEach((el) => el.classList.add("is-landed"));
      caption(""); return;
    }
    $$("[data-land]").forEach((el) => { el.classList.add("is-waiting"); el.classList.remove("is-landed"); });
    for (const beat of cuts.beats || []) {
      caption(fill(beat.voice)); land(beat.land);
      const picture = playVideo(beat);
      const result = await playFile(beat.audio);
      if (result === "missing") await new Promise((r) => setTimeout(r, beat.ms || 4000));
      await picture;
    }
    caption("");
  }
  let current = null, currentAudio = null;
  let session = { unityId: null, declaredName: null, kyc: false, lastRoom: null, look: [] };
  function you() {
    const n = session && session.declaredName;
    return n ? String(n).split(/\s+/)[0] : "you";
  }
  function fill(text) { return text ? text.replace(/\{you\}/g, you()) : text; }
  function pickLine(row) {
    if (!row) return "";
    if (!session.unityId) return row.voice;
    if (session.kyc && row.voiceKyc) return fill(row.voiceKyc);
    if (row.voiceBound) return fill(row.voiceBound);
    return fill(row.voice);
  }
  function stopAudio() { if (currentAudio) { currentAudio.pause(); currentAudio = null; } }
  async function pick(landId) {
    if (!current) return;
    const row = (current.picks || []).find((p) => p.id === landId);
    if (!row) return;
    $$("[data-land]").forEach((el) => el.classList.remove("is-picked"));
    $$("[data-land='" + landId + "']").forEach((el) => el.classList.add("is-landed", "is-picked"));
    caption(pickLine(row)); stopAudio();
    const src = session.unityId && row.audioBound ? row.audioBound : row.audio;
    await playFile(src);
    if (typeof current.onPick === "function") current.onPick(row);
  }
  async function bind(opts) {
    const cuts = opts.cuts || (await fetch(opts.url || "cuts-v1.json").then((r) => r.json()));
    current = cuts;
    if (opts.session) session = Object.assign(session, opts.session);
    if (opts.onPick) current.onPick = opts.onPick;
    const btn = $(opts.button || "#dc-narrate");
    if (btn) btn.addEventListener("click", () => play(cuts));
    const skip = $(opts.skip || "#dc-skip");
    if (skip) skip.addEventListener("click", () => {
      stopAudio();
      $$("[data-land]").forEach((el) => { el.classList.add("is-landed"); el.classList.remove("is-waiting"); });
      caption("Pick a room. I'll take you there.");
    });
    $$("[data-land^='card-']").forEach((el) => {
      el.style.cursor = "pointer";
      el.addEventListener("click", () => pick(el.getAttribute("data-land")));
    });
    return { play: () => play(cuts), pick, cuts };
  }
  global.DualisNarrator = { bind, play, pick };
})(window);
