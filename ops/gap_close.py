#!/usr/bin/env python3
"""
Dualis gap closure engineer
===========================
Measures F1 (mail DNS atom) and F2 (domain redirect heuristics).
When F1 DNS is ready, prints the exact Owner residual left (external test + DONE).
Does not circumvent dual-TOS; cannot create Workspace or CF rules without token.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


def doh(name: str, typ: str = "TXT") -> list[str]:
    url = (
        "https://cloudflare-dns.com/dns-query?name="
        + urllib.parse.quote(name)
        + "&type="
        + typ
    )
    req = urllib.request.Request(
        url, headers={"Accept": "application/dns-json", "User-Agent": "DualisGapClose/1"}
    )
    with urllib.request.urlopen(req, timeout=12) as r:
        data = json.loads(r.read().decode())
    return [a.get("data", "") for a in (data.get("Answer") or [])]


def probe_f1(domain: str = "dualiscapax.ai") -> dict[str, Any]:
    selectors = ["google", "default", "selector1", "selector2", "s1", "s2"]
    dkim: dict[str, list[str]] = {}
    for s in selectors:
        recs = doh(f"{s}._domainkey.{domain}", "CNAME") + doh(
            f"{s}._domainkey.{domain}", "TXT"
        )
        recs = [x for x in recs if x]
        if recs:
            dkim[s] = recs
    spf = " ".join(doh(domain, "TXT"))
    dmarc = " ".join(doh(f"_dmarc.{domain}", "TXT"))
    mx = doh(domain, "MX")
    google_spf = "_spf.google.com" in spf.lower()
    dns_ready = bool(dkim) and google_spf
    return {
        "id": "F1",
        "dkim": dkim,
        "spf": spf,
        "google_spf": google_spf,
        "dmarc": dmarc,
        "mx": mx,
        "dns_atom_ready": dns_ready,
        "closed": False,  # needs external auth + MAIL_UNITY_CLOSE DONE
        "next": (
            [
                "External send test: dkim=pass d=dualiscapax.ai",
                "Chat: MAIL_UNITY_CLOSE DONE",
            ]
            if dns_ready
            else [
                "Workspace Admin → generate DKIM → publish selector DNS",
                "SPF: include:_spf.google.com (merge one TXT)",
                "See ops/CLOSE-F1-MAIL-ATOM.md",
                "Optional: CF_API_TOKEN + google_workspace_dns.workspace_dns_bundle",
            ]
        ),
    }


def probe_f2() -> dict[str, Any]:
    """Heuristic: .com should not look like a permanent Squarespace park if redirected."""
    results = {}
    for host in ["dualiscapax.com", "ratio-dualis.com"]:
        try:
            req = urllib.request.Request(
                f"https://{host}/",
                method="GET",
                headers={"User-Agent": "DualisGapClose/1"},
            )
            with urllib.request.urlopen(req, timeout=12) as r:
                final = r.geturl()
                body = r.read(800).decode("utf-8", "replace").lower()
                results[host] = {
                    "final_url": final,
                    "to_ai": "dualiscapax.ai" in final,
                    "coming_soon": "coming soon" in body,
                }
        except Exception as e:
            results[host] = {"error": str(e), "to_ai": False}
    closed = all(v.get("to_ai") for v in results.values())
    return {
        "id": "F2",
        "hosts": results,
        "closed": closed,
        "next": []
        if closed
        else [
            "CF Redirect Rules 301 → https://dualiscapax.ai/$1",
            "Or CF_API_TOKEN + bridges.cloudflare.redirect_dualis_set",
            "Chat: G2 DONE",
        ],
    }


def gap_report() -> dict[str, Any]:
    f1 = probe_f1()
    f2 = probe_f2()
    return {
        "ok": True,
        "F1": f1,
        "F2": f2,
        "apiv2_level_ready": f1["dns_atom_ready"] and f2["closed"],
        "note": "dns_atom_ready is necessary not sufficient for F1; need live DKIM pass + DONE",
        "agent_plane": "forward",
    }


if __name__ == "__main__":
    print(json.dumps(gap_report(), indent=2))
