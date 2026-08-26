#!/usr/bin/env python3
"""Cloudflare Bridge — dual-TOS. Only Dualis zones. Token required for writes."""
from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

API = "https://api.cloudflare.com/client/v4"


def _req(method: str, path: str, token: str, body: dict | None = None) -> dict:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "DualisAPIv2-CFBridge/1",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            return {"success": False, "errors": json.loads(raw), "http": e.code}
        except Exception:
            return {"success": False, "errors": raw, "http": e.code}


def zone_id(token: str, name: str) -> str | None:
    q = urllib.parse.urlencode({"name": name})
    out = _req("GET", f"/zones?{q}", token)
    if not out.get("success"):
        return None
    res = out.get("result") or []
    return res[0]["id"] if res else None


def ensure_domain_redirect(
    token: str,
    source_zone: str,
    target_host: str = "dualiscapax.ai",
    status_code: int = 301,
) -> dict[str, Any]:
    """
    Create/replace a simple host-wide redirect to target_host preserving path.
    Uses http_request_dynamic_redirect phase entry ruleset.
    """
    zid = zone_id(token, source_zone)
    if not zid:
        return {"ok": False, "error": "zone_not_found", "zone": source_zone}

    # List existing rulesets for phase
    listed = _req("GET", f"/zones/{zid}/rulesets", token)
    if not listed.get("success"):
        return {"ok": False, "error": "list_rulesets", "detail": listed}

    phase = "http_request_dynamic_redirect"
    entry = None
    for rs in listed.get("result") or []:
        if rs.get("phase") == phase and rs.get("kind") == "zone":
            entry = rs
            break

    rule = {
        "expression": "true",
        "description": f"Dualis domain.unity → {target_host}",
        "action": "redirect",
        "action_parameters": {
            "from_value": {
                "status_code": status_code,
                "target_url": {
                    "expression": f'concat("https://{target_host}", http.request.uri.path)',
                },
                "preserve_query_string": True,
            }
        },
        "enabled": True,
    }

    body = {
        "name": "Dualis domain unity redirects",
        "kind": "zone",
        "phase": phase,
        "rules": [rule],
    }

    if entry:
        rid = entry["id"]
        # Fetch full ruleset and append/replace Dualis rule by description
        full = _req("GET", f"/zones/{zid}/rulesets/{rid}", token)
        if not full.get("success"):
            return {"ok": False, "error": "get_ruleset", "detail": full}
        rules = [r for r in (full.get("result", {}).get("rules") or []) if "Dualis domain.unity" not in (r.get("description") or "")]
        rules.insert(0, rule)
        out = _req("PUT", f"/zones/{zid}/rulesets/{rid}", token, {"rules": rules})
    else:
        out = _req("POST", f"/zones/{zid}/rulesets", token, body)

    ok = bool(out.get("success"))
    return {"ok": ok, "zone": source_zone, "zone_id": zid, "target": target_host, "detail": out if not ok else {"id": (out.get("result") or {}).get("id")}}


def redirect_dualis_set(token: str, zones: list[str] | None = None) -> dict:
    zones = zones or ["dualiscapax.com", "ratio-dualis.com"]
    results = [ensure_domain_redirect(token, z) for z in zones]
    return {"ok": all(r.get("ok") for r in results), "results": results}
