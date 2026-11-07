#!/usr/bin/env python3
"""Read-only public DNS and HTTPS audit for dualiscapax.ai. Never edits DNS."""
from __future__ import annotations
import json
import ssl
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent / "public-dns-audit.json"
DNS_API = "https://dns.google/resolve"
QUERIES = [
    ("dualiscapax.ai", "A"), ("dualiscapax.ai", "AAAA"),
    ("dualiscapax.ai", "CNAME"), ("dualiscapax.ai", "NS"),
    ("dualiscapax.ai", "TXT"), ("dualiscapax.ai", "MX"),
    ("_dnslink.dualiscapax.ai", "TXT"),
    ("www.dualiscapax.ai", "A"), ("www.dualiscapax.ai", "AAAA"),
    ("www.dualiscapax.ai", "CNAME"),
]
URLS = [
    "https://dualiscapax.ai/",
    "https://www.dualiscapax.ai/",
    "https://dualiscapax.ai/iris/status",
    "https://dualiscapax.ai/holographic-core/v2",
]
UA = "DualisCapax-Public-DNS-Audit/1.0"


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/dns-json"})
    with urllib.request.urlopen(req, timeout=15) as res:
        return json.loads(res.read().decode("utf-8"))


def dns_record(name: str, rtype: str) -> dict:
    url = DNS_API + "?" + urllib.parse.urlencode({"name": name, "type": rtype})
    try:
        data = fetch_json(url)
        return {
            "name": name, "type": rtype, "status": data.get("Status"),
            "authenticated_data": data.get("AD", False),
            "answers": [{"name": a.get("name"), "type": a.get("type"),
                         "ttl": a.get("TTL"), "data": a.get("data")}
                        for a in data.get("Answer", [])],
            "authority": [{"name": a.get("name"), "type": a.get("type"),
                           "ttl": a.get("TTL"), "data": a.get("data")}
                          for a in data.get("Authority", [])],
        }
    except Exception as exc:
        return {"name": name, "type": rtype, "error": type(exc).__name__ + ": " + str(exc)}


def http_check(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=20, context=ssl.create_default_context()) as res:
            return {
                "url": url, "status": res.status, "final_url": res.geturl(),
                "content_type": res.headers.get("Content-Type"),
                "server": res.headers.get("Server"),
                "x_dc_iris": res.headers.get("x-dc-iris"),
            }
    except urllib.error.HTTPError as exc:
        return {"url": url, "status": exc.code, "error": "HTTPError"}
    except Exception as exc:
        return {"url": url, "error": type(exc).__name__ + ": " + str(exc)}


def main() -> None:
    report = {
        "schema": "dualis.public-dns-audit.v1",
        "checked_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "scope": "Public DNS-over-HTTPS and public HTTPS GET checks only",
        "mutations_performed": False,
        "records": [dns_record(*q) for q in QUERIES],
        "https": [http_check(url) for url in URLS],
        "interpretation": [
            "A public resolver view is not the same as Cloudflare dashboard zone state.",
            "DNSLink TXT records may intentionally be absent if the site is served by Pages.",
            "No DNS, Pages, Worker, database, or server configuration is changed by this audit.",
        ],
    }
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote read-only public DNS audit: {OUT}; {len(report['records'])} DNS queries, {len(report['https'])} HTTPS checks.")


if __name__ == "__main__":
    main()
