import { unityWallet } from "../../../js/unity-wallet.js";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    }
  });
}

export async function onRequest(context) {
  const request = context.request;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "Content-Type",
        "access-control-max-age": "86400"
      }
    });
  }
  if (request.method !== "GET") return json(405, { error: "GET" });
  const url = new URL(request.url);
  const identification = url.searchParams.get("identification");
  return json(200, unityWallet({ identification: identification === null ? "" : identification }));
}
