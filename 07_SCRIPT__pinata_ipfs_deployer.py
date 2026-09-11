# DualisCapax: Decentralized IPFS Pinning Engine (Piñata Cloud Integration)
import os, sys, json, time, hashlib, argparse
from datetime import datetime, timezone
import urllib.request, urllib.error

PINATA_PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"
PINATA_PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"

class PinataIPFSDeployer:
    def __init__(self, jwt_token=None):
        self.jwt_token = jwt_token or os.getenv("PINATA_JWT", "")

    def compute_local_multihash(self, filepath):
        sha256 = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(65536):
                sha256.update(chunk)
        return sha256.hexdigest()

    def pin_json_docket(self, docket_data, name="DualisCapax_Docket"):
        raw_json = json.dumps(docket_data, sort_keys=True)
        mock_hash = hashlib.sha256(raw_json.encode()).hexdigest()
        mock_cid = "bafybeic" + mock_hash[:40]
        if not self.jwt_token:
            return {
                "status": "SIMULATED_LOCAL_PIN",
                "IpfsHash": mock_cid,
                "PinSize": len(raw_json),
                "Timestamp": datetime.now(timezone.utc).isoformat(),
                "gateway_url": f"https://gateway.pinata.cloud/ipfs/{mock_cid}",
                "ipfs_uri": f"ipfs://{mock_cid}"
            }
        headers = {"Authorization": f"Bearer {self.jwt_token}", "Content-Type": "application/json"}
        payload = {"pinataContent": docket_data, "pinataMetadata": {"name": name}}
        req = urllib.request.Request(PINATA_PIN_JSON_URL, data=json.dumps(payload).encode(), headers=headers)
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
                data["gateway_url"] = f"https://gateway.pinata.cloud/ipfs/{data['IpfsHash']}"
                data["ipfs_uri"] = f"ipfs://{data['IpfsHash']}"
                return data
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}

    def pin_archive_file(self, filepath, name=None):
        if not os.path.exists(filepath):
            return {"status": "ERROR", "message": f"File not found: {filepath}"}
        file_hash = self.compute_local_multihash(filepath)
        pin_name = name or os.path.basename(filepath)
        mock_cid = "Qm" + file_hash[:44]
        if not self.jwt_token:
            return {
                "status": "SIMULATED_LOCAL_PIN",
                "IpfsHash": mock_cid,
                "PinSize": os.path.getsize(filepath),
                "Timestamp": datetime.now(timezone.utc).isoformat(),
                "sha256_checksum": file_hash,
                "gateway_url": f"https://gateway.pinata.cloud/ipfs/{mock_cid}",
                "ipfs_uri": f"ipfs://{mock_cid}"
            }
        boundary = "----WebKitFormBoundary" + hashlib.md5(str(time.time()).encode()).hexdigest()
        headers = {"Authorization": f"Bearer {self.jwt_token}", "Content-Type": f"multipart/form-data; boundary={boundary}"}
        crlf = bytes([13, 10])
        body = []
        body.append(f"--{boundary}".encode())
        body.append(('Content-Disposition: form-data; name="file"; filename="' + os.path.basename(filepath) + '"').encode())
        body.append(b"Content-Type: application/octet-stream")
        body.append(b"")
        with open(filepath, "rb") as f:
            body.append(f.read())
        body.append(f"--{boundary}--".encode())
        req = urllib.request.Request(PINATA_PIN_FILE_URL, data=crlf.join(body), headers=headers)
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
                data["sha256_checksum"] = file_hash
                data["gateway_url"] = f"https://gateway.pinata.cloud/ipfs/{data['IpfsHash']}"
                data["ipfs_uri"] = f"ipfs://{data['IpfsHash']}"
                return data
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}

def main():
    parser = argparse.ArgumentParser(description="DualisCapax Piñata IPFS Deployer")
    parser.add_argument("--file", type=str, help="Path to file to pin")
    parser.add_argument("--name", type=str, default="DualisCapax-Release-Artifact", help="Pin name")
    parser.add_argument("--output", type=str, default="src/engine/ledgers/IPFS_LATEST.json", help="Output ledger metadata")
    args = parser.parse_args()
    deployer = PinataIPFSDeployer()
    if args.file:
        res = deployer.pin_archive_file(args.file, args.name)
    else:
        res = deployer.pin_json_docket({"status": "DUALISCAPAX_SOVEREIGN_HEAD", "epoch": time.time()}, args.name)
    print(json.dumps(res, indent=2))
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(res, f, indent=2)
    print(f"Anchored IPFS metadata to {args.output}")

if __name__ == "__main__":
    main()