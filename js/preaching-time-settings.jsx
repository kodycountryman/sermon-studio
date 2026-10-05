import React from 'react';
import {normalizeTiming,preachingSeconds,timeLabel} from './preaching-time.js';
export function PreachingTimeSettings({settings,words,onChange,onClose,t,disabled}){
  const timing=normalizeTiming(settings),field={width:'100%',boxSizing:'border-box',padding:7,borderRadius:6,background:t.inputBg,color:t.text,border:`1px solid ${t.surfaceBorder}`};
  return <aside aria-label="Preaching time settings" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();onClose();}}} style={{position:'absolute',right:20,bottom:60,zIndex:10004,width:'min(300px,calc(100% - 40px))',maxHeight:'calc(100% - 80px)',overflow:'auto',padding:14,boxSizing:'border-box',borderRadius:10,border:`1px solid ${t.surfaceBorder}`,background:t.panelBg,color:t.text,boxShadow:'0 8px 28px #0006'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:8}}><strong>Preaching time</strong><button aria-label="Close preaching time settings" onClick={onClose}>✕</button></div>
    <p style={{fontSize:12,margin:'10px 0'}}>Estimated {timeLabel(preachingSeconds(words,timing))} · {words.toLocaleString()} words</p>
    {[['pace','Speaking pace (words per minute)',60,240],['interactionPercent','Pauses and audience interaction (%)',0,100],['extraSeconds','Additional time (seconds)',0,3600]].map(([key,label,min,max])=><label key={key} style={{display:'block',fontSize:11,marginTop:10}}>{label}<input aria-label={label} type="number" min={min} max={max} step={key==='pace'?5:key==='interactionPercent'?1:15} disabled={disabled} value={settings[key] ?? timing[key]} onChange={e=>onChange({...settings,[key]:e.target.value})} onBlur={()=>onChange(normalizeTiming(settings))} style={field}/></label>)}
    <p style={{fontSize:11,color:t.textMuted,marginTop:12,lineHeight:1.5}}>An estimate, including all manuscript words. Outline shows section times with the same pace and interaction allowance. Additional time is added once to the whole sermon. Saved with this sermon.</p>
  </aside>;
}
