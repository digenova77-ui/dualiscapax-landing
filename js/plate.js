(function () {
  var word = document.getElementById("word");
  if (!word) return;
  var dead = word.querySelector("img.lockup");
  if (dead) dead.remove();
  if (!word.querySelector(".rest")) {
    var s = document.createElement("span");
    s.className = "rest";
    s.textContent = "DualisCapax";
    word.appendChild(s);
  }
})();
