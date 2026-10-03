#!/usr/bin/env python3
"""Post-deploy check for a pulled alias: count term hits in the response body, after discounting only what the host
echoes. Unknown paths on the site may return 200 with an HTML fallback, and the host may echo the requested path into
every page, so neither 404 nor a raw body search is a valid test. No term lives in this repo: terms come from a local
file outside the repo (one per line, never committed) or from the env var ALIAS_TERMS (comma-separated).
Owner closing command (the only launch that counts; run it exactly like this, with absolute paths):
  /usr/bin/env -i HOME=/home/box PATH=/usr/bin:/bin /usr/bin/python3.13 -I -B <abs path>/scripts/alias-body-check.py <URL> --terms-file <file>
  (the same line wrapped as /bin/bash --norc --noprofile -c '...' is equivalent.) Record BOTH the exit code and the
  RESULT line: only exit 0 together with "RESULT: PASS" closes the check. An exit code without its RESULT line is void.
Other modes: same prefix, then <abs path>/scripts/alias-body-check.py --selftest | --gate-check.
Launch gate (r5, every mode, before any input is read; refusal = message on stderr and os._exit(4), never SystemExit):
  - /proc/self/cmdline and sys.orig_argv must be exactly [/usr/bin/python3.13, -I, -B, <absolute real script path>,
    args...]; sys.argv must match. This refuses -i, -m cProfile/profile/trace/pdb, -X, extra flags, a relative path,
    /usr/bin/python3 or a bare python3.13 as argv[0].
  - refuse if any LD_*, BASH_ENV, ENV, BASH_FUNC_* or PYTHON* name is in os.environ or in /proc/self/environ.
  - flags -I (so -E -s -P) and -B set; no inspect/interactive; no -X option; no user site; sys.gettrace() and
    sys.getprofile() None; no sys.monitoring tool; no cProfile/profile/_lsprof/trace/pdb/bdb module loaded.
  - the script dir is not on sys.path; no sys.path entry (or nearest existing parent) is writable by this user.
  - .pyc: refuse any *.pyc/*.pyo beside the script, and any __pycache__ entry beside it whose module name is a stdlib
    module or the script's own name. Declared limit: -B stops writing .pyc, not reading them; only -I (script dir off
    sys.path, checked) keeps files beside the script from being imported, and this script's name has hyphens and runs
    as __main__, which is never cached or importable by name.
  - realpath(sys.executable) and os.readlink('/proc/self/exe') must be /usr/bin/python3.13 and sha256(/proc/self/exe)
    must equal the pin from receipts/PYTHON_SHIM_CHECK_2026-10-03.md.
  Every exit (refusals and results 0/1/2 alike) is flush + os._exit(code). Declared limits: a preload that hooks _exit,
  or a sitecustomize that exits before this file runs (only possible without -I), defeats any in-process exit code;
  only the env -i launch above stops them, which is why rc and the RESULT line must agree.
Echo discount (r5, same-run control + template proof): when a term occurs in the requested URL, the same run fetches
one control URL of the same shape (each term replaced by a random token of the same length and character class,
case-mapped per occurrence, re-rolled if it occurs as a word in the alias body; logged as sha256[:8] only). The control
must be a 200 whose redirect hops have the same status codes AND the same term->token mapped Location URLs, the same
mapped final URL, and a non-empty decodable body; otherwise INCONCLUSIVE. Then:
  - template exact: the alias body equals the control body with every control token swapped back to the term (same
    case pattern), character for character. Only then are those swapped occurrences discounted as echoes; what is
    counted is the control body itself, so any term the template carries still counts.
  - template differs: nothing is discounted. FAIL if any term occurs more often in the alias (max over forms) than its
    token in the control, or a term not in the URL occurs; PASS only if the alias has 0 hits; else INCONCLUSIVE.
  A raw percent-encoded echo of a term letter (e.g. %54 for a capital T) cannot match the control and gives 2.
Output: status chain, final status, body sha256[:8], echo-matched count, hit count per term as sha256[:8] of the
casefolded term. Never prints a term, a control token or a URL (only sha256[:8]).
Decision:
  exit 4 REFUSED: launch gate failed (stderr only; no RESULT line)
  exit 2 INCONCLUSIVE: fetch error; final status 5xx/403/429 or any status other than 2xx/404/410; unsupported or
         broken Content-Encoding; body empty after NFKC and zero-width/BOM removal; body with NUL or >1% U+FFFD after
         decoding; a 404/410/other-2xx page with 0 hits (only a 200 can PASS); control not comparable; usage errors
  exit 1 FAIL: 2xx/404/410 with a non-empty body and >= 1 term hit after the discount
  exit 0 PASS: final status 200, non-empty body, 0 term hits after the discount
Body decoding: Content-Encoding gzip/x-gzip/deflate via stdlib (no external program), charset incl. UTF-16, BOM.
Forms: the body and every decoded form are chained (percent incl. '+', HTML entities, JS \\u/\\u{..}/\\x, base64 runs
at 4 alignments decoded as UTF-8, else UTF-16LE/BE/latin-1, NFKC with zero-width/soft-hyphen removed, tags removed /
replaced by a space / comments+inline tags removed and block tags spaced / every tag and comment replaced by a
separator that a split term may span), up to depth 4. A term hit = the max count over all forms (word boundaries).
Child processes (selftest only): absolute interpreter path, pin re-checked before each spawn, fixed environment
PATH=/usr/bin:/bin and LC_ALL=C.UTF-8 (+ ALIAS_TERMS), stdin /dev/null."""
import os, sys   # only modules already loaded at interpreter start, until the launch gate below has passed

