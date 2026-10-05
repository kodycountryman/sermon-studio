import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {createSermonStorage} from '../js/sermon-storage.js';
import {normalizeTiming,preachingSeconds,timeSections,wordCount} from '../js/preaching-time.js';
import {parseWorkshop,workshopRequest,WORKSHOP_PROTOCOL} from '../js/sermon-workshop.js';

test('preaching estimate includes pace, interaction and one fixed allowance',()=>{
  const settings={pace:120,interactionPercent:20,extraSeconds:60};
  assert.equal(preachingSeconds(1200,settings),780);assert.equal(preachingSeconds(1200,settings,false),720);assert.equal(preachingSeconds(0,settings),0);
  assert.equal(wordCount('  First line.\n\nSecond line. '),4);
  assert.deepEqual(normalizeTiming({pace:0,interactionPercent:200,extraSeconds:-1}),{pace:60,interactionPercent:100,extraSeconds:0});
  assert.equal(normalizeTiming({pace:'bad'}).pace,130);
});
test('section timing uses all moved section paragraphs without duplicating fixed time',()=>{
  const sections=[{id:'a',blockIds:['a','b']},{id:'c',blockIds:['c']}],blocks=[{id:'a',text:'One two'},{id:'b',rawText:'Three four'},{id:'c',text:'Five six'}];
  const timed=timeSections(sections,blocks,{pace:60,interactionPercent:50,extraSeconds:60});
  assert.deepEqual(timed.map(s=>s.words),[4,2]);assert.deepEqual(timed.map(s=>s.seconds),[6,3]);assert.deepEqual(sections[0],{id:'a',blockIds:['a','b']});
});
test('streamed workshop exposes only complete options and hides incomplete protocol',()=>{
  assert.deepEqual(parseWorkshop('Coaching.\n<<<OPTION:1|Question>>>unfinished'),{coaching:'Coaching.',options:[]});
  const parsed=parseWorkshop('Coaching.\n<<<OPTION:1|Question>>>First draft<<<END_OPTION>>>\n<<<OPTION:2|Observation>>>Second draft<<<END_OPTION>>>');
  assert.equal(parsed.options.length,2);assert.equal(parsed.options[1].text,'Second draft');assert.equal(parseWorkshop('Coaching.\n<<<OPT').coaching,'Coaching.');
});
test('workshops require full selection replacements and preserve user instructions',()=>{
  for(const kind of ['opening','closing','callback'])assert.ok(workshopRequest(kind,'Keep it under 90 seconds.').includes('Keep it under 90 seconds.'));
  assert.ok(WORKSHOP_PROTOCOL.includes('ENTIRE selection'));assert.ok(WORKSHOP_PROTOCOL.includes('nothing is applied automatically'));assert.throws(()=>workshopRequest('unknown'));
});
test('timing settings participate in saved sermon versions and restore',async()=>{
  const data=new Map(),store=createSermonStorage({indexedDB:new IDBFactory(),localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},legacyKey:null});
  const timing={pace:145,interactionPercent:15,extraSeconds:90};
  await store.save({id:'timed',title:'Sermon',content:'<p>Words</p>',preparation:{timing}},{label:'Timing version'});
  const version=(await store.versions('timed'))[0];await store.save({id:'timed',title:'Sermon',content:'<p>Words</p>',preparation:{timing:{pace:100}}});await store.restore('timed',version);
  assert.deepEqual((await store.get('timed')).preparation.timing,timing);
});
