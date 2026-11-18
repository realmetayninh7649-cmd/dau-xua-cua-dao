#!/usr/bin/env python3
"""Read-only R2 inventory audit of 700 already-published archive originals/previews."""
from __future__ import annotations
import json,os,re,sys
from pathlib import Path
import boto3
from botocore.config import Config

BUCKET="gdd-dau-xua-cua-dao"
O_PREFIX="legacy-private-images-v1/"
P_PREFIX="legacy-private-image-previews-v1/"

def keys(s3,prefix):
    result={}
    token=None
    while True:
        kw={"Bucket":BUCKET,"Prefix":prefix,"MaxKeys":1000}
        if token:kw["ContinuationToken"]=token
        reply=s3.list_objects_v2(**kw)
        for obj in reply.get("Contents",[]):
            name=obj["Key"]
            if name in result:raise RuntimeError("R2 listing has duplicate key")
            result[name]=obj["Size"]
        if not reply.get("IsTruncated"):break
        token=reply.get("NextContinuationToken")
        if not token:raise RuntimeError("R2 truncated listing missing continuation token")
    return result

def main():
    if not Path("maintenance-mode.flag").is_file():
        raise RuntimeError("Maintenance flag is missing")
    m=json.loads(Path("maintenance-tasks/r2-images-published-manifest.json").read_text())
    if m.get("count")!=700 or m.get("scope")!="only-publicly-published-referenced-images" or len(m.get("objects",[]))!=700:
        raise RuntimeError("Manifest invalid")
    account=os.getenv("CLOUDFLARE_ACCOUNT_ID","")
    access=os.getenv("GDD_R2_ARCHIVE_ACCESS_KEY_ID","")
    secret=os.getenv("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY","")
    if not re.fullmatch(r"[a-fA-F0-9]{32}",account) or not re.fullmatch(r"[a-fA-F0-9]{32}",access) or not secret:
        raise RuntimeError("R2 S3 credentials are incomplete")
    s3=boto3.client("s3",endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=access,aws_secret_access_key=secret,region_name="auto",
        config=Config(signature_version="s3v4",s3={"addressing_style":"path"},retries={"max_attempts":3,"mode":"standard"},
          request_checksum_calculation="when_required",response_checksum_validation="when_required"))
    original=keys(s3,O_PREFIX)
    previews=keys(s3,P_PREFIX)
    original_ok=0
    preview_ok=0
    total_original=0
    total_preview=0
    missing=[]
    for row in m["objects"]:
        name=row["path"]
        k=O_PREFIX+name
        p=P_PREFIX+name+".webp"
        if original.get(k)==row["bytes"]:
            original_ok+=1
            total_original+=row["bytes"]
        else:
            missing.append("original:"+name)
        preview_size=previews.get(p,0)
        if isinstance(preview_size,int) and 0<preview_size<=8*1024*1024:
            preview_ok+=1
            total_preview+=preview_size
        else:
            missing.append("preview:"+name)
    print(f"READ-ONLY R2 AUDIT: verified-saved originals {original_ok}/700, previews {preview_ok}/700",flush=True)
    print(f"R2 original bytes={total_original}, preview bytes={total_preview}; original data not mutated",flush=True)
    if missing:
        print("MISSING/SIZE MISMATCH COUNT="+str(len(missing)),flush=True)
        for item in missing[:20]:print(item,flush=True)
        raise RuntimeError("R2 backup is not yet complete; leave public URLs unchanged")
    print("ALL 700 PUBLISHED IMAGE ORIGINALS AND PRIVATE PREVIEWS PRESENT; public cutover NOT performed",flush=True)

if __name__=="__main__":
    try:main()
    except Exception as e:
        print("AUDIT SAFE STOP: "+str(e),file=sys.stderr)
        sys.exit(1)