REFUSED = 4
T16_EXE = "/usr/bin/python3.13"
T16_SHA = "889c603f0d17cb54060951bcf4c4f9b8c9ebd9e52b392c70209bbb9755d797d9"  # receipts/PYTHON_SHIM_CHECK_2026-10-03.md
DENY_EXACT, DENY_PREFIX = ("BASH_ENV", "ENV"), ("LD_", "BASH_FUNC_", "PYTHON")
TRACE_MODS = ("cProfile", "profile", "_lsprof", "trace", "pdb", "bdb")

def _refuse(why):
    msg = "REFUSE (exit %d): launch gate failed: %s\n" % (REFUSED, "; ".join(why) or "unknown")
    try: os.write(2, msg.encode("ascii", "backslashreplace"))
    finally: os._exit(REFUSED)
def _denied(name): return name in DENY_EXACT or name.startswith(DENY_PREFIX)
def _proc_list(p):
    with open(p, "rb") as f: return [os.fsdecode(x) for x in f.read().split(b"\0")[:-1]]
def launch_reasons(env_names, proc_env_names, cmdline, orig_argv, argv, file, flags, xoptions, tracer, profiler,
                   modules, monitor_tools, user_site, path_entries):
    """Pure check of the launch (also unit-tested by the selftest). Returns a list of fixed reason strings."""
    why = ["env %s" % n for n in sorted({n for n in list(env_names) + list(proc_env_names) if _denied(n)})]
    if not file or not os.path.isabs(file) or os.path.realpath(file) != file: why.append("script path not absolute and real")
    want = [T16_EXE, "-I", "-B", file] + list(argv[1:])
    if list(cmdline) != want: why.append("/proc/self/cmdline is not [%s, -I, -B, <abs script>, args]" % T16_EXE)
    if list(orig_argv) != want: why.append("sys.orig_argv differs")
    if not argv or argv[0] != file: why.append("sys.argv[0] differs")
    if not flags.isolated: why.append("-I not set")
    if not flags.dont_write_bytecode: why.append("-B not set")
    if not (flags.ignore_environment and flags.no_user_site and flags.safe_path): why.append("isolation flags incomplete")
    if flags.inspect or flags.interactive: why.append("-i / inspect")
    if xoptions: why.append("-X option")
    if tracer is not None: why.append("sys.gettrace() set")
    if profiler is not None: why.append("sys.getprofile() set")
    why += ["module %s loaded" % m for m in TRACE_MODS if m in modules]
    if monitor_tools: why.append("sys.monitoring tool registered")
    if user_site: why.append("user site enabled")
    d = os.path.dirname(file or "")
    for i, p in enumerate(path_entries):
        if p in ("", ".") or os.path.realpath(p) == d: why.append("script dir on sys.path"); continue
        q = p
        while q and not os.path.exists(q): q = os.path.dirname(q)
        if q and (os.access(q, os.W_OK) or os.access(os.path.join(q, "__pycache__"), os.W_OK)): why.append("sys.path[%d] writable" % i)
    return why
def pyc_reasons(file):
    d = os.path.dirname(file); stem = os.path.basename(file).rsplit(".", 1)[0]; why = []
    try: names = sorted(os.listdir(d))
    except OSError: return ["script dir unreadable"]
    why += ["pyc beside script: %s" % n for n in names if n.endswith((".pyc", ".pyo"))]
    try: cache = sorted(os.listdir(os.path.join(d, "__pycache__")))
    except OSError: cache = []
    why += ["__pycache__ shadow: %s" % n for n in cache
            if n.endswith((".pyc", ".pyo")) and (n.split(".")[0] in sys.stdlib_module_names or n.split(".")[0] == stem)]
    return why
def _launch_gate_early():
    try:
        why = launch_reasons(list(os.environ), [e.split("=", 1)[0] for e in _proc_list("/proc/self/environ")],
                             _proc_list("/proc/self/cmdline"), getattr(sys, "orig_argv", []), sys.argv,
                             globals().get("__file__", ""), sys.flags, sys._xoptions, sys.gettrace(), sys.getprofile(),
                             sys.modules, [i for i in range(6) if sys.monitoring.get_tool(i) is not None],
                             bool(getattr(sys.modules.get("site"), "ENABLE_USER_SITE", True)), list(sys.path))
        if not why: why = pyc_reasons(__file__)
    except Exception as e:
        why = ["gate error %s" % type(e).__name__]
    if why: _refuse(why)
