/* GDD - Sinh trang SEO cong khai tu Supabase (khong su dung service role).
 * Chi truy xuat ban ghi published=true qua khoa publishable va RLS.
 * Khong sua du lieu goc, khong doi QR/hash route.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BASE = 'https://dauxuacuadao.info.vn';
// Site owner requested a temporary full-public-site maintenance mode.
// Keep existing file names/routes, but serve the static home maintenance notice
// from every SEO HTML route without fetching Supabase or touching database records.
if (fs.existsSync(path.join(ROOT, 'maintenance-mode.flag'))) {
  const notice = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (!notice.includes('Website đang tạm bảo trì') || /<script\\b/i.test(notice)) {
    throw new Error('Maintenance notice missing or not static; refuse to replace public SEO pages');
  }
  let updated = 0;
  for (const section of ['ho-so','bien-khao']) {
    const dir = path.join(ROOT, section);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!/\\.html$/i.test(name)) continue;
      const target = path.join(dir, name);
      if (!fs.statSync(target).isFile()) continue;
      if (fs.readFileSync(target,'utf8') !== notice) {
        fs.writeFileSync(target, notice,'utf8');
        updated += 1;
      }
    }
  }
  console.log('MAINTENANCE ACTIVE: public SEO routes display notice; changed '+updated+' pages.');
  process.exit(0);
}
const config = fs.readFileSync(path.join(ROOT, 'supabase-config.js'), 'utf8');
const api = config.match(/supabaseUrl:\s*["'](https:\/\/[^"']+)["']/)?.[1];
const key = config.match(/supabasePublishableKey:\s*["']([^"']+)["']/)?.[1];
if (!api || !key || !api.endsWith('.supabase.co') || !key.startsWith('sb_publishable_')) {
  throw new Error('Khong tim thay Supabase public configuration hop le');
}
const SAFE_SLUG = /^[a-z0-9][a-z0-9_-]{0,180}$/;
const e = (x) => String(x ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[c]);
const oneLine = (x, max=165) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const asDate = x => {
  const t = new Date(x || '');
  return Number.isNaN(t.getTime()) ? '' : t.toISOString().slice(0, 10);
};
function write(rel, body) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), {recursive:true});
  fs.writeFileSync(full, body, 'utf8');
}
async function fetchPublished(table, fields) {
  let all = [];
  for(let offset=0; offset<5000; offset+=500){
    const qs = new URLSearchParams({
      select:fields.join(','), published:'eq.true', order:'created_at.desc',
      limit:'500', offset:String(offset)
    });
    const res = await fetch(api + '/rest/v1/' + table + '?' + qs, {
      headers: {apikey:key, Accept:'application/json'},
      signal:AbortSignal.timeout(25000)
    });
    if(!res.ok) throw new Error(table + ' fetch failed HTTP ' + res.status + ': ' + (await res.text()).slice(0,220));
    const list = await res.json();
    if(!Array.isArray(list)) throw new Error(table + ' khong tra ve danh sach');
    all.push(...list);
    if(list.length < 500) break;
  }
  return all.filter(x => x.published === true && SAFE_SLUG.test(x.slug || ''));
}
function theme() {
  return '<style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;color:#22372f;background:#faf8f2;font:16px/1.8 system-ui,-apple-system,"Segoe UI",sans-serif}a{color:#13584d}header,footer{background:#eff2e9;padding:18px max(20px,calc((100vw - 850px)/2))}main{max-width:850px;margin:0 auto;padding:28px 20px 68px}h1{font:700 clamp(26px,4vw,38px)/1.38 Georgia,"Times New Roman",serif;color:#1d473c}h2{font:700 22px/1.4 Georgia,serif}p{margin:16px 0}.brand{font-weight:800;letter-spacing:.02em;text-decoration:none}.section{font-size:13px;color:#7b6540;letter-spacing:.08em;text-transform:uppercase}.summary{font-weight:600;border-left:3px solid #9c834c;padding:4px 16px;background:#fff}.prose{white-space:pre-wrap;overflow-wrap:anywhere;font-family:Georgia,"Times New Roman",serif;font-size:17px;line-height:1.92;background:#fff;border:1px solid #ede5d8;border-radius:9px;padding:24px}.sources{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;background:#f2efe7;border-radius:8px;padding:16px}.back{display:inline-block;padding:9px 14px;border:1px solid #a9b7ae;border-radius:7px;text-decoration:none;margin:12px 0}ul{padding-left:22px}li{margin:11px 0}.card{border-bottom:1px solid #e4dfd4;padding:14px 0}.card a{font-size:18px;font-weight:700}small{color:#65716b}footer{font-size:13px;color:#54665d}@media(max-width:600px){.prose{padding:17px;font-size:16px}}</style>';
}
function head(title, description, url) {
  return '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><title>'+e(title)+' | Dấu Xưa Cửa Đạo</title><meta name="description" content="'+e(oneLine(description||title))+'"><link rel="canonical" href="'+e(url)+'"><meta property="og:type" content="article"><meta property="og:title" content="'+e(title)+'"><meta property="og:description" content="'+e(oneLine(description||title))+'"><meta property="og:url" content="'+e(url)+'">'+theme()+'</head><body><header><a class="brand" href="/">GIỮ ĐẠO GIỮA ĐỜI · DẤU XƯA CỬA ĐẠO</a></header>';
}
function page(kind, record) {
  const isPerson = kind === 'people';
  const title = isPerson ? record.full_name : record.title;
  const summary = record.summary || '';
  const body = isPerson ? record.biography : record.body;
  const urlPath = (isPerson ? '/ho-so/' : '/bien-khao/') + record.slug + '.html';
  const url = BASE + urlPath;
  const hash = (isPerson ? 'nhan-vat' : 'bai-viet') + '/' + encodeURIComponent(record.slug);
  const label = isPerson ? 'Hồ sơ Chức sắc' : 'Biên khảo Đạo sử';
  const category = isPerson ? [record.rank, record.branch, record.years].filter(Boolean).join(' · ') : [record.category, asDate(record.created_at)].filter(Boolean).join(' · ');
  const main = '<main><div class="section">'+e(label)+'</div><h1>'+e(title)+'</h1><p><small>'+e(category)+'</small></p>'
    +(summary ? '<p class="summary">'+e(summary)+'</p>' : '')
    +'<article class="prose">'+e(body || 'Nội dung đang được bổ sung.')+'</article>'
    +(record.sources ? '<h2>Tư liệu tham khảo</h2><div class="sources">'+e(record.sources)+'</div>' : '')
    +'<p><a class="back" href="/#'+e(hash)+'">Mở hồ sơ và hình ảnh trong kho tư liệu ↗</a></p>'
    +'<p><a href="/">Trang chủ</a> · <a href="'+(isPerson?'/ho-so/':'/bien-khao/')+'">Danh mục tư liệu</a></p></main>';
  return {rel:urlPath.slice(1), url, title, summary, date:asDate(record.updated_at||record.created_at), html:head(title,summary||body,url)+main+'<footer>Kho tư liệu Đạo sử Cao Đài · Tòa Thánh Tây Ninh. Bản đọc phục vụ tìm kiếm; dữ liệu gốc được quản lý tại website chính.</footer></body></html>\n'};
}
function indexPage(label, rel, items) {
  const url=BASE+'/'+rel+'/';
  const contents=items.map(p=>'<li class="card"><a href="/'+e(p.rel)+'">'+e(p.title)+'</a>'+(p.summary?'<p><small>'+e(oneLine(p.summary,220))+'</small></p>':'')+'</li>').join('\n');
  return head(label,'Danh mục tư liệu Đạo sử Cao Đài thuộc Dấu Xưa Cửa Đạo',url)
    +'<main><h1>'+e(label)+'</h1><p>Danh mục các tư liệu đã công bố trong kho Dấu Xưa Cửa Đạo.</p><ul>'+contents+'</ul><p><a href="/">Trở về trang chủ</a></p></main><footer>Giữ Đạo Giữa Đời – Dấu Xưa Cửa Đạo</footer></body></html>\n';
}
async function main() {
  const [people,posts] = await Promise.all([
    fetchPublished('people',['slug','full_name','rank','branch','years','summary','biography','sources','published','created_at','updated_at']),
    fetchPublished('posts',['slug','title','category','summary','body','sources','published','created_at','updated_at'])
  ]);
  if(people.length===0 && posts.length===0) throw new Error('Khong co tai lieu cong khai: dung build de tranh xoa du lieu SEO');
  const sections=[
    {dir:'ho-so',label:'Danh mục hồ sơ Chức sắc',rows:people.map(x=>page('people',x))},
    {dir:'bien-khao',label:'Danh mục bài biên khảo',rows:posts.map(x=>page('posts',x))}
  ];
  const urls=[{url:BASE+'/'},{url:BASE+'/chung-nhan.html'}];
  for(const section of sections) {
    // Hai thu muc nay chi danh cho trang SEO duoc sinh tu dong.
    fs.rmSync(path.join(ROOT,section.dir),{recursive:true,force:true});
    for(const entry of section.rows) {
      write(entry.rel,entry.html);
      urls.push({url:entry.url,lastmod:entry.date});
    }
    write(section.dir+'/index.html',indexPage(section.label,section.dir,section.rows));
    urls.push({url:BASE+'/'+section.dir+'/'});
  }
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(o=>
    '  <url><loc>'+e(o.url)+'</loc>'+(o.lastmod?'<lastmod>'+o.lastmod+'</lastmod>':'')+'</url>'
  ).join('\n')+'\n</urlset>\n';
  write('sitemap.xml',xml);
  console.log('SEO ready: '+people.length+' published people, '+posts.length+' published posts, '+urls.length+' URLs');
}
main().catch(err=>{console.error(err);process.exitCode=1;});
