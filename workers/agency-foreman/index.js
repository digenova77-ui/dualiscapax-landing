/* Dualis agency-foreman. Paper. Never bind /*.
   Coordinates Dualis floors only. No GOC. No whsec_. CHECKOUT stays false. */

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/site/status" || request.method !== "GET") {
      return json({ ok: false, reason: "no-route" }, 404);
    }
    const hall = await probe("https://www.dualiscapax.ai/hall/");
    const raw = await probe(
      "https://raw.githubusercontent.com/digenova77-ui/dualiscapax-landing/main/hall/index.html"
    );
    return json({
      ok: true,
      checkout: false,
      floors: {
        fence: { hall_http: hall.status, reroute: hall.reroute },
        steel: { raw_hall_http: raw.status, tour: raw.tour },
        vault: { checkout_open: false, note: "flag stays false until AUDIT-BEFORE-CHECKOUT" }
      },
      agencies: ["inspector:residual-ring", "safety:secret-scan", "gate:dualis-gate", "vault-clerk:flag"],
      chain: "WAIT_GRANT"
    }, 200);
  }
};

async function probe(target) {
  try {
    const res = await fetch(target, { redirect: "follow" });
    const text = await res.text();
    const tour = /FIVE ROOMS|START THE TOUR|data-land|DualisNarrator/i.test(text);
    const reroute = /RE-ROUTING|Sovereign Router/i.test(text);
    return { status: res.status, tour, reroute };
  } catch {
    return { status: 0, tour: false, reroute: false };
  }
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
