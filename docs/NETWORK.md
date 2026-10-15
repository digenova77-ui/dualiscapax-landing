# Network and Port Map

## Origins

dualiscapax.ai is served by two sovereign origins:

| Origin | Address |
|---|---|
| New Jersey | 108.61.17.141 |
| Amsterdam | 45.76.33.16 |

Both origins answer HTTPS on port 443 and redirect HTTP on port 80 to HTTPS. This state was verified on 2026-10-15 by direct-to-origin requests (SNI and Host set explicitly), bypassing DNS: the site root returned 200 on both origins, and `/api/v2/ledger` returned 200 on both origins.

## DNS scope

DNS A and AAAA records map a name to an address only. They do not carry port information, and web clients do not consult SRV records. Port selection for web traffic is determined by the URL scheme (port 443 for HTTPS) and by the server's listener and proxy configuration. Port corrections are therefore server-configuration changes (reverse proxy or firewall), never DNS changes.

## Request path

```
client → DNS (name → origin address) → origin port 443 (Caddy)
       → route: static site at the root;
         /api/v2/* reverse-proxied to the on-box service
```

The v2 ledger route is verified end-to-end on both origins.

## dualiscapax.com

dualiscapax.com is delegated to Cloudflare nameservers at the registrar. It is not part of the sovereign serving path. Its migration is tracked separately (Route S: registrar nameserver change, executed after the .com zone is verified loaded on both origins).

## Investigation note — 2026-10-15

A report that the domain "resolves but talks on the wrong port" was investigated. Finding: no port fault at the public edge on either origin. Residual suspects for any future recurrence are:

1. On-box loopback forwarding between the proxy and individual API services.
2. Path-level mismatches between API dialects (`/api/v2/*` vs `/live/api/*`).

Both are server-side configuration matters, not DNS.
