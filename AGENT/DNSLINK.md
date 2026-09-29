# DNSLink config — DualisCapax

Stamp: 2026-09-29T18:06-04:00
Rung: 3 paper. Cloudflare DNS not written from this desk (no CF token).
Apex `@` and `www` stay on the live origin. Do not move them.

## Observed pin (set A — lander core5)

- CID: `bafybeian5fkku2cu47iusk3iyt3piwbpms7ri4grkneqiyxtqlzoxag2uy`
- Run: pinata-pin 36622753925
- Files: index.html, alacarte.html, manifold.html, rtesimadclm/manifold.html, 404.html
- Public gateway GET HTML: 403 ERR_ID:00023

## Cloudflare records to add (seat)

Zone: `dualiscapax.ai`
Proxy: DNS only (grey cloud) on both.

### 1. Delivery — blocked on hostname

| Type | Name | Content |
|---|---|---|
| CNAME | `ipfs` | `<dedicated>.mypinata.cloud` |

Fill `<dedicated>` from Pinata → Gateways. Not in git. Not invented here.
Pinata → Add Custom Domain → `ipfs.dualiscapax.ai` before or with this CNAME.
Wait TLS green.

### 2. DNSLink — ready once CNAME exists

| Type | Name | Content | TTL |
|---|---|---|---|
| TXT | `_dnslink.ipfs` | `dnslink=/ipfs/bafybeian5fkku2cu47iusk3iyt3piwbpms7ri4grkneqiyxtqlzoxag2uy` | 120 |

FQDN: `_dnslink.ipfs.dualiscapax.ai`
One `dnslink=` TXT only.
Do not put this on `_dnslink` at apex.

## Verify after seat writes DNS

```
dig +short TXT _dnslink.ipfs.dualiscapax.ai
curl -sI https://ipfs.dualiscapax.ai/ipfs/bafybeian5fkku2cu47iusk3iyt3piwbpms7ri4grkneqiyxtqlzoxag2uy/index.html
```

Pass: TXT matches the CID above, curl is `200 text/html`.
Until then: CONFIGURED ON PAPER, DNS=HOLE.
