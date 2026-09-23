/**
 * IrisRealm — path → room. One shell, many clothes.
 * LOOK is free. Functions are marked, not opened here.
 * No Dualis mixer. No screen-reader of the whole repo.
 */
(function (w) {
  var VERSION = "iris-realm-2026-09-23";
  var FALLBACK = {
    id: "home",
    path: "/",
    title: "Front door",
    cafe: "You just walked in. That's Iris.",
    theme: "home",
    look: true,
    fn: false
  };
  var CACHE = null;

  function norm(p) {
    p = String(p || w.location.pathname || "/");
    if (!p.startsWith("/")) p = "/" + p;
    if (p.length > 1 && p.endsWith("/index.html")) p = p.slice(0, -10);
    return p;
  }

  function matchRoom(rooms, path) {
    path = norm(path);
    var i, r, m, j;
    for (i = 0; i < rooms.length; i++) {
      r = rooms[i];
      m = r.match || [r.path];
      for (j = 0; j < m.length; j++) {
        if (norm(m[j]) === path) return r;
      }
    }
    for (i = 0; i < rooms.length; i++) {
      r = rooms[i];
      if (r.path && r.path !== "/" && path.indexOf(r.path) === 0) return r;
    }
    return FALLBACK;
  }

  function applyTheme(room) {
    if (!w.document || !document.documentElement) return;
    var root = document.documentElement;
    root.setAttribute("data-realm", room.id || "home");
    root.setAttribute("data-theme", room.theme || "home");
    if (document.body) {
      document.body.setAttribute("data-realm", room.id || "home");
      document.body.setAttribute("data-theme", room.theme || "home");
    }
  }

  function briefing(room) {
    room = room || FALLBACK;
    return {
      id: room.id,
      title: room.title,
      cafe: room.cafe,
      look: !!room.look,
      fn: !!room.fn,
      demo: !!room.demo,
      path: room.path,
      iris: "You are in " + room.title + ". " + room.cafe
    };
  }

  function load(url) {
    url = url || "/data/rooms.json";
    return fetch(url, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("rooms");
        return res.json();
      })
      .then(function (data) {
        CACHE = data;
        var room = matchRoom(data.rooms || [], w.location.pathname);
        applyTheme(room);
        w.IRIS_ROOM = briefing(room);
        if (w.dispatchEvent) {
          w.dispatchEvent(new CustomEvent("iris:realm", { detail: w.IRIS_ROOM }));
        }
        return w.IRIS_ROOM;
      })
      .catch(function () {
        var room = FALLBACK;
        applyTheme(room);
        w.IRIS_ROOM = briefing(room);
        return w.IRIS_ROOM;
      });
  }

  function fromPath(path) {
    if (CACHE && CACHE.rooms) return briefing(matchRoom(CACHE.rooms, path));
    return briefing(FALLBACK);
  }

  w.IrisRealm = {
    version: VERSION,
    load: load,
    fromPath: fromPath,
    applyTheme: applyTheme,
    briefing: briefing
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { load(); });
  } else {
    load();
  }
})(window);
