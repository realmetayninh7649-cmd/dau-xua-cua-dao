// Network-only installable admin app: no service worker or private-data cache.
export const MANIFEST={id:'/admin',name:'Quản trị Đạo sử – Dấu Xưa Cửa Đạo',short_name:'Quản trị Đạo sử',lang:'vi',start_url:'/admin',scope:'/',display:'standalone',theme_color:'#214c3d',background_color:'#f6f5ef',icons:[{src:'/admin/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/admin/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}]};
export const ICON_SVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" fill="#214c3d"/><rect x="13" y="13" width="154" height="154" rx="24" fill="none" stroke="#d6b779" stroke-width="3"/><path d="M43 66 Q66 53 90 70 Q114 53 137 66 V123 Q112 111 90 126 Q68 111 43 123Z" fill="#f6f0df"/><path d="M90 70V126" stroke="#214c3d" stroke-width="4"/><path d="M60 81L78 84M60 95L78 98M102 84L120 81M102 98L120 95" stroke="#d6b779" stroke-width="3"/><path d="M83 43L90 32L97 43L90 54Z" fill="#d6b779"/></svg>';
function bytes32(n){return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]}
function concat(parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let off=0;for(const p of parts){out.set(p,off);off+=p.length}return out}
function crc32(bytes){let c=0xffffffff;for(const v of bytes){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function chunk(name,data){const core=concat([new TextEncoder().encode(name),data]);return concat([bytes32(data.length),core,bytes32(crc32(core))])}
function pixel(x,y){
 const d=Math.abs(x-90);
 if(x>=13&&x<=167&&y>=13&&y<=167&&(x<16||x>164||y<16||y>164))return 1;
 if(Math.abs(y-43)+Math.abs(x-90)*1.6<=11)return 1;
 if(x>=43&&x<=137&&y>=66+(47-d)*.09&&y<=123+(47-d)*.06){
  if(d<2)return 0;
  if(d>=12&&d<=30&&(Math.abs(y-(84-(d-12)*.17))<1.6||Math.abs(y-(98-(d-12)*.17))<1.6))return 1;
  return 2;
 }
 return 0;
}
export function iconPng(size=180){
 const stride=Math.ceil(size/4),raw=new Uint8Array(size*(stride+1));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)raw[y*(stride+1)+1+(x>>2)]|=pixel(x*180/size,y*180/size)<<(6-(x%4)*2);
 let a=1,b=0;for(const v of raw){a=(a+v)%65521;b=(b+a)%65521}
 const blocks=[[0x78,0x01]];for(let pos=0;pos<raw.length;){const n=Math.min(65535,raw.length-pos),last=pos+n===raw.length;blocks.push([last?1:0,n&255,n>>8,(~n)&255,((~n)>>8)&255],raw.subarray(pos,pos+n));pos+=n}
 blocks.push(bytes32((b<<16)|a));
 return concat([[137,80,78,71,13,10,26,10],chunk('IHDR',[...bytes32(size),...bytes32(size),2,3,0,0,0]),chunk('PLTE',[33,76,61,214,183,121,246,240,223,0,0,0]),chunk('IDAT',concat(blocks)),chunk('IEND',[])]);
}
