#!/usr/bin/env python3
"""One-time encrypted backup of private originals/ R2 objects.
Never logs object names or contents; never writes to R2; GitHub artifacts contain ciphertext only.
"""
from __future__ import annotations
import os, re, json, base64, hashlib, heapq, tarfile, tempfile, subprocess, pathlib, io, sys
import boto3
from botocore.config import Config

BUCKET="gdd-dau-xua-cua-dao"
PREFIX="originals/"
PARTS=16
LIMIT_SINGLE=128*1024*1024
PUBLIC_KEY=pathlib.Path("maintenance-tasks/gdrive-backup-recipient-public-key.b64")
OUTPUT=pathlib.Path("/tmp/gdd-r2-new-originals")
KEY_RE=re.compile(r"originals/[0-9a-f-]{36}/[0-9a-f-]{36}/original\.(jpg|jpeg|png|webp|gif|tif|tiff|heic|heif|avif|pdf|doc|docx)$",re.I)
def client():
    aid=os.getenv("CLOUDFLARE_ACCOUNT_ID","")
    access=os.getenv("GDD_R2_ARCHIVE_ACCESS_KEY_ID","")
    secret=os.getenv("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY","")
    if not re.fullmatch(r"[a-fA-F0-9]{32}",aid) or not re.fullmatch(r"[a-fA-F0-9]{32}",access) or len(secret)<12:
        raise ValueError("Missing or invalid read-only R2 credentials")
    return boto3.client("s3",endpoint_url=f"https://{aid}.r2.cloudflarestorage.com",
       aws_access_key_id=access,aws_secret_access_key=secret,region_name="auto",
       config=Config(signature_version="s3v4",s3={"addressing_style":"path"},
                     retries={"max_attempts":4,"mode":"standard"},
                     request_checksum_calculation="when_required",
                     response_checksum_validation="when_required"))
def list_sources(s3):
    found=[];token=None
    while True:
        args={"Bucket":BUCKET,"Prefix":PREFIX,"MaxKeys":1000}
        if token: args["ContinuationToken"]=token
        page=s3.list_objects_v2(**args)
        for x in page.get("Contents",[]):
            key=x["Key"];length=int(x["Size"])
            if not KEY_RE.fullmatch(key) or length<1 or length>LIMIT_SINGLE:
                raise ValueError("Unexpected private original key or size")
            found.append((key,length))
        if not page.get("IsTruncated"):break
        token=page.get("NextContinuationToken")
        if not token:raise ValueError("Missing pagination continuation")
    if not 200<=len(found)<=200000 or sum(n for _,n in found)<900000000:
        raise ValueError("Unexpected R2 originals inventory size; abort")
    if len(set(key for key,_ in found))!=len(found):
        raise ValueError("Duplicate R2 keys")
    return found
def partition(found):
    bins=[[] for _ in range(PARTS)]
    heap=[(0,i) for i in range(PARTS)];heapq.heapify(heap)
    for row in sorted(found,key=lambda x:(-x[1],x[0])):
        size,idx=heapq.heappop(heap);bins[idx].append(row)
        heapq.heappush(heap,(size+row[1],idx))
    return bins
def tarinfo(name,size):
    item=tarfile.TarInfo(name)
    item.uid=item.gid=0;item.uname=item.gname="";item.mode=0o600;item.mtime=0;item.size=size
    return item
def verified_download(s3,key,expected,output):
    res=s3.get_object(Bucket=BUCKET,Key=key)
    if int(res["ContentLength"])!=expected:raise ValueError("Changed source ContentLength")
    digest=hashlib.sha256();bytes_read=0
    with output.open("wb") as fd:
        for block in iter(lambda:res["Body"].read(1024*1024),b""):
            bytes_read+=len(block)
            if bytes_read>expected:raise ValueError("R2 object length exceeded expected")
            digest.update(block);fd.write(block)
    res["Body"].close()
    if bytes_read!=expected:raise ValueError("Truncated R2 original")
    return digest.hexdigest()
def main():
    raw_index=os.getenv("GDD_ORIGINAL_SHARD_INDEX","")
    if not raw_index.isdigit():raise ValueError("Missing shard index")
    index=int(raw_index)
    if not 0<=index<PARTS:raise ValueError("Invalid shard index")
    s3=client();items=list_sources(s3);shard=partition(items)[index]
    if not shard:raise ValueError("Empty shard")
    print("Verified source R2 originals inventory: "+str(len(items))+" objects, "+
          str(sum(n for _,n in items))+" bytes. Shard "+str(index+1)+"/"+str(PARTS),flush=True)
    pub=base64.b64decode(PUBLIC_KEY.read_text("ascii").strip(),validate=True)
    if not pub.startswith(b"-----BEGIN PGP PUBLIC KEY BLOCK-----"):
        raise ValueError("Invalid archive recipient PGP public key")
    with tempfile.TemporaryDirectory(prefix="gdd-new-orig-") as scratch:
        work=pathlib.Path(scratch);stage=work/"all.tar";src=work/"source-object";files=[]
        with tarfile.open(stage,"w",format=tarfile.PAX_FORMAT) as archive:
            for number,(key,length) in enumerate(shard,1):
                sha=verified_download(s3,key,length,src)
                with src.open("rb") as fp:archive.addfile(tarinfo(key,length),fp)
                src.unlink(missing_ok=True)
                files.append({"key":key,"bytes":length,"sha256":sha})
                print(f"SHA256 verified source {number}/{len(shard)}",flush=True)
            data=json.dumps({"format":"GDD-new-originals-backup-v1",
                "bucket":BUCKET,"prefix":PREFIX,"part":index+1,"parts":PARTS,
                "original_count":len(shard),"total_inventory":len(items),
                "original_bytes":sum(n for _,n in shard),"files":files},
                ensure_ascii=False,separators=(",",":")).encode("utf8")
            archive.addfile(tarinfo("MANIFEST.json",len(data)),io.BytesIO(data))
        gnupg=work/"gpg";gnupg.mkdir(mode=0o700)
        env={**os.environ,"GNUPGHOME":str(gnupg)}
        subprocess.run(["gpg","--batch","--quiet","--import"],input=pub,
           stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,check=True,timeout=30)
        OUTPUT.mkdir(mode=0o700,exist_ok=True)
        cipher=OUTPUT/f"GDD-R2-NEW-ORIGINALS-{index+1:02d}-OF-{PARTS:02d}.tar.gpg"
        subprocess.run(["gpg","--batch","--quiet","--trust-model","always",
          "--recipient","gdd-private-manifest@example.invalid","--encrypt",
          "--output",str(cipher),str(stage)],
          stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,check=True,timeout=200)
        n=cipher.stat().st_size
        if n<sum(s for _,s in shard)//3 or n>sum(s for _,s in shard)+5*1024*1024:
            raise ValueError("Ciphertext size outside safety bounds")
        digest=hashlib.sha256(cipher.read_bytes()).hexdigest()
        print(json.dumps({"result":"encrypted-originals-shard-ready",
            "part":index+1,"parts":PARTS,"count":len(shard),
            "original_bytes":sum(x[1] for x in shard),"ciphertext_bytes":n,
            "encrypted_sha256":digest,"read_only":True}),flush=True)
if __name__=="__main__":
    try:main()
    except Exception as err:
        print("SAFE FAILURE: "+type(err).__name__+"; no private R2 names, data or keys printed",file=sys.stderr)
        sys.exit(1)
