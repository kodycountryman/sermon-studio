import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';

const source=await fs.readFile(new URL('../public/sw.js',import.meta.url),'utf8');
function worker(){
  const origin='https://sermon.example',events={},stores=new Map();let offline=false;
  const assets=new Map([['/index.html','<script src="/assets/app-123.js"></script><link href="/assets/app-123.css" rel="stylesheet">'],['/assets/app-123.js','app bundle'],['/assets/app-123.css','app styles'],['/manifest.json','{}'],['/icon-192.png','icon'],['/icon-512.png','icon']]);
  const fetch=async input=>{if(offline)throw new Error('Offline');const path=new URL(typeof input==='string'?input:input.url,origin).pathname;return new Response(assets.get(path) || '',{status:assets.has(path)?200:404});};
  const key=input=>new URL(typeof input==='string'?input:input.url,origin).href;
  const caches={keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name),open:async name=>{
    if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);
    return {put:async(input,response)=>data.set(key(input),response.clone()),match:async input=>data.get(key(input))?.clone(),add:async input=>{const response=await fetch(input);if(!response.ok)throw new Error('Missing asset');data.set(key(input),response);},addAll:async inputs=>{for(const input of inputs){const response=await fetch(input);if(!response.ok)throw new Error('Missing asset');data.set(key(input),response);}}};
  }};
  vm.runInNewContext(source,{self:{location:{origin},clients:{claim:async()=>{}},addEventListener:(name,handler)=>events[name]=handler},fetch,caches,URL,Response});
  const wait=async(name,data={})=>{let promise;events[name]({...data,waitUntil:value=>promise=value});await promise;};
  const request=async(path,method='GET')=>{let response;events.fetch({request:{url:origin+path,method,mode:path==='/'?'navigate':'cors'},respondWith:value=>response=value});return response?await response:null;};
  return {wait,request,stores,offline:()=>offline=true};
}

test('production shell and hashed bundles remain readable without a network',async()=>{
  const w=worker();await w.wait('install');w.offline();
  assert.match(await (await w.request('/')).text(),/app-123.js/);
  assert.equal(await (await w.request('/assets/app-123.js')).text(),'app bundle');
  assert.equal(await (await w.request('/assets/app-123.css')).text(),'app styles');
});
test('API and database requests are never cached; only app caches are retired',async()=>{
  const w=worker();w.stores.set('unrelated-app',new Map());w.stores.set('sermon-studio-v1',new Map());
  await w.wait('install');await w.wait('activate');
  assert.ok(w.stores.has('unrelated-app'));assert.ok(!w.stores.has('sermon-studio-v1'));
  assert.equal(await w.request('/api/ai'),null);assert.equal(await w.request('/api/scripture'),null);
  assert.equal(await w.request('/assets/app-123.js','POST'),null);
});
