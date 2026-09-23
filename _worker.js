/* Pages Advanced Mode. Fail-open to ASSETS. Home never mapped. Hockey folder is unmapped so Pages can serve hockey/index.html. */
const MAP = {
  "/look": "/look.html",
  "/look/": "/look.html",
  "/look.html": "/look.html",
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
    const assets = env && env.ASSETS;
    if (!assets || !assets.fetch) {
      return new Response("assets unbound", { status: 503 });
    }
    const url = new URL(request.url);
    const dest = MAP[url.pathname];
    try {
      if (dest) {
        url.pathname = dest;
        return assets.fetch(new Request(url.toString(), request));
      }
    } catch (e) {
      /* fail-open */
    }
    return assets.fetch(request);
  }
};
