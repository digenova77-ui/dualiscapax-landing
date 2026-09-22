/** Iris book — house doors only. Do not match her name inside a real question. */
(function (w) {
  var VERSION = "iris-book-2026-09-22-identity";
  var ROWS = [
    { id: "HELP", re: /^(?:iris[, ]+)?(what can you do|help|what is dualis|what is this)\b/i,
      spoken: "I'm Iris. Looking is free. A Unity ID is free. Engine time is what you buy.",
      href: "/works.html", label: "What works" },
    { id: "IRIS", re: /^(?:hi[, ]+|hey[, ]+|iris[, ]+)*(who are you|what(?:'s| is) your name|your name)\s*[?.!]*$/i,
      spoken: "I'm Iris. DualisCapax public face. Ask me a question — I will look it up.",
      href: "/ai/app.html", label: "Iris" },
    { id: "ID", re: /\b(unity id|get an id|onboard me)\b/i,
      spoken: "Unity member number one is on Get ID. No charge.",
      href: "/member.html", label: "Get ID" },
    { id: "PAY", re: /\b(how (do I |to )?pay|stripe checkout|fuel pack|engine time)\b/i,
      spoken: "Pay Canadian dollars on Pay. Live packs are $20, $50, and $120. Checkout on the public file is still marked closed.",
      href: "/pay.html", label: "Pay" },
    { id: "ENGINE", re: /^(?:iris[, ]+)?(open )?(the )?(engine|compute|runtime|workbench)\s*[?.!]*$/i,
      spoken: "Engine on this device is Compute. Workbench is Runtime.",
      href: "/compute.html", label: "Engine" },
    { id: "STUDY", re: /\b(diagnos(?:e|is)|cure me|treat my)\b/i,
      spoken: "Study files are look-only. No diagnosis. We do not claim cures.",
      href: "/study.html", label: "Study" },
    { id: "LAW", re: /^(?:iris[, ]+)?(what is )?(no_force|host_safe|dclm law)\b/i,
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
