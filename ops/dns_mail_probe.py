#!/usr/bin/env python3
"""Dualis mail DNS probe — engineer measure without organ credentials."""
from __future__ import annotations

import json
import urllib.parse
import urllib.request

DOMAIN = "dualiscapax.ai"
SELECTORS = ["google", "default", "selector1", "selector2", "s1", "s2"]


def doh(name: str, typ: str = "TXT") -> list[str]:
    url = (
        "https://cloudflare-dns.com/dns-query?name="
        + urllib.parse.quote(name)
        + "&type="
        + typ
    )
    req = urllib.request.Request(url, headers={"Accept": "application/dns-json", "User-Agent": "DualisProbe/1"})
    with urllib.request.urlopen(req, timeout=12) as r:
        data = json.loads(r.read().decode())
    return [a.get("data", "") for a in (data.get("Answer") or [])]


def probe(domain: str = DOMAIN) -> dict:
    spf = doh(domain, "TXT")
    dmarc = doh(f"_dmarc.{domain}", "TXT")
    mx = doh(domain, "MX")
    dkim = {}
    for s in SELECTORS:
        recs = doh(f"{s}._domainkey.{domain}", "CNAME") + doh(f"{s}._domainkey.{domain}", "TXT")
        recs = [x for x in recs if x]
        if recs:
            dkim[s] = recs
    spf_j = " ".join(spf).lower()
    dmarc_j = " ".join(dmarc).lower()
    return {
        "domain": domain,
        "spf": spf,
        "spf_google": "_spf.google.com" in spf_j,
        "dmarc": dmarc,
        "dmarc_reject": "p=reject" in dmarc_j,
        "rua": "rua=" in dmarc_j,
        "mx": mx,
        "dkim": dkim,
        "f1_dns_ready": bool(dkim) and "_spf.google.com" in spf_j,
        "atom": "CLOSE-F1-MAIL-ATOM.md" if not dkim else "external_auth_test_then_MAIL_UNITY_CLOSE_DONE",
    }


if __name__ == "__main__":
    print(json.dumps(probe(), indent=2))
