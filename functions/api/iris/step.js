import { handleStep } from "../../../js/dreamer-doer.js";

export async function onRequest(context) {
  return handleStep(context.request);
}
