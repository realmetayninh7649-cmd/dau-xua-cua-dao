import {LEGACY_PUBLISHED_PATHS} from './legacy-published-paths.mjs';
import {VERSION} from './version.mjs';

export const LEGACY_PREVIEW_PATH = '/v1/legacy-preview/';

function deny(status,msg,cors){
  const headers={
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer',
    'x-frame-options':'DENY'
  };
  if(cors){headers['access-control-allow-origin']=cors;headers['vary']='Origin'}
  return new Response(JSON.stringify({error:msg,version:VERSION}),{status,headers});
}

/** Future already-published WebP route; default disabled, never expose archive originals. */
export async function legacyPreviewResponse(req,env,path,originAllowed,enabled=false) {
  if(!enabled)return deny(404,'Website đang bảo trì',originAllowed);
  if(req.method!=='GET')return deny(405,'Method not allowed',originAllowed);
  if(!path.startsWith(LEGACY_PREVIEW_PATH))return deny(404,'Không có ảnh xem',originAllowed);
  const encoded=path.slice(LEGACY_PREVIEW_PATH.length);
  if(encoded.length<8||encoded.length>180||!encoded.endsWith('.webp'))
    return deny(404,'Không có ảnh xem',originAllowed);
  let sourcePath;
  try{sourcePath=decodeURIComponent(encoded.slice(0,-5))}catch{return deny(404,'Đường dẫn không hợp lệ',originAllowed)}
  if(!/^[A-Za-z0-9_.\/-]{1,110}$/.test(sourcePath)
     ||sourcePath.split('/').includes('..')
     ||!LEGACY_PUBLISHED_PATHS.has(sourcePath))
    return deny(404,'Không có ảnh xem',originAllowed);
  try{
    const obj=await env.GDD_BUCKET.get('legacy-private-image-previews-v1/'+sourcePath+'.webp');
    if(!obj?.body)return deny(404,'Bản xem chưa sẵn sàng',originAllowed);
    const headers=new Headers({
      'content-type':'image/webp',
      'content-disposition':'inline',
      'cache-control':'public, max-age=86400',
      'x-content-type-options':'nosniff',
      'cross-origin-resource-policy':'cross-origin',
      'referrer-policy':'no-referrer',
      'x-robots-tag':'noindex'
    });
    if(originAllowed){headers.set('access-control-allow-origin',originAllowed);headers.set('vary','Origin')}
    return new Response(obj.body,{status:200,headers});
  }catch{return deny(503,'Không đọc được bản xem',originAllowed)}
}
