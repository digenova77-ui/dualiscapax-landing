/**
 * Iris knows which Dualis page you are on.
 * Not a screen reader. Not VoiceOver. The site map she ships with.
 */
(function (w) {
  var VERSION = "iris-here-2026-09-22";
  var PAGES = {
    "/": {
      name: "Home",
      spoken: "This is DualisCapax home. Look and measure stay free. We stop money leak at the point of work. I am Iris. Tap me and ask about seats, pay, or a room."
    },
    "/index.html": {
      name: "Home",
      spoken: "This is DualisCapax home. Look is free. Bind and measure are how a seat starts. I can walk you there."
    },
    "/ai/app": {
      name: "Iris",
      spoken: "You are with me. This is the call, not a chat box. Speak. I can explain any Dualis page you opened to get here."
    },
    "/ai": {
      name: "Ask",
      spoken: "This is the Ask hall. The live call is on the Iris room. Looking stays free."
    },
    "/look": {
      name: "Look",
      spoken: "This is Look. Cards go country, then the room that spends, then the line on that sheet. Looking does not require a prepaid pack."
    },
    "/residual": {
      name: "How Dualis is paid",
      spoken: "This page is how Dualis is paid. Recovered residual, Iris grind packs, and access to notes we already have. Stripe CAD. No student files."
    },
    "/sectors": {
      name: "Sectors",
      spoken: "This is the eight-sector spine. I can name a sector. I will not pretend a gated dossier is open if it is not."
    },
    "/research": {
      name: "Research",
      spoken: "This is research look. Class first, then the study. Simulation is not treatment. Look is free."
    },
    "/alacarte": {
      name: "A la carte",
      spoken: "This is a la carte. Hockey is the first live seat. Other sports plug in when they are actually live."
    },
    "/bind": {
      name: "Bind",
      spoken: "This is Bind. A seat starts here. Looking first is still free."
    },
    "/measure": {
      name: "Measure",
      spoken: "This is Measure. We name a line on a sheet. We do not invent a diagnosis."
    },
    "/fuel": {
      name: "Fuel",
      spoken: "This is Fuel. Prepaid minutes for Iris grind. Look answers stay free."
    },
    "/donate": {
      name: "Donate",
      spoken: "This is Donate. Optional. Looking does not require it."
    }
  };

  function pathOf() {
    var p = (w.location && location.pathname) || "/";
    if (p.length > 1 && p.charAt(p.length - 1) === "/") p = p.slice(0, -1);
    return p || "/";
  }

  function page(path) {
    path = path || pathOf();
    return PAGES[path] || PAGES[path.replace(/\.html$/, "")] || {
      name: path,
      spoken: "You are on DualisCapax, path " + path + ". Ask me what this room is for."
    };
  }

  function isHereAsk(text) {
    var s = String(text || "").toLowerCase();
    if (!s) return true;
    return /^(what is this|where am i|what page|this page|explain this|what can you do here|what is here)\b/.test(s)
      || /\b(this page|where am i|what is this site|what is dualis)\b/.test(s);
  }

  function here(text) {
    var rec = page();
    if (text && !isHereAsk(text) && !/\bdualis|iris|look|bind|measure|seat|pay\b/i.test(text)) {
      return null;
    }
    if (text && !isHereAsk(text) && !/\b(this page|where am i|what is this)\b/i.test(text)) {
      return {
        grant: "HERE",
        path: pathOf(),
        name: rec.name,
        spoken: rec.spoken,
        context: true
      };
    }
    return {
      grant: "HERE",
      path: pathOf(),
      name: rec.name,
      spoken: rec.spoken
    };
  }

  w.IrisHere = {
    version: VERSION,
    path: pathOf,
    page: page,
    isHereAsk: isHereAsk,
    here: here,
    pages: PAGES
  };
})(window);
