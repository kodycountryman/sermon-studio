import React,{useState,useRef,useEffect} from 'react';
import {WORKSHOPS,WORKSHOP_PROTOCOL,parseWorkshop,workshopRequest} from './sermon-workshop.js';
import {assistantSystem,AUDIENCE_NAMES} from './assistant-profile.js';
import {AssistantProfileSettings} from './assistant-profile-settings.jsx';
import {LibraryConflicts} from './story-library.jsx';
import {anchorSelection} from './document-structure.js';
import {DEEP_STUDY_SYSTEM,getStudyReference,parseStudy} from './deep-study.js';
import {DOCUMENT_ASSISTANT_SYSTEM,parseAssistantReply,assistantRewriteHtml,normalizedPassage} from './document-assistant.js';

export function DocumentAssistant({editor,selectedRange,title,t,disabled,onApplied,beforeApply,profile,onSaveProfile,audience,onAudienceChange,onPin,pinnedResearch=[]}) {
  const [open,setOpen]=useState(false),[mode,setMode]=useState('chat'),[settingsOpen,setSettingsOpen]=useState(false),[pinned,setPinned]=useState([]);
  const [drafts,setDrafts]=useState({chat:'',study:''});
  const [histories,setHistories]=useState({chat:[],study:[]});
  const messages=histories[mode],input=drafts[mode];
  const setInput=value=>setDrafts(previous=>({...previous,[mode]:value}));
  const setMessages=(value,channel=mode)=>setHistories(previous=>({...previous,[channel]:typeof value==='function'?value(previous[channel]):value}));
  const [attachment,setAttachment]=useState(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const abort=useRef(null),thread=useRef(null),composer=useRef(null);
  useEffect(()=>()=>abort.current?.abort(),[]);
  useEffect(()=>{if(open)thread.current?.scrollTo({top:thread.current.scrollHeight});},[messages,open,mode]);
  function captureSelection(){
    const range=selectedRange.current;
    if(!range || range.collapsed || !editor.current?.contains(range.commonAncestorContainer))return null;
    const fragment=document.createElement('div');fragment.appendChild(range.cloneContents());
    return {text:range.toString(),html:fragment.innerHTML,range:range.cloneRange()};
  }
  function attachSelection(){setAttachment(captureSelection());}
  function runWorkshop(kind){
    const target=captureSelection() || attachment;setAttachment(target);
    send(null,workshopRequest(kind,input),target,kind);
  }
  function toggle(){if(!open){attachSelection();setError('');}setOpen(value=>!value);}
  function quickAction(prompt){
    if(!attachment && !input.trim()){
      setError('Highlight a passage in your sermon or paste it into the message box first. For a transition, include both sections.');
      composer.current?.focus();return;
    }
    const question=prompt+(input.trim()?`\n\nAdditional instructions or pasted passage:\n${input.trim()}`:'');
    send(null,question);
  }
  async function send(event,quickPrompt,targetOverride=attachment,workshop=null){
    event?.preventDefault();
    const channel=mode;
    const question=(quickPrompt || input || (mode==='study' && attachment?'Study this passage.':'')).trim(),target=targetOverride;
    if(!question || busy || disabled)return;
    const message={id:crypto.randomUUID(),role:'user',content:question,selection:target?.text};
    const replyId=crypto.randomUUID(),controller=new AbortController();
    const history=[...messages,message];
    setMessages([...history,{id:replyId,role:'assistant',content:'',target,study:channel==='study',workshop}],channel);
    setInput('');setBusy(true);setError('');abort.current=controller;
    let response='';
    const timeout=setTimeout(()=>controller.abort(),190000);
    try {
      let scripture=null;
      const reference=channel==='study'?getStudyReference(question) || getStudyReference(target?.text || ''):null;
      async function fetchPassage(ref){
        const res=await fetch(`/api/scripture?reference=${encodeURIComponent(ref)}`,{signal:controller.signal});
        const data=await res.json();if(!res.ok)throw new Error(data.error || 'Verse lookup failed.');return data;
      }
      if(reference){
        try{scripture=await fetchPassage(reference);}catch(e){if(e.name==='AbortError')throw e;scripture={reference,translations:[],error:e.message};}
        setMessages(previous=>previous.map(m=>m.id===replyId?{...m,scripture}:m),channel);
      }
      const context=JSON.stringify({title,retrievedTranslations:scripture,document:editor.current.innerText,pinnedResearch:pinnedResearch.map(note=>({reference:note.reference,title:note.title,text:note.text,sources:note.sources,passage:note.anchor?.quote})),selectedPassage:target?.text || null,selectedFormatting:target?.html || null,request:question,workshop});
      await window.callAIStream({system:assistantSystem(channel==='study'?DEEP_STUDY_SYSTEM:DOCUMENT_ASSISTANT_SYSTEM,profile,audience)+(workshop?'\n'+WORKSHOP_PROTOCOL:''),maxTokens:channel==='study'?5500:4500,signal:controller.signal,
        messages:[...history.slice(0,-1).slice(-12).filter(m=>m.content).map(m=>({role:m.role,content:m.role==='user' && m.selection ? JSON.stringify({request:m.content,selectedPassage:m.selection}):m.content})),{role:'user',content:context}],
        onChunk:delta=>{response+=delta;setMessages(previous=>previous.map(m=>m.id===replyId?{...m,content:response}:m),channel);}});
      if(!response.trim())throw new Error('The assistant returned no response. Please try again.');
      if(channel==='study' && !scripture){
        const anchor=parseStudy(response).reference;
        if(anchor){
          try{scripture=await fetchPassage(anchor);}catch(e){if(e.name==='AbortError')throw e;scripture={reference:anchor,translations:[],error:e.message};}
        }
      }
      setMessages(previous=>previous.map(m=>m.id===replyId?{...m,done:true,scripture}:m),channel);
    } catch(e){
      setError(e.name==='AbortError'?'Response stopped. You can send another message.':e.message || 'Could not reach the assistant. Please try again.');
      setMessages(previous=>previous.map(m=>m.id===replyId?{...m,failed:true}:m),channel);
    } finally{clearTimeout(timeout);abort.current=null;setBusy(false);}
  }
  async function apply(message,rewrite){
    const target=message.target,range=target?.range;
    if(!range || range.collapsed || !editor.current?.contains(range.commonAncestorContainer) || normalizedPassage(range.toString())!==normalizedPassage(target.text)){
      setError('The selected passage has changed. Select it again and request a fresh rewrite.');return;
    }
    if(!rewrite.trim()){setError('The suggestion contains no replacement text. Ask for a new rewrite.');return;}
    try{await beforeApply?.();}catch{setError('Could not preserve the current version. Try again before applying.');return;}
    if(!editor.current?.contains(range.commonAncestorContainer) || normalizedPassage(range.toString())!==normalizedPassage(target.text)){setError('The passage changed while saving. Select it again.');return;}
    const selection=window.getSelection();editor.current.focus();selection.removeAllRanges();selection.addRange(range);
    const html=assistantRewriteHtml(rewrite);
    // Native insertion preserves Undo and replaces exactly the captured selection.
    if(!document.execCommand('insertHTML',false,html)){setError('Could not apply the rewrite. You can copy it and paste it into the document.');return;}
    selectedRange.current=null;setAttachment(null);setError('');
    setMessages(previous=>previous.map(m=>m.id===message.id?{...m,applied:true}:m));
    onApplied();
  }
  function pin(message,section=null){
    const study=parseStudy(message.content),reference=study.reference || message.scripture?.reference || null;
    let anchor=null;
    const target=message.target;
    if(target?.range && editor.current.contains(target.range.commonAncestorContainer) && normalizedPassage(target.range.toString())===normalizedPassage(target.text) && (!reference || !getStudyReference(target.text) || getStudyReference(target.text).split('-')[0]===reference.split('-')[0]))anchor=anchorSelection(editor.current,target.range);
    if(!anchor && reference){
      const block=[...editor.current.children].find(element=>getStudyReference(element.textContent)?.split('-')[0]===reference.split('-')[0]);
      if(block){const range=document.createRange();range.selectNodeContents(block);anchor=anchorSelection(editor.current,range);}
    }
    const links=(message.scripture?.translations || []).filter(item=>item.url).map(item=>({label:`${item.version} on Bible Gateway`,url:item.url}));
    for(const line of (study.sections.find(item=>item.key==='CROSS_REFERENCES')?.text || '').split('\n')){const ref=getStudyReference(line);if(ref)links.push({label:ref,url:`https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=NASB`});}
    const sourceId=`${message.id}:${section?.key || 'ALL'}`;
    try{onPin({sourceId,title:section?.title || 'Deep Study',reference,text:section?.text || study.sections.map(item=>`${item.title}\n${item.text}`).join('\n\n'),anchor,sources:[...new Map(links.map(item=>[item.url,item])).values()],translations:message.scripture?.translations || []});setPinned(previous=>[...previous,sourceId]);setError('');}catch(e){setError(e.message);}
  }
  const button={border:`1px solid ${t.surfaceBorder}`,background:t.surface,color:t.text,borderRadius:8,padding:'8px 10px',cursor:'pointer',fontSize:12};
  return <>
    <style>{`.document-assistant-launch:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.35)}.document-assistant-launch:focus-visible{outline:2px solid #ffe066;outline-offset:3px}`}</style>
    <button className="document-assistant-launch" aria-label={open?'Close sermon assistant':'Open sermon assistant'} title={open?'Close sermon assistant':'Sermon coach'} aria-expanded={open} aria-controls="document-assistant"
      disabled={disabled} onMouseDown={event=>event.preventDefault()} onClick={toggle}
      style={{position:'fixed',right:32,bottom:64,zIndex:10003,border:`1px solid ${t.accent}`,borderRadius:'50%',width:48,height:48,padding:0,display:'grid',placeItems:'center',background:t.accentGrad,color:'#fff',boxShadow:'0 4px 18px rgba(0,0,0,.25)',cursor:'pointer',fontSize:14,fontWeight:600,transition:'transform .15s,box-shadow .15s',opacity:disabled?.5:1}}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {open ? <path d="m6 6 12 12M18 6 6 18" /> : <>
          <circle cx="10" cy="7" r="3" />
          <path d="M4 20v-2a6 6 0 0 1 12 0v2M16 3h5v6l-2-2h-3" />
        </>}
      </svg>
    </button>
    {open && <aside id="document-assistant" aria-label="Assistant" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();setOpen(false);}}}
      style={{position:'fixed',right:20,bottom:122,zIndex:10003,width:'min(420px,calc(100vw - 40px))',height:'min(580px,calc(100dvh - 150px))',display:'flex',flexDirection:'column',background:t.panelBg,color:t.text,border:`1px solid ${t.surfaceBorder}`,borderRadius:16,boxShadow:'0 12px 40px rgba(0,0,0,.4)',overflow:'hidden'}}>
      <div style={{padding:'8px 12px',flexShrink:0,alignItems:'center',borderBottom:`1px solid ${t.surfaceBorder}`,display:'flex',justifyContent:'space-between',gap:12}}>
        <strong title="Your theology and voice, with full document context">Assistant</strong>
        <div style={{display:'flex',gap:6,alignItems:'flex-start'}}><button style={{...button,padding:'5px 8px'}} aria-label="Assistant settings" title="Your theology, voice and audience presets" disabled={busy} onClick={()=>setSettingsOpen(value=>!value)}>⚙</button><button style={{...button,padding:'5px 8px',fontSize:11}} disabled={busy || !messages.length} onClick={()=>{setMessages([]);setError('');}}>{mode==='study'?'Clear studies':'New chat'}</button>
        <button style={{...button,padding:'5px 8px'}} aria-label="Close assistant panel" onClick={()=>setOpen(false)}>✕</button></div>
      </div>
      {settingsOpen?<><AssistantProfileSettings profile={profile} t={t} onSave={onSaveProfile} onClose={()=>setSettingsOpen(false)} /><LibraryConflicts t={t} /></>:<>
      <div role="group" aria-label="Assistant mode" style={{display:'flex',gap:4,padding:'5px 12px',flexShrink:0,borderBottom:`1px solid ${t.surfaceBorder}`}}>
        {[['chat','Chat'],['study','Deep Study']].map(([value,label])=><button key={value} type="button" aria-pressed={mode===value} style={{...button,padding:'4px 10px',fontSize:11,background:mode===value?t.accentGrad:t.surface,color:mode===value?'#fff':t.text}} onMouseDown={event=>event.preventDefault()} onClick={()=>{setMode(value);setError('');if(value==='study')attachSelection();}}>{label}</button>)}
        <select aria-label="Assistant audience" value={audience || 'general'} disabled={busy} onChange={event=>onAudienceChange(event.target.value)} style={{...button,padding:'4px 5px',fontSize:11,minWidth:0,marginLeft:'auto'}}>{Object.entries(AUDIENCE_NAMES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      </div>
      <div ref={thread} role="log" aria-label="Assistant conversation" style={{flex:1,minHeight:0,overflowY:'auto',padding:14}}>
        {!messages.length && <p style={{fontSize:13,lineHeight:1.6,color:t.textMuted}}>{mode==='study'?'Highlight a Scripture or enter a passage or topic. Explore four translations, cross references, Greek or Hebrew, context and theology. Study history stays here while this sermon is open.':'Paste a passage or ask about your sermon. I can tighten a section, improve a transition, suggest a cross reference or help find a personal story.'}</p>}
        {messages.map(message=>{
          const workshop=message.workshop?parseWorkshop(message.content):null;
          const study=message.study?parseStudy(message.content):null;
          const reply=message.role==='assistant' && !message.study?parseAssistantReply(message.content):null;
          return <div key={message.id} style={{padding:12,marginBottom:12,borderRadius:10,background:message.role==='user'?t.surface:'transparent',border:`1px solid ${t.surfaceBorder}`,fontSize:13,lineHeight:1.6}}>
            <strong style={{fontSize:11,color:t.textMuted}}>{message.role==='user'?'You':'Assistant'}</strong>
            {message.selection && <details style={{marginTop:6,fontSize:11,color:t.textMuted}}><summary>Attached passage</summary><p style={{whiteSpace:'pre-wrap'}}>{message.selection}</p></details>}
            {workshop ? <div><strong style={{display:'block',marginTop:6}}>{WORKSHOPS[message.workshop].label}</strong><p style={{whiteSpace:'pre-wrap'}}>{workshop.coaching}</p>{workshop.options.map(option=><details key={option.id} style={{marginTop:8}}><summary>{option.title}</summary><div aria-label={`Workshop option ${option.id}`} style={{background:'#fff',color:'#111',padding:12,borderRadius:8,marginTop:8}} dangerouslySetInnerHTML={{__html:assistantRewriteHtml(option.text)}} /><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}><button style={button} disabled={!message.done || message.applied || !message.target || busy || disabled} onClick={()=>apply(message,option.text)} aria-label={`Apply option ${option.id} to selected passage`}>{message.applied?'Applied':'Apply to selected passage'}</button><button style={button} onClick={async()=>{try{await navigator.clipboard.writeText(option.text.replace(/<\/?[A-Z]+>/g,''));}catch{setError('Could not copy. Select the draft and copy it manually.');}}}>Copy draft</button></div></details>)}{message.done && !message.target && <p style={{fontSize:11,color:t.textMuted}}>To apply directly, highlight the intended passage and run the workshop again. Drafts remain proposals.</p>}</div> : study?.sections.length ? <>
              {study.reference && <strong>{study.reference}</strong>}
              {message.done && <button type="button" style={{...button,margin:'6px 0',fontSize:11}} disabled={disabled || pinned.includes(`${message.id}:ALL`)} onClick={()=>pin(message)}>{pinned.includes(`${message.id}:ALL`)?'Study pinned':'Pin study'}</button>}
              {message.scripture && <details style={{marginTop:8}}><summary>NASB · NLT · NIV · ESV</summary>
                {message.scripture.error && <p>{message.scripture.error}</p>}
                {message.scripture.translations.map(translation=><div key={translation.version} style={{padding:'8px 0',borderBottom:`1px solid ${t.surfaceBorder}`}}>
                  <strong>{translation.version}</strong><p style={{margin:'4px 0',whiteSpace:'pre-wrap'}}>{translation.text || translation.error}</p>
                  <a href={translation.url} target="_blank" rel="noopener noreferrer" style={{color:t.accent}}>Read {translation.version} on Bible Gateway</a>
                </div>)}
              </details>}
              {study.sections.map(section=>section.key==='OVERVIEW'?<div key={section.key}><p style={{whiteSpace:'pre-wrap'}}>{section.text}</p>{message.done && <button type="button" style={{...button,fontSize:11}} disabled={disabled || pinned.includes(`${message.id}:${section.key}`)} onClick={()=>pin(message,section)}>{pinned.includes(`${message.id}:${section.key}`)?'Pinned':'Pin overview'}</button>}</div>:<details key={section.key} style={{marginTop:8}}>
                <summary>{section.title}</summary><div style={{whiteSpace:'pre-wrap',marginTop:6}}>{section.text}</div>
                {section.key==='CROSS_REFERENCES' && <div style={{marginTop:6,display:'flex',gap:6,flexWrap:'wrap'}}>{[...new Set(section.text.split('\n').map(line=>getStudyReference(line)).filter(Boolean))].map(ref=><a key={ref} href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=NASB`} target="_blank" rel="noopener noreferrer" style={{color:t.accent}}>{ref}</a>)}</div>}
                {message.done && <button type="button" style={{...button,marginTop:6,marginRight:6,fontSize:11}} disabled={disabled || pinned.includes(`${message.id}:${section.key}`)} onClick={()=>pin(message,section)}>{pinned.includes(`${message.id}:${section.key}`)?'Pinned':'Pin section'}</button>}
                {message.done && <button type="button" style={{...button,marginTop:6,fontSize:11}} disabled={busy} onClick={()=>send(null,`Go deeper into ${section.title} for ${study.reference || 'the topic in this study'}. Expand this section with careful explanations and practical implications.`,null)}>Go deeper</button>}
              </details>)}
            </> : <div style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{reply?reply.coaching:message.content}</div>}
            {!message.content && !message.failed && <p role="status">Thinking about your sermon…</p>}
            {!workshop && reply?.complete && reply.rewrite && <div style={{marginTop:12}}>
              <div aria-label="Suggested rewrite" style={{background:'#fff',color:'#111',padding:12,borderRadius:8}} dangerouslySetInnerHTML={{__html:assistantRewriteHtml(reply.rewrite)}} />
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>
                <button style={button} disabled={!message.done || message.applied || !message.target || busy || disabled} onClick={()=>apply(message,reply.rewrite)}>{message.applied?'Applied':'Apply to selected passage'}</button>
                <button style={button} onClick={async()=>{try{await navigator.clipboard.writeText(reply.rewrite.replace(/<\/?[A-Z]+>/g,''));}catch{setError('Could not copy. Select the suggestion text and copy it manually.');}}}>Copy rewrite</button>
              </div>
              {!message.target && <p style={{fontSize:11,color:t.textMuted}}>Select a passage and ask for a rewrite to apply it directly.</p>}
            </div>}
          </div>;
        })}
      </div>
      {error && <p role="alert" style={{margin:'0 14px 10px',fontSize:12,color:'#ff887b'}}>{error}</p>}
      <form onSubmit={send} style={{padding:10,flexShrink:0,borderTop:`1px solid ${t.surfaceBorder}`}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:7,minWidth:0}}>
        <details style={{position:'relative',flexShrink:0}}>
          <summary style={{...button,padding:'4px 8px',fontSize:11,listStyle:'none'}}>{mode==='study'?'Study actions':'Quick actions'} ▾</summary>
        <div aria-label="Assistant quick actions" style={{position:'absolute',bottom:'calc(100% + 8px)',left:0,width:280,boxSizing:'border-box',padding:8,background:t.panelBg,border:`1px solid ${t.surfaceBorder}`,borderRadius:10,boxShadow:'0 4px 20px rgba(0,0,0,.35)',zIndex:2,display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          {(mode==='study'?[['Study this passage','Give me a focused deep study of the attached passage or topic with cross references, original language notes, historical context and theology.'],['Explore cross references','Study the strongest cross references for this passage or topic and explain each connection.']]:[
            ['Expand this section','Expand this section with useful depth and clear application. Preserve its meaning and voice. Offer a complete replacement for the attached section. Ask for a personal story if needed.'],
            ['Rewrite this section','Rewrite this section to improve clarity, flow and delivery while preserving its meaning and my voice. Offer a complete replacement for the attached section.'],
            ['Condense this section','Condense this section by removing repetition and unnecessary words while preserving its main idea, Scripture and strongest lines. Offer a complete replacement for the attached section.'],
            ['Create a seamless transition','Create a seamless transition between the two sections in the attached or pasted passage. Preserve both sections and insert a short, natural bridge between them. Offer the complete attached passage with the transition included so it can replace the selection. If only one section is supplied and the next section is unclear, ask me to select both sections first.'],
          ]).map(([label,prompt])=><button key={label} style={{...button,textAlign:'left',lineHeight:1.4}} type="button" disabled={busy || disabled} onClick={event=>{event.currentTarget.closest('details').open=false;quickAction(prompt);}}>{label}</button>)}
        </div>
        </details>
        {mode==='chat' && <details style={{position:'relative'}}><summary style={{...button,padding:'4px 8px',fontSize:11,listStyle:'none'}}>Workshops ▾</summary><div style={{position:'absolute',bottom:'calc(100% + 8px)',left:0,width:220,maxWidth:'calc(100vw - 60px)',padding:8,display:'flex',flexDirection:'column',gap:5,background:t.panelBg,border:`1px solid ${t.surfaceBorder}`,borderRadius:8,boxShadow:'0 6px 24px #0006',zIndex:3}}>{Object.entries(WORKSHOPS).map(([key,workshop])=><button key={key} type="button" style={{...button,textAlign:'left'}} disabled={busy || disabled} onMouseDown={e=>e.preventDefault()} onClick={e=>{e.currentTarget.closest('details').open=false;runWorkshop(key);}}>{workshop.label}</button>)}</div></details>}
        <button style={{...button,padding:'4px 8px',fontSize:11}} type="button" disabled={busy || disabled} title="Attach the highlighted passage" onMouseDown={event=>event.preventDefault()} onClick={attachSelection}>Attach</button>
        {attachment && <>
          <details style={{position:'relative',minWidth:0,flex:1,fontSize:11}}>
            <summary style={{cursor:'pointer',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:t.textMuted}}>Passage attached</summary>
            <div style={{position:'absolute',bottom:'calc(100% + 8px)',right:0,width:260,maxWidth:'calc(100vw - 60px)',maxHeight:180,overflowY:'auto',whiteSpace:'pre-wrap',padding:10,background:t.surface,border:`1px solid ${t.surfaceBorder}`,borderRadius:8,boxShadow:'0 4px 20px rgba(0,0,0,.35)',zIndex:2}}>{attachment.text}</div>
          </details>
          <button style={{...button,padding:'1px 5px',fontSize:11}} type="button" aria-label="Remove attached passage" disabled={busy} onClick={()=>setAttachment(null)}>✕</button>
        </>}
        </div>
        <div style={{display:'flex',alignItems:'flex-end',gap:7}}>
        <textarea ref={composer} aria-label="Message sermon assistant" placeholder={mode==='study'?'Enter a verse, topic or study question…':'Paste a passage or ask for help…'} rows={1} value={input} disabled={busy || disabled} onChange={event=>setInput(event.target.value)}
          onKeyDown={event=>{if(event.key==='Enter' && (event.metaKey || event.ctrlKey)){event.preventDefault();send(event);}}}
          style={{boxSizing:'border-box',width:'100%',minWidth:0,flex:1,resize:'none',height:40,maxHeight:64,padding:10,background:t.inputBg,color:t.inputText,border:`1px solid ${t.inputBorder}`,borderRadius:8,fontFamily:'inherit',fontSize:13}} />
          {busy?<button style={button} type="button" onClick={()=>abort.current?.abort()}>Stop response</button>:<button style={{...button,background:t.accentGrad,color:'#fff'}} disabled={(!input.trim() && !(mode==='study' && attachment)) || disabled} type="submit">{mode==='study'?'Study':'Send'}</button>}
        </div>
      </form>
      </>}
    </aside>}
  </>;
}
