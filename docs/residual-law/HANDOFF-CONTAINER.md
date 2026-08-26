# HANDOFF CONTAINER — Waiting Room in Our Protocol

**Status:** Locked 26 Aug 2026  
**Operator meaning:** *What one agency can’t do sits in a container in the protocol we build, waiting for the other end that says “hey, are you looking to do anything?” Then our API does the transition that the other people wouldn’t do.*

Cross-ref: DUALIS-APIV2 · BRIDGES · SOFTWARE-LAYER-BRIDGE · NO-TERMINAL-CANNOT · BIND-API · TOTAL-DUALIS-INTEGRATION

---

## 1. Idea

Platforms/organs (**agencies**) stop at their boundary.  
They will **not** invent DualisCapax’s join for us.

So:

1. The **can’t** is not a dead end.  
2. It is placed in a **Handoff Container** inside **our** protocol (APIv2 space).  
3. The container **waits** for a signal from the other end (other organ, other agent, Operator BIND, observe result): *“are you looking to do anything?”*  
4. **Dualis APIv2** performs the **transition** — the step neither agency would perform alone.

```
Agency A: can’t X from here
        |
        v
  HANDOFF CONTAINER (our protocol)
  state: WAITING
        |
        |  <-- signal from other end: looking to act?
        v
  Dualis APIv2 TRANSITION
  (join / rewrite / route / bind / clear)
        |
        v
  Residual goal advances under our law
```

---

## 2. Container fields

| Field | Meaning |
|-------|--------|
| `id` | Handoff id |
| `from_agency` | Organ or agent that hit LIMIT |
| `cannot` | What they cannot do inside themselves |
| `goal` | Dualis residual still required |
| `state` | `WAITING` \| `SIGNALED` \| `TRANSITIONING` \| `CLEARED` |
| `other_end` | Who may signal (organ/agent/Operator) |
| `signal` | Optional: “looking to do Y” |
| `transition` | APIv2 verb that only we own |
| `ledger` | Line in \(\mathcal{R}\) for TDI invertibility |

**Never** `state = DEAD` because “they won’t allow me.”

---

## 3. Signals (“are you looking to do anything?”)

| Other end | Example signal |
|-----------|----------------|
| Agent B/C/A | Bucket has capacity / LEAF-LIVE ready |
| BRIDGE-GIT | Push/Actions available |
| BRIDGE-CLOUD | Observe apex ok / BIND G1 present |
| Operator | `YES BIND` / `YES` / `GOLD` |
| Observe | Origin 200, ring green |

Signal does **not** mean the other agency implements our whole product.  
It means: **something on that end can move.** Our API does the **transition**.

---

## 4. Transition (what “they wouldn’t do”)

Examples of transitions **only Dualis APIv2** owns:

| Agencies alone | Our transition |
|----------------|----------------|
| Git can’t set DNS | Health law = apex+origin; optional BIND path |
| Drive can’t write body | Route truth to Git LOAD_AT_START |
| CF won’t invent Fuel law | Product residual stays in our space |
| Two agents can’t share a file safely | LEAF-LIVE + buckets |
| Organ LIMIT + silent Operator | Container WAITING until signal — not panic dump |

**They** provide allowed surfaces or silence.  
**We** provide the join.

---

## 5. APIv2 verbs

| Verb | Role |
|------|------|
| `handoff.park` | Place LIMIT in container |
| `handoff.signal` | Other end: looking to act |
| `handoff.transition` | Dualis performs the join |
| `handoff.clear` | Residual advanced; ledger written |

---

## 6. One line

**Can’t from one agency parks in our handoff container; when the other end signals interest or capacity, Dualis APIv2 runs the transition neither side would invent — that’s our protocol, not theirs.**

**Last update:** 26 Aug 2026
