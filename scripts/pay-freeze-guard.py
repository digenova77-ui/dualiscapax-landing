#!/usr/bin/env python3
"""Payments-freeze guard (2026-10-02).

The Pages build publishes the repo root (wrangler.toml: pages_build_output_dir = "."),
so every file in this tree is a public plate. While payments are closed, fail if the
tree carries a Stripe Payment Link / Checkout URL, a wallet address, or an open
payment flag. Exit 1 on any hit. Usage: python3 scripts/pay-freeze-guard.py [root]
"""
import os, re, sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
SKIP_DIRS = {".git", "node_modules"}
SKIP_FILES = {os.path.normpath("scripts/pay-freeze-guard.py")}
TEXT_EXT = {".html", ".htm", ".js", ".mjs", ".cjs", ".json", ".jsonl", ".md", ".txt",
            ".css", ".xml", ".svg", ".toml", ".yml", ".yaml", ".csv", ".ts", ".py", ""}
# Token contracts and the zero address are not pay-to addresses.
EVM_ALLOW = {
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",  # USDC (Ethereum) token contract
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",  # USDC (Base) token contract
    "0x0000000000000000000000000000000000000000",
}
PATTERNS = [
    ("stripe_payment_link", re.compile(r"buy\.stripe\.com/(?:test_)?[A-Za-z0-9]{10,}")),
    ("stripe_checkout", re.compile(r"checkout\.stripe\.com/")),
    ("stripe_js", re.compile(r"js\.stripe\.com")),
    ("evm_address", re.compile(r"(?<![0-9a-fA-F])0x[0-9a-fA-F]{40}(?![0-9a-fA-F])")),
    ("btc_bech32", re.compile(r"\bbc1[02-9ac-hj-np-z]{25,62}\b")),
    ("wallet_uri", re.compile(r"\b(?:bitcoin|ethereum|solana|dogecoin|ripple|litecoin|bitcoincash):[A-Za-z0-9]{25,}")),
]
CONFIG_PATTERNS = [
    ("open_flag", re.compile(r"\b(?:stripe_enabled|crypto_enabled|checkout_open|jacket_open)\s*:\s*true\b")),
    ("config_address", re.compile(r"\b(?:research|ai)_[a-z]+\s*:\s*\"[^\"]{20,}\"")),
]

hits = []
for dp, dns, fns in os.walk(ROOT):
    dns[:] = [d for d in dns if d not in SKIP_DIRS]
    for fn in fns:
        p = os.path.join(dp, fn)
        rel = os.path.normpath(os.path.relpath(p, ROOT))
        if rel in SKIP_FILES or os.path.splitext(fn)[1].lower() not in TEXT_EXT:
            continue
        try:
            if os.path.getsize(p) > 20_000_000:
                continue
            with open(p, encoding="utf-8", errors="ignore") as fh:
                lines = fh.read().split("\n")
        except OSError:
            continue
        pats = PATTERNS + (CONFIG_PATTERNS if fn == "payments-config.js" else [])
        for i, line in enumerate(lines, 1):
            for name, rx in pats:
                for m in rx.finditer(line):
                    if name == "evm_address" and m.group(0).lower() in EVM_ALLOW:
                        continue
                    hits.append((rel, i, name, m.group(0)[:12] + "…"))

for rel, i, name, frag in hits:
    print(f"FREEZE-HIT {name} {rel}:{i} {frag}")
print(f"pay-freeze-guard: {len(hits)} hit(s)")
sys.exit(1 if hits else 0)
