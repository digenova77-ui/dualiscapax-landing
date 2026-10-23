/**
 * Pinata pin helper.
 * Default: dry-run listing.
 * --pin: pin the Omni/frontier snapshot JSON (requires PINATA_JWT).
 * --full: reserved; currently same snapshot (no full-tree upload).
 *
 * Does not publish IPNS. Prints the CID so an IPNS update can be run separately.
 */
import { readFileSync } from "fs";
import { omniSnapshot, frontierReport, DEFAULT_FACETS, standingProbe } from "../edge/diamond_edge.js";

const pin = process.argv.includes("--pin");
const snapshot = {
  omni: omniSnapshot(DEFAULT_FACETS),
  frontier: frontierReport(DEFAULT_FACETS),
  standing: standingProbe(),
  note: "pure edge snapshot — NOT_FOR_EMISSION",
  ts: new Date().toISOString(),
};

if (!pin) {
  console.log("dry-run: would pin Omni/frontier snapshot");
  console.log(JSON.stringify({ keys: Object.keys(snapshot), bytes: JSON.stringify(snapshot).length }));
  process.exit(0);
}

const jwt = process.env.PINATA_JWT;
if (!jwt) {
  console.error("PINATA_JWT missing");
  process.exit(1);
}

const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    pinataContent: snapshot,
    pinataMetadata: { name: "dualiscapax-omni-frontier" },
  }),
});

const body = await res.text();
if (!res.ok) {
  console.error("pin failed", res.status, body);
  process.exit(1);
}
console.log(body);
try {
  const j = JSON.parse(body);
  if (j.IpfsHash) console.log("CID:", j.IpfsHash);
} catch {}
