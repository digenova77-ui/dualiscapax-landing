"""
Reverse waterfilling for parallel independent Gaussian sources (MSE).

Given variances sigma_sq[i] and total distortion budget D_tot,
allocate D_i and rates R_i optimally:

  D_i = min(sigma_sq[i], lambda)
  R_i = 0.5 * log2(sigma_sq[i] / D_i)  if sigma_sq[i] > lambda else 0

lambda chosen so sum D_i = D_tot (clamped to feasible range).

Dualis residual note: capacity (rate) spent only where variance exceeds the waterline.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Sequence


@dataclass
class WaterfillResult:
    lambda_: float
    distortions: List[float]
    rates: List[float]  # bits per symbol
    total_rate: float
    total_distortion: float


def _sum_D(sigmas: Sequence[float], lam: float) -> float:
    return sum(min(s, lam) for s in sigmas)


def reverse_waterfill(
    sigma_sq: Sequence[float],
    D_tot: float,
    *,
    tol: float = 1e-12,
    max_iter: int = 100,
) -> WaterfillResult:
    """
    Reverse waterfilling distortion allocation.

    Parameters
    ----------
    sigma_sq : sequence of float
        Component variances (must be > 0).
    D_tot : float
        Total distortion budget (sum of per-component MSEs).
    """
    sigmas = [float(s) for s in sigma_sq]
    if not sigmas:
        raise ValueError("sigma_sq must be non-empty")
    if any(s <= 0 for s in sigmas):
        raise ValueError("all variances must be positive")

    sum_var = sum(sigmas)
    n = len(sigmas)

    # Feasible distortion: 0 < D_tot <= sum of variances
    # D_tot >= 0; if D_tot >= sum_var, all rate 0
    if D_tot <= 0:
        # limit D -> 0+: theoretically infinite rate; return numerical floor
        eps = tol * max(sigmas)
        Ds = [eps] * n
        # not a true Shannon point; caller should treat D_tot > 0
        Rs = [0.5 * math.log2(s / eps) for s in sigmas]
        return WaterfillResult(eps, Ds, Rs, sum(Rs), sum(Ds))

    if D_tot >= sum_var - tol:
        Ds = list(sigmas)
        Rs = [0.0] * n
        return WaterfillResult(max(sigmas), Ds, Rs, 0.0, sum(Ds))

    # lambda in (0, max sigma]: sum min(s, lam) is increasing in lam
    lo, hi = 0.0, max(sigmas)
    for _ in range(max_iter):
        mid = 0.5 * (lo + hi)
        sD = _sum_D(sigmas, mid)
        if abs(sD - D_tot) <= tol * max(1.0, D_tot):
            lo = hi = mid
            break
        if sD < D_tot:
            lo = mid
        else:
            hi = mid
    lam = 0.5 * (lo + hi)

    Ds: List[float] = []
    Rs: List[float] = []
    for s in sigmas:
        if s > lam:
            Di = lam
            Ri = 0.5 * math.log2(s / Di)
        else:
            Di = s
            Ri = 0.0
        Ds.append(Di)
        Rs.append(Ri)

    return WaterfillResult(lam, Ds, Rs, sum(Rs), sum(Ds))


def demo() -> None:
    # Example: three parallel Gaussians, total MSE budget 3.0
    sigmas = [8.0, 2.0, 0.5]
    D_tot = 3.0
    out = reverse_waterfill(sigmas, D_tot)
    print(f"lambda = {out.lambda_:.6f}")
    print(f"D_i    = {[round(d, 6) for d in out.distortions]}")
    print(f"R_i    = {[round(r, 6) for r in out.rates]} bits")
    print(f"R_tot  = {out.total_rate:.6f} bits")
    print(f"D_tot  = {out.total_distortion:.6f}")


if __name__ == "__main__":
    demo()
