import { LEGACY_PRINT_PATHS } from './legacy-print-paths.mjs';
import { VERSION } from './version.mjs';
export const LEGACY_PRINT_ROUTE='/v1/legacy-print/';
function json(status,msg,cors){
  const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
  if(cors){headers['access-control-allow-origin']=cors;headers['vary']='Origin'}
  return new Response(JSON.stringify({error:msg,version:VERSION}),{status,headers});
}
export async function legacyPrintResponse(req,env,path,cors){
  if(req.method!=='GET')return json(405,'Method not allowed',cors);
  if(!path.startsWith(LEGACY_PRINT_ROUTE))return json(404,'Bản in không tồn tại',cors);
  const value=path.slice(LEGACY_PRINT_ROUTE.length);
  if(value.length<8||value.length>190||!value.endsWith('.jpg'))return json(404,'Bản in không tồn tại',cors);
  let sourcePath;
  try{sourcePath=decodeURIComponent(value.slice(0,-4))}catch{return json(404,'Đường dẫn không hợp lệ',cors)}
  if(!new RegExp('^[A-Za-z0-9_./-]{1,110}$').test(sourcePath)||sourcePath.split('/').includes('..')||
    !LEGACY_PRINT_PATHS.has(sourcePath))return json(404,'Không có bản in được duyệt',cors);
  try{
    const obj=await env.GDD_BUCKET.get('legacy-published-print-v1/'+sourcePath+'.jpg');
    if(!obj?.body)return json(404,'Bản in đang được chuẩn bị',cors);
    const headers=new Headers({'content-type':'image/jpeg','content-disposition':'inline',
      'cache-control':'public, max-age=86400','x-content-type-options':'nosniff',
      'cross-origin-resource-policy':'cross-origin','referrer-policy':'no-referrer','x-robots-tag':'noindex'});
    if(cors){headers.set('access-control-allow-origin',cors);headers.set('vary','Origin')}
    return new Response(obj.body,{status:200,headers});
  }catch{return json(503,'Chưa đọc được bản in',cors)}
}
