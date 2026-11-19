#!/usr/bin/env python3
"""Build safe printable A4 derivatives for 133 already-published document scans.
R2 private originals are NEVER rewritten or publicly served. Each JPEG embeds a
visible ownership/source footer and its own SHA256; fails closed on unknown paths.
"""
from __future__ import annotations
import hashlib, io, json, os, pathlib, re, sys
import boto3
from botocore.config import Config
from PIL import Image, ImageOps, ImageDraw, ImageFont, ImageFile
Image.MAX_IMAGE_PIXELS=35000000
ImageFile.LOAD_TRUNCATED_IMAGES=False
ROOT=pathlib.Path("maintenance-tasks")
BUCKET="gdd-dau-xua-cua-dao"
ALLOWED=ROOT/"gdd-public-print-paths.json"
PUBLISHED=ROOT/"r2-images-published-manifest.json"
SRC="legacy-private-images-v1/"
TARGET="legacy-published-print-v1/"
LIMIT=6291456
MAX_OUT=4*1024*1024
P=re.compile(r"^(?:documents|media|people|posts|videos|obituaries|memorials|radio|calendar-qui-vi)/[A-Za-z0-9_./-]+$",re.I)
def client():
    a=os.getenv("CLOUDFLARE_ACCOUNT_ID","");k=os.getenv("GDD_R2_ARCHIVE_ACCESS_KEY_ID","");s=os.getenv("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY","")
    if not re.fullmatch(r"[a-fA-F0-9]{32}",a) or not re.fullmatch(r"[a-fA-F0-9]{32}",k) or len(s)<12:
        raise RuntimeError("R2 bucket-scoped keys not available")
    return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",aws_access_key_id=k,aws_secret_access_key=s,region_name="auto",
       config=Config(signature_version="s3v4",s3={"addressing_style":"path"},retries={"mode":"standard","max_attempts":4},
       request_checksum_calculation="when_required",response_checksum_validation="when_required"))
def read(s3,key,cap):
    r=s3.get_object(Bucket=BUCKET,Key=key)
    try:b=r["Body"].read(cap+1)
    finally:r["Body"].close()
    if len(b)>cap or len(b)!=r["ContentLength"]:raise RuntimeError("R2 source too big or truncated")
    return b,r.get("Metadata",{})
def create(raw):
    with Image.open(io.BytesIO(raw)) as im:
        im=ImageOps.exif_transpose(im)
        im.load()
        if im.width<100 or im.height<100:raise ValueError("Too small to print")
        im=im.convert("RGB")
        scale=min(1,2480/im.width if im.height>=im.width else 3508/im.width,
                       3508/im.height if im.height>=im.width else 2480/im.height)
        nw=max(1,round(im.width*scale)); nh=max(1,round(im.height*scale))
        if (nw,nh)!=(im.width,im.height):im=im.resize((nw,nh),Image.Resampling.LANCZOS)
        footer=44
        page=Image.new("RGB",(nw,nh+footer),"white");page.paste(im,(0,0))
        font=ImageFont.load_default(size=16)
        line="DAU XUA CUA DAO  |  dauxuacuadao.info.vn  |  BAN IN TU LIEU CO LUU DAU"
        ImageDraw.Draw(page).text((max(6,int(nw*.015)),nh+8),line,fill=(70,70,70),font=font)
        for quality in (93,89,85,80,73):
            out=io.BytesIO();page.save(out,format="JPEG",quality=quality,optimize=True,progressive=True,subsampling=0)
            rawout=out.getvalue()
            if 500<=len(rawout)<=MAX_OUT:return rawout
        raise RuntimeError("Print derivative cannot fit 4MB cap")
def main():
    data=json.loads(ALLOWED.read_text("utf8"));paths=data.get("paths")
    pub=json.loads(PUBLISHED.read_text("utf8"))
    valid={x["path"]:x for x in pub["objects"]}
    if data.get("count")!=133 or not isinstance(paths,list) or len(paths)!=133 or len(set(paths))!=133:raise RuntimeError("Print allowlist changed unexpectedly")
    if not all(P.fullmatch(p) and p in valid for p in paths):raise RuntimeError("Non-published source path in print allowlist")
    s3=client();count=0;total=0
    for index,path in enumerate(paths,1):
        expected=valid[path];raw,metadata=read(s3,SRC+path,LIMIT)
        digest=hashlib.sha256(raw).hexdigest()
        if len(raw)!=expected["bytes"] or digest!=metadata.get("sha256"):
            raise RuntimeError("Private archived source SHA mismatch: no derivatives served")
        derived=create(raw);sha=hashlib.sha256(derived).hexdigest();key=TARGET+path+".jpg"
        try:old,md=read(s3,key,MAX_OUT)
        except s3.exceptions.NoSuchKey:old=None
        if old is not None:
            if hashlib.sha256(old).hexdigest()!=sha or md.get("source-sha256")!=digest:
                raise RuntimeError("Already-published derivative conflict: refuse overwrite")
        else:
            s3.put_object(Bucket=BUCKET,Key=key,Body=derived,ContentLength=len(derived),ContentType="image/jpeg",CacheControl="public,max-age=86400",
              Metadata={"sha256":sha,"source-sha256":digest,"policy":"published-print-stamped-v1"})
        check,md=read(s3,key,MAX_OUT)
        if check!=derived or md.get("sha256")!=sha or md.get("source-sha256")!=digest:raise RuntimeError("Printable R2 derivative verify failed")
        count+=1;total+=len(derived)
        print(f"PRINT DERIVATIVE VERIFIED {index}/{len(paths)} bytes={len(derived)}",flush=True)
    print(json.dumps({"status":"VERIFIED","count":count,"total_bytes":total,"public_approved_only":True,"originals_unchanged":True}),flush=True)
if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("SAFE STOP: "+type(exc).__name__+" (no archive originals modified)",file=sys.stderr,flush=True)
        sys.exit(1)
