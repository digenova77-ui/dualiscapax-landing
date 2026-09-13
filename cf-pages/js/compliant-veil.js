/* Company veil on top of Ground Zero. Enter starts the pipe. No paywall. */
(function () {
  var veil = document.getElementById("veil");
  if (!veil) return;
  var q = "";
  try { q = String(location.search || ""); } catch (e) {}
  var skip = /[?&](land|enter|pipe)=1\b/.test(q) || location.hash === "#pipe";
  function hide() {
    veil.setAttribute("hidden", "");
    document.body.classList.remove("veiled");
  }
  if (skip) {
    hide();
    return;
  }
  document.body.classList.add("veiled");
  var enter = document.getElementById("veil-enter");
  if (enter) {
    enter.addEventListener("click", function () {
      location.href = "pipe.html";
    });
  }
})();
