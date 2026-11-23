#!/usr/bin/env python3
"""Read-only migration inventory: 21 D1 table counts + exact R2 bucket total.
No filenames, records, URLs, secrets, original bytes or private contents are returned.
Read-only Cloudflare API POST /query runs SELECT statements ONLY.
R2 client calls only ListObjectsV2; no object GET, PUT, DELETE.
"""
import collections
import datetime
import json
import os
import pathlib
import re
import urllib.error
import urllib.request

R2_BUCKET = "gdd-dau-xua-cua-dao"
D1_DATABASE = "bffcd3e0-e46e-4280-b8dd-82e8d3402b3d"

def check(value, label, pattern):
    if not re.fullmatch(pattern, value or ""):
        raise SystemExit("Invalid configuration for " + label)
    return value

def d1_counts(account, token, manifest):
    tables = list(manifest["tables"])
    if len(tables) != 21 or len(set(tables)) != 21:
        raise SystemExit("Refuse unknown table schema (expected exactly 21)")
    for name in tables:
        check(name, "D1 table name", r"[a-z][a-z0-9_]*")
    # Read-only SELECT, no row values and no user-controlled SQL identifiers.
    sql = " UNION ALL ".join(
        f'SELECT \'{name}\' AS table_name, COUNT(*) AS n FROM "{name}"'
        for name in tables
    )
    url = (
        "https://api.cloudflare.com/client/v4/accounts/" + account +
        "/d1/database/" + D1_DATABASE + "/query"
    )
    body = json.dumps({"sql": sql}).encode("utf-8")
    request = urllib.request.Request(url, body, method="POST", headers={
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "User-Agent": "GDD-D1-R2-ReadOnly-Audit/1.0"
    })
    with urllib.request.urlopen(request, timeout=35) as response:
        result = json.load(response)
    if result.get("success") is not True or not result.get("result"):
        raise SystemExit("D1 SELECT-only count request failed")
    rows = result["result"][0].get("results", [])
    if len(rows) != 21:
        raise SystemExit("D1 count result is incomplete")
    counts = {}
    for row in rows:
        if row.get("table_name") not in tables:
            raise SystemExit("Unexpected table in D1 result")
        name = row["table_name"]
        if name in counts:
            raise SystemExit("Duplicate count from D1")
        n = row.get("n")
        if isinstance(n, bool) or not isinstance(n, int) or n < 0:
            raise SystemExit("Invalid D1 count for " + name)
        counts[name] = n
    return counts

def r2_counts(account, access, secret):
    import boto3
    from botocore.config import Config
    client = boto3.client(
        "s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=access, aws_secret_access_key=secret,
        region_name="auto",
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
            retries={"max_attempts": 2},
            connect_timeout=10,
            read_timeout=25,
            request_checksum_calculation="when_required",
            response_checksum_validation="when_required",
        )
    )
    total_count = total_bytes = pages = 0
    token = None
    while True:
        if pages >= 100:
            raise SystemExit("Hard limit of 100 R2 LIST pages reached, stop for cost safety")
        args = {"Bucket": R2_BUCKET, "MaxKeys": 1000}
        if token:
            args["ContinuationToken"] = token
        data = client.list_objects_v2(**args)
        pages += 1
        for obj in data.get("Contents", []):
            total_count += 1
            total_bytes += int(obj["Size"])
        if not data.get("IsTruncated"):
            break
        next_token = data.get("NextContinuationToken")
        if not next_token or next_token == token:
            raise SystemExit("Unexpected R2 pagination state")
        token = next_token
    return {"object_count": total_count, "total_bytes": total_bytes, "list_pages": pages}

def main():
    base = pathlib.Path(__file__).resolve().parents[1]
    manifest = json.loads((base/"workers/gdd-d1/source-schema-manifest.json").read_text())
    baseline = json.loads((base/"workers/gdd-d1/source-row-counts-20261123.json").read_text())
    account = check(os.getenv("CLOUDFLARE_ACCOUNT_ID", ""), "account ID", r"[a-fA-F0-9]{32}")
    token = os.getenv("CLOUDFLARE_D1_API_TOKEN", "")
    access = check(os.getenv("GDD_R2_ARCHIVE_ACCESS_KEY_ID", ""), "R2 access key ID", r"[a-fA-F0-9]{32}")
    secret = os.getenv("GDD_R2_ARCHIVE_SECRET_ACCESS_KEY", "")
    if len(token) < 15 or len(secret) < 15:
        raise SystemExit("Missing Cloudflare/R2 credentials")
    d1 = d1_counts(account, token, manifest)
    r2 = r2_counts(account, access, secret)
    source = baseline["table_counts"]
    if sorted(source) != sorted(d1):
        raise SystemExit("D1 and Supabase table sets differ")
    differences = [
        {"table": name, "source_snapshot": source[name], "d1_current": d1[name],
         "remaining": max(source[name]-d1[name], 0)}
        for name in sorted(source)
    ]
    imported = sum(d1.values())
    source_total = sum(source.values())
    remaining = sum(item["remaining"] for item in differences)
    if r2["object_count"] < 1500 or r2["total_bytes"] < 1500000000:
        raise SystemExit("R2 object inventory unexpectedly low; do not change production")
    if imported < 741:
        raise SystemExit("D1 contains fewer rows than the earlier verified 741; stop")
    outcome = {
        "audit_date_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "mode": "READ_ONLY",
        "d1_database": "gdd-dao-su-archive",
        "d1_table_count": len(d1),
        "source_snapshot_date": baseline["snapshot_date"],
        "supabase_source_snapshot_records": source_total,
        "d1_current_records": imported,
        "snapshot_remaining_difference": remaining,
        "table_counts": differences,
        "r2_bucket": R2_BUCKET,
        "r2_object_count": r2["object_count"],
        "r2_total_bytes": r2["total_bytes"],
        "r2_list_requests": r2["list_pages"],
        "notes": [
            "R2 object listing does not establish every metadata reference or checksum.",
            "Supabase source totals are the saved snapshot, not a new live query.",
            "No content, filenames, credentials, sensitive rows or object URLs emitted."
        ]
    }
    # Entire output is aggregate only. No private records or filenames.
    print("GDD_READ_ONLY_MIGRATION_AUDIT=" + json.dumps(outcome, ensure_ascii=False, sort_keys=True))
    print("NO_D1_R2_SUPABASE_WRITES=true")
    print("GDD_STAGING_READY_FOR_PRIVATE_BACKUP_PLANNING=true")

if __name__ == "__main__":
    main()
