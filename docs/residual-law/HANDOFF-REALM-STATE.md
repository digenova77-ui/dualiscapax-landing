# HANDOFF → EXPLICIT OTHER-REALM STATE

**Protocol residual.**

> Take the agent handoff from the previous round and **explicitly state** what needs to be done in the **other realm**.  
> The other realm then **searches** for that statement based on Dualis API residual / access.

Related: [HANDOFF-CONTAINER.md](./HANDOFF-CONTAINER.md) · [ORGAN-WATCH.md](./ORGAN-WATCH.md) · [DUALIS-APIv2.md](./DUALIS-APIv2.md)

---

## 1. Flow

```
Round n agent
   → LIMIT / can’t complete inside this realm
   → HANDOFF payload (explicit other-realm STATE)
   → Container WAITING

Other realm (organ APIv1 / Bridge / next agent)
   → searches Dualis residual for matching STATE
   → if can under its TOS → acts
   → if needs Operator → YES BIND
   → Dualis APIv2 transition if join required
```

---

## 2. Required handoff payload

Every handoff that parks work **must** include:

| Field | Content |
|-------|---------|
| `handoff_id` | Stable id |
| `from_realm` | e.g. `git` · `agent-A` · `product` |
| `to_realm` | e.g. `cloud` · `google` · `agent-C` · `operator` |
| **`other_realm_state`** | **Explicit imperative: what must be done there** |
| `done_when` | Observable success condition |
| `tos_bound` | Must stay inside target realm’s TOS |
| `bind_if` | Optional `YES BIND [id]` if only Operator can complete |

### Example

```text
other_realm_state:
  to_realm: cloud
  do: "Point www CNAME to Pages target; DNS-only until verified"
  done_when: "www returns 200 with same residual as apex"
  bind_if: "YES BIND cloud-dns if API token path wanted"
```

Not: “Cloudflare won’t allow me.”  
Yes: **explicit state of work in the other realm.**

---

## 3. Search

The other realm does not invent chores. It **searches** Dualis residual (containers, APIv2 data, repo signals) for `other_realm_state` matching its capacity.

```
search(other_realm_state) → match capacity?
  YES → execute under TOS
  NO  → remain WAITING or escalate BIND
```

---

## 4. One line

> **Handoff = explicit statement of work in the other realm; that realm searches Dualis residual for it and acts only under its own TOS.**

---

*Handoff realm state · 2026-08-26*
