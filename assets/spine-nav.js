/** One path on inner pages: back through the story, or home. */
(function () {
  if (window.__dcSpine) return;
  window.__dcSpine = true;

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var top = document.querySelector(".top");
    var links = top && top.querySelector(".top-links");
    if (!top || !links || top.classList.contains("is-spine")) return;

    links.innerHTML = "";
    var a = document.createElement("a");
    a.href = "/story/the-company.html";
    a.textContent = "Start";
    links.appendChild(a);

    top.classList.add("is-spine");
    document.documentElement.classList.add("has-spine");

    var here = document.createElement("div");
    here.className = "top-here";
    here.textContent = "Story";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "top-toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open menu");
    btn.innerHTML = "<span></span><span></span><span></span>";

    links.id = links.id || "spine-panel";
    top.appendChild(here);
    top.appendChild(btn);

    function setOpen(open) {
      top.classList.toggle("is-open", open);
      links.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!links.classList.contains("is-open"));
    });
    document.addEventListener("click", function (e) {
      if (!top.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  });
})();
