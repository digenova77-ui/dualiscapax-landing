#!/usr/bin/env python3
"""Post-deploy check for a pulled alias: PASS = 0 term hits in the response body (any HTTP status).
Why not 404: unknown paths on the site return 200 with the HTML fallback, so a pulled alias also returns 200.
No term lives in this repo: terms come from a local file outside the repo (one per line, never committed),
or from the env var ALIAS_TERMS (comma-separated). The alias URL is passed as an argument.
Output: HTTP status, body sha256[:8], hit count per term as sha256[:8] of the casefolded term. Never prints a term.
Usage: python3 scripts/alias-body-check.py URL [--terms-file PATH]     exit 0 = PASS, 1 = hits, 2 = usage/fetch error"""
import hashlib, html, os, re, sys, unicodedata, urllib.parse, urllib.request
def main():
    a = sys.argv[1:]
    if not a: print(__doc__); return 2
    url = a[0]; terms = []
    if "--terms-file" in a: terms = [l.strip() for l in open(a[a.index("--terms-file") + 1], encoding="utf-8") if l.strip()]
    terms += [t.strip() for t in os.environ.get("ALIAS_TERMS", "").split(",") if t.strip()]
    if not terms: print("no terms given (use --terms-file or ALIAS_TERMS)"); return 2
    req = urllib.request.Request(url, headers={"User-Agent": "alias-body-check/1"})
    try:
        r = urllib.request.urlopen(req, timeout=20); code, body = r.status, r.read()
    except urllib.error.HTTPError as e: code, body = e.code, e.read()
    except Exception as e: print("fetch error:", type(e).__name__); return 2
    t = body.decode("utf-8", "replace")
    forms = [t, urllib.parse.unquote(t), html.unescape(t),
             unicodedata.normalize("NFKC", t).translate(dict.fromkeys(map(ord, "\u200b\u200c\u200d\u2060\ufeff\u00ad"))),
             re.sub(r"\s+", " ", re.sub(r"<[^>]*>", "", t))]
    total = 0
    for term in terms:
        rx = re.compile(r"(?<![a-z0-9])" + re.escape(term.casefold()) + r"(?![a-z0-9])")
        n = max(len(rx.findall(f.casefold())) for f in forms); total += n
        print("term %s: %d" % (hashlib.sha256(term.casefold().encode()).hexdigest()[:8], n))
    print("HTTP %d body %s bytes %d -> %s" % (code, hashlib.sha256(body).hexdigest()[:8], len(body), "PASS (0 term hits)" if total == 0 else "FAIL (%d term hits)" % total))
    return 0 if total == 0 else 1
if __name__ == "__main__": sys.exit(main())
