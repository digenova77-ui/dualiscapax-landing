export default {
  async fetch(request, env) {
    if (!env.CF_API_TOKEN || !env.ZONE_ID) {
      return Response.json({ ok: false, reason: "no-cloudflare-token" }, { status: 403 });
    }
    const body = {
      type: "CNAME",
      name: "ipfs",
      content: "white-characteristic-ptarmigan-364.mypinata.cloud",
      proxied: false,
      ttl: 1
    };
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${env.ZONE_ID}/dns_records`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return Response.json({ ok: res.ok, result: data.success === true, errors: data.errors || [] }, { status: res.status });
  }
};
