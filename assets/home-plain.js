/* Home is one door: start the story. */
(function () {
  function go() {
    var nav = document.getElementById("nav-panel");
    if (nav) {
      nav.innerHTML = '<a href="/story/the-company.html">Start</a>';
    }
    var h1 = document.querySelector("#site h1");
    if (h1) h1.innerHTML = "We built<br>Iris";
    var lines = document.querySelector("#site .lines");
    if (lines) {
      lines.innerHTML = '<a class="line" href="/story/the-company.html">Start</a>';
    }
    var hud = document.querySelector("#site .hud");
    if (hud) hud.setAttribute("hidden", "");
    var jump = document.querySelector("#site .jump");
    if (jump) {
      jump.href = "/story/the-company.html";
      jump.textContent = "Start";
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
  else go();
})();
