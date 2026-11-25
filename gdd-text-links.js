/* Linkify plain text, never interpret editorial HTML. */
(()=>{
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function html(value){
  const text=String(value??'');let out='',cursor=0;
  for(const match of text.matchAll(/https?:\/\/[^\s<>"'\u201c\u201d\u2018\u2019]+/gi)){
   const i=match.index;if(i>0&&/[a-z0-9_]/i.test(text[i-1]))continue;
   let raw=match[0].replace(/[.,;:!?…]+$/,'');
   while(/[)\]}]$/.test(raw)){
    const end=raw.slice(-1),open={')':'(',']':'[','}':'{'}[end];
    if(raw.split(end).length<=raw.split(open).length)break;
    raw=raw.slice(0,-1);
   }
   let url;try{url=new URL(raw);if(!['http:','https:'].includes(url.protocol)||!url.hostname||url.username||url.password)continue}catch{continue}
   out+=escape(text.slice(cursor,i))+'<a class="gdd-text-link" href="'+escape(url.href)+'" target="_blank" rel="noopener noreferrer">'+escape(raw)+'</a>';
   cursor=i+raw.length;
  }
  return out+escape(text.slice(cursor));
 }
 globalThis.GDDTextLinks=Object.freeze({html});
})();
