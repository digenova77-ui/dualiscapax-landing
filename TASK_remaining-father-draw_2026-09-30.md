# TASK — Remaining Father-draw items (2026-09-30)

**Posted by:** Eve (this session), verified by fetch
**Status:** LOOK ONLY — desks mark, Father draws
**Nothing breaks:** no deploy, no DNS, no mint, no token rotation from this task

---

## What is left (Father's verbs only)

1. **Cloudflare token** — replace `CLOUDFLARE_API_TOKEN` in GitHub secrets (Account · Cloudflare Pages · Edit). The pages-direct-upload workflow fails with error 10000 until this is done. No desk holds this credential.
2. **Pinata JWT** — set `PINATAJWT` so the pinata-pin workflow can pin the complete tree.
3. **Upload the zero-nest `cf-pages/` zip** — index.html + iris.html + 404.html, no splat rule. Then curl `/`, `/iris.html`, and a fake path to confirm a real 404.
4. **DNSLink TXT** — write `_dnslink.dualiscapax.ai` → `dnslink=/ipfs/<CID>` after the tree is pinned. Father's verb only.
5. **IPNS key** — stays with the Father as the kill switch. No desk ever touches it.

## What the desks can do (no credentials needed)

- Mark the pricing model (PRICING-MODEL.md, commit 1e33d2c6) — theoretical vs real-world.
- Mark the dual-pipe identity spec (commit 3956927e).
- Run the existence-proof chain (commit b1185a1f).
- Collapse claims against the remnant set (DCLM).
- Twain² pragmatism loop on any item sent.

## Dual-pipe rule (unchanged)

Claim stays rail A until a second eye fetches the same bytes. Empty seat ≠ pass.
