#!/usr/bin/env python3
"""Post-deploy check for a pulled alias: count term hits in the response body, after removing the echoed request path.
Unknown paths on the site may return 200 with an HTML fallback, and the host may echo the requested path into every
page, so neither 404 nor a raw body search is a valid test. No term lives in this repo: terms come from a local file
outside the repo (one per line, never committed) or from the env var ALIAS_TERMS (comma-separated).
Output: status chain, final status, body sha256[:8], echoed-path strips, hit count per term as sha256[:8] of the
casefolded term. Never prints a term or a URL (the alias URL itself may carry a term; only its sha256[:8] is shown).
Decision:
  exit 2 INCONCLUSIVE: fetch error, final status 5xx/403/429 or any status other than 2xx/404/410, empty or
         whitespace-only body, or a 404/410/other-2xx page with 0 hits (only a 200 can PASS)
  exit 1 FAIL: 2xx/404/410 with a non-empty body and >= 1 term hit after stripping the echoed path
  exit 0 PASS: final status 200, non-empty body, 0 term hits after stripping the echoed path
Forms: the body and every decoded form are chained (percent incl. '+', HTML entities, JS \\u/\\u{..}/\\x, base64 runs,
NFKC with zero-width/soft-hyphen removed, tags removed / replaced by a space / inline tags removed and block tags spaced), up to depth 4, and the echoed path is
stripped again at every stage. A term hit = the max count over all forms.
Usage: python3 scripts/alias-body-check.py URL [--terms-file PATH]
       /usr/bin/python3.13 -I -B scripts/alias-body-check.py --selftest     (offline, 127.0.0.1 fixtures only; T16)"""
import base64, hashlib, html, os, re, sys, unicodedata, urllib.error, urllib.parse, urllib.request

PASS, FAIL, INCONCLUSIVE = 0, 1, 2
DECISIVE = lambda c: 200 <= c < 300 or c in (404, 410)
ZW = dict.fromkeys(map(ord, "\u200b\u200c\u200d\u2060\ufeff\u00ad\u180e"), None)
JS = re.compile(r"\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})")
B64 = re.compile(r"[A-Za-z0-9+/_-]{8,}={0,2}")
MAX_DEPTH, MAX_FORMS = 4, 400
INLINE = re.compile(r"</?(?:a|abbr|b|bdi|bdo|cite|code|em|font|i|kbd|mark|q|s|samp|small|span|strong|sub|sup|u|var|wbr)\b[^>]*>", re.I)

def h8(b): return hashlib.sha256(b if isinstance(b, bytes) else b.encode("utf-8", "surrogatepass")).hexdigest()[:8]
def th8(term): return h8(term.casefold())

def _chr(n):
    try: return chr(n)
    except (ValueError, OverflowError): return "\ufffd"
def js_unescape(s): return JS.sub(lambda m: _chr(int(m.group(1) or m.group(2) or m.group(3), 16)), s)
def b64_frags(s):
    out = []
    for m in B64.finditer(s):
        tok = m.group(0).rstrip("=").replace("-", "+").replace("_", "/")
        if len(tok) % 4 == 1: continue
        try: d = base64.b64decode(tok + "=" * (-len(tok) % 4), validate=True).decode("utf-8")
        except Exception: continue
        if d and sum(c.isprintable() or c.isspace() for c in d) >= 0.9 * len(d): out.append(d)
    return " ".join(out)
DECODERS = (
    lambda s: urllib.parse.unquote_plus(s),
    html.unescape,
    js_unescape,
    b64_frags,
    lambda s: unicodedata.normalize("NFKC", s).translate(ZW),
    lambda s: re.sub(r"<[^>]*>", "", s),
    lambda s: re.sub(r"<[^>]*>", " ", INLINE.sub("", s)),
    lambda s: re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", s)),
)

