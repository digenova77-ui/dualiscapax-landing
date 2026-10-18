#!/usr/bin/env python3
"""Economic sim: healthy vs stressed tapping over 40 seasons. Seeded, stdlib only.
Reports whether the forest ever falls below reserve (must never) and tap throughput."""
import os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gauntlet import W, hx, T0
from ledger import Rejected

def run(name, inflow, greed, seed=7, seasons=40, members=50, reserve=2_000_000):
    rng = random.Random(seed); w = W(seed=seed, reserve_target=reserve)
    ids = [w.fuse(f"{name}{i}", "human" if i % 2 else "bot", person=hx(name, i)) for i in range(members)]
    now = T0; tapped = refused = 0; min_ratio = None
    for s in range(seasons):
        for _ in range(20):
            now += 1
            amt = max(1, int(rng.gauss(inflow(s), inflow(s) * 0.3)))
            w.L.apply(w.op("derivative", attest=True, now=now, amount=amt, worker=rng.choice(ids),
                           source_ref=hx(name, s, now)), now)
        w.L.apply(w.op("season", attest=True, now=now, open=True), now)
        for m in ids:
            now += 1
            try:
                w.L.apply(w.op("tap", signer=m, now=now, member=m, amount=int(rng.random() * greed) + 1), now)
                tapped += 1
            except Rejected:
                refused += 1
        w.L.apply(w.op("season", attest=True, now=now, open=False), now)
        r = w.L.s["deriv"]["forest"] / reserve; min_ratio = r if min_ratio is None else min(min_ratio, r)
        w.L.check_invariants()
    d = w.L.s["deriv"]
    return f"{name:9s} taps ok={tapped:5d} refused={refused:5d} tapped_total={d['tapped']:>11,} forest_end={d['forest']:>13,} min forest/reserve={min_ratio:.3f}"

print(run("healthy", lambda s: 100_000, 8_000))
print(run("stressed", lambda s: 100_000 if s < 10 else 3_000, 20_000))          # inflow collapses
print(run("drought", lambda s: 1_000, 50_000))                                  # never healthy
print(run("greedy", lambda s: 100_000, 10 ** 9))                                # everyone taps max
