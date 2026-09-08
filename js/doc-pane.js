/** DualisCapax document pane.
 *  Look catalog + half-size window. No sealed bodies.
 *  Sales stay closed unless payment-links.json says otherwise.
 */
(function () {
  var CATALOG_URL = "/research/doc-catalog.json";
  var VIEWER = "/research/doc-pane.html";
  var cache = null;

  function catalogUrl() {
    return CATALOG_URL;
  }

  function loadCatalog() {
    if (cache) return Promise.resolve(cache);
    return fetch(catalogUrl(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("catalog " + r.status);
        return r.json();
      })
      .then(function (j) {
        cache = j;
        return j;
      });
  }

  function layerMeta(cat, layer) {
    return (cat.layers && cat.layers[layer]) || { cad: 0, status: "closed", sku: layer };
  }

  function docsFor(cat, cls) {
    return (cat.documents || []).filter(function (d) {
      return !cls || d.class === cls;
    });
  }

  function findDoc(cat, id) {
    var list = cat.documents || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function halfBox() {
    var w = Math.max(320, Math.round(window.screen.availWidth * 0.5));
    var h = Math.max(420, Math.round(window.screen.availHeight * 0.5));
    var x = Math.max(0, Math.round((window.screen.availWidth - w) / 2 + (window.screen.availLeft || 0)));
    var y = Math.max(0, Math.round((window.screen.availHeight - h) / 2 + (window.screen.availTop || 0)));
    return { w: w, h: h, x: x, y: y };
  }

  function viewerUrl(opts) {
    var q = [];
    if (opts.id) q.push("id=" + encodeURIComponent(opts.id));
    if (opts.class) q.push("class=" + encodeURIComponent(opts.class));
    return VIEWER + (q.length ? "?" + q.join("&") : "");
  }

  function openWindow(url) {
    var b = halfBox();
    var feat = [
      "popup=yes",
      "width=" + b.w,
      "height=" + b.h,
      "left=" + b.x,
      "top=" + b.y,
      "menubar=no",
      "toolbar=no",
      "location=no",
      "status=no",
      "resizable=yes",
      "scrollbars=yes"
    ].join(",");
    var w = window.open(url, "dc-doc-pane", feat);
    if (w) {
      try { w.focus(); } catch (e) {}
      return w;
    }
    return null;
  }

  function ensureOverlay() {
    var wrap = document.getElementById("dc-doc-overlay");
    if (wrap) return wrap;
    wrap = document.createElement("div");
    wrap.id = "dc-doc-overlay";
    wrap.className = "dc-doc-overlay";
    wrap.hidden = true;
    wrap.innerHTML =
      '<div class="dc-doc-window" role="dialog" aria-modal="true" aria-labelledby="dc-doc-title">' +
      '<header class="dc-doc-bar">' +
      '<div class="dc-doc-bar-copy"><p class="dc-doc-kicker" id="dc-doc-kicker">Document</p>' +
      '<h2 id="dc-doc-title">Look</h2></div>' +
      '<button type="button" class="dc-doc-x" id="dc-doc-x" aria-label="Close document">✕</button>' +
      "</header>" +
      '<iframe class="dc-doc-frame" id="dc-doc-frame" title="Document pane"></iframe>' +
      "</div>";
    document.body.appendChild(wrap);
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap) closeOverlay();
    });
    wrap.querySelector("#dc-doc-x").addEventListener("click", closeOverlay);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !wrap.hidden) closeOverlay();
    });
    return wrap;
  }

  function closeOverlay() {
    var wrap = document.getElementById("dc-doc-overlay");
    if (!wrap) return;
    wrap.hidden = true;
    document.documentElement.classList.remove("dc-doc-open");
    var frame = document.getElementById("dc-doc-frame");
    if (frame) frame.src = "about:blank";
  }

  function openOverlay(url, title, kicker) {
    var wrap = ensureOverlay();
    var frame = document.getElementById("dc-doc-frame");
    var t = document.getElementById("dc-doc-title");
    var k = document.getElementById("dc-doc-kicker");
    if (t) t.textContent = title || "Document";
    if (k) k.textContent = kicker || "Look pane · half window";
    if (frame) frame.src = url + (url.indexOf("?") === -1 ? "?" : "&") + "embed=1";
    wrap.hidden = false;
    document.documentElement.classList.add("dc-doc-open");
  }

  function openPane(opts) {
    opts = opts || {};
    var url = viewerUrl(opts);
    var title = opts.title || "Document";
    var kicker = (opts.class === "engineering" ? "02 // INFRASTRUCTURE" : opts.class === "medical" ? "04 // INTELLECTUAL PROPERTY" : "DOCUMENT") +
      " · half window";
    var w = openWindow(url);
    if (w) return w;
    openOverlay(url, title, kicker);
    return null;
  }

  function openClass(cls) {
    var title = cls === "engineering" ? "Engineering documents" : "Medical simulation documents";
    openPane({ class: cls, title: title });
  }

  function openDoc(id) {
    openPane({ id: id });
  }

  function bindClicks() {
    document.addEventListener("click", function (e) {
      var n = e.target;
      while (n && n !== document && !(n.getAttribute && n.getAttribute("data-doc-class"))) n = n.parentNode;
      if (!n || n === document) return;
      e.preventDefault();
      openClass(n.getAttribute("data-doc-class"));
    });
  }

  window.DC_DOCS = {
    load: loadCatalog,
    layerMeta: layerMeta,
    docsFor: docsFor,
    findDoc: findDoc,
    openPane: openPane,
    openClass: openClass,
    openDoc: openDoc,
    closeOverlay: closeOverlay
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindClicks);
  else bindClicks();
})();
