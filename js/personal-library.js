import {defaultAssistantProfile,normalizeProfile,normalizeStory} from './assistant-profile.js';
export function createPersonalLibrary(storage,legacyStories=async()=>[]){
  const unpack=record=>{try{return {...JSON.parse(record.content),storage:record};}catch{return null;}};
  async function put(id,kind,value,title){
    return storage.save({id,title,content:JSON.stringify({kind,value}),fontSize:'12',updatedAt:Date.now()},{label:kind==='profile'?'Assistant settings':'Story update'});
  }
  return {
    async load({localOnly=false}={}){
      const {items}=await storage.load({localOnly});const records=items.map(unpack).filter(Boolean);
      const known=new Set(records.filter(item=>item.kind==='story').map(item=>item.value.id));
      for(const item of (localOnly?[]:await legacyStories())){
        const story=normalizeStory(item);if(!story.id || !story.text || known.has(story.id))continue;
        await put(`personal-${story.id}`,'story',story,story.title);known.add(story.id);records.push({kind:'story',value:story});
      }
      const profile=records.find(item=>item.kind==='profile');
      return {profile:normalizeProfile(profile?.value || defaultAssistantProfile()),stories:records.filter(item=>item.kind==='story').map(item=>({...normalizeStory(item.value),storageId:item.storage?.id || `personal-${item.value.id}`,syncConflict:!!item.storage?.conflict})),profileConflict:!!profile?.storage?.conflict};
    },
    saveProfile:profile=>put('assistant-profile-default','profile',normalizeProfile(profile),'Assistant profile'),
    saveStory:story=>put(story.storageId || `personal-${story.id}`,'story',normalizeStory(story),story.title),
    async recordUse(storyId,use){
      const id=storyId.startsWith('personal-') || storyId.startsWith('saved-')?storyId:`personal-${storyId}`,record=await storage.get(id),item=record?unpack(record):null;
      if(!item)throw new Error('Save this story in the library first.');
      const story=normalizeStory(item.value);return put(id,'story',{...story,uses:[...story.uses.filter(item=>item.id!==use.id),use]},story.title);
    },
    async conflicts(){return (await storage.load({localOnly:true})).items.filter(item=>item.conflict);},
    resolveConflict:storage.resolveConflict,subscribe:storage.subscribe,syncPending:storage.syncPending,
  };
}
