#!/usr/bin/env python3
"""Private backup of 131 nonpublished Supabase image objects using PGP-encrypted inventory.

The plaintext object list is generated and encrypted INSIDE Supabase (pgcrypto).
GitHub source contains only ciphertext. The decryption key exists ONLY in private
Cloudflare R2. Names are never logged. All originals are read, copied and SHA256
verified without exposing R2 URLs, modifying Supabase, or changing site maintenance.
"""
from __future__ import annotations
import argparse
import base64
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

from r2_preserve_published_images import (
    BUCKET, MAX_ORIGINAL, SOURCE_BUCKET,
    download_source, exists, make_s3, sha256_file, verify_r2,
)

ENCRYPTED=Path("maintenance-tasks/r2-unlisted-private-manifest.encrypted.json")
PRIVATE_KEY="__gdd_internal__/unlisted-manifest-private-key-v2.asc"
DEST_PREFIX="legacy-unlisted-private-v1/"
EXPECTED_COUNT=131
EXPECTED_BYTES=155381554
VALID_FOLDERS={"calendar-qui-vi","documents","media","memorials","obituaries",
               "people","posts","radio","videos"}
VALID_PATH=re.compile(r"^[A-Za-z0-9_.\-/]+$")
VALID_MIMES={"image/jpeg","image/png"}

def load_manifest(s3):
    if not Path("maintenance-mode.flag").is_file():
        raise ValueError("Maintenance mode is not active")
    encrypted=json.loads(ENCRYPTED.read_text(encoding="utf8"))
    if encrypted.get("version")!=1 or encrypted.get("scope")!="unlisted-nonpublic-storage-images" or \
       encrypted.get("encoding")!="pgp-public-key-aes256-base64" or encrypted.get("bucket")!="dao-su-images" or \
       encrypted.get("count")!=EXPECTED_COUNT or encrypted.get("bytes")!=EXPECTED_BYTES:
        raise ValueError("Encrypted inventory metadata changed")
    blob=encrypted.get("ciphertext")
    if not isinstance(blob,str) or len(blob)>60000 or not re.fullmatch(r"[A-Za-z0-9+/=\s]+",blob):
        raise ValueError("Encrypted manifest ciphertext invalid")
    ciphertext=base64.b64decode(blob,validate=False)
    if len(ciphertext)>60000 or len(ciphertext)<200:
        raise ValueError("PGP ciphertext length invalid")
    response=s3.get_object(Bucket=BUCKET,Key=PRIVATE_KEY)
    key_bytes=response["Body"].read(50000)
    response["Body"].close()
    if not key_bytes.startswith(b"-----BEGIN PGP PRIVATE KEY BLOCK-----"):
        raise ValueError("No valid private PGP decryption key in private R2")
    with tempfile.TemporaryDirectory(prefix="gdd-r2-secret-inventory-") as tmp:
        home=Path(tmp)/"gpg"
        home.mkdir(mode=0o700)
        env={**os.environ,"GNUPGHOME":str(home)}
        subprocess.run(["gpg","--batch","--quiet","--import"],
                       input=key_bytes,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                       env=env,check=True,timeout=35)
        opened=subprocess.run(["gpg","--batch","--quiet","--decrypt"],
                               input=ciphertext,stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE,env=env,check=True,timeout=35)
        # Never print or persist the decrypted bytes.
        rows=json.loads(opened.stdout)
    if not isinstance(rows,list) or len(rows)!=EXPECTED_COUNT:
        raise ValueError("Private list count differs from audited Supabase SQL")
    public=json.loads(Path("maintenance-tasks/r2-images-published-manifest.json").read_text("utf8"))
    if public.get("count")!=700 or public.get("total_bytes")!=1378424460:
        raise ValueError("Published reference manifest not recognized")
    known={x["path"] for x in public["objects"]}
    seen=set()
    total=0
    for row in rows:
        if not isinstance(row,dict):raise ValueError("Malformed private image entry")
        path,size,mime=row.get("path"),row.get("bytes"),row.get("mime")
        if not isinstance(path,str) or not VALID_PATH.fullmatch(path) or \
            path.split("/")[0] not in VALID_FOLDERS or path in seen or path in known or \
            any(seg in (".","..","") for seg in path.split("/")) or \
            not isinstance(size,int) or isinstance(size,bool) or not 100<=size<=MAX_ORIGINAL or \
            mime not in VALID_MIMES:
            raise ValueError("Private entry failed bounds or distinctness check")
        seen.add(path)
        total+=size
    if total!=EXPECTED_BYTES:raise ValueError("Private audited byte count changed")
    # List is only ever held in memory on the privileged ephemeral runner.
    print("PRIVATE ENCRYPTED INVENTORY PASSED: 131 separate nonpublic images, "
          "155381554 bytes; private filenames never logged.",flush=True)
    return rows

