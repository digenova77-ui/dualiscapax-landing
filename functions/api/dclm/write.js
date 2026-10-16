import { handleWrite } from "../../../js/dclm-write.js";

export async function onRequest(context) {
  return handleWrite(context.request);
}
