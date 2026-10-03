#!/usr/bin/env python3
"""Post-deploy check for a pulled alias: count term hits in the response body, after discounting only what the host
echoes. Unknown paths on the site may return 200 with an HTML fallback, and the host may echo the requested path into
every page, so neither 404 nor a raw body search is a valid test. No term lives in this repo: terms come from a local
file outside the repo (one per line, never committed) or from the env var ALIAS_TERMS (comma-separated).
Echo discount (r4, same-run control): when a term occurs in the requested URL, the same run fetches one control URL of
the same shape (each term replaced by a random token of the same length and character class; logged as sha256[:8]
only). Each occurrence of the control token in the control body is keyed by its masked left/right context; an
occurrence of the term in the alias body is discounted only if a control echo has the same context (each control echo
used once). Anything else, e.g. "/<term>" in a link, image path, profile URL, JSON "\\/<term>" or "2/<term>", counts.
The control must be a 200 with the same redirect chain and mapped final URL, a non-empty decodable body, and every
control echo must have its partner in the alias body; otherwise the result is INCONCLUSIVE.
Output: status chain, final status, body sha256[:8], echo-matched count, hit count per term as sha256[:8] of the
casefolded term. Never prints a term, a control token or a URL (only sha256[:8]).
Decision:
  exit 2 INCONCLUSIVE: fetch error; final status 5xx/403/429 or any status other than 2xx/404/410; unsupported or
         broken Content-Encoding; body empty after NFKC and zero-width/BOM removal; body with NUL or >1% U+FFFD after
         decoding; a 404/410/other-2xx page with 0 hits (only a 200 can PASS); control not comparable (see above)
  exit 1 FAIL: 2xx/404/410 with a non-empty body and >= 1 term hit after the control-mapped echo discount
  exit 0 PASS: final status 200, non-empty body, 0 term hits after the control-mapped echo discount
Body decoding: Content-Encoding gzip/x-gzip/deflate via stdlib (no external program), charset incl. UTF-16, BOM.
Forms: the body and every decoded form are chained (percent incl. '+', HTML entities, JS \\u/\\u{..}/\\x, base64 runs
at 4 alignments decoded as UTF-8, else UTF-16LE/BE/latin-1, NFKC with zero-width/soft-hyphen removed, tags removed /
replaced by a space / comments+inline tags removed and block tags spaced / every tag and comment replaced by a
separator that a split term may span), up to depth 4. A term hit = the max count over all forms.
Usage: python3 scripts/alias-body-check.py URL [--terms-file PATH]
       /usr/bin/python3.13 -I -B scripts/alias-body-check.py --selftest     (offline, 127.0.0.1 fixtures only; T16)
       /usr/bin/python3.13 -I -B scripts/alias-body-check.py --gate-check   (interpreter gate only)
Interpreter gate (selftest and gate-check): realpath(sys.executable) and os.readlink('/proc/self/exe') must both be
/usr/bin/python3.13, -I and -B must be set, and sha256(/proc/self/exe) must equal the pin from
receipts/PYTHON_SHIM_CHECK_2026-10-03.md. Child processes: absolute interpreter path, pin re-checked before each
spawn, fixed environment PATH=/usr/bin:/bin and LC_ALL=C.UTF-8 only."""
import base64, codecs, gzip, hashlib, html, os, re, secrets, string, sys, unicodedata, zlib
import urllib.error, urllib.parse, urllib.request

PASS, FAIL, INCONCLUSIVE = 0, 1, 2
DECISIVE = lambda c: 200 <= c < 300 or c in (404, 410)
ZW = dict.fromkeys(map(ord, "\u200b\u200c\u200d\u2060\ufeff\u00ad\u180e"), None)
JS = re.compile(r"\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})")
B64 = re.compile(r"[A-Za-z0-9+/_-]{8,}={0,2}")
MAX_DEPTH, MAX_FORMS = 4, 400
INLINE = re.compile(r"</?(?:a|abbr|b|bdi|bdo|cite|code|em|font|i|kbd|mark|q|s|samp|small|span|strong|sub|sup|u|var|wbr)\b[^>]*>", re.I)
COMMENT = re.compile(r"<!--.*?-->", re.S)
TAGMARK = re.compile(r"<!--.*?-->|<[^>]*>", re.S)
SEP = "\x01"          # stands for a removed tag/comment; a split term may span it, and it is a word boundary
CTX = 16              # chars of masked context on each side of an echo occurrence
T16_EXE = "/usr/bin/python3.13"
T16_SHA = "889c603f0d17cb54060951bcf4c4f9b8c9ebd9e52b392c70209bbb9755d797d9"  # receipts/PYTHON_SHIM_CHECK_2026-10-03.md
CHILD_ENV = {"PATH": "/usr/bin:/bin", "LC_ALL": "C.UTF-8"}

