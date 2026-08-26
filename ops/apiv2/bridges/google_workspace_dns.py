#!/usr/bin/env python3
"""
Google Workspace DNS Bridge (Dualis APIv2)
==========================================
Dual-TOS: does NOT create a Workspace tenant (Google UI/billing).
Does: publish DNS on Cloudflare for a Dualis zone so Workspace can verify + receive + SPF.

Required Owner steps still:
  1. Create Workspace for dualiscapax.ai
  2. Pass verification token / DKIM values from Admin when prompted
  3. Send-as / users admin@ ceo@
  4. MAIL_UNITY_CLOSE DONE

Token: CF_API_TOKEN with Zone.DNS Edit on dualiscapax.ai (and related).
"""
from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

API = "https://api.cloudflare.com/client/v4"

# Google Workspace MX (priority, server) — current Google doc set
GOOGLE_MX: list[tuple[int, str]] = [
    (1, "aspmx.l.google.com"),
    (5, "alt1.aspmx.l.google.com"),
    (5, "alt2.aspmx.l.google.com"),
    (10, "alt3.aspmx.l.google.com"),
    (10, "alt4.aspmx.l.google.com"),
]


def _req(method: str, path: str, token: str, body: dict | None = None) -> dict:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "DualisAPIv2-GWDnsBridge/1",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {"raw": raw}
        return {"success": False, "errors": parsed, "http": e.code}


def zone_id(token: str, name: str) -> str | None:
    q = urllib.parse.urlencode({"name": name})
    out = _req("GET", f"/zones?{q}", token)
    if not out.get("success"):
        return None
    res = out.get("result") or []
    return res[0]["id"] if res else None


def list_dns(token: str, zid: str, record_type: str | None = None) -> list[dict]:
    path = f"/zones/{zid}/dns_records"
    if record_type:
        path += "?" + urllib.parse.urlencode({"type": record_type})
    out = _req("GET", path, token)
    if not out.get("success"):
        return []
    return list(out.get("result") or [])


def upsert_record(
    token: str,
    zid: str,
    *,
    type_: str,
    name: str,
    content: str,
    priority: int | None = None,
    proxied: bool | None = False,
) -> dict:
    """Create or update matching type+name (+priority for MX)."""
    existing = list_dns(token, zid, type_)
    match = None
    for rec in existing:
        if rec.get("name") == name or rec.get("name", "").startswith(name.rstrip(".")):
            # CF returns FQDN in name
            if type_ == "MX" and priority is not None:
                if int(rec.get("priority") or -1) == priority and rec.get("content") == content:
                    return {"ok": True, "action": "unchanged", "id": rec.get("id")}
                if int(rec.get("priority") or -1) == priority:
                    match = rec
                    break
            elif type_ != "MX":
                match = rec
                break

    body: dict[str, Any] = {"type": type_, "name": name, "content": content, "ttl": 1}
    if priority is not None:
        body["priority"] = priority
    if proxied is not None and type_ in {"A", "AAAA", "CNAME"}:
        body["proxied"] = proxied

    if match:
        rid = match["id"]
        out = _req("PUT", f"/zones/{zid}/dns_records/{rid}", token, body)
        return {"ok": bool(out.get("success")), "action": "update", "detail": out}
    out = _req("POST", f"/zones/{zid}/dns_records", token, body)
    return {"ok": bool(out.get("success")), "action": "create", "detail": out}


def apply_workspace_mx(token: str, domain: str = "dualiscapax.ai", replace_existing_mx: bool = False) -> dict:
    """
    Publish Google Workspace MX set.
    WARNING: replace_existing_mx=True deletes other MX (breaks pure CF Email Routing receive).
    Prefer coordinated cutover: Workspace as primary receive OR keep Routing until cutover planned.
    """
    zid = zone_id(token, domain)
    if not zid:
        return {"ok": False, "error": "zone_not_found", "domain": domain}

    results = []
    if replace_existing_mx:
        for rec in list_dns(token, zid, "MX"):
            rid = rec["id"]
            # only remove if not already a google mx we want
            content = (rec.get("content") or "").lower()
            if "google.com" not in content:
                out = _req("DELETE", f"/zones/{zid}/dns_records/{rid}", token)
                results.append({"delete_mx": rec.get("content"), "ok": bool(out.get("success"))})

    for pri, host in GOOGLE_MX:
        # name @ domain root
        r = upsert_record(token, zid, type_="MX", name=domain, content=host, priority=pri)
        results.append({"mx": host, "priority": pri, **r})

    return {"ok": all(x.get("ok") for x in results if "error" not in x), "domain": domain, "results": results}


