#!/usr/bin/env python3
"""Create one SHA256-verified, OpenPGP-encrypted backup shard from private R2.

Google Drive transfer uses a short-lived GitHub Actions artifact. Since the repo
is public, ONLY *.tar.gpg is uploaded as an artifact; original files and
filenames remain inside encrypted data, never in logs or public job artifacts.
Read-only R2 access; no source mutation, no Supabase egress.
"""
from __future__ import annotations
import base64
import hashlib
import heapq
import io
import json
import os
import pathlib
import re
import subprocess
import sys
import tarfile
import tempfile

import boto3
from botocore.config import Config

BUCKET="gdd-dau-xua-cua-dao"
PREFIX_TOTALS={
    "legacy-private-images-v1/": (700, 1378424460),
    "legacy-unlisted-private-v1/": (131, 155381554),
    "legacy-private-dk016/": (3, 54443130),
}
PART_COUNT=24
FULL_COUNT=834
FULL_BYTES=1588249144
PUBLIC_KEY=pathlib.Path("maintenance-tasks/gdrive-backup-recipient-public-key.b64")
CONFIG=pathlib.Path("maintenance-tasks/gdrive-backup-part.json")
OUTPUT=pathlib.Path("/tmp/gdd-drive-archive-export")
MAX_SINGLE=48*1024*1024

def s3_client():
    aid=os.environ.get("CLOUDFLARE_ACCOUNT_ID","")
    key=os.environ.get("GDD_R2_ARCHIVE_ACCESS_KEY_ID","")
    secret=os.environ.get("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY","")
    if not re.fullmatch(r"[0-9a-fA-F]{32}",aid) or not re.fullmatch(r"[0-9a-fA-F]{32}",key) or len(secret)<12:
        raise ValueError("Bucket-scoped R2 credential missing; no action taken")
    return boto3.client("s3",endpoint_url="https://"+aid+".r2.cloudflarestorage.com",
        aws_access_key_id=key,aws_secret_access_key=secret,region_name="auto",
        config=Config(signature_version="s3v4",s3={"addressing_style":"path"},
            retries={"mode":"standard","max_attempts":4},
            request_checksum_calculation="when_required",
            response_checksum_validation="when_required"))

def list_entries(s3,prefix):
    all_entries=[]
    token=None
    while True:
        args={"Bucket":BUCKET,"Prefix":prefix,"MaxKeys":1000}
        if token:args["ContinuationToken"]=token
        page=s3.list_objects_v2(**args)
        for item in page.get("Contents",[]):
            key=item["Key"]
            n=int(item["Size"])
            if not key.startswith(prefix) or key.endswith("/") or n<100 or n>MAX_SINGLE:
                raise ValueError("Unexpected R2 source object path or size")
            all_entries.append((key,n))
        if not page.get("IsTruncated"):break
        token=page.get("NextContinuationToken")
        if not token:raise ValueError("R2 listing continuation missing")
    return all_entries

def enumerate_shards(s3):
    rows=[]
    for prefix,(expected_n,expected_bytes) in PREFIX_TOTALS.items():
        part=list_entries(s3,prefix)
        if len(part)!=expected_n or sum(x[1] for x in part)!=expected_bytes:
            raise ValueError("R2 immutable source inventory differs from independently verified original backup")
        rows.extend(part)
    if len(rows)!=FULL_COUNT or sum(x[1] for x in rows)!=FULL_BYTES:
        raise ValueError("Entire R2 archival inventory mismatch")
    if len({key for key,_ in rows})!=FULL_COUNT:raise ValueError("R2 duplicate source key")
    # Deterministic largest-first balanced bins: approximately 66MB per shard,
    # unlike hash bucketing where one shard might exceed upload limits.
    bins=[[] for _ in range(PART_COUNT)]
    heap=[(0,i) for i in range(PART_COUNT)]
    heapq.heapify(heap)
    for row in sorted(rows,key=lambda item:(-item[1],item[0])):
        size,i=heapq.heappop(heap)
        bins[i].append(row)
        heapq.heappush(heap,(size+row[1],i))
    return bins

def get_verified_source(s3,key,expected,where):
    response=s3.get_object(Bucket=BUCKET,Key=key)
    if response.get("ContentLength")!=expected:
        raise ValueError("S3 content-length changed")
    digest=hashlib.sha256()
    actual=0
    with where.open("wb") as output:
        while True:
            block=response["Body"].read(1024*1024)
            if not block:break
            actual+=len(block)
            if actual>expected:raise ValueError("Unexpected source stream length")
            digest.update(block)
            output.write(block)
    response["Body"].close()
    sha=digest.hexdigest()
    if actual!=expected:raise ValueError("Source stream truncated")
    meta=response.get("Metadata") or {}
    if key.startswith("legacy-private-dk016/"):
        expected_sha=key.split("/")[1]
    else:
        expected_sha=meta.get("sha256","")
    if sha!=expected_sha:
        raise ValueError("Archival original SHA256 did not match verified R2 metadata")
    return sha

