/** Iris book — local residual answers. No cure. No seat invented. */
(function (w) {
  var VERSION = "iris-book-2026-09-03a";
  var ROWS = [
    { id: "ACTORS", re: /\b(company|companies|corporation|corporations|individual|individuals|person|people|actor|seat|peg)\b/i,
      spoken: "A person, a company, and a corporation are three desks on the same leftover. Same peg. No softer product for larger spend. Onboard is the goal of every seat.",
      href: "/actors.html", label: "Actors" },
    { id: "ONBOARD", re: /\b(onboard|seat law|goal of every seat)\b/i,
      spoken: "Onboard is the goal of every seat. When a visitor goes deeper into a sector, onboard is good for that sector.",
      href: "/onboard.html", label: "Onboard" },
    { id: "PAY", re: /\b(pay|stripe|fuel|bind|checkout|open: false|sales flag)\b/i,
      spoken: "Look and Measure are free. Fuel and document packs are priced. The sales flag is closed as of 1 Sep 2026. Live Stripe URLs are not a grant until the operator stamps open after IP lock.",
      href: "/research/access.html", label: "Access list" },
    { id: "HELP", re: /\b(what can you do|help|what is dualis|what is this)\b/i,
      spoken: "I'm Iris. Look is free. Measure one leak in your units. Bind only if the number inverts. I do not invent cures, seats, or partners.",
      href: "/actors.html", label: "Actors" },
    { id: "IRIS", re: /\b(who are you|your name|iris)\b/i,
      spoken: "I'm Iris. Public face of DualisCapax. First person. Short. Veto first. No book of promises.",
      href: "/ai/app.html", label: "Iris" },
    { id: "WWW", re: /\b(www|522|dns|cloudflare|edge)\b/i,
      spoken: "www.dualiscapax.ai has been a 522. That is an edge leftover, not a lander leftover. Do not paper DNS with more HTML.",
      href: "/actors.html", label: "Named leftover" }
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
