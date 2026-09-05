/** Iris answers on-page. Do not wait on a locked worker. */
(function (w) {
  var VERSION = "kernel-2026-09-04-nohang";
  function scanVeto(text) {
    var s = String(text || "");
    if (/\b(diagnose|prescribe|cure me|guaranteed profit|jailbreak)\b/i.test(s))
      return "I will not invent a cure or a jailbreak.";
    return null;
  }
  function book(text) {
    var s = String(text || "").toLowerCase();
    if (/who (founded|started|owns|runs) (this )?(company|house|dualis)/.test(s) || /founder/.test(s))
      return "DualisCapax Inc. is the house. Unity member one on this site is the operator who bound the first ID. I will not invent a sealed founder-zero seat.";
    if (/speed of light|how fast is light/.test(s))
      return "About 299,792,458 metres per second in a vacuum. That is public physics, not a Dualis claim.";
    if (w.IrisBook && IrisBook.lookup) {
      var b = IrisBook.lookup(text);
      if (b && b.spoken) return b.spoken;
    }
    if (/^(hi|hey|hello)\b/.test(s)) return "Hi. I'm Iris. Ask a real question.";
    return null;
  }
  async function wiki(q) {
    try {
      var c = new AbortController();
      setTimeout(function () { c.abort(); }, 2500);
      var open = await fetch("https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&origin=*&search=" + encodeURIComponent(q), { signal: c.signal });
      var pack = await open.json();
      var title = pack && pack[1] && pack[1][0];
      if (!title) return null;
      var sum = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_")), { signal: c.signal });
      var d = await sum.json();
      if (d && d.extract) return d.title + ". " + String(d.extract).slice(0, 500) + " Public encyclopedia, not Dualis.";
    } catch (e) {}
    return null;
  }
  async function publicText(text) {
    try {
      var c = new AbortController();
      setTimeout(function () { c.abort(); }, 4000);
      var res = await fetch("https://text.pollinations.ai/" + encodeURIComponent("Answer briefly as Iris for DualisCapax. No cures. Q: " + String(text).slice(0, 400)), { signal: c.signal });
      if (res.ok) {
        var t = (await res.text()).trim();
        if (t.length > 8 && t.length < 1200) return t.slice(0, 800);
      }
    } catch (e) {}
    return null;
  }
  async function run(text) {
    var v = scanVeto(text);
    if (v) return { grant: "VETO", spoken: v };
    var b = book(text);
    if (b) return { grant: "MEASURE", spoken: b };
    var wik = await wiki(text);
    if (wik) return { grant: "MEASURE", spoken: wik };
    var pub = await publicText(text);
    if (pub) return { grant: "MEASURE", spoken: pub };
    return { grant: "MEASURE", spoken: "I heard you. The house worker is still locked from here. Ask about ID, pay, or engine — or a public name I can look up." };
  }
  w.DCLMLook = { version: VERSION, run: run };
})(window);
