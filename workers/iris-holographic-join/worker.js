/**
 * Iris join for /holographic-core/v2 only.
 * Fetches GitHub source. Does not rewrite dualiscapax.ai/
 */
const RAW = "https://raw.githubusercontent.com/digenova77-ui/dualiscapax-landing/main/cf-pages/holographic-core/v2/index.html";
const ALLOW = new Set([
  "/holographic-core/v2",
  "/holographic-core/v2/",
  "/holographic-core/v2/index.html"
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/iris/status") {
      return Response.json({
        infrastructure_bridge: {
          edge_provider: "Cloudflare",
          source_repository: "GitHub-Pages-Main",
          routing_middleware: "Iris-AI",
          action: "INTERCEPT_AND_JSON",
          purge_legacy_cache: true,
          apex_overwrite: false,
          live_path: "/holographic-core/v2"
        }
      }, {
        headers: {
          "cache-control": "no-store",
          "x-dc-iris": "holographic-join",
          "x-dc-rte": "DCLM-RTE-V2.0.4"
        }
      });
    }

    if (path === "/" || path === "/index.html") {
      return new Response("Iris will not overwrite apex. Use /holographic-core/v2", {
        status: 409,
        headers: { "x-dc-iris": "apex-quarantine", "cache-control": "no-store" }
      });
    }

    if (!ALLOW.has(path)) {
      return new Response("not on the holographic join plate", { status: 404 });
    }

    const up = await fetch(RAW, { cf: { cacheTtl: 0, cacheEverything: false } });
    if (!up.ok) return new Response("Iris join missing upstream RTE", { status: 502 });

    return new Response(await up.text(), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store, must-revalidate",
        "x-dc-iris": "origin-join",
        "x-dc-rte": "DCLM-RTE-V2.0.4",
        "x-dc-purge-legacy": "true"
      }
    });
  }
};
