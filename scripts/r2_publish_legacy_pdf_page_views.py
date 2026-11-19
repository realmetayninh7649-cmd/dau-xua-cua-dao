#!/usr/bin/env python3
"""Convert three public legacy PDFs from immutable PRIVATE R2 backups to approved
per-page JPEG viewer derivatives. Originals remain private and unchanged.
Only publish viewer metadata after EVERY page is rendered and SHA256 verified.
"""
from __future__ import annotations

import hashlib
import io
import json
import os
import re
import sys
import uuid

import boto3
from botocore.config import Config
import fitz
from PIL import Image, ImageDraw, ImageFont

BUCKET="gdd-dau-xua-cua-dao"
BACKUP_PREFIX="legacy-private-dk016/"
DOCS=(
 ("documents/1794684373312-e808f501-1bba-458d-b82f-f5f096479426.pdf",10098129),
 ("documents/1794684462288-fc373424-39bf-4d8d-950c-2195aa01a603.pdf",9932650),
 ("media/1794860043784-52816aff-f9f7-4790-9e91-d87d7a86fc96.pdf",34412351),
)
PAGE_MAX_BYTES=3*1024*1024
PAGE_MAX_COUNT=120
RENDER_SCALE=2.4
FIRST_QUALITY=87

def client():
    account=os.environ.get("CLOUDFLARE_ACCOUNT_ID","")
    key=os.environ.get("GDD_R2_ARCHIVE_ACCESS_KEY_ID","")
    secret=os.environ.get("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY","")
    if not re.fullmatch(r"[0-9A-Fa-f]{32}",account) or not re.fullmatch(r"[0-9A-Fa-f]{32}",key) or not secret:
        raise RuntimeError("Missing bucket-scoped R2 credentials")
    return boto3.client("s3",endpoint_url="https://"+account+".r2.cloudflarestorage.com",
        aws_access_key_id=key,aws_secret_access_key=secret,region_name="auto",
        config=Config(signature_version="s3v4",s3={"addressing_style":"path"},
          retries={"max_attempts":3,"mode":"standard"},
          request_checksum_calculation="when_required",
          response_checksum_validation="when_required"))

def all_keys(s3,prefix):
    result={}
    token=None
    while True:
        kwargs={"Bucket":BUCKET,"Prefix":prefix,"MaxKeys":1000}
        if token:kwargs["ContinuationToken"]=token
        data=s3.list_objects_v2(**kwargs)
        for item in data.get("Contents",[]):
            if item["Key"] in result:raise RuntimeError("Duplicate R2 listing key")
            result[item["Key"]]=item["Size"]
        if not data.get("IsTruncated"):break
        token=data.get("NextContinuationToken")
        if not token:raise RuntimeError("Invalid paginated R2 listing")
    return result

def s3_bytes(s3,key,limit):
    r=s3.get_object(Bucket=BUCKET,Key=key)
    try:body=r["Body"].read(limit+1)
    finally:r["Body"].close()
    if len(body)>limit or len(body)!=r["ContentLength"]:
        raise RuntimeError("R2 object truncated or exceeded audited size")
    return body,r

def check_stored(s3,key,sha,expected_size):
    body,res=s3_bytes(s3,key,PAGE_MAX_BYTES)
    if len(body)!=expected_size or hashlib.sha256(body).hexdigest()!=sha or res.get("Metadata",{}).get("sha256")!=sha:
        raise RuntimeError("R2 readback SHA256 mismatch at page derivative")
    if not body.startswith(b"\xff\xd8\xff") or not body.endswith(b"\xff\xd9"):
        raise RuntimeError("Page JPEG byte signature invalid")

def make_page(page,number,total):
    px=page.get_pixmap(matrix=fitz.Matrix(RENDER_SCALE,RENDER_SCALE),colorspace=fitz.csRGB,alpha=False)
    image=Image.frombytes("RGB",(px.width,px.height),px.samples)
    footer=Image.new("RGB",(px.width,px.height+48),(255,255,255))
    footer.paste(image,(0,0))
    caption=f"dauxuacuadao.info.vn  |  Ban xem tai lieu so hoa  |  Trang {number}/{total}"
    ImageDraw.Draw(footer).text((18,px.height+9),caption,fill=(70,70,70),
       font=ImageFont.load_default(size=21))
    for quality in (FIRST_QUALITY,83,78):
        buf=io.BytesIO()
        footer.save(buf,format="JPEG",quality=quality,optimize=True,progressive=True,subsampling=0)
        raw=buf.getvalue()
        if 500<=len(raw)<=PAGE_MAX_BYTES:
            return raw,footer.size
    raise RuntimeError("Page cannot safely fit 3MB while preserving text resolution")

def doc_id(path):
    return str(uuid.uuid5(uuid.NAMESPACE_URL,"gdd-r2-legacy-pdf-view:"+path))

