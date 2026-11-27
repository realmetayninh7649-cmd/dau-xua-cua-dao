#!/usr/bin/env python3
"""Daily read-only delta backup of R2 private originals; artifact contains OpenPGP ciphertext ONLY.
Never logs private keys, source paths, filenames, or original data.
"""
from __future__ import annotations
import os,re,datetime,json,base64,hashlib,tarfile,tempfile,subprocess,pathlib,io,sys
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
BUCKET="gdd-dau-xua-cua-dao"
PREFIX="originals/"
BASELINE=datetime.datetime(2026,11,19,11,28,0,tzinfo=datetime.timezone.utc)
MAX_DELTA_BYTES=100*1024*1024
MAX_DELTA_FILES=120
MAX_SHARDS=24
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
def objects(s3,prefix=PREFIX):
    all_entries=[];token=None
    while True:
        params={"Bucket":BUCKET,"Prefix":prefix,"MaxKeys":1000}
        if token:params["ContinuationToken"]=token
        response=s3.list_objects_v2(**params)
        for x in response.get("Contents",[]):
            key=x["Key"];size=int(x["Size"])
            valid=KEY.fullmatch(key) if prefix==PREFIX else re.fullmatch(r"audio-records-v1/[0-9a-f-]{36}/[0-9a-f]{64}\.mp3",key,re.I) if prefix=="audio-records-v1/" else re.fullmatch(r"meta/[0-9a-f-]{36}\.json",key,re.I)
            if not valid or not 1<=size<=128*1024*1024:
                raise ValueError("Unexpected private R2 source key or size")
            all_entries.append((key,size,x["LastModified"]))
        if not response.get("IsTruncated"):break
        token=response.get("NextContinuationToken")
        if not token:raise ValueError("Incomplete R2 pagination")
    if prefix==PREFIX and (len(all_entries)<249 or sum(e[1] for e in all_entries)<1044975854):
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
    # Do not advance the watermark based on a workflow run alone: the encrypted
    # backup must be verified in the external destination first. Until then, re-read
    # the overlapping interval from the last confirmed full snapshot.
    raw=os.getenv("GDD_BACKUP_CONFIRMED_THROUGH_UTC","").strip()
    confirmed=datetime.datetime.fromisoformat(raw.replace("Z","+00:00")) if raw else BASELINE
    if confirmed.tzinfo is None or confirmed<BASELINE or confirmed>now:
        raise ValueError("Invalid confirmed backup checkpoint")
    cutoff=max(BASELINE,confirmed-datetime.timedelta(hours=6))
    until_raw=os.getenv("GDD_BACKUP_UNTIL_UTC","").strip()
    until=datetime.datetime.fromisoformat(until_raw.replace("Z","+00:00")) if until_raw else now
    if until.tzinfo is None or until<cutoff or until>now:
        raise ValueError("Invalid catch-up end timestamp")
    print("BACKUP_WINDOW_UTC="+cutoff.isoformat()+".."+until.isoformat(),flush=True)
    s3=conn();all_entries=objects(s3)+objects(s3,'audio-records-v1/')+objects(s3,'meta/')
    print('R2_SOURCE_INVENTORY_OK count='+str(len(all_entries)),flush=True)
    recent=sorted([r for r in all_entries if cutoff<=r[2]<=until],key=lambda r:r[0])
    if not recent:
        print("No R2 original objects added/modified in delta window; safe no-op",flush=True)
        return
    total=sum(row[1] for row in recent)
    print("R2_CATCHUP_COUNT="+str(len(recent))+" BYTES="+str(total),flush=True)
    batches=[];batch=[];size=0
    for row in recent:
        if batch and (len(batch)>=MAX_DELTA_FILES or size+row[1]>MAX_DELTA_BYTES):
            batches.append(batch);batch=[];size=0
        batch.append(row);size+=row[1]
    if batch:batches.append(batch)
    if len(batches)>MAX_SHARDS:raise ValueError("Delta exceeds safety cap; use bounded catch-up end timestamp. No checkpoint advanced.")
    print("R2_BACKUP_SHARDS="+str(len(batches)),flush=True)
    for index,batch in enumerate(batches,1):encrypt_batch(s3,batch,index,len(batches),now,cutoff,until)
    print("R2_CATCHUP_COMPLETE="+json.dumps({"parts":len(batches),"objects":len(recent),"bytes":total,"window_end_utc":until.isoformat()}),flush=True)
def encrypt_batch(s3,recent,index,count,now,cutoff,until):
    total=sum(row[1] for row in recent)
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
                "window_start_utc":cutoff.isoformat(),"window_end_utc":until.isoformat(),"object_count":len(recent),
                "original_bytes":total,"part":index,"part_count":count,"files":records},separators=(",",":"),ensure_ascii=False).encode("utf-8")
            tar.addfile(item("MANIFEST.json",len(manifest)),io.BytesIO(manifest))
        home=wd/"gnupg";home.mkdir(mode=0o700)
        env={**os.environ,"GNUPGHOME":str(home)}
        subprocess.run(["gpg","--batch","--quiet","--import"],input=pub,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True,env=env,timeout=30)
        out=pathlib.Path("/tmp/gdd-daily-encrypted");out.mkdir(mode=0o700,exist_ok=True)
        cipher=out/f"GDD-R2-DAILY-DELTA-{now.date().isoformat()}-{os.getenv('GITHUB_RUN_ID','manual')}-part-{index:02d}.tar.gpg"
        subprocess.run(["gpg","--batch","--quiet","--trust-model","always",
            "--recipient","gdd-private-manifest@example.invalid","--encrypt","--output",str(cipher),str(tarpath)],
            stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True,env=env,timeout=240)
        if cipher.stat().st_size < 128 or cipher.stat().st_size > total + 5*1024*1024:
            raise ValueError("Encrypted delta size mismatch")
        print(json.dumps({"result":"ENCRYPTED-DELTA-READY","part":index,"part_count":count,"original_count":len(recent),
            "original_bytes":total,"ciphertext_bytes":cipher.stat().st_size,
            "ciphertext_sha256":hashlib.sha256(cipher.read_bytes()).hexdigest(),
            "safe_to_transfer":True}),flush=True)
if __name__=="__main__":
    try:main()
    except ClientError as error:
        code=str(error.response.get("Error",{}).get("Code","Unknown"))
        operation=str(error.operation_name)
        code=code if re.fullmatch(r"[A-Za-z0-9_-]{1,80}",code) else "Unknown"
        operation=operation if re.fullmatch(r"[A-Za-z0-9_-]{1,80}",operation) else "Unknown"
        status=error.response.get("ResponseMetadata",{}).get("HTTPStatusCode","unknown")
        print(f"R2_BACKUP_BLOCKED operation={operation} code={code} http={status}; no credentials or object names printed",file=sys.stderr)
        sys.exit(1)
    except Exception as error:
        safe_messages=("Unexpected private R2 source key or size","R2 original inventory shrank: source preservation warning","Delta exceeds safety cap; use bounded catch-up end timestamp. No checkpoint advanced.","Invalid archive public key","Encrypted delta size mismatch","Changed R2 source size","Truncated R2 object","Incomplete R2 pagination","Duplicated R2 original key","R2 read-only credentials unavailable")
        print("SAFE DELTA BACKUP ERROR: "+(str(error) if str(error) in safe_messages else type(error).__name__)+"; no private R2 filenames or keys exposed",file=sys.stderr)
        sys.exit(1)
