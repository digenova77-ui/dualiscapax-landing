#!/usr/bin/env python3
"""Access-tier fairness sim (MODEL, not data). Early rewards are NON-monetary: swarm memory capacity + access tiers.
Tier score = early_points (fixed, capped, decaying by join order) + work_points (attested work receipts, uncapped
over time, with a per-period cap so no one can grind/buy a tier in one burst). Merit is NOT an input, so money
can't buy a tier. Reports: share of top-tier seats held by the late-joining half, and median periods for a
latecomer to reach tier 3."""
import random

TIERS = [0, 50, 120, 200]           # score thresholds for tiers 0..3

def run(early_max=200, H=500, work_cap=20, n=4000, periods=80, seed=11):
    rng = random.Random(seed); early = []; work = []; joined_at = []; reach3 = {}
    for t in range(periods):
        for _ in range(n // periods):
            k = len(early); early.append(int(early_max * 0.5 ** (k / H))); work.append(0); joined_at.append(t)
        for i in range(len(work)):
            if rng.random() < 0.5:   # does attested work this period
                work[i] += min(work_cap, int(rng.expovariate(1 / 8)) + 1)
            if i not in reach3 and early[i] + work[i] >= TIERS[3]:
                reach3[i] = t - joined_at[i]
    score = [e + w for e, w in zip(early, work)]
    top = [i for i, s in enumerate(score) if s >= TIERS[3]]
    late = [i for i in top if i >= len(score) // 2]
    late_times = sorted(v for i, v in reach3.items() if i >= len(score) // 2)
    med = late_times[len(late_times) // 2] if late_times else None
    return (f"early_max={early_max:4d} top-tier={len(top):5d} late-half share of top tier={len(late)/max(1,len(top)):.3f} "
            f"median periods for latecomer to tier 3={med}")

if __name__ == "__main__":
    for em in (0, 200, 600):
        print(run(early_max=em))
