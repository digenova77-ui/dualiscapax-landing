#!/usr/bin/env python3
"""Payments-freeze + retired-terms guard (2026-10-02).

The Pages build publishes the repo root (wrangler.toml: pages_build_output_dir = "."),
so every file in this tree is a public plate. Fail (exit 1) if the tree carries:

  * a Stripe Payment Link / Checkout URL / Stripe.js, or an open payment flag
    (Stripe is retired; checkout is closed);
  * a wallet address (EVM, bech32 BTC/DGB/LTC, CashAddr, wallet URI, truncated 0x…,
    or any retired research/donation address, matched by sha256 fingerprint so the
    addresses themselves are not republished here). Addresses are allowed ONLY in a
    donate-only file (DONATE_ONLY below), and no pay/checkout/fuel/payments/rails/
    operations page may reference that file;
  * a pay-to offer for another wallet or chain (a named third-party wallet, MetaMask pay-to,
    "send crypto", "gift/pay/send ... BTC/ETH/SOL/DOGE/XRP/ZEC/DOT/DGB/BCH",
    equal-CAD chain lists, "<chain> receive string", "<chain> vault"). Unity ID is the
    only wallet; payments stay closed until the owner opens them;
  * a retired-structure term (owner rule 2026-10-02). The word list is held only as
    sha256 below, so this public file does not repeat the retired names;
  * under cf-pages/**: an external checkout / processor link; and anywhere (cf-pages/**
    and its root twins): a price-tagged portal (a <section>/<article>/<div> block whose
    aria-label or heading/text names a portal and that carries a non-zero CAD/USD price),
    e.g. the old holographic-core v2 / rte "Private portal" ($49 / $120).

Usage: python3 scripts/pay-freeze-guard.py [root]
"""
import hashlib, os, re, sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
SKIP_DIRS = {".git", "node_modules"}
SKIP_FILES = {os.path.normpath("scripts/pay-freeze-guard.py")}
TEXT_EXT = {".html", ".htm", ".js", ".mjs", ".cjs", ".json", ".jsonl", ".md", ".txt",
            ".css", ".xml", ".svg", ".toml", ".yml", ".yaml", ".csv", ".ts", ".py", "",
            ".bak", ".sh", ".sql", ".sol", ".c", ".cs", ".webmanifest"}
# Future donate-only address file(s). Addresses may live here and nowhere else.
DONATE_ONLY = {os.path.normpath(p) for p in (
    "js/donate-only-addresses.js",
    "cf-pages/js/donate-only-addresses.js",
)}
PAY_PAGE = re.compile(r"(?i)(pay|checkout|fuel|payments?|rails?|operations?)")
# Token contracts and the zero address are not pay-to addresses.
EVM_ALLOW = {
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",  # USDC (Ethereum) token contract
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",  # USDC (Base) token contract
    "0x0000000000000000000000000000000000000000",
}
# sha256 of retired research/donation addresses (EVM lower-cased). Not the addresses.
RETIRED_ADDR_SHA256 = {
    "9aab19e039822b7328b6d01c4471fbebc287769d2b762d4a78efc0c680459e5a",
    "7e9894d6766fdc6ce2177cb70f6ad171d644e254f0df9f3f364bb0d01f37ad93",
    "f6beb3513ac7fa17213a6f71911b3c470311510257df407dd0db134509bcabcc",
    "260a61ed139828f17381339696638036c7efec7de4b737f90ade907e2bdf772a",
    "088a302dca9b29d95a8378ffb6e52897429a8986122933f864aaec4cbd4019ea",
    "ee852d44498bd2f11fc3663839acabe3819b2291513a4204e14905e9db5205b1",
    "32a62104be6ef7c312ee643dcdb8a616a30eebd6462c62808ad4a023e6f2b577",
    "925eed3b242e193190fb638781f01db8b37e0e74ad894c523c220a30ce679ba3",
    "f36e6e053868586307338d17f0d229b996ea9aead31b9108ba10f7a6829215db",
}
ADDRESS_PATTERNS = [
    ("evm_address", re.compile(r"(?<![0-9a-fA-F])0x[0-9a-fA-F]{40}(?![0-9a-fA-F])")),
    ("evm_truncated", re.compile(r"(?<![#0-9a-fA-F])0x[0-9a-fA-F]{4,}(?:\.{2,3}|…)[0-9a-fA-F]{4,}")),
    ("btc_bech32", re.compile(r"\bbc1[02-9ac-hj-np-z]{25,62}\b")),
    ("dgb_ltc_bech32", re.compile(r"\b(?:dgb1|ltc1)[02-9ac-hj-np-z]{25,62}\b")),
    ("cashaddr", re.compile(r"\b(?:bitcoincash:)?[qp][02-9ac-hj-np-z]{41}\b")),
    ("wallet_uri", re.compile(r"\b(?:bitcoin|ethereum|solana|dogecoin|ripple|litecoin|bitcoincash|zcash|polkadot|digibyte):[A-Za-z0-9]{25,}")),
]
TOKEN = re.compile(r"[A-Za-z0-9]{25,64}")
CHAIN = (r"(?:\b(?:BTC|ETH|SOL|DOGE|XRP|ZEC|DOT|DGB|BCH|LTC)\b|"
         r"(?i:\b(?:bitcoin(?:\s+cash)?|ethereum|ether|solana|dogecoin|doge|ripple|zcash|polkadot|digibyte|litecoin)\b))")
