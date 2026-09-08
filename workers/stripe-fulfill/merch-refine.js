/**
 * Dualis merchandise superRefine (vanilla).
 * Same shape as Zod .superRefine ctx.addIssue list.
 * Call AFTER HMAC and skuFromSession flatten. Do not parse unsigned bodies.
 *
 * Zod equivalent (not bundled):
 *   Resolved.superRefine((g, ctx) => { … ctx.addIssue({ message: code, path }) })
 */

export function merchSuperRefine(g, skuGrant) {
  const reasons = [];
  if (!g || typeof g !== "object") {
    return { ok: false, reasons: [{ code: "unresolved_sku", path: ["sku"] }] };
  }

  const currency = g.currency == null ? "cad" : String(g.currency).toLowerCase();
  if (currency !== "cad") {
    reasons.push({ code: "currency_not_cad", path: ["currency"], currency: g.currency });
  }

  const sku = g.sku;
  const spec = sku && skuGrant ? skuGrant[sku] : null;
  if (!spec) {
    reasons.push({
      code: sku ? "unknown_sku" : "unresolved_sku",
      path: ["sku"],
      claimed: sku || null,
    });
    return { ok: false, reasons: reasons, sku: null };
  }

  const cents = g.cents;
  const allowed = spec.allowed_cents || [];
  if (typeof cents !== "number" || allowed.indexOf(cents) === -1) {
    reasons.push({
      code: "amount_sku_mismatch",
      path: ["cents"],
      sku: sku,
      amount_total: cents,
      expected_cents: allowed,
    });
  }

  if (reasons.length) return { ok: false, reasons: reasons, sku: sku };
  return { ok: true, reasons: [], sku: sku, via: g.via || null };
}

export function merchFromSession(session, resolved, skuGrant) {
  const g = {
    sku: resolved && resolved.sku,
    cents: session && session.amount_total,
    currency: session && session.currency,
    via: resolved && resolved.via,
  };
  const out = merchSuperRefine(g, skuGrant);
  if (!out.ok) {
    return {
      ok: false,
      reason: out.reasons[0] && out.reasons[0].code,
      reasons: out.reasons,
      claimed: resolved && (resolved.claimed || resolved.sku),
      amount_total: session && session.amount_total,
      currency: session && session.currency,
      expected_cents: out.reasons[0] && out.reasons[0].expected_cents,
    };
  }
  return { ok: true, sku: out.sku, via: g.via, reasons: [] };
}