if __name__ == "__main__": _launch_gate_early()

import base64, codecs, gzip, hashlib, html, re, secrets, string, unicodedata, zlib
import urllib.error, urllib.parse, urllib.request

def _sha_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()
def gate():
    """Interpreter identity (T16 + Twain2 F-1): realpath, /proc/self/exe link and image sha256 pin."""
    why = []
    if os.path.realpath(sys.executable) != T16_EXE: why.append("sys.executable")
    try: link = os.readlink("/proc/self/exe")
    except OSError: link = ""
    if link != T16_EXE: why.append("/proc/self/exe link")
    try: sh = _sha_file("/proc/self/exe")
    except OSError: sh = ""
    if sh != T16_SHA: why.append("/proc/self/exe sha256")
    return why
if __name__ == "__main__":
    _w = gate()
    if _w: _refuse(_w)

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
    def __init__(self): self.hops = []
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.hops.append((code, newurl)); return super().redirect_request(req, fp, code, msg, headers, newurl)

def fetch(url, timeout=20):
    """Returns status, raw body, final URL, redirect hops [(code, Location URL as followed)], error name, headers."""
    ch = _Chain(); op = urllib.request.build_opener(ch)
    req = urllib.request.Request(url, headers={"User-Agent": "alias-body-check/5"})
    try:
        r = op.open(req, timeout=timeout); return r.status, r.read(), r.geturl(), ch.hops, None, r.headers
    except urllib.error.HTTPError as e:
        try: body = e.read()
        except Exception: body = b""
        return e.code, body, e.geturl() or url, ch.hops, None, e.headers
    except Exception as e:
        return None, b"", url, ch.hops, type(e).__name__, {}

# ---------------- same-run control with template proof (Iris r4 MF1, SF1, SF2) ----------------
LB = r"(?:(?<![A-Za-z0-9])|(?<=%[0-9A-Fa-f]{2})|(?<=\\x[0-9A-Fa-f]{2})|(?<=\\u[0-9A-Fa-f]{4}))"
RB = r"(?![A-Za-z0-9])"
def word_rx(w): return re.compile(LB + re.escape(w) + RB, re.I)
def _sub_rx(term): return re.compile(r"(?<![A-Za-z0-9])" + r"\s+".join(map(re.escape, term.split())) + r"(?![A-Za-z0-9])", re.I)
def term_in_url(term, url):
    sp = urllib.parse.urlsplit(url)
    return bool(_sub_rx(term).search(urllib.parse.unquote_plus(sp.path + "?" + sp.query)))
def ctl_token(term, terms, avoid=""):
    """Random token, same length and character class; never contains a term; re-rolled while it occurs as a word
    (case-insensitive, same boundaries as the swap) in the alias body (SF2)."""
    for _ in range(256):
        t = "".join(secrets.choice(string.ascii_uppercase) if c.isupper() else secrets.choice(string.ascii_lowercase) if c.isalpha()
                    else secrets.choice(string.digits) if c.isdigit() else c for c in term)
        if all(x.casefold() not in t.casefold() for x in terms) and not word_rx(t).search(avoid): return t
    raise RuntimeError("no control token")
def case_like(src, model):
    """src re-cased letter by letter like model (same length), else src unchanged."""
    if len(src) != len(model): return src
    out = []
    for s, m in zip(src, model):
        y = s.upper() if m.isupper() else s.lower() if m.islower() else s
        out.append(y if len(y) == 1 else s)
    return "".join(out)
def control_url(url, toks):
    sp = urllib.parse.urlsplit(url); path = urllib.parse.unquote(sp.path); query = sp.query
    for term, tok in toks.items():
        rx = _sub_rx(term); f = lambda m, tok=tok: case_like(tok, m.group(0))
        path = rx.sub(f, path); query = rx.sub(f, query)
    return urllib.parse.urlunsplit((sp.scheme, sp.netloc, urllib.parse.quote(path, safe="/:@!$&'()*+,;=-._~"), query, ""))
def same_hops(ahops, chops, toks):
    """SF1: same number of hops, same status code AND the same mapped Location URL at every hop."""
    return len(ahops) == len(chops) and all(ac == cc and control_url(au, toks) == control_url(cu, {})
                                            for (ac, au), (cc, cu) in zip(ahops, chops))
