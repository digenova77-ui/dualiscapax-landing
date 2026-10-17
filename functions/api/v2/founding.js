import { foundingRule, sign } from "../../../js/sandbox-protocol.js";

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
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Content-Type",
        "access-control-max-age": "86400"
      }
    });
  }
  if (request.method === "GET") return json(200, await foundingRule());
  if (request.method === "POST") {
    let body = null;
    try {
      body = await request.json();
    } catch (err) {
      body = null;
    }
    return json(200, await sign(body));
  }
  return json(405, { admitted: false, reason: "method", look: 0, joule: null, minted: false, gate: "shut" });
}
