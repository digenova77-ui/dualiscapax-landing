/** Iris book — house doors only. No shop demo prompts. */
(function (w) {
  var VERSION = "iris-book-2026-09-04-no-shop";
  var ROWS = [
    { id: "HELP", re: /\b(what can you do|help|what is dualis|what is this)\b/i,
      spoken: "I'm Iris. Looking is free. A Unity ID is free. Engine time is what you buy.",
      href: "/works.html", label: "What works" },
    { id: "IRIS", re: /\b(who are you|your name|\biris\b)\b/i,
      spoken: "I'm Iris. DualisCapax public face.",
      href: "/ai/app.html", label: "Iris" },
    { id: "ID", re: /\b(unity id|member|u1|get an id|onboard)\b/i,
      spoken: "Unity member number one is on Get ID. No charge.",
      href: "/member.html", label: "Get ID" },
    { id: "PAY", re: /\b(pay|stripe|fuel|engine time|checkout|\$20|\$50|\$120)\b/i,
      spoken: "Pay Canadian dollars on Pay. Live packs are $20, $50, and $120.",
      href: "/pay.html", label: "Pay" },
    { id: "ENGINE", re: /\b(engine|compute|invert|pass|runtime|workbench)\b/i,
      spoken: "Engine on this device is Compute. Workbench is Runtime.",
      href: "/compute.html", label: "Engine" },
    { id: "STUDY", re: /\b(medical|disease|als|study|diagnos|cure)\b/i,
      spoken: "Study files are look-only. No diagnosis. We do not claim cures.",
      href: "/study.html", label: "Study" },
    { id: "LAW", re: /\b(law|no_force|host_safe|dclm|veto)\b/i,
      spoken: "Do not force. Keep the host safe. Clean secrets first. Tell the truth or say nothing.",
      href: "/works.html", label: "What works" }
  ];
  function lookup(text) {
    var s = String(text || "");
    for (var i = 0; i < ROWS.length; i++) {
      if (ROWS[i].re.test(s)) return { grant: "MEASURE", kernel: VERSION, id: ROWS[i].id, spoken: ROWS[i].spoken, href: ROWS[i].href, label: ROWS[i].label };
    }
    return null;
  }
  w.IrisBook = { version: VERSION, lookup: lookup, rows: ROWS };
})(window);
