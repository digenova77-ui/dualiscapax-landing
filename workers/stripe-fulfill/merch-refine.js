/** Vanilla superRefine for the merchandise jacket.
 *  Same shape as Zod ctx.addIssue — no zod package.
 *  HMAC and D1 stay outside this function.
 */

export function merchSuperRefine(g, skuGrant) {
  const reasons = [];
  const sku = g && g.sku;
  const cents = g && g.cents;
  const currency = g && g.currency != null ? String(g.currency).toLowerCase() : "cad";
  const spec = sku && skuGrant ? skuGrant[sku] : null;

  if (currency !== "cad") {
    reasons.push({ code: "currency_not_cad", path: ["currency"], currency: currency });
  }

  if (!spec) {
    reasons.push({
      code: sku ? "unknown_sku" : "unresolved_sku",
      path: ["sku"],
      sku: sku || null,
      via: (g && g.via) || null,
    });
    return { ok: false, reasons: reasons };
  }

  const allowed = spec.allowed_cents || [];
  if (typeof cents !== "number" || allowed.indexOf(cents) === -1) {
    var via = (g && g.via) || "";
    var code = "amount_sku_mismatch";
    if (via === "metadata" || via === "metadata_amount_mismatch") code = "metadata_amount_mismatch";
    if (via === "payment_link_map" || via === "payment_link_amount_mismatch") code = "payment_link_amount_mismatch";
    reasons.push({
      code: code,
      path: ["cents"],
      sku: sku,
      cents: cents,
      expected_cents: allowed,
    });
  }

  return { ok: reasons.length === 0, reasons: reasons, sku: sku, spec: spec };
}

export function merchIssuesToFulfill(result) {
  if (!result || result.ok) return { ok: true, sku: result && result.sku };
  const first = (result.reasons && result.reasons[0]) || { code: "unresolved_sku" };
  return {
    ok: false,
    reason: first.code,
    reasons: result.reasons,
    claimed: first.sku,
    expected_cents: first.expected_cents,
  };
}
