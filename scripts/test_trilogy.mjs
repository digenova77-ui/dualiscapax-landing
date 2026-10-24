import { emptyBook, lock, burn, close, mint, sellMerit, transferStanding, report } from "../edge/trilogy.js";

let book = emptyBook();
const a = lock(book, "seat:a", 10);
if (!a.ok) process.exit(1);
book = a.book;
const b = burn(book, "seat:a", 6);
if (!b.ok || b.book.seats["seat:a"].residual !== 4) process.exit(1);
book = b.book;
const c = close(book, "seat:a");
if (!c.ok || c.order !== 0) process.exit(1);
book = c.book;
if (mint().ok || sellMerit().ok || transferStanding().ok) process.exit(1);
const over = burn(book, "seat:a", 1);
if (over.ok || over.reason !== "already closed") process.exit(1);
console.log(JSON.stringify(report(book), null, 2));
