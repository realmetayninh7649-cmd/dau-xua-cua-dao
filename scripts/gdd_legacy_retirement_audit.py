#!/usr/bin/env python3
"""One-pass legacy retirement audit/copy. No deletes, no DB changes, no publication.
Private paths and credentials never appear in logs. Source downloads are bounded.
"""
import os, re, json, hashlib, collections, urllib.request, urllib.error, urllib.parse
from pathlib import Path
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

HOST="gwpdgubxoquhrfbolftq.supabase.co"
ROOT="https://"+HOST
D1="https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/"
BUCKET="gdd-dau-xua-cua-dao"
PRIVATE="legacy-retirement-v1/"
LIMIT=250_000_000
MAX_FILE=64_000_000
SOURCE_COUNTS={"dao-su-images":831,"dao-su-documents":3,"dao-su-audio":1,"dao-su-videos":0,"dao-su-submissions":0}
PDFS=[
("documents/1794684373312-e808f501-1bba-458d-b82f-f5f096479426.pdf",10098129),
("documents/1794684462288-fc373424-39bf-4d8d-950c-2195aa01a603.pdf",9932650),
("media/1794860043784-52816aff-f9f7-4790-9e91-d87d7a86fc96.pdf",34412351)]
AUDIO="radio/1794152210157-3l8hj18qb9.mp3"
AUDIO_SIZE=16116406
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kw): return None
opener=urllib.request.build_opener(NoRedirect())
def http(url,headers=None,data=None,maxbytes=8_000_000):
    req=urllib.request.Request(url,headers=headers or {},data=data)
    with opener.open(req,timeout=35) as r:
        b=r.read(maxbytes+1)
        if r.status!=200 or len(b)>maxbytes: raise ValueError("HTTP status/length invalid")
        return b
def safe_path(s):
    return isinstance(s,str) and 0<len(s)<=800 and all(p not in ("",".","..") and not any(ord(c)<32 for c in p) for p in s.split("/"))
def d1_counts():
    expected={"people":50,"posts":17,"media":13,"videos":8,"obituaries":2,"documents":21,"gallery":615,"placements":8,"gdd_memorials":5,"gdd_audio_programs":2,"gdd_calendar_memorials":0}
    out={}
    for kind,minimum in expected.items():
        total=0
        for offset in range(0,5100,100):
            rows=json.loads(http(D1+kind+"?limit=100&offset="+str(offset)))["data"]
            if not isinstance(rows,list) or len(rows)>100: raise ValueError("D1 invalid")
            if kind not in ("gallery","placements") and any(row.get("published") is not True for row in rows): raise ValueError("D1 non-public row")
            total+=len(rows)
            if len(rows)<100: break
        else: raise ValueError("D1 limit exceeded")
        out[kind]={"count":total,"historical_minimum_met":total>=minimum}
    print("D1_PUBLIC_COUNTS="+json.dumps(out,sort_keys=True),flush=True)
def make_s3():
    account=os.environ.get("CLOUDFLARE_ACCOUNT_ID","")
    access=os.environ.get("GDD_R2_ARCHIVE_ACCESS_KEY_ID","")
    secret=os.environ.get("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY","")
    if not re.fullmatch(r"[a-fA-F0-9]{32}",account) or not access or not secret: raise ValueError("R2 credentials absent")
    return boto3.client("s3",endpoint_url="https://"+account+".r2.cloudflarestorage.com",aws_access_key_id=access,aws_secret_access_key=secret,region_name="auto",config=Config(signature_version="s3v4",s3={"addressing_style":"path"},request_checksum_calculation="when_required",response_checksum_validation="when_required"))
def inventory(s3):
    out={}
    for page in s3.get_paginator("list_objects_v2").paginate(Bucket=BUCKET):
        for x in page.get("Contents",[]):
            if x["Key"] in out: raise ValueError("duplicate R2 key")
            out[x["Key"]]=x
    return out
