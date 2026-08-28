/* Rewrite the lander copy after paint. Intro stay. Maze gone. */
(function () {
  function go() {
    var nav = document.getElementById("nav-panel");
    if (nav) {
      nav.innerHTML =
        '<a href="/ai/app.html">Iris</a>' +
        '<a href="/story/">Story</a>' +
        '<a href="/research/">Read</a>';
    }
    var h1 = document.querySelector("#site h1");
    if (h1) h1.innerHTML = "We built<br>Iris";
    var lines = document.querySelector("#site .lines");
    if (lines) {
      lines.innerHTML =
        '<a class="line" href="/ai/app.html">Talk to Iris</a>' +
        '<a class="line" href="/story/">Read the story</a>';
    }
    var hud = document.querySelector("#site .hud");
    if (hud) hud.setAttribute("hidden", "");
    var jump = document.querySelector("#site .jump");
    if (jump) {
      jump.href = "/ai/app.html";
      jump.textContent = "Talk to Iris";
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
  else go();
})();
