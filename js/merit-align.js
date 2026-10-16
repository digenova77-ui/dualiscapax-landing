/**
 * Merit price is linked to Unity through UniFi³.
 * UniFi³ connects to eFuse.
 * Usage and the gate stay shut unless the four readings are the same number
 * and that number is 1. The published joule is null, so the gate stays shut.
 * Look stays free. This module does not open a till.
 */

export const LINK = "Merit price is Unity through UniFi³. UniFi³ connects to eFuse.";

export function unifiCubed(unity) {
  if (typeof unity !== "number" || !Number.isFinite(unity)) return null;
  return unity * unity * unity;
}

function reading(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function align(input) {
  const src = input || {};
  const unity = reading(src.unity);
  const factor = src.unifi === undefined ? unity : reading(src.unifi);
  const meritPrice = reading(src.meritPrice);
  const efuse = reading(src.efuse);
  const cubed = unifiCubed(factor);
  const linked = cubed !== null
    && meritPrice === unity
    && meritPrice === cubed
    && efuse === cubed;
  const jouleRead = reading(src.joule) !== null;
  const aligned = linked && jouleRead;
  const open = aligned && unity === 1;
  let reason = "misaligned";
  if (linked && !jouleRead) reason = "joule-null";
  else if (linked && unity !== 1) reason = "not-one";
  else if (open) reason = "aligned";
  return {
    link: LINK,
    aligned,
    open,
    usage: open ? "admit" : "closed",
    joule: jouleRead ? src.joule : null,
    reason,
    chain: {
      meritPrice,
      unity,
      unifiCubed: cubed,
      efuse
    }
  };
}

export function published() {
  return align({ unity: null, unifi: null, meritPrice: null, efuse: null, joule: null });
}

export function publishedResponse() {
  return new Response(JSON.stringify(published()), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