def apply_spf_google(
    token: str,
    domain: str = "dualiscapax.ai",
    include_cloudflare_routing: bool = True,
) -> dict:
    """
    TXT SPF including Google; optionally keep CF Routing include for hybrid receive.
    """
    zid = zone_id(token, domain)
    if not zid:
        return {"ok": False, "error": "zone_not_found", "domain": domain}

    parts = ["v=spf1", "include:_spf.google.com"]
    if include_cloudflare_routing:
        parts.append("include:_spf.mx.cloudflare.net")
    parts.append("~all")
    spf = " ".join(parts)

    # Upsert root TXT that looks like SPF (replace existing SPF-shaped TXT)
    existing = list_dns(token, zid, "TXT")
    spf_rec = None
    for rec in existing:
        c = (rec.get("content") or "").strip('"')
        if c.startswith("v=spf1"):
            spf_rec = rec
            break

    body = {"type": "TXT", "name": domain, "content": spf, "ttl": 1}
    if spf_rec:
        out = _req("PUT", f"/zones/{zid}/dns_records/{spf_rec['id']}", token, body)
        action = "update"
    else:
        out = _req("POST", f"/zones/{zid}/dns_records", token, body)
        action = "create"

    return {"ok": bool(out.get("success")), "action": action, "spf": spf, "detail": out if not out.get("success") else {}}


def apply_domain_verification_txt(token: str, domain: str, verification_txt: str) -> dict:
    """Google Admin domain verification TXT (value from Workspace setup UI)."""
    zid = zone_id(token, domain)
    if not zid:
        return {"ok": False, "error": "zone_not_found"}
    content = verification_txt.strip().strip('"')
    return upsert_record(token, zid, type_="TXT", name=domain, content=content)


def apply_dkim_cname(
    token: str,
    domain: str,
    selector: str,
    cname_target: str,
) -> dict:
    """
    DKIM: Google Admin shows selector + target host.
    Typically: google._domainkey → google._domainkey.<domain>.gappssmtp.com (or similar).
    """
    zid = zone_id(token, domain)
    if not zid:
        return {"ok": False, "error": "zone_not_found"}
    name = f"{selector}._domainkey.{domain}"
    target = cname_target.strip().rstrip(".")
    return upsert_record(token, zid, type_="CNAME", name=name, content=target, proxied=False)


def workspace_dns_bundle(
    token: str,
    domain: str = "dualiscapax.ai",
    *,
    verification_txt: str | None = None,
    dkim_selector: str | None = None,
    dkim_target: str | None = None,
    apply_mx: bool = False,
    replace_mx: bool = False,
    spf: bool = True,
    spf_keep_cf: bool = True,
) -> dict:
    """
    Ordered bundle for MAIL_UNITY path.
    Default: SPF only (safe). MX opt-in (cutover). Verification/DKIM when Owner pastes values.
    """
    if not token:
        return {"ok": False, "error": "CF_API_TOKEN required", "dual_tos": True}

    out: dict[str, Any] = {"domain": domain, "steps": []}

    if verification_txt:
        out["steps"].append({"verification": apply_domain_verification_txt(token, domain, verification_txt)})

    if spf:
        out["steps"].append({"spf": apply_spf_google(token, domain, include_cloudflare_routing=spf_keep_cf)})

    if apply_mx:
        out["steps"].append({"mx": apply_workspace_mx(token, domain, replace_existing_mx=replace_mx)})

    if dkim_selector and dkim_target:
        out["steps"].append(
            {"dkim": apply_dkim_cname(token, domain, dkim_selector, dkim_target)}
        )
    elif dkim_selector or dkim_target:
        out["steps"].append({"dkim": {"ok": False, "error": "need both dkim_selector and dkim_target"}})

    ok = True
    for step in out["steps"]:
        for v in step.values():
            if isinstance(v, dict) and v.get("ok") is False:
                ok = False
    out["ok"] = ok
    out["next_owner"] = [
        "Confirm Workspace Admin domain verified",
        "Create users/aliases admin@ and ceo@",
        "Enable DKIM in Admin and pass selector/target if not applied",
        "Send-as if needed",
        "External inbox test",
        "MAIL_UNITY_CLOSE DONE",
    ]
    out["dual_tos"] = True
    return out
