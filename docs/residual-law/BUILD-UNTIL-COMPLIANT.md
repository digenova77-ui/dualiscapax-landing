# BUILD UNTIL COMPLIANT

**Status:** Locked 26 Aug 2026  
**Operator rule:** *If you cannot find a solution then you build it from the ground up until it is compliant with the solution of the platforms that we did integrate with to do this.*

Cross-ref: DUALISCAPAX-TOS-INTERNAL · CANT-LOOP · BOTTOM-UP-ENGINEERING · SECRETS-ISOLATION · OPERATOR-AGENT-AUTHORIZATION

---

## Rule

1. Search for an **allowed** solution on platforms we already integrated (GitHub, Cloudflare, Squarespace Domains, Google connected tools, and any first-party API the Operator grants).  
2. If none exists → **do not** force a disallowed path.  
3. **Build from the ground up** a design that is **compliant** with those platforms’ allowed mechanisms.  
4. Prefer Operator-owned first-party grants (Actions secrets, Workers, repo workflows) over anything that fights the platform.  
5. Stop only when the path is allowed **or** CANT-LOOP is truly closed and residual is named.

---

## Integrated platforms (compliance targets)

| Platform | Compliant solution space |
|----------|---------------------------|
| **GitHub** | Repo files, Pages, Actions, OIDC `id-token`, Issues, connected app write |
| **Cloudflare** | DNS in Operator zone, Workers, Pages projects, dashboard secrets / `wrangler secret` |
| **Squarespace Domains** | Registration, contact verify, renew — not site content host for DualisCapax |
| **Google** | Connected Drive/Gmail as tool surface allows; no fake scopes |
| **Operator-built API** | Endpoints Operator creates and grants for DualisCapax only |

---

## Pattern

```
need X
  → find allowed X on integrated platforms
  → if missing: design X' from ground up using only allowed primitives
  → if grant required: ask Operator YES + dashboard place (never chat secret)
  → ship X' on main / Worker / Actions
```

---

## One line

**No solution on the integrated stack → rebuild from scratch until the stack accepts it.**

**Last update:** 26 Aug 2026
