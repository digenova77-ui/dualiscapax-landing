# DCLM · LiveBarn session epiphany
**Date:** 2026-09-13  
**Claim under test:** Dualis does not need a LiveBarn API. Dualis *is* the session (Ice chrome + scoreboard). Families (~17, most already on LB) watch in a **paired browser window** crafted to the playground. CSP iframe deny is acceptable.

**Method:** Multi-lens DCLM (not stub mesh). Truth-or-nothing. No invented partner promises.

---

## L0 · Product / residual
| | |
|---|---|
| **What Dualis sells** | Athlete seat + ice face (Game / Go / Tape / Me…) — not a video CDN |
| **What LB is** | Venue/family subscription stream they already pay for |
| **Epiphany fit** | Aligns with Tape ideal: Dualis frames the feed; does not host cams |
| **Risk if skimmed** | “Just open LiveBarn” without Dualis chrome = undoes Ice metaphor |

**Verdict L0:** PASS if paired window stays under Dualis playground law (scoreboard, landscape shell, known hole from TeamSnap Notes).

---

## L1 · Technical
| | |
|---|---|
| **Iframe** | `frame-ancestors 'none'` / XFO DENY — dead end without partner allowlist |
| **Paired window** | Works today; popup blockers force same-tab fallback |
| **Session** | LB cookies live in *their* window, not Dualis origin — correct, no key theft |
| **Known hole** | TeamSnap Notes URL → saved stream; else sign-in lobby |
| **Mobile** | Popups flaky; may need “Open window” as primary CTA (already) |

**Verdict L1:** PASS with mobile popup + same-tab tested. No API required for v1.

---

## L2 · Law / partner / ToS
| | |
|---|---|
| **Not claiming** | Dualis does not redistribute LB video, scrape streams, or bypass paywall |
| **User action** | Household signs into *their* LB account in *their* window |
| **Partner ask** | Optional later for in-frame allowlist — not blocking |
| **Adversarial** | Don’t deep-link steal sessions; don’t store LB passwords in Dualis (BYO auth fields are for team cams) |

**Verdict L2:** PASS if copy stays “your LiveBarn login” and we never mint LB credentials.

---

## L3 · Household / teen UX (Ice law)
| | |
|---|---|
| **Teen-simple?** | One LB card → playground + one button “Open LiveBarn window” |
| **Friction** | Two surfaces (Dualis + LB window) — front-loaded; face stays simple |
| **17 families** | If ~90% have LB, this is the default Tape pipe for Quinte test |
| **Fail mode** | No Notes URL → sign-in then browse; teach “save hole URL” once |

**Verdict L3:** PASS for epic test; watch first-time confusion on “two windows.”

---

## L4 · Adversarial / undo risk
| Attack | Mitigation |
|---|---|
| Looks like Dualis “has” LiveBarn video rights | Copy: session framing only |
| Easy-out = drop Dualis chrome, bare LB link | Forbidden — undoes Ice stack |
| Popup blocked → lose scoreboard | Same-tab fallback + return path to Tape |
| Wrong hole / lobby forever | Prefer TeamSnap Notes cite; save known stream |
| Fake mesh stamps PASS | This docket — human/DCLM lenses only |

**Verdict L4:** CONDITIONAL — epic if chrome stays; undo if we skim to a bookmark.

---

## L5 · Test plan (household)
1. Bound Ice seat → Tape → LiveBarn  
2. With Notes LB URL vs without (sign-in)  
3. Desktop: paired window + scoreboard visible on Dualis  
4. iPhone/Android: popup vs same-tab  
5. After LB login, navigate to rink/hole; save URL back into Tape if needed  
6. Confirm no ask for LB API / no password into Dualis for LB pipe  

---

## Consensus
| Lens | Result |
|---|---|
| L0 Product | PASS |
| L1 Technical | PASS (mobile caveat) |
| L2 Law | PASS |
| L3 UX | PASS (teach two-window once) |
| L4 Adversarial | CONDITIONAL on chrome discipline |

**Overall:** **PROCEED TO EPIC HOUSEHOLD TEST** — this *is* a framework epiphany if the Dualis session face holds. Not an API breakthrough; a product-boundary breakthrough.

**Closed paths (do not reopen):** LiveBarn partner API as day-one dependency; iframe-or-bust; token loops for publish.

**Open:** Ship session copy to pages.dev when publish path available (Dashboard / manual); test with real families.
