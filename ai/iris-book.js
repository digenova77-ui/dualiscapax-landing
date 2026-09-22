/** Iris book — house doors only. Do not steal questions that merely mention Iris. */
(function (w) {
  var VERSION = "iris-book-2026-09-22-who";
  var ROWS = [
    { id: "HELP", re: /^(what can you do|help|what is dualis|what is this)\??$/i,
      spoken: "I'm Iris. Looking is free. A Unity ID is free. Engine time is what you buy.",
      href: "/works.html", label: "What works" },
    { id: "IRIS", re: /^(hi |hello |hey )?(iris[,.]?\s*)?(who are you|what(?:'s| is) your name|your name)\??$/i,
      spoken: "I'm Iris. DualisCapax public face.",
      href: "/ai/app.html", label: "Iris" },
    { id: "ID", re: /\b(unity id|member number|get an id|onboard me)\b/i,
      spoken: "Unity member number one is on Get ID. No charge.",
      href: "/member.html", label: "Get ID" },
    { id: "PAY", re: /^(pay|checkout|how do i pay|fuel pack|engine time)\b/i,
      spoken: "Pay Canadian dollars on Pay. Live packs are $20, $50, and $120. Checkout on the public face stays closed unless you open Pay.",
      href: "/pay.html", label: "Pay" },
    { id: "ENGINE", re: /^(engine|compute|runtime|workbench)\b/i,
      spoken: "Engine on this device is Compute. Workbench is Runtime.",
      href: "/compute.html", label: "Engine" },
    { id: "STUDY", re: /\b(diagnos|prescribe|cure me)\b/i,
      spoken: "Study files are look-only. No diagnosis. We do not claim cures.",
      href: "/study.html", label: "Study" },
    { id: "LAW", re: /\b(no_force|host_safe|what is dclm)\b/i,
      spoken: "Do not force. Keep the host safe. Clean secrets first. Tell the truth or say nothing.",
      href: "/works.html", label: "What works" }
  ];
  function lookup(text) {
    var s = String(text || "").trim();
    for (var i = 0; i < ROWS.length; i++) {
      if (ROWS[i].re.test(s)) return { grant: "MEASURE", kernel: VERSION, id: ROWS[i].id, spoken: ROWS[i].spoken, href: ROWS[i].href, label: ROWS[i].label };
    }
    return null;
  }
  w.IrisBook = { version: VERSION, lookup: lookup, rows: ROWS };
})(window);
