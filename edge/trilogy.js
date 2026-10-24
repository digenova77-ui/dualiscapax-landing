/**
 * Coin trilogy — contract only.
 * Merit, Standing, Residual.
 * NOT_FOR_EMISSION. Not a security. Not legal tender.
 */
export const TRILOGY = {
  protocol: "TRILOGY.CONTRACT.v1",
  law: "LAW WINS",
  boundary: "NOT_FOR_EMISSION",
  instruments: {
    merit: { kind: "proof", transferable: false, for_sale: false, emits: false },
    standing: { kind: "callable", emission_source: "origin only", emits: false },
    residual: { kind: "capacity", prepaid: true, unused_stays: true, emits: false }
  },
  spend: "none"
};

export function emptyBook() {
  return { seats: {}, closed: [] };
}

function seat(book, id) {
  return book.seats[id] || { merit: 0, standing: 0, residual: 0, locked: 0, burned: 0, closed: false };
}

export function lock(book, id, amount) {
  if (!id || !Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "bad lock" };
  const s = seat(book, id);
  if (s.closed) return { ok: false, reason: "already closed" };
  const next = { ...s, residual: s.residual + amount, locked: s.locked + amount };
  return { ok: true, book: { ...book, seats: { ...book.seats, [id]: next } } };
}

export function burn(book, id, amount) {
  if (!id || !Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "bad burn" };
  const s = seat(book, id);
  if (s.closed) return { ok: false, reason: "already closed" };
  if (s.residual < amount) return { ok: false, reason: "insufficient residual" };
  const next = { ...s, residual: s.residual - amount, burned: s.burned + amount };
  return { ok: true, book: { ...book, seats: { ...book.seats, [id]: next } } };
}

export function close(book, id) {
  const s = seat(book, id);
  if (!s.locked) return { ok: false, reason: "nothing locked" };
  if (s.closed) return { ok: true, book, order: book.closed.indexOf(id) };
  const next = { ...s, closed: true };
  return {
    ok: true,
    book: { seats: { ...book.seats, [id]: next }, closed: [...book.closed, id] },
    order: book.closed.length
  };
}

export function mint() {
  return { ok: false, reason: "NOT_FOR_EMISSION" };
}

export function sellMerit() {
  return { ok: false, reason: "merit is not for sale" };
}

export function transferStanding() {
  return { ok: false, reason: "standing emission is origin only" };
}

export function report(book) {
  return {
    ...TRILOGY,
    seats: Object.keys(book.seats).length,
    closed: book.closed.length,
    order: book.closed.slice()
  };
}
