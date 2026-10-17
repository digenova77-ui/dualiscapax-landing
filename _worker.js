/* Cloudflare Pages Advanced Mode.
 * Preserve the existing landing routes and ASSETS fallback.
 * HUD routes are served by this Pages Worker so they do not depend on a
 * separately deployed Worker route. Apex remains owned by Pages assets.
 */
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

const HUD_RAW = "https://raw.githubusercontent.com/digenova77-ui/dualiscapax-hud/main";
const HUD_ROUTES = new Map([
  ["/holographic-core/v2", [HUD_RAW + "/holographic-core/v2/index.html", "text/html; charset=utf-8"]],
  ["/holographic-core/v2/", [HUD_RAW + "/holographic-core/v2/index.html", "text/html; charset=utf-8"]],
  ["/holographic-core/v2/index.html", [HUD_RAW + "/holographic-core/v2/index.html", "text/html; charset=utf-8"]],
  ["/assets/holographic-hostess-40/hostess.svg", [HUD_RAW + "/assets/holographic-hostess-40/hostess.svg", "image/svg+xml; charset=utf-8"]]
]);

function noStoreHeaders(extra = {}) {
  return {
    "cache-control": "no-store, must-revalidate",
    "cdn-cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extra
  };
}

export default {
  async fetch(request, env) {
    const assets = env && env.ASSETS;
    if (!assets || !assets.fetch) {
      return new Response("Pages ASSETS binding unavailable", {
        status: 503,
        headers: noStoreHeaders()
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Read-only route proves which runtime is answering; no user/request data.
    if (path === "/iris/status" || path === "/iris/status.json") {
      return Response.json({
        runtime: "cloudflare-pages-advanced-mode",
        route_owner: "dualiscapax-web Pages _worker.js",
        hud_source: "digenova77-ui/dualiscapax-hud main",
        hud_path: "/holographic-core/v2",
        apex_overwrite: false,
        cache: "no-store"
      }, { headers: noStoreHeaders({ "x-dc-iris": "pages-bridge" }) });
    }

    // Isolated HUD paths are explicitly served from the HUD repository.
    // The homepage and every other path continue through the Pages asset binding.
    const hud = HUD_ROUTES.get(path);
    if (hud) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", {
          status: 405,
          headers: noStoreHeaders({ allow: "GET, HEAD" })
        });
      }

      let upstream;
      try {
        upstream = await fetch(hud[0], {
          method: request.method,
          headers: { accept: request.headers.get("accept") || "*/*" }
        });
      } catch {
        return new Response("HUD upstream unavailable", {
          status: 502,
          headers: noStoreHeaders({ "x-dc-iris": "upstream-error" })
        });
      }

      if (!upstream.ok) {
        return new Response("HUD upstream unavailable", {
          status: 502,
          headers: noStoreHeaders({ "x-dc-iris": "upstream-error" })
        });
      }

      return new Response(request.method === "HEAD" ? null : await upstream.arrayBuffer(), {
        status: 200,
        headers: noStoreHeaders({
          "content-type": hud[1],
          "x-dc-iris": "pages-bridge",
          "x-dc-hud-source": "github-raw"
        })
      });
    }

    const dest = MAP[path];
    if (dest) {
      const target = new URL(request.url);
      target.pathname = dest;
      try {
        return await assets.fetch(new Request(target.toString(), request));
      } catch {
        // Keep the existing Pages asset fallback if a friendly route mapping fails.
      }
    }

    // In particular, "/" is never rewritten to the HUD; Pages serves the apex.
    return assets.fetch(request);
  }
};
