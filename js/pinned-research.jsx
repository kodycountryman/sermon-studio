import React,{useState} from 'react';
export function PinnedResearch({notes,t,onJump,onReattach,onRemove,disabled}){
  const [error,setError]=useState('');
  const button={background:t.surface,color:t.text,border:`1px solid ${t.surfaceBorder}`,borderRadius:6,padding:'6px 8px',fontSize:11,cursor:'pointer'};
  return <div><p style={{fontSize:11,color:t.textMuted}}>Only studies you pin are saved with this sermon. Chat and Deep Study conversations remain temporary.</p>
    {error && <p role="alert">{error}</p>}
    {!notes.length && <p style={{fontSize:12,marginTop:12}}>Open Deep Study in the Assistant, then pin a study or one of its sections.</p>}
    {notes.map(note=><article key={note.id} style={{border:`1px solid ${t.surfaceBorder}`,borderRadius:8,padding:10,marginTop:10}}>
      <strong style={{fontSize:12}}>{note.reference?`${note.reference} · `:''}{note.title}</strong><p style={{fontSize:10,color:t.textMuted}}>{new Date(note.createdAt).toLocaleString()} · Study note</p>
      {note.anchor && <button style={{...button,border:0,padding:0,textAlign:'left',background:'transparent',marginTop:6}} disabled={note.detached} onClick={()=>onJump(note)}>{note.detached?'Passage removed':`Passage: ${note.anchor.quote.slice(0,120)}`}</button>}
      {!note.anchor && <p style={{fontSize:11,color:t.textMuted}}>Sermon research · no passage attached</p>}
      <details style={{marginTop:8,fontSize:12}}><summary>Read study note</summary><p style={{whiteSpace:'pre-wrap',lineHeight:1.6,marginTop:8}}>{note.text}</p></details>
      {!!note.translations?.length && <details style={{fontSize:12,marginTop:8}}><summary>Saved translations</summary>{note.translations.map(item=><div key={item.version}><strong>{item.version}</strong><p style={{whiteSpace:'pre-wrap',marginTop:6}}>{item.text || item.error}</p></div>)}</details>}
      {!!note.sources?.length && <details style={{fontSize:11,marginTop:8}}><summary>Translation and cross-reference links</summary>{note.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" style={{display:'block',color:t.accent,marginTop:6}}>{source.label}</a>)}</details>}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:9}}>{(!note.anchor || note.detached) && <button style={button} disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={()=>{try{onReattach(note);setError('');}catch(e){setError(e.message);}}}>Attach to selection</button>}<button style={button} disabled={disabled} onClick={async()=>{try{await onRemove(note);setError('');}catch(e){setError(e.message);}}}>Unpin</button></div>
    </article>)}
  </div>;
}
