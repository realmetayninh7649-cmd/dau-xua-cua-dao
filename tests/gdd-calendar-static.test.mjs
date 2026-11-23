import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,buildICS} from '../workers/gdd-calendar-static/calendar-core.mjs';
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
