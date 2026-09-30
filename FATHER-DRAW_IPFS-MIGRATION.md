# FATHER-DRAW: IPFS Migration — Ordered, Rollbackable

**Status:** LOOK ONLY. Father draws each step. No desk sits credentials.
**Date:** 2026-09-30
**Rule:** one step at a time. Each step has a verify gate and a rollback. Nothing breaks.

---

## The five steps (in order)

### Step 1 — Replace the Cloudflare token
- **Who:** Father (or the Cloudflare agent he names)
- **What:** In GitHub Settings → Secrets → Actions, replace `CLOUDFLARE_API_TOKEN` with a new token: Account · Cloudflare Pages · Edit, on the account that owns the project.
- **Verify:** run `pages-direct-upload` workflow. Expect success, not error 10000.
- **Rollback:** revert the secret to the old token. The old deploy stays live.
- **Gate:** workflow green before Step 2.

### Step 2 — Set the Pinata JWT
- **Who:** Father
- **What:** Add `PINATAJWT` secret (Pinata API key with pin permissions).
- **Verify:** run `pinata-pin` workflow. Expect a CID returned.
- **Rollback:** delete the secret. No pin exists yet, so nothing to undo.
- **Gate:** a CID exists before Step 3.

### Step 3 — Upload the zero-nest zip
- **Who:** Father, or the deploy agent with the working token from Step 1
- **What:** Pack `cf-pages/` as a zero-nest zip (index.html, iris.html, 404.html, _redirects, manifest.webmanifest, icons at the root — no parent folder). Direct Upload to the existing Pages project.
- **Verify:**
  - `curl -sI https://dualiscapax.ai/` → 200, title "Base 3D — DualisCapax"
  - `curl -sI https://dualiscapax.ai/iris.html` → 200
  - `curl -sI https://dualiscapax.ai/no-such-door-xyz` → **404**, not the homepage
- **Rollback:** re-upload the previous known-good zip. The old deployment is retained in Pages history.
- **Gate:** all three curls pass before Step 4.

### Step 4 — Write the DNSLink TXT
- **Who:** Father only. No desk writes DNS.
- **What:** In the DNS provider for dualiscapax.ai, add:
  - Name: `_dnslink`
  - Type: TXT
  - Value: `dnslink=/ipfs/<CID-from-Step-2>`
  - TTL: 300 while testing, longer once frozen
- **Verify:** `dig +short TXT _dnslink.dualiscapax.ai` → the record. `ipfs resolve /ipns/dualiscapax.ai` → the CID.
- **Rollback:** delete the TXT record. Pages stays live. DNSLink was optional.
- **Gate:** resolution matches the pinned CID before Step 5.

### Step 5 — IPNS key as kill switch
- **Who:** Father. Key generated locally, never in chat, never in a desk.
- **What:** Generate an Ed25519 keypair offline. Publish the IPNS record pointing at the CID. The private key is the kill switch: whoever holds it controls the name.
- **Verify:** `ipfs name resolve /ipns/<k51…>` → the CID.
- **Rollback:** stop publishing. The record expires on its own.
- **Gate:** Father holds the key. Done.

---

## What this is not

- Not a swarm vote. The Father draws each step.
- Not a mint. No token, no Unity ID, no residual.
- Not a deploy from this chat. The connector pushes this file; the Father sits the credentials.
- Street unchanged until Step 3's curls pass.

---

## Dual-pipe check

- Rail A: this file (the claim/plan)
- Rail B: the curls in Step 3 (the fetch)
- The gap between them is the enigma. Name it. Don't pretend it's gone.
