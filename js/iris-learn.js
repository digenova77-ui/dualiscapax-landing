/**
 * IrisLearn — learning side effects require an authorized receipt.
 *
 * step() fails closed when the receipt is missing or malformed.
 * This module does not mint receipts and does not call a model.
 */
(function (w) {
  var VERSION = "iris-learn-2026-10-24";

  function receiptOk(receipt) {
    if (w.IrisReceipt && IrisReceipt.validReceipt) return IrisReceipt.validReceipt(receipt);
    if (!receipt || typeof receipt !== "object") return false;
    if (receipt.contract !== "dualis.receipt.v1") return false;
    if (typeof receipt.id !== "string" || receipt.id.indexOf("rct_") !== 0) return false;
    if (typeof receipt.sha256 !== "string" || !/^[0-9a-f]{64}$/i.test(receipt.sha256)) return false;
    if (typeof receipt.request_id !== "string" || !receipt.request_id) return false;
    return true;
  }

  function step(text, receipt) {
    if (!receiptOk(receipt)) {
      return { ok: false, lane: "DENIED", reason: "receipt-required", spoken: "Not authorized." };
    }
    return { ok: true, lane: "LEARN", receipt: receipt, text: text || "" };
  }

  w.IrisLearn = { version: VERSION, step: step };
})(typeof window !== "undefined" ? window : globalThis);