def known_audit(items):
    m=json.loads(Path("maintenance-tasks/r2-images-published-manifest.json").read_text())
    rows=m["objects"]
    if m["count"]!=700 or len(rows)!=700: raise ValueError("Unexpected published manifest")
    originals=sum(items.get("legacy-private-images-v1/"+x["path"],{}).get("Size")==x["bytes"] for x in rows)
    previews=sum(0<items.get("legacy-private-image-previews-v1/"+x["path"]+".webp",{}).get("Size",0)<=8*1024*1024 for x in rows)
    pdfs=sum(any(k.startswith("legacy-private-dk016/") and k.endswith("/"+p.rsplit("/",1)[-1]) and x["Size"]==n for k,x in items.items()) for p,n in PDFS)
    print("R2_METADATA_AUDIT="+json.dumps({"objects":len(items),"bytes":sum(x["Size"] for x in items.values()),"published_originals_size_match":originals,"published_previews_present":previews,"legacy_pdf_name_size_match":pdfs}),flush=True)
def source_list(key):
    headers={"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json"}
    out=[]
    for bucket,expected in SOURCE_COUNTS.items():
        queue=[""]; seen=set(); n=0
        while queue:
            prefix=queue.pop()
            if prefix in seen or len(seen)>5000: raise ValueError("Source listing invalid")
            seen.add(prefix)
            for offset in range(0,10000,100):
                body=json.dumps({"prefix":prefix,"limit":100,"offset":offset,"sortBy":{"column":"name","order":"asc"}}).encode()
                rows=json.loads(http(ROOT+"/storage/v1/object/list/"+bucket,headers,body))
                if not isinstance(rows,list) or len(rows)>100: raise ValueError("Source listing invalid")
                for row in rows:
                    name=prefix+"/"+row["name"] if prefix else row["name"]
                    if not safe_path(name): raise ValueError("Source path invalid")
                    if row.get("id") is None:
                        queue.append(name);continue
                    md=row.get("metadata") or {}; size=int(md.get("size",-1))
                    if not 0<size<=MAX_FILE: raise ValueError("Source size outside safe bound")
                    out.append((bucket,name,size,str(md.get("eTag","")).strip('"').lower()))
                    n+=1
                if len(rows)<100: break
            else: raise ValueError("Source pagination exceeded")
        if n!=expected: raise ValueError("Source inventory changed from verified SQL baseline")
    if len({(x[0],x[1]) for x in out})!=sum(SOURCE_COUNTS.values()): raise ValueError("Source duplicate")
    return out,headers
def hashes(s3,k,size):
    r=s3.get_object(Bucket=BUCKET,Key=k)
    h=hashlib.sha256(); md=hashlib.md5(); total=0
    try:
        for chunk in r["Body"].iter_chunks(1024*1024):
            total+=len(chunk)
            if total>size: raise ValueError("R2 size mismatch")
            h.update(chunk);md.update(chunk)
    finally: r["Body"].close()
    if total!=size: raise ValueError("R2 size mismatch")
    return h.hexdigest(),md.hexdigest()
def candidate_keys(items,bucket,name,size):
    dest=PRIVATE+bucket+"/"+name
    candidates=[dest]
    if bucket=="dao-su-images": candidates.append("legacy-private-images-v1/"+name)
    if bucket=="dao-su-documents":
        candidates += [k for k,x in items.items() if k.startswith("legacy-private-dk016/") and k.endswith("/"+name.rsplit("/",1)[-1]) and x["Size"]==size]
    return [k for k in candidates if items.get(k,{}).get("Size")==size]
