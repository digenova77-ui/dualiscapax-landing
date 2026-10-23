import test from "node:test";
import assert from "node:assert/strict";
import { edgeRoutes } from "../edge/worker_snippet.js";

test("GET /omni returns deterministic, no-store JSON", async () => {
  const response = edgeRoutes(new URL("https://example.test/omni"), "GET");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/json/);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const body = await response.json();
  assert.equal(body.label, "OMNI");
  assert.equal(body.contract.law, "LAW WINS");
  assert.equal(body.contract.boundary, "NOT_FOR_EMISSION");
  assert.equal(body.frontier.held_count, 2);
});

test("GET /frontier reports held facets and does not claim ceiling", async () => {
  const response = edgeRoutes(new URL("https://example.test/frontier"), "GET");
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.protocol, "DIAMOND.FRONTIER.MAX.v1");
  assert.equal(body.law, "LAW WINS");
  assert.equal(body.ceiling_claimable, false);
  assert.equal(body.held.length, 2);
});

test("trailing slash resolves to the same route contract", async () => {
  const a = await edgeRoutes(new URL("https://example.test/omni"), "GET").text();
  const b = await edgeRoutes(new URL("https://example.test/omni/"), "GET").text();
  assert.equal(a, b);
});

test("unsupported methods fail closed", async () => {
  const response = edgeRoutes(new URL("https://example.test/frontier"), "POST");
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});

test("unknown paths are not intercepted", () => {
  assert.equal(edgeRoutes(new URL("https://example.test/other"), "GET"), null);
});
