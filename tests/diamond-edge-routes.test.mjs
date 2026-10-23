import test from "node:test";
import assert from "node:assert/strict";
import { edgeRoutes } from "../edge/worker_snippet.js";
import { grade, facesFrontier, frontierReport, omniSnapshot, DEFAULT_FACETS, CLARITY_PASS } from "../edge/diamond_edge.js";

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

test("core grade matches pass-band and frontier invariants", () => {
  const maximum = { clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" };
  assert.equal(grade(maximum).verdict, "PASS");
  assert.equal(facesFrontier(maximum), true);
  assert.equal(grade({ ...maximum, clarity: "SI2" }).verdict, "GLASS");
  assert.equal(facesFrontier({ ...maximum, cut: "Very Good" }), false);
});

test("pass bands cannot be mutated by a caller", () => {
  assert.equal(Object.isFrozen(CLARITY_PASS), true);
  assert.throws(() => CLARITY_PASS.push("SI2"), TypeError);
  assert.equal(grade({ clarity: "SI2", color: "D", cut: "Excellent", reflects: "purity" }).verdict, "GLASS");
});

test("missing floor never permits ceiling claim", () => {
  const report = frontierReport([{ name: "ring", kind: "ring", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" }]);
  assert.equal(report.ceiling_claimable, false);
  assert.equal(omniSnapshot([]).diamond.rise_ok, false);
  assert.equal(omniSnapshot(DEFAULT_FACETS).frontier.held_count, 2);
});

test("malformed facet collections fail explicitly", () => {
  assert.throws(() => frontierReport(null), /facets must be an array/);
  assert.throws(() => frontierReport([null]), /facet must be an object/);
});

test("HEAD is bodyless and still no-store", () => {
  const response = edgeRoutes(new URL("https://example.test/frontier"), "HEAD");
  assert.equal(response.status, 200);
  assert.equal(response.body, null);
  assert.match(response.headers.get("cache-control"), /no-store/);
});
