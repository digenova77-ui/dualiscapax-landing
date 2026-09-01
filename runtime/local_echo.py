"""Local echo — 127.0.0.1 only.

Shows their own books as charts on this computer.
The terminal must be open. Nothing is bound to 0.0.0.0.
Operators stay blind. Models may still compute after bind.
Silence is HOLE not zero.
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

HERE = Path(__file__).resolve().parent
if str(HERE.parent) not in sys.path:
    sys.path.insert(0, str(HERE.parent))

try:
    from runtime.dualis import SECRET, hole, load_bind, receipt
except ImportError:
    from dualis import SECRET, hole, load_bind, receipt

VERSION = "local-echo-2026-09-01"
HOST = "127.0.0.1"
PORT = 18771
PAGE = HERE / "local_echo.html"


def parse_table(text: str) -> dict[str, Any]:
    lines = [ln for ln in text.splitlines() if ln.strip()]
    if not lines:
        return {"headers": [], "rows": [], "series": [], "numbers": 0, "residual_named": False}
    sample = lines[0]
    delim = "\t" if sample.count("\t") > sample.count(",") else ","
    reader = csv.reader(io.StringIO("\n".join(lines)), delimiter=delim)
    raw = [row for row in reader if any(cell.strip() for cell in row)]
    if not raw:
        return {"headers": [], "rows": [], "series": [], "numbers": 0, "residual_named": False}
    headers = [h.strip() or f"col_{i+1}" for i, h in enumerate(raw[0])]
    body = raw[1:] if len(raw) > 1 else []
    numbers = 0
    numeric_cols: list[int] = []
    for c in range(len(headers)):
        hits = 0
        for row in body:
            if c >= len(row):
                continue
            token = row[c].replace("$", "").replace(",", "").strip()
            try:
                float(token)
                hits += 1
            except ValueError:
                pass
        if hits:
            numeric_cols.append(c)
            numbers += hits
    label_idx = 0
    for i, _h in enumerate(headers):
        if i not in numeric_cols:
            label_idx = i
            break
    labels = []
    for row in body:
        labels.append(row[label_idx].strip() if label_idx < len(row) else "")
    series = []
    for c in numeric_cols:
        values: list[float | None] = []
        for row in body:
            if c >= len(row):
                values.append(None)
                continue
            token = row[c].replace("$", "").replace(",", "").strip()
            try:
                values.append(float(token))
            except ValueError:
                values.append(None)
        series.append({"name": headers[c], "values": values})
    residual_named = any(re.match(r"^total$", h, re.I) for h in headers)
    return {
        "headers": headers,
        "rows": body,
        "labels": labels,
        "series": series,
        "numbers": numbers,
        "residual_named": residual_named,
        "residual_unit": "NAMED" if residual_named else "SEED",
    }


def load_books(path: Path | None) -> dict[str, Any]:
    if path is None:
        return hole("NO_FILE", next="Pass --file so this desk can draw your own sheet.")
    if not path.exists() or not path.is_file():
        return hole("NO_FILE")
    if SECRET.search(path.name):
        return hole("SECRET_IN_NAME")
    text = path.read_bytes().decode("utf-8", "ignore")
    if SECRET.search(text[:4000]):
        return hole("SECRET_IN_FILE")
    table = parse_table(text)
    table.update(
        {
            "status": "LOCAL",
            "name": path.name,
            "bytes": path.stat().st_size,
            "stays": "device",
            "echo": "127.0.0.1",
            "operators_see": False,
            "scientific_validation": False,
        }
    )
    return table


def state(file_path: Path | None) -> dict[str, Any]:
    bound = load_bind()
    rec = receipt(bound) if bound else hole("NO_BIND")
    books = load_books(file_path)
    return {
        "v": VERSION,
        "host": HOST,
        "port": PORT,
        "law": "LOOPBACK_ONLY",
        "operators_see": False,
        "models_may_compute": rec.get("status") == "BOUND",
        "chain": "WAIT_GRANT",
        "receipt": rec,
        "books": books,
        "scientific_validation": False,
    }


class EchoHandler(BaseHTTPRequestHandler):
    books_path: Path | None = None

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write("[local-echo] " + (fmt % args) + "\n")

    def _host_ok(self) -> bool:
        host = (self.headers.get("Host") or "").split(":")[0].lower()
        return host in {"127.0.0.1", "localhost"}

    def _send(self, code: int, body: bytes, mime: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Dualis-Echo", "127.0.0.1")
        self.send_header("X-Dualis-Operators", "blind")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if not self._host_ok():
            self._send(403, b'{"status":"HOLE","reason":"NOT_LOOPBACK"}', "application/json")
            return
        path = urlparse(self.path).path
        if path in {"/", "/echo", "/local"}:
            if not PAGE.exists():
                self._send(500, b"missing local_echo.html", "text/plain; charset=utf-8")
                return
            self._send(200, PAGE.read_bytes(), "text/html; charset=utf-8")
            return
        if path == "/api/state":
            payload = json.dumps(state(self.books_path), indent=2).encode("utf-8")
            self._send(200, payload, "application/json")
            return
        if path == "/api/receipt":
            bound = load_bind()
            rec = receipt(bound) if bound else hole("NO_BIND")
            self._send(200, json.dumps(rec, indent=2).encode("utf-8"), "application/json")
            return
        self._send(404, b'{"status":"HOLE","reason":"NO_PAGE"}', "application/json")

    def do_POST(self) -> None:
        self._send(405, b'{"status":"HOLE","reason":"NO_POST"}', "application/json")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="runtime.local_echo",
        description="Draw your own books on 127.0.0.1. Dualis never sees the file.",
    )
    parser.add_argument("--invite", action="store_true", help="Required. Server will not start unasked.")
    parser.add_argument("--file", help="Local sheet to graph. Stays on this computer.")
    parser.add_argument("--port", type=int, default=PORT)
    args = parser.parse_args(argv)
    if not args.invite:
        sys.stdout.write(json.dumps(hole("NO_INVITE", next="Pass --invite."), indent=2) + "\n")
        return 1
    if args.port < 1024:
        sys.stdout.write(json.dumps(hole("PORT_RESERVED"), indent=2) + "\n")
        return 1
    EchoHandler.books_path = Path(args.file).expanduser() if args.file else None
    httpd = ThreadingHTTPServer((HOST, args.port), EchoHandler)
    sys.stderr.write(
        f"Dualis local echo on http://{HOST}:{args.port}/  "
        "This computer only. Ctrl+C stops it.\n"
    )
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        sys.stderr.write("\nlocal echo closed.\n")
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
