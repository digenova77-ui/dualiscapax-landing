import { exchangeStatus, meritExchange } from "../../../js/merit-align.js";

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
  if (request.method !== "GET" && request.method !== "POST") {
    return json(405, { error: "GET or POST" });
  }
  let side;
  if (request.method === "POST") {
    try {
      const body = await request.json();
      side = body && body.side;
    } catch (err) {
      side = undefined;
    }
  }
  const book = meritExchange({ side: side });
  return json(exchangeStatus(request.method, book), book);
}
