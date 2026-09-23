/* Serve pretty-stems as 200 assets. No Location. Home passes through. ICE → RINK. */
const MAP = {
  "/ice": "/rink.html",
  "/ice/": "/rink.html",
  "/ice.html": "/rink.html",
  "/look": "/look.html",
  "/look/": "/look.html",
  "/look.html": "/look.html",
  "/hockey": "/hockey.html",
  "/hockey/": "/hockey.html",
  "/hockey.html": "/hockey.html",
  "/rink": "/rink.html",
  "/rink/": "/rink.html",
  "/rink.html": "/rink.html",
  "/alacarte": "/alacarte.html",
  "/alacarte/": "/alacarte.html",
  "/alacarte.html": "/alacarte.html",
  "/menu": "/alacarte.html",
  "/menu/": "/alacarte.html",
  "/sima": "/rte/sima-dclm/index.html",
  "/sima/": "/rte/sima-dclm/index.html",
  "/rte": "/rte/index.html",
  "/rte/": "/rte/index.html",
  "/aide": "/rte/sima-dclm/index.html",
  "/aide/": "/rte/sima-dclm/index.html",
  "/desk": "/rte/sima-dclm/index.html",
  "/desk/": "/rte/sima-dclm/index.html",
  "/sara": "/rte/easthill/index.html",
  "/sara/": "/rte/easthill/index.html",
  "/easthill": "/rte/easthill/index.html",
  "/easthill/": "/rte/easthill/index.html",
  "/rte/easthill": "/rte/easthill/index.html",
  "/rte/easthill/class": "/rte/easthill/class.html",
  "/rte/easthill/class.html": "/rte/easthill/class.html",
  "/rte/easthill/share": "/rte/easthill/share.html",
  "/rte/easthill/share.html": "/rte/easthill/share.html",
  "/ice-desk": "/ice-desk/index.html",
  "/ice-desk/": "/ice-desk/index.html"
};

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const dest = MAP[url.pathname];
  if (!dest) return context.next();
  const asset = context.env && context.env.ASSETS;
  if (!asset || !asset.fetch) return context.next();
  url.pathname = dest;
  return asset.fetch(new Request(url.toString(), context.request));
}
