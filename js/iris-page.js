/**
 * Dualis page graph. Iris lives on these routes.
 * She explains the page the visitor is already on.
 * Not a screen reader. Not DOM scrape. Not VoiceOver.
 */
(function (w) {
  var VERSION = "iris-page-2026-09-22-here";
  var LAB = "This is the Iris lab. The cluster is me. Talk and I look it up. Camera is optional. I already know this page, so I do not read the screen.";
  var HOME = "This is DualisCapax home. The cluster is Iris. Looking is free. Engine time is what you buy.";
  var PAGES = {
    "/": { id: "home", spoken: HOME },
    "/index.html": { id: "home", spoken: HOME },
    "/ai/app": { id: "lab", spoken: LAB },
    "/ai/app.html": { id: "lab", spoken: LAB },
    "/abstract": {
      id: "abstract",
      spoken: "This is the abstract layer. A symplectic step and the quaternion pose. Press it. It is not optical hardware."
    },
    "/abstract.html": {
      id: "abstract",
      spoken: "This is the abstract layer. A symplectic step and the quaternion pose. Press it. It is not optical hardware."
    },
    "/runtime": {
      id: "runtime",
      spoken: "This is the runtime page. The oscillator lives here. It is the step under the brochure."
    },
    "/engine": {
      id: "engine",
      spoken: "This is the residual engine page. Video and XR notes. The step you can press is on abstract."
    },
    "/lab": {
      id: "notes",
      spoken: "These are engine notes. I can walk them. I do not diagnose."
    },
    "/iris": {
      id: "iris",
      spoken: "This page is about me. DualisCapax public face. Ask a question and I look it up."
    },
    "/donate": {
      id: "donate",
      spoken: "This is donate. Optional support. Looking stays free."
    },
    "/bind": {
      id: "bind",
      spoken: "This is bind. Ninety days. How a seat holds."
    },
    "/fuel": {
      id: "fuel",
      spoken: "This is fuel. Engine time. Not a chat subscription."
    },
    "/pay.html": {
      id: "pay",
      spoken: "This is pay. Canadian dollar packs. Checkout on the public file may still read closed."
    },
    "/member.html": {
      id: "id",
      spoken: "This is get ID. Unity member number one. No charge."
    },
    "/study.html": {
      id: "study",
      spoken: "Study files are look-only. No diagnosis. We do not claim cures."
    },
    "/works.html": {
      id: "works",
      spoken: "Do not force. Keep the host safe. Clean secrets first. Tell the truth or say nothing."
    }
  };

  function key() {
    var p = String((w.location && location.pathname) || "/").replace(/\/+$/, "") || "/";
    if (PAGES[p]) return p;
    if (PAGES[p + ".html"]) return p + ".html";
    return p;
  }

  function here() {
    var k = key();
    var row = PAGES[k] || {
      id: "unknown",
      spoken: "You are on DualisCapax. I know the house pages. Ask what this site does, or talk and I will look it up."
    };
    return { path: k, href: k, id: row.id, spoken: row.spoken, title: (w.document && document.title) || "DualisCapax" };
  }

  function hereish(text) {
    var s = String(text || "").trim();
    if (!s) return true;
    return /^(?:iris[, ]+)?(what(?:'s| is) this|where am i|what page|what is this page|what can i do here|explain this|read this|what am i looking at|read the screen)\b/i.test(s);
  }

  function explain(text) {
    if (!hereish(text)) return null;
    var p = here();
    return { grant: "HERE", kernel: VERSION, id: "PAGE_" + p.id, spoken: p.spoken, href: p.href, label: p.title, page: p, lane: "HERE" };
  }

  w.IrisPage = { version: VERSION, here: here, hereish: hereish, explain: explain, pages: PAGES };
})(window);
