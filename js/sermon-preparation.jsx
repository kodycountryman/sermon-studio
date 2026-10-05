import {SermonReflections} from './sermon-reflections.jsx';
import React,{useState} from 'react';
import {PinnedResearch} from './pinned-research.jsx';
import {timeLabel} from './preaching-time.js';
import {StoryLibrary} from './story-library.jsx';

export function SermonPreparation({t,tab,onTab,onClose,sections,preparation,onChange,onJump,onMove,onBoundary,onAddComment,onCommentJump,onReattach,disabled,fullScreen,onResearchReattach,onResearchRemove,onInsertStory,onAddReflection}) {
  const [note,setNote]=useState(''),[filter,setFilter]=useState('open'),[error,setError]=useState(''),[moving,setMoving]=useState(false);
  const button={background:t.surface,color:t.text,border:`1px solid ${t.surfaceBorder}`,borderRadius:6,padding:'6px 9px',cursor:'pointer',fontSize:12};
  const field={background:t.inputBg,color:t.text,border:`1px solid ${t.surfaceBorder}`,borderRadius:6,padding:9,width:'100%',boxSizing:'border-box',fontFamily:'inherit',fontSize:13};
  const move=async(id,beforeId)=>{if(moving || disabled)return;setMoving(true);setError('');try{await onMove(id,beforeId);}catch(e){setError(e.message);}finally{setMoving(false);}};
  const comments=preparation.comments || [],open=comments.filter(item=>!item.resolved).length;
  const updateComment=(id,change)=>onChange({...preparation,comments:comments.map(item=>item.id===id?{...item,...change}:item)});
  return <aside className={`sermon-preparation${fullScreen?' is-full':''}`} aria-label="Sermon preparation" style={{background:t.panelBg,color:t.text,border:`1px solid ${t.surfaceBorder}`,borderRadius:10,padding:12,display:'flex',flexDirection:'column',gap:10,flexShrink:0,minHeight:0}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}><strong>Preparation</strong><button style={button} aria-label="Close preparation" onClick={onClose}>✕</button></div>
    <div role="group" aria-label="Preparation views" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:4,flexShrink:0}}>{['outline','scratchpad','comments','research','stories','reflections'].map(name=><button key={name} aria-pressed={tab===name} style={{...button,flex:1,padding:'7px 4px',background:tab===name?t.accentGrad:t.surface,color:tab===name?'#fff':t.text}} onClick={()=>onTab(name)}>{name==='outline'?'Outline':name==='scratchpad'?'Scratchpad':name==='research'?`Research${preparation.research?.length?` (${preparation.research.length})`:''}`:name==='stories'?'Stories':name==='reflections'?'Reflections':`Comments${open?` (${open})`:''}`}</button>)}</div>
    {error && <p role="alert" style={{fontSize:12,color:'#ff9c8c'}}>{error}</p>}
    <div role="region" aria-label="Preparation content" tabIndex={0} style={{flex:'1 1 0',minHeight:0,overflowY:'auto',overflowX:'hidden',overscrollBehavior:'contain',scrollbarGutter:'stable'}}>
    {tab==='reflections' && <SermonReflections t={t} preparation={preparation} onChange={onChange} onAdd={onAddReflection} disabled={disabled} />}
    {tab==='research' && <PinnedResearch notes={preparation.research || []} t={t} onJump={onCommentJump} onReattach={onResearchReattach} onRemove={onResearchRemove} disabled={disabled} />}
    {tab==='stories' && <StoryLibrary t={t} onInsert={onInsertStory} disabled={disabled} />}
    {tab==='outline' && <>
      <p style={{color:t.textMuted,fontSize:11,marginBottom:10}}>Click to jump. Sections include every paragraph until the next heading. Drag to move, or use the arrows.</p>
      <button style={{...button,width:'100%',marginBottom:10}} disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={()=>{setError('');try{onBoundary();}catch(e){setError(e.message);}}}>Use selected paragraph as a section</button>
      {sections.map((section,index)=><div key={section.id} draggable={!disabled && !moving} onDragStart={e=>{e.dataTransfer.setData('text/sermon-section',section.id);e.dataTransfer.effectAllowed='move';}} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect='move';}} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('text/sermon-section');if(id)void move(id,section.id);}} style={{background:t.surface,border:`1px solid ${t.surfaceBorder}`,borderRadius:7,padding:8,marginBottom:8}}>
        <button style={{...button,border:0,background:'transparent',padding:'0 0 6px',textAlign:'left',width:'100%',fontWeight:600,lineHeight:1.4}} title={section.title} onClick={()=>onJump(section.id)}>{section.title.length>110?section.title.slice(0,110)+'…':section.title}</button>
        <div style={{display:'flex',gap:4,alignItems:'center'}}><small style={{flex:1,color:t.textMuted}}>{section.blockIds.length} paragraphs · ~{timeLabel(section.seconds)}</small><button style={button} disabled={disabled || moving || index===0} aria-label={`Move section ${index+1} up`} onClick={()=>void move(section.id,sections[index-1].id)}>↑</button><button style={button} disabled={disabled || moving || index===sections.length-1} aria-label={`Move section ${index+1} down`} onClick={()=>void move(section.id,sections[index+2]?.id || null)}>↓</button>{index>0 && <button style={button} disabled={disabled} aria-label={`Merge section ${index+1} into previous`} title="Remove this boundary; keep paragraphs with the previous section" onClick={()=>onChange({...preparation,sections:{...preparation.sections,[section.id]:{heading:false}}})}>Merge</button>}</div>
        {!!section.references.length && <div style={{display:'flex',flexDirection:'column',gap:4,marginTop:7}}>{section.references.map(ref=><button key={ref.id} style={{...button,textAlign:'left',color:'#f07e7e'}} onClick={()=>onJump(ref.id)}>{ref.label}</button>)}</div>}
      </div>)}
      {!sections.length && <p style={{fontSize:12}}>Your outline appears as the document loads.</p>}
      {!!sections.length && <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void move(e.dataTransfer.getData('text/sermon-section'),null);}} style={{textAlign:'center',padding:12,color:t.textMuted,fontSize:11,border:`1px dashed ${t.surfaceBorder}`,borderRadius:7}}>Drop here to move to the end</div>}
    </>}
    {tab==='scratchpad' && <div style={{height:'100%',display:'flex',flexDirection:'column',gap:8}}><p style={{color:t.textMuted,fontSize:11}}>Unused ideas and illustrations. Saved with this sermon, separate from its word count and copied manuscript.</p><textarea aria-label="Sermon scratchpad" disabled={disabled} value={preparation.scratchpad || ''} onChange={e=>onChange({...preparation,scratchpad:e.target.value})} placeholder="Capture a thought, possible opening, or illustration…" style={{...field,flex:1,minHeight:240,resize:'none',lineHeight:1.5}} /></div>}
    {tab==='comments' && <>
      <p style={{color:t.textMuted,fontSize:11,marginBottom:8}}>Highlight a passage, then add a note. Deleted passages leave recoverable notes here.</p>
      <form onSubmit={e=>{e.preventDefault();setError('');try{onAddComment(note);setNote('');}catch(e){setError(e.message);}}} style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}><textarea aria-label="New passage comment" value={note} onChange={e=>setNote(e.target.value)} placeholder="Verify this quote, find a story…" style={{...field,minHeight:60}} /><button style={button} disabled={disabled || !note.trim()} onMouseDown={e=>e.preventDefault()}>Add comment to selection</button></form>
      <select aria-label="Comment filter" value={filter} onChange={e=>setFilter(e.target.value)} style={{...field,marginBottom:10}}><option value="open">Unresolved ({open})</option><option value="all">All comments</option><option value="resolved">Resolved</option></select>
      {comments.filter(item=>filter==='all' || (filter==='resolved'?item.resolved:!item.resolved)).map(item=><article key={item.id} style={{background:t.surface,border:`1px solid ${t.surfaceBorder}`,borderRadius:7,padding:9,marginBottom:9}}>
        <div style={{fontSize:11,color:item.detached?'#ffcc70':t.textMuted,marginBottom:6}}>{item.detached?'Passage removed · reattach this note':item.resolved?'Resolved':'Unresolved'}</div>
        <button style={{...button,background:'transparent',border:0,padding:0,width:'100%',textAlign:'left',fontSize:11,color:t.textMuted,lineHeight:1.4}} disabled={item.detached} onClick={()=>onCommentJump(item)}>“{item.anchor?.quote?.slice(0,180)}”</button>
        <textarea aria-label={`Edit comment ${item.id}`} value={item.text} disabled={disabled} onChange={e=>updateComment(item.id,{text:e.target.value})} style={{...field,minHeight:65,margin:'8px 0',resize:'vertical'}} />
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button style={button} disabled={disabled} onClick={()=>updateComment(item.id,{resolved:!item.resolved})}>{item.resolved?'Reopen':'Resolve'}</button>{item.detached && <button style={button} disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={()=>{try{onReattach(item);setError('');}catch(e){setError(e.message);}}}>Attach to selection</button>}</div>
      </article>)}
      {!comments.length && <p style={{fontSize:12,color:t.textMuted}}>No comments yet.</p>}
    </>}
    </div>
  </aside>;
}
