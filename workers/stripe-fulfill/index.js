/**
 * Entrypoint alias. Cloudflare Builds / wrangler.toml may point here.
 * Real fulfill logic lives in worker.js so a stub cannot grant a generic token.
 */
export { default } from "./worker.js";
export { SKU_GRANT, AMOUNT_CAD_CENTS_TO_SKU, skuFromSession, merchandiseJacket } from "./worker.js";
