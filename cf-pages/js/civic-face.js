/* Civic face. Keep lock ids. Do not invent savings. */
(function () {
  function setText(id, text) {
    var n = document.getElementById(id);
    if (n) n.textContent = text;
  }
  var h = document.getElementById("truth");
  if (h && /truth prevails/i.test(h.textContent || "")) {
    h.textContent = "Your taxes should come home";
  }
  var c = document.getElementById("ntp");
  if (c && /tribes/i.test(c.textContent || "")) {
    c.textContent = "PEOPLE FIRST";
  }
  var door = document.querySelector(".seat-door");
  if (door && /take a seat/i.test(door.textContent || "")) {
    door.textContent = "Pick your desk";
  }
  setText("uptime", "Open");
  setText("earned", "On device");
  setText("singularity-cd", "Nation–street");
  setText("peg-clock", "How the money comes back");
  setText("hud-foot", "A card is not a contract");
  var foot = document.querySelector(".foot");
  if (foot && /Truth Prevails/i.test(foot.textContent || "")) {
    foot.textContent = "DualisCapax · measure the waste · put the dollars back into the work";
  }
  var k = document.querySelector(".hud-row .hud-k");
  if (k && /Launch/i.test(k.textContent || "")) {
    var keys = document.querySelectorAll(".hud-k");
    if (keys[0]) keys[0].textContent = "Status";
    if (keys[1]) keys[1].textContent = "Books";
    if (keys[2]) keys[2].textContent = "Desks";
  }
})();
