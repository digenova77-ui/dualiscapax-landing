import { publishedResponse } from "../../../js/iris-attack.js";

export async function onRequest() {
  return publishedResponse();
}
