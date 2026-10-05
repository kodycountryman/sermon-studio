import React,{useState,useEffect,useRef} from 'react';

export function SermonHistory({recordId,t,onClose,onRestore,onCheckpoint}) {
  const panel=useRef(null);
  const [items,setItems]=useState([]),[selected,setSelected]=useState(null),[name,setName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const refresh=async()=>{try{setItems(await window.savedSermons.versions(recordId));}catch(e){setError(e.message);}};
  useEffect(()=>{void refresh();},[recordId]);
  useEffect(()=>{const key=e=>{if(e.key==='Tab'){const controls=[...panel.current.querySelectorAll('button:not(:disabled),input')];const first=controls[0],last=controls.at(-1);if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}e.stopImmediatePropagation();}if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();onClose();}};document.addEventListener('keydown',key,true);return()=>document.removeEventListener('keydown',key,true);},[]);
  const action=async work=>{setBusy(true);setError('');try{await work();await refresh();}catch(e){setError(e.message);}finally{setBusy(false);}};
  const button={padding:'8px 12px',borderRadius:7,border:`1px solid ${t.surfaceBorder}`,background:t.surface,color:t.text,cursor:'pointer'};
  return <aside ref={panel} role="dialog" aria-modal="true" aria-label="Version history" style={{position:'fixed',inset:16,zIndex:10010,background:t.panelBg,color:t.text,border:`1px solid ${t.surfaceBorder}`,borderRadius:12,boxShadow:'0 10px 60px #0008',padding:16,display:'flex',flexDirection:'column',gap:12}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><strong>Version history</strong><button autoFocus style={button} onClick={onClose}>Close history</button></div>
    <p style={{color:t.textMuted,fontSize:12}}>Automatic checkpoints are kept every two minutes when you edit. Restoring keeps a copy of your current manuscript.</p>
    <form onSubmit={e=>{e.preventDefault();if(name.trim())void action(async()=>{await onCheckpoint(name.trim());setName('');});}} style={{display:'flex',gap:8}}>
      <input aria-label="Version name" value={name} onChange={e=>setName(e.target.value)} placeholder="Name this version…" style={{flex:1,minWidth:0,padding:8}} />
      <button style={button} disabled={busy || !name.trim()}>Save version</button>
    </form>
    {error && <p role="alert">{error}</p>}
    <div style={{display:'flex',flexWrap:'wrap',gap:12,flex:1,minHeight:0,overflow:'auto'}}>
      <div style={{flex:'1 1 220px',overflow:'auto'}}>{items.map(item=><button key={item.id} style={{...button,width:'100%',textAlign:'left',marginBottom:6,borderColor:selected?.id===item.id?t.accent:t.surfaceBorder}} onClick={()=>setSelected(item)}><strong>{item.label}</strong><br/><small>{new Date(item.createdAt).toLocaleString()}</small></button>)}{!items.length && <p>No checkpoints yet.</p>}</div>
      <div style={{flex:'3 1 320px',display:'flex',flexDirection:'column',gap:10,minHeight:0}}>
        {selected?<><div style={{display:'flex',justifyContent:'space-between',gap:8}}><strong>{selected.title}</strong><button style={{...button,background:t.accentGrad,color:'#fff'}} disabled={busy} onClick={()=>void action(async()=>{await onRestore(selected);onClose();})}>Restore this version</button></div><div aria-label="Version preview" style={{overflow:'auto',background:'#fff',color:'#111',padding:20,flex:1,fontFamily:'Arial',fontSize:`${selected.fontSize}pt`,lineHeight:1.6}} dangerouslySetInnerHTML={{__html:window.savedSermons.cleanHtml(selected.content)}} /></>:<p>Select a checkpoint to preview it.</p>}
      </div>
    </div>
  </aside>;
}

export function SermonConflict({record,t,onResolve}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const resolve=async choice=>{setBusy(true);try{await onResolve(choice);}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <aside role="dialog" aria-modal="true" aria-label="Review sync conflict" style={{position:'fixed',inset:20,zIndex:10011,background:t.panelBg,color:t.text,padding:20,borderRadius:12,display:'flex',flexDirection:'column',gap:12,overflow:'auto'}}>
    <strong>This sermon changed on another device</strong><p>Both copies are safe. Compare them, then choose which to continue editing. Both are also preserved in version history.</p>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',flex:1,minHeight:0}}>{[['This device',record],['Database',record.conflict]].map(([label,item])=><div key={label} style={{flex:'1 1 250px',display:'flex',flexDirection:'column',gap:8}}><strong>{label}: {item.title}</strong><small>{new Date(item.updatedAt).toLocaleString()}</small><div style={{overflow:'auto',flex:1,background:'#fff',color:'#111',padding:16}} dangerouslySetInnerHTML={{__html:window.savedSermons.cleanHtml(item.content)}} /></div>)}</div>
    {error && <p role="alert">{error}</p>}<div style={{display:'flex',gap:8}}><button autoFocus disabled={busy} onClick={()=>resolve('both')}>Keep both copies</button><button disabled={busy} onClick={()=>resolve('cloud')}>Continue with database copy</button></div>
  </aside>;
}
