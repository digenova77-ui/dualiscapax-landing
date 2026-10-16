import { handleExchange } from "../../../js/x402-exchange.js";

export async function onRequest(context) {
  return handleExchange(context.request, { env: context.env || {} });
}
