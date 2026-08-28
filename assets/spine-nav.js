/** DualisCapax spine — fixed header + fade dropdown. Iris is the front door. */
(function () {
  if (window.__dcSpine) return;
  window.__dcSpine = true;

  var ITEMS = [
    { href: "/ai/app.html", label: "Iris" },
    { href: "/for-people.html", label: "For you" },
    { href: "/research/", label: "Look" },
    { href: "/onboard.html", label: "Measure" },
    { href: "/payments.html", label: "Bind" },
    { href: "/founding.html", label: "Founding" }
  ];

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var top = document.querySelector(".top");
    var links = top && top.querySelector(".top-links");
    if (!top || !links || top.classList.contains("is-spine")) return;

    var herePath = location.pathname.replace(/index\.html$/, "");
    links.innerHTML = "";
    ITEMS.forEach(function (item) {
      var a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      var target = item.href.replace(/index\.html$/, "");
      if (herePath === target || herePath.indexOf(target) === 0 && target.length > 1) {
        a.className = "on";
      }
      if (item.label === "Iris" && herePath.indexOf("/ai/") === 0) a.className = "on";
      links.appendChild(a);
    });

    top.classList.add("is-spine");
    document.documentElement.classList.add("has-spine");

    var on = links.querySelector("a.on");
    var here = document.createElement("div");
    here.className = "top-here";
    here.textContent = on ? on.textContent.trim() : "Menu";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "top-toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "spine-panel");
    btn.setAttribute("aria-label", "Open menu");
    btn.innerHTML = "<span></span><span></span><span></span>";

    links.id = links.id || "spine-panel";
    top.appendChild(here);
    top.appendChild(btn);

    function setOpen(open) {
      top.classList.toggle("is-open", open);
      links.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
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

    function pad() {
      document.documentElement.style.setProperty(
        "--spine-h",
        Math.ceil(top.getBoundingClientRect().height) + "px"
      );
    }
    pad();
    window.addEventListener("resize", pad);
  });
})();
