#!/usr/bin/env python3
"""Copy already-published Supabase archive images to PRIVATE Cloudflare R2.
Originals are copied byte-for-byte; separately generate unapproved private previews.
No Supabase mutations, no public R2 publication, no public URL changes.
Every object is re-read from R2 and SHA-256 verified before it is counted.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import urllib.parse
import urllib.request

BUCKET = "gdd-dau-xua-cua-dao"
SOURCE_HOST = "gwpdgubxoquhrfbolftq.supabase.co"
SOURCE_BUCKET = "dao-su-images"
SOURCE_ROOT = f"https://{SOURCE_HOST}/storage/v1/object/public/{SOURCE_BUCKET}/"
MANIFEST = Path("maintenance-tasks/r2-images-published-manifest.json")
CONTROL = Path("maintenance-tasks/r2-images-run.json")
ORIGINAL_PREFIX = "legacy-private-images-v1/"
PREVIEW_PREFIX = "legacy-private-image-previews-v1/"
PATH_RE = re.compile(r"^(people|posts|media|documents|videos|obituaries|memorials|radio|calendar-qui-vi)/[A-Za-z0-9_./-]+$")
MIMES = {"image/jpeg", "image/png", "image/webp"}
MAX_ORIGINAL = 6291456


def sha256_file(path: Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    size = 0
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
            size += len(chunk)
    return digest.hexdigest(), size


def validate():
    if not Path("maintenance-mode.flag").is_file():
        raise RuntimeError("Website not in approved maintenance mode; refusing migration")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    config = json.loads(CONTROL.read_text(encoding="utf-8"))
    objects = manifest.get("objects")
    if not isinstance(objects, list) or manifest.get("version") != 1 or \
        manifest.get("project") != "gwpdgubxoquhrfbolftq" or \
        manifest.get("bucket") != SOURCE_BUCKET or \
        manifest.get("scope") != "only-publicly-published-referenced-images" or \
        manifest.get("count") != len(objects) or len(objects) != 700 or \
        manifest.get("total_bytes") != 1378424460:
        raise RuntimeError("Source manifest audit failed")
    seen = set()
    total = 0
    for row in objects:
        name, size, mime = row.get("path"), row.get("bytes"), row.get("mime")
        if not isinstance(name, str) or not PATH_RE.fullmatch(name) or \
            ".." in name.split("/") or name in seen or \
            not isinstance(size, int) or not 100 <= size <= MAX_ORIGINAL or \
            mime not in MIMES:
            raise RuntimeError("Unsafe or malformed manifest entry")
        seen.add(name)
        total += size
    if total != manifest["total_bytes"]:
        raise RuntimeError("Manifest total size changed")
    if config.get("approved") is not True or config.get("mode") != "private-backup-only":
        raise RuntimeError("No authorized private-only run control")
    offset, limit = config.get("offset"), config.get("limit")
    if not isinstance(offset,int) or not isinstance(limit,int) or \
        isinstance(offset,bool) or isinstance(limit,bool) or \
        offset < 0 or limit < 1 or offset >= len(objects) or \
        offset + limit > len(objects):
        raise RuntimeError("Run offset/limit out of manifest bounds")
    return objects[offset:offset+limit], offset, len(objects)


def make_s3():
    import boto3
    from botocore.config import Config
    access = os.getenv("GDD_R2_ARCHIVE_ACCESS_KEY_ID")
    secret = os.getenv("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY")
    account = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    if not access or not secret or not account:
        raise RuntimeError("Missing bucket-scoped R2 S3 GitHub Secrets")
    if not re.fullmatch(r"[a-fA-F0-9]{32}",access) or not re.fullmatch(r"[a-fA-F0-9]{32}",account):
        raise RuntimeError("S3 Access Key ID or Cloudflare Account ID invalid format")
    return boto3.client(
        "s3", endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=access, aws_secret_access_key=secret,region_name="auto",
        config=Config(signature_version="s3v4",
                      s3={"addressing_style":"path"},
                      retries={"max_attempts":3,"mode":"standard"},
                      request_checksum_calculation="when_required",
                      response_checksum_validation="when_required"))


def exists(s3, key: str) -> bool:
    # R2 bucket-scoped credentials support authenticated ListObjectsV2.
    # Never mistake an HTTP error for nonexistence.
    reply = s3.list_objects_v2(Bucket=BUCKET,Prefix=key,MaxKeys=1000)
    if reply.get("IsTruncated"):
        raise RuntimeError("Ambiguous truncated R2 object listing; refusing write")
    return any(item.get("Key") == key for item in reply.get("Contents",[]))


def verify_r2(s3, key: str, sha: str, size: int):
    response = s3.get_object(Bucket=BUCKET, Key=key)
    digest = hashlib.sha256()
    count = 0
    body = response["Body"]
    try:
        while True:
            chunk = body.read(1024 * 1024)
            if not chunk: break
            count += len(chunk)
            if count > size: raise RuntimeError("R2 returned more bytes than expected")
            digest.update(chunk)
    finally:
        body.close()
    if count != size or digest.hexdigest() != sha:
        raise RuntimeError("R2 integrity failure at " + key)


def download_source(name: str, expected: int, path: Path):
    request=urllib.request.Request(
        SOURCE_ROOT + urllib.parse.quote(name,safe="/"),
        headers={"User-Agent":"GDD-Public-Archive-Backup/1.0",
                 "Cache-Control":"no-cache"})
    with urllib.request.urlopen(request, timeout=70) as res:
        host=urllib.parse.urlparse(res.url).hostname
        if res.status != 200 or host != SOURCE_HOST:
            raise RuntimeError("Unexpected Supabase source HTTP response or redirect")
        total=0
        with path.open("wb") as output:
            while True:
                chunk=res.read(1024*1024)
                if not chunk: break
                total+=len(chunk)
                if total>expected: raise RuntimeError("Source exceeds audited object length")
                output.write(chunk)
    if total!=expected:
        raise RuntimeError(f"Supabase source size mismatch {total} != {expected}")


def make_preview(source:Path, target:Path):
    from PIL import Image, ImageOps
    Image.MAX_IMAGE_PIXELS=70_000_000
    with Image.open(source) as check:
        check.verify()
    with Image.open(source) as image:
        output=ImageOps.exif_transpose(image)
        output.load()
        if output.mode in ("RGBA","LA") or "transparency" in output.info:
            rgba=output.convert("RGBA")
            white=Image.new("RGB",rgba.size,(255,255,255))
            white.paste(rgba,mask=rgba.getchannel("A"))
            output=white
        else:
            output=output.convert("RGB")
        output.thumbnail((1800,1800),Image.Resampling.LANCZOS)
        output.save(target,format="WEBP",quality=86,method=5)
    if target.stat().st_size <= 0:
        raise RuntimeError("Empty optimized preview")
    return sha256_file(target)


def preserve_one(s3, row, index, total, scratch:Path):
    name,size,mime=row["path"],row["bytes"],row["mime"]
    original=scratch/"source-original"
    preview=scratch/"source-preview.webp"
    download_source(name,size,original)
    sha,actual=sha256_file(original)
    if actual!=size: raise RuntimeError("Source changed during hashing")
    original_key=ORIGINAL_PREFIX+name
    preview_key=PREVIEW_PREFIX+name+".webp"
    if exists(s3,original_key):
        verify_r2(s3,original_key,sha,size)
        orig_status="already_verified"
    else:
        with original.open("rb") as stream:
            s3.put_object(Bucket=BUCKET, Key=original_key, Body=stream,
                ContentLength=size,ContentType=mime,
                Metadata={"sha256":sha,"source-bucket":SOURCE_BUCKET})
        verify_r2(s3,original_key,sha,size)
        orig_status="new_verified"
    preview_sha,preview_size=make_preview(original,preview)
    if exists(s3,preview_key):
        verify_r2(s3,preview_key,preview_sha,preview_size)
        preview_status="already_verified"
    else:
        with preview.open("rb") as stream:
            s3.put_object(Bucket=BUCKET,Key=preview_key,Body=stream,
                ContentLength=preview_size,ContentType="image/webp",
                Metadata={"sha256":preview_sha,"source-sha256":sha,"public":"false"})
        verify_r2(s3,preview_key,preview_sha,preview_size)
        preview_status="new_verified"
    # Print only non-secret path and outcome, never tokens.
    print(f"VERIFIED {index+1}/{total}: {name} original={size} ({orig_status})"
          f" preview={preview_size} ({preview_status}) SHA256={sha}",flush=True)
    return size,preview_size


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--validate-only",action="store_true")
    args=parser.parse_args()
    selection,offset,total=validate()
    print(f"MANIFEST OK: {total} public images; selected {len(selection)} "
          f"at offset {offset}; private originals + unapproved previews",flush=True)
    if args.validate_only: return
    s3=make_s3()
    images=0
    original_bytes=0
    preview_bytes=0
    with tempfile.TemporaryDirectory(prefix="gdd-r2-images-") as temp:
        folder=Path(temp)
        for row in selection:
            original_file=folder/"source-original"
            preview_file=folder/"source-preview.webp"
            original_file.unlink(missing_ok=True)
            preview_file.unlink(missing_ok=True)
            n,m=preserve_one(s3,row,offset+images,total,folder)
            original_bytes+=n;preview_bytes+=m;images+=1
    print(f"BATCH VERIFIED {images}/{len(selection)}: originals={original_bytes} "
          f"preview_bytes={preview_bytes} offsets={offset}..{offset+images-1}",flush=True)


if __name__=="__main__":
    try: main()
    except Exception as error:
        print("SAFE STOP: "+str(error),file=sys.stderr,flush=True)
        sys.exit(1)
