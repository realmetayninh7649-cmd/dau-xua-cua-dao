#!/usr/bin/env python3
"""Read-only HTTP test: localhost Wrangler Worker with REAL remote Cloudflare R2 binding.

Production Worker and public site are never changed. A temporary Worker copy
enables previews for this single isolated test; no public server is created.
"""
from __future__ import annotations
import hashlib
import json
import os
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path

import boto3
from botocore.config import Config

BUCKET="gdd-dau-xua-cua-dao"
BASE="http://127.0.0.1:8787"
PREFIX="https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-images/"
def request(path,method="GET",headers=None):
    h={"User-Agent":"GDD-R2-LocalRemoteReadOnly/1.0"}
    h.update(headers or {})
    req=urllib.request.Request(BASE+path,method=method,headers=h)
    try:
        with urllib.request.urlopen(req,timeout=25) as res:
            return res.status,res.headers, res.read(8*1024*1024)
    except urllib.error.HTTPError as e:
        return e.code,e.headers,e.read(1000)

def main():
    manifest=json.loads(Path("maintenance-tasks/r2-images-published-manifest.json").read_text())
    assert manifest["count"] == 700
    path=manifest["objects"][0]["path"]
    assert path.startswith("documents/") and ".." not in path
    webp_url="/v1/legacy-preview/"+path+".webp"
    code,headers,body=request(webp_url,headers={"Origin":"https://dauxuacuadao.info.vn"})
    if code!=200:
        raise RuntimeError("Local remote R2 WebP request failed with HTTP "+str(code)+": "+body[:150].decode(errors="replace"))
    if headers.get("Content-Type")!="image/webp":
        raise RuntimeError("Bad real Worker image content type")
    if headers.get("Access-Control-Allow-Origin")!="https://dauxuacuadao.info.vn":
        raise RuntimeError("CORS failed on R2 preview")
    if len(body)<100 or body[:4]!=b"RIFF" or body[8:12]!=b"WEBP":
        raise RuntimeError("R2 Worker did not return actual WebP")
    access=os.getenv("GDD_R2_ARCHIVE_ACCESS_KEY_ID","")
    secret=os.getenv("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY","")
    account=os.getenv("CLOUDFLARE_ACCOUNT_ID","")
    if not re.fullmatch(r"[0-9A-Fa-f]{32}",access) or not re.fullmatch(r"[0-9A-Fa-f]{32}",account) or not secret:
        raise RuntimeError("Missing R2 S3 credentials")
    s3=boto3.client("s3",endpoint_url="https://"+account+".r2.cloudflarestorage.com",
        aws_access_key_id=access,aws_secret_access_key=secret,region_name="auto",
        config=Config(signature_version="s3v4",s3={"addressing_style":"path"},
          request_checksum_calculation="when_required",
          response_checksum_validation="when_required"))
    obj=s3.head_object(Bucket=BUCKET, Key="legacy-private-image-previews-v1/"+path+".webp")
    sha=hashlib.sha256(body).hexdigest()
    if sha!=obj.get("Metadata",{}).get("sha256") or len(body)!=obj["ContentLength"]:
        raise RuntimeError("WebP bytes delivered via local Worker differ from actual private R2 metadata")
    print("LOCAL WRANGLER + REAL REMOTE R2 HTTP 200 PASS: "+str(len(body))+" WebP bytes, SHA256 verified, CORS present.",flush=True)

    for raw in ["/v1/legacy-preview/people/unpublished.jpg.webp",
        "/v1/legacy-preview/documents/../../people/private.jpg.webp",
        "/legacy-private-images-v1/"+path,
        "/files/"+path,
        "/v1/legacy-preview/"+path]:
        code,ct,payload=request(raw)
        if code==200 or ct.get("Content-Type","").startswith("image/"):
            raise RuntimeError("Unauthorized route exposed data: HTTP "+str(code))
    print("PATH DENIAL PASS: no draft, unlisted or original route returned image bytes.",flush=True)

if __name__=="__main__":
    try: main()
    except Exception as err:
        print("LOCAL-REMOTE READ-ONLY TEST STOPPED: "+str(err),file=sys.stderr,flush=True)
        sys.exit(1)
