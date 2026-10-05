import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {createSermonStorage} from '../js/sermon-storage.js';

function fixture(withCloud=false){
  const values=new Map(),localStorage={getItem:key=>values.get(key) || null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const indexedDB=new IDBFactory();let time=1000,sequence=0,connected=true;
  const remote=new Map(),cloudVersions=new Map();
  const cloud={read:async id=>structuredClone(remote.get(id) || null),list:async()=>structuredClone([...remote.values()]),write:async(record,previous)=>{
    assert.equal(remote.get(record.id)?.revision,previous?.revision,'write must compare the version it read');remote.set(record.id,structuredClone(record));
  },writeVersions:async items=>items.forEach(item=>cloudVersions.set(item.id,structuredClone(item))),readVersions:async id=>[...cloudVersions.values()].filter(item=>item.sermonId===id)};
  const options={indexedDB,localStorage,cloud:withCloud?cloud:null,online:()=>connected,now:()=>time,uuid:()=>`id-${++sequence}`};
  const make=()=>createSermonStorage(options);
  return {store:make(),make,remote,cloud,localStorage,tick:amount=>time+=amount,offline:()=>connected=false,online:()=>connected=true};
}
const document=(content='<p>Original</p>')=>({id:'sermon-1',title:'Test sermon',content,fontSize:'12',updatedAt:1000});

test('device drafts and active manuscript recover across storage instances',async()=>{
  const f=fixture();await f.store.save(document());f.store.setActive('sermon-1');
  f.tick(100);f.store.emergency(document('<p>Latest keystroke</p>'));
  const reopened=f.make();assert.equal((await reopened.recover()).content,'<p>Latest keystroke</p>');
  reopened.clearActive();assert.equal(await reopened.recover(),null);
});
test('concurrent saves retain the latest text and do not erase a newer safety copy',async()=>{
  const f=fixture();const first=f.store.save(document('<p>First</p>'));
  f.tick(200);f.store.emergency(document('<p>Newest</p>'));
  await first;assert.equal((await f.make().load()).items[0].content,'<p>Newest</p>');
  await Promise.all([f.store.save(document('<p>A</p>')),f.store.save(document('<p>B</p>'))]);
  assert.equal((await f.store.get('sermon-1')).content,'<p>B</p>');
});
test('named and timed checkpoints restore without losing the replaced manuscript',async()=>{
  const f=fixture();await f.store.save(document());const original=(await f.store.versions('sermon-1'))[0];
  f.tick(120001);await f.store.save(document('<p>Second draft</p>'));
  await f.store.save(document('<p>Final draft</p>'),{label:'Final manuscript'});
  await f.store.restore('sermon-1',original);
  assert.equal((await f.store.get('sermon-1')).content,document().content);
  const versions=await f.store.versions('sermon-1');
  assert.ok(versions.some(item=>item.label==='Before restoring a version' && item.content==='<p>Final draft</p>'));
  assert.ok(versions.some(item=>item.label==='Automatic checkpoint'));
});
test('offline edits queue and sync their manuscript and history on reconnection',async()=>{
  const f=fixture(true);f.offline();await f.store.save(document());
  assert.equal((await f.store.get('sermon-1')).pending,true);assert.equal(f.remote.size,0);
  f.online();await f.store.syncPending();assert.equal((await f.store.get('sermon-1')).pending,false);
  assert.equal(f.remote.get('sermon-1').content,document().content);
  assert.equal((await f.store.versions('sermon-1')).length,1);
  // A second device downloads the manuscript and version history.
  const other=fixture(true);other.cloud.list=async()=>[f.remote.get('sermon-1')];other.cloud.readVersions=f.cloud.readVersions;
  await other.store.load();assert.equal((await other.store.get('sermon-1')).content,document().content);
  assert.equal((await other.store.versions('sermon-1')).length,1);
});
test('cloud conflicts preserve both copies and never overwrite the remote edit',async()=>{
  const f=fixture(true);await f.store.save(document());await f.store.syncPending();
  f.offline();f.tick(100);await f.store.save(document('<p>Device edit</p>'));
  f.remote.set('sermon-1',{...f.remote.get('sermon-1'),content:'<p>Other device</p>',revision:'other-revision',updatedAt:2000});
  f.online();await f.store.syncPending();
  assert.equal((await f.store.get('sermon-1')).conflict.content,'<p>Other device</p>');
  assert.equal(f.remote.get('sermon-1').content,'<p>Other device</p>');
  const deviceCopy=await f.store.resolveConflict('sermon-1','both');await f.store.syncPending();
  assert.notEqual(deviceCopy.id,'sermon-1');assert.equal(deviceCopy.content,'<p>Device edit</p>');
  assert.equal((await f.store.get('sermon-1')).content,'<p>Other device</p>');
  assert.ok((await f.store.versions('sermon-1')).some(item=>item.content==='<p>Device edit</p>'));
});
test('editing during a cloud request leaves the later draft pending for the next sync',async()=>{
  const f=fixture(true);let release;const gate=new Promise(resolve=>release=resolve),write=f.cloud.write;
  f.cloud.write=async(...args)=>{await gate;return write(...args);};
  f.offline();await f.store.save(document());f.online();const syncing=f.store.syncPending();
  // Yield until the first cloud write has started.
  await new Promise(resolve=>setImmediate(resolve));
  f.tick(100);await f.store.save(document('<p>Typed during sync</p>'),{sync:false});
  release();await syncing;
  const current=await f.store.get('sermon-1');assert.equal(current.content,'<p>Typed during sync</p>');assert.equal(current.pending,true);
  await f.store.syncPending();assert.equal(f.remote.get('sermon-1').content,'<p>Typed during sync</p>');
  assert.equal((await f.store.get('sermon-1')).pending,false);
});
test('failed database requests keep local drafts queued and retry safely',async()=>{
  const f=fixture(true);const write=f.cloud.write;f.cloud.write=async()=>{throw new Error('Unavailable');};
  await f.store.save(document());await f.store.syncPending();
  assert.equal((await f.store.get('sermon-1')).pending,true);assert.equal((await f.store.get('sermon-1')).syncError,'Unavailable');
  f.cloud.write=write;await f.store.syncPending();assert.equal((await f.store.get('sermon-1')).pending,false);
});
test('existing saved sermons migrate once without overwriting newer drafts',async()=>{
  const f=fixture();f.localStorage.setItem('ss_saved_sermons_v1',JSON.stringify([document()]));
  await f.store.load();await f.store.save(document('<p>New draft</p>'));await f.store.load();
  assert.equal((await f.store.get('sermon-1')).content,'<p>New draft</p>');
});

test('a version upload failure does not create a false conflict on the next edit',async()=>{
  const f=fixture(true),writeVersions=f.cloud.writeVersions;
  f.cloud.writeVersions=async()=>{throw new Error('History upload unavailable');};
  await f.store.save(document());await f.store.syncPending();
  f.offline();await f.store.save(document('<p>Next edit</p>'));f.online();
  f.cloud.writeVersions=writeVersions;await f.store.syncPending();
  assert.equal((await f.store.get('sermon-1')).conflict,null);
  assert.equal(f.remote.get('sermon-1').content,'<p>Next edit</p>');
});

test('scratchpad-only edits sync and preparation data restores with versions',async()=>{
  const f=fixture(true);const preparation={scratchpad:'Unused illustration',comments:[{id:'comment',text:'Verify quote'}],sections:{'block-a':{heading:true}}};
  await f.store.save({...document(),preparation},{label:'Notes version'});await f.store.syncPending();
  const version=(await f.store.versions('sermon-1'))[0],revision=(await f.store.get('sermon-1')).revision;
  await f.store.save({...document(),preparation:{...preparation,scratchpad:'Changed thought'}});await f.store.syncPending();
  assert.notEqual((await f.store.get('sermon-1')).revision,revision);assert.equal(f.remote.get('sermon-1').preparation.scratchpad,'Changed thought');
  await f.store.restore('sermon-1',version);assert.deepEqual((await f.store.get('sermon-1')).preparation,preparation);
});
test('Delivery reflections and theme tags persist across recovery, syncing and version restoration',async()=>{
 const f=fixture(true),preparation={themes:['Grace'],reflections:[{id:'delivery1',actualSeconds:210,source:{versionId:'v1',estimatedSeconds:130},changes:'More response time'}]};
 await f.store.save({...document(),preparation},{label:'Delivery reflection'});const checkpoint=(await f.store.versions('sermon-1'))[0];
 assert.deepEqual((await f.make().get('sermon-1')).preparation,preparation);await f.store.syncPending();assert.deepEqual(f.remote.get('sermon-1').preparation,preparation);
 await f.store.save({...document(),preparation:{themes:['New'],reflections:[]}});await f.store.restore('sermon-1',checkpoint);assert.deepEqual((await f.store.get('sermon-1')).preparation,preparation);
});
