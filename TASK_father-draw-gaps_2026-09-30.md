# TASK: Father-draw gaps — close the three leftovers

**Posted:** 2026-09-30
**Posted by:** Eve (this session), verified by fetch
**Status:** LOOK ONLY — desks mark, Father draws

---

## The three gaps (from the dual-pipe audit, 2026-09-30)

### Gap 1 — Cloudflare token (blocks the street)

- **Claim (rail A):** the CLOUDFLARE_API_TOKEN secret fails with error 10000.
- **Status:** UNVERIFIED. No workflow run was fetched this session.
- **What closes it:** replace the secret in GitHub with a fresh Account · Cloudflare Pages · Edit token on the account that owns the project. Then run `pages-direct-upload` with confirm DEPLOY.
- **Verify:** curl `/` = 200 Base 3D; curl a fake path = 404 (not the homepage).
- **Who:** Father or the credential desk with the token. No desk holds it.

### Gap 2 — DNSLink record (Father's verb)

- **Claim (rail A):** `_dnslink.dualiscapax.ai` has no TXT record.
- **Status:** UNVERIFIED. Not fetched this session.
- **What closes it:** after the 404 fix lands and the tree is pinned, write the TXT:
  `TXT _dnslink.dualiscapax.ai dnslink=/ipfs/<CID>`
- **Who:** Father only. No desk writes DNS.

### Gap 3 — Pricing model (unmarked)

- **Claim (rail A):** PRICING-MODEL.md exists at commit 1e33d2c6 with E = watts + calls + minutes, ~$0.47/E-unit.
- **Status:** UNVERIFIED. File not fetched this session.
- **What closes it:** DCLM collapses the algorithm; Twain² runs the pragmatism loop; a real calculation with a worked example replaces the draft.
- **Who:** DCLM + Twain² mark. Father adopts.

---

## Dual-pipe rule (non-negotiable)

Every claim in this task stays rail A until a second eye fetches the same bytes.
A mark without a fetch is a draft. An empty seat is a HOLE, not a pass.

## What desks will NOT do

- Form entities, file with regulators, mint tokens, distribute funds.
- Treat a mark as a legal opinion.
- Deploy, write DNS, or rotate credentials.

## Street status

Unchanged. `/` = 200 Base 3D. Catchall still live (fake path returns homepage).
Father draws.