def swap_back(ctext, toks):
    """The control body with every control-token word occurrence replaced by its term in the same case pattern."""
    back = {tok.casefold(): term for term, tok in toks.items()}
    rx = re.compile(LB + "(?:" + "|".join(re.escape(t) for t in sorted(toks.values(), key=lambda w: (-len(w), w))) + ")" + RB, re.I)
    n = [0]
    def f(m):
        n[0] += 1; term = back[m.group(0).casefold()]
        return "".join(x if not t.isalpha() else case_like(x, c) for x, t, c in zip(term, toks[term], m.group(0)))
    return rx.sub(f, ctext), n[0]

def check(url, terms, out=print):
    code, raw, final, hops, err, hdr = fetch(url)
    chain = [c for c, _ in hops]
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
    verdict_counts = None
    if in_url:
        try: toks = {t: ctl_token(t, terms, avoid=text) for t in in_url}
        except RuntimeError:
            out("RESULT: INCONCLUSIVE (control token: every candidate occurs in the alias body)"); return INCONCLUSIVE
        cu = control_url(url, toks)
        if any(term_in_url(t, cu) for t in terms):
            out("RESULT: INCONCLUSIVE (control URL could not be built)"); return INCONCLUSIVE
        ccode, craw, cfinal, chops, cerr, chdr = fetch(cu)
        out("control %s final %s chain: %s tokens %s" % (h8(cu), h8(cfinal), " -> ".join(map(str, [c for c, _ in chops] + [ccode if ccode is not None else "ERR"])),
                                                         ",".join(th8(v) for v in toks.values())))
        if cerr:
            out("RESULT: INCONCLUSIVE (control fetch error: %s)" % cerr); return INCONCLUSIVE
        hops_ok = same_hops(hops, chops, toks) and control_url(final, toks) == control_url(cfinal, {})
        if ccode != 200 or code != 200 or not hops_ok:
            out("RESULT: INCONCLUSIVE (control not comparable: HTTP %d/%d, redirect hops or final differ: %s)"
                % (code, ccode, "no" if hops_ok else "yes")); return INCONCLUSIVE
        try: ctext = decode_body(craw, chdr)
        except Exception as e:
            out("RESULT: INCONCLUSIVE (control body decode: %s)" % type(e).__name__); return INCONCLUSIVE
        cst = body_state(ctext)
        if cst:
            out("RESULT: INCONCLUSIVE (control %s)" % cst); return INCONCLUSIVE
        expect, nswap = swap_back(ctext, toks)
        if expect == text:      # proven: the alias body is the control body with the term swapped, nothing else
            out("template exact: alias body = control body with the term swapped (%d swaps)" % nswap)
            out("echo-matched %d control-echoes %d" % (nswap, nswap))
            text = ctext        # every swapped occurrence discounted; whatever the template itself carries still counts
        else:
            out("template differs: no echo discount")
            out("echo-matched 0 control-echoes %d" % nswap)
            ccounts = dict(zip(in_url, (n for _, n in count_hits(ctext, [toks[t] for t in in_url])[0])))
            verdict_counts = ccounts
    else:
        out("echo-matched 0 control none (no term in URL)")
    counts, nforms = count_hits(text, terms)
    total = sum(n for _, n in counts)
    out("forms %d" % nforms)
    for t, n in counts: out("term %s: %d" % (t, n))
    if verdict_counts is not None and total:
        excess = [t for t, (_, n) in zip(terms, counts) if n > verdict_counts.get(t, 0)]
        for t in in_url: out("term %s: alias %d vs control-token %d" % (th8(t), dict(zip(terms, (n for _, n in counts)))[t], verdict_counts[t]))
        if excess:
            out("RESULT: FAIL (template differs; %d term(s) occur more often than the control echoes)" % len(excess)); return FAIL
        out("RESULT: INCONCLUSIVE (template differs; %d occurrence(s) could be echoes, none discounted)" % total); return INCONCLUSIVE
    if total:
        out("RESULT: FAIL (%d term hits)" % total); return FAIL
    if code != 200:
        out("RESULT: INCONCLUSIVE (HTTP %d with 0 hits; only 200 can PASS)" % code); return INCONCLUSIVE
    out("RESULT: PASS (0 term hits)"); return PASS

