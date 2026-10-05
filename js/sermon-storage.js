// Durable manuscript storage. Local writes precede every cloud request.
export function createSermonStorage({indexedDB,localStorage,cloud=null,cleanHtml=value=>value,online=()=>true,now=()=>Date.now(),uuid=()=>crypto.randomUUID(),databaseName='sermon-studio-drafts',emergencyKey='ss_sermon_recovery_v1',activeKey='ss_active_sermon_v1',legacyKey='ss_saved_sermons_v1'}) {
  const DB=databaseName,EMERGENCY=emergencyKey,ACTIVE=activeKey;
  let database,serial=Promise.resolve(),syncing=null;
  const listeners=new Set();
  const emit=()=>listeners.forEach(listener=>listener());
  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)) || fallback;}catch{return fallback;}};
  async function open(){
    if(!database)database=new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB,1);
      request.onupgradeneeded=()=>{for(const store of ['sermons','versions'])request.result.createObjectStore(store,{keyPath:'id'});};
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    });
    return database;
  }
  async function transaction(stores,mode,work){
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(stores,mode);let result;
      tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error || new Error('Device storage write failed.'));
      work(tx,value=>{result=value;});
    });
  }
  const all=store=>transaction([store],'readonly',(tx,done)=>{const request=tx.objectStore(store).getAll();request.onsuccess=()=>done(request.result);});
  const get=id=>transaction(['sermons'],'readonly',(tx,done)=>{const request=tx.objectStore('sermons').get(id);request.onsuccess=()=>done(request.result);});
  const put=record=>transaction(['sermons'],'readwrite',tx=>tx.objectStore('sermons').put(record));
  const enqueue=work=>{const next=serial.then(work,work);serial=next.catch(()=>{});return next;};
  const version=(record,label)=>({id:`version-${uuid()}`,sermonId:record.id,title:record.title,content:record.content,fontSize:record.fontSize,preparation:record.preparation,createdAt:now(),label});
  async function checkpoint(record,label){
    const item=version(record,label);
    await transaction(['versions'],'readwrite',tx=>tx.objectStore('versions').put(item));return item;
  }
  function emergency(record){
    // A synchronous safety copy protects keystrokes while the IndexedDB write is queued.
    const items=readJson(EMERGENCY,{});items[record.id]={...record,content:cleanHtml(record.content),updatedAt:now()};
    localStorage.setItem(EMERGENCY,JSON.stringify(items));
  }
  async function recoverEmergency(){
    for(const record of Object.values(readJson(EMERGENCY,{}))){
      const existing=await get(record.id);
      if(!existing || record.updatedAt>existing.updatedAt)await save(record,{sync:false});
    }
  }
  async function save(record,{label=null,sync=true}={}){
    const result=await enqueue(async()=>{
      const old=await get(record.id);
      const content=cleanHtml(record.content);
      const changed=!old || old.content!==content || old.title!==record.title || old.fontSize!==record.fontSize || JSON.stringify(old.preparation)!==JSON.stringify(record.preparation);
      const next={...old,...record,content,updatedAt:Math.max(record.updatedAt || now(),(old?.updatedAt || 0)+(changed?1:0)),revision:changed?uuid():old.revision,pending:cloud?(changed || old?.pending || false):false,baseRevision:old?.baseRevision ?? record.baseRevision ?? null,conflict:old?.conflict || null};
      if(!old || (changed && now()-(old.lastCheckpointAt || 0)>=120000) || label){
        await checkpoint(next,label || (!old?'Initial manuscript':'Automatic checkpoint'));
        next.lastCheckpointAt=now();
      }
      await put(next);
      const items=readJson(EMERGENCY,{});
      // Do not clear a newer keystroke that arrived during this asynchronous write.
      if(items[next.id] && items[next.id].updatedAt<=next.updatedAt && items[next.id].content===next.content && items[next.id].title===next.title && items[next.id].fontSize===next.fontSize && JSON.stringify(items[next.id].preparation)===JSON.stringify(next.preparation)){delete items[next.id];localStorage.setItem(EMERGENCY,JSON.stringify(items));}
      emit();return next;
    });
    if(sync && cloud)void syncPending().catch(()=>{});
    return result;
  }
  async function migrate(){
    const legacy=legacyKey?readJson(legacyKey,[]):[];
    for(const record of legacy)if(!await get(record.id))await save({...record,baseRevision:record.pending?null:`legacy:${record.updatedAt}`},{sync:false});
    await recoverEmergency();
  }
  async function syncPending(){
    if(!cloud || !online())return;
    if(syncing)return syncing;
    syncing=(async()=>{
      for(const snapshot of await all('sermons')){
        if(!snapshot.pending || snapshot.conflict)continue;
        try{
          const remote=await cloud.read(snapshot.id);
          if(remote && remote.revision!==snapshot.baseRevision && remote.revision!==snapshot.revision){
            await enqueue(async()=>{const current=await get(snapshot.id);await put({...current,conflict:remote,syncError:null});emit();});continue;
          }
          if(!remote || remote.revision!==snapshot.revision)await cloud.write(snapshot,remote);
          // Advance the known cloud revision even if uploading history fails later.
          await enqueue(async()=>{const current=await get(snapshot.id);await put({...current,baseRevision:snapshot.revision});});
          const versions=(await all('versions')).filter(item=>item.sermonId===snapshot.id);
          await cloud.writeVersions(versions);
          await enqueue(async()=>{
            const current=await get(snapshot.id);
            await put({...current,baseRevision:snapshot.revision,pending:current.revision!==snapshot.revision,syncError:null});emit();
          });
        }catch(error){
          await enqueue(async()=>{const current=await get(snapshot.id);await put({...current,syncError:error.message || 'Database unavailable'});emit();});
        }
      }
    })().finally(()=>{syncing=null;});
    return syncing;
  }
  async function load({localOnly=false}={}){
    await migrate();
    if(cloud && online() && !localOnly){
      try{
        for(const remote of await cloud.list())await enqueue(async()=>{
          const local=await get(remote.id);
          if(!local)await put({...remote,baseRevision:remote.revision,pending:false});
          else if(local.pending && remote.revision!==local.baseRevision && remote.revision!==local.revision)await put({...local,conflict:remote});
          else if(!local.pending && local.revision!==remote.revision){await checkpoint(local,'Before cloud update');await put({...remote,baseRevision:remote.revision,pending:false});}
        });
      }catch{ /* Local copies remain available; each pending record exposes its sync state. */ }
      void syncPending().catch(()=>{});
    }
    return {items:(await all('sermons')).sort((a,b)=>b.updatedAt-a.updatedAt)};
  }
  async function versions(id){
    const local=(await all('versions')).filter(item=>item.sermonId===id);
    if(cloud && online()){
      try{
        const remote=await cloud.readVersions(id);
        await transaction(['versions'],'readwrite',tx=>{for(const item of remote)tx.objectStore('versions').put(item);});
        return [...new Map([...remote,...local].map(item=>[item.id,item])).values()].sort((a,b)=>b.createdAt-a.createdAt);
      }catch{ /* Keep local history available offline. */ }
    }
    return local.sort((a,b)=>b.createdAt-a.createdAt);
  }
  async function restore(id,item){
    const current=await get(id);await checkpoint(current,'Before restoring a version');
    return save({...current,title:item.title,content:item.content,fontSize:item.fontSize,preparation:item.preparation,updatedAt:now()},{label:`Restored: ${item.label}`});
  }
  async function resolveConflict(id,choice){
    const current=await get(id);if(!current?.conflict)return current;
    if(cloud && online()){const latest=await cloud.read(id);if(latest)current.conflict=latest;}
    await checkpoint(current,'Device copy before conflict resolution');
    await checkpoint({...current.conflict,id},'Cloud copy before conflict resolution');
    if(choice==='cloud'){
      const remote=current.conflict;
      const next={...remote,baseRevision:remote.revision,pending:false,conflict:null};await put(next);emit();return next;
    }
    // Keep both: retain the cloud document under its ID and save the device copy separately.
    const remote=current.conflict;
    await put({...remote,baseRevision:remote.revision,pending:false,conflict:null});
    const next=await save({...current,id:`saved-${uuid()}`,title:`${current.title} (device copy)`,baseRevision:null,conflict:null,updatedAt:now()},{label:'Device copy from sync conflict'});
    emit();return next;
  }
  return {save,load,get,versions,checkpoint,restore,resolveConflict,syncPending,emergency,
    subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},
    setActive:id=>localStorage.setItem(ACTIVE,id),clearActive:()=>localStorage.removeItem(ACTIVE),
    recover:async()=>{await migrate();const id=localStorage.getItem(ACTIVE);return id?get(id):null;},
  };
}
