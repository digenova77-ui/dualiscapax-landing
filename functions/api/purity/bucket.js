import { handleBucket } from "../../../js/purity-umpire.js";

export async function onRequest(context) {
  return handleBucket(context.request);
}