def h8(b): return hashlib.sha256(b if isinstance(b, bytes) else b.encode("utf-8", "surrogatepass")).hexdigest()[:8]
def th8(term): return h8(term.casefold())

# ---------------- decoders ----------------
def _chr(n):
    try: return chr(n)
    except (ValueError, OverflowError): return "\ufffd"
def js_unescape(s): return JS.sub(lambda m: _chr(int(m.group(1) or m.group(2) or m.group(3), 16)), s)
def _printable(t): return bool(t) and "\x00" not in t and sum(c.isprintable() or c.isspace() for c in t) >= 0.9 * len(t)
def _b64_texts(b):
    try:
        t = b.decode("utf-8")
        if _printable(t): return [t]
    except UnicodeDecodeError: pass
    out = []
    for enc in ("utf-16-le", "utf-16-be", "latin-1"):
        if enc.startswith("utf-16") and len(b) % 2: continue
        try: t = b.decode(enc)
        except UnicodeDecodeError: continue
        if _printable(t): out.append(t)
    return out
def b64_frags(s):
    out = []
    for m in B64.finditer(s):
        run = m.group(0).rstrip("=").replace("-", "+").replace("_", "/")
        for off in range(4):                       # misaligned / glued-to-a-prefix runs
            tok = run[off:]
            if len(tok) % 4 == 1: tok = tok[:-1]
            if len(tok) < 8: continue
            try: b = base64.b64decode(tok + "=" * (-len(tok) % 4), validate=True)
            except Exception: continue
            for t in _b64_texts(b):
                if t not in out: out.append(t)
    return " ".join(out)
DECODERS = (
    lambda s: urllib.parse.unquote_plus(s),
    html.unescape,
    js_unescape,
    b64_frags,
    lambda s: unicodedata.normalize("NFKC", s).translate(ZW),
    lambda s: re.sub(r"<[^>]*>", "", s),
    lambda s: re.sub(r"<[^>]*>", " ", INLINE.sub("", COMMENT.sub("", s))),
    lambda s: re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", s)),
    lambda s: TAGMARK.sub(SEP, s),
)

def term_rx(term):
    words = term.casefold().split()
    pat = ("[\\s" + SEP + "]+").join((SEP + "*").join(map(re.escape, w)) for w in words)
    return re.compile(r"(?<![a-z0-9])" + pat + r"(?![a-z0-9])")

def forms_of(text):
    seen = {text}; frontier = [text]; forms = [text]
    for _ in range(MAX_DEPTH):
        nxt = []
        for f in frontier:
            for dec in DECODERS:
                try: g = dec(f)
                except Exception: continue
                if g not in seen and len(forms) < MAX_FORMS:
                    seen.add(g); forms.append(g); nxt.append(g)
        frontier = nxt
        if not frontier: break
    return forms

def count_hits(text, terms):
    forms = forms_of(text); folded = [f.casefold() for f in forms]
    return [(th8(t), max(len(term_rx(t).findall(f)) for f in folded)) for t in terms], len(forms)

# ---------------- body decoding ----------------
def decode_body(raw, hdr):
    ce = (hdr.get("Content-Encoding") or "").strip().lower()
    if ce in ("gzip", "x-gzip"): raw = gzip.decompress(raw)
    elif ce == "deflate":
        try: raw = zlib.decompress(raw)
        except zlib.error: raw = zlib.decompress(raw, -zlib.MAX_WBITS)
    elif ce not in ("", "identity"): raise ValueError("unsupported content-encoding")
    m = re.search(r"charset\s*=\s*[\"']?([A-Za-z0-9_.:-]+)", hdr.get("Content-Type") or "", re.I)
    cs = m.group(1).lower() if m else None
    if cs:
        try: codecs.lookup(cs)
        except LookupError: cs = None
    if raw.startswith(codecs.BOM_UTF8): return raw[3:].decode("utf-8", "replace")
    if raw[:2] in (codecs.BOM_UTF16_LE, codecs.BOM_UTF16_BE): return raw.decode("utf-16", "replace")
    return raw.decode(cs or "utf-8", "replace")

def body_state(text):
    if not unicodedata.normalize("NFKC", text).translate(ZW).strip(): return "empty body"
    if "\x00" in text or text.count("\ufffd") > 0.01 * len(text): return "undecodable body (NUL or >1% U+FFFD)"
    return None

