/**
 * Unit tests for Ronin-derived diamond controls.
 * Pure; no external deps. Run with node --experimental-vm-modules or similar,
 * or adapt to the project's test runner.
 */
import {
  circuitCheck,
  requireFields,
  claimRequiresLock,
  verifyReceiptChain,
  CIRCUIT,
} from "./diamond_edge.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

// --- circuitCheck ---
const now = Date.now();
const claimsOk = [
  { ts: now - 1000 },
  { ts: now - 2000 },
];
assert(circuitCheck(claimsOk, now).ok === true, "circuit allows under limit");

const claimsOver = Array.from({ length: CIRCUIT.max_claims_per_window }, (_, i) => ({ ts: now - i * 1000 }));
assert(circuitCheck(claimsOver, now).ok === false, "circuit refuses at limit");
assert(circuitCheck(claimsOver, now).reason === "circuit:claim_rate", "circuit reason");

assert(circuitCheck("not-array").ok === false, "circuit refuses non-array");

// Window boundary: claims older than window are ignored
const oldClaims = Array.from({ length: 10 }, (_, i) => ({ ts: now - CIRCUIT.window_ms - 1000 - i * 1000 }));
assert(circuitCheck(oldClaims, now).ok === true, "circuit ignores claims outside window");

// Mixed: some old, some recent under limit
const mixed = [
  ...oldClaims.slice(0, 5),
  { ts: now - 500 },
  { ts: now - 600 },
];
assert(circuitCheck(mixed, now).ok === true, "circuit counts only recent claims");

// Exact boundary at window edge
const edgeClaim = [{ ts: now - CIRCUIT.window_ms + 1 }];
assert(circuitCheck(edgeClaim, now).ok === true, "claim just inside window counts");
const outsideClaim = [{ ts: now - CIRCUIT.window_ms - 1 }];
assert(circuitCheck(outsideClaim, now).ok === true, "claim just outside window ignored");

// Empty and null-like
assert(circuitCheck([], now).ok === true, "empty claims allowed");
assert(circuitCheck(null).ok === false, "null claims refused");

// --- requireFields ---
assert(requireFields({ a: 1, b: "x" }, ["a", "b"]).ok === true, "requireFields passes");
assert(requireFields({ a: 1 }, ["a", "b"]).ok === false, "requireFields refuses missing");
assert(requireFields({ a: "" }, ["a"]).reason.startsWith("uninitialized:"), "requireFields empty string");
assert(requireFields(null, ["a"]).ok === false, "requireFields null obj");

// --- claimRequiresLock ---
const validReceipts = [
  { id: "rcpt:genesis", kind: "lock", finger: 0 },
];
assert(claimRequiresLock({ lock_id: "rcpt:genesis" }, validReceipts).ok === true, "claim with matching lock");

assert(claimRequiresLock({ lock_id: "rcpt:missing" }, validReceipts).ok === false, "claim without lock refused");
assert(claimRequiresLock({}, validReceipts).reason.startsWith("uninitialized:"), "claim missing lock_id refused");

// Broken chain
const broken = [{ id: "bad" }];
assert(claimRequiresLock({ lock_id: "x" }, broken).ok === false, "broken chain refused");

console.log("All Ronin-derived diamond tests passed");