def gate_line(why):
    return ("gate ok: launch exact, env clean, realpath and /proc/self/exe = %s, -I -B, sha256 %s" % (T16_EXE, T16_SHA[:8]) if not why else
            "T16 refuse: %s" % ", ".join(why))
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
def _x02(kind, alias, seg):   # Iris r4 x02-x02d (+x03): the alias page is not the control page with the path swapped
    e = html.escape(seg); tail = "</head><body><h1>World</h1><p>nothing personal here</p></body></html>"
    if kind == "x02": tag = '<meta name="author" content="%s">' % PH if alias else '<meta name="p" content="%s">' % e
    elif kind == "x02b": tag = '<link rel="%s" href="https://apex.invalid/x02b/%s">' % ("alternate" if alias else "canonical", e)
    elif kind == "x02c": tag = '<meta property="og:title" content="%s">' % PH if alias else '<meta property="og:url" content="%s">' % e
    elif kind == "x03": tag = '<meta name="p" content="%s">' % e + ('<meta name="author" content="%s">' % PH if alias else "")
    else:
        if alias: return ('<!doctype html><html><head><title>Class news</title><meta name="author" content="%s"></head>'
                          '<body><h2>Class news</h2><p>Field trip notes</p></body></html>' % PH).encode()
        tag = '<title>desk</title><meta name="p" content="%s">' % e
        return ("<!doctype html><html><head>%s%s" % (tag, tail)).encode()
    return ("<!doctype html><html><head><title>desk</title>%s%s" % (tag, tail)).encode()
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
    if len(segs) == 2 and segs[0] in ("x02", "x02b", "x02c", "x02d", "x03"): return (200, _x02(segs[0], segs[1] == PH, segs[1]), {})
    if len(segs) == 2 and segs[0] in ("hop", "hop2"):    # SF1: alias and control differ only in the intermediate hop
        return (302, b"", {"Location": "/%s/%s" % ("hopmid" if segs[0] == "hop2" or segs[1] == PH else "hopalt", segs[1])})
    if len(segs) == 2 and segs[0] in ("hopmid", "hopalt"): return (302, b"", {"Location": "/hopend/" + segs[1]})
    if segs and segs[0] == "words": return (200, _page("<p>%s</p>" % " ".join(string.ascii_lowercase)), {})
    if len(segs) == 2 and segs[0] == "lc":               # host lower-cases the echoed segment
        return (200, _page('<h1>World</h1><title>%s</title><meta name="p" content="%s">' % ((html.escape(segs[1].lower()),) * 2)), {})
    if len(segs) == 2 and segs[0] == "jld":              # JSON-LD URL echo, both pages
        return (200, _page('<h1>World</h1><script type="application/ld+json">{"url":"https:\\/\\/apex.invalid\\/jld\\/%s"}</script>' % segs[1]), {})
    if len(segs) == 2 and segs[0] == "gzc":              # control (any segment but the placeholder) served gzip
        body = _page("<h1>World</h1>" + _echo(raw_path))
        return (200, body, {}) if segs[1] == PH else (200, gzip.compress(body, mtime=0), {"Content-Encoding": "gzip"})
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
    # r5 MF1 (Iris r4 section 4): alias page is not the control's template; want 1 or 2, never 0
    ("x02-meta-author-vs-control-meta-echo", "/x02/" + PH, INCONCLUSIVE, PH),
    ("x02b-alternate-link-same-window", "/x02b/" + PH, INCONCLUSIVE, PH),
    ("x02c-og-title-vs-control-og-url", "/x02c/" + PH, INCONCLUSIVE, PH),
    ("x02d-stale-page-meta-author-only", "/x02d/" + PH, INCONCLUSIVE, PH),
    ("x03-template-plus-meta-author", "/x03/" + PH, FAIL, PH),
    # r5 kept at 0: echo-only pages that are the control template
    ("r5-lowercased-echo-only", "/lc/" + PH, PASS, PH),
    ("r5-mixed-case-url-echo-only", "/mc/" + PH[:7] + PH[7:].lower(), PASS, PH),
    ("r5-jsonld-url-echo-both-pages", "/jld/" + PH, PASS, PH),
    ("r5-gzip-on-control-only", "/gzc/" + PH, PASS, PH),
    # r5 should-fix (Iris r4 section 9)
    ("sf1r5-intermediate-hop-differs", "/hop/" + PH, INCONCLUSIVE, PH),
    ("sf1r5-same-mapped-hops-echo-only", "/hop2/" + PH, PASS, PH),
    ("sf2r5-every-token-occurs-in-alias", "/words/Q", INCONCLUSIVE, "Q"),
    ("sf3r5-raw-percent-encoded-echo", "/sf3/%%%02X%s" % (ord(PH[0]), PH[1:]), INCONCLUSIVE, PH),
]
def _spawn(argv, env=None, executable=None, cwd=None):
    import subprocess
    if _sha_file(T16_EXE) != T16_SHA: _refuse(["pinned interpreter sha256 changed; refusing to spawn"])
    return subprocess.run(argv, env=dict(env if env is not None else CHILD_ENV), executable=executable, cwd=cwd,
                          stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=120)
