"""Restore two ALREADY PUBLISHED Radio cover previews from read-only R2 backups.
The private 2–3 MB source PNG objects are NEVER copied to public Git.
Only newly optimized WebP previews are written to audio/*.webp.
"""
import io,os,re,sys,hashlib,json
from pathlib import Path
import boto3
from botocore.config import Config
from PIL import Image,ImageOps
from PIL import ImageFile
Image.MAX_IMAGE_PIXELS=36_000_000
ImageFile.LOAD_TRUNCATED_IMAGES=False
account=os.getenv("CLOUDFLARE_ACCOUNT_ID","")
access=os.getenv("GDD_R2_ARCHIVE_ACCESS_KEY_ID","")
secret=os.getenv("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY","")
if not re.fullmatch(r"[0-9a-fA-F]{32}",account) or not access or not secret:
 raise SystemExit("Required read-only R2 storage credentials missing")
client=boto3.client("s3",endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
 aws_access_key_id=access,aws_secret_access_key=secret,region_name="auto",
 config=Config(signature_version="s3v4",s3={"addressing_style":"path"},
 request_checksum_calculation="when_required",response_checksum_validation="when_required"))
BUCKET="gdd-dau-xua-cua-dao"
TARGETS=[
 ("radio_hai_muoi_nam","1794152217530-5ahjax4wdl.png",2526475,"audio/radio-hai-muoi-nam-cover.webp"),
 ("niem_danh_kim_mau","1794151538679-fo6v0inu25.png",2946467,"audio/niem-danh-kim-mau-cover.webp")
]
matches={name:[] for name,_,_,_ in TARGETS}
token=None
while True:
 p={"Bucket":BUCKET,"MaxKeys":1000}
 if token:p["ContinuationToken"]=token
 res=client.list_objects_v2(**p)
 for obj in res.get("Contents",[]):
  for name,filename,expected,_ in TARGETS:
   if obj["Key"].endswith(filename) and int(obj["Size"])==expected:
    matches[name].append(obj["Key"])
 if not res.get("IsTruncated"):break
 token=res.get("NextContinuationToken")
 if not token:raise SystemExit("Incomplete R2 object enumeration")
for name,filename,expected,target in TARGETS:
 keys=matches[name]
 if len(keys)!=1:
  raise SystemExit("Missing or ambiguous published source for "+name+"; never guess private keys")
 src=client.get_object(Bucket=BUCKET,Key=keys[0])
 raw=src["Body"].read(expected+1)
 if len(raw)!=expected or not raw.startswith(b"\x89PNG\r\n\x1a\n") or b"IEND" not in raw[-32:]:
  raise SystemExit("PNG original is incomplete; cannot restore public derivative")
 with Image.open(io.BytesIO(raw)) as im:
  im.verify()
 with Image.open(io.BytesIO(raw)) as im:
  im=ImageOps.exif_transpose(im)
  if min(im.size)<64 or max(im.size)>8000:
   raise SystemExit("Invalid cover dimensions")
  im.thumbnail((960,960),Image.Resampling.LANCZOS)
  if im.mode not in ("RGB","RGBA"):
   im=im.convert("RGBA" if "A" in im.getbands() else "RGB")
  result=io.BytesIO()
  im.save(result,format="WEBP",quality=84,method=6)
  data=result.getvalue()
  if not (64<len(data)<1200000) or data[:4]!=b"RIFF" or data[8:12]!=b"WEBP":
   raise SystemExit("Public preview format invalid")
 path=Path(target)
 if path.exists() and path.read_bytes()!=data:
  raise SystemExit("Refusing to overwrite existing derivative: "+target)
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_bytes(data)
 print("PUBLISHED_RADIO_COVER_RESTORED",name,"private_original_bytes",len(raw),
  "published_WEBP_bytes",len(data),"sha256_webp",hashlib.sha256(data).hexdigest())
print("R2 radio cover originals remained untouched; no R2 write or private key disclosure.")
