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
  async function getWord(){
    await loadScript('https://cdn.jsdelivr.net/npm/docx@9.11.0/dist/index.umd.cjs',()=>!!window.docx?.Packer);
    return window.docx;
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
      c.getContext('2d',{alpha:false}).drawImage(image,0,0,width,height);
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
  async function docxBlob(record,images){
    const d=await getWord();
    const p=(value,opt={})=>new d.Paragraph({
      children:[new d.TextRun({text:String(value),color:opt.color||'314339',bold:!!opt.bold,size:opt.size||22})],
      alignment:opt.center?d.AlignmentType.CENTER:d.AlignmentType.LEFT,
      spacing:{before:opt.before||0,after:opt.after??170,line:365},
      keepWithNext:!!opt.keep
    });
    const nodes=[
      p('KHO TƯ LIỆU ĐẠO SỬ',{center:true,bold:true,color:'A88B4B',size:18,after:80}),
      p('GIỮ ĐẠO GIỮA ĐỜI',{center:true,bold:true,color:'245447',size:36,after:65}),
      p('DẤU XƯA CỬA ĐẠO',{center:true,color:'A88B4B',size:19,after:400}),
      p(labels[record.kind],{center:true,color:'A88B4B',bold:true,size:18,after:135}),
      p(record.title,{center:true,bold:true,color:'245447',size:34,after:190})
    ];
    if(record.subtitle)nodes.push(p(record.subtitle,{center:true,color:'67746D',size:21,after:240}));
    const addPicture=async(im,cover)=>{
      const bytes=Uint8Array.from(atob(im.data.split(',')[1]),c=>c.charCodeAt(0));
      const factor=Math.min((cover?380:480)/im.width,(cover?350:520)/im.height,1);
      nodes.push(new d.Paragraph({children:[new d.ImageRun({type:'jpg',data:bytes,
        transformation:{width:Math.max(1,Math.round(im.width*factor)),height:Math.max(1,Math.round(im.height*factor))}})],
        alignment:d.AlignmentType.CENTER,spacing:{before:220,after:90}}));
      nodes.push(p(im.caption,{center:true,color:'6B776F',size:18,after:250}));
    };
    if(images.ok.length)await addPicture(images.ok[0],true);
    if(record.summary)nodes.push(p(record.summary,{bold:true,color:'245447',size:23,after:350}));
    nodes.push(p('NỘI DUNG TƯ LIỆU',{bold:true,color:'245447',size:25,after:220,keep:true}));
    for(const s of chunks(record.content||'Nội dung đang được bổ sung.'))nodes.push(p(s,{after:210}));
    if(images.ok.length>1){
      nodes.push(p('HÌNH ẢNH VÀ TÀI LIỆU ĐÍNH KÈM',{bold:true,color:'245447',size:25,before:270,after:210,keep:true}));
      for(const im of images.ok.slice(1))await addPicture(im,false);
    }
    if(record.sources){
      nodes.push(p('TÀI LIỆU THAM KHẢO',{bold:true,color:'245447',size:25,before:260,after:190,keep:true}));
      for(const s of chunks(record.sources))nodes.push(p(s,{after:180}));
    }
    if(record.sourceLink)nodes.push(p('Tệp tài liệu gốc: '+record.sourceLink,{size:19,color:'245447',before:180}));
    if(images.fail.length){
      nodes.push(p('ẢNH KHÔNG THỂ NHÚNG — ĐƯỜNG DẪN NGUỒN',{bold:true,color:'245447',size:24,before:240,keep:true}));
      for(const im of images.fail)nodes.push(p(im.caption+': '+im.url,{size:19,color:'245447'}));
    }
    nodes.push(p('Bài viết gốc: '+record.permalink,{size:19,color:'245447',before:200}));
    const doc=new d.Document({
      creator:'Giữ Đạo Giữa Đời',title:record.title,
      sections:[{properties:{page:{margin:{top:1150,bottom:1050,left:1150,right:1150}}},
        footers:{default:new d.Footer({children:[p('GIỮ ĐẠO GIỮA ĐỜI · KHO TƯ LIỆU ĐẠO SỬ',{center:true,color:'A18B5C',size:16})]})},
        children:nodes}]
    });
    return d.Packer.toBlob(doc);
  }
  function attachBlob(blob,record,format,bar){
    const old=bar.querySelector('.gdd-doc-ready');
    if(old){URL.revokeObjectURL(old.href);old.remove()}
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    const name=safeFilename(record.title)+'.'+format;
    link.href=url;link.download=name;link.className='gdd-doc-ready';
    link.textContent='↓ Lưu file '+name;
    bar.appendChild(link);
    // iPhone: link có sẵn để người dùng nhấn / Lưu vào Tệp sau khi tạo.
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