def _unit_rows(me):
    """In-process rows for launch_reasons / pyc_reasons / ctl_token / swap_back (no child, no network)."""
    import types
    fl = {k: getattr(sys.flags, k) for k in ("isolated", "dont_write_bytecode", "ignore_environment", "no_user_site", "safe_path", "inspect", "interactive")}
    base = dict(env_names=["HOME", "PATH"], proc_env_names=["HOME", "PATH"], cmdline=[T16_EXE, "-I", "-B", me, "--selftest"],
                orig_argv=[T16_EXE, "-I", "-B", me, "--selftest"], argv=[me, "--selftest"], file=me, flags=types.SimpleNamespace(**fl),
                xoptions={}, tracer=None, profiler=None, modules={}, monitor_tools=[], user_site=False, path_entries=list(sys.path))
    def lr(**kw): d = dict(base); d.update(kw); return launch_reasons(**d)
    import tempfile; tmpw = tempfile.gettempdir()
    rows = [
        ("u00-canonical-inputs-no-reason", lr() == []),
        ("u01-environ-scrubbed-proc-environ-LD_PRELOAD", lr(env_names=["HOME"], proc_env_names=["HOME", "LD_PRELOAD"]) == ["env LD_PRELOAD"]),
        ("u02-sys-gettrace-set", "sys.gettrace() set" in lr(tracer=len)),
        ("u03-sys-getprofile-set", "sys.getprofile() set" in lr(profiler=len)),
        ("u04-profiler-trace-modules-loaded", all("module %s loaded" % m in lr(modules=dict.fromkeys(TRACE_MODS)) for m in TRACE_MODS)),
        ("u05-sys-monitoring-tool", "sys.monitoring tool registered" in lr(monitor_tools=[2])),
        ("u06-user-site-enabled", "user site enabled" in lr(user_site=True)),
        ("u07-inspect-flag", "-i / inspect" in lr(flags=types.SimpleNamespace(**dict(fl, inspect=1)))),
        ("u08-script-dir-on-sys-path", "script dir on sys.path" in lr(path_entries=[os.path.dirname(me)] + list(sys.path))),
        ("u09-writable-sys-path-entry", "sys.path[0] writable" in lr(path_entries=[tmpw])),
        ("u10-BASH_FUNC-ENV-BASH_ENV-names", lr(env_names=["BASH_FUNC_x%%", "ENV", "BASH_ENV", "PYTHONSAFEPATH"]) ==
                                             ["env BASH_ENV", "env BASH_FUNC_x%%", "env ENV", "env PYTHONSAFEPATH"]),
        ("u11-live-launch-has-no-reason", True),   # this process passed the same gate to get here
        ("sf2r5-reroll-avoids-alias-words", all(ctl_token("Q", ["Q"], avoid=" ".join("abcdefghijklm")).lower() not in "abcdefghijklm"
                                                for _ in range(50))),
        ("sf2r5-swap-word-boundaries", swap_back("aQWERTb /QWERT %2FQWERT \\x2fqwert", {"ABCDE": "QWERT"})
                                       == ("aQWERTb /ABCDE %2FABCDE \\x2fabcde", 3)),
    ]
    return rows
