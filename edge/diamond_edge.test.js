/**
 * Unit tests for diamond edge (grade, frontier, omni, pricing, receipt chain)
 * and Ronin-derived controls.
 * Pure; no external deps.
 */
import {
  grade,
  facesFrontier,
  frontierReport,
  omniSnapshot,
  priceIndex,
  standingProbe,
  verifyReceiptChain,
  circuitCheck,
  requireFields,
  claimRequiresLock,
  CIRCUIT,
  DEFAULT_FACETS,
  DIAMOND,
} from "./diamond_edge.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

// --- grade ---
const pureFacet = { clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" };
const g = grade(pureFacet);
assert(g.pure === true && g.verdict === "PASS", "FL D Excellent purity grades PASS");
assert(g.failed.length === 0, "no failures on pure");

const glassFacet = { clarity: "SI", color: "G", cut: "Good", reflects: "other" };
const g2 = grade(glassFacet);
assert(g2.pure === false && g2.verdict === "GLASS", "out-of-band grades GLASS");
assert(g2.failed.length > 0, "failures recorded");

// --- facesFrontier ---
assert(facesFrontier(pureFacet) === true, "pure faces frontier");
assert(facesFrontier(glassFacet) === false, "glass does not face frontier");

// --- frontierReport ---
const fr = frontierReport(DEFAULT_FACETS);
assert(fr.protocol === "DIAMOND.FRONTIER.MAX.v2", "protocol v2");
assert(fr.ceiling_claimable === true, "default facets claimable");
assert(fr.facing.length > 0, "some facing");
assert(fr.law === "LAW WINS", "law preserved");

const heldFacets = [
  { name: "bad", kind: "ring", clarity: "SI", color: "G", cut: "Good", reflects: "purity" },
  { name: "floor", kind: "floor", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
];
const frHeld = frontierReport(heldFacets);
assert(frHeld.ceiling_claimable === false, "held facets not claimable");
assert(frHeld.held.length === 1, "held recorded");

// --- omniSnapshot ---
const omni = omniSnapshot(DEFAULT_FACETS);
assert(omni.label === "OMNI", "omni label");
assert(omni.diamond.floor_holds === true, "floor holds");
assert(omni.contract.boundary === "NOT_FOR_EMISSION", "boundary");
assert(omni.frontier.protocol === "DIAMOND.FRONTIER.MAX.v2", "frontier protocol");

// --- priceIndex ---
const pi = priceIndex(pureFacet);
assert(pi.index === 1.000, "frontier index is 1.000");
assert(pi.boundary === "NOT_FOR_EMISSION", "price boundary");
const piGlass = priceIndex(glassFacet);
assert(piGlass.index === 0, "non-purity index 0");

// --- standingProbe ---
const sp = standingProbe();
assert(sp.standing_callable === true, "standing callable");
assert(sp.boundary === "NOT_FOR_EMISSION", "standing boundary");

// --- verifyReceiptChain ---
assert(verifyReceiptChain([]).ok === true, "empty chain ok");
const badId = [{ id: "not-rcpt" }];
assert(verifyReceiptChain(badId).ok === false, "bad id refused");
const firstBadFinger = [{ id: "rcpt:1", finger: 1 }];
assert(verifyReceiptChain(firstBadFinger).ok === false, "first finger must be 0");

// --- circuitCheck (existing + retained) ---
const now = Date.now();
const claimsOk = [{ ts: now - 1000 }, { ts: now - 2000 }];
assert(circuitCheck(claimsOk, now).ok === true, "circuit allows under limit");

const claimsOver = Array.from({ length: CIRCUIT.max_claims_per_window }, (_, i) => ({ ts: now - i * 1000 }));
assert(circuitCheck(claimsOver, now).ok === false, "circuit refuses at limit");
assert(circuitCheck(claimsOver, now).reason === "circuit:claim_rate", "circuit reason");

assert(circuitCheck("not-array").ok === false, "circuit refuses non-array");

const oldClaims = Array.from({ length: 10 }, (_, i) => ({ ts: now - CIRCUIT.window_ms - 1000 - i * 1000 }));
assert(circuitCheck(oldClaims, now).ok === true, "circuit ignores claims outside window");

const mixed = [...oldClaims.slice(0, 5), { ts: now - 500 }, { ts: now - 600 }];
assert(circuitCheck(mixed, now).ok === true, "circuit counts only recent claims");

const edgeClaim = [{ ts: now - CIRCUIT.window_ms + 1 }];
assert(circuitCheck(edgeClaim, now).ok === true, "claim just inside window counts");
const outsideClaim = [{ ts: now - CIRCUIT.window_ms - 1 }];
assert(circuitCheck(outsideClaim, now).ok === true, "claim just outside window ignored");

assert(circuitCheck([], now).ok === true, "empty claims allowed");
assert(circuitCheck(null).ok === false, "null claims refused");

// --- requireFields ---
assert(requireFields({ a: 1, b: "x" }, ["a", "b"]).ok === true, "requireFields passes");
assert(requireFields({ a: 1 }, ["a", "b"]).ok === false, "requireFields refuses missing");
assert(requireFields({ a: "" }, ["a"]).reason.startsWith("uninitialized:"), "requireFields empty string");
assert(requireFields(null, ["a"]).ok === false, "requireFields null obj");

// --- claimRequiresLock ---
const validReceipts = [{ id: "rcpt:genesis", kind: "lock", finger: 0 }];
assert(claimRequiresLock({ lock_id: "rcpt:genesis" }, validReceipts).ok === true, "claim with matching lock");
assert(claimRequiresLock({ lock_id: "rcpt:missing" }, validReceipts).ok === false, "claim without lock refused");
assert(claimRequiresLock({}, validReceipts).reason.startsWith("uninitialized:"), "claim missing lock_id refused");
const broken = [{ id: "bad" }];
assert(claimRequiresLock({ lock_id: "x" }, broken).ok === false, "broken chain refused");

// --- diamond face (grade bands and axes) ---
const faceBands = [
  { clarity: "FL", color: "D", cut: "Excellent", reflects: "purity", expect: true },
  { clarity: "VVS", color: "E", cut: "Very Good", reflects: "purity", expect: true },
  { clarity: "VS", color: "F", cut: "Excellent", reflects: "purity", expect: true },
  { clarity: "SI", color: "D", cut: "Excellent", reflects: "purity", expect: false },
  { clarity: "FL", color: "G", cut: "Excellent", reflects: "purity", expect: false },
  { clarity: "FL", color: "D", cut: "Good", reflects: "purity", expect: false },
  { clarity: "FL", color: "D", cut: "Excellent", reflects: "other", expect: false },
];

for (const b of faceBands) {
  const result = grade(b);
  assert(result.pure === b.expect, `face band ${b.clarity}/${b.color}/${b.cut}/${b.reflects} pure=${result.pure}`);
  assert(result.verdict === (b.expect ? "PASS" : "GLASS"), "verdict matches pure");
}

// Individual axis failure details
const clarityFail = grade({ clarity: "I", color: "D", cut: "Excellent", reflects: "purity" });
assert(clarityFail.clarity.pass === false, "clarity axis fails");
assert(clarityFail.failed.includes("clarity:I"), "clarity failure recorded");

const colorFail = grade({ clarity: "FL", color: "G", cut: "Excellent", reflects: "purity" });
assert(colorFail.color.pass === false, "color axis fails");
assert(colorFail.failed.includes("color:G"), "color failure recorded");

const cutFail = grade({ clarity: "FL", color: "D", cut: "Poor", reflects: "purity" });
assert(cutFail.cut.pass === false, "cut axis fails");
assert(cutFail.failed.includes("cut:Poor"), "cut failure recorded");

const reflectsFail = grade({ clarity: "FL", color: "D", cut: "Excellent", reflects: "glass" });
assert(reflectsFail.pure === false, "reflects failure");
assert(reflectsFail.failed.includes("reflects:not-purity"), "reflects failure recorded");

// facesFrontier requires all max bands
assert(facesFrontier({ clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" }) === true, "max face");
assert(facesFrontier({ clarity: "VVS", color: "D", cut: "Excellent", reflects: "purity" }) === false, "VVS not frontier");
assert(facesFrontier({ clarity: "FL", color: "E", cut: "Excellent", reflects: "purity" }) === false, "E not frontier");
assert(facesFrontier({ clarity: "FL", color: "D", cut: "Very Good", reflects: "purity" }) === false, "VG not frontier");

console.log("All diamond edge tests passed");
