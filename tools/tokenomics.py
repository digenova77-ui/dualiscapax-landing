#!/usr/bin/env python3
"""DualisCapax tokenomics law. Python stdlib only. Integer minor units (cents / base units), no floats.

Rule 1 (owner, 2026-10-17): any purchase made with dollars or crypto splits 50/50:
  half funds the e-fuse, half stays with the buyer as Merit.
Odd minor unit: the extra unit goes to the e-fuse (the bedrock is never short-changed).
Supersedes the 0.05 eFuse / 0.05 Unity / 0.90 fee-and-room reading for purchases.
Pure accounting: nothing here mints, prices, moves money or touches production.
"""
from dataclasses import dataclass

PAYMENT_RAILS = frozenset({"usd", "fiat", "crypto"})
EFUSE_SHARE_BPS = 5000  # 50.00%
MERIT_SHARE_BPS = 5000  # 50.00%
assert EFUSE_SHARE_BPS + MERIT_SHARE_BPS == 10000


@dataclass(frozen=True)
class PurchaseSplit:
    amount: int
    efuse: int
    merit: int


def split_purchase(amount, rail):
    """Split a purchase of `amount` minor units paid on `rail` ("usd"/"fiat"/"crypto")."""
    if isinstance(amount, bool) or not isinstance(amount, int):
        raise TypeError("amount must be an int in minor units")
    if amount < 0:
        raise ValueError("amount must be >= 0")
    if rail not in PAYMENT_RAILS:
        raise ValueError(f"rail must be one of {sorted(PAYMENT_RAILS)}")
    merit = amount * MERIT_SHARE_BPS // 10000
    efuse = amount - merit
    return PurchaseSplit(amount, efuse, merit)
