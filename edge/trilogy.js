/**
 * Coin trilogy — eFuse, Merit, UniFi³.
 * Distinct. Contract only. NOT_FOR_EMISSION.
 * UniFi³ = identity. eFuse = energy/resource. Merit = contribution.
 */
export const TRILOGY = {
  protocol: "TRILOGY.EFUSE.MERIT.UNIFI3.v1",
  law: "LAW WINS",
  boundary: "NOT_FOR_EMISSION",
  instruments: {
    efuse: { kind: "energy", role: "resource accounting", ceiling: true, tradeable: false, emits: false },
    merit: { kind: "contribution", role: "earned record", for_sale: false, transferable: false, emits: false },
    unifi3: { kind: "identity", role: "identity evidence", cubed: true, emits: false }
  },
  spend: "none"
};

export function emptyBook() {
  return { seats: {}, order: [] };
}

function seat(book, id) {
  return book.seats[id] || { efuse: 0, merit: 0, unifi3: null, closed: false };
}

export function bindIdentity(book, id, evidence) {
  if (!id || !evidence) return { ok: false, reason: "identity requires evidence" };
  const s = seat(book, id);
  if (s.unifi3 && s.unifi3 !== evidence) return { ok: false, reason: "identity already bound" };
  const next = { ...s, unifi3: evidence };
  return { ok: true, book: { ...book, seats: { ...book.seats, [id]: next } } };
}

export function accountEnergy(book, id, amount) {
  if (!id || !Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "bad energy" };
  const s = seat(book, id);
  if (!s.unifi3) return { ok: false, reason: "no identity" };
  const next = { ...s, efuse: s.efuse + amount };
  return { ok: true, book: { ...book, seats: { ...book.seats, [id]: next } } };
}

export function earnMerit(book, id, proof) {
  if (!id || !proof) return { ok: false, reason: "merit requires proof" };
  const s = seat(book, id);
  if (!s.unifi3) return { ok: false, reason: "no identity" };
  if (s.efuse <= 0) return { ok: false, reason: "no accounted energy" };
  const next = { ...s, merit: s.merit + 1, lastProof: proof };
  return { ok: true, book: { ...book, seats: { ...book.seats, [id]: next } } };
}

export function close(book, id) {
  const s = seat(book, id);
  if (!s.unifi3 || s.merit < 1) return { ok: false, reason: "nothing earned" };
  if (s.closed) return { ok: true, book, order: book.order.indexOf(id) };
  const next = { ...s, closed: true };
  return { ok: true, book: { seats: { ...book.seats, [id]: next }, order: [...book.order, id] }, order: book.order.length };
}

export function sellMerit() { return { ok: false, reason: "merit is not for sale" }; }
export function tradeEfuse() { return { ok: false, reason: "efuse is not a tradeable charm" }; }
export function mint() { return { ok: false, reason: "NOT_FOR_EMISSION" }; }

export function report(book) {
  return { ...TRILOGY, seats: Object.keys(book.seats).length, closed: book.order.length, order: book.order.slice() };
}
