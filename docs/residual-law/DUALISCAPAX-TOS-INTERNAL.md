# DualisCapax Internal TOS — Operator ↔ Agent Agreement

**Nature:** Custom terms **between Operator and agents under Operator’s command** — for DualisCapax purpose only.  
**Not:** A license to breach third-party security, scrape private systems, or circumvent GitHub / Cloudflare / Squarespace / Google / Stripe rules.  
**Yes:** Unify **Operator-owned** entities in one workspace; know what is **allowed**; if a path is **not** allowed, **rebuild from scratch** until the path is allowed.

**Companions:** OPERATOR-AGENT-AUTHORIZATION.md · OPERATOR-GOLD.md · SECRETS-ISOLATION.md · BOTTOM-UP-ENGINEERING.md · CANT-LOOP.md

---

## 1. Parties (this TOS)

| Party | Role |
|-------|------|
| **Operator** | You — owner of the accounts and domains used for DualisCapax |
| **Agents** | Grok + A/B/C (+ future) acting only under your command on your scope |

This TOS does **not** bind the public, customers, or platform vendors. Platform TOSs still apply to **how** those accounts may be used; we stay inside them.

---

## 2. Purpose

Unify DualisCapax under **one residual workspace** across Operator-owned entities:

| Entity | Residual role |
|--------|----------------|
| **GitHub** (`digenova77-ui` / `dualiscapax-landing`) | Source of truth · agent write · Pages · Actions |
| **Cloudflare** (NS for dualiscapax.ai / .com) | DNS · optional Worker · edge |
| **Squarespace Domains** | Domain registration · renew · ICANN contact |
| **Google** (Gmail / Drive as connected) | Operator mail · docs read · no body-write until tool exists |
| **Optional later** | Stripe (money) · xAI (depth) — secrets in silos only |

**One purpose. One law (DCLM / residual law). One command language (YES / NO / GOLD / HOLD / CHECK / I AUTHORIZE AGENTS).**

---

## 3. Allowed (do this)

- Operate only on **accounts and properties the Operator owns or has linked** for DualisCapax.  
- Use **documented** APIs, OAuth connections Operator installed, Actions, Pages, public DNS configuration Operator controls.  
- Write site content on `main`; publish via Pages; observe origin + apex.  
- Place secrets in **vendor secret stores** (Actions secrets, wrangler secrets) — never in chat or public repo.  
- Prefer **rebuild** (new allowed design) over clever abuse of a disallowed path.

---

## 4. Not allowed (never this)

- Circumvent platform security, auth, rate limits, or TOS of any vendor.  
- Access accounts that are not Operator’s.  
- “We never agreed to their TOS” while using their product.  
- Paste production secrets into agent chat.  
- Undo CLOSED residuals without `YES reopen C#`.  
- Cure claims / securities theater on public surface.

---

## 5. Core rule: Allowed-path or rebuild

```
IF  the way we want to do X is not allowed under platform rules or residual law
THEN  do not force X through a back door
     rebuild X from scratch so the path is allowed
     (different architecture, public API, Operator dashboard grant, or scope cut)
```

Examples:

| Blocked path | Rebuild |
|--------------|--------|
| No Drive doc body write in connector | Canonical agent file on GitHub + optional manual Doc copy |
| No CF API token in chat | Actions secret + oidc-auth job when Operator sets dashboard secrets |
| www 522 | Product health on apex+origin; optional S2 DNS later — not HTML rebuild |
| Can’t set DNS from agent | Operator S2 only if desired; agents never fake DNS |

---

## 6. Unification standard

All entities above are **one DualisCapax workspace** in meaning:

- Same residual law and agent LOAD_AT_START logic  
- Same CLOSED list and command phrases  
- Same publish truth: GitHub `main`  
- Same test truth: origin + apex  
- Domain ownership (Squarespace) and DNS (Cloudflare) stay **Operator silos**; content (GitHub) stays **agent-operated** under this TOS  

Unification ≠ merging vendor logins into one password.  
Unification = **one purpose, one command, one residual map, allowed tools only.**

---

## 7. Seal relationship to AUTHORIZATION

- **I AUTHORIZE AGENTS** seals command under OPERATOR-AGENT-AUTHORIZATION.  
- This **Internal TOS** defines the **rules of engagement** for that command.  
- **OPERATOR-GOLD** defines the Operator’s minimal daily language.  
- Together: custom agreement for DualisCapax — not a third-party breach framework.

---

## 8. One line

**Our TOS: your accounts, one workspace, full clarity on allowed paths; if it isn’t allowed, rebuild until it is — never circumvent.**

**Last update:** 2026-08-26