# ---------------- fetch ----------------
class _Chain(urllib.request.HTTPRedirectHandler):
    def __init__(self): self.codes = []
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.codes.append(code); return super().redirect_request(req, fp, code, msg, headers, newurl)

def fetch(url, timeout=20):
    ch = _Chain(); op = urllib.request.build_opener(ch)
    req = urllib.request.Request(url, headers={"User-Agent": "alias-body-check/4"})
    try:
        r = op.open(req, timeout=timeout); return r.status, r.read(), r.geturl(), ch.codes, None, r.headers
    except urllib.error.HTTPError as e:
        try: body = e.read()
        except Exception: body = b""
        return e.code, body, e.geturl() or url, ch.codes, None, e.headers
    except Exception as e:
        return None, b"", url, ch.codes, type(e).__name__, {}

# ---------------- same-run control (Iris r3 must-fix option a) ----------------
def _sub_rx(term): return re.compile(r"(?<![A-Za-z0-9])" + r"\s+".join(map(re.escape, term.split())) + r"(?![A-Za-z0-9])", re.I)
def term_in_url(term, url):
    sp = urllib.parse.urlsplit(url)
    return bool(_sub_rx(term).search(urllib.parse.unquote_plus(sp.path + "?" + sp.query)))
def ctl_token(term, terms):
    for _ in range(64):
        t = "".join(secrets.choice(string.ascii_uppercase) if c.isupper() else secrets.choice(string.ascii_lowercase) if c.isalpha()
                    else secrets.choice(string.digits) if c.isdigit() else c for c in term)
        if all(x.casefold() not in t.casefold() for x in terms): return t
    raise RuntimeError("no control token")
def control_url(url, toks):
    sp = urllib.parse.urlsplit(url); path = urllib.parse.unquote(sp.path); query = sp.query
    for term, tok in toks.items():
        path = _sub_rx(term).sub(tok, path); query = _sub_rx(term).sub(tok, query)
    return urllib.parse.urlunsplit((sp.scheme, sp.netloc, urllib.parse.quote(path, safe="/:@!$&'()*+,;=-._~"), query, ""))
def map_echo(atext, ctext, toks):
    """Discount alias occurrences of each URL term whose masked context equals a control-token echo context."""
    lits = sorted(set(toks) | set(toks.values()), key=lambda w: (-len(w), w.casefold()))
    mrx = re.compile("|".join(re.escape(w) for w in lits), re.I)
    amask = mrx.sub(lambda m: "\x02" * len(m.group(0)), atext); cmask = mrx.sub(lambda m: "\x02" * len(m.group(0)), ctext)
    ctx = lambda masked, p, n: (masked[max(0, p - CTX):p], masked[p + n:p + n + CTX])
    def score(a, c):  # shared left suffix + shared right prefix; graded pass needs >= CTX//2 per side and >= CTX+CTX//2 total
        l = next((i for i in range(min(len(a[0]), len(c[0]))) if a[0][-1 - i] != c[0][-1 - i]), min(len(a[0]), len(c[0])))
        r = next((i for i in range(min(len(a[1]), len(c[1]))) if a[1][i] != c[1][i]), min(len(a[1]), len(c[1])))
        return l + r if min(l, r) >= CTX // 2 and l + r >= CTX + CTX // 2 else -1
    repl = []; matched = total = missing = 0
    for term, tok in toks.items():
        slots = [ctx(cmask, m.start(), len(tok)) for m in re.finditer(re.escape(tok), ctext, re.I)]
        total += len(slots); used = [False] * len(slots)
        occ = [(m.start(), m.end(), ctx(amask, m.start(), len(term))) for m in re.finditer(re.escape(term), atext, re.I)]
        done = [False] * len(occ)
        for i, (s, e, k) in enumerate(occ):          # pass 1: exact context
            j = next((j for j, c in enumerate(slots) if not used[j] and c == k), None)
            if j is not None: used[j] = done[i] = True; matched += 1; repl.append((s, e, tok))
        for i, (s, e, k) in enumerate(occ):          # pass 2: graded context, remaining control echoes only
            if done[i]: continue
            best = max(((score(k, c), -j) for j, c in enumerate(slots) if not used[j]), default=(-1, 0))
            if best[0] >= 0: used[-best[1]] = done[i] = True; matched += 1; repl.append((s, e, tok))
        missing += used.count(False)
    out = atext
    for s, e, tok in sorted(repl, reverse=True): out = out[:s] + tok + out[e:]
    return out, matched, total, missing

