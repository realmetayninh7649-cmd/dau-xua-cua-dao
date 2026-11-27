"""Repair only approved public document images: private original -> stamped print JPEG.
Never modify original objects, preview objects, non-document assets, or unpublished records.
"""
import json, re, urllib.request, urllib.error, hashlib, datetime, io, os
from PIL import Image
from r2_build_published_print_derivatives import client, read, create, BUCKET, MAX_OUT
from botocore.exceptions import ClientError
API="https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/"
GATE="https://gdd-r2-gateway.realmetayninh7649.workers.dev"
UUID=r"[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}"
PREVIEW=re.compile(re.escape(GATE)+r"/v1/public/("+UUID+r")/preview",re.I)
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={"Origin":"https://dauxuacuadao.info.vn"}),timeout=25) as res:
        return json.load(res)
def rows(path):
    for offset in range(0,5001,100):
        data=get(API+path+("&" if "?" in path else "?")+f"limit=100&offset={offset}")["data"]
        if not isinstance(data,list) or len(data)>100: raise RuntimeError("Invalid public list")
        yield from data
        if len(data)<100:return
    raise RuntimeError("Incomplete pagination")
def asset_ids(record):
    images=list(rows("albums?owner_kind=documents&owner_id="+record["id"]))
    if any(r.get("owner_kind")!="documents" or r.get("owner_id")!=record["id"] for r in images):raise RuntimeError("Owner mismatch")
    links=[record.get("file_url"),*[r.get("image_url") for r in images]]
    # Single-image legacy document with no album: the public cover is its scan.
    if not any(links):links.append(record.get("cover_url"))
    elif not images and not PREVIEW.fullmatch(str(record.get("file_url") or "")) and not re.search(r"\.(jpg|jpeg|png|webp)$",str(record.get("file_url") or ""),re.I):
        if not record.get("file_url"):links.append(record.get("cover_url"))
    return {m.group(1) for url in links if (m:=PREVIEW.fullmatch(str(url or "")))}
def get_meta(s3,aid):
    r=s3.get_object(Bucket=BUCKET,Key="meta/"+aid+".json")
    try: raw=r["Body"].read(65537)
    finally:r["Body"].close()
    if len(raw)>65536:raise RuntimeError("Invalid metadata size")
    return json.loads(raw),r["ETag"]
def d1_sync(aid,record_id):
    # Keep D1's mirror flags consistent; exact asset and published document only.
    url="https://api.cloudflare.com/client/v4/accounts/"+os.environ["CLOUDFLARE_ACCOUNT_ID"]+"/d1/database/56bf9fcc-3f9a-43e5-82f7-8c521f5b370a/query"
    payload={"sql":"UPDATE gdd_r2_assets SET download_ready=1,allow_download=1 WHERE asset_id=? AND record_kind='documents' AND record_id=? AND media_kind='image' AND public_view=1 AND preview_ready=1 AND EXISTS(SELECT 1 FROM documents WHERE id=? AND published=1)","params":[aid,record_id,record_id]}
    req=urllib.request.Request(url,data=json.dumps(payload).encode(),headers={"Authorization":"Bearer "+os.environ["CLOUDFLARE_D1_API_TOKEN"],"Content-Type":"application/json"},method="POST")
    with urllib.request.urlopen(req,timeout=25) as res: out=json.load(res)
    if not out.get("success"):raise RuntimeError("D1 mirror update failed")
def probe(aid):
    req=urllib.request.Request(GATE+"/v1/public/"+aid+"/download",headers={"Origin":"https://dauxuacuadao.info.vn","Range":"bytes=0-15"})
    with urllib.request.urlopen(req,timeout=25) as res:
        if res.status not in (200,206) or not res.headers.get("Content-Type","").startswith("image/jpeg") or res.read(2)!=b"\xff\xd8":raise RuntimeError("Public print verification failed")
def repair(s3,aid,record):
    public=get(GATE+"/v1/public/"+aid)
    if public.get("id")!=aid or public.get("kind")!="image":raise RuntimeError("Public preview not approved")
    meta,etag=get_meta(s3,aid)
    if meta.get("id")!=aid or meta.get("kind")!="image" or meta.get("published") is not True or meta.get("preview") is not True:raise RuntimeError("Not a published image")
    owner=meta.get("owner","");key=meta.get("key","")
    if not re.fullmatch(UUID,owner,re.I) or not re.fullmatch(r"originals/"+re.escape(owner)+"/"+re.escape(aid)+r"/original\.(?:jpg|jpeg|png|webp)",key,re.I):raise RuntimeError("Unexpected original key")
    if meta.get("download") is True and meta.get("allowDownload") is True:
        try:probe(aid);d1_sync(aid,record["id"]);return "already_ready"
        except urllib.error.HTTPError as e:
            if e.code!=404:raise
    printkey="derivatives/"+aid+"/download.jpg"
    try:
        existing,_=read(s3,printkey,8*1024*1024)
        # Do not overwrite an existing derivative or open an unverified private derivative.
        # Only the standard stamped derivative created by this repair may be reused.
        obj=s3.head_object(Bucket=BUCKET,Key=printkey)
        if obj.get("Metadata",{}).get("policy")!="published-document-print-v1":raise RuntimeError("Existing print needs manual verification")
        if hashlib.sha256(existing).hexdigest()!=obj["Metadata"].get("sha256"):raise RuntimeError("Derivative hash mismatch")
    except ClientError as e:
        if e.response.get("Error",{}).get("Code") not in ("NoSuchKey","404","NotFound"):raise
        raw,_=read(s3,key,24*1024*1024)
        if len(raw)!=meta.get("originalBytes"):raise RuntimeError("Original size mismatch")
        derived=create(raw)
        s3.put_object(Bucket=BUCKET,Key=printkey,Body=derived,ContentType="image/jpeg",CacheControl="public,max-age=86400",IfNoneMatch="*",Metadata={"policy":"published-document-print-v1","sha256":hashlib.sha256(derived).hexdigest(),"source-sha256":hashlib.sha256(raw).hexdigest()})
        check,_=read(s3,printkey,MAX_OUT)
        if check!=derived:raise RuntimeError("Print readback mismatch")
    # Recheck published association immediately before conditional metadata update.
    fresh=get(API+"documents/"+record["slug"])["data"]
    if fresh.get("published") is not True or fresh.get("id")!=record["id"] or aid not in asset_ids(fresh):raise RuntimeError("Publication changed")
    newmeta,newetag=get_meta(s3,aid)
    if newetag!=etag:raise RuntimeError("Metadata changed; retry safely")
    newmeta.update(download=True,downloadMime="image/jpeg",allowDownload=True,updatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
    s3.put_object(Bucket=BUCKET,Key="meta/"+aid+".json",Body=json.dumps(newmeta,ensure_ascii=False).encode(),ContentType="application/json",CacheControl="no-store",IfMatch=etag)
    probe(aid)
    d1_sync(aid,record["id"])
    return "repaired"
def main():
    s3=client();ok=fail=0
    for record in rows("documents"):
        if record.get("published") is not True or not re.fullmatch(UUID,str(record.get("id","")),re.I):continue
        for aid in sorted(asset_ids(record)):
            try:
                outcome=repair(s3,aid,record);ok+=1;print("PRINT OK",record["slug"],aid,outcome,flush=True)
            except Exception as e:
                fail+=1;print("PRINT BLOCKED",record["slug"],aid,type(e).__name__,str(e)[:160],flush=True)
    print("SUMMARY",json.dumps({"verified":ok,"blocked":fail,"originals_unchanged":True}),flush=True)
    if fail:raise SystemExit(1)
if __name__=="__main__":main()
