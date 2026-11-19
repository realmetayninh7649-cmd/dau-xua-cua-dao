#!/usr/bin/env python3
"""One-time PRIVATE preservation of 131 archive images not in the 700-item published manifest.

Retrieves Storage inventory through existing public-bucket read/list policy, but
NEVER prints, commits, or publicly publishes any unlisted name. Exact, audited
counts and byte totals must match before any write. Only R2 S3 private PUT/GET.
Supabase data, URLs, publication flags and maintenance page are never changed.
"""
from __future__ import annotations
import argparse
import io
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import urllib.request
from collections import Counter

from r2_preserve_published_images import (
    BUCKET, MAX_ORIGINAL, MIMES, SOURCE_BUCKET, SOURCE_ROOT,
    download_source, exists, make_s3, sha256_file, verify_r2,
)

REMAINDER_PREFIX="legacy-unlisted-private-v1/"
LIST_API="https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/list/dao-su-images"
BUCKET_FOLDERS={"calendar-qui-vi","documents","media","memorials","obituaries","people","posts","radio","videos"}
EXPECTED_COUNTS={
    "calendar-qui-vi":2,"documents":226,"media":291,"memorials":5,
    "obituaries":2,"people":172,"posts":123,"radio":2,"videos":8,
}
TOTAL_STORAGE_OBJECTS=831
TOTAL_STORAGE_BYTES=1533806014
REMAINDER_OBJECTS=131
REMAINDER_BYTES=155381554
PUBLISHED_COUNT=700
PUBLISHED_BYTES=1378424460
SAFE_PATH=re.compile(r"^[A-Za-z0-9_.\-/]+$")
LIST_PAGE=1000

def public_publishable_key():
    source=Path("supabase-config.js").read_text(encoding="utf8")
    found=re.search(r"supabasePublishableKey:\s*[\"']([^\"']+)[\"']",source)
    if not found or not found.group(1) or found.group(1).startswith("YOUR_"):
        raise ValueError("Public Storage list configuration missing")
    return found.group(1)

def list_prefix(key,prefix,visited,images):
    if prefix in visited or len(visited)>50 or prefix.count("/")>5:
        raise ValueError("Unsafe Supabase Storage folder recursion")
    visited.add(prefix)
    offset=0
    while True:
        body=json.dumps({"prefix":prefix,"limit":LIST_PAGE,"offset":offset,
                         "sortBy":{"column":"name","order":"asc"}}).encode("utf8")
        request=urllib.request.Request(
            LIST_API,data=body,method="POST",
            headers={"apikey":key,"Content-Type":"application/json",
                     "User-Agent":"GDD-R2-Private-Archive/1.0"})
        with urllib.request.urlopen(request,timeout=35) as response:
            if response.status!=200:raise ValueError("Cannot safely list source archive")
            batch=json.load(response)
        if not isinstance(batch,list) or len(batch)>LIST_PAGE:
            raise ValueError("Unexpected listing API response")
        for entry in batch:
            if not isinstance(entry,dict):
                raise ValueError("Unexpected listing row")
            part=entry.get("name")
            if not isinstance(part,str) or not re.fullmatch(r"[A-Za-z0-9_.-]+",part) or part in (".",".."):
                raise ValueError("Unexpected unsafe storage basename")
            metadata=entry.get("metadata")
            if entry.get("id") is None or metadata is None:
                nested=prefix+part+"/"
                list_prefix(key,nested,visited,images)
                continue
            name=prefix+part
            size=metadata.get("size") if isinstance(metadata,dict) else None
            mime=metadata.get("mimetype") if isinstance(metadata,dict) else None
            if not SAFE_PATH.fullmatch(name) or not isinstance(size,int) or isinstance(size,bool) or \
               not (100 <= size <= MAX_ORIGINAL) or mime not in MIMES or name in images or \
               name.split("/")[0] not in BUCKET_FOLDERS:
                raise ValueError("Unexpected image row; preserve without action")
            images[name]={"path":name,"bytes":size,"mime":mime}
            if len(images)>TOTAL_STORAGE_OBJECTS:raise ValueError("Object listing exceeded audited source count")
        offset+=len(batch)
        if len(batch)<LIST_PAGE:break

def inventory():
    if not Path("maintenance-mode.flag").is_file():
        raise ValueError("Maintenance-mode flag not present; refusing archive")
    manifest=json.loads(Path("maintenance-tasks/r2-images-published-manifest.json").read_text("utf8"))
    published=manifest.get("objects",[])
    if len(published)!=PUBLISHED_COUNT or manifest.get("total_bytes")!=PUBLISHED_BYTES:
        raise ValueError("700-item public archive manifest unexpected")
    pub={item["path"]:item for item in published}
    if len(pub)!=PUBLISHED_COUNT:raise ValueError("Duplicate published reference")
    items={}
    list_prefix(public_publishable_key(),"",set(),items)
    if len(items)!=TOTAL_STORAGE_OBJECTS:
        raise ValueError("Safe source object-count mismatch: expected 831 got "+str(len(items)))
    if sum(item["bytes"] for item in items.values())!=TOTAL_STORAGE_BYTES:
        raise ValueError("Source bytes changed, no copying permitted")
    if Counter(name.split("/")[0] for name in items)!=Counter(EXPECTED_COUNTS):
        raise ValueError("Source folders changed, no copying permitted")
    for path,row in pub.items():
        actual=items.get(path)
        if actual is None or actual["bytes"]!=row["bytes"] or actual["mime"]!=row["mime"]:
            raise ValueError("Published archive inventory drift, no copying permitted")
    remainder=[items[name] for name in sorted(items) if name not in pub]
    if len(remainder)!=REMAINDER_OBJECTS or sum(x["bytes"] for x in remainder)!=REMAINDER_BYTES:
        raise ValueError("Private remainder not equal to independent SQL audit")
    print("STRICT INVENTORY VALIDATED: 831 source images, 700 already-published, "
          "131 unlisted/private (=155381554 bytes). Zero private filenames printed.",flush=True)
    return remainder

