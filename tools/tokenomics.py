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


# Rule 2 (owner): nobody sells or withdraws the e-fuse half. It is capped bedrock, not a balance.
class EFuseLocked(PermissionError):
    """Raised on any attempt to sell, withdraw, transfer or redeem e-fuse funds."""


FORBIDDEN_EFUSE_ACTIONS = frozenset({"sell", "withdraw", "transfer", "redeem", "swap", "burn_for_cash"})


class EFuseVault:
    """Append-only e-fuse pool. Deposits only; the one sanctioned outflow is paying world cost (rule 3)."""

    def __init__(self):
        self._balance = 0
        self.log = []

    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):
        if isinstance(amount, bool) or not isinstance(amount, int) or amount < 0:
            raise ValueError("deposit must be a non-negative int")
        self._balance += amount
        self.log.append(("deposit", amount))

    def record_purchase(self, amount, rail):
        s = split_purchase(amount, rail)
        self.deposit(s.efuse)
        return s

    def request(self, action, amount, by="anyone"):
        """Every sell/withdraw path routes here and is refused, including for the founder."""
        self.log.append(("refused", action, amount, by))
        raise EFuseLocked(f"e-fuse cannot be {action!r} by {by!r}: nobody sells the efuse")

    def sell(self, amount, by="anyone"):
        return self.request("sell", amount, by)

    def withdraw(self, amount, by="anyone"):
        return self.request("withdraw", amount, by)

    def transfer(self, amount, to, by="anyone"):
        return self.request("transfer", amount, by)


# Rule 3 (owner): if the e-fuse already covers the world cost while dollars/crypto are still used,
# the 50/50 split continues unchanged and the surplus above world cost funds expansion.
@dataclass(frozen=True)
class SettleResult:
    world_cost_paid: int
    expansion: int
    reserve: int


def settle_period(vault, world_cost):
    """Pay world cost from the e-fuse; everything above it goes to expansion (never to a person)."""
    if isinstance(world_cost, bool) or not isinstance(world_cost, int) or world_cost < 0:
        raise ValueError("world_cost must be a non-negative int")
    paid = min(vault.balance, world_cost)
    surplus = vault.balance - paid
    vault._balance = 0 if surplus else vault.balance - paid
    vault.log.append(("world_cost", paid))
    if surplus:
        vault.log.append(("expansion", surplus))
    return SettleResult(paid, surplus, vault.balance)


# Rule 4 (owner, canon): derivative value flow splits 90% forest (the whole ecosystem) /
# 9% harvest (whoever did the work) / 1% seed (David, the father seed). These are FLOW
# RECIPIENTS, not token seats. The harvest remainder goes to the forest.
# Seed rounding (fix/90-9-1-canon-20261018): the seed accrues fractional units in
# basis-point-units (1/10000 of a minor unit) via `seed_carry`, so many small flows never
# silently give the seed 0. Cumulatively, seed == floor(total * 1%) exactly.
FOREST_BPS, HARVEST_BPS, SEED_BPS = 9000, 900, 100
BPS = 10000
if FOREST_BPS + HARVEST_BPS + SEED_BPS != BPS:  # survives python -O, unlike assert
    raise RuntimeError("canon 90/9/1 must sum to 100%")


@dataclass(frozen=True)
class DerivativeFlow:
    amount: int
    forest: int
    harvest: int
    seed: int
    seed_carry: int = 0   # fractional seed owed, in 1/10000 minor units (0 <= carry < 10000)


def split_derivative(amount, seed_carry=0):
    if isinstance(amount, bool) or not isinstance(amount, int) or amount < 0:
        raise ValueError("amount must be a non-negative int in minor units")
    if isinstance(seed_carry, bool) or not isinstance(seed_carry, int) or not 0 <= seed_carry < BPS:
        raise ValueError("seed_carry must be an int in [0, 10000)")
    harvest = amount * HARVEST_BPS // BPS
    owed = seed_carry + amount * SEED_BPS
    # Never exceeds amount - harvest: for amount >= 1, owed // BPS <= 1 + amount // 100 <= ceil(0.91 * amount).
    seed, carry = divmod(owed, BPS)
    return DerivativeFlow(amount, amount - harvest - seed, harvest, seed, carry)
