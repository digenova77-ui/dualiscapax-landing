/**
 * IrisReceipt — shared fail-closed validator for dualis.receipt.v1.
 *
 * A receipt is the only proof that an authorize decision was allow.
 * Missing, malformed, or non-matching receipts fail closed.
 * This module does not sign, mint, or store secrets.
 */
(function (root) {
  var CONTRACT = "dualis.receipt.v1";

  function isHex64(value) {
    return typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
  }

  function validReceipt(receipt) {
    if (!receipt || typeof receipt !== "object") return false;
    if (receipt.contract !== CONTRACT) return false;
    if (typeof receipt.id !== "string" || receipt.id.indexOf("rct_") !== 0) return false;
    if (!isHex64(receipt.sha256)) return false;
    if (typeof receipt.request_id !== "string" || !receipt.request_id) return false;
    return true;
  }

  function validAuthorized(result) {
    return !!(result && result.authorized === true && validReceipt(result.receipt));
  }

  var api = {
    contract: CONTRACT,
    validReceipt: validReceipt,
    validAuthorized: validAuthorized
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrisReceipt = api;
})(typeof window !== "undefined" ? window : globalThis);
