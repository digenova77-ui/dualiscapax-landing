import { handleWork } from "../../../js/autonomy-work.js";

export async function onRequest(context) {
  return handleWork(context.request);
}
