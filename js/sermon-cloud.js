export function createManuscriptCloud(sb,cleanHtml=value=>value,{mode='saved-sermon',label='Saved Sermon',versionMode='saved-sermon-version'}={}){
const databaseDeadline = promise => {
  let timer;
  return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("Database did not respond.")),10000);})]).finally(()=>clearTimeout(timer));
};
const sermonFromRow=row=>{
  let metadata={};try{metadata=JSON.parse(row.input || "{}");}catch{}
  return {id:row.id,title:row.title || "Untitled sermon",content:cleanHtml(row.output || ""),fontSize:metadata.fontSize || "12",updatedAt:Number(row.timestamp),revision:metadata.revision || `legacy:${row.timestamp}`,view:metadata.view || null,preparation:metadata.preparation || null,_cloudInput:row.input};
};
const checkDatabase=async request=>{const result=await databaseDeadline(request);if(result.error)throw result.error;return result.data;};
return {
  read:async id=>{const row=await checkDatabase(sb.from("sermon_history").select("*").eq("id",id).eq("mode_id",mode).maybeSingle());return row?sermonFromRow(row):null;},
  list:async()=> (await checkDatabase(sb.from("sermon_history").select("*").eq("mode_id",mode)) || []).map(sermonFromRow),
  write:async(record,previous)=>{
    const row={id:record.id,title:record.title,output:record.content,input:JSON.stringify({fontSize:record.fontSize,revision:record.revision,view:record.view,preparation:record.preparation}),mode_id:mode,mode_label:label,timestamp:record.updatedAt,length:null};
    if(previous){
      // Compare-and-swap prevents an edit on another device from being overwritten.
      const changed=await checkDatabase(sb.from("sermon_history").update(row).eq("id",record.id).eq("timestamp",previous.updatedAt).eq("input",previous._cloudInput).select("id"));
      if(!changed?.length)throw new Error("Cloud copy changed. Sync again to review both copies.");
    }else await checkDatabase(sb.from("sermon_history").insert(row));
  },
  writeVersions:async versions=>{
    if(!versions.length)return;
    await checkDatabase(sb.from("sermon_history").upsert(versions.map(item=>({id:item.id,title:item.title,output:item.content,input:JSON.stringify({sermonId:item.sermonId,fontSize:item.fontSize,label:item.label,preparation:item.preparation}),mode_id:versionMode,mode_label:"Sermon Version",timestamp:item.createdAt,length:null}))));
  },
  readVersions:async id=>(await checkDatabase(sb.from("sermon_history").select("*").eq("mode_id",versionMode)) || []).flatMap(row=>{
    let metadata={};try{metadata=JSON.parse(row.input || "{}");}catch{}
    return metadata.sermonId===id?[{id:row.id,sermonId:id,title:row.title,content:cleanHtml(row.output),fontSize:metadata.fontSize || "12",label:metadata.label || "Saved version",preparation:metadata.preparation || null,createdAt:Number(row.timestamp)}]:[];
  }),
};
}
