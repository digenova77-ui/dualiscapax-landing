/** Seal catalog + house meter. Paper. Issued no. Tags are null until SET. */

export const ISSUED = false;

export function loadPlate(json) {
  return {
    issued: json.issued === true,
    houseReceived: Number(json.houseReceived) || 0,
    helpers: Array.isArray(json.helpers) ? json.helpers.slice() : [],
    seals: (json.seals || []).map((s) => ({
      id: String(s.id),
      kind: s.kind === "medical" ? "medical" : "engineering",
      title: String(s.title || s.id),
      tag: s.tag == null ? null : Number(s.tag),
      ready: s.ready === true,
      received: Number(s.received) || 0,
      kitchen: String(s.kitchen || "named-class"),
      example: s.example === true,
      labeledOnly: s.labeledOnly === true,
    })),
  };
}

/** Untagged gift moves the house. Labeled gift moves only that seal. */
export function gift(plate, amount, label) {
  const n = Number(amount);
  if (!(n > 0)) return { ok: false, why: "amount must be > 0" };
  if (!label) {
    plate.houseReceived += n;
    return { ok: true, where: "house", amount: n };
  }
  const seal = plate.seals.find((s) => s.id === label);
  if (!seal) return { ok: false, why: "no seal for that label" };
  seal.received += n;
  return { ok: true, where: seal.id, amount: n };
}

export function seenFor(plate, seal) {
  if (seal.labeledOnly) return seal.received;
  return seal.received + plate.houseReceived;
}

export function canOpen(plate, seal) {
  if (plate.issued !== true && seal.tag != null && seal.tag > 0) {
    // Inflow can still be gifts before issue. Issue is not required to open a gift-funded seal.
  }
  if (seal.tag == null) return { open: false, why: "tag is not set" };
  if (!(seal.tag > 0)) return { open: false, why: "tag must be > 0" };
  if (!seal.ready) return { open: false, why: "science lock is not ready" };
  const seen = seenFor(plate, seal);
  if (seen < seal.tag) return { open: false, why: "purse lock: seen < tag", seen, tag: seal.tag };
  return { open: true, why: "both locks", seen, tag: seal.tag, kitchen: seal.kitchen };
}

/** Cheapest ready seal whose tag is set and funded. */
export function ladder(plate) {
  return plate.seals
    .filter((s) => s.tag != null && s.tag > 0)
    .slice()
    .sort((a, b) => a.tag - b.tag)
    .map((s) => ({ id: s.id, tag: s.tag, ready: s.ready, seen: seenFor(plate, s), ...canOpen(plate, s) }));
}

export function nextDoor(plate) {
  const row = ladder(plate).find((r) => r.open);
  return row || null;
}

export function markHelper(plate, sitting, sealId, amount) {
  plate.helpers.push({ sitting: String(sitting), seal: String(sealId), amount: Number(amount) || 0 });
  return plate.helpers.length;
}
