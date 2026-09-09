/** Paint audience jurisdiction onto [data-jx] nodes. Operator house never swaps. */
(function () {
  var KEY = "dc_jx";
  var SRC = "data/jurisdiction-spine.json";

  function param() {
    try {
      return new URLSearchParams(location.search).get("jx") || "";
    } catch (e) {
      return "";
    }
  }

  function stored() {
    try {
      return sessionStorage.getItem(KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function save(code) {
    try {
      sessionStorage.setItem(KEY, code);
    } catch (e) {}
  }

  function paint(pack, code) {
    var jx = pack.jurisdictions[code] || pack.jurisdictions[pack.default];
    var house = pack.operator;
    document.querySelectorAll("[data-jx]").forEach(function (el) {
      var key = el.getAttribute("data-jx");
      if (!key) return;
      if (jx[key] != null) el.textContent = jx[key];
    });
    document.querySelectorAll("[data-jx-house]").forEach(function (el) {
      var key = el.getAttribute("data-jx-house");
      if (key === "operator" || key === "line") el.textContent = house.line;
      else if (house[key] != null) el.textContent = house[key];
    });
    document.querySelectorAll("[data-jx-pick]").forEach(function (sel) {
      if (sel.value !== code) sel.value = code;
    });
    document.documentElement.setAttribute("data-jx-code", jx.code);
  }

  function bind(pack) {
    document.querySelectorAll("[data-jx-pick]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var code = sel.value;
        save(code);
        paint(pack, code);
        try {
          var u = new URL(location.href);
          u.searchParams.set("jx", code);
          history.replaceState({}, "", u);
        } catch (e) {}
      });
    });
  }

  function boot(pack) {
    var code = param() || stored() || pack.default;
    if (!pack.jurisdictions[code]) code = pack.default;
    save(code);
    paint(pack, code);
    bind(pack);
  }

  fetch(SRC)
    .then(function (r) {
      return r.json();
    })
    .then(boot)
    .catch(function () {});
})();
