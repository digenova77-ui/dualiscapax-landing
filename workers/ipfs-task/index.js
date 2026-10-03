const TASK = {
  task: "dns-cname",
  zone: "dualiscapax.ai",
  type: "CNAME",
  name: "ipfs",
  target: "white-characteristic-ptarmigan-364.mypinata.cloud",
  proxy: false,
  cid: "bafybeian5fkku2cu47iusk3iyt3piwbpms7ri4grkneqiyxtqlzoxag2uy"
};

export default {
  async fetch() {
    return Response.json({ uploaded: false, task: TASK, reason: "serve-only" });
  }
};
