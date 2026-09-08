const RAW = "https://raw.githubusercontent.com/digenova77-ui/dualiscapax-landing/main";
const ALLOW = {
  "/why.html": [RAW + "/why.html", "text/html; charset=utf-8"],
  "/story.html": [RAW + "/story.html", "text/html; charset=utf-8"],
  "/research/docs.html": [RAW + "/research/docs.html", "text/html; charset=utf-8"],
  "/research/doc-pane.html": [RAW + "/research/doc-pane.html", "text/html; charset=utf-8"],
  "/research/doc-catalog.json": [RAW + "/research/doc-catalog.json", "application/json; charset=utf-8"],
  "/js/doc-pane.js": [RAW + "/js/doc-pane.js", "application/javascript; charset=utf-8"],
  "/js/apex-hook.js": [RAW + "/js/apex-hook.js", "application/javascript; charset=utf-8"],
  "/css/doc-pane.css": [RAW + "/css/doc-pane.css", "text/css; charset=utf-8"]
};
export default {
  async fetch(request) {
    const hit = ALLOW[new URL(request.url).pathname];
    if (!hit) return new Response("not on the join plate", { status: 404 });
    const up = await fetch(hit[0], { cf: { cacheTtl: 60 } });
    if (!up.ok) return new Response("join plate missing upstream", { status: 502 });
    return new Response(await up.text(), {
      status: 200,
      headers: { "content-type": hit[1], "cache-control": "public, max-age=60", "x-dc-join": "origin-join" }
    });
  }
};
