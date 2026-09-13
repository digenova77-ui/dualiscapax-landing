/* Depth gate. Look pages stay free. Encyclopedia / doc bodies need a Unity session. */
(function () {
  var FREE = [
    "/curtain.html",
    "/why.html",
    "/story.html",
    "/index.html",
    "/ca.html",
    "/world.html",
    "/look.html",
    "/hall/",
    "/hall/index.html"
  ];
  var path = location.pathname || "";
  var free = FREE.some(function (p) {
    return path === p || path.endsWith(p);
  });
  if (free) return;
  if (!window.DC_UNITY) return;
  var here = location.pathname + location.search + location.hash;
  window.DC_UNITY.require(here);
})();