def archive_one(s3,row,tmp):
    source=tmp/"source-image"
    download_source(row["path"],row["bytes"],source)
    sha,size=sha256_file(source)
    if size!=row["bytes"]:raise ValueError("Source bytes mismatch")
    target=DEST_PREFIX+row["path"]
    if exists(s3,target):
        verify_r2(s3,target,sha,size)
        return False
    with source.open("rb") as stream:
        s3.put_object(Bucket=BUCKET,Key=target,Body=stream,ContentLength=size,
                      ContentType=row["mime"],
                      Metadata={"sha256":sha,"source-bucket":SOURCE_BUCKET,
                                "classification":"unlisted-no-public-url"})
    verify_r2(s3,target,sha,size)
    return True

def audit(s3,rows):
    listed={}
    token=None
    while True:
        req={"Bucket":BUCKET,"Prefix":DEST_PREFIX,"MaxKeys":1000}
        if token:req["ContinuationToken"]=token
        response=s3.list_objects_v2(**req)
        for entry in response.get("Contents",[]):
            if entry["Key"] in listed:raise ValueError("Duplicate R2 object")
            listed[entry["Key"]]=entry["Size"]
        if not response.get("IsTruncated"):break
        token=response.get("NextContinuationToken")
        if not token:raise ValueError("Truncated R2 inventory page")
    expected={DEST_PREFIX+x["path"]:x["bytes"] for x in rows}
    if listed!=expected:raise ValueError("Private archival set not yet complete")
    print("FINAL R2 PRIVATE AUDIT PASS: all 131/131 originals, 155381554 bytes, "
          "no publish routes, no Supabase changes.",flush=True)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--inventory-only",action="store_true")
    p.add_argument("--audit-only",action="store_true")
    p.add_argument("--shard-count",type=int,default=1)
    p.add_argument("--shard-index",type=int,default=0)
    a=p.parse_args()
    if not 1<=a.shard_count<=12 or not 0<=a.shard_index<a.shard_count:
        raise ValueError("Invalid shard selection")
    s3=make_s3()
    rows=load_manifest(s3)
    if a.inventory_only:return
    if a.audit_only:
        audit(s3,rows)
        return
    selection=[row for i,row in enumerate(rows) if i%a.shard_count==a.shard_index]
    total=0
    created=0
    with tempfile.TemporaryDirectory(prefix="gdd-r2-private-archive-") as tmp:
        folder=Path(tmp)
        for n,row in enumerate(selection):
            try:
                was_new=archive_one(s3,row,folder)
                created+=bool(was_new)
                total+=row["bytes"]
                (folder/"source-image").unlink(missing_ok=True)
                print("PRIVATE VERIFIED: shard "+str(a.shard_index+1)+"/"+str(a.shard_count)+
                      ", image "+str(n+1)+"/"+str(len(selection)),flush=True)
            except Exception as error:
                print("PRIVATE SAFE STOP: shard "+str(a.shard_index+1)+
                      ", index "+str(n+1)+", error class "+type(error).__name__,
                      file=sys.stderr,flush=True)
                raise ValueError("Private object failed checksum verification") from None
    print("PRIVATE SHARD COMPLETE: "+str(len(selection))+" original images, "
          +str(total)+" bytes, "+str(created)+" newly saved. No filenames printed.",flush=True)

if __name__=="__main__":
    try:main()
    except Exception as error:
        print("PRIVATE R2 ARCHIVE STOPPED: "+type(error).__name__+
              "; source images untouched and unlisted names remain private",
              file=sys.stderr,flush=True)
        sys.exit(1)
