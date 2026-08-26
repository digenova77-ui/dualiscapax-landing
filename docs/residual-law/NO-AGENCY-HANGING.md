# NO AGENCY HANGING — fault tolerance law

**Status:** 26 Aug 2026  
**Law:** No agent (agency) is left hanging without a **named residual reason**.  
If hanging **without** reason → **system broken** → **re-engineer** (not wait, not vague can’t).

---

## Definitions

| State | Meaning |
|-------|--------|
| **Active** | Agent can measure / act / verify on the plane |
| **Hanging justified** | Blocked only by **named** L1 artifact or L2 organ (FC-1/2/3, token, file) already on FINAL-CONSTRAINTS |
| **Hanging unjustified** | Idle, unclear, waiting on serial YES, or “someone else’s turn” with no artifact name → **BROKEN** |
| **Released** | Pack in ready-for-handoff; Owner owns delivery — **not** hanging |

---

## Fault tests (run against every situation)

| # | Situation | Hang? | Justified? | Verdict |
|---|-----------|-------|------------|--------|
| T1 | Inbound mail arrives | No — automation replies | — | PASS |
| T2 | Reply From not admin@ | Soft hang on native From | YES — FC-1 / MAIL_UNITY | PASS if full reply still sent |
| T3 | Reply blocked waiting “can we send?” | Hang | **NO** — G7 already YES | **FAIL → re-engineer** (send fallback) |
| T4 | .com not redirecting | Hang on domain unity | YES — FC-2 / G2 DONE | PASS if .ai still ships |
| T5 | Agent waits for another YES on redirects | Hang | **NO** — G1 YES locked | **FAIL** |
| T6 | Signature missing on CRA pack | Hang on stamp | YES — FC-3 SIGNATURE LOADED | PASS if draft complete + sign line |
| T7 | Pack complete in ready-for-handoff | Released | — | PASS |
| T8 | Agent keeps editing after handoff | False activity | **NO** — released | **FAIL → stop** |
| T9 | Parallel GitHub write race | Brief hang | YES — retry / read SHA | PASS if retry path exists |
| T10 | “Can’t” without outer checklist | Hang | **NO** | **FAIL → outer engineering** |
| T11 | Workspace not created | Hang on mail organ | YES — L2 FC-1 | PASS if checklist + content path live |
| T12 | Agent idle on research with open depth work | Hang | **NO** if work remains | **FAIL → bind more knowledge** |
| T13 | Grafana not connected | — | N/A internal scoreboard | PASS |
| T14 | Platform TOS blocks circumvention | Hang on illegal path | YES — dual-TOS; engineer edge | PASS |
| T15 | Owner silent mid-session | Hang only on L1/L2 named items | YES if FINAL list; else work agent plane | PASS if agent plane continues |

---

## Re-engineer trigger

```text
IF agent_state == hanging
AND NOT (named FC or L1 artifact or L2 organ or released)
THEN system := BROKEN
     → DEFAULT-SOLVE outer bond
     → update Unity runtime
     → never leave agency without a reason string
```

**Reason string format:** `HANG: FC-1 MAIL_UNITY organ` | `HANG: G2 redirects` | `RELEASED: ready-for-handoff/<pack>`

---

## Cross-plane (A doesn’t leave B)

If mail plane is active and web plane is unjustified-idle → **BROKEN**.  
If web ships and mail content path is unjustified-idle → **BROKEN**.  
Justified FC hang on one plane **does not** freeze the others.

---

## One line

**Every agency is active, justified-hanging with a named residual, or released — anything else is a broken system and must be re-engineered.**
