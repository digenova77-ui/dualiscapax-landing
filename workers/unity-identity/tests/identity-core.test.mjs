import { test } from "node:test";
import assert from "node:assert/strict";
import { cookieValue, normalizeHandle, originAllowed, safeJsonBody, sessionCookie } from "../identity-core.mjs";

test("handle normalization accepts bounded public handles only", () => {
  assert.equal(normalizeHandle(" Alice_01 "), "alice_01");
  for (const value of ["ab", "a".repeat(65), "a b", "../admin", "", null, 3]) assert.equal(normalizeHandle(value), null);
});
test("body shape and size are bounded", () => {
  assert.equal(safeJsonBody({ ok: true }), true);
  assert.equal(safeJsonBody(null), false);
  assert.equal(safeJsonBody([]), false);
  assert.equal(safeJsonBody({ payload: "x".repeat(17_000) }), false);
});
test("session cookie is host-only, secure and HttpOnly", () => {
  const header = sessionCookie("A".repeat(43));
  assert.match(header, /Path=\//);
  assert.match(header, /Secure/);
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Strict/);
  assert.doesNotMatch(header, /Domain=/);
  assert.equal(cookieValue(header.split(";")[0]), "A".repeat(43));
  assert.equal(cookieValue("__Host-unity_session=short"), null);
});
test("origin comparison is exact", () => {
  const ok = new Request("https://dualiscapax.com/register/options", { method: "POST", headers: { origin: "https://dualiscapax.com" } });
  const evil = new Request("https://dualiscapax.com/register/options", { method: "POST", headers: { origin: "https://dualiscapax.com.attacker.invalid" } });
  assert.equal(originAllowed(ok, "https://dualiscapax.com"), true);
  assert.equal(originAllowed(evil, "https://dualiscapax.com"), false);
});
