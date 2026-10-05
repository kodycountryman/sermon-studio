import React,{useState} from 'react';
import {AUDIENCE_NAMES,normalizeProfile} from './assistant-profile.js';
export function AssistantProfileSettings({profile,t,onSave,onClose}){
  const [draft,setDraft]=useState(()=>normalizeProfile(profile)),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
  const field={width:'100%',boxSizing:'border-box',background:t.inputBg,color:t.text,border:`1px solid ${t.surfaceBorder}`,borderRadius:7,padding:9,fontSize:12,fontFamily:'inherit',lineHeight:1.5};
  return <form aria-label="Assistant settings" onSubmit={async e=>{e.preventDefault();setBusy(true);setStatus('');try{await onSave(draft);onClose();}catch(e){setStatus(e.message);}finally{setBusy(false);}}} style={{display:'flex',flexDirection:'column',flex:1,minHeight:0}}>
    <div style={{flex:1,minHeight:0,overflow:'auto',padding:12}}><p style={{fontSize:12,color:t.textMuted,marginBottom:10}}>Your settings apply to Chat and Deep Study. Audience presets adjust presentation while keeping your theology.</p>
      {[['theology','My theology'],['voice','Voice and tone'],['rules','Writing rules'],['formatting','Presentation preferences']].map(([key,label])=><label key={key} style={{display:'block',fontSize:12,marginBottom:10}}>{label}<textarea aria-label={label} value={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.value})} rows={key==='theology'||key==='rules'?5:3} style={field} /></label>)}
      <details><summary>Audience presets</summary>{Object.entries(AUDIENCE_NAMES).map(([key,label])=><label key={key} style={{display:'block',fontSize:12,marginTop:10}}>{label}<textarea aria-label={`${label} audience guidance`} rows={3} value={draft.audiences[key]} onChange={e=>setDraft({...draft,audiences:{...draft.audiences,[key]:e.target.value}})} style={field} /></label>)}</details>
    </div>
    {status && <p role="alert" style={{padding:10}}>{status}</p>}<div style={{display:'flex',gap:8,padding:10,borderTop:`1px solid ${t.surfaceBorder}`}}><button type="submit" disabled={busy} style={{background:t.accentGrad,color:'#fff',padding:'8px 12px',border:0,borderRadius:7}}>{busy?'Saving…':'Save assistant settings'}</button><button type="button" disabled={busy} onClick={onClose}>Cancel settings</button></div>
  </form>;
}
