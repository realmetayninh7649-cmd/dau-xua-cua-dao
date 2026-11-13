(function TuanCuuUtility(){
'use strict';
if(window.__gddTuanCuuUtility2026) return;
window.__gddTuanCuuUtility2026 = true;
const $ = (q,root=document)=>root.querySelector(q);
const labels = ['Nhứt Cửu','Nhị Cửu','Tam Cửu','Tứ Cửu','Ngũ Cửu','Lục Cửu','Thất Cửu','Bát Cửu','Chung Cửu','Tiểu Tường','Đại Tường'];
const offsets = [8,17,26,35,44,53,62,71,80,280,580];
const weekDays = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
const esc = v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const pad = n=>String(n).padStart(2,'0');
const dateText = (y,m,d)=>pad(d)+'/'+pad(m)+'/'+y;
const fileSlug = s=>String(s||'tan-co').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)||'tan-co';
function localToday(){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(new Date());
  const v=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
  return v.year+'-'+pad(v.month)+'-'+pad(v.day);
}
function parseDate(value){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if(!m)throw Error('Xin chọn ngày qui vị Dương lịch.');
  const y=+m[1],mm=+m[2],d=+m[3];
  if(y<1900||y>2100)throw Error('Xin chọn năm từ 1900 đến 2100.');
  const time=Date.UTC(y,mm-1,d);
  const dt=new Date(time);
  if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==mm-1||dt.getUTCDate()!==d)throw Error('Ngày qui vị không hợp lệ.');
  return {y,m:mm,d,time};
}
function lunarText(dt){
  const converter=window.GDDVietnameseLunar?.solarToLunar;
  if(typeof converter!=='function')throw Error('Bộ lịch Âm – Dương chưa tải. Hãy tải lại trang.');
  const l=converter(dt.getUTCDate(),dt.getUTCMonth()+1,dt.getUTCFullYear());
  const stems=['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
  const branches=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
  return l.day+'/'+l.month+(l.leap?' nhuận':'')+' '+stems[(l.year+6)%10]+' '+branches[(l.year+8)%12];
}
function makeSchedule(name,isoDate){
  const death=parseDate(isoDate);
  const date=new Date(death.time);
  const display=name.trim()||'Tân Cố';
  const lunar=lunarText(date);
  const rows=offsets.map((offset,i)=>{
    const day=new Date(death.time+offset*86400000);
    return {label:labels[i],day:weekDays[day.getUTCDay()],lunar:lunarText(day),solar:dateText(day.getUTCFullYear(),day.getUTCMonth()+1,day.getUTCDate())};
  });
  return {name:display,date:dateText(death.y,death.m,death.d),weekday:weekDays[date.getUTCDay()],lunar,year:death.y,rows};
}
function status(message,bad=false){
  const node=$('#gdd-cuu-status');
  if(node){node.textContent=message;node.classList.toggle('gdd-cuu-error',bad)}
}
function clearDownload(){
  const x=$('#gdd-cuu-ready');
  if(!x)return;
  const url=x.dataset.objectUrl;
  if(url)URL.revokeObjectURL(url);
  x.remove();
}
let current=null;
function renderResults(data){
  const area=$('#gdd-cuu-result');
  if(!area)return;
  const body=data.rows.map(r=>'<tr><th scope="row">'+esc(r.label)+'</th><td>'+esc(r.day)+'</td><td>'+esc(r.lunar)+'</td><td>'+esc(r.solar)+'</td></tr>').join('');
  area.innerHTML='<div class="gdd-cuu-result-head"><strong>LỊCH TUẦN CỬU – TIỂU TƯỜNG – ĐẠI TƯỜNG</strong><span>'+esc(data.name)+'</span><small>Ngày qui vị: '+esc(data.weekday)+' '+esc(data.date)+' · Âm lịch: '+esc(data.lunar)+'</small></div>'+
    '<div class="gdd-cuu-table-scroll" tabindex="0" aria-label="Bảng ngày lễ, có thể cuộn ngang"><table class="gdd-cuu-table"><thead><tr><th scope="col">Lễ</th><th scope="col">Thứ</th><th scope="col">Ngày Âm lịch</th><th scope="col">Ngày Dương lịch</th></tr></thead><tbody>'+body+'</tbody></table></div>'+
    '<div class="gdd-cuu-export"><button type="button" data-cuu-format="pdf">↓ Tải PDF</button><button type="button" data-cuu-format="docx">↓ Tải Word</button></div>'+
    '<p class="gdd-cuu-source">Ngày qui vị tính là ngày thứ nhất. Tiểu Tường ngày thứ 281, Đại Tường ngày thứ 581.</p>';
  area.hidden=false;
}
function loadScript(url,check){
  if(check())return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const node=document.createElement('script');
    node.src=url;node.async=true;
    node.onload=()=>check()?resolve():reject(Error('Không khởi tạo được bộ xuất PDF.'));
    node.onerror=()=>reject(Error('Không tải được bộ tạo PDF. Hãy kiểm tra kết nối mạng.'));
    document.head.append(node);
  });
}
async function getPdfMake(){
  if(!window.pdfMake?.createPdf){
    await loadScript('https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/pdfmake.min.js',()=>!!window.pdfMake?.createPdf);
  }
  // Bảo đảm có bộ phông Việt ngữ trước khi tạo PDF.
  if(!window.pdfMake?.vfs||!Object.keys(window.pdfMake.vfs).length){
    await loadScript('https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/vfs_fonts.js',()=>!!window.pdfMake?.vfs&&Object.keys(window.pdfMake.vfs).length>0);
  }
  return window.pdfMake;
}
function pdfDefinition(data){
  const head=[{text:'Lễ',bold:true},{text:'Thứ',bold:true},{text:'Ngày Âm lịch',bold:true},{text:'Ngày Dương lịch',bold:true}];
  const body=[head,...data.rows.map(r=>[r.label,r.day,r.lunar,r.solar])];
  return {
    pageSize:'A4',pageMargins:[35,40,35,38],
    info:{title:'Lịch Tuần Cửu - '+data.name,author:'Giữ Đạo Giữa Đời'},
    defaultStyle:{font:'Roboto',fontSize:10,color:'#263e36'},
    content:[
      {text:'ĐẠI ĐẠO TAM KỲ PHỔ ĐỘ',alignment:'center',bold:true,color:'#1f5447',fontSize:13,margin:[0,0,0,2]},
      {text:'GIỮ ĐẠO GIỮA ĐỜI · DẤU XƯA CỬA ĐẠO',alignment:'center',color:'#a07b44',fontSize:9,margin:[0,0,0,16]},
      {text:'LỊCH TUẦN CỬU – TIỂU TƯỜNG – ĐẠI TƯỜNG',alignment:'center',bold:true,fontSize:15,color:'#1e5147',margin:[0,0,0,12]},
      {text:data.name,alignment:'center',bold:true,fontSize:13,margin:[0,0,0,5]},
      {text:'Ngày qui vị: '+data.weekday+' '+data.date+' · Âm lịch: '+data.lunar,alignment:'center',fontSize:10,margin:[0,0,0,19]},
      {table:{headerRows:1,widths:[92,68,156,'*'],body},layout:{
        fillColor:(row)=>row===0?'#e7efea':(row%2===0?'#f8faf7':null),
        hLineColor:()=> '#d4ddd5',vLineColor:()=> '#d4ddd5',paddingTop:()=>8,paddingBottom:()=>8,paddingLeft:()=>7,paddingRight:()=>7
      }},
      {text:'Ngày qui vị kể là ngày thứ nhất. Tuần Cửu: mỗi kỳ 9 ngày. Tiểu Tường: ngày 281. Đại Tường: ngày 581.',fontSize:8,color:'#66776b',margin:[0,17,0,0]},
      {text:'Nguồn đối chiếu: Hội Thánh Cao Đài Tòa Thánh Tây Ninh – caodai.com.vn',fontSize:8,color:'#66776b',margin:[0,5,0,0]}
    ],
    footer:(p,total)=>({text:'GIỮ ĐẠO GIỮA ĐỜI · Trang '+p+'/'+total,color:'#a07b44',fontSize:8,alignment:'center',margin:[0,14,0,0]})
  };
}
function zipStore(files){
  const enc=new TextEncoder();
  const table=new Uint32Array(256);
  for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[i]=c>>>0}
  const crc32=bytes=>{let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0};
  const entries=[],chunks=[];let offset=0;
  const now=new Date(),yr=Math.max(1980,now.getFullYear());
  const dosDate=((yr-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
  const dosTime=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1);
  for(const f of files){
    const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data;
    const crc=crc32(data),header=new Uint8Array(30+name.length),v=new DataView(header.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);
    v.setUint16(10,dosTime,true);v.setUint16(12,dosDate,true);v.setUint32(14,crc,true);
    v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);
    header.set(name,30);entries.push({name,data,crc,offset});chunks.push(header,data);offset+=header.length+data.length;
  }
  const dirs=[];let size=0;
  for(const e of entries){
    const h=new Uint8Array(46+e.name.length),v=new DataView(h.buffer);
    v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);
    v.setUint16(8,0x0800,true);v.setUint16(12,dosTime,true);v.setUint16(14,dosDate,true);
    v.setUint32(16,e.crc,true);v.setUint32(20,e.data.length,true);v.setUint32(24,e.data.length,true);v.setUint16(28,e.name.length,true);
    v.setUint32(42,e.offset,true);h.set(e.name,46);dirs.push(h);size+=h.length;
  }
  const end=new Uint8Array(22),v=new DataView(end.buffer);
  v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);
  v.setUint32(12,size,true);v.setUint32(16,offset,true);
  return new Blob([...chunks,...dirs,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
function wordBlob(data){
  const color='205448';
  const run=(s,bold=false)=>'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>'+(bold?'<w:b/>':'')+'<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">'+esc(s)+'</w:t></w:r>';
  const paragraph=(text,center=false,bold=false)=>'<w:p><w:pPr><w:jc w:val="'+(center?'center':'left')+'"/><w:spacing w:after="135"/></w:pPr>'+run(text,bold)+'</w:p>';
  const row=(items,heading=false)=>'<w:tr>'+items.map((s,i)=>'<w:tc><w:tcPr><w:tcW w:w="'+[1700,1150,2250,1900][i]+'" w:type="dxa"/><w:shd w:fill="'+(heading?'E7EFEA':'FFFFFF')+'"/><w:tcBorders><w:bottom w:val="single" w:color="D6DED5" w:sz="5"/></w:tcBorders></w:tcPr>'+paragraph(s,false,heading)+'</w:tc>').join('')+'</w:tr>';
  const content=[
    paragraph('ĐẠI ĐẠO TAM KỲ PHỔ ĐỘ',true,true),
    paragraph('GIỮ ĐẠO GIỮA ĐỜI · DẤU XƯA CỬA ĐẠO',true),
    paragraph('LỊCH TUẦN CỬU – TIỂU TƯỜNG – ĐẠI TƯỜNG',true,true),
    paragraph(data.name,true,true),
    paragraph('Ngày qui vị: '+data.weekday+' '+data.date+' · Âm lịch: '+data.lunar,true),
    '<w:tbl><w:tblPr><w:tblW w:w="7000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:color="B9C9C0" w:sz="5"/><w:left w:val="single" w:color="B9C9C0" w:sz="5"/><w:right w:val="single" w:color="B9C9C0" w:sz="5"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="1700"/><w:gridCol w:w="1150"/><w:gridCol w:w="2250"/><w:gridCol w:w="1900"/></w:tblGrid>',
    row(['Lễ','Thứ','Ngày Âm lịch','Ngày Dương lịch'],true),
    ...data.rows.map(r=>row([r.label,r.day,r.lunar,r.solar])),
    '</w:tbl>',
    paragraph('Ngày qui vị tính là ngày thứ nhất. Tiểu Tường: ngày 281; Đại Tường: ngày 581.'),
    paragraph('Nguồn đối chiếu: Hội Thánh Cao Đài Tòa Thánh Tây Ninh – caodai.com.vn')
  ];
  const doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+content.join('')+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="650" w:bottom="850" w:left="650"/></w:sectPr></w:body></w:document>';
  const ct='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
  const rel='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
  const core='<?xml version="1.0" encoding="UTF-8"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Lịch Tuần Cửu - '+esc(data.name)+'</dc:title><dc:creator>Giữ Đạo Giữa Đời</dc:creator></cp:coreProperties>';
  return zipStore([{name:'[Content_Types].xml',data:ct},{name:'_rels/.rels',data:rel},{name:'docProps/core.xml',data:core},{name:'word/document.xml',data:doc}]);
}
function attachDownload(blob,format,data){
  clearDownload();
  const holder=document.createElement('div');
  holder.id='gdd-cuu-ready';holder.className='gdd-cuu-ready';
  const name='lich-tuan-cuu-'+fileSlug(data.name)+'-'+data.date.replace(/\//g,'-')+'.'+format;
  const url=URL.createObjectURL(blob);
  holder.dataset.objectUrl=url;
  const link=document.createElement('a');link.href=url;link.download=name;link.textContent='↓ Lưu tệp '+format.toUpperCase();
  holder.append(link);
  if(typeof File==='function'&&typeof navigator.share==='function'){
    const b=document.createElement('button');b.type='button';b.textContent='Chia sẻ / Lưu vào Tệp';
    b.addEventListener('click',()=>{
      const f=new File([blob],name,{type:blob.type});
      try{
        if(navigator.canShare&&!navigator.canShare({files:[f]})){link.click();return}
        Promise.resolve(navigator.share({files:[f],title:'Lịch Tuần Cửu – '+data.name}))
          .catch(err=>{if(err?.name!=='AbortError')status('Không thể chia sẻ tự động. Hãy dùng liên kết Lưu tệp. ',true)});
      }catch(err){status('Không thể mở bảng chia sẻ; hãy nhấn Lưu tệp.',true)}
    });
    holder.append(b);
  }
  $('#gdd-cuu-result').append(holder);
  status('Đã tạo tệp '+format.toUpperCase()+'. Nhấn Lưu tệp hoặc Chia sẻ / Lưu vào Tệp.');
  if(!/iPhone|iPad|iPod/i.test(navigator.userAgent))link.click();
}
let exporting=false;
async function exportResult(type){
  if(exporting||!current)return;
  const buttons=[...document.querySelectorAll('[data-cuu-format]')];
  exporting=true;buttons.forEach(b=>b.disabled=true);
  clearDownload();
  status('Đang tạo file '+type.toUpperCase()+'…');
  try{
    let blob;
    if(type==='pdf'){
      const pdf=await getPdfMake();
      blob=await new Promise((resolve,reject)=>{
        try{pdf.createPdf(pdfDefinition(current)).getBlob(resolve)}catch(err){reject(err)}
      });
    } else blob=wordBlob(current);
    if(!blob||blob.size<100)throw Error('File xuất ra không hợp lệ.');
    attachDownload(blob,type,current);
  }catch(err){status('Chưa tạo được file: '+(err?.message||String(err)),true)}
  finally{exporting=false;buttons.forEach(b=>b.disabled=false)}
}
const css=`
#gdd-tuan-cuu-utility{min-width:0}
#gdd-tuan-cuu-utility>summary{cursor:pointer}
#gdd-tuan-cuu-utility .gdd-cuu-content{padding:0 12px 17px;min-width:0}
#gdd-tuan-cuu-utility .gdd-cuu-lead{font-size:11px;line-height:1.7;color:#64766b;margin:0 0 14px}
#gdd-tuan-cuu-utility .gdd-cuu-form{display:grid;gap:10px;margin:0}
#gdd-tuan-cuu-utility .gdd-cuu-form label{display:grid;gap:5px;font-size:11px;font-weight:700;color:#31584d}
#gdd-tuan-cuu-utility .gdd-cuu-form input{box-sizing:border-box;width:100%;min-height:43px;padding:9px 10px;border:1px solid #cdd6cd;border-radius:7px;background:#fffdf8;color:#203c33;font:12px/1.4 'Be Vietnam Pro',sans-serif}
#gdd-tuan-cuu-utility .gdd-cuu-form button,#gdd-tuan-cuu-utility .gdd-cuu-export button{min-height:40px;border:0;border-radius:6px;background:#215448;color:#fff;font:700 11px/1.5 'Be Vietnam Pro',sans-serif;padding:9px 13px;cursor:pointer}
#gdd-tuan-cuu-utility .gdd-cuu-form button:disabled,#gdd-tuan-cuu-utility .gdd-cuu-export button:disabled{opacity:.55;cursor:wait}
#gdd-tuan-cuu-utility .gdd-cuu-error{color:#ad4d3b!important}
#gdd-tuan-cuu-utility #gdd-cuu-status{min-height:1em;margin:9px 0;font:500 10px/1.5 'Be Vietnam Pro',sans-serif;color:#587266}
#gdd-tuan-cuu-utility #gdd-cuu-result[hidden]{display:none!important}
#gdd-tuan-cuu-utility .gdd-cuu-result-head{text-align:center;margin:14px 0 12px;display:grid;gap:5px}
#gdd-tuan-cuu-utility .gdd-cuu-result-head strong{font:700 11px/1.5 'Noto Serif',Georgia,serif;color:#235448}
#gdd-tuan-cuu-utility .gdd-cuu-result-head span{font:700 12px/1.5 'Noto Serif',Georgia,serif;color:#27443b}
#gdd-tuan-cuu-utility .gdd-cuu-result-head small{font-size:10px;line-height:1.7;color:#66766b}
#gdd-tuan-cuu-utility .gdd-cuu-table-scroll{overflow-x:auto;max-width:100%;-webkit-overflow-scrolling:touch;border:1px solid #d7dfd5;border-radius:7px;background:#fff}
#gdd-tuan-cuu-utility .gdd-cuu-table{width:100%;border-collapse:collapse;table-layout:fixed;font:400 10px/1.45 'Be Vietnam Pro',sans-serif;color:#2d4239}
#gdd-tuan-cuu-utility .gdd-cuu-table th,#gdd-tuan-cuu-utility .gdd-cuu-table td{text-align:center;overflow-wrap:anywhere;padding:8px 4px;border-right:1px solid #dfe5dc;border-bottom:1px solid #dfe5dc}
#gdd-tuan-cuu-utility .gdd-cuu-table th:last-child,#gdd-tuan-cuu-utility .gdd-cuu-table td:last-child{border-right:0}
#gdd-tuan-cuu-utility .gdd-cuu-table thead th{background:#e7eee8;font-weight:700;color:#225348}
#gdd-tuan-cuu-utility .gdd-cuu-table tbody th{font-weight:700}
#gdd-tuan-cuu-utility .gdd-cuu-table tbody tr:nth-child(even){background:#f8faf7}
#gdd-tuan-cuu-utility .gdd-cuu-table tr>:nth-child(1){width:21%}
#gdd-tuan-cuu-utility .gdd-cuu-table tr>:nth-child(2){width:18%}
#gdd-tuan-cuu-utility .gdd-cuu-table tr>:nth-child(3){width:29%}
#gdd-tuan-cuu-utility .gdd-cuu-table tr>:nth-child(4){width:32%}
#gdd-tuan-cuu-utility .gdd-cuu-export{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0 0}
#gdd-tuan-cuu-utility .gdd-cuu-export button:nth-child(2){background:#fffdf8;border:1px solid #215448;color:#215448}
#gdd-tuan-cuu-utility .gdd-cuu-source{font-size:9px;line-height:1.65;color:#768276;margin:12px 0}
#gdd-tuan-cuu-utility .gdd-cuu-ready{margin:12px 0 0;padding:11px;border:1px solid #cdd8d0;border-radius:6px;background:#f0f5f1;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#gdd-tuan-cuu-utility .gdd-cuu-ready a,#gdd-tuan-cuu-utility .gdd-cuu-ready button{display:inline-block;border-radius:5px;border:1px solid #b9d0c3;color:#205448;background:#fff;padding:9px;font-size:11px;font-weight:700;word-break:break-word;cursor:pointer;text-decoration:none}
#gdd-tuan-cuu-utility .gdd-cuu-cite{margin:12px 0 0;font-size:10px;line-height:1.6}
#gdd-tuan-cuu-utility .gdd-cuu-cite a{color:#266253}
@media(max-width:490px){#gdd-tuan-cuu-utility .gdd-cuu-content{padding:0 9px 13px}#gdd-tuan-cuu-utility .gdd-cuu-table{font-size:9px}#gdd-tuan-cuu-utility .gdd-cuu-table th,#gdd-tuan-cuu-utility .gdd-cuu-table td{padding:7px 2px}}
`;
function mount(){
  const aside=$('#gdd-p1-aside');
  if(!aside||$('#gdd-tuan-cuu-utility'))return;
  const style=document.createElement('style');style.id='gdd-tuan-cuu-style';style.textContent=css;document.head.append(style);
  const details=document.createElement('details');
  details.id='gdd-tuan-cuu-utility';details.className='gdd-p1-panel gdd-cuu-panel';
  details.innerHTML='<summary><span class="gdd-p1-utility-name">TÍNH NGÀY TUẦN CỬU</span><small class="gdd-p1-utility-desc">Tiểu Tường · Đại Tường · PDF / Word</small></summary>'+
    '<div class="gdd-cuu-content"><p class="gdd-cuu-lead">Nhập ngày qui vị Dương lịch để tra đủ 9 kỳ Cửu và hai kỳ Tường.</p>'+
    '<form class="gdd-cuu-form" id="gdd-cuu-form"><label>Họ tên / Thánh danh<input type="text" id="gdd-cuu-name" maxlength="160" placeholder="Danh xưng người qui vị" autocomplete="off"></label>'+
    '<label>Ngày qui vị (Dương lịch)<input type="date" id="gdd-cuu-date" min="1900-01-01" max="2100-12-31" required></label>'+
    '<button type="submit">Tính ngày Tuần Cửu</button></form><p id="gdd-cuu-status" role="status" aria-live="polite"></p>'+
    '<div id="gdd-cuu-result" hidden></div>'+
    '<p class="gdd-cuu-cite">Đối chiếu <a href="https://caodai.com.vn/df/tinh-tuan-cuu.html" target="_blank" rel="noopener noreferrer">tiện ích của Hội Thánh</a>.</p></div>';
  const anniversary=aside.querySelector('.gdd-p1-anniversary-link');
  const calendar=aside.querySelector('#gdd-p1-calendar-panel');
  if(anniversary)anniversary.after(details);else if(calendar)calendar.after(details);else aside.append(details);
  $('#gdd-cuu-date').value=localToday();
  $('#gdd-cuu-form').addEventListener('submit',ev=>{
    ev.preventDefault();clearDownload();
    try{
      const date=$('#gdd-cuu-date');
      if(!date.checkValidity()){date.reportValidity();return}
      current=makeSchedule($('#gdd-cuu-name').value,date.value);
      renderResults(current);
      status(current.year<1968?'Ngày trước 1968: vui lòng đối chiếu thêm với tư liệu lịch sử.':'Đã tính đầy đủ 11 kỳ lễ.');
    }catch(err){current=null;$('#gdd-cuu-result').hidden=true;status(err?.message||String(err),true)}
  });
  for(const id of ['gdd-cuu-name','gdd-cuu-date'])$('#'+id).addEventListener('input',()=>{
    if(!current)return;
    current=null;clearDownload();$('#gdd-cuu-result').hidden=true;
    status('Thông tin đã thay đổi. Nhấn Tính ngày Tuần Cửu để cập nhật.');
  });
  $('#gdd-cuu-result').addEventListener('click',e=>{
    const b=e.target.closest('[data-cuu-format]');
    if(b)exportResult(b.dataset.cuuFormat);
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.addEventListener('load',mount,{once:true});
})();