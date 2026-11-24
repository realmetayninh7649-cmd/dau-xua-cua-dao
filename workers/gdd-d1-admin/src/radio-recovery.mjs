/* Exact-byte recovery for one previously published episode. The caller enforces Access and CSRF. */
export async function recoverRadio(request,env,json){
     const total=16116406,sha='d19ee4f882e1c24f17fda53da2e31f44ea4ea9660923778ab8630208601d9122';
     const id='51fb2d6c-8085-4e41-82c6-fc10f9da7553',key='public-audio/radio-hai-muoi-nam-d19ee4f8.mp3';
     const old='https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-audio/radio/1794152210157-3l8hj18qb9.mp3';
     const target='https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/audio/radio-hai-muoi-nam.mp3';
     const digest=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
     try{
       if(!env.DB||!env.GDD_BUCKET)return json({error:'storage_unavailable'},503);
       const declared=request.headers.get('Content-Length');
       if(declared!==null&&Number(declared)!==total)return json({error:'wrong_file_size'},400);
       const row=await env.DB.prepare('SELECT id,published,audio_url,gdd_version FROM gdd_audio_programs WHERE id=? LIMIT 1').bind(id).first();
       if(!row||row.published!==1||![old,target].includes(row.audio_url))return json({error:'record_changed'},409);
       if(!request.body)return json({error:'missing_file'},400);
       const reader=request.body.getReader(),bytes=new Uint8Array(total);let offset=0;
       while(true){const {done,value}=await reader.read();if(done)break;if(offset+value.length>total){await reader.cancel();return json({error:'wrong_file_size'},400)}bytes.set(value,offset);offset+=value.length}
       if(offset!==total||await digest(bytes)!==sha)return json({error:'wrong_file_hash'},400);
       if(!await env.GDD_BUCKET.head(key)){
         await env.GDD_BUCKET.put(key,bytes,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'audio/mpeg'},customMetadata:{sha256:sha}});
       }
       const saved=await env.GDD_BUCKET.get(key);
       if(!saved||saved.size!==total||saved.customMetadata?.sha256!==sha||await digest(await saved.arrayBuffer())!==sha)return json({error:'r2_verification_failed'},409);
       if(row.audio_url===old){
         const updated=await env.DB.prepare('UPDATE gdd_audio_programs SET audio_url=?,updated_at=?,gdd_version=gdd_version+1 WHERE id=? AND published=1 AND audio_url=? AND gdd_version=? RETURNING id,audio_url').bind(target,new Date().toISOString(),id,old,row.gdd_version).first();
         if(!updated)return json({error:'record_changed_retry'},409);
       }
       return json({restored:true,url:target,bytes:total,sha256:sha});
     }catch{return json({error:'recovery_failed'},503)}
}