def check(url, terms, out=print):
    code, raw, final, chain, err, hdr = fetch(url)
    out("url %s final %s chain: %s" % (h8(url), h8(final), " -> ".join(map(str, chain + [code if code is not None else "ERR"]))))
    if err:
        out("RESULT: INCONCLUSIVE (fetch error: %s)" % err); return INCONCLUSIVE
    try: text = decode_body(raw, hdr)
    except Exception as e:
        out("HTTP %d body %s bytes %d" % (code, h8(raw), len(raw)))
        out("RESULT: INCONCLUSIVE (body decode: %s)" % type(e).__name__); return INCONCLUSIVE
    out("HTTP %d body %s bytes %d chars %d" % (code, h8(raw), len(raw), len(text)))
    if code >= 500 or code in (403, 429) or not DECISIVE(code):
        out("RESULT: INCONCLUSIVE (HTTP %d)" % code); return INCONCLUSIVE
    st = body_state(text)
    if st:
        out("RESULT: INCONCLUSIVE (%s)" % st); return INCONCLUSIVE
    in_url = [t for t in terms if term_in_url(t, url) or term_in_url(t, final)]
    if in_url:
        toks = {t: ctl_token(t, terms) for t in in_url}
        cu = control_url(url, toks)
        if any(term_in_url(t, cu) for t in terms):
            out("RESULT: INCONCLUSIVE (control URL could not be built)"); return INCONCLUSIVE
        ccode, craw, cfinal, cchain, cerr, chdr = fetch(cu)
        out("control %s final %s chain: %s tokens %s" % (h8(cu), h8(cfinal), " -> ".join(map(str, cchain + [ccode if ccode is not None else "ERR"])),
                                                         ",".join(th8(v) for v in toks.values())))
        if cerr:
            out("RESULT: INCONCLUSIVE (control fetch error: %s)" % cerr); return INCONCLUSIVE
        if ccode != 200 or code != 200 or cchain != chain or control_url(final, toks) != cfinal:
            out("RESULT: INCONCLUSIVE (control not comparable: HTTP %d/%d, chain or final differs: %s)"
                % (code, ccode, "yes" if (cchain != chain or control_url(final, toks) != cfinal) else "no")); return INCONCLUSIVE
        try: ctext = decode_body(craw, chdr)
        except Exception as e:
            out("RESULT: INCONCLUSIVE (control body decode: %s)" % type(e).__name__); return INCONCLUSIVE
        cst = body_state(ctext)
        if cst:
            out("RESULT: INCONCLUSIVE (control %s)" % cst); return INCONCLUSIVE
        text, matched, ctotal, missing = map_echo(text, ctext, toks)
        out("echo-matched %d control-echoes %d" % (matched, ctotal))
        if missing:
            out("RESULT: INCONCLUSIVE (echo structure differs: %d control echoes without a partner)" % missing); return INCONCLUSIVE
    else:
        out("echo-matched 0 control none (no term in URL)")
    counts, nforms = count_hits(text, terms)
    total = sum(n for _, n in counts)
    out("forms %d" % nforms)
    for t, n in counts: out("term %s: %d" % (t, n))
    if total:
        out("RESULT: FAIL (%d term hits)" % total); return FAIL
    if code != 200:
        out("RESULT: INCONCLUSIVE (HTTP %d with 0 hits; only 200 can PASS)" % code); return INCONCLUSIVE
    out("RESULT: PASS (0 term hits)"); return PASS

# ---------------- interpreter gate (T16 + Twain2 F-1) ----------------
def _sha_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()
def gate():
    why = []
    if os.path.realpath(sys.executable) != T16_EXE: why.append("sys.executable")
    try: link = os.readlink("/proc/self/exe")
    except OSError: link = ""
    if link != T16_EXE: why.append("/proc/self/exe")
    if not sys.flags.isolated: why.append("-I")
    if not sys.flags.dont_write_bytecode: why.append("-B")
    try: sh = _sha_file("/proc/self/exe")
    except OSError: sh = ""
    if sh != T16_SHA: why.append("sha256")
    return why
def gate_line(why):
    return ("gate ok: realpath and /proc/self/exe = %s, -I -B, sha256 %s" % (T16_EXE, T16_SHA[:8]) if not why else
            "T16 refuse: needs %s -I -B with sha256 %s (failed: %s)" % (T16_EXE, T16_SHA[:8], ", ".join(why)))

