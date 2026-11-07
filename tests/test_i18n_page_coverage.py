#!/usr/bin/env python3
"""Regression tests for the read-only HTML/catalog coverage checker."""
from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

CHECKER = Path(__file__).resolve().parents[1] / "tools" / "i18n_check.py"
SPEC = importlib.util.spec_from_file_location("i18n_check_under_test", CHECKER)
CHECKER_MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(CHECKER_MODULE)


class I18nCoverageCheckerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / "i18n").mkdir()
        (self.root / "js").mkdir()
        self.catalogs = {
            "en": {"nav.home": "Home", "meta.description": "English"},
            "fr": {"nav.home": "Accueil", "meta.description": "Français"},
            "es": {"nav.home": "Inicio", "meta.description": "Español"},
        }
        for locale, catalog in self.catalogs.items():
            self.write_catalog(locale, catalog)
        (self.root / "js" / "i18n.js").write_text(
            "const SUPPORTED = ['en', 'fr', 'es'];", encoding="utf-8"
        )
        (self.root / "index.html").write_text(
            '<html><head><meta data-i18n-content="meta.description"></head>'
            '<body><button id="dc-lang-switch"></button>'
            '<a data-i18n="nav.home">Home</a>'
            '<script src="js/i18n.js"></script></body></html>',
            encoding="utf-8",
        )

    def tearDown(self):
        self.temp.cleanup()

    def write_catalog(self, locale, catalog):
        (self.root / "i18n" / f"{locale}.json").write_text(
            json.dumps(catalog, ensure_ascii=False), encoding="utf-8"
        )

    def run_checker(self):
        output = io.StringIO()
        with patch.object(CHECKER_MODULE, "ROOT", self.root), contextlib.redirect_stdout(output):
            result = CHECKER_MODULE.main()
        return result, output.getvalue()

    def test_valid_page_and_all_catalogs_pass(self):
        result, output = self.run_checker()
        self.assertEqual(result, 0, output)
        self.assertIn("i18n check: PASS", output)
        self.assertIn("1/1 HTML pages wired", output)

    def test_missing_translation_key_fails_closed(self):
        self.write_catalog("fr", {"nav.home": "Accueil"})
        result, output = self.run_checker()
        self.assertEqual(result, 1)
        self.assertIn("missing English key 'meta.description'", output)

    def test_duplicate_catalog_keys_are_rejected(self):
        (self.root / "i18n" / "en.json").write_text(
            '{"nav.home":"Home","nav.home":"Start","meta.description":"English"}',
            encoding="utf-8",
        )
        result, output = self.run_checker()
        self.assertEqual(result, 1)
        self.assertIn("duplicate key 'nav.home'", output)

    def test_external_runtime_asset_is_rejected(self):
        page = self.root / "index.html"
        page.write_text(page.read_text(encoding="utf-8").replace(
            'src="js/i18n.js"', 'src="https://cdn.example/js/i18n.js"'
        ), encoding="utf-8")
        result, output = self.run_checker()
        self.assertEqual(result, 1)
        self.assertIn("same-origin local asset", output)

    def test_missing_switcher_is_rejected(self):
        page = self.root / "index.html"
        page.write_text(page.read_text(encoding="utf-8").replace(
            '<button id="dc-lang-switch"></button>', ""
        ), encoding="utf-8")
        result, output = self.run_checker()
        self.assertEqual(result, 1)
        self.assertIn("has data-i18n keys but no #dc-lang-switch", output)

    def test_unwired_pages_are_reported_without_false_pass_as_wired(self):
        (self.root / "about.html").write_text("<html><body>Static page</body></html>", encoding="utf-8")
        result, output = self.run_checker()
        self.assertEqual(result, 0, output)
        self.assertIn("1/2 HTML pages wired", output)
        self.assertIn("1 HTML pages are not yet wired", output)


if __name__ == "__main__":
    unittest.main()