def safe_tarinfo(name,size):
    ti=tarfile.TarInfo(name)
    ti.size=size
    ti.uid=ti.gid=0
    ti.uname=ti.gname=""
    ti.mode=0o600
    ti.mtime=0
    return ti

def process():
    cfg=json.loads(CONFIG.read_text("utf8"))
    index=cfg.get("part")
    if cfg.get("part_count")!=PART_COUNT or type(index) is not int or not 0<=index<PART_COUNT:
        raise ValueError("Invalid one-shard transfer request")
    if not pathlib.Path("maintenance-tasks/r2-images-published-manifest.json").is_file():
        raise ValueError("Missing reference manifest")
    s3=s3_client()
    bins=enumerate_shards(s3)
    batch=bins[index]
    n_bytes=sum(x[1] for x in batch)
    if not 30*1024*1024<=n_bytes<=100*1024*1024:
        raise ValueError("Unsafe shard size; may exceed transfer limit")
    OUTPUT.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="gdd-r2-gdrive-private-") as folder:
        work=pathlib.Path(folder)
        archive=work/"archive.tar"
        meta=[]
        with tarfile.open(archive,"w",format=tarfile.PAX_FORMAT) as tar:
            for i,(key,size) in enumerate(batch):
                one=work/"source-object"
                sha=get_verified_source(s3,key,size,one)
                with one.open("rb") as f:
                    tar.addfile(safe_tarinfo("originals/"+key,size),f)
                one.unlink(missing_ok=True)
                meta.append({"r2_key":key,"bytes":size,"sha256":sha})
                # Do not log private file names.
                print("VERIFIED ORIGINAL "+str(i+1)+"/"+str(len(batch)),flush=True)
            manifest={"source":"gdd-dau-xua-cua-dao", "backup_timestamp_utc":"2026-11-19",
                "scope":"original_archival_images_and_pdfs_only",
                "part":index,"total_parts":PART_COUNT,
                "count":len(meta),"original_bytes":n_bytes,"files":meta}
            document=json.dumps(manifest,ensure_ascii=False,indent=2).encode("utf8")
            tar.addfile(safe_tarinfo("MANIFEST.json",len(document)),io.BytesIO(document))
        pub=base64.b64decode(PUBLIC_KEY.read_text("ascii").strip(),validate=True)
        if not pub.startswith(b"-----BEGIN PGP PUBLIC KEY BLOCK-----"):
            raise ValueError("Backup encryption public key not recognized")
        home=work/"gpg"
        home.mkdir(mode=0o700)
        env={**os.environ,"GNUPGHOME":str(home)}
        subprocess.run(["gpg","--batch","--quiet","--import"],input=pub,
            stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,check=True,timeout=30)
        cipher=OUTPUT/f"GDD-R2-BAN-GOC-{index+1:02d}-of-{PART_COUNT:02d}.tar.gpg"
        subprocess.run(["gpg","--batch","--quiet","--trust-model","always",
            "--recipient","gdd-private-manifest@example.invalid",
            "--encrypt","--output",str(cipher),str(archive)],
            stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,check=True,timeout=120)
        actual_cipher=cipher.stat().st_size
        if actual_cipher<n_bytes//3 or actual_cipher>n_bytes+5*1024*1024:
            raise ValueError("Unexpected encrypted archive size")
        digest=hashlib.sha256()
        with cipher.open("rb") as handle:
            for block in iter(lambda:handle.read(4*1024*1024),b""):digest.update(block)
        print(json.dumps({"backup":"ENCRYPTED SHARD READY",
            "part":index+1,"parts":PART_COUNT,
            "original_count":len(meta),"original_bytes":n_bytes,
            "encrypted_bytes":actual_cipher,"encrypted_sha256":digest.hexdigest(),
            "r2_source":"read-only",
            "github_artifact":"encrypted-only","filenames_log":"none"},sort_keys=True),flush=True)

if __name__=="__main__":
    try:process()
    except Exception as error:
        print("SAFE ARCHIVE STOP: "+type(error).__name__+"; no filenames or keys exposed",
              file=sys.stderr,flush=True)
        sys.exit(1)
