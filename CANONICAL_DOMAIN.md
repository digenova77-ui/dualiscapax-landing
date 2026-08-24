# CANONICAL DOMAIN LAW — DualisCapax Inc.

**Status:** Locked · Product & corporate public-face rule  
**Effective:** 2026-08-24  
**Authority:** DualisCapax Inc. public surface policy

---

## Rule

**The sole public canonical domain is:**

```text
https://dualiscapax.ai
```

Regardless of where the site files are built, stored, or temporarily previewed (GitHub Pages, Cloudflare Pages, staging, mirrors):

1. **Brand and law** treat **dualiscapax.ai** as the official public URL.
2. All **public** links, cards, bios, and investor packs **should** use dualiscapax.ai once DNS serves the current beta.
3. **Preview hosts** (e.g. `*.github.io`) are **engineering mirrors only** — not a second public face.
4. When the modern build is the live origin, **all paths mask/resolve under dualiscapax.ai** (apex + www as configured).

---

## Hosting reality (not a second law)

| Layer | Role |
|-------|------|
| **Canonical name** | dualiscapax.ai (this document) |
| **Current engineering mirror** | https://digenova77-ui.github.io/dualiscapax-landing/ |
| **Cutover** | Cloudflare (or nameserver holder) must point dualiscapax.ai at the modern build |

Until cutover completes, the mirror remains the only place the new beta is visible. The **canonical claim** is still dualiscapax.ai.

---

## Enforcement on the plane

- Site `<link rel="canonical">` targets `https://dualiscapax.ai/...`
- Internal product copy prefers dualiscapax.ai
- CNAME file in this repo: `dualiscapax.ai`
- Old residual-tax control-plane origin is **not** the public face once replaced

---

## One line

> **Wherever the bits live, the public door is dualiscapax.ai.**

Copyright 2026 DualisCapax Inc.
