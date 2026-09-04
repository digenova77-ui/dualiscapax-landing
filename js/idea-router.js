/* Desk router — known landings first. No page → Iris with the question. */
(function (w) {
  var ROUTES = [
    { keys: ["look", "browse", "see"], href: "look.html", label: "Look around" },
    { keys: ["onboard", "start", "bind", "desk", "get started"], href: "onboard.html", label: "Get started" },
    { keys: ["how", "steps", "works"], href: "how.html", label: "How it works" },
    { keys: ["rule", "legal", "fintrac", "cbsa", "amps", "law", "border"], href: "legal.html", label: "Rules" },
    { keys: ["pipe", "hallway", "inside", "bore"], href: "pipe.html", label: "Go inside" },
    { keys: ["fuel", "pay", "stripe", "minutes"], href: "payments.html", label: "Prepaid time" },
    { keys: ["donate", "gift", "interac"], href: "donate.html", label: "Gift" },
    { keys: ["iris", "ask", "agent", "chat"], href: "ai/app.html", label: "Iris" },
    { keys: ["playground", "one", "sheet", "plug"], href: "playground.html", label: "Playground" },
    { keys: ["room", "house"], href: "rooms.html", label: "Rooms" },
    { keys: ["seal", "als", "care", "medical", "research"], href: "research/", label: "Research" }
  ];

  function match(text) {
    var t = String(text || "").toLowerCase();
    if (!t.trim()) return null;
    for (var i = 0; i < ROUTES.length; i++) {
      for (var k = 0; k < ROUTES[i].keys.length; k++) {
        if (t.indexOf(ROUTES[i].keys[k]) !== -1) return ROUTES[i];
      }
    }
    return null;
  }

  function go(text) {
    var hit = match(text);
    if (hit && hit.href.indexOf("ai/app") !== 0) {
      return { kind: "page", href: hit.href, label: hit.label };
    }
    var q = encodeURIComponent(String(text || "").slice(0, 500));
    return {
      kind: "iris",
      href: "ai/app.html?q=" + q,
      label: "Ask Iris"
    };
  }

  w.DCIdea = { match: match, go: go };
})(window);
