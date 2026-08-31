#!/usr/bin/env python3
import os
import sys
import hashlib
import json

def generate_manifest():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    manifest = {"manifest_version": "1.0", "algorithm": "SHA-256", "files": {}}
    
    for root, dirs, files in os.walk(base):
        for file in files:
            if file == "manifest.json":
                continue
            path = os.path.join(root, file)
            rel_path = os.path.relpath(path, base)
            with open(path, "rb") as f:
                content = f.read()
                sha = hashlib.sha256(content).hexdigest()
                manifest["files"][rel_path] = {
                    "size_bytes": len(content),
                    "sha256": sha
                }
                
    manifest_path = os.path.join(base, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Generated encyclopedia manifest at {manifest_path} ({len(manifest['files'])} files indexed).")

if __name__ == "__main__":
    generate_manifest()
