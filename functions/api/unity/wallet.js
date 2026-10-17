import { handleWallet } from "../../../js/unity-wallet.js";

export async function onRequest(context) {
  return handleWallet(context.request);
}
