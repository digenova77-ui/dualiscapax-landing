#!/usr/bin/env python3
"""
Pulls all files from the FACTORY_BULLETIN_BOARD Google Drive folder
(read-only) and writes them to a local directory so a GitHub Actions
job can read them like normal files during a run.

Auth: Workload Identity Federation -- no key file, ever. The GitHub
      Actions job authenticates via the google-github-actions/auth
      step, which drops short-lived credentials into the environment.
      This script picks those up via Application Default Credentials.
      The service account is granted VIEWER on the folder only --
      never grant it Editor/Writer access.

Usage:
  python read_bulletin_board.py --folder-id 1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4 --out ./bulletin
"""

import argparse
import hashlib
import io
import json
import os
import sys

import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# Read-only scope, deliberately. Do not widen this.
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

GOOGLE_DOC_EXPORT_MIME = "text/markdown"


def get_drive_service():
    try:
        creds, _ = google.auth.default(scopes=SCOPES)
    except google.auth.exceptions.DefaultCredentialsError:
        print(
            "ERROR: no credentials found. Make sure the "
            "google-github-actions/auth step ran before this script.",
            file=sys.stderr,
        )
        sys.exit(1)
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def list_folder(service, folder_id):
    query = f"'{folder_id}' in parents and trashed = false"
    files = []
    page_token = None
    while True:
        resp = (
            service.files()
            .list(
                q=query,
                fields="nextPageToken, files(id, name, mimeType, modifiedTime)",
                pageToken=page_token,
            )
            .execute()
        )
        files.extend(resp.get("files", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return files


def download_file(service, file_id, mime_type):
    if mime_type == "application/vnd.google-apps.document":
        request = service.files().export_media(fileId=file_id, mimeType=GOOGLE_DOC_EXPORT_MIME)
    elif mime_type.startswith("application/vnd.google-apps"):
        return None
    else:
        request = service.files().get_media(fileId=file_id)

    buf = io.BytesIO()
    downloader = MediaIoBaseDownload(buf, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return buf.getvalue()


def safe_filename(name, file_id):
    raw = "".join(c if c.isalnum() or c in "._-()[]" else "_" for c in (name or ""))
    while ".." in raw:
        raw = raw.replace("..", "_")
    raw = raw.strip(" .")
    if not raw or raw in {".", ".."}:
        raw = "unnamed"
    prefix = (file_id or "id")[:8]
    out = f"{prefix}_{raw}"
    return out[:180]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder-id", required=True, help="Drive folder ID (stable, use this not the name)")
    parser.add_argument("--out", default="./bulletin", help="Local output directory")
    args = parser.parse_args()

    out_dir = os.path.abspath(args.out)
    os.makedirs(out_dir, exist_ok=True)
    service = get_drive_service()
    files = list_folder(service, args.folder_id)

    manifest = []
    keep = {"_manifest.json"}
    for f in files:
        content = download_file(service, f["id"], f["mimeType"])
        entry = {
            "id": f["id"],
            "name": f["name"],
            "mimeType": f["mimeType"],
            "modifiedTime": f["modifiedTime"],
            "downloaded": content is not None,
            "sha256": hashlib.sha256(content).hexdigest() if content else None,
            "out_name": None,
        }

        if content is not None:
            out_name = safe_filename(f["name"], f["id"])
            if f["mimeType"] == "application/vnd.google-apps.document" and not out_name.lower().endswith(".md"):
                out_name += ".md"
            dest = os.path.abspath(os.path.join(out_dir, out_name))
            if os.path.commonpath([out_dir, dest]) != out_dir:
                print(f"ERROR: refused path escape for {f['name']!r}", file=sys.stderr)
                sys.exit(1)
            with open(dest, "wb") as fh:
                fh.write(content)
            entry["out_name"] = os.path.basename(dest)
            keep.add(os.path.basename(dest))

        manifest.append(entry)

    for existing in os.listdir(out_dir):
        if existing not in keep:
            path = os.path.join(out_dir, existing)
            if os.path.isfile(path):
                os.remove(path)

    with open(os.path.join(out_dir, "_manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)
        fh.write("\n")

    print(f"Pulled {len(files)} item(s) from folder {args.folder_id} into {args.out}/")


if __name__ == "__main__":
    main()
