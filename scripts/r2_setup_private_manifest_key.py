#!/usr/bin/env python3
"""Create (once) an OpenPGP encryption key for opaque unlisted-image manifests.

Private key never enters GitHub source, logs or Supabase. Store ONLY in private R2
using existing bucket-scoped S3 credentials. Print public key as base64 for SQL
pgcrypto's pgp_pub_encrypt. Never publish unlisted filenames.
"""
from __future__ import annotations
import base64
import os
from pathlib import Path
import subprocess
import tempfile
import sys

from r2_preserve_published_images import make_s3,BUCKET

KEY="__gdd_internal__/unlisted-manifest-private-key-v2.asc"

def run(*args,stdin=None,env=None):
    return subprocess.check_output(args,input=stdin,stderr=subprocess.PIPE,env=env)

def main():
    if not Path("maintenance-mode.flag").is_file():
        raise RuntimeError("Maintenance mode required")
    s3=make_s3()
    with tempfile.TemporaryDirectory(prefix="gdd-private-pgp-") as tmp:
        home=Path(tmp)/"gpg"
        home.mkdir(mode=0o700)
        env={**os.environ,"GNUPGHOME":str(home)}
        listing=s3.list_objects_v2(Bucket=BUCKET,Prefix=KEY,MaxKeys=20)
        if any(item.get("Key")==KEY for item in listing.get("Contents",[])):
            response=s3.get_object(Bucket=BUCKET,Key=KEY)
            private=response["Body"].read(50000)
            response["Body"].close()
            if not private.startswith(b"-----BEGIN PGP PRIVATE KEY BLOCK-----"):
                raise RuntimeError("Private manifest key object invalid; no overwrite")
            run("gpg","--batch","--import",stdin=private,env=env)
            print("EXISTING PRIVATE MANIFEST KEY verified in private R2; reused.",flush=True)
        else:
            config=b"""Key-Type: RSA
Key-Length: 3072
Key-Usage: sign
Subkey-Type: RSA
Subkey-Length: 3072
Subkey-Usage: encrypt
Name-Real: GDD Private R2 Inventory
Name-Email: gdd-private-manifest@example.invalid
Expire-Date: 1y
%no-protection
%commit
"""
            run("gpg","--batch","--generate-key",stdin=config,env=env)
            private=run("gpg","--batch","--armor","--export-secret-keys",
                "gdd-private-manifest@example.invalid",env=env)
            if not private.startswith(b"-----BEGIN PGP PRIVATE KEY BLOCK-----"):
                raise RuntimeError("GPG private key generation failed")
            s3.put_object(Bucket=BUCKET,Key=KEY,Body=private,
                          ContentLength=len(private),
                          ContentType="application/pgp-keys",
                          Metadata={"classification":"private-no-public-url","usage":"unlisted-manifest-decryption"})
            fetched=s3.get_object(Bucket=BUCKET,Key=KEY)
            data=fetched["Body"].read(50000)
            fetched["Body"].close()
            if data!=private:raise RuntimeError("R2 private key readback failed")
            print("NEW PRIVATE MANIFEST KEY stored and read-verified inside private R2; not published.",flush=True)
        public=run("gpg","--batch","--armor","--export",
                   "gdd-private-manifest@example.invalid",env=env)
        if not public.startswith(b"-----BEGIN PGP PUBLIC KEY BLOCK-----"):
            raise RuntimeError("Public PGP export missing")
        probe=b"GDD-private-manifest-test-without-filenames"
        encrypted=run("gpg","--batch","--trust-model","always","--encrypt",
                      "--recipient","gdd-private-manifest@example.invalid",
                      env=env,stdin=probe)
        decrypted=run("gpg","--batch","--decrypt",env=env,stdin=encrypted)
        if probe!=decrypted:raise RuntimeError("GPG key round trip did not verify")
        print("PUBLIC_GPG_KEY_ASCII_ARMOR_BASE64_START",flush=True)
        print(base64.b64encode(public).decode("ascii"),flush=True)
        print("PUBLIC_GPG_KEY_ASCII_ARMOR_BASE64_END",flush=True)
        print("SECURITY PASS: OpenPGP encrypt/decrypt tested, private key stored in R2 only.",flush=True)

if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("SAFE PRIVATE PGP BOOTSTRAP STOP: "+type(exc).__name__+
              "; never print keys or private paths",file=sys.stderr,flush=True)
        sys.exit(1)
