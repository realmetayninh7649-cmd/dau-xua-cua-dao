/* Dấu Xưa Cửa Đạo — Access-authenticated admin identity gateway (STAGING).
 * This Worker has NO database/R2 binding, and ALL mutations are disabled.
 * ctx.access is a Cloudflare runtime-authenticated identity (NOT an untrusted
 * client-supplied JWT header). AUD is explicitly matched to this application.
 * Additional editor allowlist uses a SHA-256 email fingerprint rather than
 * publishing the owner's email in this public GitHub repository.
 */
function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer'
  }});
}
async function matchesEditorEmail(email,expectedDigest){
  if(typeof email!=='string'||!email.trim()
     ||typeof expectedDigest!=='string'
     ||!/^[a-f0-9]{64}$/.test(expectedDigest))return false;
  const normalized=email.trim().toLowerCase();
  const bytes=new TextEncoder().encode(normalized);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const hex=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  return hex===expectedDigest;
}
export default {
  async fetch(request,env,ctx){
    if(request.method!=='GET')
      return json({error:'read_only',write_enabled:false},405);
    const path=new URL(request.url).pathname;
    if(path==='/health')
      return json({status:'ok',mode:'admin-staging-read-only',
        access_configured:Boolean(env.ACCESS_AUD&&env.ADMIN_EMAIL_SHA256)});
    if(path!=='/api/v1/admin/session')
      return json({error:'not_found'},404);
    // Always fail closed if Access configuration or verified context is absent.
    if(typeof env.ACCESS_AUD!=='string'
       || !/^[a-f0-9]{64}$/.test(env.ACCESS_AUD)
       || !/^[a-f0-9]{64}$/.test(env.ADMIN_EMAIL_SHA256||'')
       || !ctx?.access
       || ctx.access.aud!==env.ACCESS_AUD
       || typeof ctx.access.getIdentity!=='function')
      return json({authenticated:false,error:'unauthorized'},403);
    try{
      const identity=await ctx.access.getIdentity();
      if(!await matchesEditorEmail(identity?.email,env.ADMIN_EMAIL_SHA256))
        return json({authenticated:false,error:'unauthorized'},403);
      return json({
        authenticated:true,
        role:'administrator',
        write_enabled:false,
        mode:'staging-read-only'
      });
    }catch{
      return json({authenticated:false,error:'unauthorized'},403);
    }
  }
};
