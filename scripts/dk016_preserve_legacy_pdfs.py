#!/usr/bin/env python3
"""DK01.6: Copy three legacy PUBLIC Supabase PDFs byte-for-byte into PRIVATE R2.
No DB writes, no changes to the public URLs, no R2 publication.
GitHub Actions provides Cloudflare credentials through its existing secrets.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import pathlib
import subprocess
import sys
import tempfile
import urllib.request

SOURCE_BASE = (
    "https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/"
    "dao-su-documents/"
)
BUCKET = "gdd-dau-xua-cua-dao"
# Checked against storage.objects, 2026-11-17; paths and byte lengths are fixed.
PDFS = (
    ("documents/1794684373312-e808f501-1bba-458d-b82f-f5f096479426.pdf", 10098129),
    ("documents/1794684462288-fc373424-39bf-4d8d-950c-2195aa01a603.pdf", 9932650),
    ("media/1794860043784-52816aff-f9f7-4790-9e91-d87d7a86fc96.pdf", 34412351),
)


def sha256(path: pathlib.Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    length = 0
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
            length += len(chunk)
    return digest.hexdigest(), length


def fetch_original(path: str, expected: int, output: pathlib.Path) -> tuple[str, int]:
    url = SOURCE_BASE + path
    request = urllib.request.Request(
        url, headers={"User-Agent": "GDD-DK016-Archive-Integrity/1.0", "Cache-Control": "no-cache"}
    )
    with urllib.request.urlopen(request, timeout=60) as response, output.open("wb") as f:
        if response.status != 200:
            raise RuntimeError(f"Source returned HTTP {response.status}: {path}")
        if response.url.split("/storage/v1/object/")[0] != SOURCE_BASE.split("/storage/v1/object/")[0]:
            raise RuntimeError("Refusing cross-origin redirect for source PDF")
        total = 0
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > expected:
                raise RuntimeError(f"Supabase source size changed or overflowed: {path}")
            f.write(chunk)
    if total != expected:
        raise RuntimeError(f"Supabase source length mismatch for {path}: {total} != {expected}")
    with output.open("rb") as f:
        if b"%PDF-" not in f.read(1024):
            raise RuntimeError(f"Expected PDF header missing: {path}")
    digest, actual = sha256(output)
    if actual != expected:
        raise RuntimeError("Downloaded file changed while hashing")
    return digest, actual


def wrangler(*arguments: str) -> None:
    command = ["npx", "--yes", "wrangler@4.159.0", "r2", "object", *arguments]
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=False)
    if result.returncode:
        detail = (result.stderr or result.stdout or "").strip()[-1100:]
        raise RuntimeError(f"Wrangler R2 command failed (exit {result.returncode}): {detail}")


def preserve(path: str, expected: int, directory: pathlib.Path, source_only: bool) -> None:
    source_file = directory / "source.pdf"
    verified_file = directory / "r2-verified.pdf"
    if source_file.exists():
        source_file.unlink()
    if verified_file.exists():
        verified_file.unlink()
    source_hash, source_len = fetch_original(path, expected, source_file)
    # Content-addressed, isolated private backup. NEVER touch Worker originals/ or pages/.
    object_key = f"legacy-private-dk016/{source_hash}/{path.rsplit('/', 1)[-1]}"
    print(f"SOURCE OK: {path}; bytes={source_len}; SHA256={source_hash}", flush=True)
    if source_only:
        return
    object_path = BUCKET + "/" + object_key
    wrangler("put", object_path, "--remote", "--file", str(source_file),
             "--content-type", "application/pdf", "--force")
    wrangler("get", object_path, "--remote", "--file", str(verified_file))
    verified_hash, verified_len = sha256(verified_file)
    if verified_len != source_len or verified_hash != source_hash:
        raise RuntimeError(
            f"INTEGRITY FAILURE: private R2 does not match source: {path}; "
            f"source={source_hash}/{source_len}; r2={verified_hash}/{verified_len}"
        )
    print(f"R2 PRIVATE BACKUP VERIFIED: {object_key}; bytes={verified_len}; SHA256={verified_hash}", flush=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-only", action="store_true", help="Check public sources without R2 writes")
    args = parser.parse_args()
    if not args.source_only:
        if not os.getenv("CLOUDFLARE_API_TOKEN") or not os.getenv("CLOUDFLARE_ACCOUNT_ID"):
            raise RuntimeError("Missing Cloudflare action secrets; NO files copied")
    with tempfile.TemporaryDirectory(prefix="gdd-dk016-") as temp:
        folder = pathlib.Path(temp)
        for i, (path, length) in enumerate(PDFS, start=1):
            print(f"Starting PDF {i}/{len(PDFS)}", flush=True)
            preserve(path, length, folder, args.source_only)
    print("DK01.6 source check OK" if args.source_only else "DK01.6 all 3 private backups verified")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"DK01.6 STOPPED SAFELY: {exc}", file=sys.stderr, flush=True)
        sys.exit(1)
