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


def get_s3_client():
    """Use bucket-scoped Cloudflare S3 credentials, never a broad REST admin token."""
    key = os.getenv("GDD_R2_ARCHIVE_ACCESS_KEY_ID")
    secret = os.getenv("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY")
    account = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    if not key or not secret or not account:
        raise RuntimeError("Missing bucket-scoped R2 S3 credentials in GitHub Actions; NO files copied")
    import boto3
    from botocore.config import Config
    return boto3.client(
        service_name="s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=key,
        aws_secret_access_key=secret,
        region_name="auto",
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
            retries={"max_attempts": 3, "mode": "standard"},
            request_checksum_calculation="when_required",
            response_checksum_validation="when_required",
        ),
    )


def verify_private_copy(s3, key: str, output: pathlib.Path, source_hash: str, source_len: int):
    response = s3.get_object(Bucket=BUCKET, Key=key)
    reader = response["Body"]
    try:
        with output.open("wb") as f:
            for chunk in iter(lambda: reader.read(1024 * 1024), b""):
                f.write(chunk)
    finally:
        reader.close()
    verified_hash, verified_len = sha256(output)
    if verified_len != source_len or verified_hash != source_hash:
        raise RuntimeError(
            "INTEGRITY FAILURE: R2 copy differs from original; "
            f"source={source_hash}/{source_len}, R2={verified_hash}/{verified_len}"
        )
    return verified_hash, verified_len


def preserve(path: str, expected: int, directory: pathlib.Path, source_only: bool, s3=None) -> None:
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
    if s3 is None:
        raise RuntimeError("Private R2 S3 client missing; nothing was uploaded")
    # With bucket-scoped R2 credentials, use authenticated ListObjectsV2 to
    # distinguish a missing key from a HEAD error with ambiguous HTTP 400/403.
    # Never treat an API error as proof of absence; never overwrite existing data.
    from botocore.exceptions import ClientError
    try:
        listing = s3.list_objects_v2(Bucket=BUCKET, Prefix=object_key, MaxKeys=10)
        if listing.get("IsTruncated"):
            raise RuntimeError("R2 object listing unexpectedly truncated; refusing write")
        exists = any(item.get("Key") == object_key for item in listing.get("Contents", []))
        print("R2 authenticated list OK; archive target " + ("already exists" if exists else "not present"), flush=True)
    except ClientError as exc:
        code = str(exc.response.get("Error", {}).get("Code", "unknown"))
        status = exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode", "unknown")
        raise RuntimeError(f"Cannot securely list objects in target R2 bucket (code={code}, HTTP={status}); refusing write") from exc
    if not exists:
        with source_file.open("rb") as original:
            s3.put_object(Bucket=BUCKET, Key=object_key, Body=original,
                          ContentLength=source_len, ContentType="application/pdf")
    verified_hash, verified_len = verify_private_copy(
        s3, object_key, verified_file, source_hash, source_len
    )
    print(f"R2 PRIVATE BACKUP VERIFIED: {object_key}; bytes={verified_len}; SHA256={verified_hash}", flush=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-only", action="store_true", help="Check public sources without R2 writes")
    args = parser.parse_args()
    s3 = None if args.source_only else get_s3_client()
    with tempfile.TemporaryDirectory(prefix="gdd-dk016-") as temp:
        folder = pathlib.Path(temp)
        for i, (path, length) in enumerate(PDFS, start=1):
            print(f"Starting PDF {i}/{len(PDFS)}", flush=True)
            preserve(path, length, folder, args.source_only, s3)
    print("DK01.6 source check OK" if args.source_only else "DK01.6 all 3 private backups verified")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"DK01.6 STOPPED SAFELY: {exc}", file=sys.stderr, flush=True)
        sys.exit(1)