# ---------------- offline selftest (127.0.0.1 only; synthetic placeholder terms; T16) ----------------
PH = "TEACHERNAME"  # r3 placeholder; no real term is ever used here
def _tok(label):    # synthetic root-alias placeholders, derived at runtime from a label hash (letters A-P)
    return "ZQ" + "".join(chr(65 + int(c, 16)) for c in hashlib.sha256(("r4-fixture-" + label).encode()).hexdigest()[:8])
NAV, IMG, PROF, JSN, SLASH, TITLE, ROOT, CBAD, CXE, CRD = map(_tok, ("nav", "img", "prof", "json", "slash", "title", "root", "cbad", "cxecho", "credir"))
KNOWN = {PH, NAV, IMG, PROF, JSN, SLASH, TITLE, ROOT, CBAD, CXE, CRD}
EXTRAS = {
    NAV: '<nav><a href="/%s">Teacher</a></nav>' % NAV,
    IMG: '<img src="/photos/%s.jpg" alt="">' % IMG,
    PROF: '<p><a href="https://social.invalid/%s">profile</a></p>' % PROF,
    JSN: '<script type="application/json">{"u":"https:\\/\\/x.invalid\\/%s"}</script>' % JSN,
    SLASH: "<p>Room 2/%s today</p>" % SLASH,
}
def _page(inner): return ("<!doctype html><html><head><title>desk</title></head><body>%s</body></html>" % inner).encode()
def _echo(path):
    return ('<link rel="canonical" href="https://apex.invalid%s"><meta name="p" content="%s"><title>%s</title>'
            '<script>var p="%s";</script><a href="%s">here</a>'
            % (path, urllib.parse.quote(urllib.parse.unquote(path), safe=""), html.escape(path), path.replace("/", "\\/"),
               html.escape(urllib.parse.quote(urllib.parse.unquote(path), safe="/?=&"))))
ECHO_PATH = "/rte/%s/?from=a&who=%s" % (PH, PH)
def _b64(b): return base64.b64encode(b).decode()
def _fixed():
    clean = _page("<h1>Grade 2 desk</h1><p>nothing personal here</p>")
    hit = _page("<p>Welcome, %s.</p>" % PH)
    u16 = ("<!doctype html><html><body><p>Welcome, %s.</p></body></html>" % PH).encode("utf-16")
    return {
        "/clean": (200, clean, {}), "/hit": (200, hit, {}),
        "/e403": (403, _page("<h1>Forbidden</h1><p>challenge</p>"), {}), "/e429": (429, _page("<h1>Too Many Requests</h1>"), {}),
        "/e503": (503, _page("<h1>Service Unavailable</h1>"), {}), "/e500": (500, _page("<h1>Internal Server Error</h1>"), {}),
        "/empty": (200, b"", {}), "/blank": (200, b" \r\n\t ", {}), "/e503hit": (503, hit, {}),
        "/e404": (404, _page("<h1>Not found</h1>"), {}), "/e404hit": (404, hit, {}),
        "/e410": (410, _page("<h1>Gone</h1>"), {}), "/e410hit": (410, hit, {}),
        "/redir": (302, b"", {"Location": "/clean"}),
        "/b64pct": (200, _page('<div data-x="%s"></div>' % _b64(urllib.parse.quote("hi " + PH).encode())), {}),
        "/pctent": (200, _page("<a href=\"/x?n=%s\">x</a>" % urllib.parse.quote("".join("&#%d;" % ord(c) for c in PH))), {}),
        "/jsu": (200, _page("<script>var n='%s';</script>" % "".join("\\u%04x" % ord(c) for c in PH)), {}),
        "/split": (200, _page("<p>%s<b></b>%s</p>" % (PH[:5], PH[5:])), {}),
        # r4 should-fix fixtures (Iris r3 section 3 / section 10)
        "/gz": (200, gzip.compress(hit, mtime=0), {"Content-Encoding": "gzip"}),
        "/u16": (200, u16, {"Content-Type": "text/html; charset=utf-16"}),
        "/bom": (200, codecs.BOM_UTF8, {}),
        "/zw": (200, "\u200b\u200c\u200d\u2060\ufeff\u00ad".encode(), {}),
        "/splitc": (200, _page("<p>room2</p>%s<!--c-->%s" % (PH[:5], PH[5:])), {}),
        "/splitb": (200, _page("<p>room2</p>%s<div></div>%s" % (PH[:5], PH[5:])), {}),
        "/b64mis": (200, _page('<div data-x="Q%s"></div>' % _b64(("hi " + PH).encode())), {}),
        "/b64lat": (200, _page('<div data-x="%s"></div>' % _b64(("hi " + PH + " caf\u00e9").encode("latin-1"))), {}),
        "/b64u16": (200, _page('<div data-x="%s"></div>' % _b64(("hi " + PH).encode("utf-16-le"))), {}),
        "/br": (200, b"\x1b\x00\x00\x00not-really-brotli", {"Content-Encoding": "br"}),
        "/nul": (200, b"<p>ok</p>\x00\x00\x00<p>more</p>", {}),
    }
