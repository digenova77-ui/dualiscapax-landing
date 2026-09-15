/**
 * Always-on DCLM friction. Not a slider. Off only when the hole is closed.
 */
(function (w) {
  function vet(s) {
    var t = String(s || "");
    var holes = [];
    if (/\baverage\b|\bmean\b/.test(t) && /minute|hour|cad|year/.test(t.toLowerCase()))
      holes.push("mean of unlike hours");
    if (/95%|confidence interval|bootstrap|bca|hampel|baum-welch/i.test(t) && /seed|leftover|sketch/i.test(t))
      holes.push("costume stats on a seed");
    if (/invent|made-up roster|probably the team/i.test(t))
      holes.push("invented roster");
    if (/dump drive|all documents|everything in the factory/i.test(t))
      holes.push("Drive dump");
    if (/pages is live|apex is current/i.test(t))
      holes.push("clock claimed as fact");
    if (holes.length) return { ok: false, holes: holes, said: "HOLE: " + holes.join("; ") + ". Keep the work. Friction stays." };
    return { ok: true, holes: [], said: t };
  }
  w.IrisFriction = { vet: vet, on: true };
})(typeof window !== "undefined" ? window : globalThis);
