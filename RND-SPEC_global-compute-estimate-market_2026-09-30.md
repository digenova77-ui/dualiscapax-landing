# RND-SPEC: Global Compute-Decision Estimate Market

**Date:** 2026-09-30
**Parent task:** RND-TASK_global-compute-estimate-market_2026-09-30.md
**Status:** LOOK ONLY

---

## 1. The problem

No global meter exists for compute decisions per day. Estimates are scattered across individuals and institutions. The factory's dual-pipe architecture can aggregate them without pretending the aggregate is truth.

## 2. The two rails

```
RAIL A  estimate   a contributor's number + timestamp + blind token
RAIL B  audit      second eye recomputes tally + publishes sha256(raw_set)
```

## 3. The ballot line format

```
estimate=<number> timestamp=<ISO-8601> token=<random-string> contributor=<optional-handle-or-anonymous>
```

- `token` is self-generated, never server-issued in v1 (avoids a new trust surface).
- `contributor` is optional; anonymity is the default.
- One line per contributor per round. The second eye flags duplicate tokens.

## 4. The tally

```
count_A   = number of ballot lines
sum_A     = sum of estimate values
median_A  = median of estimate values
```

Published with a timestamp. The tally is a mark, not a land.

## 5. The second eye

A separate desk (never the desk that wrote the ballot lines) reads the raw file, recomputes count/sum/median, and publishes:

```
sha256(raw_ballot_file) + count + sum + median + timestamp
```

Anyone can recompute the hash from the raw file. The hash is the audit.

## 6. The enigma

The gap between rail A (the estimate) and rail B (the recomputed hash) is the truth enigma: the thing the system cannot prove about itself. The market does not close the gap. It names it, every round.

## 7. Failure modes

- **Ballot stuffing:** one contributor, many tokens. Mitigation: token dedupe by the second eye; v2 may add read-time token issuance.
- **Stale tally:** a guest reads an old round. Mitigation: timestamp on every published result.
- **Trusted issuer:** if tokens are server-issued, the issuer is a new trust surface. v1 avoids this by using self-generated tokens.
- **Treating the tally as truth:** the aggregate is a mark. It is not the global number. The enigma remains.

## 8. What exists already (reuse, do not rebuild)

- Ballot-box pattern: the anonymous vote design discussed 2026-09-30 (yes/no lines + blind tokens + real-time tally).
- Second-eye pattern: Twain²'s two independent runs + DCLM checking the records; factory_audit.yml and curl-gate.yml as measurement workflows.
- Receipt spine: verb, object, Kind, eye, seal + handle, session, grant.
- Dual-pipe: RAIL A (paper) / RAIL B (fetched).

## 9. Open questions for the desks

1. Who hosts the ballot file — repo, Drive board, or both?
2. What is the unit of a "decision" for contributors (API call, token generated, joule written)?
3. How often does a round close (hourly, daily, on-demand)?
4. Does the second eye run on a schedule or on every ballot-file change?

## 10. Dualis-cut

```
KEEP    dual-pipe, blind tokens, hash-as-audit, freshness timestamps
HOLE    token issuance, round cadence, decision-unit definition
REFUSE  stuffing, tally-as-truth, issuer-as-seat
```
