#!/usr/bin/env python3
"""Daily read-only delta backup of R2 private originals; artifact contains OpenPGP ciphertext ONLY.
Never logs private keys, source paths, filenames, or original data.
"""
from __future__ import annotations
import os,re,datetime,json,base64,hashlib,tarfile,tempfile,subprocess,pathlib,io,sys
import boto3
from botocore.config import Config
BUCKET="gdd-dau-xua-cua-dao"
PREFIX="originals/"
BASELINE=datetime.datetime(2026,11,19,11,28,0,tzinfo=datetime.timezone.utc)
MAX_DELTA_BYTES=500*1024*1024
MAX_DELTA_FILES=120
KEY=re.compile(r"originals/[0-9a-f-]{36}/[0-9a-f-]{36}/original\.(jpg|jpeg|png|webp|gif|tif|tiff|heic|heif|avif|pdf|doc|docx)$",re.I)
def conn():
    account=os.getenv("CLOUDFLARE_ACCOUNT_ID","")
    access=os.getenv("GDD_R2_ARCHIVE_ACCESS_KEY_ID","")
    secret=os.getenv("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY","")
    if not re.fullmatch(r"[0-9a-fA-F]{32}",account) or not re.fullmatch(r"[0-9a-fA-F]{32}",access) or len(secret)<12:
        raise ValueError("R2 read-only credentials unavailable")
    return boto3.client("s3",endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=access,aws_secret_access_key=secret,region_name="auto",
        config=Config(signature_version="s3v4",s3={"addressing_style":"path"},
             retries={"mode":"standard","max_attempts":4},
             request_checksum_calculation="when_required",response_checksum_validation="when_required"))
def objects(s3):
    all_entries=[];token=None
    while True:
        params={"Bucket":BUCKET,"Prefix":PREFIX,"MaxKeys":1000}
        if token:params["ContinuationToken"]=token
        response=s3.list_objects_v2(**params)
        for x in response.get("Contents",[]):
            key=x["Key"];size=int(x["Size"])
            if not KEY.fullmatch(key) or not 1<=size<=128*1024*1024:
                raise ValueError("Unexpected private R2 source key or size")
            all_entries.append((key,size,x["LastModified"]))
        if not response.get("IsTruncated"):break
        token=response.get("NextContinuationToken")
        if not token:raise ValueError("Incomplete R2 pagination")
    if len(all_entries)<249 or sum(e[1] for e in all_entries)<1044975854:
        raise ValueError("R2 original inventory shrank: source preservation warning")
    if len({row[0] for row in all_entries})!=len(all_entries):
        raise ValueError("Duplicated R2 original key")
    return all_entries
def item(name,size):
    t=tarfile.TarInfo(name)
    t.mode=0o600;t.uid=t.gid=0;t.uname=t.gname="";t.mtime=0;t.size=size
    return t
def main():
    now=datetime.datetime.now(datetime.timezone.utc)
    cutoff=max(BASELINE,now-datetime.timedelta(hours=30))
    s3=conn();all_entries=objects(s3)
    recent=sorted([r for r in all_entries if r[2]>=cutoff],key=lambda r:r[0])
    if not recent:
        print("No R2 original objects added/modified in delta window; safe no-op",flush=True)
        return
    total=sum(row[1] for row in recent)
    if len(recent)>MAX_DELTA_FILES or total>MAX_DELTA_BYTES:
        raise ValueError("Delta over backup safety cap: requires separate new full snapshot")
    pub=base64.b64decode(pathlib.Path("maintenance-tasks/gdrive-backup-recipient-public-key.b64").read_text("ascii").strip(),validate=True)
    if not pub.startswith(b"-----BEGIN PGP PUBLIC KEY BLOCK-----"):
        raise ValueError("Invalid archive public key")
    with tempfile.TemporaryDirectory(prefix="gdd-r2-private-delta-") as tmp:
        wd=pathlib.Path(tmp);tarpath=wd/"delta.tar";one=wd/"source-object";records=[]
        with tarfile.open(tarpath,"w",format=tarfile.PAX_FORMAT) as tar:
            for number,(key,size,stamp) in enumerate(recent,1):
                raw=s3.get_object(Bucket=BUCKET,Key=key)
                if int(raw["ContentLength"])!=size:raise ValueError("Changed R2 source size")
                h=hashlib.sha256();actual=0
                with one.open("wb") as f:
                    for block in iter(lambda:raw["Body"].read(1024*1024),b""):
                        h.update(block);actual+=len(block);f.write(block)
                raw["Body"].close()
                if actual!=size:raise ValueError("Truncated R2 object")
                with one.open("rb") as f:tar.addfile(item(key,size),f)
                one.unlink()
                records.append({"key":key,"bytes":size,"sha256":h.hexdigest(),"modified_utc":stamp.isoformat()})
                print(f"Verified private original {number}/{len(recent)} (SHA256)",flush=True)
            manifest=json.dumps({"format":"GDD-R2-daily-delta-v1","backup_date_utc":now.date().isoformat(),
                "window_start_utc":cutoff.isoformat(),"object_count":len(recent),
                "original_bytes":total,"files":records},separators=(",",":"),ensure_ascii=False).encode("utf-8")
            tar.addfile(item("MANIFEST.json",len(manifest)),io.BytesIO(manifest))
        home=wd/"gnupg";home.mkdir(mode=0o700)
        env={**os.environ,"GNUPGHOME":str(home)}
        subprocess.run(["gpg","--batch","--quiet","--import"],input=pub,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True,env=env,timeout=30)
        out=pathlib.Path("/tmp/gdd-daily-encrypted");out.mkdir(mode=0o700,exist_ok=True)
        cipher=out/f"GDD-R2-DAILY-DELTA-{now.date().isoformat()}-{os.getenv('GITHUB_RUN_ID','manual')}.tar.gpg"
        subprocess.run(["gpg","--batch","--quiet","--trust-model","always",
            "--recipient","gdd-private-manifest@example.invalid","--encrypt","--output",str(cipher),str(tarpath)],
            stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True,env=env,timeout=240)
        if cipher.stat().st_size < total//3 or cipher.stat().st_size > total + 5*1024*1024:
            raise ValueError("Encrypted delta size mismatch")
        print(json.dumps({"result":"ENCRYPTED-DELTA-READY","original_count":len(recent),
            "original_bytes":total,"ciphertext_bytes":cipher.stat().st_size,
            "ciphertext_sha256":hashlib.sha256(cipher.read_bytes()).hexdigest(),
            "safe_to_transfer":True}),flush=True)
if __name__=="__main__":
    try:main()
    except Exception as error:
        print("SAFE DELTA BACKUP ERROR: "+type(error).__name__+"; no private R2 filenames or keys exposed",file=sys.stderr)
        sys.exit(1)
