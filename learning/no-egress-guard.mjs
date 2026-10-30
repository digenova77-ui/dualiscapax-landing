export function createNoEgressFetch() {
  return async function blockedFetch() {
    const error = new Error("LOCAL_NETWORK_EGRESS_BLOCKED");
    error.code = "LOCAL_NETWORK_EGRESS_BLOCKED";
    throw error;
  };
}

globalThis.fetch = createNoEgressFetch();
