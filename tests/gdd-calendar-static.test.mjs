import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,buildICS,selectCalendarSources} from '../workers/gdd-calendar-static/calendar-core.mjs';
test('annual lunar celebrations generate valid Vietnam calendar ICS for 11 years',()=>{
 const events=calculate([{id:'abc',full_name:'Chức sắc thử',rank:'Phối Sư',
  slug:'test-ho-so',death_lunar_day:13,death_lunar_month:11,published:true,verified:true}],
 [{id:'xyz',full_name:'Lễ thử dương lịch',calendar_system:'solar',solar_day:25,
  solar_month:12,published:true}],2026,11);
 assert.ok(events.length>300);
 const ics=buildICS(events);
 assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
 assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
 assert.ok(ics.includes('BEGIN:VALARM')&&ics.includes('TRIGGER:-P1D'));
 assert.ok(ics.includes('https://dauxuacuadao.info.vn/'));
 assert.equal(ics.includes('BEGIN:VCALENDAR\r\nEND:VCALENDAR'),false);
 assert.equal(events.some(x=>x.name==='Chức sắc thử'),true);
 assert.equal(events.some(x=>x.name==='Lễ thử dương lịch'),true);
});
test('lunar events do not expose any unpublished person when filtered at the source',()=>{
 const publicRows=[{id:'safe',full_name:'Chức sắc đã công bố',published:true,verified:true,
  death_lunar_day:10,death_lunar_month:10}];
 const events=calculate(publicRows,[],2026,1);
 assert.ok(events.some(x=>x.name==='Chức sắc đã công bố'));
 assert.ok(!buildICS(events).includes('Bản nháp'));
});

 test('profile dates override old explicitly linked manual dates and include published unverified with a label',()=>{
 const people=[{id:'p',full_name:'Hồ sơ thử',published:true,verified:false,death_lunar_day:12,death_lunar_month:8},{id:'draft',full_name:'Bản nháp',published:false,death_lunar_day:3,death_lunar_month:2},{id:'bad',full_name:'Ngày sai',published:true,death_lunar_day:31,death_lunar_month:12}];
 const manual=[{id:'old',linked_person_id:'p',published:true,full_name:'Hồ sơ thử',calendar_system:'lunar',lunar_day:10,lunar_month:8},{id:'independent',published:true,full_name:'Vị chưa có hồ sơ',calendar_system:'solar',solar_day:2,solar_month:12}];
 const selected=selectCalendarSources(people,manual);assert.deepEqual(selected.people.map(x=>x.id),['p']);assert.deepEqual(selected.manual.map(x=>x.id),['independent']);
 const events=calculate(people,manual,2026,1);assert.equal(events.filter(x=>x.id==='p').length,1);assert.equal(events.find(x=>x.id==='p').verified,false);assert.ok(events.find(x=>x.id==='p').source.includes('chưa đánh dấu'));assert.ok(!events.some(x=>['draft','bad','old'].includes(x.id)));assert.ok(events.some(x=>x.id==='independent'));
 });
 test('lunar month takes priority over solar and honors leap flag',()=>{
 const events=calculate([{id:'l',full_name:'Lunar',published:true,death_lunar_day:15,death_lunar_month:8,death_solar_date:'1950-01-01'}],[],2026,1);
 assert.equal(events.filter(e=>e.id==='l').length,1);assert.match(events.find(e=>e.id==='l').lunar,/^15\/08\//);
 });

 test('documented Ca Minh Chuong lunar anniversary survives missing structured date without assigning disputed year',()=>{
 const p={id:'cmc',slug:'bao-dao-ca-minh-chuong-67sgj4',full_name:'BẢO ĐẠO CHƠN QUÂN CA MINH CHƯƠNG',published:true};
 const e=calculate([p],[],2026,1).filter(x=>x.id==='cmc');assert.equal(e.length,1);assert.equal(e[0].solar,'2026-11-27');assert.equal(e[0].lunar,'19/10/2026');assert.match(e[0].source,/năm qui vị còn dị biệt/);
 assert.equal(calculate([{...p,published:false}],[],2026,1).some(x=>x.id==='cmc'),false);
 const structured=selectCalendarSources([{...p,death_lunar_day:20,death_lunar_month:10}],[]).people[0];assert.equal(structured.death_lunar_day,20);
 });

test('explicit lunar dates in biography outrank a structured solar date and unrelated milestones',()=>{
 const profile={id:'p',full_name:'Test',published:true,death_solar_date:'1928-11-30',biography:'Sinh ngày 12 tháng 3 năm Giáp Tý. Ngài qui vị ngày 19 tháng 10 năm Mậu Thìn (DL 30/11/1928). An táng ngày 20/10 âm lịch.'};
 const e=calculate([profile],[],2026,1).find(x=>x.id==='p');assert.equal(e.solar,'2026-11-27');assert.equal(e.basis,'lunar');
});
test('explicit solar date is used only in the absence of a lunar death date',()=>{
 const p={id:'s',full_name:'Solar',published:true,biography:'Ông qui vị ngày 09/10/1973 dương lịch.'};
 const e=calculate([p],[],2026,1).find(x=>x.id==='s');assert.equal(e.solar,'2026-10-09');assert.equal(e.basis,'solar');
 const p2={...p,biography:'Ông sinh ngày 12/3 âm lịch.'};assert.equal(calculate([p2],[],2026,1).some(x=>x.id==='s'),false);
});
test('conflicting lunar dates are not silently replaced with solar date',()=>{
 const p={id:'conflict',full_name:'Conflict',published:true,death_solar_date:'1973-10-09',biography:'Ông qui vị ngày 14/9 âm lịch. Theo nguồn khác, ông qui vị ngày 15/9 âm lịch.'};
 assert.equal(calculate([p],[],2026,1).some(x=>x.id==='conflict'),false);
});
