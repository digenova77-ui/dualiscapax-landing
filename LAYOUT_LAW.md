# #LAYOUT_LAW — DualisCapax (LOCKED)

**Status:** LOCKED · Do not invent a different layout in a later session  
**Source recovered:** `assets/layout-law.css`  
**Locked:** 2026-08-24 (session recovery after drift)

---

## #HASH tags (search these before changing UI)

| Tag | Meaning |
|-----|--------|
| `#LAYOUT_LAW` | This document — authoritative |
| `#MOBILE_FLOW` | Vertical document stack (WordPress-like flow) |
| `#DESKTOP_PANES` | Static panes — no long page scroll past the active pane |
| `#TABLET_HYBRID` | Overlay / popout for overflow |
| `#DUAL_SCROLL` | Mobile dual-scroll depth when needed |
| `#NO_DESKTOP_ON_MOBILE` | Do not ship squeezed desktop chrome on phones |
| `#BRAND_LOCKUP` | DualisCapax wordmark + DNA helix — not random icons |

---

## Device law (determined earlier — not optional)

### Mobile — `#MOBILE_FLOW`
- **Document flow** — vertical stack, like a clean long-form site (WordPress-like reading flow)
- Dual-scroll depth where the product needs depth
- **Not** a horizontal “stories” deck unless explicitly ordered as a *tour mode*
- **Not** desktop sidebar/header chrome squeezed onto a phone

### Tablet (~768–1023) — `#TABLET_HYBRID`
- Hybrid of flow + **overlay / popout** when one screen cannot hold the detail
- Secondary detail prefers overlay trigger

### Desktop (≥1024) — `#DESKTOP_PANES`
- **Static panes**
- Page itself does **not** roam in a long scroll past the pane that holds the needed info
- Scroll **inside** the active pane if needed
- Typical shell: side nav + main pane grid (`dc-shell` / `dc-main` / `dc-side` / `dc-pane`)

---

## Implementation anchors

- CSS law file: `assets/layout-law.css`
- Classes: `.dc-shell` `.dc-main` `.dc-side` `.dc-pane` `.dc-overlay` `.dc-overlay-card`

---

## Session rule

Before any homepage or shell redesign:

1. Open `#LAYOUT_LAW` / this file  
2. Open `assets/layout-law.css`  
3. Match mobile / tablet / desktop to the law  
4. Do **not** replace with a one-off pattern because a single chat was frustrated

**Drift that violated this:** horizontal full-viewport snap slides shipped as the only mobile home (2026-08-24). That pattern may exist as an optional **tour film** route — it is **not** a replacement for `#MOBILE_FLOW` site law.

---

## Encryption note (continuity)

“Encrypted” here means **immutable product law in-repo**, not cryptography.  
Hashtags exist so agents and humans can **grep** the lock: `#LAYOUT_LAW` `#MOBILE_FLOW` `#DESKTOP_PANES` `#TABLET_HYBRID`.

— DualisCapax layout lock
