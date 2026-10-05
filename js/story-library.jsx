import React,{useState,useEffect} from 'react';
import {normalizeStory} from './assistant-profile.js';
const blank=()=>({id:crypto.randomUUID(),title:'',text:'',themes:[],seconds:0,privacy:'',anonymized:false,uses:[]});
export function StoryLibrary({t,onInsert,disabled}){
  const [stories,setStories]=useState([]),[search,setSearch]=useState(''),[draft,setDraft]=useState(null),[status,setStatus]=useState('Loading stories…'),[busy,setBusy]=useState(false),[showArchived,setShowArchived]=useState(false);
  useEffect(()=>{
    let live=true;const load=localOnly=>window.personalLibrary.load({localOnly}).then(data=>{if(live){setStories(data.stories);setStatus(data.stories.some(item=>item.syncConflict)?'Some stories changed on another device. Review library copies below.':'');}}).catch(e=>live && setStatus(e.message));
    void load(false);const unsubscribe=window.personalLibrary.subscribe(()=>void load(true));return()=>{live=false;unsubscribe();};
  },[]);
  const button={background:t.surface,color:t.text,border:`1px solid ${t.surfaceBorder}`,borderRadius:7,padding:'7px 9px',fontSize:12,cursor:'pointer'};
  const field={width:'100%',boxSizing:'border-box',background:t.inputBg,color:t.text,border:`1px solid ${t.surfaceBorder}`,borderRadius:6,padding:8,fontFamily:'inherit',fontSize:12};
  const work=async action=>{setBusy(true);try{await action();setStatus('Saved on this device');}catch(e){setStatus(e.message);}finally{setBusy(false);}};
  const matches=stories.filter(story=>(showArchived || !story.archived) && `${story.title} ${story.text} ${story.themes.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  return <div>
    <p style={{fontSize:11,color:t.textMuted,marginBottom:8}}>Click where you want a story in the document first. Insert creates an editable blue copy; library edits leave inserted copies intact.</p>
    <div style={{display:'flex',gap:6,marginBottom:9}}><input aria-label="Search personal stories" placeholder="Search themes or stories…" value={search} onChange={e=>setSearch(e.target.value)} style={{...field,flex:1,minWidth:0}} /><button style={button} disabled={disabled || busy} onClick={()=>setDraft(blank())}>New story</button></div>
    <label style={{fontSize:11}}><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)} /> Show archived stories</label>
    {status && <p role="status" style={{fontSize:11,margin:'8px 0'}}>{status}</p>}
    {draft && <form aria-label="Edit personal story" onSubmit={e=>{e.preventDefault();void work(async()=>{await window.personalLibrary.saveStory(draft);setDraft(null);});}} style={{display:'flex',flexDirection:'column',gap:8,margin:'12px 0',padding:9,border:`1px solid ${t.surfaceBorder}`,borderRadius:8}}>
      <label style={{fontSize:11}}>Title<input aria-label="Personal story title" required value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} style={field} /></label>
      <label style={{fontSize:11}}>Story<textarea aria-label="Personal story text" required rows={7} value={draft.text} onChange={e=>setDraft({...draft,text:e.target.value})} style={field} /></label>
      <label style={{fontSize:11}}>Themes<input aria-label="Story themes" placeholder="grace, family, basketball" value={draft.themes.join(', ')} onChange={e=>setDraft({...draft,themes:e.target.value.split(',').map(item=>item.trim())})} style={field} /></label>
      <label style={{fontSize:11}}>Delivery time in seconds<input aria-label="Story delivery seconds" type="number" min="0" value={draft.seconds} onChange={e=>setDraft({...draft,seconds:Math.max(0,Number(e.target.value))})} style={field} /></label>
      <label style={{fontSize:11}}>Privacy and name changes<textarea aria-label="Story privacy notes" placeholder="Use a different name, ask permission…" rows={2} value={draft.privacy} onChange={e=>setDraft({...draft,privacy:e.target.value})} style={field} /></label>
      <label style={{fontSize:11}}><input type="checkbox" aria-label="Names already anonymized" checked={draft.anonymized} onChange={e=>setDraft({...draft,anonymized:e.target.checked})} /> Names already anonymized</label>
      <div style={{display:'flex',gap:8}}><button style={button} disabled={busy || disabled || !draft.title.trim() || !draft.text.trim()}>Save story</button><button style={button} type="button" onClick={()=>setDraft(null)}>Cancel story</button></div>
    </form>}
    {matches.map(story=><details key={story.storageId || story.id} style={{padding:9,marginTop:9,border:`1px solid ${t.surfaceBorder}`,borderRadius:7}}>
      <summary style={{fontWeight:600,fontSize:12,cursor:'pointer'}}>{story.title}{story.archived?' · Archived':''}</summary>
      <p style={{fontSize:11,color:t.textMuted,marginTop:7}}>{story.themes.filter(Boolean).join(' · ')}{story.seconds?` · ${Math.round(story.seconds/60*10)/10} min`:''}</p>
      <p style={{whiteSpace:'pre-wrap',fontSize:12,lineHeight:1.5,margin:'8px 0'}}>{story.text}</p>
      {story.anonymized && <p style={{fontSize:11,color:t.textMuted}}>Names anonymized</p>}
      {story.privacy && <p style={{fontSize:11,color:'#ffcc70'}}>Privacy: {story.privacy}</p>}
      {!!story.uses.length && <details style={{fontSize:11,margin:'8px 0'}}><summary>Inserted {story.uses.length} {story.uses.length===1?'time':'times'}</summary>{story.uses.map((use,index)=><p key={use.id || index}>{use.title} · {new Date(use.createdAt).toLocaleDateString()}</p>)}</details>}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:9}}><button style={{...button,background:t.accentGrad,color:'#fff'}} disabled={disabled || busy || story.archived} onMouseDown={e=>e.preventDefault()} onClick={()=>void work(()=>onInsert(story))}>Insert story</button><button style={button} disabled={busy || disabled} onClick={()=>setDraft({...normalizeStory(story),storageId:story.storageId})}>Edit story</button><button style={button} disabled={busy || disabled} onClick={()=>void work(()=>window.personalLibrary.saveStory({...story,archived:!story.archived}))}>{story.archived?'Unarchive':'Archive'}</button></div>
    </details>)}
    {!matches.length && !status && <p style={{fontSize:12}}>No matching stories.</p>}
    <LibraryConflicts t={t} />
  </div>;
}
export function LibraryConflicts({t,onResolved}){
  const [items,setItems]=useState([]),[status,setStatus]=useState('');
  useEffect(()=>{let live=true;const update=()=>window.personalLibrary.conflicts().then(items=>live && setItems(items)).catch(e=>live && setStatus(e.message));void update();const unsubscribe=window.personalLibrary.subscribe(update);return()=>{live=false;unsubscribe();};},[]);
  if(!items.length)return null;
  return <div style={{marginTop:12,fontSize:12}}>{items.map(item=><details key={item.id}><summary>Review library copies: {item.title}</summary><p>This device and the database have different copies.</p><details><summary>Device copy</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{item.content}</pre></details><details><summary>Database copy</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{item.conflict.content}</pre></details><button onClick={async()=>{try{await window.personalLibrary.resolveConflict(item.id,'both');onResolved?.();}catch(e){setStatus(e.message);}}}>Keep both copies</button><button onClick={async()=>{try{await window.personalLibrary.resolveConflict(item.id,'cloud');onResolved?.();}catch(e){setStatus(e.message);}}}>Use database copy</button></details>)}{status && <p role="alert">{status}</p>}</div>;
}
