/* Dấu Xưa Cửa Đạo — admin identity gateway (STAGING).
 * Independently deployed from the public API and R2 gateway.
 * No database binding, no writes, no Supabase keys.
 * Access identity is trusted ONLY when Cloudflare provides ctx.access.
 * Keep the gateway fail-closed until Access AUD and admin allowlist are set.
 */
function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store, private',
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'no-referrer'
    }
  });
}
function sameAllowlistedEmail(email,allowlist){
  if(!email || typeof email!=='string' || !allowlist)return false;
  const normalized=email.trim().toLowerCase();
  return String(allowlist).split(',').some(x=>x.trim().toLowerCase()===normalized);
}
export default {
  async fetch(request,env,ctx){
    if(request.method!=='GET')return json({error:'read_only'},405);
    const path=new URL(request.url).pathname;
    if(path==='/health')return json({
      status:'ok',
      mode:'admin-staging-read-only',
      access_configured:Boolean(env.ACCESS_AUD && env.ADMIN_EMAILS)
    });
    if(path!=='/api/v1/admin/session')return json({error:'not_found'},404);
    if(!ctx?.access || typeof ctx.access.getIdentity!=='function'
       || !env.ACCESS_AUD || !env.ADMIN_EMAILS
       || ctx.access.aud!==env.ACCESS_AUD)
      return json({authenticated:false,error:'unauthorized'},403);
    try{
      const identity=await ctx.access.getIdentity();
      if(!sameAllowlistedEmail(identity?.email,env.ADMIN_EMAILS))
        return json({authenticated:false,error:'unauthorized'},403);
      return json({authenticated:true,role:'administrator',write_enabled:false});
    }catch{
      return json({authenticated:false,error:'unauthorized'},403);
    }
  }
};