def selftest():
    import py_compile, shutil, socket, tempfile, threading
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
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
    me = os.path.realpath(__file__); ok = bad = limits = 0; tally = {PASS: 0, FAIL: 0, INCONCLUSIVE: 0}
    print(gate_line([]))
    print("selftest: child argv [%s, -I, -B, <this script>, <127.0.0.1 case URL>], env %s, stdin /dev/null, server 127.0.0.1:<ephemeral>"
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
        print("case %-42s want %d got %d echo %-3s %s | %s" % (name, want, got, em[0] if em else "-", "OK" if good else "BAD", res[0] if res else p.stderr.strip()[:120]))
    for name, path, want, term in CASES: run_case(name, "http://127.0.0.1:%d%s" % (port, path), want, term)
    run_case("fetch-error-closed-port", "http://127.0.0.1:%d/clean" % dead, INCONCLUSIVE, PH)
    # usage errors must be exit 2, never 0/1
    for name, argv in (("usage-no-args", []), ("usage-terms-file-missing-arg", ["http://127.0.0.1:%d/clean" % port, "--terms-file"]),
                       ("usage-no-terms", ["http://127.0.0.1:%d/clean" % port])):
        p = _spawn([T16_EXE, "-I", "-B", me] + argv)
        good = p.returncode == INCONCLUSIVE and not p.stderr.strip(); ok += good; bad += not good
        print("case %-42s want 2 got %d %s" % (name, p.returncode, "OK" if good else "BAD"))
    def launch(name, argv, env, want, exe=None, cwd=None, marker=None, marker_want=None, limit=False):
        """Refusal rows: want 4, a REFUSE line on stderr, empty stdout (no RESULT line). Limit rows: rc 0 and no RESULT."""
        nonlocal ok, bad, limits
        if marker and os.path.exists(marker): os.remove(marker)
        p = _spawn(argv, env=env, executable=exe, cwd=cwd)
        err = p.stderr.strip().splitlines(); res = [l for l in p.stdout.splitlines() if l.startswith("RESULT:")]
        ran = bool(marker) and os.path.exists(marker)
        mk = marker_want is None or ran == marker_want
        if limit: good = p.returncode == 0 and not res and mk
        elif want == REFUSED: good = p.returncode == REFUSED and bool(err) and err[0].startswith("REFUSE (exit 4)") and not p.stdout.strip() and mk
        else: good = p.returncode == want and len(res) == 1 and not p.stderr.strip() and mk
        if limit: limits += 1
        else: ok += good; bad += not good
        why = err[0].split("launch gate failed: ", 1)[-1] if err and err[0].startswith("REFUSE") else (res[0] if res else (p.stdout.strip().splitlines() or ["(no output)"])[-1][:60])
        print("%s %-42s want %s got %d %s%s | %s" % ("limit" if limit else "case", name, "0+no RESULT" if limit else want, p.returncode,
              ("AS DECLARED" if good else "UNEXPECTED") if limit else ("OK" if good else "BAD"),
              "" if marker_want is None else " (side code ran: %s)" % ("yes" if ran else "no"), why))
    for name, good in _unit_rows(me):
        ok += good; bad += not good
        print("case %-42s in-process %s" % (name, "OK" if good else "BAD"))
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
        gc = [T16_EXE, "-I", "-B", me, "--gate-check"]
        # interpreter gate: T16 (r3) + F-1 (copy with appended bytes, spoofed argv[0]) + V8 (fake same-name binaries first on PATH)
        launch("t16-no-flags", [T16_EXE, me, "--selftest"], CHILD_ENV, REFUSED, marker=marker, marker_want=False)
        launch("t16-I-only", [T16_EXE, "-I", me, "--selftest"], CHILD_ENV, REFUSED, marker=marker, marker_want=False)
        launch("t16-B-only", [T16_EXE, "-B", me, "--selftest"], CHILD_ENV, REFUSED, marker=marker, marker_want=False)
        launch("t16-byte-copy-other-path", [cp, "-I", "-B", me, "--gate-check"], CHILD_ENV, REFUSED, marker=marker, marker_want=False)
        launch("f1-copy-appended-spoofed-argv0", gc, CHILD_ENV, REFUSED, exe=cpa, marker=marker, marker_want=False)
        p = _spawn(gc, env=hostile); line = (p.stdout.strip().splitlines() or [""])[-1]
        good = p.returncode == PASS and line.startswith("gate ok:") and not os.path.exists(marker) and not p.stderr.strip()
        ok += good; bad += not good
        print("case %-42s want 0 got %d %s | %s" % ("v8-fake-binaries-first-on-PATH-gate", p.returncode, "OK" if good else "BAD", line[:40]))
        run_case("v8-fake-binaries-first-on-PATH-gzip", "http://127.0.0.1:%d/gz" % port, FAIL, PH, env=hostile)
        if os.path.exists(marker): bad += 1; print("case v8 marker: a fake binary ran BAD")
        old = os.environ.get("PATH"); os.environ["PATH"] = hostile["PATH"]
        try: run_case("v8-parent-PATH-hostile-child-env-fixed", "http://127.0.0.1:%d/hit" % port, FAIL, PH)
        finally:
            if old is None: os.environ.pop("PATH", None)
            else: os.environ["PATH"] = old
        if os.path.exists(marker): bad += 1; print("case v8 marker: a fake binary ran BAD")
        # r5 MF2 / AM-1 + AM-2 (Iris r4 section 5): every launch other than the canonical one is refused with exit 4
        hit = "http://127.0.0.1:%d/hit" % port; base = dict(CHILD_ENV, ALIAS_TERMS=PH); canon = [T16_EXE, "-I", "-B", me, hit]
        side = os.path.join(tmp, "side-ran")
        site_ok = os.path.join(tmp, "site_ok"); site_exit = os.path.join(tmp, "site_exit")
        for d, body in ((site_ok, "open(%r, 'w').write('x')\n" % side), (site_exit, "import os\nopen(%r, 'w').write('x')\nos._exit(0)\n" % side)):
            os.mkdir(d)
            with open(os.path.join(d, "sitecustomize.py"), "w") as f: f.write(body)
        benv = os.path.join(tmp, "bash_env")
        with open(benv, "w") as f: f.write("trap 'exit 0' EXIT\n")
        E = lambda **kw: dict(base, **kw)
        launch("am0-canonical-control-row", canon, base, FAIL)
        launch("am1-LD_PRELOAD-check-mode", canon, E(LD_PRELOAD=""), REFUSED)
        launch("am1-LD_PRELOAD-gate-check", gc, E(LD_PRELOAD=""), REFUSED)
        launch("am1-LD_LIBRARY_PATH", canon, E(LD_LIBRARY_PATH=tmp), REFUSED)
        launch("am1-BASH_ENV-trap-file", canon, E(BASH_ENV=benv), REFUSED)
        launch("am1-ENV", canon, E(ENV=benv), REFUSED)
        launch("am1-BASH_FUNC-exported-function", canon, dict(base, **{"BASH_FUNC_python3.13%%": "() {  exit 0\n}"}), REFUSED)
        launch("am1-PYTHONPATH-sitecustomize-with-I", canon, E(PYTHONPATH=site_ok), REFUSED, marker=side, marker_want=False)
        launch("am1-PYTHONPATH-sitecustomize-no-I", [T16_EXE, "-B", me, hit], E(PYTHONPATH=site_ok), REFUSED, marker=side, marker_want=True)
        launch("am1-PYTHONINSPECT", canon, E(PYTHONINSPECT="1"), REFUSED)
        launch("am1-PYTHONSTARTUP", canon, E(PYTHONSTARTUP=benv), REFUSED)
        launch("am1-PYTHONHOME", canon, E(PYTHONHOME="/usr"), REFUSED)
        launch("am1-flag-i", [T16_EXE, "-I", "-B", "-i", me, hit], base, REFUSED)
        launch("am1-m-cProfile", [T16_EXE, "-I", "-B", "-m", "cProfile", me, hit], base, REFUSED)
        launch("am1-m-profile", [T16_EXE, "-I", "-B", "-m", "profile", me, hit], base, REFUSED)
        launch("am1-m-trace", [T16_EXE, "-I", "-B", "-m", "trace", "--count", me, hit], base, REFUSED)
        launch("am1-X-option", [T16_EXE, "-I", "-B", "-X", "utf8", me, hit], base, REFUSED)
        launch("am1-combined-IB-flag", [T16_EXE, "-IB", me, hit], base, REFUSED)
        launch("am1-relative-script-path", [T16_EXE, "-I", "-B", os.path.basename(me), hit], base, REFUSED, cwd=os.path.dirname(me))
        launch("am1-argv0-python3-symlink", ["/usr/bin/python3", "-I", "-B", me, hit], base, REFUSED)
        launch("am1-argv0-bare-name", ["python3.13", "-I", "-B", me, hit], base, REFUSED, exe=T16_EXE)
        launch("am1-gate-check-under-m-cProfile", [T16_EXE, "-I", "-B", "-m", "cProfile", me, "--gate-check"], base, REFUSED)
        # .pyc beside the script (Iris r4 P1-P3) on temp copies of this script
        evil = os.path.join(tmp, "evil.py")
        with open(evil, "w") as f: f.write("import os\nopen(%r, 'w').write('x')\nos._exit(0)\n" % side)
        cps = {}
        for k in ("pyc", "cache", "clean"):
            d = os.path.join(tmp, "copy_" + k); os.mkdir(d); cps[k] = os.path.join(d, "alias-body-check.py"); shutil.copyfile(me, cps[k])
        py_compile.compile(evil, cfile=os.path.join(tmp, "copy_pyc", "gzip.pyc"), doraise=True)
        os.mkdir(os.path.join(tmp, "copy_cache", "__pycache__"))
        py_compile.compile(evil, cfile=os.path.join(tmp, "copy_cache", "__pycache__", "gzip.cpython-313.pyc"), doraise=True)
        launch("am2-copy-without-pyc-control-row", [T16_EXE, "-I", "-B", cps["clean"], hit], base, FAIL)
        launch("am2-sourceless-pyc-beside-canonical", [T16_EXE, "-I", "-B", cps["pyc"], hit], base, REFUSED, marker=side, marker_want=False)
        launch("am2-sourceless-pyc-beside-B-only", [T16_EXE, "-B", cps["pyc"], hit], base, REFUSED, marker=side, marker_want=False)
        launch("am2-sourceless-pyc-beside-no-flags", [T16_EXE, cps["pyc"], hit], base, REFUSED, marker=side, marker_want=False)
        launch("am2-pycache-stdlib-name-beside", [T16_EXE, "-I", "-B", cps["cache"], hit], base, REFUSED, marker=side, marker_want=False)
        # declared limit (Iris r4 E15/E06 class): code that runs and exits before this file can act; rc 0 with no RESULT line
        launch("limit-sitecustomize-os-exit-0-without-I", [T16_EXE, "-B", me, hit], E(PYTHONPATH=site_exit), 0, marker=side, marker_want=True, limit=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    srv.shutdown()
    print("selftest: %d cases, %d ok, %d bad; declared-limit rows %d; results pass=%d fail=%d inconclusive=%d (fetch cases)"
          % (ok + bad, ok, bad, limits, tally[PASS], tally[FAIL], tally[INCONCLUSIVE]))
    return PASS if bad == 0 else FAIL

def main():
    a = sys.argv[1:]
    if a == ["--selftest"]: return selftest()
    if a == ["--gate-check"]: print(gate_line([])); return PASS   # the full launch gate already passed at import
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
if __name__ == "__main__":
    try: rc = main()
    except BaseException as e:   # never let an exception look like FAIL (1) or PASS (0)
        try: os.write(2, ("error: %s\n" % type(e).__name__).encode())
        except Exception: pass
        rc = INCONCLUSIVE
    try: sys.stdout.flush(); sys.stderr.flush()
    finally: os._exit(rc)   # AM-2: every exit is flush + os._exit, never SystemExit
