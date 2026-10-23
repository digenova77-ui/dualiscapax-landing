/**
 * Deterministic-first compute arbitration and transparent Joule accounting.
 * No external price is assumed. Probabilistic inference remains a separate lane.
 */
const MAX_EXPR_LENGTH = 256;
const MAX_TOKENS = 128;
const MAX_ABS_VALUE = 1e15;

export function evaluateExactArithmetic(input) {
  if (typeof input !== "string" || input.length === 0 || input.length > MAX_EXPR_LENGTH) return null;
  const expression = input.trim();
  if (!expression || !/^[\d\s()+*/.%-]+$/.test(expression)) return null;
  // Require at least one operator; plain numbers are not classified as calculations.
  if (!/[+*/%-]/.test(expression) && !/\d\s*-\s*\d/.test(expression)) return null;
  const tokens = expression.match(/\d+(?:\.\d+)?|[()+*/%-]/g);
  if (!tokens || tokens.join("").replace(/\s/g, "") !== expression.replace(/\s/g, "") || tokens.length > MAX_TOKENS) return null;
  let pos = 0;
  const peek = () => tokens[pos];
  const take = () => tokens[pos++];
  function number(value) {
    if (!Number.isFinite(value) || Math.abs(value) > MAX_ABS_VALUE) throw new Error("out-of-range");
    return value;
  }
  function primary() {
    const t = take();
    if (t === "(") {
      const value = sum();
      if (take() !== ")") throw new Error("unbalanced");
      return value;
    }
    if (t === "+" || t === "-") return number((t === "-" ? -1 : 1) * primary());
    if (!t || !/^\d/.test(t)) throw new Error("expected-number");
    return number(Number(t));
  }
  function product() {
    let value = primary();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = take();
      const rhs = primary();
      if ((op === "/" || op === "%") && rhs === 0) throw new Error("division-by-zero");
      value = number(op === "*" ? value * rhs : op === "/" ? value / rhs : value % rhs);
    }
    return value;
  }
  function sum() {
    let value = product();
    while (peek() === "+" || peek() === "-") {
      const op = take();
      const rhs = product();
      value = number(op === "+" ? value + rhs : value - rhs);
    }
    return value;
  }
  try {
    const result = sum();
    if (pos !== tokens.length || !Number.isFinite(result)) return null;
    return Object.is(result, -0) ? 0 : result;
  } catch {
    return null;
  }
}

/**
 * Conservative routing: deterministic math only when the entire input is a
 * valid arithmetic expression. Everything else goes to probabilistic inference.
 * Trinity authorization is still required for either lane.
 */
export function arbitrateCompute(input) {
  const exact = evaluateExactArithmetic(input);
  if (exact !== null) return { lane: "deterministic", action: "iris.compute.deterministic", result: String(exact), provider_required: false };
  return { lane: "probabilistic", action: "iris.inference", result: null, provider_required: true };
}

/**
 * Transparent accounting. This is an accounting estimate unless the energy
 * value is backed by a calibrated meter; it does not invent the energy index.
 */
export function priceCompute({ joules, cadPerJoule, providerCad = 0, serviceCad = 0, measurement = "measured", indexId = null, indexTimestamp = null }) {
  const finiteNonnegative = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
  if (!finiteNonnegative(joules) || !finiteNonnegative(providerCad) || !finiteNonnegative(serviceCad)) {
    return { status: "INVALID_INPUT", totalCad: null };
  }
  if (!finiteNonnegative(cadPerJoule) || typeof indexId !== "string" || !indexId.trim() ||
      typeof indexTimestamp !== "string" || !Number.isFinite(Date.parse(indexTimestamp))) {
    return { status: measurement === "estimated" ? "ESTIMATED_UNPRICED" : "UNPRICED", totalCad: null };
  }
  if (measurement !== "measured" && measurement !== "estimated") {
    return { status: "INVALID_MEASUREMENT_CLASS", totalCad: null };
  }
  // Normalize binary floating-point noise while retaining sub-cent precision.
  const money = (value) => Math.round((value + Number.EPSILON) * 1e10) / 1e10;
  const energyCad = money(joules * cadPerJoule);
  const totalCad = money(energyCad + providerCad + serviceCad);
  if (!Number.isFinite(totalCad)) return { status: "INVALID_INPUT", totalCad: null };
  return {
    // The helper has no authority to verify a meter or settle a charge.
    // A caller-supplied "measured" label is not evidence of calibrated metering.
    status: measurement === "measured" ? "PRICED_UNVERIFIED" : "PRICED_ESTIMATED",
    joules,
    measurement,
    indexId,
    indexTimestamp,
    cadPerJoule,
    energyCad,
    providerCad,
    serviceCad,
    totalCad,
    currency: "CAD",
  };
}
