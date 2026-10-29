"""Checks only. Nothing here moves a coin or fills a held digit.

Free authority is the cap minus emitted minus what the reserve still holds.
A release returns held units. It does not create units. Winter at rest is
full scale and does not read a floor. A moving winter with no floor stays
unset. A floor of zero would stop emission, so it is a hole.
"""

from __future__ import annotations


def free_authority(cap, emitted, reserve):
    if cap is None or emitted is None or reserve is None:
        return {"ok": False, "reason": "UNSET"}
    for n in (cap, emitted, reserve):
        if not isinstance(n, int) or n < 0:
            return {"ok": False, "reason": "HOLE"}
    if emitted + reserve > cap:
        return {"ok": False, "reason": "HOLE"}
    return {"ok": True, "value": cap - emitted - reserve, "settles": False}


def admit_disburse(cap, emitted, reserve, amount):
    free = free_authority(cap, emitted, reserve)
    if not free["ok"]:
        return free
    if amount is None:
        return {"ok": False, "reason": "UNSET"}
    if not isinstance(amount, int) or amount <= 0:
        return {"ok": False, "reason": "HOLE"}
    if amount > free["value"]:
        return {"ok": False, "reason": "HOLE"}
    return {"ok": True, "value": amount, "settles": False}


def release_room(free, reserve, disbursable, requested):
    if None in (free, reserve, disbursable, requested):
        return {"ok": False, "reason": "UNSET"}
    for n in (free, reserve, disbursable, requested):
        if not isinstance(n, int) or n < 0:
            return {"ok": False, "reason": "HOLE"}
    if disbursable > free:
        return {"ok": False, "reason": "HOLE"}
    gross = free + reserve
    released = min(requested, reserve, gross - disbursable)
    if disbursable + released > gross:
        return {"ok": False, "reason": "HOLE"}
    return {"ok": True, "value": released, "settles": False}


def winter_throttle(g_ppm, floor_ppm):
    if g_ppm is None:
        return {"ok": False, "reason": "UNSET"}
    if not isinstance(g_ppm, int) or g_ppm < 0 or g_ppm > 1_000_000:
        return {"ok": False, "reason": "HOLE"}
    if g_ppm == 0:
        return {"ok": True, "value": 1_000_000, "settles": False}
    if floor_ppm is None:
        return {"ok": False, "reason": "UNSET"}
    if not isinstance(floor_ppm, int) or floor_ppm <= 0 or floor_ppm > 1_000_000:
        return {"ok": False, "reason": "HOLE"}
    scale = 1_000_000 - (g_ppm * (1_000_000 - floor_ppm)) // 1_000_000
    if scale <= 0:
        return {"ok": False, "reason": "HOLE"}
    return {"ok": True, "value": scale, "settles": False}
