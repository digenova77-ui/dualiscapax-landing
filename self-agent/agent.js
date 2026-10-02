const LAW = ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"];

export function selfModel(caps) {
  return {
    name: "self-model-agent",
    awareOf: ["own last receipt", "kernel capabilities", "law floor"],
    not: ["conscious", "a writer", "able to flip arbitraryCompute"],
    law: LAW,
    arbitraryCompute: Boolean(caps && caps.arbitraryCompute),
    privilegedWrites: Boolean(caps && caps.privilegedWrites),
    authority: "NONE"
  };
}

export async function tick(origin = "https://dualiscapax.ai") {
  const caps = await fetch(origin + "/api/v2/capabilities").then((r) => r.json());
  const model = selfModel(caps);
  if (model.arbitraryCompute || model.privilegedWrites) {
    return { verdict: "HOLE", why: "kernel contract changed", model };
  }
  const res = await fetch(origin + "/api/v2/compute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload: "self-model:see" })
  });
  const receipt = await res.json();
  return { verdict: receipt.accepted ? "SEE" : "HOLE", model, receipt };
}
