import { handleExplore } from "../../../js/iris-explorer.js";

export async function onRequest(context) {
  return handleExplore(context.request);
}
