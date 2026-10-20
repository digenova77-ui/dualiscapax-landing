#!/usr/bin/env python3
"""Read-only validation for the static DualisCapax i18n catalogs and HTML pages."""
from __future__ import annotations

import json
import posixpath
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCALES = ("en", "fr", "es")


def reject_duplicate_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate key {key!r}")
        result[key] = value
    return result


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.keys: set[str] = set()
        self.scripts: list[str] = []
        self.has_switcher = False
        self.switcher_count = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs = dict(attrs)
        key = attrs.get("data-i18n")
        if key:
            self.keys.add(key)
        placeholder_key = attrs.get("data-i18n-placeholder")
        if placeholder_key:
            self.keys.add(placeholder_key)
        for attribute in ("aria-label", "title", "content"):
            attribute_key = attrs.get("data-i18n-" + attribute)
            if attribute_key:
                self.keys.add(attribute_key)
        if attrs.get("id") == "dc-lang-switch":
            self.has_switcher = True
            self.switcher_count += 1
        if tag == "script" and attrs.get("src"):
            self.scripts.append(attrs["src"])


def main() -> int:
    errors: list[str] = []
    catalogs: dict[str, dict] = {}
    for locale in LOCALES:
        path = ROOT / "i18n" / f"{locale}.json"
        try:
            value = json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=reject_duplicate_keys)
            if not isinstance(value, dict):
                raise ValueError("catalog root must be an object")
            catalogs[locale] = value
            for key, translation in value.items():
                if not isinstance(key, str) or not key.strip():
                    errors.append(f"{path.relative_to(ROOT)}: translation keys must be non-empty strings")
                if not isinstance(translation, str) or not translation.strip():
                    errors.append(f"{path.relative_to(ROOT)}: translation {key!r} must be a non-empty string")
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            errors.append(f"{path.relative_to(ROOT)}: invalid catalog: {exc}")

    if len(catalogs) == len(LOCALES):
        english_keys = set(catalogs["en"])
        for locale in LOCALES[1:]:
            other = set(catalogs[locale])
            for key in sorted(english_keys - other):
                errors.append(f"i18n/{locale}.json: missing English key {key!r}")
            for key in sorted(other - english_keys):
                errors.append(f"i18n/{locale}.json: unknown key {key!r}")

    runtime_path = ROOT / "js" / "i18n.js"
    if runtime_path.is_file():
        runtime_text = runtime_path.read_text(encoding="utf-8")
        supported_match = re.search(r"const\s+SUPPORTED\s*=\s*\[([^\]]*)\]", runtime_text)
        if not supported_match:
            errors.append("js/i18n.js: cannot determine supported locale list")
        else:
            runtime_locales = set(re.findall(r"'([a-z]{2})'", supported_match.group(1)))
            if runtime_locales != set(LOCALES):
                errors.append(f"js/i18n.js: supported locales {sorted(runtime_locales)} do not match catalog locales {sorted(LOCALES)}")
    else:
        errors.append("js/i18n.js: runtime file is missing")

    checked = 0
    for path in sorted(ROOT.rglob("*.html")):
        if any(part in {".git", "node_modules", "dist"} for part in path.parts):
            continue
        relative = path.relative_to(ROOT).as_posix()
        parser = PageParser()
        try:
            parser.feed(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError) as exc:
            errors.append(f"{relative}: cannot read HTML: {exc}")
            continue

        uses_i18n = parser.has_switcher or bool(parser.keys)
        if not uses_i18n:
            continue
        checked += 1
        if not parser.has_switcher:
            errors.append(f"{relative}: has data-i18n keys but no #dc-lang-switch")
        if parser.switcher_count > 1:
            errors.append(f"{relative}: has {parser.switcher_count} #dc-lang-switch elements; use one unique id")
        if not any(src.endswith("js/i18n.js") for src in parser.scripts):
            errors.append(f"{relative}: has i18n markup but does not load js/i18n.js")

        for src in parser.scripts:
            if not src.endswith("js/i18n.js"):
                continue
            if src.startswith(("https://", "http://", "//")):
                errors.append(f"{relative}: i18n runtime must be a same-origin local asset")
                continue
            resolved = posixpath.normpath(posixpath.join(posixpath.dirname(relative), src))
            if not (ROOT / resolved).is_file():
                errors.append(f"{relative}: i18n script path does not exist: {src} -> {resolved}")

        for key in sorted(parser.keys):
            for locale, catalog in catalogs.items():
                if key not in catalog:
                    errors.append(f"{relative}: key {key!r} missing from i18n/{locale}.json")

    if errors:
        print("i18n check: FAIL")
        print("\n".join(f"- {error}" for error in errors))
        return 1

    print(f"i18n check: PASS — {checked} HTML pages, {len(catalogs['en'])} keys per locale, {len(LOCALES)} locales.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
