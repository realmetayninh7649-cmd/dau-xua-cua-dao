#!/usr/bin/env python3
"""Read-only R2 sample fidelity audit against preserved originals, while web is under maintenance.

No uploads, edits, URL changes, live publication, or access tokens in logs.
"""
from __future__ import annotations
import hashlib
import io
import json
import os
from pathlib import Path
import re
import sys
from collections import defaultdict
from PIL import Image, ImageOps, ImageChops, ImageStat
import boto3
from botocore.config import Config

BUCKET="gdd-dau-xua-cua-dao"
ORIGINAL="legacy-private-images-v1/"
PREVIEW="legacy-private-image-previews-v1/"
MANIFEST=Path("maintenance-tasks/r2-images-published-manifest.json")
SAMPLE_FILE=Path("/tmp/gdd-r2-sample.webp")
PATH_FILE=Path("/tmp/gdd-r2-sample-path.txt")
MAX_IMAGE_PIXELS=70_000_000
Image.MAX_IMAGE_PIXELS=MAX_IMAGE_PIXELS

def make_s3():
    account=os.getenv("CLOUDFLARE_ACCOUNT_ID","")
    access=os.getenv("GDD_R2_ARCHIVE_ACCESS_KEY_ID","")
    secret=os.getenv("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY","")
    if not re.fullmatch(r"[A-Fa-f0-9]{32}",account) or not re.fullmatch(r"[A-Fa-f0-9]{32}",access) or not secret:
        raise RuntimeError("Missing or malformed R2 S3 credentials; nothing modified")
    return boto3.client("s3",endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=access,aws_secret_access_key=secret,region_name="auto",
        config=Config(signature_version="s3v4",s3={"addressing_style":"path"},
          retries={"max_attempts":3,"mode":"standard"},
          request_checksum_calculation="when_required",
          response_checksum_validation="when_required"))

def get_data(client,key,max_bytes):
    response=client.get_object(Bucket=BUCKET,Key=key)
    length=int(response.get("ContentLength",0))
    if length<100 or length>max_bytes: raise RuntimeError("Unexpected object length at "+key)
    body=response["Body"]
    try: data=body.read(max_bytes+1)
    finally: body.close()
    if len(data)!=length:raise RuntimeError("Truncated or oversized R2 object at "+key)
    return data,response.get("Metadata",{}),response.get("ContentType","")

def normalized_photo(data):
    with Image.open(io.BytesIO(data)) as image:
        image.verify()
    with Image.open(io.BytesIO(data)) as im:
        picture=ImageOps.exif_transpose(im)
        picture.load()
        if picture.mode in ("RGBA","LA") or "transparency" in picture.info:
            rgba=picture.convert("RGBA")
            white=Image.new("RGB",rgba.size,(255,255,255))
            white.paste(rgba,mask=rgba.getchannel("A"))
            picture=white
        else:picture=picture.convert("RGB")
        picture.thumbnail((1800,1800),Image.Resampling.LANCZOS)
        return picture.copy()

def choose_balanced(manifest,per_folder=10):
    buckets=defaultdict(list)
    for entry in manifest["objects"]:
        buckets[entry["path"].split("/")[0]].append(entry)
    result=[]
    for folder,items in sorted(buckets.items()):
        items=sorted(items,key=lambda x:(x["bytes"],x["path"]))
        # Sample smallest, middle, and largest images in each document category.
        wanted=min(per_folder,len(items))
        indices=sorted({round(i*(len(items)-1)/max(1,wanted-1)) for i in range(wanted)})
        for index in indices:result.append(items[index])
    if not 40 <= len(result) <= 65:raise RuntimeError("Unexpected audit sample count "+str(len(result)))
    return result

def main():
    if not Path("maintenance-mode.flag").is_file():raise RuntimeError("Public site must stay in maintenance")
    manifest=json.loads(MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("count")!=700 or len(manifest.get("objects",[]))!=700:raise RuntimeError("Unexpected published manifest")
    samples=choose_balanced(manifest,10)
    print("READ ONLY IMAGE FIDELITY AUDIT: total "+str(len(samples))+" samples from published originals and WebP previews",flush=True)
    s3=make_s3()
    worst={"ratio":-1}
    metrics=[]
    for index,item in enumerate(samples):
        original_path=ORIGINAL+item["path"]
        preview_path=PREVIEW+item["path"]+".webp"
        original,metadata,_=get_data(s3,original_path,7*1024*1024)
        preview,pmeta,content_type=get_data(s3,preview_path,8*1024*1024)
        o_hash=hashlib.sha256(original).hexdigest()
        p_hash=hashlib.sha256(preview).hexdigest()
        if len(original)!=item["bytes"] or metadata.get("sha256")!=o_hash:
            raise RuntimeError("Source hash/bytes mismatch at published image "+item["path"])
        if pmeta.get("source-sha256")!=o_hash or pmeta.get("sha256")!=p_hash:
            raise RuntimeError("Preview hash/provenance mismatch at "+item["path"])
        if content_type!="image/webp":
            raise RuntimeError("Incorrect private WebP content type at "+item["path"])
        reference=normalized_photo(original)
        with Image.open(io.BytesIO(preview)) as image:
            image.verify()
        with Image.open(io.BytesIO(preview)) as image:
            if image.format!="WEBP" or image.size!=reference.size:
                raise RuntimeError("WebP orientation, aspect ratio or resolution mismatch at "+item["path"])
            actual=image.convert("RGB")
            diff=ImageChops.difference(reference,actual)
            rgb=ImageStat.Stat(diff).mean
            mean_absolute=sum(rgb)/3
            ratio=mean_absolute/255.0
        if ratio>.14:
            raise RuntimeError("Preview fidelity outside safe threshold at "+item["path"]+" normalized_mean_error="+str(round(ratio,4)))
        metrics.append((ratio,len(original),len(preview),item["path"]))
        if ratio>worst["ratio"]:worst={"ratio":ratio,"name":item["path"]}
        if index==0:
            SAMPLE_FILE.write_bytes(preview)
            PATH_FILE.write_text(item["path"],encoding="utf-8")
        print(f"VALID IMAGE {index+1}/{len(samples)} category={item['path'].split('/')[0]} "
              f"preview_px={reference.size[0]}x{reference.size[1]} orig_bytes={len(original)} "
              f"preview_bytes={len(preview)} mean_rgb_error={ratio:.4f}",flush=True)
    total_orig=sum(x[1] for x in metrics)
    total_preview=sum(x[2] for x in metrics)
    avg_error=sum(x[0] for x in metrics)/len(metrics)
    print(f"QUALITY PASS: {len(metrics)} images; average normalized RGB error={avg_error:.4f}; "
          f"worst={worst['ratio']:.4f}; original_bytes={total_orig}; preview_bytes={total_preview}; "
          f"size_reduction={1-total_preview/total_orig:.3%}",flush=True)
    print("SAMPLE ROUTE FIXTURE READY; no source originals made public",flush=True)

if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("QUALITY SAFE STOP: "+str(exc),file=sys.stderr,flush=True)
        sys.exit(1)
