/* dualiscapax-web L0
 * Pretty stems as 200 files. Home and unknown paths fall through.
 * If this file throws, catch and serve assets so the zone does not die.
 */
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
  "/hockey": "/hockey.html",
  "/hockey/": "/hockey.html",
  "/alacarte": "/alacarte.html",
  "/alacarte/": "/alacarte.html",
  "/menu": "/alacarte.html",
  "/sima": "/rte/sima-dclm/index.html",
  "/sima/": "/rte/sima-dclm/index.html",
  "/rte": "/rte/index.html",
  "/rte/": "/rte/index.html",
  "/aide": "/rte/sima-dclm/index.html",
  "/desk": "/rte/sima-dclm/index.html",
  "/why": "/why.html",
  "/why/": "/why.html",
  "/sheet": "/sheet.html",
  "/sheet/": "/sheet.html",
  "/gates": "/gates.html",
  "/gates/": "/gates.html"
};

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const dest = MAP[url.pathname];
      if (dest && env && env.ASSETS) {
        const assetUrl = new URL(dest, url.origin);
        const res = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
        const headers = new Headers(res.headers);
        headers.delete("Location");
        if (res.ok) {
          return new Response(res.body, { status: 200, headers });
        }
      }
    } catch (err) {
      /* fail open */
    }
    return env.ASSETS.fetch(request);
  }
};
