# DualisCapax Domain Triad (LOCKED)

This file is the permanent rule set. Do not re-diagnose the domain as a new problem every session.

## The Triad (fault dependency order)

```
[1] REPO  — source of truth
    https://github.com/digenova77-ui/dualiscapax-landing

[2] ORIGIN — always serves the built site
    https://digenova77-ui.github.io/dualiscapax-landing/

[3] EDGE — custom domains are only pointers at the origin
    dualiscapax.ai
    www.dualiscapax.ai
    dualiscapax.com
    www.dualiscapax.com
```

## Rules

1. Content changes happen only in the REPO.
2. Verify content first on ORIGIN (github.io). Never debug content through the EDGE.
3. EDGE failures are DNS / Cloudflare / SSL only. Do not change site code to "fix" a domain.
4. Primary custom domain is `dualiscapax.ai` (see root `CNAME` file).
5. `www` must resolve to the same origin as apex. A 522 on www means Cloudflare origin is wrong — fix DNS, do not rebuild the site.

## Required Cloudflare DNS (both zones)

### dualiscapax.ai zone
| Name | Type | Target | Proxy |
|------|------|--------|-------|
| `@` (apex) | A | 185.199.108.153 | DNS only (grey) |
| `@` | A | 185.199.109.153 | DNS only |
| `@` | A | 185.199.110.153 | DNS only |
| `@` | A | 185.199.111.153 | DNS only |
| `www` | CNAME | digenova77-ui.github.io | DNS only |

### dualiscapax.com zone
Same pattern:
| Name | Type | Target | Proxy |
|------|------|--------|-------|
| `@` | A | 185.199.108.153 | DNS only |
| `@` | A | 185.199.109.153 | DNS only |
| `@` | A | 185.199.110.153 | DNS only |
| `@` | A | 185.199.111.153 | DNS only |
| `www` | CNAME | digenova77-ui.github.io | DNS only |

Optional: after DNS-only is stable, orange-cloud proxy can be re-enabled with SSL mode **Full** (not Flexible).

## GitHub Pages settings (repo)

- Source: Deploy from branch `main` / root (or docs)
- Custom domain: `dualiscapax.ai`
- Enforce HTTPS: ON

## Known current fault (2026-08-24)

- `https://www.dualiscapax.ai/` → Cloudflare **522** (origin unreachable)
- Apex `dualiscapax.ai` → 200 via Cloudflare
- `dualiscapax.com` / `www.dualiscapax.com` → 200 via Cloudflare
- ORIGIN github.io → 200

Fix for 522: set `www` CNAME to `digenova77-ui.github.io` with proxy **DNS only**, or point www at the same healthy origin as apex.

## Agent rule

If a user reports "domain down" or "one site up one site down":
1. Check ORIGIN first.
2. If ORIGIN is good, the fault is EDGE only.
3. Do not rebuild HTML/CSS/JS to fix DNS.
