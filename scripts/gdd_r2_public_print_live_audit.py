#!/usr/bin/env python3
# Re-audit after enabling Worker edge cache and public request rate limiter.
"""Live public routing audit. Read-only; never touches a private original or a database row."""
import json,hashlib,urllib.request,urllib.error, pathlib,os,sys,re
BASE="https://gdd-r2-gateway.realmetayninh7649.workers.dev"
ORIGIN="https://dauxuacuadao.info.vn"
def get(path):
    req=urllib.request.Request(BASE+path,headers={"Origin":ORIGIN,"User-Agent":"GDD-SAFE-PRINT-AUDIT/2026"})
    try:
        with urllib.request.urlopen(req,timeout=30) as r:return r.status,r.headers,r.read(4500000)
    except urllib.error.HTTPError as e:return e.code,e.headers,e.read(500)
def assert_route(path,content_type,magic):
    st,h,b=get(path)
    if st!=200 or h.get("Content-Type")!=content_type or h.get("Access-Control-Allow-Origin")!=ORIGIN or not b.startswith(magic):
        raise RuntimeError("Live published derivative not available or corrupt")
    return len(b)
def main():
    manifest=json.loads(pathlib.Path("maintenance-tasks/gdd-public-print-paths.json").read_text("utf8"))
    paths=manifest["paths"]
    if manifest["count"]!=133 or len(paths)!=133:raise RuntimeError("Print list mismatch")
    samples=[paths[0],paths[len(paths)//3],paths[2*len(paths)//3],paths[-1]]
    for n,path in enumerate(samples,1):
        size=assert_route("/v1/legacy-print/"+path+".jpg","image/jpeg",b"\xff\xd8\xff")
        print(f"VERIFIED PUBLISHED PRINT {n}/4 size={size}",flush=True)
    st,h,b=get("/v1/legacy-print/documents/private-no-public-record.jpg.jpg")
    if st==200:raise RuntimeError("Private image print URL exposed")
    st,h,b=get("/legacy-private-images-v1/documents/not-allowed.jpg")
    if st==200:raise RuntimeError("Unapproved original R2 route exposed")
    ids={"a4bf8d79-a7a3-51cb-909c-0a4681902c01":10,
       "203886e9-cd67-58ab-96b3-ee4ff97b401a":19,
       "1105db24-e971-5f1a-b632-d3b9f41b3b39":37}
    for i,n in ids.items():
        st,h,b=get("/v1/public/"+i)
        if st!=200:raise RuntimeError("PDF reader metadata missing")
        meta=json.loads(b)
        if meta.get("pageCount")!=n or meta.get("allowDownload") is not False:raise RuntimeError("PDF reader permission mismatch")
        for p in (1,n):
            assert_route("/v1/public/"+i+"/page/"+str(p),"image/jpeg",b"\xff\xd8\xff")
        st,h,b=get("/v1/public/"+i+"/download")
        if st==200:raise RuntimeError("Unsafe PDF download route")
    print("PASS: R2 printable previews and 3 legacy PDF readers available; private R2 originals denied",flush=True)
if __name__=="__main__":
    try:main()
    except Exception as e:print("FAIL: "+str(e),file=sys.stderr);sys.exit(1)
