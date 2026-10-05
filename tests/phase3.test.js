import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {createSermonStorage} from '../js/sermon-storage.js';
import {createPersonalLibrary} from '../js/personal-library.js';
import {defaultAssistantProfile,assistantSystem,normalizeStory,storyHtml} from '../js/assistant-profile.js';
import {DOCUMENT_ASSISTANT_SYSTEM} from '../js/document-assistant.js';
import {DEEP_STUDY_SYSTEM} from '../js/deep-study.js';
function storage(){const values=new Map();return createSermonStorage({indexedDB:new IDBFactory(),localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},legacyKey:null});}

test('editable settings replace baked-in theology and reach both assistant modes',()=>{
  const profile={...defaultAssistantProfile(),theology:'My edited theology',voice:'My own voice',rules:'Ask before using a personal story',audiences:{youth:'Use student examples'}};
  for(const base of [DOCUMENT_ASSISTANT_SYSTEM,DEEP_STUDY_SYSTEM]){
    const prompt=assistantSystem(base,profile,'youth');assert.ok(prompt.includes('My edited theology'));assert.ok(prompt.includes('Use student examples'));assert.ok(!prompt.includes('Charismatic leanings'));
  }
  assert.ok(assistantSystem(DOCUMENT_ASSISTANT_SYSTEM,profile).includes('<<<REWRITE>>>'));
  assert.ok(assistantSystem(DEEP_STUDY_SYSTEM,profile).includes('SECTION:LANGUAGE'));
});
test('legacy stories import once with themes and remain editable independently',async()=>{
  const store=storage(),library=createPersonalLibrary(store,async()=>[{id:'old-story',title:'Basketball',content:'Original narrative',tags:'kindness, humility'}]);
  const first=await library.load();assert.equal(first.stories.length,1);assert.deepEqual(first.stories[0].themes,['kindness','humility']);
  await library.saveStory({...first.stories[0],text:'Edited narrative',seconds:90,privacy:'Change the name'});
  const next=await library.load();assert.equal(next.stories.length,1);assert.equal(next.stories[0].text,'Edited narrative');assert.equal(next.stories[0].seconds,90);
});
test('profile settings persist and story usage keeps the sermon identity',async()=>{
  const library=createPersonalLibrary(storage());const profile={...defaultAssistantProfile(),voice:'Conversational and concise'};
  await library.saveProfile(profile);assert.equal((await library.load()).profile.voice,profile.voice);
  const story=normalizeStory({id:'story-a',title:'My story',content:'My narrative'});await library.saveStory(story);
  await library.recordUse('personal-story-a',{id:'use-1',sermonId:'sermon-a',title:'A sermon',createdAt:10});
  assert.equal((await library.load()).stories[0].uses[0].sermonId,'sermon-a');
});
test('story insertion escapes markup and produces a blue editable copy',()=>{
  const html=storyHtml('My story <script>bad()</script>\n\nAnother paragraph');assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.equal((html.match(/<p /g) || []).length,2);assert.ok(html.includes('color:#00b4d8'));
});
test('pinned research restores with its source links and passage anchor',async()=>{
  const store=storage();const research=[{id:'pin',reference:'John 3:16',text:'Study note',createdAt:100,sources:[{label:'NASB',url:'https://www.biblegateway.com/passage/?search=John%203%3A16&version=NASB'}],anchor:{start:{blockId:'block-a',offset:0},end:{blockId:'block-a',offset:4},quote:'John'}}];
  await store.save({id:'sermon-a',title:'Sermon',content:'<p>John 3:16</p>',preparation:{research}},{label:'Pinned version'});
  const version=(await store.versions('sermon-a'))[0];await store.save({id:'sermon-a',title:'Sermon',content:'<p>John 3:16</p>',preparation:{research:[]}});await store.restore('sermon-a',version);
  assert.deepEqual((await store.get('sermon-a')).preparation.research,research);
});
