import { gradeClaim, report } from "../edge/justice.js";
const good = gradeClaim({ look: true, proof: "work:closed" });
if (!good.ok) process.exit(1);
const cases = [
  [{ look: true, pay: 1 }, "looking is free"],
  [{ merit: true }, "merit requires proof"],
  [{ sell: "merit" }, "merit is not for sale"],
  [{ trade: "efuse" }, "efuse is not a tradeable charm"],
  [{ emit: true }, "NOT_FOR_EMISSION"],
  [{ worth: 10 }, "worth is not scored"],
  [{ tribe: "a" }, "no preferred tribe"]
];
for (const [c, reason] of cases) {
  const r = gradeClaim(c);
  if (r.ok || r.reason !== reason) {
    console.error(c, r);
    process.exit(1);
  }
}
console.log(JSON.stringify(report(), null, 2));