PAYWORD = r"(?i:\b(?:gift|pay|pays|paying|send|sends|deposit|donate|donation|tip)\b)"
PATTERNS = [
    ("stripe_payment_link", re.compile(r"buy\.stripe\.com/(?:test_)?[A-Za-z0-9]{10,}")),
    ("stripe_checkout", re.compile(r"checkout\.stripe\.com/")),
    ("stripe_js", re.compile(r"js\.stripe\.com")),
    ("send_crypto", re.compile(r"(?i)(?<!not )(?<!never )\bsend\s+(?:your\s+)?crypto\b")),
    ("metamask_payto", re.compile(r"(?i)(?:\b(?:pay|send|gift|deposit|donat\w*|checkout)\b[^.\n<]{0,60}metamask|metamask[^.\n<]{0,60}\b(?:pay|send|gift|deposit|donat\w*|checkout)\b)")),
    ("chain_payto", re.compile(PAYWORD + r"[^.\n<\"']{0,40}" + CHAIN)),
    ("chain_equal_cad", re.compile(r"(?i:equal-?(?:cad|crypto))[^.\n<\"']{0,40}" + CHAIN)),
    ("chain_receive", re.compile(CHAIN + r"\s+(?i:receive\s+string|vault)\b")),
]
CF_PAGES_PATTERNS = [
    ("checkout_link", re.compile(r"(?i)href\s*=\s*[\"']?https?://[^\"'\s>]*(?:checkout|buy\.stripe\.com|/pay(?:[/?#]|\b)|/buy(?:[/?#]|\b)|paypal\.|square\.link|squareup\.com|commerce\.coinbase|nowpayments|bitpay|moonpay|banxa|gumroad|lemonsqueezy|paddle\.com)")),
]
PORTAL_BLOCK = re.compile(r"(?is)<(section|article|div)\b[^>]*>.*?</\1>")
PORTAL_WORD = re.compile(r"(?i)aria-label\s*=\s*[\"'][^\"']*\bportal\b|<(?:h[1-6]|p|strong|span|div|legend|caption)\b[^>]*>[^<]*\bportal\b")
NONZERO_PRICE = re.compile(r"(?i)(?:\b(?:CAD|USD|C)\s*\$|\$)\s*(?:0*[1-9][0-9,]*(?:\.[0-9]+)?|0\.[0-9]*[1-9])")
# Retired names, as sha256 of lower-case tokens (see docstring). Whole words, 5-letter
# prefixes, 8-letter suffixes, and two-word phrases are checked.
RETIRED_WORD_SHA256 = {
    "898fa2c627354c20bf3c7a81460fc5be1ec10a085ce90ca61077782c8e908be9",
    "c32f5de8269a9aced9a2a66afe8d228052211b0008b80b6993811ce29496bc91",
    "51e2a46721d104d9148d85b617833e7745fdbd6795cb0b502a5b6ea31d33378e",
    "badc194db2c72e19accb589d987a3a2b588fb87a723194ef6b6ec610b1aaafb9",
    "a792968b61657232818d4932db54d12d1fb1c6469c98a319dff3b1d1b172ea3d",
    "cd8f2ab8fa14d87a8c85ef0540b33857104f38cc123b512487771d0ca0e0093e",
}
RETIRED_PREFIX5_SHA256 = {
    "fb6132a111c52ee36109a731ee1f56c36a79ce553f8c6cc301f692b4ef9dcf94",
}
RETIRED_SUFFIX8_SHA256 = {
    "a792968b61657232818d4932db54d12d1fb1c6469c98a319dff3b1d1b172ea3d",
}
RETIRED_BIGRAM_SHA256 = {
    "20ca673a8cd2287f753202f3dd65f97d59c43e6c785a08abb08f437da7a48147",
    "44cf710a1e8fdd24625e10b1f96466cfca6dc4d26124fc2c060d00968931995b",
    "fe4a6d9671eb47ce90c619ba58416760c26661651ff4564472375d9c84508dd1",
}
WORD = re.compile(r"[a-z]+")


