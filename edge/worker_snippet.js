import { omniSnapshot, frontierReport, DEFAULT_FACETS } from "./diamond_edge.js";

function json(body, method = "GET", status = 200, extra = {}) {
  return new Response(method === "HEAD" ? null : JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, must-revalidate",
      "cdn-cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extra,
    },
  });
}

/** Read-only, deterministic endpoints. No request data, network, or storage. */
export function edgeRoutes(url, method = "GET") {
  const route = url.pathname.replace(/\/$/, "") || "/";
  if (route !== "/omni" && route !== "/frontier") return null;
  if (method !== "GET" && method !== "HEAD") {
    return json({ error: "METHOD_NOT_ALLOWED" }, method, 405, { allow: "GET, HEAD" });
  }
  try {
    const body = route === "/omni"
      ? omniSnapshot(DEFAULT_FACETS)
      : frontierReport(DEFAULT_FACETS);
    return json(body, method);
  } catch {
    return json({ error: "EDGE_EVALUATION_UNAVAILABLE" }, method, 503);
  }
}
