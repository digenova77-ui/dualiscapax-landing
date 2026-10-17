#!/usr/bin/env python3
"""Refresh a source-linked NASA image discovery index; never downloads image binaries.

The output is a discovery queue, not a rights determination. Before copying any
asset into this repository, check its item-level credits and usage restrictions.
"""
from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "discoveries.json"
API = "https://images-api.nasa.gov/search"
QUERIES = [
    "Earth seismology",
    "Earth magnetosphere",
    "solar wind Earth",
    "South Pole seismometer",
    "Earth atmosphere satellite",
]
PER_QUERY = 8
USER_AGENT = "DualisCapax-EarthPhotoArchive/1.0 (source-linked research index)"


def get_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=25) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> None:
    existing = {}
    if OUTPUT.exists():
        try:
            old = json.loads(OUTPUT.read_text(encoding="utf-8"))
            existing = {
                item.get("nasa_id"): item
                for item in old.get("items", [])
                if item.get("nasa_id")
            }
        except (OSError, json.JSONDecodeError):
            existing = {}

    discovered = dict(existing)
    for query in QUERIES:
        params = urllib.parse.urlencode({
            "q": query,
            "media_type": "image",
            "page_size": PER_QUERY,
        })
        payload = get_json(f"{API}?{params}")
        for item in payload.get("collection", {}).get("items", []):
            data = (item.get("data") or [{}])[0]
            nasa_id = data.get("nasa_id")
            links = item.get("links") or []
            preview = next(
                (link.get("href") for link in links
                 if link.get("render") == "image" and link.get("href")),
                None,
            )
            if not nasa_id or not preview:
                continue
            record = {
                "nasa_id": nasa_id,
                "title": data.get("title", "Untitled NASA media item"),
                "date_created": data.get("date_created"),
                "description": (data.get("description") or "")[:1200],
                "photographer": data.get("photographer"),
                "center": data.get("center"),
                "keywords": data.get("keywords") or [],
                "query_matches": [],
                "preview_url": preview,
                "source_url": "https://images.nasa.gov/details/" + urllib.parse.quote(nasa_id),
                "status": "discovered-needs-rights-review",
            }
            previous = discovered.get(nasa_id)
            if previous:
                record["query_matches"] = previous.get("query_matches", [])
                record["status"] = previous.get("status", record["status"])
            if query not in record["query_matches"]:
                record["query_matches"].append(query)
            discovered[nasa_id] = record
        time.sleep(0.25)

    output = {
        "schema": "dualis.earth-photo-discovery.v1",
        "updated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "policy": {
            "purpose": "Discover relevant source-linked imagery for human review.",
            "binary_downloads": False,
            "rights_review_required_before_mirroring": True,
            "discovery_is_not_endorsement": True,
        },
        "queries": QUERIES,
        "items": sorted(
            discovered.values(),
            key=lambda item: (item.get("date_created") or "", item.get("nasa_id") or ""),
            reverse=True,
        ),
    }
    OUTPUT.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Indexed {len(output['items'])} unique NASA image candidates.")


if __name__ == "__main__":
    main()