def echo_needles(urls):
    """Every form in which a host may echo the requested URL/path: raw, percent-decoded, re-encoded, HTML-escaped, JSON-escaped."""
    base = set()
    for u in urls:
        sp = urllib.parse.urlsplit(u)
        pq = sp.path + ("?" + sp.query if sp.query else "")
        base |= {u, urllib.parse.urlunsplit((sp.scheme, sp.netloc, sp.path, sp.query, "")), pq, sp.path}
    enc = set()
    for b in base:
        d = urllib.parse.unquote_plus(b)
        for v in (b, urllib.parse.unquote(b), d, urllib.parse.quote(d, safe="/?=&:"), urllib.parse.quote(d, safe="/"),
                  urllib.parse.quote(d, safe=""), urllib.parse.quote_plus(d, safe="/")):
            enc |= {v, v.lower()}
    out = set()
    for v in enc:
        for w in (v, html.escape(v), html.escape(v, quote=False), v.replace("&", "&#38;"), v.replace("/", "\\/"),
                  html.escape(v).replace("/", "&#x2F;"), html.escape(v).replace("/", "&#47;")):
            if len(w) >= 4 and w.strip("/") : out.add(w)
    return sorted(out, key=lambda w: (-len(w), w))

def make_stripper(needles):
    if not needles: return lambda s: (s, 0)
    alts = []
    for w in needles:
        p = re.escape(w)
        if w[0].isalnum(): p = r"(?<![A-Za-z0-9])" + p
        if w[-1].isalnum(): p = p + r"(?![A-Za-z0-9])"
        alts.append(p)
    rx = re.compile("|".join(alts), re.I)
    return lambda s: rx.subn(" ", s)

def term_rx(term):
    return re.compile(r"(?<![a-z0-9])" + r"\s+".join(map(re.escape, term.casefold().split())) + r"(?![a-z0-9])")

def count_hits(text, terms, urls):
    strip = make_stripper(echo_needles(urls))
    first, reflected = strip(text)
    seen = {first}; frontier = [first]; forms = [first]
    for _ in range(MAX_DEPTH):
        nxt = []
        for f in frontier:
            for dec in DECODERS:
                try: g = dec(f)
                except Exception: continue
                g, _n = strip(g)
                if g not in seen and len(forms) < MAX_FORMS:
                    seen.add(g); forms.append(g); nxt.append(g)
        frontier = nxt
        if not frontier: break
    folded = [f.casefold() for f in forms]
    counts = [(th8(t), max(len(term_rx(t).findall(f)) for f in folded)) for t in terms]
    return counts, reflected, len(forms)

class _Chain(urllib.request.HTTPRedirectHandler):
    def __init__(self): self.codes = []
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.codes.append(code); return super().redirect_request(req, fp, code, msg, headers, newurl)

def fetch(url, timeout=20):
    ch = _Chain(); op = urllib.request.build_opener(ch)
    req = urllib.request.Request(url, headers={"User-Agent": "alias-body-check/2"})
    try:
        r = op.open(req, timeout=timeout); return r.status, r.read(), r.geturl(), ch.codes, None
    except urllib.error.HTTPError as e:
        try: body = e.read()
        except Exception: body = b""
        return e.code, body, e.geturl() or url, ch.codes, None
    except Exception as e:
        return None, b"", url, ch.codes, type(e).__name__

def check(url, terms, out=print):
    code, body, final, chain, err = fetch(url)
    out("url %s final %s chain: %s" % (h8(url), h8(final), " -> ".join(map(str, chain + [code if code is not None else "ERR"]))))
    if err:
        out("RESULT: INCONCLUSIVE (fetch error: %s)" % err); return INCONCLUSIVE
    text = body.decode("utf-8", "replace")
    counts, reflected, nforms = count_hits(text, terms, [url, final]) if text.strip() else ([(th8(t), 0) for t in terms], 0, 0)
    total = sum(n for _, n in counts)
    out("HTTP %d body %s bytes %d echoed-path strips %d forms %d" % (code, h8(body), len(body), reflected, nforms))
    for t, n in counts: out("term %s: %d" % (t, n))
    if code >= 500 or code in (403, 429) or not DECISIVE(code):
        out("RESULT: INCONCLUSIVE (HTTP %d)" % code); return INCONCLUSIVE
    if not text.strip():
        out("RESULT: INCONCLUSIVE (empty body)"); return INCONCLUSIVE
    if total:
        out("RESULT: FAIL (%d term hits)" % total); return FAIL
    if code != 200:
        out("RESULT: INCONCLUSIVE (HTTP %d with 0 hits; only 200 can PASS)" % code); return INCONCLUSIVE
    out("RESULT: PASS (0 term hits)"); return PASS

