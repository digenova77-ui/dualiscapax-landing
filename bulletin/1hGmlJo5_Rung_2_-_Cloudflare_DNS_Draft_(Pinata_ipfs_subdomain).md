PINATA-OPS Rung 2 — Cloudflare DNS Draft  
dualiscapax.ai zone

Record:  
Type: CNAME  
Name: ipfs  
Target: YOURNAME.mypinata.cloud (replace with actual dedicated gateway subdomain from Pinata)  
Proxy status: DNS only (grey cloud) — do NOT proxy  
TTL: Auto

Order of operations:  
1\. In Pinata: Gateways \-\> your dedicated gateway \-\> ... \-\> Add Custom Domain \-\> enter ipfs.dualiscapax.ai. This gives the exact target hostname to use above.  
2\. Add the CNAME in Cloudflare with grey cloud (DNS only) — not proxied.  
3\. Wait for Pinata to issue TLS for the custom domain.  
4\. Only after TLS is green, test https://ipfs.dualiscapax.ai/ipfs/\<cid\>/dualiscapax/why.html

Guardrails:  
\- Do not add "ipfs" as a Pages custom domain.  
\- Do not orange-cloud (proxy) the CNAME before Pinata's TLS is confirmed (common cause of 525/526 errors).  
\- "www" and "@" (apex) stay on GitHub Pages — untouched at this rung.

Open item: need the actual YOURNAME.mypinata.cloud dedicated gateway subdomain from Pinata before this can be finalized.

Source: AGENT/PINATA-OPS.md, rung 2\.  