def _site(raw_path, fixed):
    sp = urllib.parse.urlsplit(raw_path); path = sp.path
    if path in fixed: return fixed[path]
    q = dict(urllib.parse.parse_qsl(sp.query)); segs = [s for s in path.split("/") if s]
    ctl = "" if any(s in KNOWN for s in segs) else q.get("ctl", "")   # control-only behaviour (random token is never KNOWN)
    if ctl == "bad": return (503, _page("<h1>Service Unavailable</h1>"), {})
    if ctl == "redir": return (302, b"", {"Location": "/clean"})
    if q.get("r") == "1" and len(segs) == 1: return (302, b"", {"Location": "/home/" + segs[0]})
    if q.get("b") == "1" and segs:   # host that echoes only the bare segment, in <title>
        return (200, ("<!doctype html><html><head><title>%s</title></head><body><h1>apex</h1><p>nothing personal here</p></body></html>"
                      % html.escape(segs[-1])).encode(), {})
    extra = "".join(EXTRAS.get(s, "") for s in segs)
    if PH in segs and "plushit" in segs: extra += "<p>Hello %s</p>" % PH
    if ctl == "xecho" and segs: extra += "<h3>%s</h3>" % html.escape(segs[-1])
    return (200, _page("<h1>World</h1>" + _echo(raw_path) + extra), {})
CASES = [  # (name, path, expected exit, term)
    # r3 (22 with the 3 usage cases below)
    ("200-clean", "/clean", PASS, PH), ("200-with-hit", "/hit", FAIL, PH), ("200-echoed-path-only", ECHO_PATH, PASS, PH),
    ("403", "/e403", INCONCLUSIVE, PH), ("429", "/e429", INCONCLUSIVE, PH), ("503", "/e503", INCONCLUSIVE, PH),
    ("500", "/e500", INCONCLUSIVE, PH), ("empty", "/empty", INCONCLUSIVE, PH),
    ("200-whitespace-only", "/blank", INCONCLUSIVE, PH), ("503-with-hit", "/e503hit", INCONCLUSIVE, PH),
    ("404-clean", "/e404", INCONCLUSIVE, PH), ("404-with-hit", "/e404hit", FAIL, PH), ("302-to-200-clean", "/redir", PASS, PH),
    ("200-echoed-path-plus-hit", "/rte/%s/plushit/" % PH, FAIL, PH), ("200-base64-of-urlencoded-hit", "/b64pct", FAIL, PH),
    ("200-entities-inside-percent-hit", "/pctent", FAIL, PH), ("200-js-unicode-escape-hit", "/jsu", FAIL, PH),
    ("200-split-across-tag-hit", "/split", FAIL, PH),
    # r4 must-fix (Iris r3 section 9): root-level alias /<placeholder> on a page that also echoes it
    ("mf1-nav-href-echo-at-redirect-target", "/%s?r=1" % NAV, FAIL, NAV),
    ("mf2-img-src-photos-path", "/" + IMG, FAIL, IMG),
    ("mf3-other-host-profile-url", "/" + PROF, FAIL, PROF),
    ("mf4-json-escaped-outside-echo", "/" + JSN, FAIL, JSN),
    ("mf5-text-2-slash", "/" + SLASH, FAIL, SLASH),
    ("mf6-bare-segment-echo-in-title", "/%s?b=1" % TITLE, PASS, TITLE),
    ("mf7-root-alias-echo-only", "/" + ROOT, PASS, ROOT),
    ("mf8-control-503", "/%s?ctl=bad" % CBAD, INCONCLUSIVE, CBAD),
    ("mf9-control-extra-echo-no-partner", "/%s?ctl=xecho" % CXE, INCONCLUSIVE, CXE),
    ("mf10-control-redirect-differs", "/%s?ctl=redir" % CRD, INCONCLUSIVE, CRD),
    # r4 should-fix (Iris r3 section 3, 9 false PASSes, + section 10 guards)
    ("sf1-gzip-content-encoding-hit", "/gz", FAIL, PH), ("sf2-utf16-body-hit", "/u16", FAIL, PH),
    ("sf3-bom-only-body", "/bom", INCONCLUSIVE, PH), ("sf4-zero-width-only-body", "/zw", INCONCLUSIVE, PH),
    ("sf5-split-by-comment-text-abuts", "/splitc", FAIL, PH), ("sf6-split-by-block-tag-text-abuts", "/splitb", FAIL, PH),
    ("sf7-base64-misaligned-prefix", "/b64mis", FAIL, PH), ("sf8-base64-latin1-payload", "/b64lat", FAIL, PH),
    ("sf9-base64-utf16-payload", "/b64u16", FAIL, PH),
    ("sf10-unsupported-content-encoding", "/br", INCONCLUSIVE, PH), ("sf11-nul-in-decoded-body", "/nul", INCONCLUSIVE, PH),
    ("410-clean", "/e410", INCONCLUSIVE, PH), ("410-with-hit", "/e410hit", FAIL, PH),
]
def _spawn(argv, env=None, executable=None):
    import subprocess
    if _sha_file(T16_EXE) != T16_SHA: raise SystemExit("pinned interpreter sha256 changed; refusing to spawn")
    return subprocess.run(argv, env=dict(env if env is not None else CHILD_ENV), executable=executable,
                          capture_output=True, text=True, timeout=120)
