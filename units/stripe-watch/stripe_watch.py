#!/usr/bin/env python3
from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

GATES = [
    ("pay", "https://dualiscapax.ai/pay"),
    ("hooks", "https://dualiscapax.ai/hooks"),
    ("pay_intent", "https://dualiscapax.ai/pay/intent"),
    ("fulfill", "https://dualiscapax-stripe-fulfill-v2.digenova77.workers.dev"),
]
BUTTONS = [
    "buy_btn_1UIqFBRWhnZWxw8ZZgWGE4qD",
    "buy_btn_1UIqFrRWhnZWxw8ZCYVaZGlX",
    "buy_btn_1UIqGZRWhnZWxw8ZQQ9Tt18K",
    "buy_btn_1UIqHNRWhnZWxw8ZYSgpAZdf",
    "buy_btn_1UIqHfRWhnZWxw8ZkjUYscmQ",
    "buy_btn_1UIqI1RWhnZWxw8Z345BcxZK",
    "buy_btn_1UIqIHRWhnZWxw8ZOR5p5Uxd",
    "buy_btn_1UIqIWRWhnZWxw8ZasfOa2Lk",
]

def hit(url):
    try:
        req = Request(url, headers={"User-Agent": "dualis-stripe-watch"})
        with urlopen(req, timeout=8) as r:
            return {"status": r.status, "body": r.read(1200).decode("utf-8", "replace")}
    except Exception as e:
        return {"status": getattr(e, "code", 0) or 0, "error": str(e)[:200]}

def write(root=None):
    root = root or Path(".")
    gates = {name: hit(url) for name, url in GATES}
    fulfill = {}
    raw = gates["fulfill"].get("body") or ""
    if raw.startswith("{"):
        try:
            fulfill = json.loads(raw)
        except json.JSONDecodeError:
            fulfill = {}
    out = {
        "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "gates": {k: {"status": v.get("status"), "error": v.get("error")} for k, v in gates.items()},
        "fulfill": {
            "checkout_open": fulfill.get("checkout_open"),
            "has_webhook_secret": fulfill.get("has_webhook_secret"),
            "has_kv": fulfill.get("has_kv"),
            "has_d1": fulfill.get("has_d1"),
            "stripe_process_state": fulfill.get("stripe_process_state"),
        },
        "buttons": BUTTONS,
        "law": "Public pulse only. Events live in Stripe Developers.",
    }
    dest = root / "research" / "stripe"
    dest.mkdir(parents=True, exist_ok=True)
    path = dest / "WATCH.json"
    path.write_text(json.dumps(out, indent=2) + "\n")
    return path

if __name__ == "__main__":
    print(write())