def main():
    s3=client()
    backup=all_keys(s3,BACKUP_PREFIX)
    if len(backup)!=3:raise RuntimeError("Expected exactly three immutable legacy PDF backups")
    all_docs=[]
    total_pages=0
    for i,(path,expected_size) in enumerate(DOCS):
        name=path.rsplit("/",1)[-1]
        keys=[key for key,size in backup.items() if key.endswith("/"+name) and size==expected_size]
        if len(keys)!=1:raise RuntimeError("Immutable PDF backup mismatch")
        raw,reply=s3_bytes(s3,keys[0],45000000)
        actual_sha=hashlib.sha256(raw).hexdigest()
        if f"/{actual_sha}/" not in keys[0] or len(raw)!=expected_size or not raw.startswith(b"%PDF"):
            raise RuntimeError("PDF original backup SHA256 or bytes do not match")
        doc=fitz.open(stream=raw,filetype="pdf")
        count=len(doc)
        if not 1<=count<=PAGE_MAX_COUNT or doc.is_encrypted:raise RuntimeError("PDF unfit for page-only viewer")
        id=doc_id(path)
        meta_key=f"meta/{id}.json"
        old=all_keys(s3,meta_key)
        if meta_key in old:
            previous,_=s3_bytes(s3,meta_key,30000)
            prior=json.loads(previous)
            if prior.get("sourceSha256")!=actual_sha or prior.get("kind")!="document" or prior.get("id")!=id:
                raise RuntimeError("Existing asset ID belongs to different data; refusing overwrite")
        pages_prefix=f"derivatives/{id}/pages/"
        oldpages=all_keys(s3,pages_prefix)
        for n,page in enumerate(doc,1):
            key=pages_prefix+str(n)+".jpg"
            image,size=make_page(page,n,count)
            checksum=hashlib.sha256(image).hexdigest()
            if key in oldpages:
                check_stored(s3,key,checksum,len(image))
            else:
                s3.put_object(Bucket=BUCKET,Key=key,Body=image,ContentLength=len(image),
                    ContentType="image/jpeg",Metadata={
                      "sha256":checksum,"source-sha256":actual_sha,
                      "classification":"public-page-image-no-original"})
                check_stored(s3,key,checksum,len(image))
            print(f"PDF {i+1}/3 VERIFIED PAGE {n}/{count}: {size[0]}x{size[1]} px; jpeg_bytes={len(image)}",flush=True)
        doc.close()
        all_docs.append((id,path,actual_sha,count,meta_key))
        total_pages+=count
        print(f"PDF {i+1}/3 PAGE SET VERIFIED: {count} pages. No PDF original made public.",flush=True)

    if len(all_docs)!=3 or total_pages!=66:
        raise RuntimeError("Expected exactly 66 verified pages across three legacy documents")
    # Re-audit ALL expected JPEG page keys by actual R2 listing, not by PUT response.
    for id,path,sha,count,meta_key in all_docs:
        pages=all_keys(s3,f"derivatives/{id}/pages/")
        expected={f"derivatives/{id}/pages/{n}.jpg" for n in range(1,count+1)}
        if set(pages)!=expected or any(pages[k]<500 or pages[k]>PAGE_MAX_BYTES for k in expected):
            raise RuntimeError("Prepublication R2 page-set audit failed")
    # Publish metadata only after the entire 66-page collection passes.
    for id,path,sha,count,meta_key in all_docs:
        docname=path.rsplit("/",1)[-1]
        meta={"id":id,"kind":"document","mime":"application/pdf",
              "originalName":docname,"viewSource":"pdf","pageCount":count,
              "published":True,"allowDownload":False,"download":False,
              "preview":False,"owner":"legacy-migration-private-origin",
              "originalPrivate":True,"sourceSha256":sha,
              "classification":"public-approved-page-only"}
        encoded=json.dumps(meta,ensure_ascii=False,sort_keys=True).encode("utf8")
        s3.put_object(Bucket=BUCKET,Key=meta_key,Body=encoded,ContentLength=len(encoded),
            ContentType="application/json",CacheControl="no-store")
        check,_=s3_bytes(s3,meta_key,30000)
        if check!=encoded:raise RuntimeError("Published metadata roundtrip mismatch")
        print("PUBLISHED PAGE-ONLY VIEWER: id="+id+" pages="+str(count)+" originalPrivate=true",flush=True)
    print("ALL THREE PDF VIEWERS READY: 66 JPEG pages in R2; no original PDF GET endpoint, no Supabase changes.",flush=True)

if __name__=="__main__":
    try:main()
    except Exception as err:
        print("SAFE PDF R2 VIEWER STOP: "+type(err).__name__+"; originals remain private and unchanged",
              file=sys.stderr,flush=True)
        sys.exit(1)
