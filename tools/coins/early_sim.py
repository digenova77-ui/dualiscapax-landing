#!/usr/bin/env python3
"""Early-adopter fairness sim (MODEL, not data). Seeded, stdlib. Compares Merit-earning schemes over time:
  flat      : Merit = 50% of purchase (current ledger)
  decay     : early bonus multiplier 1 + B * 0.5**(order/H), bonus paid from a capped bonus pool, not minted freely
  decay+cap : same, plus per-identity bonus cap (anti-whale) and bonus only on first X spend (anti-sybil: bonus
              requires attested personhood, so sybils add nothing; modelled as 20% sybil attempts refused)
Reports Gini of Merit and the share held by the latest 50% of joiners at the end."""
import random

def gini(xs):
    xs = sorted(xs); n = len(xs); s = sum(xs)
    return 0.0 if n == 0 or s == 0 else sum((2 * i - n + 1) * x for i, x in enumerate(xs)) / (n * s)

def run(scheme, n=5000, periods=60, B=1.0, H=500, pool=2_000_000, cap=2_000, seed=3):
    rng = random.Random(seed); merit = []; joined = 0; pool_left = pool; out = []
    for t in range(periods):
        for _ in range(n // periods):
            whale = rng.random() < 0.02
            if scheme == "decay+cap" and rng.random() < 0.2:
                continue                                   # sybil attempt refused at fuse (no new person hash)
            merit.append(0); joined += 1
        for i in range(len(merit)):
            spend = int(rng.paretovariate(1.5) * 100) if rng.random() < 0.3 else 0
            m = spend // 2
            if scheme != "flat" and pool_left > 0 and m:
                bonus = int(m * B * 0.5 ** (i / H))
                if scheme == "decay+cap":
                    bonus = min(bonus, max(0, cap - (merit[i] // 10)))   # crude per-id bonus cap
                bonus = min(bonus, pool_left); pool_left -= bonus; m += bonus
            merit[i] += m
        if t % 15 == 14 or t == periods - 1:
            late = merit[len(merit) // 2:]
            out.append((t + 1, round(gini(merit), 3), round(sum(late) / max(1, sum(merit)), 3)))
    return out

if __name__ == "__main__":
    for sch in ("flat", "decay", "decay+cap"):
        print(f"{sch:10s} (period, gini, latecomer-half share): {run(sch)}")
