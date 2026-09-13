(function () {
  var nodes = [
    ["Hub", "hub.html"],
    ["Story", "story.html"],
    ["Pipe", "pipe.html"],
    ["Rooms", "rooms.html"],
    ["Answer", "answer.html"],
    ["Law", "law.html"],
    ["Life", "life.html"],
    ["Desk", "dash.html"],
    ["Pay", "pay.html"],
    ["Pricing", "pricing.html"],
    ["Security", "security.html"],
    ["Works", "works.html"],
    ["Iris", "ai/app.html"],
    ["Compute", "compute.html"],
    ["Study", "study.html"]
  ];
  var here = (location.pathname.split("/").pop() || "hub.html").toLowerCase();
  var bar = document.createElement("nav");
  bar.setAttribute("aria-label", "mesh");
  bar.style.cssText = "position:relative;z-index:3;display:flex;flex-wrap:wrap;gap:.35rem;padding:.75rem;border-top:1px solid rgba(200,220,230,.14);margin-top:2rem";
  var base = location.pathname.indexOf("/ai/") >= 0 ? "../" : "";
  nodes.forEach(function (n) {
    var a = document.createElement("a");
    var href = n[1];
    if (base && href.indexOf("ai/") !== 0) href = base + href;
    if (base && href.indexOf("ai/") === 0) href = href;
    a.href = href;
    a.textContent = n[0];
    a.style.cssText = "color:#8eb4c8;text-decoration:none;font-size:.75rem;border:1px solid rgba(142,180,200,.35);border-radius:999px;padding:.15rem .5rem";
    if (here === n[1].split("/").pop()) a.style.background = "rgba(142,180,200,.15)";
    bar.appendChild(a);
  });
  document.body.appendChild(bar);
})();
