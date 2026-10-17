import { handleCulture } from "../../../js/bot-culture.js";

export async function onRequest(context) {
  return handleCulture(context.request);
}
