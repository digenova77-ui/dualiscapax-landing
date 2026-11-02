"""Hydrogenic orbital reference functions in atomic units.

Scope: nonrelativistic one-electron Coulomb model with an infinitely heavy
nucleus. These functions are for transparent reference calculations, not a
precision spectroscopy package. Distances are expressed in Bohr radii unless
a0 is supplied; radial wavefunctions use the normalization convention
integral_0^inf |R_nl(r)|^2 r^2 dr = 1.
"""
from __future__ import annotations

import math


def _require_quantum_numbers(n: int, ell: int, m: int | None = None) -> None:
    if not isinstance(n, int) or isinstance(n, bool) or n < 1:
        raise ValueError("n must be an integer >= 1")
    if not isinstance(ell, int) or isinstance(ell, bool) or not 0 <= ell < n:
        raise ValueError("ell must be an integer with 0 <= ell < n")
    if m is not None and (
        not isinstance(m, int) or isinstance(m, bool) or abs(m) > ell
    ):
        raise ValueError("m must be an integer with -ell <= m <= ell")


def _associated_laguerre(k: int, alpha: int, x: float) -> float:
    """Generalized Laguerre polynomial L_k^alpha(x), via recurrence."""
    if k == 0:
        return 1.0
    l0 = 1.0
    l1 = 1.0 + alpha - x
    if k == 1:
        return l1
    for j in range(2, k + 1):
        lj = ((2 * j - 1 + alpha - x) * l1 - (j - 1 + alpha) * l0) / j
        l0, l1 = l1, lj
    return l1


def _associated_legendre(ell: int, m_abs: int, x: float) -> float:
    """Associated Legendre P_ell^m(x), Condon–Shortley convention."""
    x = max(-1.0, min(1.0, x))
    pmm = 1.0
    if m_abs:
        root = math.sqrt(max(0.0, 1.0 - x * x))
        factor = 1.0
        for _ in range(1, m_abs + 1):
            pmm *= -factor * root
            factor += 2.0
    if ell == m_abs:
        return pmm
    pmmp1 = x * (2 * m_abs + 1) * pmm
    if ell == m_abs + 1:
        return pmmp1
    previous, current = pmm, pmmp1
    for degree in range(m_abs + 2, ell + 1):
        nxt = (
            (2 * degree - 1) * x * current
            - (degree + m_abs - 1) * previous
        ) / (degree - m_abs)
        previous, current = current, nxt
    return current


def radial_wavefunction(n: int, ell: int, r: float, a0: float = 1.0) -> float:
    """Return normalized hydrogenic radial R_nl(r), in length^(-3/2).

    Parameters
    ----------
    n, ell : principal and orbital angular momentum quantum numbers
    r : radius, must be >= 0 and use the same length unit as a0
    a0 : Bohr radius in that length unit (defaults to 1, atomic units)
    """
    _require_quantum_numbers(n, ell)
    if not math.isfinite(r) or r < 0:
        raise ValueError("r must be finite and >= 0")
    if not math.isfinite(a0) or a0 <= 0:
        raise ValueError("a0 must be finite and > 0")
    rho = 2.0 * r / (n * a0)
    norm = (2.0 / (n * a0)) ** 1.5 * math.sqrt(
        math.factorial(n - ell - 1)
        / (2.0 * n * math.factorial(n + ell))
    )
    laguerre = _associated_laguerre(n - ell - 1, 2 * ell + 1, rho)
    return norm * math.exp(-rho / 2.0) * rho**ell * laguerre


def angular_probability_density(ell: int, m: int, theta: float) -> float:
    """Return |Y_lm(theta, phi)|^2 in sr^-1; it is independent of phi.

    theta is the polar angle in radians. This uses complex spherical harmonics;
    real linear combinations can have different-looking lobes but are built
    from the same angular-momentum subspace.
    """
    if not isinstance(ell, int) or isinstance(ell, bool) or ell < 0:
        raise ValueError("ell must be an integer >= 0")
    if not isinstance(m, int) or isinstance(m, bool) or abs(m) > ell:
        raise ValueError("m must be an integer with -ell <= m <= ell")
    if not math.isfinite(theta) or not 0.0 <= theta <= math.pi:
        raise ValueError("theta must be finite and in [0, pi]")
    ma = abs(m)
    p = _associated_legendre(ell, ma, math.cos(theta))
    normalization = ((2 * ell + 1) / (4.0 * math.pi)) * (
        math.factorial(ell - ma) / math.factorial(ell + ma)
    )
    return normalization * p * p


def probability_density(
    n: int, ell: int, m: int, r: float, theta: float, a0: float = 1.0
) -> float:
    """Return |psi_nlm|^2 in length^(-3), for the separated hydrogenic state."""
    _require_quantum_numbers(n, ell, m)
    radial = radial_wavefunction(n, ell, r, a0)
    return radial * radial * angular_probability_density(ell, m, theta)


def radial_probability_density(n: int, ell: int, r: float, a0: float = 1.0) -> float:
    """Return r^2 |R_nl(r)|^2; integrate this over dr for radial probability."""
    radial = radial_wavefunction(n, ell, r, a0)
    return r * r * radial * radial
