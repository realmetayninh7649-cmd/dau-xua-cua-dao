import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDocumentPages} from '../client/document-view.mjs';
const original={document:globalThis.document,mammoth:globalThis.mammoth};
function mockCanvas(){
 globalThis.document={createElement(name){
   assert.equal(name,'canvas');
   return {width:0,height:0,
     getContext(){return {fillStyle:'#fff',font:'',textBaseline:'top',fillRect(){},fillText(){},measureText(v){return {width:v.length*16}}}},
     toBlob(cb,type){cb(new Blob([new Uint8Array([255,216,255,...new Array(40).fill(2)])],{type:'image/jpeg'}))}
   };
 }};
 globalThis.mammoth={extractRawText:async()=>({value:'Đạo sử Cao Đài\nThủ bút và tư liệu Nam Kỳ\n'+'văn bản '.repeat(60)})};
}
test('DOCX: tạo ảnh trang đọc chữ có ghi rõ không giữ bố cục',async()=>{
 mockCanvas();
 try{
   const pages=[];
   const file={name:'thu-tich.docx',size:120,arrayBuffer:async()=>new ArrayBuffer(10)};
   const result=await makeDocumentPages(file,async(n,total,blob)=>pages.push({n,total,mime:blob.type,bytes:blob.size}));
   assert.equal(result.viewSource,'docx_text');
   assert.ok(result.pageCount>=1&&result.pageCount<=120);
   assert.equal(pages.length,result.pageCount);
   assert.ok(pages.every(p=>p.mime==='image/jpeg'&&p.bytes>=32));
 }finally{globalThis.document=original.document;globalThis.mammoth=original.mammoth}
});
test('Word .doc cũ không nhận làm DOCX; người dùng phải cung cấp PDF',async()=>{
 await assert.rejects(()=>makeDocumentPages({name:'old.doc',size:12},async()=>{}),/Word .doc cũ/);
});
test('Không xử lý dữ liệu lớn hơn giới hạn iPhone',async()=>{
 await assert.rejects(()=>makeDocumentPages({name:'big.pdf',size:46*1024*1024},async()=>{}),/45 MB/);
});
