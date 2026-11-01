import { test } from "node:test";
import assert from "node:assert/strict";
import { authenticationJSON, creationOptions, decodeBase64Url, encodeBase64Url, registrationJSON, requestOptions } from "../client.js";

test("base64url conversion round-trips bytes", () => {
  const bytes = new Uint8Array([0, 1, 2, 127, 128, 255]);
  assert.deepEqual(decodeBase64Url(encodeBase64Url(bytes)), bytes);
});

test("registration options convert binary challenge, user ID and exclusions", () => {
  const converted = creationOptions({
    challenge: "AQID",
    user: { id: "BAUG", name: "member", displayName: "Member" },
    excludeCredentials: [{ id: "BwgJ", type: "public-key" }],
  });
  assert.deepEqual(Array.from(converted.challenge), [1, 2, 3]);
  assert.deepEqual(Array.from(converted.user.id), [4, 5, 6]);
  assert.deepEqual(Array.from(converted.excludeCredentials[0].id), [7, 8, 9]);
});

test("authentication options convert challenge and allowed credential IDs", () => {
  const converted = requestOptions({ challenge: "AQID", allowCredentials: [{ id: "BAUG" }] });
  assert.deepEqual(Array.from(converted.challenge), [1, 2, 3]);
  assert.deepEqual(Array.from(converted.allowCredentials[0].id), [4, 5, 6]);
});

test("registration response serializes attestation data as base64url", () => {
  const result = registrationJSON({
    id: "credential",
    rawId: new Uint8Array([1, 2]).buffer,
    type: "public-key",
    response: {
      clientDataJSON: new Uint8Array([3]).buffer,
      attestationObject: new Uint8Array([4, 5]).buffer,
      getTransports: () => ["internal"],
    },
    getClientExtensionResults: () => ({}),
  });
  assert.equal(result.rawId, "AQI");
  assert.equal(result.response.clientDataJSON, "Aw");
  assert.equal(result.response.attestationObject, "BAU");
  assert.deepEqual(result.response.transports, ["internal"]);
});

test("authentication response serializes signed assertion fields", () => {
  const result = authenticationJSON({
    id: "credential",
    rawId: new Uint8Array([1]).buffer,
    type: "public-key",
    response: {
      clientDataJSON: new Uint8Array([2]).buffer,
      authenticatorData: new Uint8Array([3]).buffer,
      signature: new Uint8Array([4]).buffer,
      userHandle: null,
    },
    getClientExtensionResults: () => ({}),
  });
  assert.equal(result.response.clientDataJSON, "Ag");
  assert.equal(result.response.authenticatorData, "Aw");
  assert.equal(result.response.signature, "BA");
  assert.equal(result.response.userHandle, null);
});
