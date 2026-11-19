#!/usr/bin/env python3
"""Read-only LIVE cutover checks: no auth or secrets, never write or delete a file."""
import json, pathlib, urllib.request, urllib.error, sys
SITE="https://dauxuacuadao.info.vn"
SUPA="https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public"
WORKER="https://gdd-r2-gateway.realmetayninh7649.workers.dev"
def get(url):
    req=urllib.request.Request(url,headers={"User-Agent":"GDD-Private-Cutover-Postflight/1.0","Origin":SITE,"Cache-Control":"no-cache","Pragma":"no-cache"})
    try:
        with urllib.request.urlopen(req,timeout=30) as response:
            # Avoid bulk download, check just the content prefix.
            return response.status,dict(response.headers),response.read(120000)
    except urllib.error.HTTPError as error:
        return error.code,dict(error.headers),error.read(512)
def main():
    manifest=json.loads(pathlib.Path("maintenance-tasks/r2-images-published-manifest.json").read_text("utf8"))
    paths=[x["path"] for x in manifest["objects"]]
    if len(paths)!=700:raise RuntimeError("700 published image manifest changed")
    image=paths[0]
    for name,url in [
      ("original image",SUPA+"/dao-su-images/"+image+"?audit=private20261119"),
      ("original PDF",SUPA+"/dao-su-documents/documents/1794684373312-e808f501-1bba-458d-b82f-f5f096479426.pdf?audit=private20261119")
    ]:
      status,headers,body=get(url)
      if status not in (400,401,403,404):
        raise RuntimeError("Original storage asset still publicly accessible: "+name+" HTTP "+str(status))
      print("PRIVATE SOURCE DENIED: "+name+" HTTP "+str(status),flush=True)
    categories=["people/","posts/","media/","documents/","obituaries/","videos/"]
    samples=[next((x for x in paths if x.startswith(cat)),None) for cat in categories]
    samples=[x for x in samples if x]
    samples.append("memorials/1794948675991-c161eafe-0f0e-4305-a58a-a51cd8c6004c.png")
    for n,path in enumerate(samples,1):
      status,head,body=get(WORKER+"/v1/legacy-preview/"+path+".webp")
      if status!=200 or head.get("Content-Type")!="image/webp" or not body.startswith(b"RIFF"):
        raise RuntimeError("Approved R2 preview unavailable or corrupt: sample "+str(n))
      print("PUBLIC OPTIMIZED WEBP OK: "+str(n)+"/"+str(len(samples)),flush=True)
    public_print=json.loads(pathlib.Path("maintenance-tasks/gdd-public-print-paths.json").read_text("utf8"))
    if public_print.get("count")!=133:raise RuntimeError("Printable approved count changed")
    for i,path in enumerate((public_print["paths"][0],public_print["paths"][-1]),1):
      code,headers,body=get(WORKER+"/v1/legacy-print/"+path+".jpg")
      if code!=200 or headers.get("Content-Type")!="image/jpeg" or not body.startswith(b"\xff\xd8\xff"):
        raise RuntimeError("Printed derivative unavailable: sample "+str(i))
    ids={"a4bf8d79-a7a3-51cb-909c-0a4681902c01":10,
       "203886e9-cd67-58ab-96b3-ee4ff97b401a":19,
       "1105db24-e971-5f1a-b632-d3b9f41b3b39":37}
    for ident,count in ids.items():
      code,headers,body=get(WORKER+"/v1/public/"+ident)
      if code!=200:raise RuntimeError("PDF metadata missing")
      meta=json.loads(body)
      if meta.get("pageCount")!=count or meta.get("allowDownload") is not False:
        raise RuntimeError("PDF viewer metadata leaked or page count incorrect")
      code,headers,body=get(WORKER+"/v1/public/"+ident+"/page/1")
      if code!=200 or not body.startswith(b"\xff\xd8\xff"):
        raise RuntimeError("PDF first page unavailable")
      code,headers,body=get(WORKER+"/v1/public/"+ident+"/download")
      if code==200:raise RuntimeError("Private original PDF download exposed")
    code,headers,body=get(SITE+"/?gdd-cutover=20261119")
    if code!=200 or b"gdd-private-publishing.js" not in body:
      raise RuntimeError("Production homepage or new upload module unavailable")
    code,headers,body=get(SITE+"/gdd-private-publishing.js?v=20261119")
    if code!=200 or b"GDDPrivatePublishing" not in body:
      raise RuntimeError("Production R2 upload helper unavailable")
    print("LIVE PRIVATE CUTOVER VERIFIED: 2 source buckets blocked, approved views and reader online.",flush=True)
if __name__=="__main__":
    try:main()
    except Exception as err:
        print("CUTOVER CHECK FAIL: "+str(err),file=sys.stderr)
        sys.exit(1)
