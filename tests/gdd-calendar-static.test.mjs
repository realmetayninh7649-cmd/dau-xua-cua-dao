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