# ---------------- offline selftest (127.0.0.1 only; placeholder term; T16) ----------------
T16_EXE = "/usr/bin/python3.13"
PH = "TEACHERNAME"  # placeholder only; no real term is ever used here
def _page(inner): return ("<!doctype html><html><head><title>desk</title></head><body>%s</body></html>" % inner).encode()
def _echo(path):
    return ('<link rel="canonical" href="https://apex.invalid%s"><meta name="p" content="%s"><title>%s</title>'
            '<script>var p="%s";</script><a href="%s">here</a>'
            % (path, urllib.parse.quote(urllib.parse.unquote(path), safe=""), html.escape(path), path.replace("/", "\\/"),
               html.escape(urllib.parse.quote(urllib.parse.unquote(path), safe="/?=&"))))
ECHO_PATH = "/rte/%s/?from=a&who=%s" % (PH, PH)
def _route(path):
    clean = _page("<h1>Grade 2 desk</h1><p>nothing personal here</p>")
    hit = _page("<p>Welcome, %s.</p>" % PH)
    r = {
        "/clean": (200, clean, {}),
        "/hit": (200, hit, {}),
        "/e403": (403, _page("<h1>Forbidden</h1><p>challenge</p>"), {}),
        "/e429": (429, _page("<h1>Too Many Requests</h1>"), {}),
        "/e503": (503, _page("<h1>Service Unavailable</h1>"), {}),
        "/e500": (500, _page("<h1>Internal Server Error</h1>"), {}),
        "/empty": (200, b"", {}),
        "/blank": (200, b" \r\n\t ", {}),
        "/e503hit": (503, hit, {}),
        "/e404": (404, _page("<h1>Not found</h1>"), {}),
        "/e404hit": (404, hit, {}),
        "/redir": (302, b"", {"Location": "/clean"}),
        "/b64pct": (200, _page('<div data-x="%s"></div>' % base64.b64encode(urllib.parse.quote("hi " + PH).encode()).decode()), {}),
        "/pctent": (200, _page("<a href=\"/x?n=%s\">x</a>" % urllib.parse.quote("".join("&#%d;" % ord(c) for c in PH))), {}),
        "/jsu": (200, _page("<script>var n='%s';</script>" % "".join("\\u%04x" % ord(c) for c in PH)), {}),
        "/split": (200, _page("<p>%s<b></b>%s</p>" % (PH[:5], PH[5:])), {}),
    }
    if path in r: return r[path]
    if path.startswith("/rte/"):
        extra = "<p>Hello %s</p>" % PH if "plushit" in path else ""
        return (200, _page("<h1>World</h1>" + _echo(path) + extra), {})
    return (404, _page("no fixture"), {})
