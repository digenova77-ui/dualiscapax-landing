# ORGAN-WATCH — APIv1 Constantly Looks at Dualis Residual

**Architecture residual.**

> Every organ **APIv1** is oriented so it can **constantly look** at Dualis **APIv2 data / residual** and act **only** on what it can lawfully do **inside its own TOS**.

Not Dualis breaking into them.  
**They** consume **our** signal through **their** allowed watch mechanisms.

Related: [HANDOFF-CONTAINER.md](./HANDOFF-CONTAINER.md) · [DUALIS-APIv2.md](./DUALIS-APIv2.md) · [BRIDGES.md](./BRIDGES.md) · [ORGAN-APIv1-INTEGRATION.md](./ORGAN-APIv1-INTEGRATION.md)

---

## 1. Flow

```
Dualis APIv2 residual / data  (our space)
              │
              │  visible signal (repo, workflow, public health, …)
              ▼
Organ APIv1 watchers  (their space, their TOS)
              │
              │  “Can I do anything with this under my rules?”
              ▼
         Yes → organ acts
         No  → stay idle (or handoff stays WAITING)
```

---

## 2. What “constantly looking” means in practice

| Organ | Watcher (inside their TOS) | Looks at Dualis residual |
|-------|----------------------------|--------------------------|
| **GitHub** | `push` → Pages build, residual-ring, workflow_dispatch | `main` tree, workflows, APIv2 docs as data |
| **Cloudflare** | DNS/proxy config; optional API if bound | Apex/www targets; Worker only if silo bound |
| **Google** | Connected tools on demand; mail events | Drive markers, mail signals |
| **Squarespace** | Domain lifecycle mail | Ownership residual only |

We **shape Dualis data** so their native watchers have something lawful to see.  
We do **not** force them outside TOS.

---

## 3. Dual role of APIv2

| Direction | Role |
|-----------|------|
| **Out** | Dualis agents call Bridges when *we* need organ action |
| **In** | Organ APIv1 **watches** Dualis residual and acts when *their* rules allow |

Handoff containers sit in Dualis until a watcher (or BIND) supplies the other end.

---

## 4. One line

> **Organ APIv1 continuously regards Dualis residual for work it can do under its own TOS; Dualis APIv2 is the signal surface — they never leave their law, we never leave ours.**

---

*Organ-watch · 2026-08-26*
