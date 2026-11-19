#!/usr/bin/env python3
"""Read-only smoke test for public overall download statistics.
No download event is created, no visitor count increment, no database mutation.
"""
import json,re,urllib.request,urllib.error,sys
BASE="https://dauxuacuadao.info.vn"
SUPA="https://gwpdgubxoquhrfbolftq.supabase.co"
def get(path):
    req=urllib.request.Request(BASE+path,headers={"Cache-Control":"no-cache","User-Agent":"GDD-Download-Count-Audit/1.0"})
    with urllib.request.urlopen(req,timeout=35) as f:
        if f.status!=200:raise RuntimeError("Unexpected status reading "+path)
        return f.read(850000).decode("utf-8")
def require(ok,msg):
    if not ok:raise RuntimeError(msg)
def main():
    home=get("/?gdd-stat-audit=20261119")
    require("gdd-site-download-counter.js?v=20261119-download-total-01" in home,"Production home is missing global download recorder")
    require("gdd-calendar-statistics.js?v=20261119-download-total-01" in home,"Production dashboard JS not cache-busted")
    require("gdd-content-metrics.js?v=20261119-download-total-01" in home,"Existing article metrics not synchronized")
    dashboard=get("/gdd-calendar-statistics.js?v=20261119-download-total-01")
    require('id="gdd-total-downloads"' in dashboard and "Tổng lượt tải về" in dashboard,"Missing downloads tile")
    counter=get("/gdd-site-download-counter.js?v=20261119-download-total-01")
    require("gdd_get_site_download_total" in counter and "gdd_record_site_unlinked_download" in counter,"Global download client not deployed")
    existing=get("/gdd-content-metrics.js?v=20261119-download-total-01")
    require("claimsDownloadClick" in existing,"Article deduplication not deployed")
    reader=get("/r2-xem.html?v=20261119-download-total-01")
    require("gdd-site-download-counter.js?v=20261119-download-total-01" in reader,"Separate R2 reader downloads not tracked")
    config=get("/supabase-config.js")
    match=re.search(r"supabasePublishableKey\s*:\s*['\"](sb_publishable_[^'\"]+)['\"]",config)
    require(match is not None,"Unable to read public Supabase publishable key")
    req=urllib.request.Request(SUPA+"/rest/v1/rpc/gdd_get_site_download_total",
        data=b"{}",method="POST",headers={"apikey":match.group(1),"Content-Type":"application/json","Origin":BASE})
    with urllib.request.urlopen(req,timeout=30) as f:
        require(f.status==200,"Anonymous total-download RPC unavailable")
        n=json.loads(f.read(256))
    require(isinstance(n,int) and n>=44,"Global counter lost pre-existing 44 recorded downloads")
    print("PASS: production UI and R2 viewer installed, anonymous read verified, baseline >=44.")
    print("Verified total on database:",n)
if __name__=="__main__":
    try:main()
    except Exception as e:
        print("FAIL LIVE READ-ONLY DOWNLOAD AUDIT: "+str(e),file=sys.stderr)
        sys.exit(1)
