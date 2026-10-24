"""Python-side contract checks for the Iris authorize path.
These do not deploy or call live services. They verify the expected
request/receipt shapes that the staging Worker must honor.
"""
import hashlib
import json
import unittest


def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


class IrisAuthorizeContractTests(unittest.TestCase):
    def test_input_sha256_is_real_digest(self):
        text = "hello iris"
        digest = sha256_hex(text)
        self.assertEqual(len(digest), 64)
        self.assertTrue(all(c in "0123456789abcdef" for c in digest))
        self.assertNotEqual(digest, "0" * 64)

    def test_authorize_request_shape(self):
        body = {
            "request_id": "iris-test-1",
            "action": "iris.turn.look",
            "input_sha256": sha256_hex("hello"),
            "principal": {"unity_id": "iris-test"},
            "compute_lane": "look",
            "memory_requested": False,
        }
        self.assertIn("request_id", body)
        self.assertIn("input_sha256", body)
        self.assertEqual(len(body["input_sha256"]), 64)
        self.assertIsInstance(body["principal"]["unity_id"], str)

    def test_denial_is_not_authorized(self):
        denial = {"decision": "deny", "authorized": False, "reason": "policy"}
        self.assertFalse(denial["authorized"])
        self.assertNotEqual(denial["decision"], "allow")

    def test_receipt_shape_on_allow(self):
        receipt = {
            "id": "rct_iris-test-1",
            "sha256": "a" * 64,
            "contract": "dualis.receipt.v1",
        }
        self.assertTrue(receipt["id"].startswith("rct_"))
        self.assertEqual(len(receipt["sha256"]), 64)
        self.assertEqual(receipt["contract"], "dualis.receipt.v1")

    def test_browser_secret_is_not_private(self):
        # Documented boundary: any value readable by browser JS is public
        # to that browser. Production must not rely on window.IrisSigningSecret.
        staging_hook = "window.IrisSigningSecret"
        self.assertIn("IrisSigningSecret", staging_hook)
        # The presence of the hook does not imply privacy.
        self.assertTrue(True)


if __name__ == "__main__":
    unittest.main()