def _sha(t):
    return hashlib.sha256(t.encode()).hexdigest()


def retired_terms(line):
    ws = WORD.findall(line.lower())
    out = []
    for k, w in enumerate(ws):
        if (_sha(w) in RETIRED_WORD_SHA256 or _sha(w[:11]) in RETIRED_WORD_SHA256
                or _sha(w[:5]) in RETIRED_PREFIX5_SHA256
                or (len(w) >= 8 and _sha(w[-8:]) in RETIRED_SUFFIX8_SHA256)):
            out.append(w)
        if k + 1 < len(ws) and _sha(w + " " + ws[k + 1]) in RETIRED_BIGRAM_SHA256:
            out.append(w + " " + ws[k + 1])
    return out


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
        donate_only = rel in DONATE_ONLY
        in_cf_pages = rel.split(os.sep)[0] == "cf-pages"
        pats = PATTERNS + (CONFIG_PATTERNS if fn == "payments-config.js" else []) \
            + (CF_PAGES_PATTERNS if in_cf_pages else [])
        if os.path.splitext(fn)[1].lower() in {".html", ".htm", ".bak"}:  # portal check: whole tree (cf-pages/** + root twins)
            text = "\n".join(lines)
            for m in PORTAL_BLOCK.finditer(text):
                blk = m.group(0)
                if PORTAL_WORD.search(blk) and NONZERO_PRICE.search(blk):
                    i = text.count("\n", 0, m.start()) + 1
                    hits.append((rel, i, "price_tagged_portal", NONZERO_PRICE.search(blk).group(0)[:12] + "…"))
        for i, line in enumerate(lines, 1):
            for name, rx in pats:
                for m in rx.finditer(line):
                    hits.append((rel, i, name, m.group(0)[:12] + "…"))
            for w in retired_terms(line):
                hits.append((rel, i, "retired_term", w[:3] + "…"))
            if PAY_PAGE.search(fn) and "donate-only-addresses" in line:
                hits.append((rel, i, "pay_page_loads_donate_file", "donate-only…"))
            if donate_only:
                continue
            for name, rx in ADDRESS_PATTERNS:
                for m in rx.finditer(line):
                    if name == "evm_address" and m.group(0).lower() in EVM_ALLOW:
                        continue
                    hits.append((rel, i, name, m.group(0)[:8] + "…"))
            for m in TOKEN.finditer(line):
                t = m.group(0)
                if (hashlib.sha256(t.encode()).hexdigest() in RETIRED_ADDR_SHA256 or
                        hashlib.sha256(("0x" + t[2:]).lower().encode()).hexdigest() in RETIRED_ADDR_SHA256):
                    hits.append((rel, i, "retired_address", t[:6] + "…"))

for rel, i, name, frag in hits:
    print(f"FREEZE-HIT {name} {rel}:{i} {frag}")
print(f"pay-freeze-guard: {len(hits)} hit(s)")
sys.exit(1 if hits else 0)
