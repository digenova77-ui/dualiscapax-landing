/**
 * House pre-sign packet. Dualis already signed its side.
 * The other party is UNBOUND until device bind.
 * Targeted is not signed. Founder plaques stay unpublished.
 * Current as of: 2026-09-01
 */
(function (g) {
  var VERSION = "house-sign-v1-20260901";
  var PACKET = {
    packet: "ED-AGR-20260901-HOUSE-PRESIGN-V1",
    entity: "DualisCapax Inc. / 1001718450 ONTARIO INCORPORATED",
    stamp: "2026-09-01T19:22:00Z",
    state: "HOUSE_SIGNED",
    counterparty_default: "UNBOUND",
    public_claim: false,
    instruments: [
      { id: "AGR-LOOK", name: "Look", sha256: "7156b45df9946a5e1695662d5c7244d3380d886bda5a28e5a7fa3abea0a64583" },
      { id: "AGR-DATA-STAY", name: "Books stay", sha256: "660eced9e3550db993b76aa878efe39fd416e716eeddcdad30cde3f5011f188a" },
      { id: "AGR-BIND", name: "Device bind", sha256: "d835773d4a64bd55b938fc1a0414fec56b94a9d5abe3af641a833069402c05d2" },
      { id: "AGR-FUEL", name: "Fuel", sha256: "ff8cf485ec4f08ff5f9c863214fa124a1c66ee565390e8c9dc9b6085e397589a" },
      { id: "AGR-SEAT", name: "Seat", sha256: "ee17a79e58ad452618f40e11b29c2a139bbc073559efa898f6324a4d458b66ac" },
      { id: "AGR-INVERT", name: "Invert or nothing owed", sha256: "4c3805386352c43cf1dd991a74f78187a79764d98d7ad3ad5e72b8ffa45809ec" },
      { id: "AGR-CROWN", name: "Wet-ink limit", sha256: "93f9584d6188b632e08a14fca292f0ed15bd461bcf5276abb4743381919060ef" }
    ]
  };

  function ids() {
    return PACKET.instruments.map(function (row) { return row.id; });
  }

  function receipt() {
    return {
      v: VERSION,
      packet: PACKET.packet,
      entity: PACKET.entity,
      stamp: PACKET.stamp,
      house_state: PACKET.state,
      counterparty: PACKET.counterparty_default,
      public_claim: false,
      instrument_ids: ids()
    };
  }

  function attach(rec) {
    rec = rec || {};
    rec.house = receipt();
    rec.note = rec.note || "House already signed. Targeted is not a signed deal.";
    return rec;
  }

  g.DCHouse = {
    version: VERSION,
    packet: PACKET,
    ids: ids,
    receipt: receipt,
    attach: attach
  };
})(typeof window !== "undefined" ? window : globalThis);
