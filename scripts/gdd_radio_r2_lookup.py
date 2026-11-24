"""Metadata-only R2 lookup for three explicitly published Radio media sources.
No object bytes read, no private object names or credentials logged.
"""
import os,re,collections,json
import boto3
from botocore.config import Config
account=os.environ.get("CLOUDFLARE_ACCOUNT_ID","")
access=os.environ.get("GDD_R2_ARCHIVE_ACCESS_KEY_ID","")
secret=os.environ.get("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY","")
if not re.fullmatch(r"[0-9A-Fa-f]{32}",account) or not access or not secret:
 raise SystemExit("Read-only R2 S3 credentials absent")
s3=boto3.client("s3",endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
 aws_access_key_id=access,aws_secret_access_key=secret,region_name="auto",
 config=Config(signature_version="s3v4",s3={"addressing_style":"path"},
  request_checksum_calculation="when_required",response_checksum_validation="when_required"))
targets={
 "published_radio_mp3":"1794152210157-3l8hj18qb9.mp3",
 "published_radio_cover":"1794152217530-5ahjax4wdl.png",
 "published_chant_cover":"1794151538679-fo6v0inu25.png"
}
found={name:[] for name in targets}
counts=collections.Counter()
token=None
while True:
 args={"Bucket":"gdd-dau-xua-cua-dao","MaxKeys":1000}
 if token:args["ContinuationToken"]=token
 response=s3.list_objects_v2(**args)
 for item in response.get("Contents",[]):
  key=item["Key"]
  counts["objects_scanned"]+=1
  for name,needle in targets.items():
   if needle in key:
    found[name].append({"size":int(item["Size"]),"sha256_available":False})
 if not response.get("IsTruncated"):break
 token=response.get("NextContinuationToken")
 if not token:raise SystemExit("Incomplete R2 listing")
print("R2_PUBLISHED_RADIO_METADATA_ONLY="+json.dumps({
 "objects_scanned":counts["objects_scanned"],
 "matches":{k:{"count":len(v),"sizes":[x["size"] for x in v]} for k,v in found.items()}
},sort_keys=True))
print("R2 was NOT mutated; private paths never printed")
