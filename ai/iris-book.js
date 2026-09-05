/** Iris book — answers that live on this site. No cure. No invented contract. */
(function (w) {
  var VERSION = "iris-book-2026-09-04-dclm";
  var ROWS = [
    { id: "HELP", re: /\b(what can you do|help|what is dualis|what is this)\b/i,
      spoken: "I'm Iris. Looking is free. A Unity ID is free. Engine time is what you buy. I will not invent a cure, a hospital file, or an on-chain contract.",
      href: "/works.html", label: "What works" },
    { id: "IRIS", re: /\b(who are you|your name|\biris\b)\b/i,
      spoken: "I'm Iris. I answer from the house book on this page when the depth worker is locked. I do not see private Unity graphs.",
      href: "/ai/app.html", label: "Iris" },
    { id: "ID", re: /\b(unity id|member|u1|get an id|onboard)\b/i,
      spoken: "Unity member number one is on /member.html. No charge. Dualis does not run a government check.",
      href: "/member.html", label: "Get ID" },
    { id: "PAY", re: /\b(pay|stripe|fuel|engine time|checkout|\$20|\$50|\$120)\b/i,
      spoken: "Pay Canadian dollars on /pay.html. Live packs are $20, $50, and $120. $350 has no button. Stripe does not post back to this website. After you pay, mark passes on /compute.html.",
      href: "/pay.html", label: "Pay" },
    { id: "ENGINE", re: /\b(engine|compute|invert|pass|runtime|workbench)\b/i,
      spoken: "The engine on this device is /compute.html. It inverts a 2 by 2. If it cannot invert, no pass is spent. The workbench is /runtime.html.",
      href: "/compute.html", label: "Engine" },
    { id: "STUDY", re: /\b(medical|disease|als|study|hospital|patient|diagnos|cure|clinic)\b/i,
      spoken: "Study files are look-only on /study.html. No patient chart. No diagnosis. We do not claim cures.",
      href: "/study.html", label: "Study" },
    { id: "SCHOOL", re: /\b(school|bus|deadhead|board|hpedsb)\b/i,
      spoken: "Schools page is an example chair, not a signed board contract. A work email can back a name. No student file lives here.",
      href: "/education.html", label: "Schools" },
    { id: "SHOP", re: /\b(shop|pizza|baker|till|delivery|rake|hospitality)\b/i,
      spoken: "Shops page names ordinary lost money — a delivery cut. Not a signed restaurant deal.",
      href: "/hospitality.html", label: "Shops" },
    { id: "LAW", re: /\b(law|no_force|host_safe|dclm|veto)\b/i,
      spoken: "Law floor: do not force, keep the host safe, clean secrets first, tell the truth or say nothing.",
      href: "/works.html", label: "What works" },
    { id: "WEBHOOK", re: /\b(webhook|worker|cloudflare|contract|solidity|chain)\b/i,
      spoken: "The depth worker is behind Cloudflare Access. There is no live webhook on this origin and no published contract address. I will not invent either.",
      href: "/works.html", label: "What works" }
  ];
  function lookup(text) {
    var s = String(text || "");
    for (var i = 0; i < ROWS.length; i++) {
      if (ROWS[i].re.test(s)) {
        return { grant: "MEASURE", kernel: VERSION, id: ROWS[i].id, spoken: ROWS[i].spoken, href: ROWS[i].href, label: ROWS[i].label };
      }
    }
    return null;
  }
  w.IrisBook = { version: VERSION, lookup: lookup, rows: ROWS };
})(window);
