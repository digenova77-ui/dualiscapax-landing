# IPNS Bind Ladder — DualisCapax

Date: 2026-09-30
Status: LOOK (paper). No rung climbed from this chair.

## The bind

IPFS holds the bytes. IPNS holds the name. The key that signs the IPNS record is the only capability that stays outside IPFS — and it stays with the Father. That key is the kill switch.

## The four rungs

### Rung 0 — Paper (scripts in git)

DONE. Deploy scripts, pin workflows, and this ladder live in the repo. No credential needed.

### Rung 1 — Pinned

A CID exists on Pinata (and Filebase as backup). Blocked on: PINATAJWT secret in GitHub Actions, or a manual pin from the Pinata dashboard.

Verify: `ipfs cid ls` or Pinata dashboard shows the CID. Second eye: curl the Pinata gateway for that CID and compare bytes to the zip.

### Rung 2 — Branded

ipfs.dualiscapax.ai resolves to the pinned CID via a Cloudflare Gateway hostname (or equivalent). Blocked on: gateway hostname configured in Cloudflare, DNS CNAME in place.

Verify: `curl -sI https://ipfs.dualiscapax.ai/` returns 200 with the tree.

### Rung 3 — Named

`/ipns/dualiscapax.ai` resolves via a `_dnslink` TXT record. Two shapes:

```
TXT  _dnslink.dualiscapax.ai   dnslink=/ipfs/<CID>      (frozen pin)
TXT  _dnslink.dualiscapax.ai   dnslink=/ipns/<k51…>     (movable name)
```

Blocked on: the TXT record written in the DNS zone. Father writes this — no desk writes DNS.

Verify: `dig +short TXT _dnslink.dualiscapax.ai` returns the dnslink line. `ipfs resolve /ipns/dualiscapax.ai` returns the CID.

### Rung 4 — Cutover

`@` (the apex) is served by the IPFS gateway instead of the Pages zip. This is the Seat's verb only — a written order, not a workflow. Blocked on: Rungs 1–3 verified AND an explicit Father.draw.

Verify: `curl -sI https://dualiscapax.ai/` returns the tree from the gateway, not Pages. Rollback: revert the DNS change; Pages zip stays live as the fallback.

## What no rung does

- No rung mints a Unity ID.
- No rung opens a till.
- No rung puts Talk or FACE_ID on the site.
- No rung lets a desk write DNS or rotate the IPNS key.
- The IPNS key never moves to a bot. Work moves to the key; the key never moves to the work.

## Rollback at every rung

Each rung is additive. Removing it restores the previous state. Pages stays live until Rung 4 is explicitly drawn and verified.
