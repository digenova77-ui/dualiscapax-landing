# Differential privacy — techniques and Dualis bind
2026-08-26 22:36 EDT

DP is a math guarantee: neighboring datasets (differ by one record) yield outputs whose likelihood ratio is bounded by e^ε, with a δ sliver of slack in the approximate case.
It is not encryption. It is not tenant isolation. It is not a substitute for see-to-model on a named plant.

## Mechanisms

| mechanism | noise | privacy | typical use |
|-----------|-------|---------|-------------|
| Laplace | Lap(0, Δ₁/ε) | pure ε | counts, sums |
| Gaussian | N(0, σ²) with σ ~ Δ₂ √(2 ln(1.25/δ)) / ε | (ε, δ) | vectors, gradients |
| Exponential | sample from score × e^{εq/2Δ} | ε | pick an item |
| Randomized response | flip bits locally | local ε | telemetry |

Composition spends the budget. RDP / GDP / PLD accounting is how you add many steps without the naive ε sum.

## Where the noise is added

- **Central** — trusted curator sees raw, releases noisy query. Higher utility.
- **Local** — each source noises first. No curator sees raw. Utility worse (often 1/√n vs 1/n).
- **Distributed / shuffle** — in between; cryptography or a shuffler to recover some utility.

ML: **DP-SGD** clips per-example gradients then adds Gaussian noise. **PATE** trains teachers on disjoint shards, noisy-votes a student on public unlabeled data.

## Dualis bind

See-to-model still wants the exact line to name a next_cut (AHU-12 kWh, one bus contract).
DP is for a number they will *publish* or hand to a room that must not reconstruct a person or a sibling tenant.

| need | tool |
|------|------|
| Dualis issues a cut for this legal name | see the line; working copy; they keep the store |
| they fear a person in the feed | strip the person; Dualis does not want SIN-class for a cost row |
| they need a public dashboard of many sites | DP or suppression on the *released* aggregate |
| another tenant must not see this feed | isolation + Seal — not ε |

If they only send a noisy total opex, the completeness grade stays C. Noise that hides the object hides the cut.

Dualis does not ship a DP runtime tonight. The law is: use DP on releases that must be neighbor-indistinguishable; do not use it as a fog over the instance we were hired to name.
