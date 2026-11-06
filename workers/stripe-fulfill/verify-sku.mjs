import test from "node:test";
import assert from "node:assert/strict";
import { skuFromSession, merchandiseJacket, amountMatchesSku } from "./worker.js";

test("known Fuel SKU and exact CAD amount resolve", () => {
  const session = { metadata: { sku: "depth_m" }, amount_total: 5000, currency: "cad" };
  const resolved = skuFromSession(session, {});
  assert.equal(resolved.sku, "depth_m");
  assert.equal(merchandiseJacket(session, resolved).ok, true);
});

test("metadata SKU with mismatched amount fails closed", () => {
  const session = { metadata: { sku: "depth_m" }, amount_total: 500, currency: "cad" };
  const resolved = skuFromSession(session, {});
  assert.equal(resolved.sku, null);
  assert.equal(merchandiseJacket(session, resolved).ok, false);
});

test("unknown SKU cannot create a grant", () => {
  const session = { metadata: { sku: "made_up" }, amount_total: 5000, currency: "cad" };
  const resolved = skuFromSession(session, {});
  assert.equal(resolved.sku, null);
  assert.equal(merchandiseJacket(session, resolved).ok, false);
});

test("non-CAD currency is rejected by merchandise validation", () => {
  const session = { metadata: { sku: "depth_m" }, amount_total: 5000, currency: "usd" };
  const resolved = skuFromSession(session, {});
  assert.equal(merchandiseJacket(session, resolved).ok, false);
});

test("amount fallback maps only configured exact amounts", () => {
  assert.equal(skuFromSession({ amount_total: 2000 }, {}).sku, "depth_s");
  assert.equal(skuFromSession({ amount_total: 2001 }, {}).sku, null);
});

test("allowlist amount check rejects unknown SKU and wrong amount", () => {
  assert.equal(amountMatchesSku("depth_s", 2000), true);
  assert.equal(amountMatchesSku("depth_s", 5000), false);
  assert.equal(amountMatchesSku("not_a_sku", 2000), false);
});
