/**
 * PUEL rooted verifier v0.1.
 *
 * One entry point for verifying a root-signed registry and a signed evidence
 * bundle. The root public key must be pinned by the deployment/operator.
 * This module never executes work, authorizes an operation, or settles assets.
 */
import { verifyPuelBundle } from "./puel-bundle-verifier.mjs";
import { verifyPuelTrustRegistry } from "./puel-trust-registry.mjs";

export async function verifyRootedPuelBundle({
  bundle,
  attestations,
  registry,
  rootPublicKeySpkiBase64,
  now = Date.now(),
  maxAgeMs = 86400000,
  minimumRegistryVersion,
}) {
  // A default floor of 1 is not rollback protection: callers must supply the
  // floor from trusted monotonic state (for example, protected durable storage).
  if (!Number.isSafeInteger(minimumRegistryVersion) || minimumRegistryVersion < 1) {
    return {
      valid: false,
      status: "PUEL_REJECTED",
      proof_claim: "NOT_PROVEN",
      errors: ["trust-registry-version-floor-unconfigured"],
      trust_registry: { status: "NOT_CHECKED", valid: false },
      verified_roles: [],
    };
  }

  const trust = await verifyPuelTrustRegistry({
    registry,
    rootPublicKeySpkiBase64,
    now,
  });
  if (!trust.valid) {
    return {
      valid: false,
      status: "PUEL_REJECTED",
      proof_claim: "NOT_PROVEN",
      errors: trust.errors.map((error) => "trust-" + error),
      trust_registry: {
        status: trust.status,
        valid: false,
      },
      verified_roles: [],
    };
  }

  if (trust.registry_version < minimumRegistryVersion) {
    return {
      valid: false,
      status: "PUEL_REJECTED",
      proof_claim: "NOT_PROVEN",
      errors: ["trust-registry-version-rollback"],
      trust_registry: {
        status: trust.status,
        valid: true,
        registry_version: trust.registry_version,
      },
      verified_roles: [],
    };
  }

  const verification = await verifyPuelBundle({
    bundle,
    attestations,
    trustedKeys: trust.trusted_keys,
    now,
    maxAgeMs,
  });
  const valid = verification.valid;
  return {
    ...verification,
    valid,
    status: valid ? "ROOTED_PUEL_EVIDENCE_VERIFIED" : "PUEL_REJECTED",
    proof_claim: valid
      ? "SIGNATURES_VERIFIED_UNDER_ROOT_SIGNED_REGISTRY"
      : "NOT_PROVEN",
    trust_scope: "pinned-root-public-key-and-root-signed-registry",
    trust_registry: {
      status: trust.status,
      valid: true,
      registry_version: trust.registry_version,
      expires_at: trust.expires_at,
      revoked_key_ids: trust.revoked_key_ids,
    },
  };
}
