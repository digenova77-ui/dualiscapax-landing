/**
 * Pure diamond / frontier / Omni edge module.
 * Ported from efuse-unity commit eb6deaa.
 * No I/O. Safe for Cloudflare Workers or browser.
 *
 * Pass bands:
 *   clarity in FL, VVS, VS
 *   color in D, E, F
 *   cut in Excellent, Very Good
 *   reflects === "purity"
 *
 * Frontier maximum:
 *   FL / D / Excellent / purity
 */
export const CLARITY_PASS = new Set(["FL", "VVS", "VS"]);
export const COLOR_PASS = new Set(["D", "E", "F"]);
export const CUT_PASS = new Set(["Excellent", "Very Good"]);
export const MAX_BAND = Object.freeze({ clarity: "FL", color: "D", cut: "Excellent" });

export function grade(f) {
  const clarity_ok = CLARITY_PASS.has(f?.clarity);
  const color_ok = COLOR_PASS.has(f?.color);
  const cut_ok = CUT_PASS.has(f?.cut);
  const reflects_ok = f?.reflects === "purity";
  const pure = clarity_ok && color_ok && cut_ok && reflects_ok;
  const failed = [];
  if (!clarity_ok) failed.push(`clarity:${String(f?.clarity ?? "missing")}`);
  if (!color_ok) failed.push(`color:${String(f?.color ?? "missing")}`);
  if (!cut_ok) failed.push(`cut:${String(f?.cut ?? "missing")}`);
  if (!reflects_ok) failed.push("reflects:not-purity");
  return {
    pure,
    verdict: pure ? "PASS" : "GLASS",
    failed,
    clarity: { value: f?.clarity ?? null, pass: clarity_ok },
    color: { value: f?.color ?? null, pass: color_ok },
    cut: { value: f?.cut ?? null, pass: cut_ok },
  };
}

export function facesFrontier(f) {
  return f?.clarity === MAX_BAND.clarity &&
    f?.color === MAX_BAND.color &&
    f?.cut === MAX_BAND.cut &&
    f?.reflects === "purity";
}

export function frontierReport(facets) {
  if (!Array.isArray(facets)) throw new TypeError("facets must be an array");
  const facing = [];
  const held = [];
  for (const f of facets) {
    if (!f || typeof f !== "object") throw new TypeError("facet must be an object");
    if (f.kind === "ceiling") continue;
    if (facesFrontier(f)) facing.push(f.name);
    else held.push({ name: f.name, clarity: f.clarity, color: f.color, cut: f.cut });
  }
  const floor = facets.find((f) => f.kind === "floor");
  const floorHolds = floor ? grade(floor).pure : false;
  return {
    protocol: "DIAMOND.FRONTIER.MAX.v1",
    facing,
    held,
    ceiling_claimable: held.length === 0 && floorHolds,
    law: "LAW WINS",
    origin: "immutable",
    learning: "advisory only — NOT_FOR_EMISSION",
  };
}

export function omniSnapshot(facets) {
  if (!Array.isArray(facets)) throw new TypeError("facets must be an array");
  const g = facets.filter((f) => f?.kind !== "ceiling").map((f) => ({
    name: f.name,
    verdict: grade(f).verdict,
  }));
  const fr = frontierReport(facets);
  const floor = facets.find((f) => f?.kind === "floor");
  const glass = g.some((x) => x.verdict === "GLASS");
  return {
    label: "OMNI",
    diamond: {
      floor_holds: floor ? grade(floor).pure : false,
      rise_ok: !glass && (floor ? grade(floor).pure : false),
      ceiling_reached: !glass && (floor ? grade(floor).pure : false),
      facets: g,
    },
    frontier: {
      protocol: fr.protocol,
      facing: fr.facing,
      held_count: fr.held.length,
      ceiling_claimable: fr.ceiling_claimable,
    },
    contract: {
      law: "LAW WINS",
      origin: "immutable",
      boundary: "NOT_FOR_EMISSION",
    },
    integrity: "UNCHANGED — core not touched",
  };
}

export const DEFAULT_FACETS = Object.freeze([
  { name: "foundation", kind: "floor", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
  { name: "DCLM", kind: "ring", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
  { name: "Iris", kind: "ring", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
  { name: "Twain²", kind: "ring", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
  { name: "summer", kind: "tree", clarity: "VS", color: "E", cut: "Very Good", reflects: "purity" },
  { name: "winter", kind: "tree", clarity: "VS", color: "F", cut: "Very Good", reflects: "purity" },
  { name: "merit", kind: "economy", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
  { name: "standing", kind: "economy", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
  { name: "ceiling", kind: "ceiling", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
].map((facet) => Object.freeze(facet)));
