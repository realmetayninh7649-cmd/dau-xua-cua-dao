#!/usr/bin/env python3
"""Read-only production audit of D1 public content, SEO, calendar and contribution protection."""
import urllib.request,urllib.error,json,xml.etree.ElementTree as ET
LIVE='https://dauxuacuadao.info.vn'
API='https://gdd-d1-api-staging.realmetayninh7649.workers.dev'
headers={'User-Agent':'GDD-safe-public-live-audit/20261124','Cache-Control':'no-cache'}
def req(url,method='GET',additional=None):
 h={**headers,**(additional or {})}
 request=urllib.request.Request(url,headers=h,method=method)
 try:
  with urllib.request.urlopen(request,timeout=35) as resp:
   return resp.status,resp.headers,resp.read(1200000)
 except urllib.error.HTTPError as e:
  return e.code,e.headers,e.read(1200000)
status,head,ics=req(LIVE+'/lich-ky-niem-qui-vi.ics')
if status!=200 or not ics.startswith(b'BEGIN:VCALENDAR\r\n') or not ics.endswith(b'END:VCALENDAR\r\n'):
 raise SystemExit('Public published calendar ICS missing or malformed')
n=ics.count(b'BEGIN:VEVENT')
if not (n>=800 and n<=3000):raise SystemExit('Unexpected calendar event count')
if ics.count(b'BEGIN:VALARM')!=n:raise SystemExit('Calendar alarm coverage mismatch')
status,h,data=req(LIVE+'/lich-ky-niem-qui-vi.json')
if status!=200:raise SystemExit('Calendar public JSON unavailable')
obj=json.loads(data)
if obj.get('ok') is not True or obj.get('source')!='public-published-verified-D1-only' or obj.get('count')!=n:
 raise SystemExit('Calendar ICS and public JSON mismatch')
print('LIVE_PUBLIC_CALENDAR_ICS_AND_JSON=PASS',n)
status,h,xml=req(LIVE+'/sitemap.xml')
if status!=200:raise SystemExit('Sitemap missing')
root=ET.fromstring(xml)
ns={'m':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=[x.text for x in root.findall('.//m:loc',ns)]
if len(urls)<65 or any(not u.startswith(LIVE+'/') for u in urls):
 raise SystemExit('Sitemap not complete/canonical')
print('LIVE_SITEMAP=PASS',len(urls))
status,h,body=req(API+'/api/v1/public/people?limit=100')
rows=json.loads(body).get('data',[])
if status!=200 or len(rows)<45 or any(x.get('published') is not True for x in rows):
 raise SystemExit('Public D1 people list not available')
print('PUBLIC_D1_PEOPLE_PUBLISHED_ONLY=PASS',len(rows))
status,h,body=req(API+'/api/v1/public/submissions')
if status!=404:raise SystemExit('Private submissions unexpectedly accessible')
status,h,body=req(API+'/api/v1/contributions','GET')
if status!=405:raise SystemExit('Submission inbox public GET must reject')
status,h,body=req(API+'/api/v1/contributions','POST')
if status!=403:raise SystemExit('Unauthenticated cross-origin POST must reject')
status,h,body=req(API+'/api/v1/contributions','OPTIONS',{'Origin':LIVE})
if status!=204 or h.get('Access-Control-Allow-Origin')!=LIVE:
 raise SystemExit('Contribution browser CORS preflight unavailable')
print('CONTRIBUTION_ENDPOINT_PRIVACY_AND_CORS=PASS')
print('NO_SUBMISSION_WRITES_PERFORMED=TRUE')
