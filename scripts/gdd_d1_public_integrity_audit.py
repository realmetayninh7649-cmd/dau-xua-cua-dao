#!/usr/bin/env python3
"""D1 public backup equivalence audit. Reads published-only snapshot and D1.
Do not log record content, names, URLs or personally identifiable fields.
No public/secret writes. Cloudflare D1 /query is used for SELECT only.
"""
import json
import os
import pathlib
import re
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
DB_UUID = "bffcd3e0-e46e-4280-b8dd-82e8d3402b3d"
ALIASES = {"gallery": "archive_gallery_images", "placements": "gdd_content_placements"}
EXPECTED = {
    "people": 50, "posts": 17, "media": 13, "videos": 8,
    "obituaries": 2, "documents": 21, "gdd_memorials": 5,
    "gdd_audio_programs": 2, "gdd_calendar_memorials": 0,
    "gallery": 615, "placements": 8
}
PAGE_SIZE = 40

def normalized(value, sample):
    # SQLite migration converted booleans to INTEGER and JSON/array to text.
    if isinstance(sample, bool):
        return value == 1 if value in (1, 0) and not isinstance(value, bool) else value
    if isinstance(sample, (dict, list)):
        if not isinstance(value, str):
            return value
        try:
            return json.loads(value)
        except (ValueError, TypeError):
            return value
    return value

def query(account, token, table, offset):
    sql = 'SELECT * FROM "' + table + '" ORDER BY rowid LIMIT ' + str(PAGE_SIZE) + ' OFFSET ' + str(offset)
    endpoint = (
        "https://api.cloudflare.com/client/v4/accounts/" + account +
        "/d1/database/" + DB_UUID + "/query"
    )
    request = urllib.request.Request(
        endpoint,
        data=json.dumps({"sql": sql}).encode(),
        method="POST",
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
            "User-Agent": "GDD-D1-Published-Integrity-Audit/1.0"
        }
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            data = json.load(response)
    except urllib.error.HTTPError as e:
        raise SystemExit("D1 read-only page failed for " + table + ": HTTP " + str(e.code)) from None
    if not data.get("success") or not data.get("result"):
        raise SystemExit("D1 response failed validation for " + table)
    rows = data["result"][0].get("results", [])
    if not isinstance(rows, list) or len(rows) > PAGE_SIZE:
        raise SystemExit("Unbounded D1 result for " + table)
    return rows

def main():
    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
    token = os.environ.get("CLOUDFLARE_D1_API_TOKEN", "")
    if not re.fullmatch(r"[a-f0-9]{32}", account) or len(token) < 15:
        raise SystemExit("D1 read-only credentials unavailable")
    source = json.loads((ROOT/"public-fallback.json").read_text(encoding="utf-8"))
    if source.get("source") != "public-published-read-only-backup":
        raise SystemExit("Public snapshot source marker mismatch")
    manifest = json.loads((ROOT/"workers/gdd-d1/source-schema-manifest.json").read_text())
    pk_total = 0
    results = []
    for snap_table, count in EXPECTED.items():
        table = ALIASES.get(snap_table, snap_table)
        if table not in manifest["tables"]:
            raise SystemExit("Unknown table in audit: " + table)
        data = source.get(snap_table, [])
        if not isinstance(data, list) or len(data) != count:
            raise SystemExit("Unexpected snapshot record count in " + table)
        if table not in ALIASES.values() and not all(row.get("published") is True for row in data):
            raise SystemExit("Found nonpublished content in " + table)
        primary = manifest["tables"][table]["primary_key"]
        columns = [x["name"] for x in manifest["tables"][table]["columns"]]
        expected_rows = {
            tuple(row[col] for col in primary): row for row in data
        }
        if len(expected_rows) != len(data):
            raise SystemExit("Duplicate primary key in snapshot for " + table)
        seen = set()
        for offset in range(0, max(count, 1), PAGE_SIZE):
            batch = query(account, token, table, offset)
            if not batch and offset < count:
                raise SystemExit("Missing rows in D1 " + table)
            for row in batch:
                key = tuple(row[col] for col in primary)
                if key in seen or key not in expected_rows:
                    raise SystemExit("D1 primary key differs from snapshot in " + table)
                seen.add(key)
                sample = expected_rows[key]
                # Compare every schema field, not merely titles/QR identifiers.
                for column in columns:
                    expected_value = sample.get(column)
                    actual_value = normalized(row.get(column), expected_value)
                    if actual_value != expected_value:
                        raise SystemExit("D1 differs from public snapshot in " + table +
                                         ", column " + column + " (values withheld)")
        if seen != set(expected_rows):
            raise SystemExit("Missing public snapshot primary keys in D1 " + table)
        pk_total += len(seen)
        results.append({"table": table, "validated_records": len(seen), "all_columns_match": True})
        print("PUBLIC_RECORDS_VERIFIED=" + table + " COUNT=" + str(len(seen)))
    if pk_total != 741:
        raise SystemExit("Unexpected total compared public records")
    # No user strings, identifiers, URLs or private source content in output.
    print("PUBLIC_D1_FULL_FIELD_EQUIVALENCE=PASS")
    print("PUBLIC_D1_741_ROWS_ALL_COLUMNS_VERIFIED=TRUE")
    print("PUBLIC_D1_TABLES_VERIFIED=" + str(len(results)))
    print("D1_SOURCE_R2_WRITES=0")

if __name__ == "__main__":
    main()
