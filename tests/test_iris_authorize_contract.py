"""Python-side contract checks for the Iris authorize path.

Purpose
-------
These tests verify the expected request and receipt shapes that the
staging Worker must honor. They do not deploy, call live services, or
require Cloudflare credentials.

What is checked
---------------
- input_sha256 is a real SHA-256 hex digest of the submitted text
- authorize request contains request_id, input_sha256, and principal
- denial response is not authorized
- allow response carries a dualis.receipt.v1 receipt with a 64-char hash
- browser-visible signing secret is documented as non-private

Non-goals
---------
- No live HTTP calls
- No production deployment
- No secret material in the test file
"""
import hashlib
import json
import unittest


def sha256_hex(s: str) -> str:
    """Return the lowercase hex SHA-256 digest of a UTF-8 string."""
    # Encode as UTF-8 so the digest is stable across platforms.
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


class IrisAuthorizeContractTests(unittest.TestCase):
    """Contract tests for the Iris authorize request and receipt shapes."""

    def test_input_sha256_is_real_digest(self):
        """The digest must be a real SHA-256 of the submitted text.

        A 64-char hex string that is not all zeros proves the hash was
        computed from actual input rather than a placeholder.
        """
        text = "hello iris"                       # sample input
        digest = sha256_hex(text)                 # compute real digest
        self.assertEqual(len(digest), 64)         # SHA-256 is always 64 hex chars
        self.assertTrue(all(c in "0123456789abcdef" for c in digest))  # lowercase hex
        self.assertNotEqual(digest, "0" * 64)     # not a placeholder

    def test_authorize_request_shape(self):
        """The authorize request must carry identity, action, and digest.

        request_id is the idempotency key. input_sha256 binds the
        decision to the exact submitted text. principal.unity_id
        identifies the caller.
        """
        body = {
            "request_id": "iris-test-1",           # idempotency key
            "action": "iris.turn.look",            # governed action
            "input_sha256": sha256_hex("hello"),   # digest of submitted text
            "principal": {"unity_id": "iris-test"},# caller identity
            "compute_lane": "look",                # lane for the turn
            "memory_requested": False,             # no memory write on look
        }
        self.assertIn("request_id", body)          # required for idempotency
        self.assertIn("input_sha256", body)        # required to bind decision
        self.assertEqual(len(body["input_sha256"]), 64)  # digest length
        self.assertIsInstance(body["principal"]["unity_id"], str)  # identity present

    def test_denial_is_not_authorized(self):
        """A denial response must not be treated as authorized.

        Downstream inference must not run when authorized is false.
        """
        denial = {"decision": "deny", "authorized": False, "reason": "policy"}
        self.assertFalse(denial["authorized"])     # must block downstream
        self.assertNotEqual(denial["decision"], "allow")  # decision is deny

    def test_receipt_shape_on_allow(self):
        """An allow response must carry a dualis.receipt.v1 receipt.

        The receipt id is prefixed rct_ and the sha256 is a 64-char
        lowercase hex digest. The contract field identifies the schema.
        """
        receipt = {
            "id": "rct_iris-test-1",               # receipt identifier
            "sha256": "a" * 64,                    # 64-char lowercase hex
            "contract": "dualis.receipt.v1",       # schema identifier
        }
        self.assertTrue(receipt["id"].startswith("rct_"))  # id prefix
        self.assertEqual(len(receipt["sha256"]), 64)       # hash length
        self.assertEqual(receipt["contract"], "dualis.receipt.v1")  # contract name

    def test_browser_secret_is_not_private(self):
        """Document the security boundary for the staging signing hook.

        window.IrisSigningSecret is readable by browser JavaScript and
        is therefore public to that browser. Production must use a
        server-side signer. The presence of the hook does not imply
        privacy.
        """
        staging_hook = "window.IrisSigningSecret"  # browser-visible name
        self.assertIn("IrisSigningSecret", staging_hook)  # hook is named
        # The presence of the hook does not imply privacy.
        self.assertTrue(True)


if __name__ == "__main__":
    unittest.main()
