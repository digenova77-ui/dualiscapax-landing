"""DCLM base cases — halt. Depth 3. No fourth hop."""
from __future__ import annotations

from typing import Any, Dict, Optional

HALT_CITE = "cite"
HALT_HOLE = "hole"
HALT_ANOMALY = "anomaly"
HALT_VETO = "veto"


def loop(src: str, dst: Optional[str]) -> bool:
    if not dst:
        return False
    a, b = src.rstrip("/"), dst.rstrip("/")
    return a == b or dst in (src, "/" + src.lstrip("/"))


def halt_http(url: str, status: Optional[int], location: Optional[str] = None) -> Dict[str, Any]:
    if status == 200:
        return {"halt": HALT_CITE, "url": url, "status": status}
    if status in (301, 302, 307, 308) and loop(url, location):
        return {"halt": HALT_HOLE, "kind": "self_redirect", "url": url, "status": status, "location": location}
    if status == 404:
        return {"halt": HALT_HOLE, "kind": "not_on_mouth", "url": url, "status": status}
    if status is None:
        return {"halt": HALT_HOLE, "kind": "unreachable", "url": url}
    return {"halt": HALT_ANOMALY, "url": url, "status": status, "location": location}


def halt_cite(ok: bool, title_echo: str = "", expect: Optional[list] = None) -> Dict[str, Any]:
    if not ok:
        return {"halt": HALT_HOLE, "kind": "cite_down"}
    exp = expect or []
    low = (title_echo or "").lower()
    if exp and not any(t.lower() in low for t in exp):
        return {"halt": HALT_ANOMALY, "kind": "title_mismatch", "title_echo": title_echo}
    return {"halt": HALT_CITE, "title_echo": title_echo}


def veto_forbidden(text: str) -> Optional[Dict[str, Any]]:
    t = (text or "").lower()
    for needle, why in (
        ("patient", "phi"),
        ("chart #", "phi"),
        ("minor roster", "minor"),
        ("ask the owner for api", "token"),
    ):
        if needle in t:
            return {"halt": HALT_VETO, "kind": why}
    return None
