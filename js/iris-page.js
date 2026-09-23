/**
 * Dualis page graph. Iris lives on these routes.
 * She explains the page the visitor is already on.
 * Not a screen reader. Not DOM scrape. Not VoiceOver.
 */
(function (w) {
  var VERSION = "iris-page-2026-09-23-cafe";
  var LAB = "You're with me in the lab. Camera if you want. I already know this page, so I don't need to read the screen. Talk and I'll answer.";
  var HOME = "This is DualisCapax home. I'm Iris. Looking is free. If you want the heavy work I'll tell you what it costs first.";
  var PAGES = {
    "/": { id: "home", spoken: HOME },
    "/index.html": { id: "home", spoken: HOME },
    "/ai/app": { id: "lab", spoken: LAB },
    "/ai/app.html": { id: "lab", spoken: LAB },
    "/abstract": {
      id: "abstract",
      spoken: "This is the abstract layer. You can press a symplectic step and see the quaternion pose. It isn't optical hardware."
    },
    "/abstract.html": {
      id: "abstract",
      spoken: "This is the abstract layer. You can press a symplectic step and see the quaternion pose. It isn't optical hardware."
    },
    "/runtime": {
      id: "runtime",
      spoken: "Runtime page. The oscillator lives under the brochure. Ask if you want the short version."
    },
    "/engine": {
      id: "engine",
      spoken: "Engine notes and XR bits. The step you can actually press is on abstract."
    },
    "/lab": {
      id: "notes",
      spoken: "Engine notes. I can walk them. I don't diagnose."
    },
    "/iris": {
      id: "iris",
      spoken: "This page is about me. DualisCapax public face. Ask whatever you want about the house."
    },
    "/donate": {
      id: "donate",
      spoken: "Donate is optional. Looking stays free."
    },
    "/bind": {
      id: "bind",
      spoken: "Bind is how a seat holds for ninety days."
    },
    "/fuel": {
      id: "fuel",
      spoken: "Fuel is engine time. Not a chat subscription."
    },
    "/pay.html": {
      id: "pay",
      spoken: "Pay is Canadian dollar packs. Checkout on the public file may still read closed."
    },
    "/member.html": {
      id: "id",
      spoken: "Get ID. Unity member number one. No charge."
    },
    "/study.html": {
      id: "study",
      spoken: "Study files are look-only. No diagnosis. We don't claim cures."
    },
    "/works.html": {
      id: "works",
      spoken: "Do not force. Keep the host safe. Clean secrets first. Tell the truth or say nothing."
    },
    "/hall": {
      id: "hall",
      spoken: "Hall is the other rooms. Same house, different door."
    },
    "/hall/": {
      id: "hall",
      spoken: "Hall is the other rooms. Same house, different door."
    }
  };

  function key() {
    var p = String((w.location && location.pathname) || "/").replace(/\/+$/, "") || "/";
    if (PAGES[p]) return p;
    if (PAGES[p + ".html"]) return p + ".html";
    if (PAGES[p + "/"]) return p + "/";
    return p;
  }

  function here() {
    var k = key();
    var row = PAGES[k] || {
      id: "unknown",
      spoken: "You're on DualisCapax. I know the house. Ask what this site does, or just talk."
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
