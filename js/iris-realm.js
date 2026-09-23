/**
 * One room. The pack changes wallpaper, menu, HERE line, DSAP cue.
 * Not N RTEs. Demo look-only unless Fuel DEPTH.
 */
(function (w) {
  var VERSION = "iris-realm-2026-09-22";
  var REALMS = {
    house: {
      id: "house", theme: "house", room: "foyer",
      spoken: "This is DualisCapax. Looking is free. Engine time is what you buy.",
      menu: [
        { href: "/index.html", label: "Home" },
        { href: "/ai/app.html", label: "Iris" },
        { href: "/pay.html", label: "Pay" }
      ],
      cue: "none"
    },
    rink: {
      id: "rink", theme: "rink", room: "rink",
      spoken: "You're on the hockey door. One sheet. Demo. Looking is free. Not a live product.",
      menu: [
        { href: "/hockey.html", label: "Hockey" },
        { href: "/sheet.html", label: "Sheet" },
        { href: "/alacarte.html", label: "Seat" },
        { href: "/ai/app.html", label: "Iris" }
      ],
      cue: "horn"
    },
    clinic: {
      id: "clinic", theme: "clinic", room: "clinic",
      spoken: "SIMA desk. Look only. Simulation is not treatment. No patient names. Till is closed.",
      menu: [
        { href: "/rte/sima-dclm/", label: "SIMA" },
        { href: "/study.html", label: "Study" },
        { href: "/ai/app.html", label: "Iris" }
      ],
      cue: "soft"
    },
    lab: {
      id: "lab", theme: "lab", room: "lab",
      spoken: "This is the lab. Press the step on abstract. Demo gauges. Not optical hardware.",
      menu: [
        { href: "/abstract.html", label: "Abstract" },
        { href: "/runtime.html", label: "Runtime" },
        { href: "/compute.html", label: "Compute" },
        { href: "/ai/app.html", label: "Iris" }
      ],
      cue: "tick"
    },
    court: {
      id: "court", theme: "court", room: "court",
      spoken: "Tennis door is a pack only. No live draw. Looking is free.",
      menu: [
        { href: "/index.html", label: "Home" },
        { href: "/ai/app.html", label: "Iris" }
      ],
      cue: "none"
    },
    desk: {
      id: "desk", theme: "desk", room: "desk",
      spoken: "Easthill desk. Look only. Grade work, not a second school product.",
      menu: [
        { href: "/rte/easthill/", label: "Desk" },
        { href: "/ai/app.html", label: "Iris" }
      ],
      cue: "none"
    }
  };

  var PATH = [
    [/^\/(hockey|ice|rink|sheet|ohf|alacarte)(?:\.html)?$/i, "rink"],
    [/^\/rte\/sima-dclm/i, "clinic"],
    [/^\/study(?:\.html)?$/i, "clinic"],
    [/^\/rte\/easthill/i, "desk"],
    [/^\/(abstract|runtime|compute|engine)(?:\.html)?$/i, "lab"],
    [/^\/rte\/ice/i, "rink"],
    [/^\/tennis/i, "court"]
  ];

  function fromPath() {
    var q = "";
    try { q = String(new URLSearchParams(location.search).get("realm") || ""); } catch (e) {}
    if (q && REALMS[q]) return q;
    var p = String((w.location && location.pathname) || "/");
    for (var i = 0; i < PATH.length; i++) {
      if (PATH[i][0].test(p)) return PATH[i][1];
    }
    return "house";
  }

  function here() {
    return REALMS[fromPath()] || REALMS.house;
  }

  function paint(doc) {
    doc = doc || w.document;
    if (!doc || !doc.documentElement) return here();
    var r = here();
    doc.documentElement.setAttribute("data-realm", r.id);
    doc.documentElement.setAttribute("data-theme", r.theme);
    if (doc.body) {
      doc.body.setAttribute("data-realm", r.id);
      var stamp = doc.getElementById("realm-stamp");
      if (stamp) stamp.textContent = "Demo · look $0 · " + r.room;
    }
    return r;
  }

  function cue() {
    var r = here();
    if (r.cue === "horn" && w.IrisRink && IrisRink.horn) IrisRink.horn();
    else if (r.cue === "horn" && w.DSAP && DSAP.tone) {
      if (DSAP.unlock) DSAP.unlock();
      if (DSAP.setFelt) DSAP.setFelt(true);
      DSAP.tone(0, 196, 400);
      setTimeout(function () { DSAP.tone(180, 247, 360); }, 90);
    } else if (r.cue === "soft" && w.DSAP && DSAP.pulse) {
      if (DSAP.unlock) DSAP.unlock();
      DSAP.pulse(0, 1.2, 280);
    } else if (r.cue === "tick" && w.DSAP && DSAP.tone) {
      if (DSAP.unlock) DSAP.unlock();
      DSAP.tone(40, 440, 120);
    }
    return r;
  }

  w.IrisRealm = { version: VERSION, realms: REALMS, here: here, paint: paint, cue: cue, id: fromPath };
  if (w.document) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { paint(); });
    else paint();
  }
})(window);
