# Symplectic diagnostic and performance-claim evidence boundary

## Scope inspected

This is a focused source inspection, not a repository-wide or mathematical-physics certification. Files inspected include `pipe.html`, `tests/test_symplectic_invariant.py`, `.github/workflows/symplectic-invariant.yml`, `js/dsap-engine.js`, `js/api-unified.js`, and relevant portions of `dclm-gateway.html`.

## Symplectic display in `pipe.html`

The visual stage uses CSS rings, gradients, and animation. Its diagnostic block displays fixed strings:

- `det(M) ≡ 1.000000000000`
- `R_eff ≤ 4.18e-13`
- `watchdog < 4.20 ms`

The diagnostic block does not calculate these values. The comments describe the geometry as a visualisation. Treat this display as illustrative, not as a live mathematical measurement.

## What the invariant test verifies

The separate Python test suite computes the residual `max_ij |(S^T J S - J)_ij|` for selected 4x4 matrices with `J = [[0,I],[-I,0]]`. It covers identity, a constructed symplectic transform, a determinant-one counterexample, and invalid dimensions. Its pull-request workflow passed before merge.

This verifies those test cases and helper implementation. It does not verify that `pipe.html`, a deployed service, or another runtime uses that calculation.

## Residual-floor claims

In `js/dsap-engine.js`, `R_EFF = 4.18e-13` is a fixed constant returned in the public metadata and `lawFloor()` result. The inspected `energy()` function instead derives an audio signal level from analyser samples; it does not calculate that residual floor. In `js/api-unified.js`, `RESIDUAL_FLOOR = 4.18e-13` is likewise a configured constant included in request metadata. These facts do not prove that no other service computes a related metric; they mean these inspected constants are not evidence of such a computation.

## Latency and watchdog claims

In `js/api-unified.js`, elapsed request time is measured around `fetch()` with `performance.now()` when available, and a client-observed latency note is added when the measured interval is at least 4.20 ms. This is a real client-side timing measurement of the request interval, but it is not proof that a server-side watchdog enforces a 4.20 ms deadline or that the entire system meets that latency bound.

The inspected `dclm-gateway.html` describes its ping as page-frame work measured with `performance.now()`, with a trip threshold at 4.20 ms. That is distinct from server response latency. Any claim of a watchdog must specify the measured interval, clock, sampling method, threshold behavior, failure action, and test evidence.

## Safe claim language

- Call the pipe's displayed geometry an **illustrative visualisation** until a live calculation is wired to it.
- Describe the DSAP residual floor as a **configured constant**, unless a separate measured residual is shown with method and evidence.
- Describe the API timer as **client-observed request latency**, not as proof of a server-side watchdog.
- Do not call a claim “verified” solely because a workflow prints that phrase.

## Next verification gates

1. Identify the runtime function and source data for each claimed metric.
2. For symplectic claims, calculate `S^T J S - J` on the actual runtime matrix, define the norm and tolerance, reject invalid/non-finite inputs, and test counterexamples.
3. For latency claims, specify what interval is timed and add tests proving threshold and fail-closed behavior; separately measure server-side latency if that is the claim.
4. For residual-floor claims, define the quantity mathematically, show the inputs and calculation, and test it against known cases.
5. Tie CI output to the exact commit and deployed version.

## Limitations

This note does not establish that no valid implementation exists elsewhere in this or another repository. It records the specific files and behavior inspected above.
