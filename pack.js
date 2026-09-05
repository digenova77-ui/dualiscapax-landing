function buildPack(p) {
  const eth = p.eth && p.eth.address;
  const scan = eth ? "https://etherscan.io/address/" + eth : null;
  return {
    schema: "unity.deploy.pack.v1",
    generated_at: new Date().toISOString(),
    host: p.host,
    unity_id: p,
    runtime: {
      kind: "host_side_seed",
      platforms: ["browser", "desktop", "phone"],
      dualis_hosts_os: false,
      start: ["open this pack", "keep passphrase off-chain", "pay Fuel if Iris depth is needed"],
    },
    contract: {
      mode: eth ? "lookup_declared_address" : "no_address",
      address: eth || null,
      etherscan: scan,
      deployed_by_this_pack: false,
      passwords_on_chain: false,
    },
    kyc: {
      performed_by_dualis: false,
      status: "UNBOUND",
      note: "KYC is an obliged-FI / firm chair. Dualis is the meter.",
    },
    books: {
      passphrase: p.passphrase_sha256 ? "sha256_only" : "missing",
      passkey: p.passkey ? "device_bound" : "missing",
      raw_secret_in_pack: false,
    },
    auditor: p.llp || { status: "NEED_FIRM" },
    pay: { fuel40: p.grant && p.grant.stripe_fuel40 },
    law: p.law,
  };
}

function packHtml(pack) {
  return "<!doctype html><meta charset=utf-8><title>Unity deploy pack</title>" +
    "<body style=\"font-family:system-ui;background:#0b0d10;color:#e8eef2;max-width:40rem;margin:2rem auto;padding:1rem\">" +
    "<h1>Unity deploy pack</h1>" +
    "<p>Host-side seed. Dualis does not host this OS. Passwords are not in any contract.</p>" +
    "<p>KYC by Dualis: no. Auditor: " + (pack.auditor && pack.auditor.status) + ".</p>" +
    (pack.contract.etherscan ? "<p><a href=\"" + pack.contract.etherscan + "\" style=\"color:#8eb4c8\">Lookup declared address</a></p>" : "<p>No 0x to look up.</p>") +
    "<pre style=\"white-space:pre-wrap;font-size:12px\">" + JSON.stringify(pack, null, 2).replace(/</g, "") + "</pre></body>";
}
