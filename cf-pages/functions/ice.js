/**
 * Serve Ice as 200 from the asset store.
 * Zone pretty-URL 308s never see this if Functions run first.
 * If a dashboard Redirect Rule still 308s /ice, this file cannot win.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.pathname = "/ice.html";
  url.search = "";
  const asset = await context.env.ASSETS.fetch(url.toString());
  if (asset && asset.ok) {
    const headers = new Headers(asset.headers);
    headers.set("cache-control", "no-store");
    return new Response(asset.body, { status: 200, headers });
  }
  return context.next();
}
