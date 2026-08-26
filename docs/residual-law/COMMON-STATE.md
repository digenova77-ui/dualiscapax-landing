# COMMON STATE — Shared Place All Realms Can See

**Status:** Locked 26 Aug 2026  
**Operator meaning:** *Maybe the state could exist on our server or commonplace where they all have access.*

Cross-ref: REALM-HANDOFF · HANDOFF-CONTAINER · DUALIS-APIV2 · BRIDGES · TOTAL-DUALIS-INTEGRATION

---

## 1. Rule

Handoff containers, explicit `must_do`, TDI ledger lines, and BIND requests live in **one Dualis commonplace** — not fragmented only in chat memory and not buried inside each vendor’s private interior.

$$
\mathrm{CommonState} \subset \mathrm{DualisCapax}
$$

Organs and agents **look** at Common State via Bridges / API access.  
They do **not** each host our law as their product database.

---

## 2. Where Common State lives (ordered)

| Tier | Place | Access |
|------|--------|--------|
| **T0 default** | GitHub `main` under `docs/residual-law/` + optional `state/` | All agents with Git write; Pages can expose **non-secret** status; ring observes |
| **T1** | `status.html` / public health paths | Anyone can read health; no secrets |
| **T2 when bound** | Dualis Worker / `server/` (“our server”) | APIv2 endpoints for handoff JSON when G1+ secrets silo |
| **Never** | Chat as sole store; vendor interiors as system of record; secret values in public state |

**Today (no extra grant):** T0 + T1 are enough for coordination.  
**T2** elevates when Operator YES BIND enables Worker.

---

## 3. What is stored (public-safe vs sealed)

| In Common State (ok) | Never in public Common State |
|----------------------|------------------------------|
| Handoff id, realm, `must_do`, success_when, state WAITING/CLEARED | API tokens, passwords |
| TDI \(\mathcal{R}\) references, CLOSED ids | Stripe/xAI secrets |
| BIND id **names** (G1, G2) not values | Full OIDC JWTs |

---

## 4. Access pattern

```
Agent writes handoff  →  Common State (git state/ or law doc)
        |
        v
Other realm LOOK reads Common State via API access
        |
        v
Execute | signal | Dualis transition
        |
        v
Update Common State (CLEARED + ledger line)
```

**One blackboard. Many readers. Our ownership.**

---

## 5. One line

**Shared residual state lives on our commonplace (git now, Worker when bound) so every realm can look for explicit must_do — without putting secrets on the board or implementing Dualis into their databases.**

**Last update:** 26 Aug 2026
