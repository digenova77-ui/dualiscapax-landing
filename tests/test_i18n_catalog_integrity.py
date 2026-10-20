import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = ROOT / "i18n"
RUNTIME = ROOT / "js" / "i18n.js"
EXPECTED_LOCALES = {"en", "fr", "es"}


class TranslationCatalogIntegrityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalogs = {
            path.stem: json.loads(path.read_text(encoding="utf-8"))
            for path in sorted(CATALOG_DIR.glob("*.json"))
        }
        cls.runtime = RUNTIME.read_text(encoding="utf-8")

    def test_catalog_set_matches_runtime_supported_locales(self):
        self.assertEqual(set(self.catalogs), EXPECTED_LOCALES)
        match = re.search(r"const SUPPORTED = \[([^]]*)\];", self.runtime)
        self.assertIsNotNone(match, "runtime supported-locale declaration missing")
        runtime_locales = set(re.findall(r"['\"]([a-z]{2})['\"]", match.group(1)))
        self.assertEqual(runtime_locales, EXPECTED_LOCALES)

    def test_all_locales_have_identical_key_coverage(self):
        english_keys = set(self.catalogs["en"])
        self.assertTrue(english_keys, "English catalog must not be empty")
        for locale, catalog in self.catalogs.items():
            with self.subTest(locale=locale):
                self.assertEqual(set(catalog), english_keys, "catalog keys must match English")
                self.assertTrue(all(isinstance(k, str) and k.strip() for k in catalog))
                self.assertTrue(all(isinstance(v, str) and v.strip() for v in catalog.values()))

    def test_translation_catalogs_are_json_objects(self):
        for locale, catalog in self.catalogs.items():
            with self.subTest(locale=locale):
                self.assertIsInstance(catalog, dict)
                self.assertNotIn(None, catalog)
                self.assertNotIn("", catalog)

    def test_runtime_uses_text_content_by_default(self):
        # HTML insertion is permitted only through the explicit trusted-content opt-in.
        self.assertIn("el.textContent = value", self.runtime)
        self.assertIn("el.hasAttribute('data-i18n-html')", self.runtime)
        self.assertIn("Only use data-i18n-html for trusted repository-authored catalog values", self.runtime)


if __name__ == "__main__":
    unittest.main(verbosity=2)
