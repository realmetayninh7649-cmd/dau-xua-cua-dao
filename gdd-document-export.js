(function DocumentExportModule(){
  'use strict';
  if(window.__GDDDocumentExport20261107)return;
  window.__GDDDocumentExport20261107=true;
  const allowed={ 'nhan-vat':'people','bai-viet':'posts','ai-tin':'obituaries','tai-lieu-so-hoa':'documents','tuong-niem':'memorial' };
  const labels={people:'TIỂU SỬ VÀ CÔNG NGHIỆP HÀNH ĐẠO',posts:'BIÊN KHẢO ĐẠO SỬ',obituaries:'AI TÍN',documents:'TÀI LIỆU SỐ HÓA',memorial:'TƯỞNG NIỆM CHỨC SẮC'};
  const css=document.createElement('style');
  css.id='gdd-document-export-style';
  css.textContent=`
   .gdd-doc-export{margin:30px 0 17px;padding:17px;background:#f3f5ef;border:1px solid #d5dfd3;border-left:3px solid #af9159;border-radius:5px}
   .gdd-doc-export h3{margin:0 0 6px;color:#235347;font:700 15px/1.5 'Noto Serif',Georgia,serif}
   .gdd-doc-export p{margin:0 0 13px;color:#617268;font:400 11px/1.75 'Be Vietnam Pro',sans-serif}
   .gdd-doc-actions{display:flex;gap:9px;flex-wrap:wrap}
   .gdd-doc-actions button,.gdd-doc-ready{display:inline-block;min-height:39px;border:1px solid #20564a;border-radius:5px;background:#20564a;color:#fff;padding:10px 14px;font:700 11px/1.45 'Be Vietnam Pro',sans-serif;text-decoration:none;cursor:pointer}
   .gdd-doc-actions button:last-child{background:#fffdf8;color:#20564a}
   .gdd-doc-actions button:disabled{cursor:progress;opacity:.55}
   .gdd-doc-ready{margin-top:12px;background:#fffdf8;color:#20564a;overflow-wrap:anywhere}
   .gdd-doc-status{margin-top:11px;color:#50695b;font:500 11px/1.65 'Be Vietnam Pro',sans-serif;white-space:pre-line;overflow-wrap:anywhere}
   @media(max-width:480px){.gdd-doc-export{padding:13px}.gdd-doc-actions button{flex:1 1 120px}}
  `;
  document.head.appendChild(css);
  const root=document.getElementById('detail-content');
  let memorialRoot=document.getElementById('gdd-memorial-dialog-body');
  let locked=false;
  function route(){
    const m=location.hash.match(/^#([^/]+)\/(.+)$/);
    if(!m||!allowed[m[1]])return null;
    try{return {kind:allowed[m[1]],slug:decodeURIComponent(m[2]),prefix:m[1]}}catch{return null}
  }
  function makeBar(){
    const x=document.createElement('section');x.className='gdd-doc-export';
    x.innerHTML='<h3>Lưu trữ và trích dẫn tư liệu</h3><p>Tải toàn văn bài viết, ảnh, chú thích và nguồn tư liệu đã công bố. Tệp được tạo trên thiết bị; website không lưu thêm bản PDF hay Word.</p><div class="gdd-doc-actions"><button type="button" data-gdd-document="pdf">↓ Tải PDF</button><button type="button" data-gdd-document="docx">↓ Tải Word</button></div><div class="gdd-doc-status" role="status" aria-live="polite"></div>';
    return x;
  }
  function addControls(){
    const r=route();
    if(root){
      const old=root.querySelector('.gdd-doc-export');
      const isArticle=r&&r.kind!=='memorial'&&root.querySelector('.detail-title')&&root.querySelector('.detail-body');
      if(!isArticle)old?.remove();else if(!old)root.appendChild(makeBar());
    }
    if(memorialRoot){
      const old=memorialRoot.querySelector('.gdd-doc-export');
      const active=r?.kind==='memorial'&&memorialRoot.querySelector('#gdd-memorial-text')&&memorialRoot.querySelector('h2');
      if(!active)old?.remove();else if(!old)memorialRoot.appendChild(makeBar());
    }
  }
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;addControls()})}
  if(root)new MutationObserver(schedule).observe(root,{childList:true});
  if(memorialRoot)new MutationObserver(schedule).observe(memorialRoot,{childList:true});
  else{
    const wait=new MutationObserver(()=>{
      const found=document.getElementById('gdd-memorial-dialog-body');
      if(found){memorialRoot=found;wait.disconnect();new MutationObserver(schedule).observe(found,{childList:true});schedule()}
    });
    wait.observe(document.body,{childList:true,subtree:true});
  }
  window.addEventListener('hashchange',schedule);
  schedule();
  const tidy=v=>String(v??'').trim();
  const safeURL=v=>{try{const u=new URL(v,location.href);return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}};
  const chunks=s=>tidy(s).replace(/\r/g,'').split(/\n\s*\n|\n/).map(tidy).filter(Boolean);
  const safeFilename=s=>tidy(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'tu-lieu-dao-su';
  function snapshot(r){
    const mem=r.kind==='memorial',area=mem?memorialRoot:root;
    if(!area)throw Error('Cửa sổ bài viết chưa sẵn sàng.');
    const title=tidy(area.querySelector(mem?'h2':'.detail-title')?.textContent);
    if(!title)throw Error('Chưa đọc được tựa bài viết.');
    const content=tidy(area.querySelector(mem?'#gdd-memorial-text':'.detail-body')?.textContent);
    const sources=tidy(area.querySelector(mem?'#gdd-memorial-sources':'.detail-source')?.textContent).replace(/^NGUỒN TƯ LIỆU\s*(?:&|VÀ)\s*GHI CHÚ\s*/i,'');
    const image=area.querySelector(mem?'.gdd-memorial-detail-image':'.detail-cover img');
    const gallery=[...area.querySelectorAll('.gdd-album-figure')].map((figure,i)=>({
      url:safeURL(figure.querySelector('img')?.currentSrc||figure.querySelector('img')?.src),
      caption:tidy(figure.querySelector('figcaption')?.textContent)||'Ảnh tư liệu '+(i+1)
    })).filter(i=>i.url);
    const sourceLink=safeURL(area.querySelector('.detail-external a[href]')?.href);
    return {...r,title,content,sources,
      subtitle:tidy(area.querySelector(mem?'.gdd-memorial-detail-meta':'.detail-meta')?.textContent),
      summary:tidy(area.querySelector(mem?'.gdd-memorial-summary':'.detail-summary')?.textContent),
      cover:safeURL(image?.currentSrc||image?.src),gallery,sourceLink,
      permalink:location.origin+location.pathname+'#'+r.prefix+'/'+encodeURIComponent(r.slug)};
  }
  let supaPromise;
  async function getSupa(){
    const c=window.SITE_CONFIG||{};
    if(!c.supabaseUrl||!c.supabasePublishableKey)throw Error('Chưa có cấu hình kho lưu trữ.');
    if(!supaPromise)supaPromise=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(m=>m.createClient(c.supabaseUrl,c.supabasePublishableKey));
    return supaPromise;
  }
  async function readGallery(record,progress){
    if(record.kind==='memorial')return record.gallery;
    const client=await getSupa();
    const {data:owner,error:ownerError}=await client.from(record.kind).select('id')
      .eq('slug',record.slug).eq('published',true).maybeSingle();
    if(ownerError||!owner)throw Error('Không thể kiểm tra danh sách ảnh của bài viết: '+(ownerError?.message||'không tìm thấy bản ghi'));
    const result=[];
    for(let offset=0;offset<2000;offset+=200){
      const {data,error}=await client.from('archive_gallery_images')
        .select('image_url,caption,sort_order').eq('owner_kind',record.kind).eq('owner_id',owner.id)
        .order('sort_order',{ascending:true}).order('created_at',{ascending:true}).range(offset,offset+199);
      if(error)throw Error('Không đọc được bộ ảnh đính kèm: '+error.message);
      for(const img of data||[]){
        const url=safeURL(img.image_url);if(url)result.push({url,caption:tidy(img.caption)||'Ảnh tư liệu '+(result.length+1)});
      }
      if(!data||data.length<200)return result.length?result:record.gallery;
      progress('Đã tìm thấy '+result.length+' ảnh đính kèm…');
    }
    throw Error('Bài có hơn 2.000 ảnh; cần chia nhỏ để xuất trên điện thoại.');
  }
  function loadScript(url,done){
    const key='__gddDocLoad:'+url;
    if(window[key])return window[key];
    window[key]=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=url;script.async=true;
      script.onload=()=>done()?resolve():reject(Error('Thư viện xuất file chưa khởi tạo.'));
      script.onerror=()=>reject(Error('Không tải được thư viện xuất file; kiểm tra kết nối Internet.'));
      document.head.appendChild(script);
    }).catch(e=>{delete window[key];throw e});
    return window[key];
  }
  async function getPdf(){
    await loadScript('https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/pdfmake.min.js',()=>!!window.pdfMake);
    await loadScript('https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/vfs_fonts.js',
      ()=>!!window.pdfMake);
    return window.pdfMake;
  }
  async function processImage(url){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    let response;
    try{response=await fetch(url,{mode:'cors',credentials:'omit',signal:controller.signal})}
    finally{clearTimeout(timer)}
    if(!response.ok)throw Error('HTTP '+response.status);
    const blob=await response.blob();
    if(!blob.type.startsWith('image/'))throw Error('Tệp không phải ảnh');
    const ref=URL.createObjectURL(blob);
    try{
      const image=new Image();image.decoding='async';
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Không đọc được ảnh'));image.src=ref});
      const ratio=Math.min(1,1400/Math.max(image.naturalWidth,image.naturalHeight));
      const width=Math.max(1,Math.round(image.naturalWidth*ratio)),height=Math.max(1,Math.round(image.naturalHeight*ratio));
      const c=document.createElement('canvas');c.width=width;c.height=height;
      const context=c.getContext('2d',{alpha:false});context.fillStyle='#FFFFFF';context.fillRect(0,0,width,height);context.drawImage(image,0,0,width,height);
      const data=c.toDataURL('image/jpeg',.82);c.width=c.height=0;
      return {data,width,height};
    }finally{URL.revokeObjectURL(ref)}
  }
  async function prepareImages(record,progress){
    const list=[...(record.cover?[{url:record.cover,caption:'Chơn dung / Ảnh bìa'}]:[]),...record.gallery];
    if(record.kind==='documents'&&/\.(?:png|jpg|jpeg|webp)(?:\?|$)/i.test(record.sourceLink))
      list.push({url:record.sourceLink,caption:'Bản ảnh tài liệu gốc'});
    const ok=[],fail=[],cache=new Map();
    for(let i=0;i<list.length;i++){
      progress('Đang xử lý ảnh '+(i+1)+'/'+list.length);
      const item=list[i];
      try{
        let image=cache.get(item.url);
        if(!image){image=await processImage(item.url);cache.set(item.url,image)}
        ok.push({...image,url:item.url,caption:item.caption});
      }catch(e){fail.push({...item,reason:e.message})}
    }
    return {ok,fail};
  }
  function pdfDefinition(record,images){
    const brand='#215448',gold='#AA8147',muted='#647568';
    const content=[
      {text:'KHO TƯ LIỆU ĐẠO SỬ',style:'kicker',alignment:'center'},
      {text:'GIỮ ĐẠO GIỮA ĐỜI',style:'brand',alignment:'center'},
      {text:'DẤU XƯA CỬA ĐẠO',style:'muted',alignment:'center',margin:[0,0,0,24]},
      {text:labels[record.kind],style:'kicker',alignment:'center'},
      {text:record.title,style:'title',alignment:'center',margin:[0,8,0,14]}
    ];
    if(record.subtitle)content.push({text:record.subtitle,style:'muted',alignment:'center',margin:[0,0,0,14]});
    const illustrations=images.ok.slice();
    const addPicture=(im,cover)=>{
      const factor=Math.min((cover?300:465)/im.width,(cover?260:425)/im.height,1);
      content.push({image:im.data,width:Math.round(im.width*factor),height:Math.round(im.height*factor),
        alignment:'center',margin:[0,cover?7:14,0,5]});
      content.push({text:im.caption,style:'caption',alignment:'center',margin:[0,0,0,16]});
    };
    if(illustrations.length)addPicture(illustrations.shift(),true);
    if(record.summary)content.push({text:record.summary,style:'lead',margin:[0,10,0,17]});
    content.push({text:'NỘI DUNG TƯ LIỆU',style:'section',margin:[0,18,0,11]});
    for(const p of chunks(record.content||'Nội dung đang được bổ sung.'))
      content.push({text:p,style:'body',margin:[0,0,0,11]});
    if(illustrations.length){
      content.push({text:'HÌNH ẢNH VÀ TÀI LIỆU ĐÍNH KÈM',style:'section',pageBreak:'before',margin:[0,5,0,13]});
      illustrations.forEach(im=>addPicture(im,false));
    }
    if(record.sources){
      content.push({text:'TÀI LIỆU THAM KHẢO',style:'section',margin:[0,20,0,11]});
      for(const p of chunks(record.sources))content.push({text:p,style:'body',margin:[0,0,0,9]});
    }
    if(record.sourceLink)content.push({text:'Tệp tài liệu gốc: '+record.sourceLink,link:record.sourceLink,style:'link',margin:[0,14,0,7]});
    if(images.fail.length){
      content.push({text:'ẢNH KHÔNG THỂ NHÚNG — ĐƯỜNG DẪN NGUỒN',style:'section',margin:[0,20,0,10]});
      for(const x of images.fail)content.push({text:x.caption+': '+x.url,link:x.url,style:'link',margin:[0,0,0,7]});
    }
    content.push({text:'Bài viết gốc: '+record.permalink,link:record.permalink,style:'link',margin:[0,18,0,8]});
    return {pageSize:'A4',pageMargins:[56,66,56,58],content,
      info:{title:record.title,author:'Giữ Đạo Giữa Đời'},
      defaultStyle:{font:'Roboto'},
      styles:{
        brand:{fontSize:19,bold:true,color:brand},
        kicker:{fontSize:9,bold:true,color:gold,characterSpacing:1.2},
        title:{fontSize:18,bold:true,color:brand,lineHeight:1.3},
        muted:{fontSize:10,color:muted},
        lead:{fontSize:11,bold:true,color:brand,lineHeight:1.5},
        section:{fontSize:12,bold:true,color:brand},
        body:{fontSize:11,color:'#314339',lineHeight:1.42},
        caption:{fontSize:9,italics:true,color:muted},
        link:{fontSize:9,color:brand}
      },
      footer:(p,total)=>({columns:[
        {text:'GIỮ ĐẠO GIỮA ĐỜI · DẤU XƯA CỬA ĐẠO',fontSize:8,color:gold},
        {text:'Trang '+p+'/'+total,fontSize:8,alignment:'right',color:muted}
      ],margin:[56,16,56,0]})
    };
  }
  function zipStoreDocx(files){
 const enc=new TextEncoder();
 const table=new Uint32Array(256);
 for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[i]=c>>>0}
 const crc32=bytes=>{let c=0xffffffff;for(let i=0;i<bytes.length;i++)c=table[(c^bytes[i])&255]^(c>>>8);return(c^0xffffffff)>>>0};
 const entries=[],chunks=[];let offset=0;
 const now=new Date(),year=Math.max(1980,now.getFullYear());
 const date=((year-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
 const time=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1);
 for(const item of files){
  const name=enc.encode(item.name),data=typeof item.data==='string'?enc.encode(item.data):item.data;
  if(!data||data.length>=0xffffffff||offset+data.length>=0xffffffff)throw Error('Tệp quá lớn để xuất thành Word trên thiết bị.');
  const crc=crc32(data),h=new Uint8Array(30+name.length),v=new DataView(h.buffer);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);
  v.setUint16(10,time,true);v.setUint16(12,date,true);v.setUint32(14,crc,true);
  v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);
  h.set(name,30);entries.push({name,data,crc,offset});chunks.push(h,data);offset+=h.length+data.length;
 }
 const centers=[];let dirSize=0;
 for(const e of entries){
  const h=new Uint8Array(46+e.name.length),v=new DataView(h.buffer);
  v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x0800,true);
  v.setUint16(12,time,true);v.setUint16(14,date,true);v.setUint32(16,e.crc,true);
  v.setUint32(20,e.data.length,true);v.setUint32(24,e.data.length,true);v.setUint16(28,e.name.length,true);
  v.setUint32(42,e.offset,true);h.set(e.name,46);centers.push(h);dirSize+=h.length;
 }
 const eocd=new Uint8Array(22),v=new DataView(eocd.buffer);
 v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);
 v.setUint32(12,dirSize,true);v.setUint32(16,offset,true);
 return new Blob([...chunks,...centers,eocd],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
  async function docxBlob(record,images){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const body=[],rels=[],photoFiles=[];let nextRel=3;
 const rel=(type,target,external=false)=>{
  const id='rId'+nextRel++;
  rels.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${esc(target)}"${external?' TargetMode="External"':''}/>`);
  return id;
 };
 const run=(value,opt={})=>`<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman"/>${opt.bold?'<w:b/>':''}${opt.italic?'<w:i/>':''}<w:color w:val="${opt.color||'2B4337'}"/><w:sz w:val="${opt.size||24}"/></w:rPr><w:t xml:space="preserve">${esc(value)}</w:t></w:r>`;
 const p=(value,opt={})=>`<w:p><w:pPr><w:jc w:val="${opt.center?'center':'left'}"/><w:spacing w:before="${opt.before||0}" w:after="${opt.after??190}" w:line="360" w:lineRule="auto"/>${opt.keep?'<w:keepNext/>':''}</w:pPr>${run(value,opt)}</w:p>`;
 const heading=t=>body.push(p(t,{bold:true,color:'205246',size:27,after:240,before:230,keep:true}));
 body.push(p('KHO TƯ LIỆU ĐẠO SỬ',{center:true,bold:true,color:'A17E49',size:19,after:120}));
 body.push(p('GIỮ ĐẠO GIỮA ĐỜI',{center:true,bold:true,color:'205246',size:37,after:55}));
 body.push(p('DẤU XƯA CỬA ĐẠO',{center:true,color:'A17E49',size:18,after:450}));
 body.push(p(labels[record.kind]||'TƯ LIỆU ĐẠO SỬ',{center:true,bold:true,color:'A17E49',size:19,after:120}));
 body.push(p(record.title,{center:true,bold:true,color:'205246',size:35,after:210}));
 if(record.subtitle)body.push(p(record.subtitle,{center:true,color:'65736B',size:21,after:250}));
 function photo(im,cover=false){
  const raw=atob(im.data.split(',')[1]),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  const fileName='photo-'+(photoFiles.length+1)+'.jpg',id=photoFiles.length+1,rid=rel('image','media/'+fileName);
  photoFiles.push({name:'word/media/'+fileName,data:bytes});
  const factor=Math.min((cover?380:480)/im.width,(cover?350:520)/im.height,1);
  const w=Math.round(im.width*factor)*9525,h=Math.round(im.height*factor)*9525;
  body.push(`<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="220" w:after="80"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${w}" cy="${h}"/><wp:docPr id="${id}" name="Ảnh ${id}" descr="${esc(im.caption||'Ảnh tư liệu')}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="Ảnh ${id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`);
  body.push(p(im.caption||'Ảnh tư liệu',{center:true,italic:true,color:'68756A',size:18,after:310}));
 }
 if(images.ok.length)photo(images.ok[0],true);
 if(record.summary)body.push(p(record.summary,{bold:true,color:'205246',size:24,after:330}));
 heading('NỘI DUNG TƯ LIỆU');
 for(const part of chunks(record.content||'Nội dung đang được bổ sung.'))body.push(p(part));
 if(images.ok.length>1){heading('HÌNH ẢNH VÀ TÀI LIỆU ĐÍNH KÈM');for(const im of images.ok.slice(1))photo(im)}
 if(record.sources){heading('TÀI LIỆU THAM KHẢO');for(const part of chunks(record.sources))body.push(p(part))}
 function hyperlink(label,url){
  const id=rel('hyperlink',url,true);
  body.push(`<w:p><w:pPr><w:spacing w:before="180" w:after="180"/></w:pPr>${run(label,{size:19,color:'205246'})}<w:hyperlink r:id="${id}"><w:r><w:rPr><w:color w:val="205246"/><w:u w:val="single"/><w:sz w:val="19"/></w:rPr><w:t xml:space="preserve">${esc(url)}</w:t></w:r></w:hyperlink></w:p>`);
 }
 if(record.sourceLink)hyperlink('Tệp tài liệu gốc: ',record.sourceLink);
 if(images.fail.length){heading('ẢNH KHÔNG THỂ NHÚNG — ĐƯỜNG DẪN NGUỒN');for(const im of images.fail)hyperlink(im.caption+': ',im.url)}
 hyperlink('Bài viết gốc: ',record.permalink);
 const footerId=rel('footer','footer1.xml');
 const ns='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
 body.push(`<w:sectPr><w:footerReference w:type="default" r:id="${footerId}"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1050" w:right="1050" w:bottom="1050" w:left="1050" w:header="450" w:footer="490"/></w:sectPr>`);
 const documentXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${ns}><w:body>${body.join('')}</w:body></w:document>`;
 const footerXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr>${run('GIỮ ĐẠO GIỮA ĐỜI · DẤU XƯA CỬA ĐẠO  |  Trang ',{size:16,color:'947A4B'})}<w:fldSimple w:instr="PAGE"/></w:p></w:ftr>`;
 const contentTypes='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
 const packageRels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
 const docRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`;
 const core=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(record.title)}</dc:title><dc:creator>Giữ Đạo Giữa Đời</dc:creator></cp:coreProperties>`;
 return zipStoreDocx([{name:'[Content_Types].xml',data:contentTypes},{name:'_rels/.rels',data:packageRels},
  {name:'docProps/core.xml',data:core},{name:'word/document.xml',data:documentXml},
  {name:'word/_rels/document.xml.rels',data:docRels},{name:'word/footer1.xml',data:footerXml},...photoFiles]);
}
  function attachBlob(blob,record,format,bar){
 const old=bar.querySelector('.gdd-doc-ready');
 if(old){URL.revokeObjectURL(old.href);old.remove()}
 bar.querySelector('.gdd-doc-share')?.remove();
 const name=safeFilename(record.title)+'.'+format;
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;link.className='gdd-doc-ready';
 link.textContent='↓ Lưu file '+name;bar.appendChild(link);
 const mime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
 if(format==='docx' && typeof File==='function' && typeof navigator.share==='function'){
  const share=document.createElement('button');
  share.type='button';share.className='gdd-doc-ready gdd-doc-share';
  share.textContent='Chia sẻ / Lưu vào Tệp';
  share.addEventListener('click',async()=>{
   try{
    const wordFile=new File([blob],name,{type:mime});
    if(typeof navigator.canShare==='function'&&!navigator.canShare({files:[wordFile]})){link.click();return}
    await navigator.share({files:[wordFile],title:record.title});
   }catch(err){if(err?.name!=='AbortError')link.click()}
  });
  bar.appendChild(share);
 }
 if(!/iPad|iPhone|iPod/.test(navigator.userAgent))link.click();
}
  async function exportDocument(button,bar){
    if(locked)return;
    const current=route();
    if(!current)return;
    const controls=[...bar.querySelectorAll('[data-gdd-document]')];
    const status=bar.querySelector('.gdd-doc-status');
    const progress=s=>{if(status)status.textContent=s};
    locked=true;controls.forEach(x=>x.disabled=true);
    try{
      const record=snapshot(current);
      progress('Đang kiểm tra bộ ảnh công khai…');
      record.gallery=await readGallery(record,progress);
      const images=await prepareImages(record,progress);
      progress('Đang tạo bản '+(button.dataset.gddDocument==='pdf'?'PDF':'Word')+'…');
      if(button.dataset.gddDocument==='pdf'){
        const make=await getPdf();
        const blob=await new Promise((resolve,reject)=>{
          try{make.createPdf(pdfDefinition(record,images)).getBlob(resolve)}catch(e){reject(e)}
        });
        attachBlob(blob,record,'pdf',bar);
      }else{
        attachBlob(await docxBlob(record,images),record,'docx',bar);
      }
      progress(images.fail.length?
        'Đã tạo tệp. '+images.fail.length+' ảnh bị nguồn hạn chế tải; đã ghi chú thích và đường dẫn ảnh vào tài liệu. Bấm liên kết bên dưới để lưu.':
        'Đã tạo tệp. Bấm liên kết bên dưới để lưu về thiết bị.');
    }catch(error){
      console.warn('[GDD Document Export]',error);
      progress('Không thể xuất tệp: '+(error?.message||String(error))+'. Xin thử lại.');
    }finally{locked=false;controls.forEach(x=>x.disabled=false)}
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-gdd-document]');
    if(!button)return;
    const bar=button.closest('.gdd-doc-export');if(!bar)return;
    event.preventDefault();event.stopPropagation();
    exportDocument(button,bar);
  });
})();