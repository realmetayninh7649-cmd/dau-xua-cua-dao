#!/usr/bin/env python3
"""Read-only count probe. Never prints filenames or unpublished URLs."""
import json, re, urllib.request, urllib.error
from pathlib import Path

cfg=Path("supabase-config.js").read_text(encoding="utf8")
match=re.search(r"supabasePublishableKey:\s*[\"']([^\"']+)[\"']",cfg)
if not match: raise SystemExit("ANON STORAGE LIST PROBE: no publishable key in client configuration")
key=match.group(1)
endpoint="https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/list/dao-su-images"
body=json.dumps({"prefix":"","limit":1,"offset":0}).encode("utf8")
req=urllib.request.Request(endpoint,data=body,headers={
    "apikey":key, "Content-Type":"application/json",
    "User-Agent":"GDD-R2-Inventory-Permission-Probe/1.0"
})
try:
    with urllib.request.urlopen(req,timeout=25) as response:
        parsed=json.load(response)
        if not isinstance(parsed,list): raise SystemExit("ANON STORAGE LIST PROBE: unexpected JSON type; stopped")
        print("ANON STORAGE LIST PROBE: ALLOWED (returned list metadata; no object names printed)")
except urllib.error.HTTPError as error:
    if error.code in (400,401,403):
        print("ANON STORAGE LIST PROBE: DENIED (HTTP %d); safe, no private filenames exposed" % error.code)
    else:
        print("ANON STORAGE LIST PROBE: backend failed HTTP %d" % error.code)
except Exception as e:
    print("ANON STORAGE LIST PROBE: unavailable (%s)" % type(e).__name__)
