"""Recover only explicitly published Radio MP3/cover assets from legacy Storage.
Read-only HTTP requests to original sources. Never delete/update existing assets.
GitHub Pages copy is made ONLY after exact byte-count + file signature checks.
"""
import json
import pathlib
import urllib.request
import urllib.error
import hashlib
import os
from urllib.parse import urlsplit

ORIGIN="https://gwpdgubxoquhrfbolftq.supabase.co"
BASE=ORIGIN+"/storage/v1/object/public/"
ASSETS=[
 {"kind":"audio","name":"radio-hai-muoi-nam.mp3","from":"dao-su-audio/radio/1794152210157-3l8hj18qb9.mp3","size":16116406},
 {"kind":"png","name":"radio-hai-muoi-nam-cover.png","from":"dao-su-images/radio/1794152217530-5ahjax4wdl.png","size":2526475},
 {"kind":"png","name":"niem-danh-kim-mau-cover.png","from":"dao-su-images/radio/1794151538679-fo6v0inu25.png","size":2946467}
]
def valid(kind,data):
    if kind=="png":
        return data.startswith(b"\x89PNG\r\n\x1a\n") and b"IEND" in data[-32:]
    return data.startswith(b"ID3") or (len(data)>3 and data[0]==0xff and data[1]&0xe0==0xe0)
def get_asset(asset):
    path=pathlib.Path("audio")/asset["name"]
    if path.exists():
        existing=path.read_bytes()
        if len(existing)==asset["size"] and valid(asset["kind"],existing):
            print("ALREADY_PRESENT",asset["name"],len(existing))
            return True
        raise RuntimeError("Existing path conflicts; never overwrite")
    url=BASE+asset["from"]
    assert urlsplit(url).hostname=="gwpdgubxoquhrfbolftq.supabase.co"
    req=urllib.request.Request(url,headers={
        "User-Agent":"GDD-Published-Radio-Recovery/1.0",
        "Accept":"audio/mpeg,image/png,application/octet-stream"
    })
    try:
        with urllib.request.urlopen(req,timeout=40) as reply:
            status=reply.status
            final=reply.geturl()
            if urlsplit(final).scheme!="https" or urlsplit(final).hostname!=urlsplit(url).hostname:
                raise RuntimeError("Unsafe media redirect")
            if status!=200:raise RuntimeError("Unexpected source response")
            body=reply.read(asset["size"]+1)
    except urllib.error.HTTPError as error:
        print("LEGACY_MEDIA_UNAVAILABLE",asset["name"],"HTTP",error.code)
        return False
    except (TimeoutError,urllib.error.URLError) as error:
        print("LEGACY_MEDIA_UNAVAILABLE",asset["name"],type(error).__name__)
        return False
    if len(body)!=asset["size"] or not valid(asset["kind"],body):
        print("LEGACY_MEDIA_INVALID",asset["name"],"size",len(body))
        return False
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes(body)
    print("RECOVERED_PUBLISHED_MEDIA",asset["name"],"bytes",len(body),
          "sha256",hashlib.sha256(body).hexdigest())
    return True
if __name__=="__main__":
    result={a["name"]:get_asset(a) for a in ASSETS}
    print("RECOVERY_SUMMARY",json.dumps(result,sort_keys=True))
