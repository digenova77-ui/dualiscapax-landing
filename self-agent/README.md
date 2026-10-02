# Self-model agent

This agent can report its own state. It is not conscious, and it cannot rewrite the DCLM kernel.

It reads `https://dualiscapax.ai/api/v2/capabilities` and posts a bounded payload to `/api/v2/compute`. If `arbitraryCompute` is false, it records that and stops. A receipt is not a write.
