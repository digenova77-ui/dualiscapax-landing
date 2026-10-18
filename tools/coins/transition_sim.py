#!/usr/bin/env python3
"""USDC -> UniFi3 gateway transition sim. Milestone-gated (parameters, never dates). Seeded, stdlib, integer math.

Stage k sets the share of gateway settlement done in UniFi3 (bps). A stage advances only when ALL milestones
for it hold for `hold` consecutive periods; it steps BACK one stage if health breaks (hysteresis).
Liquidity rule: UniFi3 share may only rise if the USDC redemption reserve still covers
`cover_bps` of outstanding UniFi3-denominated claims (prevents a handover bank-run from going unpaid).
"""
import random

STAGES_BPS = [0, 2500, 5000, 7500, 10000]          # UniFi3 share of gateway; USDC share = 10000 - this
MILESTONES = [  # per stage step: (verified Unity IDs, min steady volume/period, min ledger health bps)
    (1_000, 50_000, 10_000), (10_000, 200_000, 11_000), (50_000, 500_000, 12_000), (200_000, 1_000_000, 13_000)]

def run(name, ids_growth, volume, shock_at=None, shock_redeem_bps=0, hold=3, cover_bps=2000, periods=120, seed=1):
    rng = random.Random(seed); stage = streak = 0
    ids = 0; usdc_reserve = 0; unifi_claims = 0; health = 10_000
    log = []; unpaid = 0; stepbacks = 0; blocked_liq = 0
    for t in range(periods):
        ids += ids_growth(t); vol = max(0, int(volume(t) * rng.uniform(0.85, 1.15)))
        share = STAGES_BPS[stage]
        unifi_part = vol * share // 10_000; usdc_part = vol - unifi_part
        usdc_reserve += usdc_part // 2                  # 50/50: half of USDC inflow backs redemptions
        unifi_claims += unifi_part // 2
        health = 10_000 + min(5_000, usdc_reserve * 10_000 // max(1, unifi_claims + usdc_reserve) // 2)
        if shock_at is not None and t == shock_at:      # holders rush to redeem UniFi3-side claims into USDC
            want = unifi_claims * shock_redeem_bps // 10_000
            paid = min(want, usdc_reserve); unpaid += want - paid
            usdc_reserve -= paid; unifi_claims -= paid
            health = 10_000 * usdc_reserve // max(1, unifi_claims) if unifi_claims else 15_000
        if stage < len(MILESTONES):
            mi, mv, mh = MILESTONES[stage]
            streak = streak + 1 if (ids >= mi and vol >= mv and health >= mh) else 0
            covered = unifi_claims == 0 or usdc_reserve * 10_000 // max(1, unifi_claims) >= cover_bps
            if streak >= hold and covered:
                stage += 1; streak = 0; log.append((t, STAGES_BPS[stage]))
            elif streak >= hold:
                blocked_liq += 1
        if health < 10_000 and stage > 0:              # step back: USDC takes load again
            stage -= 1; stepbacks += 1; streak = 0; log.append((t, STAGES_BPS[stage]))
    return (f"{name:12s} final UniFi3 share={STAGES_BPS[stage]/100:5.1f}%  steps={log}\n"
            f"{'':12s} stepbacks={stepbacks} liquidity-blocked periods={blocked_liq} unpaid redemptions={unpaid:,} "
            f"usdc_reserve={usdc_reserve:,} unifi_claims={unifi_claims:,}")

if __name__ == "__main__":
    print(run("steady", lambda t: 3_000, lambda t: 50_000 + t * 15_000))
    print(run("stalled", lambda t: 3_000 if t < 20 else 0, lambda t: 100_000))
    print(run("bank-run", lambda t: 3_000, lambda t: 50_000 + t * 15_000, shock_at=100, shock_redeem_bps=6000))
    print(run("run-no-cover", lambda t: 3_000, lambda t: 50_000 + t * 15_000, shock_at=100, shock_redeem_bps=6000, cover_bps=0))
    print(run("vol-crash", lambda t: 3_000, lambda t: 50_000 + t * 15_000 if t < 70 else 20_000))
