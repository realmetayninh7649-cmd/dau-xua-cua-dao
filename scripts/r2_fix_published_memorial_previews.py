#!/usr/bin/env python3
"""One-off safety fix: create lightweight R2 WebP previews for 5 ALREADY PUBLISHED memorial portraits.
Only source = existing verified PRIVATE R2 backups. No Supabase reads/writes and no originals exposed.
"""
from __future__ import annotations
import tempfile
from pathlib import Path
from r2_preserve_published_images import BUCKET,make_s3,make_preview,sha256_file,verify_r2,exists

ORIGINAL_PREFIX="legacy-unlisted-private-v1/"
PREVIEW_PREFIX="legacy-private-image-previews-v1/"
ROWS=(
 ("memorials/1794948675991-c161eafe-0f0e-4305-a58a-a51cd8c6004c.png",5205232),
 ("memorials/1794211599597-3783dc64-d926-4054-8be2-07df132ddb67.jpg",2468823),
 ("memorials/1794186660631-41499137-cc91-4314-bd99-c9ef6e2af93f.jpg",730496),
 ("memorials/1794039717377-9b2ea46b-62e3-4141-8166-f1383e83515a.jpg",493727),
 ("memorials/1793836888388-4043a5f0-a02f-4ffa-aca3-e6ef157cc9a9.jpg",4672299),
)

def main():
    if not Path("maintenance-tasks/r2-images-published-manifest.json").exists():
        raise RuntimeError("Missing original 700-photo manifest")
    if len(ROWS)!=5 or len({x[0] for x in ROWS})!=5:
        raise RuntimeError("Published memorial image list must contain exactly five distinct paths")
    s3=make_s3()
    total=0
    with tempfile.TemporaryDirectory(prefix="gdd-memorial-published-") as temp:
        folder=Path(temp)
        for i,(name,expected_bytes) in enumerate(ROWS):
            if not name.startswith("memorials/"):raise RuntimeError("Unauthorized memorial prefix")
            original_key=ORIGINAL_PREFIX+name
            source=s3.get_object(Bucket=BUCKET,Key=original_key)
            if source.get("ContentLength")!=expected_bytes:
                raise RuntimeError("Private R2 source size differs from verified Supabase inventory")
            source_file=folder/"source"
            with source_file.open("wb") as output:
                while True:
                    block=source["Body"].read(1024*1024)
                    if not block:break
                    output.write(block)
            source["Body"].close()
            sha,size=sha256_file(source_file)
            if size!=expected_bytes or source.get("Metadata",{}).get("sha256")!=sha:
                raise RuntimeError("Original private source hash mismatch")
            preview=folder/"preview.webp"
            preview_sha,preview_size=make_preview(source_file,preview)
            key=PREVIEW_PREFIX+name+".webp"
            if exists(s3,key):
                verify_r2(s3,key,preview_sha,preview_size)
            else:
                with preview.open("rb") as file:
                    s3.put_object(Bucket=BUCKET,Key=key,Body=file,
                        ContentLength=preview_size,ContentType="image/webp",
                        Metadata={"sha256":preview_sha,"source-sha256":sha,"public":"false"})
                verify_r2(s3,key,preview_sha,preview_size)
            head=s3.head_object(Bucket=BUCKET,Key=key)
            if (head.get("ContentType")!="image/webp" or
                head.get("Metadata",{}).get("source-sha256")!=sha):
                raise RuntimeError("R2 preview content type or source provenance mismatch")
            total+=preview_size
            source_file.unlink()
            preview.unlink()
            print(f"PUBLISHED MEMORIAL PREVIEW VERIFIED {i+1}/5: original={size}, webp={preview_size}, sha256 OK",flush=True)
    print(f"ALL FIVE PUBLISHED MEMORIAL PREVIEWS VERIFIED: total_webp_bytes={total}; originals/private images unchanged",flush=True)

if __name__=="__main__":main()
