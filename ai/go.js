(function (w) {
  var MAP = {
    hub: "../hub.html",
    ask: "../hub.html",
    pipe: "../pipe.html",
    law: "../law.html",
    life: "../life.html",
    desk: "../dash.html",
    bonds: "../dash.html",
    security: "../security.html",
    pricing: "../pricing.html",
    price: "../pricing.html",
    pay: "../pay.html",
    works: "../works.html",
    study: "../study.html",
    encyclopedia: "../encyclopedia.html",
    compute: "../compute.html",
    engine: "../compute.html",
    iris: "./app.html",
    rooms: "../rooms.html"
  };
  var FUND = { pay: 1, compute: 1, engine: 1 };
  function parse(text) {
    var s = String(text || "").toLowerCase();
    var m = s.match(/\b(?:go to|take me to|open|show)\s+([a-z]+)/) || s.match(/^([a-z]+)$/);
    if (!m) return null;
    var key = m[1];
    if (!MAP[key]) return { spoken: "There is no landing called " + key + ". I only open rooms we can explain. See Rooms.", href: "../rooms.html" };
    if (FUND[key]) return { spoken: "That room spends engine time if you grind. Pay is open if you need passes. Opening " + key + ".", href: MAP[key] };
    return { spoken: "Opening " + key + ". Look is free.", href: MAP[key] };
  }
  w.IrisGo = { parse: parse, MAP: MAP };
})(window);
