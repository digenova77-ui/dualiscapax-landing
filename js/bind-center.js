/**
 * Bind center — the house as a data host.
 * Public geo/API lists and known public IPs stay readable.
 * Private lists are merit-gated.
 * Merit is invert-or-nothing, not a plaque and not a purchase.
 * We are the anything that binds everything.
 * Unusual lattice: domain-colored hex nodes, filament web, orbiting specks.
 */
(function (w) {
  var VERSION = "bind-center-20260901q";
  var INDEX = "data/bind-index.json";
  var HOSTS = "data/geo-hosts.json";
  var MERIT_KEY = "dc.merit.bind";
  var packIndex = null;
  var packHosts = null;
  var activeId = null;

  function $(sel) {
    return document.querySelector(sel);
  }

  function place(nodes) {
    var n = nodes.length || 1;
    var inner = n > 8;
    nodes.forEach(function (el, i) {
      var ring = inner && i % 2 === 1 ? 26 : 38;
      var t = (i / n) * Math.PI * 2 - Math.PI / 2;
      var x = 50 + Math.cos(t) * ring;
      var y = 50 + Math.sin(t) * (ring * 0.88);
      el.style.left = x + "%";
      el.style.top = y + "%";
      el.dataset.x = String(x);
      el.dataset.y = String(y);
    });
  }

  function drawWeb(host, nodes) {
    var old = host.querySelector("svg.bind-web");
    if (old) old.remove();
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "bind-web");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    var pts = [];
    nodes.forEach(function (el) {
      pts.push([Number(el.dataset.x || 50), Number(el.dataset.y || 50)]);
    });
    pts.forEach(function (a, i) {
      var b = pts[(i + 1) % pts.length];
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", a[0]);
      line.setAttribute("y1", a[1]);
      line.setAttribute("x2", b[0]);
      line.setAttribute("y2", b[1]);
      svg.appendChild(line);
      if (i % 2 === 0) {
        var c = pts[(i + 3) % pts.length];
        var cross = document.createElementNS("http://www.w3.org/2000/svg", "line");
        cross.setAttribute("x1", a[0]);
        cross.setAttribute("y1", a[1]);
        cross.setAttribute("x2", c[0]);
        cross.setAttribute("y2", c[1]);
        svg.appendChild(cross);
      }
    });
    host.insertBefore(svg, host.firstChild);
  }

  function specks(host) {
    for (var i = 0; i < 7; i++) {
      var s = document.createElement("i");
      s.className = "bind-speck";
      s.setAttribute("aria-hidden", "true");
      s.style.animationDelay = (i * -2.4) + "s";
      host.appendChild(s);
    }
  }

  function paintRead(domain) {
    var box = $("#bind-read");
    if (!box || !domain) return;
    var knows = (domain.knows || []).slice(0, 6).join(" · ");
    box.innerHTML =
      '<p class="k">' +
      (domain.open ? "Open look · goal onboard" : "Held · merit · goal onboard") +
      "</p><p class=\"w\">" +
      domain.bind +
      "</p><p class=\"d\">" +
      domain.deeper +
      "</p>" +
      (knows ? '<p class="knows">Binds · ' + knows + "</p>" : "");
  }

  function renderLattice(pack) {
    var host = $("#bind-lattice");
    if (!host) return;
    host.innerHTML =
      '<i class="bind-core" aria-hidden="true"></i><i class="bind-ring"></i><i class="bind-ring"></i><i class="bind-ring"></i>';
    specks(host);
    (pack.domains || []).forEach(function (d) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bind-node";
      btn.dataset.id = d.id;
      btn.dataset.open = d.open ? "true" : "false";
      btn.setAttribute("aria-label", (d.open ? "Look " : "Held ") + d.word);
      btn.innerHTML = "<b>" + (d.open ? "GOAL" : "HELD") + "</b><span>" + d.word + "</span>";
      btn.addEventListener("click", function () {
        host.querySelectorAll(".bind-node").forEach(function (n) {
          n.classList.toggle("is-on", n === btn);
        });
        activeId = d.id;
        paintRead(d);
        renderHosts(packHosts);
        if (w.DCLookReceipt) DCLookReceipt.issue(d.id).then(showSlip);
        if (w.DCTheme && DCTheme.apply) DCTheme.apply(d.id === "bind" ? "nation" : "plant", { keyword: d.word });
      });
      host.appendChild(btn);
    });
    var nodes = host.querySelectorAll(".bind-node");
    place(nodes);
    drawWeb(host, nodes);
    var start = (pack.domains || []).find(function (d) { return d.id === "bind"; }) || (pack.domains || [])[0];
    if (start) {
      activeId = start.id;
      paintRead(start);
      var on = host.querySelector('[data-id="' + start.id + '"]');
      if (on) on.classList.add("is-on");
    }
  }

  function row(item, held) {
    var el = document.createElement("div");
    el.className = held ? "held-row" : "host-row";
    el.innerHTML =
      "<b>" +
      (held ? item.state || "HELD" : item.role) +
      "</b><span>" +
      item.label +
      (item.host ? " · " + item.host : "") +
      (item.access ? " · " + item.access : item.rule ? " · " + item.rule : "") +
      "</span><span class=\"host-geo\">" +
      (item.geo || "") +
      "</span>";
    return el;
  }

  function geoHead(label) {
    var el = document.createElement("p");
    el.className = "geo-head";
    el.textContent = label;
    return el;
  }

  function renderHosts(pack) {
    if (!pack) return;
    var pub = $("#public-hosts");
    var priv = $("#private-hosts");
    var list = (pack.public_hosts || []).slice();
    if (activeId && activeId !== "bind") {
      var focused = list.filter(function (h) { return h.domain === activeId; });
      if (focused.length) list = focused.concat(list.filter(function (h) { return h.domain !== activeId; }));
    }
    if (pub) {
      pub.innerHTML = "";
      var lastGeo = "";
      list.forEach(function (h) {
        var g = (h.geo || "edge").split("/")[0].trim();
        if (g !== lastGeo) {
          pub.appendChild(geoHead(g));
          lastGeo = g;
        }
        pub.appendChild(row(h, false));
      });
      if (pack.local_cell) {
        pub.appendChild(geoHead("this device"));
        pub.appendChild(
          row(
            {
              role: pack.local_cell.role,
              label: "Local cell",
              host: pack.local_cell.host,
              geo: "this device",
              access: pack.local_cell.access
            },
            false
          )
        );
      }
    }
    if (priv) {
      priv.innerHTML = "";
      var merit = false;
      try {
        merit = localStorage.getItem(MERIT_KEY) === "1";
      } catch (e) {}
      var held = pack.private_lists || [];
      if (activeId && activeId !== "bind") {
        var match = held.filter(function (h) { return h.domain === activeId; });
        if (match.length) held = match.concat(held.filter(function (h) { return h.domain !== activeId; }));
      }
      held.forEach(function (h) {
        if (!merit) {
          priv.appendChild(row(h, true));
        } else {
          priv.appendChild(
            row(
              {
                role: "MERIT",
                label: h.label + " · still no person list. Count " + (h.count || 0),
                geo: h.geo,
                access: h.rule
              },
              false
            )
          );
        }
      });
    }
  }

  function invertMerit() {
    var leftover = 17;
    var guess = w.prompt("Invert the leftover. What figure returns " + leftover + " to zero leftover? Type the leftover back.");
    var note = $("#merit-note");
    if (String(guess).trim() === String(leftover)) {
      try {
        localStorage.setItem(MERIT_KEY, "1");
      } catch (e) {}
      if (note) note.textContent = "Merit held on this device. Private lists stay nameless. Held is not a person file.";
      renderHosts(packHosts);
    } else {
      if (note) note.textContent = "Nothing is owed. Invert or nothing. A wrong figure does not open a list.";
    }
  }

  function showSlip(slip) {
    var el = $("#look-slip");
    if (!el || !slip) return;
    el.textContent = "LOOK receipt · not a coin · " + slip.seat + " · " + slip.hash.slice(0, 16);
  }

  function loadHosts() {
    fetch(HOSTS)
      .then(function (r) { return r.json(); })
      .then(function (pack) {
        packHosts = pack;
        renderHosts(pack);
      })
      .catch(function () {});
  }

  function boot() {
    fetch(INDEX)
      .then(function (r) { return r.json(); })
      .then(function (pack) {
        packIndex = pack;
        renderLattice(pack);
      })
      .catch(function () {});
    loadHosts();
    var meritBtn = $("#merit-btn");
    if (meritBtn) meritBtn.addEventListener("click", invertMerit);
    var lookBtn = $("#look-btn");
    if (lookBtn) {
      lookBtn.addEventListener("click", function () {
        if (w.DCLookReceipt) DCLookReceipt.issue("center").then(showSlip);
      });
    }
    var last = w.DCLookReceipt && DCLookReceipt.last && DCLookReceipt.last();
    if (last) showSlip(last);
    if (w.DCTheme && DCTheme.apply) DCTheme.apply("nation", { keyword: "Bind" });
    var sky = $(".bind-sky");
    if (sky && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sky.addEventListener("pointermove", function (ev) {
        var r = sky.getBoundingClientRect();
        var nx = ((ev.clientX - r.left) / r.width) * 2 - 1;
        var ny = ((ev.clientY - r.top) / r.height) * 2 - 1;
        sky.style.setProperty("--bind-tilt-x", (16 - ny * 8).toFixed(2) + "deg");
        sky.style.setProperty("--bind-tilt-y", (-8 + nx * 10).toFixed(2) + "deg");
      });
    }
  }

  w.DCBindCenter = { version: VERSION, boot: boot };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : globalThis);