def copy(s3,items,entry,headers,authenticated,remaining):
    bucket,name,size,etag=entry; dest=PRIVATE+bucket+"/"+name
    candidates=candidate_keys(items,bucket,name,size)
    for k in candidates:
        if re.fullmatch(r"[0-9a-f]{32}",etag):
            # Only a matching source ETag and actual bytes qualify as content evidence.
            _,md=hashes(s3,k,size)
            if md==etag:return "already_verified",0
    if dest in items:return "destination_conflict",0
    if size>remaining:return "budget_blocked",0
    endpoint="/storage/v1/object/"+("authenticated/" if authenticated else "public/")
    body=http(ROOT+endpoint+bucket+"/"+urllib.parse.quote(name,safe="/"),headers,maxbytes=size)
    if len(body)!=size:raise ValueError("Source length mismatch")
    if re.fullmatch(r"[0-9a-f]{32}",etag) and hashlib.md5(body).hexdigest()!=etag:raise ValueError("Source ETag mismatch")
    if bucket=="dao-su-audio" and not (body.startswith(b"ID3") or (len(body)>3 and body[0]==255 and body[1]&224==224)):raise ValueError("MP3 signature mismatch")
    digest=hashlib.sha256(body).hexdigest()
    for k in candidates:
        if hashes(s3,k,size)[0]==digest:return "already_verified",size
    try:
        s3.put_object(Bucket=BUCKET,Key=dest,Body=body,IfNoneMatch="*",ContentType="application/octet-stream",Metadata={"sha256":digest,"source-bucket":bucket})
    except ClientError as e:
        if e.response.get("ResponseMetadata",{}).get("HTTPStatusCode") in (409,412):return "destination_conflict",size
        raise
    if hashes(s3,dest,size)[0]!=digest:raise ValueError("R2 SHA256 readback mismatch")
    items[dest]={"Size":size}
    return "copied_verified",size
def main():
    try:d1_counts()
    except urllib.error.HTTPError as e:print('D1_AUDIT_HTTP='+str(e.code),flush=True)
    except Exception as e:print('D1_AUDIT_UNVERIFIED='+type(e).__name__,flush=True)
    s3=make_s3();items=inventory(s3);known_audit(items)
    key=os.environ.get("SUPABASE_SERVICE_ROLE_KEY","")
    auth=False
    if key:
        try:
            entries,headers=source_list(key);auth=True
        except urllib.error.HTTPError as e:
            print("AUTHENTICATED_SOURCE_LIST_HTTP="+str(e.code),flush=True)
        except Exception:
            print("AUTHENTICATED_SOURCE_LIST_UNVERIFIED",flush=True)
    if not auth:
        print("FULL_SOURCE_INVENTORY_UNAVAILABLE; only explicitly published MP3 can be attempted",flush=True)
        entries=[("dao-su-audio",AUDIO,AUDIO_SIZE,"")];headers={}
    # Attempt the known missing audio first. Existing original matches never need source egress.
    entries.sort(key=lambda e:(e[0]!="dao-su-audio",e[0],e[1]))
    stats=collections.Counter();used=0
    for entry in entries:
        try:
            status,read=copy(s3,items,entry,headers,auth,LIMIT-used)
            used+=read;stats[status]+=1
        except urllib.error.HTTPError as e:
            stats["source_http_"+str(e.code)]+=1
            if e.code in (401,402,403,429):break
        except Exception as e:
            print("SAFE_STOP_TYPE="+type(e).__name__,flush=True)
            stats["error"]+=1;break
    print("RETIREMENT_RESULT="+json.dumps({"authenticated_full_inventory":auth,"expected":len(entries),"results":dict(stats),"source_bytes_read":used,"supabase_mutated":False,"d1_mutated":False,"published_anything":False},sort_keys=True),flush=True)
    if not auth or stats["already_verified"]+stats["copied_verified"]!=len(entries):
        raise SystemExit("Retirement not verified: KEEP legacy source")
if __name__=="__main__":
    try:main()
    except SystemExit:raise
    except Exception as e:
        print("SAFE_STOP_TYPE="+type(e).__name__,flush=True)
        raise SystemExit(1)
