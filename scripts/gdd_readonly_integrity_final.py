#!/usr/bin/env python3
"""Read-only integrity of immutable D1 archive, active working D1 and R2 object metadata.
Never print object names, user data, decrypted content or credentials.
"""
import os,json,pathlib,re,urllib.request,urllib.error
import boto3
from botocore.config import Config
account=os.getenv('CLOUDFLARE_ACCOUNT_ID','')
token=os.getenv('CLOUDFLARE_D1_API_TOKEN','')
access=os.getenv('GDD_R2_ARCHIVE_ACCESS_KEY_ID','')
secret=os.getenv('GDD_R2_ARCHIVE_SECRET_ACCESS_KEY','')
if not re.fullmatch('[0-9a-f]{32}',account) or not token or not access or not secret:
 raise SystemExit('Read-only audit configuration missing')
baseline=json.loads(pathlib.Path('workers/gdd-d1/source-row-counts-20261123.json').read_text())['table_counts']
assert len(baseline)==21 and sum(baseline.values())==1892
ids={
 'restore':'ddce6b9f-90e1-488f-bf9b-5ddf5d170346',
 'working':'56bf9fcc-3f9a-43e5-82f7-8c521f5b370a'
}
def sql(dbid,table):
 url='https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'+dbid+'/query'
 request=urllib.request.Request(url,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'},
  method='POST',data=json.dumps({'sql':'SELECT count(*) AS n FROM "'+table+'"'}).encode())
 with urllib.request.urlopen(request,timeout=35) as response: data=json.load(response)
 if data.get('success') is not True or not data.get('result'):raise SystemExit('Cloudflare D1 count audit unavailable')
 return int(data['result'][0]['results'][0]['n'])
for name,dbid in ids.items():
 total=0
 for table,expected in baseline.items():
  value=sql(dbid,table);total+=value
  if name=='restore' and value!=expected:raise SystemExit('Immutable D1 restore no longer matches baseline: '+table)
  if name=='working' and value<expected:raise SystemExit('Working D1 lost baseline records: '+table)
 print('D1_'+name.upper()+'_TABLES='+str(len(baseline)))
 print('D1_'+name.upper()+'_RECORDS='+str(total))
 print('D1_'+name.upper()+'_BASELINE_INTEGRITY=PASS')
s3=boto3.client('s3',endpoint_url='https://'+account+'.r2.cloudflarestorage.com',
 aws_access_key_id=access,aws_secret_access_key=secret,region_name='auto',
 config=Config(signature_version='s3v4',s3={'addressing_style':'path'},
  request_checksum_calculation='when_required',response_checksum_validation='when_required'))
cursor=None;objects=0;bytes_total=0
for page in range(100):
 args={'Bucket':'gdd-dau-xua-cua-dao','MaxKeys':1000}
 if cursor:args['ContinuationToken']=cursor
 response=s3.list_objects_v2(**args)
 for item in response.get('Contents',[]):
  objects+=1;bytes_total+=int(item['Size'])
 if not response.get('IsTruncated'):break
 cursor=response.get('NextContinuationToken')
 if not cursor:raise SystemExit('Missing R2 pagination cursor')
else:raise SystemExit('R2 inventory pagination unexpectedly large')
if objects<2512 or bytes_total<3157000000:
 raise SystemExit('R2 archive object metadata count/size below baseline')
print('R2_OBJECT_METADATA_COUNT='+str(objects))
print('R2_OBJECT_METADATA_BYTES='+str(bytes_total))
print('R2_METADATA_NOT_FULL_OBJECT_HASH_VERIFICATION=TRUE')
print('SUPABASE_AND_ORIGINAL_R2_CONTENT_UNCHANGED_BY_THIS_AUDIT=TRUE')
