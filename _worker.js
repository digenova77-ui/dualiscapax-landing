/* Pages Advanced Mode. Fail-open to ASSETS. Home never mapped. */
const MAP = {
  "/ice": "/rink.html",
  "/ice/": "/rink.html",
  "/ice.html": "/rink.html",
  "/look": "/look.html",
  "/look/": "/look.html",
  "/look.html": "/look.html",
  "/rink": "/rink.html",
  "/rink/": "/rink.html",
  "/rink.html": "/rink.html",
  "/hockey": "/rink.html",
  "/hockey/": "/rink.html",
  "/alacarte": "/alacarte.html",
  "/alacarte/": "/alacarte.html",
  "/alacarte.html": "/alacarte.html",
  "/sima": "/rte/sima-dclm/index.html",
  "/sima/": "/rte/sima-dclm/index.html",
  "/rte": "/rte/index.html",
  "/rte/": "/rte/index.html",
  "/aide": "/rte/sima-dclm/index.html",
  "/aide/": "/rte/sima-dclm/index.html",
  "/desk": "/rte/sima-dclm/index.html",
  "/desk/": "/rte/sima-dclm/index.html"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const dest = MAP[url.pathname];
    try {
      if (dest && env.ASSETS) {
        url.pathname = dest;
        return env.ASSETS.fetch(new Request(url.toString(), request));
      }
    } catch (e) {
      /* fail-open */
    }
    return env.ASSETS.fetch(request);
  }
};
