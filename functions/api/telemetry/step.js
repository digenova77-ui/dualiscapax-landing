import { handleStep } from "../../../js/amsterdam-telemetry.js";

export async function onRequest(context) {
  return handleStep(context.request, context.env || {});
}
