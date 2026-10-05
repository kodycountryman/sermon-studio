import React,{useState} from 'react';
import {themeTags} from './sermon-library.js';
import {timeLabel} from './preaching-time.js';
export function SermonReflections({t,preparation,onChange,onAdd,disabled}){
 const blank=()=>({date:new Date().toLocaleDateString('en-CA'),venue:'',minutes:'',worked:'',changes:'',followUp:''});
 const [draft,setDraft]=useState(blank),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const field={width:'100%',boxSizing:'border-box',background:t.inputBg,color:t.text,border:`1px solid ${t.surfaceBorder}`,borderRadius:6,padding:10,font:'inherit',fontSize:13};
 const button={...field,width:'auto',cursor:'pointer',minHeight:44};
 return <div>
  <label style={{fontSize:12}}>Sermon themes<input aria-label="Sermon themes" placeholder="Grace, humility, discipleship" key={(preparation.themes || []).join(',')} defaultValue={(preparation.themes || []).join(', ')} disabled={disabled} onBlur={e=>onChange({...preparation,themes:themeTags(e.target.value)})} style={{...field,margin:'6px 0 12px'}}/></label>
  <p style={{fontSize:12,color:t.textMuted}}>Log each delivery. Reflections stay separate from your manuscript and its word count. Each entry records the version and estimate used.</p>
  <form onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{await onAdd(draft);setDraft(blank());}catch(err){setError(err.message);}finally{setBusy(false);}}} style={{display:'flex',flexDirection:'column',gap:10}}>
   {[['date','Delivery date','date'],['venue','Venue / gathering','text'],['minutes','Actual duration (minutes)','number']].map(([key,label,type])=><label key={key} style={{fontSize:12}}>{label}<input aria-label={label} type={type} required={key==='date'} min={type==='number'?.1:undefined} max={type==='number'?600:undefined} step={type==='number'?.1:undefined} style={field} value={draft[key]} disabled={disabled || busy} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}
   {[['worked','What connected?'],['changes','Delivery changes for next time'],['followUp','Follow-up / responses']].map(([key,label])=><label key={key} style={{fontSize:12}}>{label}<textarea aria-label={label} style={field} rows={3} value={draft[key]} disabled={disabled || busy} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}
   {error && <p role="alert">{error}</p>}<button style={button} disabled={busy || disabled}>{busy?'Saving reflection…':'Save delivery reflection'}</button>
  </form>
  {[...(preparation.reflections || [])].reverse().map(item=><details key={item.id} style={{marginTop:12,padding:10,border:`1px solid ${t.surfaceBorder}`,borderRadius:7}}><summary>{item.date}{item.venue?` · ${item.venue}`:''}{item.actualSeconds?` · ${timeLabel(item.actualSeconds)}`:''}</summary><p style={{fontSize:12}}>Estimated {timeLabel(item.source.estimatedSeconds)} · Actual {item.actualSeconds?timeLabel(item.actualSeconds):'not recorded'}{item.actualSeconds?` · ${Math.round((item.actualSeconds-item.source.estimatedSeconds)/60*10)/10} min difference`:''}</p><p style={{fontSize:11,color:t.textMuted}}>Audience: {item.source.audience} · Source version {item.source.versionId}</p>{[['worked','What connected'],['changes','Next time'],['followUp','Follow-up']].map(([key,label])=>item[key] && <p key={key} style={{fontSize:12,whiteSpace:'pre-wrap'}}><strong>{label}</strong><br/>{item[key]}</p>)}</details>)}
 </div>;
}