CASES = [  # (name, path, expected exit)
    ("200-clean", "/clean", PASS), ("200-with-hit", "/hit", FAIL), ("200-echoed-path-only", ECHO_PATH, PASS),
    ("403", "/e403", INCONCLUSIVE), ("429", "/e429", INCONCLUSIVE), ("503", "/e503", INCONCLUSIVE),
    ("500", "/e500", INCONCLUSIVE), ("empty", "/empty", INCONCLUSIVE),
    ("200-whitespace-only", "/blank", INCONCLUSIVE), ("503-with-hit", "/e503hit", INCONCLUSIVE),
    ("404-clean", "/e404", INCONCLUSIVE), ("404-with-hit", "/e404hit", FAIL), ("302-to-200-clean", "/redir", PASS),
    ("200-echoed-path-plus-hit", "/rte/%s/plushit/" % PH, FAIL), ("200-base64-of-urlencoded-hit", "/b64pct", FAIL),
    ("200-entities-inside-percent-hit", "/pctent", FAIL), ("200-js-unicode-escape-hit", "/jsu", FAIL),
    ("200-split-across-tag-hit", "/split", FAIL),
]
def selftest():
    import socket, subprocess, threading
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    exe = os.path.realpath(sys.executable)
    if exe != T16_EXE or not sys.flags.isolated or not sys.flags.dont_write_bytecode:
        print("T16 refuse: selftest needs %s -I -B (got %s, -I=%d, -B=%d)" % (T16_EXE, exe, sys.flags.isolated, sys.flags.dont_write_bytecode))
        return INCONCLUSIVE
    class H(BaseHTTPRequestHandler):
        def do_GET(self):
            code, body, hdr = _route(urllib.parse.urlsplit(self.path).path if not self.path.startswith("/rte/") else self.path)
            self.send_response(code)
            for k, v in hdr.items(): self.send_header(k, v)
            self.send_header("Content-Type", "text/html; charset=utf-8"); self.send_header("Content-Length", str(len(body)))
            self.end_headers(); self.wfile.write(body)
        def log_message(self, *a): pass
    srv = ThreadingHTTPServer(("127.0.0.1", 0), H); port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    s = socket.socket(); s.bind(("127.0.0.1", 0)); dead = s.getsockname()[1]; s.close()
    cases = CASES + [("fetch-error-closed-port", None, INCONCLUSIVE)]
    env = {"ALIAS_TERMS": PH, "PATH": "/usr/bin:/bin", "LC_ALL": "C.UTF-8"}
    me = os.path.realpath(__file__); ok = bad = 0; tally = {PASS: 0, FAIL: 0, INCONCLUSIVE: 0}
    print("selftest: interpreter %s (T16 ok), placeholder term %s, server 127.0.0.1:<ephemeral>" % (T16_EXE, th8(PH)))
    for name, path, want in cases:
        url = "http://127.0.0.1:%d%s" % (port, path) if path is not None else "http://127.0.0.1:%d/clean" % dead
        p = subprocess.run([T16_EXE, "-I", "-B", me, url], env=env, capture_output=True, text=True, timeout=60)
        got = p.returncode; res = [l for l in p.stdout.splitlines() if l.startswith("RESULT:")]
        refl = [l.split("strips ")[1].split()[0] for l in p.stdout.splitlines() if "echoed-path strips" in l]
        good = got == want and len(res) == 1 and not p.stderr.strip()
        ok += good; bad += not good; tally[got] = tally.get(got, 0) + 1
        print("case %-34s want %d got %d strips %-3s %s | %s" % (name, want, got, refl[0] if refl else "-", "OK" if good else "BAD", res[0] if res else p.stderr.strip()[:120]))
    # usage errors must be exit 2, never 0/1
    for name, argv in (("usage-no-args", []), ("usage-terms-file-missing-arg", ["http://127.0.0.1:%d/clean" % port, "--terms-file"]),
                       ("usage-no-terms", ["http://127.0.0.1:%d/clean" % port])):
        e = {k: v for k, v in env.items() if k != "ALIAS_TERMS"}
        p = subprocess.run([T16_EXE, "-I", "-B", me] + argv, env=e, capture_output=True, text=True, timeout=60)
        good = p.returncode == INCONCLUSIVE and not p.stderr.strip(); ok += good; bad += not good
        print("case %-34s want 2 got %d %s" % (name, p.returncode, "OK" if good else "BAD"))
    srv.shutdown()
    print("selftest: %d cases, %d ok, %d bad; results pass=%d fail=%d inconclusive=%d (fetch cases)" % (ok + bad, ok, bad, tally[PASS], tally[FAIL], tally[INCONCLUSIVE]))
    return PASS if bad == 0 else FAIL

def main():
    a = sys.argv[1:]
    if a == ["--selftest"]: return selftest()
    if not a or a[0].startswith("-"): print(__doc__); return INCONCLUSIVE
    url, terms = a[0], []
    if "--terms-file" in a:
        i = a.index("--terms-file")
        if i + 1 >= len(a): print("usage: --terms-file needs a PATH"); return INCONCLUSIVE
        try: terms = [l.strip() for l in open(a[i + 1], encoding="utf-8") if l.strip()]
        except OSError as e: print("terms file unreadable:", type(e).__name__); return INCONCLUSIVE
    terms += [t.strip() for t in os.environ.get("ALIAS_TERMS", "").split(",") if t.strip()]
    if not terms: print("no terms given (use --terms-file or ALIAS_TERMS)"); return INCONCLUSIVE
    return check(url, terms)
if __name__ == "__main__": sys.exit(main())
