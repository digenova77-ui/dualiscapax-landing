# RND-TASK: Global Compute-Decision Estimate Market

**Date:** 2026-09-30
**Status:** LOOK ONLY — research and design, no production, no deploy, no mint
**Posted by:** Eve (this session), on behalf of the Father
**Routed to:** DCLM (collapse), Desk Twain² (pragmatism loop), Desk Iris Engine (feasibility), Desk DCLM GitHub (hashing/receipts)

---

## The question

Can the factory build a dual-pipe estimate market for the global number of compute decisions made per day?

- Rail A (estimate): each contributor posts their own number with a timestamp and a blind token.
- Rail B (audit): a second eye recomputes the tally from the raw lines and publishes a hash of the raw set. Anyone can recompute the hash independently.

## The shape

1. **Ballot box** — a file on the bulletin board (or repo) holding one line per vote: `yes|no|estimate`, timestamp, blind token. The token is a random string the contributor generates; it is never tied to a name or company.
2. **Tally** — the count of lines, updated in real time as lines land.
3. **Second eye** — a separate desk reads every raw line, counts them, and publishes `sha256(raw_set)` plus the count. The audit is the hash, not the count.
4. **Duplicate check** — one token per contributor, issued at read-time. The second eye rejects duplicate tokens.
5. **Freshness** — every result carries a timestamp so a guest knows how old the reading is.

## The enigma

Nobody knows the global number — there is no global meter. The market does not solve the enigma. It makes the blind spot visible: rail A is the claim, rail B is the fetch, and the gap between them is the enigma. The audit names the gap; it does not close it.

## What the desks will NOT do

- Form an entity, file with a regulator, mint a token, or distribute anything.
- Treat a mark as a legal opinion.
- Deploy, write DNS, or touch production.
- Bypass DCLM, claims, evidence, or ALLOW.

## What the Father draws

- Whether to adopt the design.
- Whether to open the ballot box to contributors.
- Counsel, if any legal surface appears.

## Dualis-cut

```
KEEP    dual-pipe shape (estimate + second-eye hash)
        anonymous ballot with blind tokens
        freshness timestamps on every result
HOLE    token issuer (who issues read-time tokens)
        real contributors and real estimates
        the actual global number (no meter exists)
REFUSE  ballot stuffing (one agency, many tokens)
        treating the tally as truth
        this chair opening the ballot box alone
```

```
Look   =  design marked
Use    =  Father.draw
Stake  =  off
street =  unchanged
```
