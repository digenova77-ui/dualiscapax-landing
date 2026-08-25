# DualisCapax Landing — Working Version Lock

**Status:** FROZEN · DO NOT OVERWRITE WITHOUT EXPLICIT USER ORDER  
**Locked at:** 2026-08-25T00:16:39Z (UTC)  
**Source:** Live `https://dualiscapax.ai/` at lock time (byte-identical to `index.html` on `main`)

## Files

| File | Role |
|------|------|
| `index.html` | Live lander (unchanged by this lock) |
| `index.working.html` | Exact snapshot of lander at lock time |
| `WORKING_VERSION.md` | This notice |

## Content fingerprint

- **Bytes:** 17047  
- **SHA-256:** `9d7106765ed09cf5f6f7b62deea1b4c7dc4ab0a49c137498eb42f368a73fa6e7`

## What is locked (lander surface)

- Intro sequence (question → seed → NASA Big Bang video → residual audio → site)
- Header nav: Financial · Tech · Research + AI
- Logo: `brand/logo-dna-x.svg`
- Geodesic canvas (icosahedron + wire, Y-spin ~22 s/rev, opacity 0.55)
- **Truth Prevails**
- Lines: Residual Law Finance · Cutting Edge Technology · Adaptive AI · Research
- Residual Cost Peg control → `onboard.html` + UTC clock

## Rule

Agents and sessions must **not** edit `index.html` or replace the lander unless the user explicitly orders a change and names this working version as the baseline to leave or restore from.

To restore lander from this lock:

```bash
cp index.working.html index.html
```

Then commit only if the user asks to publish the restore.

## Not included in this lock

- Subpages (Financial, AI, Research, ALS, etc.)
- Burger menu / DNA-ring menu (designed in chat, not yet on live lander)
- ALS molecule-assemble template (designed in chat, not yet deployed)

---

Locked by agent at user request: walk in our landing page as of right now — call it working version.
