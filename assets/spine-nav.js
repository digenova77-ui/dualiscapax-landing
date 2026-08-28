/** Dualis organism — one ring. One sheet. No browser chrome. */
(function () {
  if (window.__dcOrb) return;
  window.__dcOrb = true;

  var LINKS = [
    { href: "/ai/app.html", label: "Iris" },
    { href: "/ai/games.html", label: "Play" },
    { href: "/research/", label: "Read" },
    { href: "/story/", label: "Story" },
    { href: "/founding.html", label: "Foundry" }
  ];

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    document.documentElement.classList.add("has-spine");
    var old = document.querySelector(".top");
    if (old) old.setAttribute("hidden", "");

    var style = document.createElement("style");
    style.textContent =
      ".dc-orb{position:fixed;right:max(1rem,env(safe-area-inset-right));bottom:max(1rem,env(safe-area-inset-bottom));z-index:90;width:3.35rem;height:3.35rem;border:0;border-radius:50%;background:#0a0a0c;box-shadow:0 0 0 1px rgba(245,245,245,.22),0 10px 30px rgba(0,0,0,.45);padding:0;cursor:pointer}" +
      ".dc-orb svg{width:2.1rem;height:2.1rem;display:block;margin:auto}" +
      ".dc-veil{position:fixed;inset:0;z-index:85;background:rgba(5,5,8,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.35rem;opacity:0;pointer-events:none;transition:opacity .22s ease}" +
      ".dc-veil.on{opacity:1;pointer-events:auto}" +
      ".dc-veil a{color:#f4f4f5;text-decoration:none;font:800 1.65rem/1.2 Inter,system-ui,sans-serif;letter-spacing:-.03em;padding:.45rem .8rem}" +
      ".dc-veil a.now{opacity:.4}" +
      ".dc-veil .dc-home{margin-top:1.4rem;font-size:.95rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;opacity:.45}";
    document.head.appendChild(style);

    var veil = document.createElement("div");
    veil.className = "dc-veil";
    veil.setAttribute("hidden", "");
    LINKS.forEach(function (item) {
      var a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      if (location.pathname.replace(/index\.html$/, "") === item.href.replace(/index\.html$/, "")) {
        a.className = "now";
      }
      veil.appendChild(a);
    });
    var home = document.createElement("a");
    home.href = "/index.html?land=1";
    home.className = "dc-home";
    home.textContent = "DualisCapax";
    veil.appendChild(home);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dc-orb";
    btn.setAttribute("aria-label", "Open");
    btn.innerHTML = '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="20" stroke="#f4f4f5" stroke-width="2"/><circle cx="32" cy="32" r="8" stroke="#f4f4f5" stroke-width="2"/><path d="M32 12v8M32 44v8M12 32h8M44 32h8" stroke="#f4f4f5" stroke-width="2"/></svg>';

    function setOpen(open) {
      veil.classList.toggle("on", open);
      if (open) veil.removeAttribute("hidden");
      else veil.setAttribute("hidden", "");
      btn.setAttribute("aria-label", open ? "Close" : "Open");
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!veil.classList.contains("on"));
    });
    veil.addEventListener("click", function (e) {
      if (e.target === veil) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    document.body.appendChild(veil);
    document.body.appendChild(btn);
  });
})();