def preserve_one(s3,row,temp_path:Path):
    # Never log full path, even on exceptions.
    source=temp_path/"image-original"
    download_source(row["path"],row["bytes"],source)
    sha,count=sha256_file(source)
    if count!=row["bytes"]:raise ValueError("Downloaded source size changed")
    key=REMAINDER_PREFIX+row["path"]
    if exists(s3,key):
        verify_r2(s3,key,sha,count)
        return "existing"
    with source.open("rb") as handle:
        s3.put_object(Bucket=BUCKET,Key=key,Body=handle,ContentLength=count,
                      ContentType=row["mime"],Metadata={
                          "sha256":sha,"source-bucket":SOURCE_BUCKET,
                          "classification":"unlisted-private"})
    verify_r2(s3,key,sha,count)
    return "new"

def audit(s3,remainder):
    listing={}
    token=None
    while True:
        args={"Bucket":BUCKET,"Prefix":REMAINDER_PREFIX,"MaxKeys":1000}
        if token:args["ContinuationToken"]=token
        result=s3.list_objects_v2(**args)
        for obj in result.get("Contents",[]):
            key=obj["Key"]
            if key in listing:raise ValueError("Duplicate R2 object key")
            listing[key]=obj["Size"]
        if not result.get("IsTruncated"):break
        token=result.get("NextContinuationToken")
        if not token:raise ValueError("R2 pagination missing continuation token")
    expected={REMAINDER_PREFIX+x["path"]:x["bytes"] for x in remainder}
    if listing!=expected:
        raise ValueError("Private R2 inventory incomplete; no public cutover possible")
    print("PRIVATE R2 AUDIT PASS: exactly 131/131 private originals, "
          "155381554 bytes, no public previews or URL changes.",flush=True)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--inventory-only",action="store_true")
    parser.add_argument("--audit-only",action="store_true")
    parser.add_argument("--shard-count",type=int,default=1)
    parser.add_argument("--shard-index",type=int,default=0)
    args=parser.parse_args()
    rows=inventory()
    if args.inventory_only:return
    if not 1 <= args.shard_count <= 12 or not 0<=args.shard_index<args.shard_count:
        raise ValueError("Invalid shard configuration")
    s3=make_s3()
    if args.audit_only:
        audit(s3,rows)
        return
    batch=[row for i,row in enumerate(rows) if i%args.shard_count==args.shard_index]
    confirmed=0
    added=0
    bytes_done=0
    with tempfile.TemporaryDirectory(prefix="gdd-private-r2-") as tmp:
        folder=Path(tmp)
        for i,row in enumerate(batch):
            try:
                status=preserve_one(s3,row,folder)
            except Exception as exc:
                print("PRIVATE SAFE STOP: shard "+str(args.shard_index+1)+
                      ", item "+str(i+1)+", error class="+type(exc).__name__,
                      file=sys.stderr,flush=True)
                raise ValueError("Private backup interrupted; no private filename disclosed") from None
            confirmed+=1
            added+=status=="new"
            bytes_done+=row["bytes"]
            (folder/"image-original").unlink(missing_ok=True)
            print("PRIVATE VERIFIED shard "+str(args.shard_index+1)+"/"+
                  str(args.shard_count)+" item "+str(confirmed)+"/"+
                  str(len(batch)),flush=True)
    print("PRIVATE BATCH OK: shard="+str(args.shard_index+1)+
          ", verified="+str(confirmed)+", new="+str(added)+
          ", bytes="+str(bytes_done)+", no names disclosed",flush=True)

if __name__=="__main__":
    try:main()
    except Exception as exc:
        safe_message=str(exc)
        if not re.fullmatch(r"(Safe source object-count mismatch: expected 831 got [0-9]+|Source bytes changed, no copying permitted|Source folders changed, no copying permitted|Published archive inventory drift, no copying permitted|Private remainder not equal to independent SQL audit|Unexpected image row; preserve without action|Unexpected unsafe storage basename|Unexpected listing API response|Unexpected listing row|Unsafe Supabase Storage folder recursion)",safe_message):
            safe_message=type(exc).__name__
        print("PRIVATE ARCHIVE STOPPED: "+safe_message+
              "; no original deleted or public link changed",file=sys.stderr,flush=True)
        sys.exit(1)
