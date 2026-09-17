#!/usr/bin/env python3
"""
Pulls all files from the FACTORY_BULLETIN_BOARD Google Drive folder
(read-only) and writes them to a local directory so a GitHub Actions
job can read them like normal files during a run.

Auth: Workload Identity Federation -- no key file, ever. The GitHub
      Actions job authenticates via the google-github-actions/auth
      step (see the .yml alongside this script), which drops
      short-lived credentials into the environment. This script just
      picks those up automatically via Application Default Credentials.
      The service account is granted VIEWER on the folder only --
      never grant it Editor/Writer access.

Usage:
  python read_bulletin_board.py --folder-id 1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4 --out ./bulletin
"""

import argparse
import io
import json
import os
import sys

import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# Read-only scope, deliberately. Do not widen this.
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

GOOGLE_DOC_EXPORT_MIME = "text/markdown"  # export Google Docs as markdown-ish text


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


def safe_filename(name):
    return "".join(c if c.isalnum() or c in " ._-()[]" else "_" for c in name)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder-id", required=True, help="Drive folder ID (stable, use this not the name)")
    parser.add_argument("--out", default="./bulletin", help="Local output directory")
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    service = get_drive_service()
    files = list_folder(service, args.folder_id)

    manifest = []
    for f in files:
        content = download_file(service, f["id"], f["mimeType"])
        entry = {
            "id": f["id"],
            "name": f["name"],
            "mimeType": f["mimeType"],
            "modifiedTime": f["modifiedTime"],
            "downloaded": content is not None,
        }
        manifest.append(entry)

        if content is None:
            continue

        out_name = safe_filename(f["name"])
        if f["mimeType"] == "application/vnd.google-apps.document" and not out_name.lower().endswith(".md"):
            out_name += ".md"

        with open(os.path.join(args.out, out_name), "wb") as fh:
            fh.write(content)

    with open(os.path.join(args.out, "_manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)

    print(f"Pulled {len(files)} item(s) from folder {args.folder_id} into {args.out}/")


if __name__ == "__main__":
    main()