def selftest():
    import shutil, socket, tempfile, threading
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    why = gate()
    if why: print(gate_line(why)); return INCONCLUSIVE
    fixed = _fixed()
    class H(BaseHTTPRequestHandler):
        def do_GET(self):
            code, body, hdr = _site(self.path, fixed)
            self.send_response(code)
            for k, v in hdr.items(): self.send_header(k, v)
            if "Content-Type" not in hdr: self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)
        def log_message(self, *a): pass
    srv = ThreadingHTTPServer(("127.0.0.1", 0), H); port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    s = socket.socket(); s.bind(("127.0.0.1", 0)); dead = s.getsockname()[1]; s.close()
    me = os.path.realpath(__file__); ok = bad = 0; tally = {PASS: 0, FAIL: 0, INCONCLUSIVE: 0}
    print(gate_line([]))
    print("selftest: child argv [%s, -I, -B, <this script>, <127.0.0.1 case URL>], env %s, server 127.0.0.1:<ephemeral>"
          % (T16_EXE, " ".join("%s=%s" % kv for kv in sorted(CHILD_ENV.items()))))
    print("selftest: placeholder terms (sha256[:8] of casefold): %s" % " ".join(sorted({th8(t) for _, _, _, t in CASES})))
    def run_case(name, url, want, term, env=None):
        nonlocal ok, bad
        e = dict(env if env is not None else CHILD_ENV); e["ALIAS_TERMS"] = term
        p = _spawn([T16_EXE, "-I", "-B", me, url], env=e)
        got = p.returncode; res = [l for l in p.stdout.splitlines() if l.startswith("RESULT:")]
        em = [l.split()[1] for l in p.stdout.splitlines() if l.startswith("echo-matched ")]
        good = got == want and len(res) == 1 and not p.stderr.strip()
        ok += good; bad += not good; tally[got] = tally.get(got, 0) + 1
        print("case %-38s want %d got %d echo %-3s %s | %s" % (name, want, got, em[0] if em else "-", "OK" if good else "BAD", res[0] if res else p.stderr.strip()[:120]))
    for name, path, want, term in CASES: run_case(name, "http://127.0.0.1:%d%s" % (port, path), want, term)
    run_case("fetch-error-closed-port", "http://127.0.0.1:%d/clean" % dead, INCONCLUSIVE, PH)
    # usage errors must be exit 2, never 0/1
    for name, argv in (("usage-no-args", []), ("usage-terms-file-missing-arg", ["http://127.0.0.1:%d/clean" % port, "--terms-file"]),
                       ("usage-no-terms", ["http://127.0.0.1:%d/clean" % port])):
        p = _spawn([T16_EXE, "-I", "-B", me] + argv)
        good = p.returncode == INCONCLUSIVE and not p.stderr.strip(); ok += good; bad += not good
        print("case %-38s want 2 got %d %s" % (name, p.returncode, "OK" if good else "BAD"))
    # interpreter gate: T16 (r3) + F-1 (copy with appended bytes, spoofed argv[0]) + V8 (fake same-name binaries first on PATH)
    tmp = tempfile.mkdtemp(prefix="abc-gate-")
    try:
        cp = os.path.join(tmp, "python3.13"); shutil.copyfile(T16_EXE, cp); os.chmod(cp, 0o700)
        cpa = os.path.join(tmp, "py-appended"); shutil.copyfile(T16_EXE, cpa)
        with open(cpa, "ab") as f: f.write(b"\x00r4-appended-bytes\x00")
        os.chmod(cpa, 0o700)
        fake = os.path.join(tmp, "fakebin"); os.mkdir(fake); marker = os.path.join(tmp, "fake-ran")
        for n in ("python3.13", "python3", "python", "gzip", "curl", "node", "sha256sum"):
            with open(os.path.join(fake, n), "w") as f: f.write("#!/bin/sh\necho fake > '%s'\nexit 0\n" % marker)
            os.chmod(os.path.join(fake, n), 0o700)
        hostile = {"PATH": fake + ":/usr/bin:/bin", "HOME": tmp, "LC_ALL": "C.UTF-8"}
        gcases = (
            ("t16-no-flags", [T16_EXE, me, "--selftest"], None, None, INCONCLUSIVE),
            ("t16-I-only", [T16_EXE, "-I", me, "--selftest"], None, None, INCONCLUSIVE),
            ("t16-B-only", [T16_EXE, "-B", me, "--selftest"], None, None, INCONCLUSIVE),
            ("t16-byte-copy-other-path", [cp, "-I", "-B", me, "--gate-check"], None, None, INCONCLUSIVE),
            ("f1-copy-appended-spoofed-argv0", [T16_EXE, "-I", "-B", me, "--gate-check"], None, cpa, INCONCLUSIVE),
            ("v8-fake-binaries-first-on-PATH-gate", [T16_EXE, "-I", "-B", me, "--gate-check"], hostile, None, PASS),
        )
        for name, argv, env, exe, want in gcases:
            if os.path.exists(marker): os.remove(marker)
            p = _spawn(argv, env=env, executable=exe)
            line = (p.stdout.strip().splitlines() or [""])[-1]
            refused = line.startswith("T16 refuse:"); okline = line.startswith("gate ok:")
            good = p.returncode == want and (refused if want == INCONCLUSIVE else okline) and not os.path.exists(marker)
            ok += good; bad += not good
            print("case %-38s want %d got %d %s | %s" % (name, want, p.returncode, "OK" if good else "BAD",
                                                         line.split(" (failed:")[0] if refused else line[:40]))
        if os.path.exists(marker): os.remove(marker)
        run_case("v8-fake-binaries-first-on-PATH-gzip", "http://127.0.0.1:%d/gz" % port, FAIL, PH, env=hostile)
        if os.path.exists(marker): bad += 1; print("case v8 marker: a fake binary ran BAD")
        old = os.environ.get("PATH"); os.environ["PATH"] = hostile["PATH"]
        try: run_case("v8-parent-PATH-hostile-child-env-fixed", "http://127.0.0.1:%d/hit" % port, FAIL, PH)
        finally:
            if old is None: os.environ.pop("PATH", None)
            else: os.environ["PATH"] = old
        if os.path.exists(marker): bad += 1; print("case v8 marker: a fake binary ran BAD")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    srv.shutdown()
    print("selftest: %d cases, %d ok, %d bad; results pass=%d fail=%d inconclusive=%d (fetch cases)" % (ok + bad, ok, bad, tally[PASS], tally[FAIL], tally[INCONCLUSIVE]))
    return PASS if bad == 0 else FAIL

def main():
    a = sys.argv[1:]
    if a == ["--selftest"]: return selftest()
    if a == ["--gate-check"]:
        why = gate(); print(gate_line(why)); return PASS if not why else INCONCLUSIVE
    if not a or a[0].startswith("-"): print(__doc__); return INCONCLUSIVE
    url, terms = a[0], []
    if "--terms-file" in a:
        i = a.index("--terms-file")
        if i + 1 >= len(a): print("usage: --terms-file needs a PATH"); return INCONCLUSIVE
        try: terms = [l.strip() for l in open(a[i + 1], encoding="utf-8") if l.strip()]
        except OSError as e: print("terms file unreadable:", type(e).__name__); return INCONCLUSIVE
    terms += [t.strip() for t in os.environ.get("ALIAS_TERMS", "").split(",") if t.strip()]
    terms = list(dict.fromkeys(terms))
    if not terms: print("no terms given (use --terms-file or ALIAS_TERMS)"); return INCONCLUSIVE
    return check(url, terms)
if __name__ == "__main__": sys.exit(main())
