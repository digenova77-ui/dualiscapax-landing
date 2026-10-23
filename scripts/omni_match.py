"""Grade a live /omni response. Used by tests and the shell check."""
from __future__ import annotations


def grade(status: int, cache_control: str) -> dict:
    cc = (cache_control or "").lower()
    if status != 200:
        return {"grade": "HYPOTHETICAL", "pass": False, "reason": "not 200"}
    if "no-store" not in cc:
        return {"grade": "HYPOTHETICAL", "pass": False, "reason": "missing no-store"}
    return {"grade": "MEASURED", "pass": True, "reason": "http 200 and no-store"}


def odds(status: int, cache_control: str) -> dict:
    """Live odds of a real deploy claim. Derived from the match grade.
    MEASURED → 1.0. Otherwise 0.0. No invented probabilities.
    """
    g = grade(status, cache_control)
    if g["pass"]:
        return {"odds": 1.0, "grade": "MEASURED", "pass": True}
    return {"odds": 0.0, "grade": "HYPOTHETICAL", "pass": False, "reason": g["reason"]}
