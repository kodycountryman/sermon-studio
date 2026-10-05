import {SEARCH_FIELDS,libraryEntry,searchLibrary,reflectionEntry} from './sermon-library.js';
import {useEditorViewport,mobileEditorCss} from './editor-mobile.jsx';
import {documentParagraphs} from './sermon-outputs.js';
import React, {useState,useRef,useEffect,useLayoutEffect} from 'react';
import {SermonOutputPanel} from './sermon-output-panel.jsx';
import {DocumentAssistant} from './document-assistant.jsx';
import {normalizeTiming,preachingSeconds,timeLabel,timeSections} from './preaching-time.js';
import {PreachingTimeSettings} from './preaching-time-settings.jsx';
import {defaultAssistantProfile,storyHtml} from './assistant-profile.js';
import {SermonHistory,SermonConflict} from './sermon-history.jsx';
import {SermonPreparation} from './sermon-preparation.jsx';
import {emptyPreparation,ensureBlocks,blockForNode,describeBlocks,buildSections,moveSection,anchorSelection,reconcileComments,rangeFromAnchor} from './document-structure.js';

export function SermonEditor({sermon,t,onClose,onSaved,onCoach}) {
  const editor=useRef(null);
  const shell=useRef(null);
  const viewport=useRef(null);
  const narrow=useEditorViewport(shell);
  const [hudHover,setHudHover]=useState(false);
  const [hudFocus,setHudFocus]=useState(false);
  const [hudPinned,setHudPinned]=useState(false);
  const [zoom,setZoom]=useState('fit');
  const [pageWidth,setPageWidth]=useState(950);
  useEffect(()=>{
    const observer=new ResizeObserver(entries=>setPageWidth(Math.max(100,entries[0].contentRect.width-32)));
    if(viewport.current) observer.observe(viewport.current);
    return ()=>observer.disconnect();
  },[]);
  const selectedRange=useRef(null),lastBlock=useRef(null),insertionRange=useRef(null);
  const [assistantProfile,setAssistantProfile]=useState(defaultAssistantProfile);
  useEffect(()=>{let live=true;const load=localOnly=>window.personalLibrary.load({localOnly}).then(data=>{if(live)setAssistantProfile(previous=>JSON.stringify(previous)===JSON.stringify(data.profile)?previous:data.profile);}).catch(()=>{});void load(false);const unsubscribe=window.personalLibrary.subscribe(()=>void load(true));return()=>{live=false;unsubscribe();};},[]);
  const [preparation,setPreparation]=useState(()=>({...emptyPreparation(),...sermon.preparation}));
  const prepRef=useRef(preparation),previousBlocks=useRef([]);
  const [blocks,setBlocks]=useState([]);
  const [prepOpen,setPrepOpen]=useState(false),[prepTab,setPrepTab]=useState('outline');
  useEffect(()=>{
    const remember=()=>{
      const selection=window.getSelection();
      if(selection.rangeCount && editor.current?.contains(selection.anchorNode)){lastBlock.current=blockForNode(editor.current,selection.anchorNode)?.getAttribute('data-ss-block');insertionRange.current=selection.getRangeAt(0).cloneRange();}
      if(selection.rangeCount && !selection.isCollapsed && editor.current?.contains(selection.anchorNode) && editor.current?.contains(selection.focusNode)) selectedRange.current=selection.getRangeAt(0).cloneRange();
    };
    document.addEventListener('selectionchange',remember);
    return ()=>document.removeEventListener('selectionchange',remember);
  },[]);
  const [full,setFull]=useState(!!(sermon.fullScreen || sermon.view?.fullScreen));
  const [title,setTitle]=useState(sermon.fileName || 'Untitled sermon');
  const [fontSize,setFontSize]=useState(sermon.fontSize || '12');
  const [recordId,setRecordId]=useState(()=>sermon.id || `saved-${crypto.randomUUID()}`);
  const [documentHtml,setDocumentHtml]=useState(sermon.html);
  const [outputsOpen,setOutputsOpen]=useState(false);
  const [showHistory,setShowHistory]=useState(false);
  const [conflict,setConflict]=useState(null);
  const [reviewConflict,setReviewConflict]=useState(false);
  const [storageStatus,setStorageStatus]=useState('Saving on this device…');
  const [connected,setConnected]=useState(navigator.onLine);
  const autosaveTimer=useRef(null),latest=useRef(null),changeSequence=useRef(0);
  useEffect(()=>{setDocumentHtml(sermon.html);},[sermon.html]);
  const [status,setStatus]=useState('');
  const [saving,setSaving]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [timingOpen,setTimingOpen]=useState(false);
  const [documentCounts,setDocumentCounts]=useState({lines:0,words:0});
  useEffect(()=>{
    const element=editor.current;
    if(!element)return;
    let frame;
    const update=()=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        const text=element.innerText.trim();
        const words=text ? text.split(/\s+/u).length : 0;
        // Count visible text rows, including wrapping, rather than HTML paragraphs.
        const rows=[];
        const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
        let node;
        while((node=walker.nextNode())){
          if(!node.textContent.trim())continue;
          const range=document.createRange();range.selectNodeContents(node);
          for(const rect of range.getClientRects())if(rect.width && rect.height)rows.push(rect.top);
        }
        rows.sort((a,b)=>a-b);
        let lines=0,last=-Infinity;
        for(const top of rows)if(top-last>1){lines++;last=top;}
        setDocumentCounts(previous=>previous.lines===lines && previous.words===words ? previous : {lines,words});
      });
    };
    const mutations=new MutationObserver(update);
    mutations.observe(element,{subtree:true,childList:true,characterData:true,attributes:true});
    const resize=new ResizeObserver(update);resize.observe(element);
    update();
    return()=>{cancelAnimationFrame(frame);mutations.disconnect();resize.disconnect();};
  },[sermon.html,fontSize,zoom,pageWidth,full]);
  useEffect(()=>{
    if(!full) return;
    const old=document.body.style.overflow;
    document.body.style.overflow='hidden';
    editor.current?.focus();
    const escape=e=>{
      if(e.key==='Escape' && !e.defaultPrevented) setFull(false);
      if(e.key==='Tab') {
        const controls=[...shell.current.querySelectorAll('button:not(:disabled),input,select,[contenteditable="true"]')];
        const visible=controls.filter(control=>control.getClientRects().length);
        const first=visible[0],last=visible[visible.length-1];
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',escape);
    return ()=>{document.body.style.overflow=old;document.removeEventListener('keydown',escape);};
  },[full]);
  const button={padding:'8px 12px',borderRadius:7,border:`1px solid ${t.surfaceBorder}`,background:t.surface,color:t.text,cursor:'pointer',fontSize:12};
  const command=(cmd,value)=>{if(sermon.formatting) return;editor.current?.focus();document.execCommand(cmd,false,value);setDirty(true);setStatus('');};
  function mark(type) {
    const selection=window.getSelection();
    let range=selection.rangeCount && editor.current?.contains(selection.anchorNode) && editor.current?.contains(selection.focusNode) ? selection.getRangeAt(0) : selectedRange.current;
    if(sermon.formatting) return;
    if(!range || range.collapsed || !editor.current?.contains(range.commonAncestorContainer)) {setStatus('Select text in the editor first.');return;}
    editor.current.focus();
    selection.removeAllRanges();selection.addRange(range);
    const span=document.createElement('span');
    const styles={point:'background:#ffe066;color:#000;font-weight:700;text-decoration:underline;',scripture:'color:#cc0000;',story:'color:#00b4d8;',example:'color:#7b2fbe;',oneliner:'font-weight:700;text-decoration:underline;',basic:'color:#111;background:transparent;font-weight:400;font-style:normal;text-decoration:none;'};
    span.style.cssText=styles[type];
    const selected=range.extractContents();
    if(type==='basic') {
      for(const el of [...selected.querySelectorAll('*')]) {
        el.removeAttribute('style');
        if(['STRONG','B','EM','I','U','FONT'].includes(el.tagName)) el.replaceWith(...el.childNodes);
      }
      span.appendChild(selected);
    } else {
      if(type==='point') {
        // Existing colored or normal-text spans must not override the slide styling.
        for(const el of selected.querySelectorAll('*')) {
          el.style.backgroundColor='#ffe066';el.style.color='#000';
          el.style.fontWeight='700';el.style.textDecoration='underline';
        }
      }
      if(['scripture','story','example'].includes(type))for(const el of selected.querySelectorAll('*'))el.style.color=type==='example'?'#7b2fbe':type==='story'?'#00b4d8':'#cc0000';
      span.appendChild(selected);
    }
    range.insertNode(span);
    selection.removeAllRanges();range.selectNodeContents(span);selection.addRange(range);
    selectedRange.current=range.cloneRange();
    setDirty(true);setStatus('');
  }
  async function persist(label=null) {
    if(sermon.formatting || !editor.current)return;
    const sequence=changeSequence.current;
    setStorageStatus('Saving on this device…');
    try{
      const record=await window.savedSermons.save(snapshot(),{label});
      if(sequence===changeSequence.current)setDirty(false);
      setStorageStatus(storageMessage(record));onSaved?.(record);return record;
    }catch(e){setStorageStatus(`Needs attention: ${e.message}`);throw e;}
  }
  async function save() {
    if(saving)return;setSaving(true);
    try{await persist('Manual save');await window.savedSermons.syncPending();}catch{}finally{setSaving(false);}
  }
  function storageMessage(record){
    if(record.conflict)return 'Needs attention: review both copies';
    if(import.meta.env.DEV)return 'Saved on this device';
    if(record.pending)return navigator.onLine?(record.syncError?'Saved on this device · sync will retry':'Saved on this device · syncing…'):'Saved on this device · waiting for connection';
    return 'Synced';
  }
  const currentHtml=(exportOnly=false)=>{
    if(editor.current)ensureBlocks(editor.current);
    const copy=document.createElement('div');copy.innerHTML=editor.current?.innerHTML || sermon.html;
    for(const paragraph of copy.querySelectorAll('p')){paragraph.style.marginTop='0pt';paragraph.style.marginBottom='0pt';}
    for(const element of copy.querySelectorAll('[data-ss-comment-count]'))element.removeAttribute('data-ss-comment-count');
    if(exportOnly)for(const element of copy.querySelectorAll('[data-ss-block]'))element.removeAttribute('data-ss-block');
    return copy.innerHTML;
  };
  function snapshot(){
    let caret=null;
    const selection=window.getSelection();
    if(selection?.rangeCount && editor.current?.contains(selection.anchorNode)){
      const range=selection.getRangeAt(0).cloneRange();range.selectNodeContents(editor.current);range.setEnd(selection.anchorNode,selection.anchorOffset);caret=range.toString().length;
    }
    return {id:recordId,title:title.trim() || 'Untitled sermon',content:currentHtml(),fontSize,preparation:prepRef.current,updatedAt:Date.now(),view:{scrollTop:viewport.current?.scrollTop || 0,caret,zoom,fullScreen:full}};
  }
  latest.current={snapshot,persist,formatting:sermon.formatting};
  function changePreparation(value){
    prepRef.current=value;setPreparation(value);setDirty(true);scheduleSave();
  }
  function refreshStructure(){
    if(!editor.current || sermon.formatting)return;
    ensureBlocks(editor.current);
    const next=describeBlocks(editor.current);
    const comments=reconcileComments(prepRef.current.comments || [],previousBlocks.current,next);
    if(JSON.stringify(comments)!==JSON.stringify(prepRef.current.comments))changePreparation({...prepRef.current,comments});
    const research=(prepRef.current.research || []).map(note=>note.anchor?reconcileComments([note],previousBlocks.current,next)[0]:note);
    if(JSON.stringify(research)!==JSON.stringify(prepRef.current.research))changePreparation({...prepRef.current,research});
    previousBlocks.current=next;
    setBlocks(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);
    const counts=new Map();
    for(const comment of comments)if(!comment.resolved && !comment.detached)counts.set(comment.anchor.start.blockId,(counts.get(comment.anchor.start.blockId) || 0)+1);
    for(const element of editor.current.children){const count=counts.get(element.getAttribute('data-ss-block'));if(count){if(element.getAttribute('data-ss-comment-count')!==String(count))element.setAttribute('data-ss-comment-count',String(count));}else if(element.hasAttribute('data-ss-comment-count'))element.removeAttribute('data-ss-comment-count');}
  }
  useLayoutEffect(()=>{refreshStructure();},[documentHtml,sermon.formatting]);
  useEffect(()=>{
    if(sermon.formatting)return;
    const observer=new MutationObserver(refreshStructure);observer.observe(editor.current,{childList:true,subtree:true,characterData:true,attributes:true});
    return()=>observer.disconnect();
  },[sermon.formatting]);
  useEffect(()=>{refreshStructure();},[preparation]);
  const timing=normalizeTiming(preparation.timing);
  const sections=timeSections(buildSections(blocks,preparation.sections),blocks,timing);
  function jumpTo(id){
    const element=[...editor.current.children].find(node=>node.getAttribute('data-ss-block')===id);
    if(!element)return;
    element.scrollIntoView({block:'center',behavior:'smooth'});editor.current.focus({preventScroll:true});
    const range=document.createRange();range.selectNodeContents(element);range.collapse(true);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);lastBlock.current=id;
  }
  async function reorder(id,beforeId){
    if(sermon.formatting)return;
    await persist('Before reordering sections');
    const fresh=buildSections(describeBlocks(editor.current),prepRef.current.sections);
    if(!moveSection(editor.current,fresh,id,beforeId))throw new Error('This section changed. Refresh the outline and try again.');
    selectedRange.current=null;refreshStructure();scheduleSave();setStatus('Section moved. The previous order is in Versions.');
  }
  function markBoundary(){
    const id=lastBlock.current;
    if(!id || ![...editor.current.children].some(element=>element.getAttribute('data-ss-block')===id))throw new Error('Click a paragraph in your document first.');
    changePreparation({...prepRef.current,sections:{...prepRef.current.sections,[id]:{heading:true}}});
  }
  function addComment(text){
    const anchor=anchorSelection(editor.current,selectedRange.current);
    if(!anchor)throw new Error('Highlight the passage you want to comment on first.');
    if(!text.trim())throw new Error('Write a note first.');
    changePreparation({...prepRef.current,comments:[...prepRef.current.comments,{id:crypto.randomUUID(),text:text.trim(),anchor,resolved:false,detached:false,createdAt:Date.now()}]});
  }
  function jumpComment(comment){
    const range=rangeFromAnchor(editor.current,comment.anchor);if(!range)return;
    jumpTo(comment.anchor.start.blockId);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);selectedRange.current=range.cloneRange();
  }
  function reattachComment(comment){
    const anchor=anchorSelection(editor.current,selectedRange.current);if(!anchor)throw new Error('Highlight a new passage first.');
    changePreparation({...prepRef.current,comments:prepRef.current.comments.map(item=>item.id===comment.id?{...item,anchor,detached:false}:item)});
  }
  async function saveProfile(profile){
    const record=await window.personalLibrary.saveProfile(profile);if(record.conflict)throw new Error('Your device settings are saved, but the database has another copy. Review library copies in Stories.');setAssistantProfile(profile);
  }
  function pinResearch(note){
    const existing=prepRef.current.research || [];
    if(existing.some(item=>item.sourceId===note.sourceId))return;
    changePreparation({...prepRef.current,research:[...existing,{...note,id:crypto.randomUUID(),createdAt:Date.now(),detached:!!note.anchor && !rangeFromAnchor(editor.current,note.anchor)}]});
    setPrepTab('research');setPrepOpen(true);setStatus('Study pinned to this sermon.');
  }
  function reattachResearch(note){
    const anchor=anchorSelection(editor.current,selectedRange.current);if(!anchor)throw new Error('Highlight the passage to attach this study to first.');
    changePreparation({...prepRef.current,research:prepRef.current.research.map(item=>item.id===note.id?{...item,anchor,detached:false}:item)});
  }
  async function unpinResearch(note){await persist('Before unpinning research');changePreparation({...prepRef.current,research:prepRef.current.research.filter(item=>item.id!==note.id)});}
  async function insertStory(story){
    const saved=insertionRange.current?.cloneRange();
    if(!saved || !editor.current.contains(saved.commonAncestorContainer))throw new Error('Click where you want this story in the document first.');
    saved.collapse(false);await persist('Before inserting a story');
    if(!editor.current.contains(saved.commonAncestorContainer))throw new Error('The insertion point changed. Click in the document again.');
    const oldIds=new Set([...editor.current.children].map(node=>node.getAttribute('data-ss-block')));
    // Boundary paragraphs split the current passage on either side of the story
    // without letting native paste merge its first or last line into that text.
    const html=`<p style="margin:0;"><br></p>${storyHtml(story.text)}<p style="margin:0;"><br></p>`;
    editor.current.focus();const selection=window.getSelection();selection.removeAllRanges();selection.addRange(saved);
    if(!document.execCommand('insertHTML',false,html))throw new Error('Could not insert the story. Select another insertion point.');
    ensureBlocks(editor.current);const use={id:crypto.randomUUID(),storyId:story.storageId || `personal-${story.id}`,storyTitle:story.title,title:title.trim() || 'Untitled sermon',sermonId:recordId,createdAt:Date.now(),blockIds:[...editor.current.children].map(node=>node.getAttribute('data-ss-block')).filter(id=>!oldIds.has(id))};
    changePreparation({...prepRef.current,storyUses:[...(prepRef.current.storyUses || []),use]});selectedRange.current=null;
    await persist();
    try{await window.personalLibrary.recordUse(story.storageId || story.id,use);}catch{throw new Error('Story inserted and saved. Its library usage log could not update; the record is kept with this sermon.');}
    setStatus('Story inserted as an editable copy. Previous text is in Versions.');
  }
  function loadPreparation(record){const value={...emptyPreparation(),...record.preparation};prepRef.current=value;setPreparation(value);previousBlocks.current=[];}
  function scheduleSave(){
    if(latest.current.formatting)return;
    changeSequence.current++;
    try{window.savedSermons.emergency(latest.current.snapshot());setStorageStatus('Saving on this device…');}catch(e){setStorageStatus(`Needs attention: ${e.message}`);}
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current=setTimeout(()=>void latest.current.persist().catch(()=>{}),700);
  }
  useEffect(()=>{
    if(sermon.formatting)return;
    window.savedSermons.setActive(recordId);
    const element=editor.current;
    const observer=new MutationObserver(scheduleSave);
    observer.observe(element,{childList:true,subtree:true,characterData:true,attributes:true});
    void persist().catch(()=>{});
    let live=true;
    const unsubscribe=window.savedSermons.subscribe(()=>{
      void window.savedSermons.get(recordId).then(record=>{if(live && record){setStorageStatus(storageMessage(record));setConflict(record.conflict?record:null);}}).catch(()=>{});
    });
    const flush=()=>{
      if(latest.current.formatting)return;
      clearTimeout(autosaveTimer.current);
      try{window.savedSermons.emergency(latest.current.snapshot());}catch{}
      void latest.current.persist().catch(()=>{});
    };
    const hidden=()=>{if(document.visibilityState==='hidden')flush();};
    const connection=()=>{setConnected(navigator.onLine);void window.savedSermons.get(recordId).then(record=>record && setStorageStatus(storageMessage(record)));};
    window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',hidden);
    window.addEventListener('online',connection);window.addEventListener('offline',connection);
    return()=>{live=false;observer.disconnect();unsubscribe();flush();window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('online',connection);window.removeEventListener('offline',connection);};
  },[recordId,sermon.formatting]);
  useEffect(()=>{scheduleSave();},[title,fontSize]);
  useEffect(()=>{
    if(!sermon.view)return;
    const frame=requestAnimationFrame(()=>{
      if(sermon.view.zoom)setZoom(sermon.view.zoom);
      if(viewport.current)viewport.current.scrollTop=sermon.view.scrollTop || 0;
      if(sermon.view.caret!=null){
        let remaining=sermon.view.caret,node;
        const walker=document.createTreeWalker(editor.current,NodeFilter.SHOW_TEXT);
        while((node=walker.nextNode())){if(remaining<=node.length){const range=document.createRange();range.setStart(node,remaining);range.collapse(true);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);break;}remaining-=node.length;}
      }
    });return()=>cancelAnimationFrame(frame);
  },[]);
  async function closeEditor(){try{await persist();window.savedSermons.clearActive();onClose();}catch{setStatus('Could not save. Keep this editor open and try again.');}}
  function outputCurrent(){return {title:title.trim() || 'Untitled sermon',content:window.savedSermons.cleanHtml(currentHtml()),fontSize,audience:prepRef.current.audience || 'general'};}
  async function captureOutputSource(checkpointLabel='Output source checkpoint'){
    const record=await persist(checkpointLabel);
    const versions=await window.savedSermons.versions(record.id);
    const version=versions.find(item=>item.label===checkpointLabel && item.content===record.content && item.title===record.title && item.fontSize===record.fontSize);
    if(!version)throw new Error('Could not preserve the source version. Try again.');

    return {title:record.title,content:record.content,text:documentParagraphs(record.content,record.fontSize).map(paragraph=>paragraph.prefix+paragraph.runs.map(run=>run.text).join('')).join('\n\n'),fontSize:record.fontSize,revision:record.revision,versionId:version.id,createdAt:version.createdAt,audience:record.preparation?.audience || 'general',timing:normalizeTiming(record.preparation?.timing)};
  }
  async function addReflection(draft){
    const source=await captureOutputSource('Delivery source checkpoint');
    source.estimatedSeconds=preachingSeconds(source.text.trim()?source.text.trim().split(/\s+/u).length:0,source.timing);
    const entry=reflectionEntry(draft,source);
    changePreparation({...prepRef.current,reflections:[...(prepRef.current.reflections || []),entry]});
    await persist('Delivery reflection');
  }
  async function restoreVersion(item){
    await persist();const record=await window.savedSermons.restore(recordId,item);
    loadPreparation(record);editor.current.innerHTML=record.content;setDocumentHtml(record.content);setTitle(record.title);setFontSize(record.fontSize);selectedRange.current=null;insertionRange.current=null;refreshStructure();setDirty(false);setStatus('Version restored. Your previous manuscript is in history.');
  }
  async function resolveConflict(choice){
    await persist();const record=await window.savedSermons.resolveConflict(recordId,choice);
    setRecordId(record.id);loadPreparation(record);editor.current.innerHTML=record.content;setDocumentHtml(record.content);setTitle(record.title);setFontSize(record.fontSize);setConflict(null);setReviewConflict(false);selectedRange.current=null;insertionRange.current=null;refreshStructure();
  }
  const hudOpen=!full || hudHover || hudFocus || hudPinned;
  const zoomPercent=zoom==='fit' ? (narrow?100:Math.round(pageWidth/950*100)) : Number(zoom);
  const changeZoom=amount=>setZoom(String(Math.max(25,Math.min(200,Math.round(zoomPercent/25)*25+amount))));
  return <section className={`sermon-editor${full?' sermon-editor-full':''}`} ref={shell} role={full?"dialog":"region"} aria-modal={full?true:undefined} aria-label="Sermon editor" style={full ? {position:'fixed',inset:0,zIndex:10000,background:t.bg,display:'flex',flexDirection:'column',padding:'80px 16px 16px',boxSizing:'border-box'} : {marginBottom:24}}>
    <style>{mobileEditorCss+`.saved-sermon-page,.saved-sermon-page *{font-size:var(--sermon-font-size)!important}.saved-sermon-page{line-height:1.6}.saved-sermon-page p{line-height:1.6;margin-top:0!important;margin-bottom:0!important}.saved-sermon-page [data-ss-comment-count]{position:relative}.saved-sermon-page [data-ss-comment-count]:before{content:'💬';position:absolute;left:-22px;top:0;font-size:12px;cursor:pointer}.sermon-preparation{position:relative;z-index:4;width:300px;height:min(70dvh,700px);max-height:100%;overflow:hidden;align-self:flex-start}.sermon-preparation.is-full{height:100%;max-height:100%}@media(max-width:900px){.sermon-preparation{position:absolute;left:0;top:0;bottom:0;width:min(310px,calc(100% - 16px));z-index:4}}`}</style>
    <div aria-label="Editing HUD" onMouseEnter={()=>setHudHover(true)} onMouseLeave={e=>{
        setHudHover(false);
        if(!full) return;
        setHudPinned(false);setHudFocus(false);
        // Mouse clicks can leave a toolbar control focused after the pointer leaves.
        // Release that focus so it cannot keep the expanded panel open.
        if(e.currentTarget.contains(document.activeElement)) document.activeElement.blur();
      }}
      onFocus={e=>setHudFocus(e.target.matches(':focus-visible'))} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget)) setHudFocus(false);}}
      style={full ? {position:'absolute',top:12,left:16,right:16,zIndex:2,maxWidth:1100,margin:'0 auto',background:t.panelBg,border:`1px solid ${t.surfaceBorder}`,borderRadius:12,padding:10,boxShadow:'0 6px 24px rgba(0,0,0,0.25)',maxHeight:'60vh',overflowY:'auto'} : {}}>
      {full && <div style={{display:'flex',alignItems:'center',gap:8,color:t.text}}>
        <button style={button} aria-expanded={hudOpen} aria-controls="sermon-hud-options"
          onClick={()=>{setHudPinned(v=>!v);setHudHover(false);setHudFocus(false);editor.current?.focus();}}>Editing controls {hudPinned?'▴':'▾'}</button>
        <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12}}>{title}</span>
        <button style={button} onClick={()=>{setHudPinned(true);}}>Zoom: {zoom==='fit'?'Fit width · ':''}{zoomPercent}%</button>
        <button style={button} onClick={()=>{setFull(false);setHudPinned(false);setHudHover(false);setHudFocus(false);}}>Exit full screen</button>
        <button style={button} aria-label="Toggle preparation panel" aria-expanded={prepOpen} onClick={()=>setPrepOpen(value=>!value)}>☷</button>
      </div>}
      <div id="sermon-hud-options" style={{display:hudOpen?'block':'none',paddingTop:full?10:0}}>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:10}}>
      <input aria-label="Sermon title" value={title} onChange={e=>{setTitle(e.target.value);setDirty(true);}} style={{minWidth:120,flex:1,padding:'8px 10px',borderRadius:7,border:`1px solid ${t.surfaceBorder}`,background:t.inputBg,color:t.text,fontWeight:600,fontSize:12}} />
      <button style={{...button,background:t.accentGrad,color:'#fff'}} aria-label="Save sermon" onClick={save} disabled={saving || sermon.formatting}>{saving?'Saving…':'Save'}</button>
      <button style={button} disabled={sermon.formatting} onClick={async()=>{try{await persist();setShowHistory(true);}catch{}}}>Versions</button>
      <button style={button} disabled={sermon.formatting} onClick={()=>setOutputsOpen(true)}>Outputs</button>
      <button style={button} aria-expanded={prepOpen} onClick={()=>setPrepOpen(value=>!value)}>Preparation</button>
      <button style={button} aria-label="Copy Formatted" title="Copy formatted sermon" onClick={async()=>{try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([currentHtml(true)],{type:'text/html'})})]);setStatus('Copied formatted sermon');}catch{await navigator.clipboard.writeText(editor.current.innerText);setStatus('Copied sermon text');}}}>Copy</button>
      {onCoach && !sermon.formatting && <button style={button} aria-label="Send to Coach" onClick={()=>onCoach({title:title.trim() || 'Untitled sermon',content:currentHtml(true)})}>Coach</button>}
      {!full && <button style={button} disabled={sermon.formatting} onClick={()=>{setFull(true);setHudPinned(false);setHudHover(false);setHudFocus(false);}}>Full screen editor</button>}
      {!full && <button style={button} onClick={closeEditor}>Close editor</button>}
    </div>
    <div aria-label="Editor formatting" style={{display:'flex',flexDirection:'column',gap:10,padding:'10px 0',borderTop:`1px solid ${t.surfaceBorder}`,marginBottom:6}}>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        {[
          [['bold','Bold','B'],['italic','Italic','I'],['underline','Underline','U']],
          [['insertUnorderedList','Bullet list','• ≡'],['insertOrderedList','Numbered list','1. ≡']],
          [['undo','Undo','↶'],['redo','Redo','↷']],
        ].map((group,index)=><div key={index} role="group" aria-label={['Text style','Lists','History'][index]} style={{display:'flex',gap:2,paddingRight:10,borderRight:`1px solid ${t.surfaceBorder}`}}>
          {group.map(([cmd,label,icon])=><button key={cmd} aria-label={label} title={label} style={{...button,width:32,height:32,padding:0,fontWeight:cmd==='bold'?700:400,fontStyle:cmd==='italic'?'italic':'normal',textDecoration:cmd==='underline'?'underline':'none',fontSize:index===2?18:13}} onMouseDown={e=>e.preventDefault()} onClick={()=>command(cmd)}>{icon}</button>)}
        </div>)}
        <label style={{color:t.textMuted,fontSize:11,display:'flex',alignItems:'center',gap:6}}>Size <select aria-label="Editor font size" value={fontSize} onChange={e=>{setFontSize(e.target.value);setDirty(true);}} style={{...button,padding:'6px 4px'}}>{[10,11,12,14,16,18,20,24].map(size=><option key={size} value={size}>{size} pt</option>)}</select></label>
        <label style={{color:t.textMuted,fontSize:11,display:'flex',alignItems:'center',gap:3}}>Zoom
          <button style={{...button,padding:'6px 8px'}} aria-label="Zoom out" onClick={()=>changeZoom(-25)}>−</button>
          <select aria-label="Document zoom" value={zoom} onChange={e=>setZoom(e.target.value)} style={{...button,padding:'6px 4px',maxWidth:135}}>
            <option value="fit">Fit width ({narrow?100:Math.round(pageWidth/950*100)}%)</option>
            {[25,50,75,100,125,150,200].map(size=><option key={size} value={size}>{size}%</option>)}
            {zoom!=='fit' && ![25,50,75,100,125,150,200].includes(Number(zoom)) && <option value={zoom}>{zoom}%</option>}
          </select>
          <button style={{...button,padding:'6px 8px'}} aria-label="Zoom in" onClick={()=>changeZoom(25)}>+</button>
        </label>
      </div>
      <div role="group" aria-label="Sermon colors" style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
        {[
          ['basic','Basic','Basic text (black)','#92989c'],['point','Main point','Main point / slide','#ffe066'],
          ['scripture','Scripture','Scripture','#e45454'],['story','Story','Story','#00b4d8'],
          ['example','Example','Examples (purple)','#ae78ed'],['oneliner','One-liner','Homerun one-liner',null],
        ].map(([type,label,description,color])=><button key={type} aria-label={description} title={description} style={{...button,borderRadius:20,padding:'6px 9px',display:'inline-flex',alignItems:'center',gap:6,fontSize:11,whiteSpace:'nowrap'}} onMouseDown={e=>e.preventDefault()} onClick={()=>mark(type)}>
          {color?<span aria-hidden="true" style={{width:7,height:7,borderRadius:'50%',background:color}} />:<span aria-hidden="true" style={{fontWeight:700,textDecoration:'underline',fontSize:10}}>Aa</span>}{label}
        </button>)}
      </div>
    </div>
    <p role="status" style={{margin:'0 0 10px',color:t.textMuted,fontSize:11,flexShrink:0}}>{sermon.formatStatus || status || storageStatus} {full && 'Esc exits full screen.'}</p>
      </div>
    </div>
    <div role="status" aria-live="polite" style={{color:conflict?'#ffcc70':t.textMuted,fontSize:11,padding:'4px 12px',flexShrink:0}}>{storageStatus}{!connected && ' · Offline editing'} {conflict && <button onClick={()=>setReviewConflict(true)}>Review copies</button>}</div>
    <div style={{position:'relative',flex:full?1:undefined,minHeight:0,display:'flex',gap:prepOpen?10:0}}>
    {prepOpen && <SermonPreparation t={t} tab={prepTab} onTab={setPrepTab} onClose={()=>setPrepOpen(false)} sections={sections} preparation={preparation} onChange={changePreparation} onJump={jumpTo} onMove={reorder} onBoundary={markBoundary} onAddComment={addComment} onCommentJump={jumpComment} onReattach={reattachComment} disabled={!!sermon.formatting} fullScreen={full} onResearchReattach={reattachResearch} onResearchRemove={unpinResearch} onInsertStory={insertStory} onAddReflection={addReflection} />}
    <div ref={viewport} aria-label="Document viewport" style={{flex:1,minWidth:0,overflow:'auto',height:full?'100%':undefined,boxSizing:'border-box',minHeight:0,padding:16,paddingBottom:52,background:full?'rgba(0,0,0,0.08)':undefined}}>

      <div ref={editor} role="textbox" aria-label="Sermon content" aria-multiline="true" aria-busy={!!sermon.formatting} contentEditable={!sermon.formatting} suppressContentEditableWarning
        className="saved-sermon-page" onClick={e=>{const block=blockForNode(editor.current,e.target);if(block?.hasAttribute('data-ss-comment-count') && e.clientX<block.getBoundingClientRect().left+2){setPrepTab('comments');setPrepOpen(true);}}} onInput={()=>{setDirty(true);setStatus('');}}
        dangerouslySetInnerHTML={{__html:documentHtml}}
        style={{'--sermon-font-size':`${fontSize}pt`,width:narrow && zoom==='fit'?'100%':950,zoom:zoomPercent/100,margin:'0 auto',background:'#fff',color:'#111',borderRadius:8,padding:'32px 24px',minHeight:400,fontFamily:'Arial,sans-serif',outline:'none',boxSizing:'border-box'}} />
    </div>
    <div aria-label="Document counts" title="Lines counts visible text rows, including wrapped lines."
      style={{position:'absolute',bottom:12,right:20,zIndex:1,display:'flex',alignItems:'center',flexWrap:'wrap',gap:10,padding:'7px 12px',borderRadius:9,background:'rgba(24,26,30,0.65)',backdropFilter:'blur(8px)',color:'#fff',fontSize:12,fontVariantNumeric:'tabular-nums',boxShadow:'0 2px 8px rgba(0,0,0,0.12)'}}>
      <span>{documentCounts.lines.toLocaleString()} lines</span>
      <span>{documentCounts.words.toLocaleString()} words</span>
      <button aria-label="Preaching time settings" aria-expanded={timingOpen} title="Adjust speaking pace and pauses" onClick={()=>setTimingOpen(value=>!value)} style={{border:0,background:'transparent',color:'inherit',padding:0,font:'inherit',cursor:'pointer'}}>~{timeLabel(preachingSeconds(documentCounts.words,timing))}</button>
    </div>
    {timingOpen && <PreachingTimeSettings settings={preparation.timing || timing} words={documentCounts.words} t={t} disabled={!!sermon.formatting} onClose={()=>setTimingOpen(false)} onChange={timing=>changePreparation({...prepRef.current,timing})} />}
    </div>
    <DocumentAssistant editor={editor} selectedRange={selectedRange} title={title} t={t} disabled={!!sermon.formatting} beforeApply={()=>persist('Before assistant rewrite')} profile={assistantProfile} onSaveProfile={saveProfile} audience={preparation.audience || 'general'} onAudienceChange={audience=>changePreparation({...prepRef.current,audience})} onPin={pinResearch} pinnedResearch={preparation.research || []}
      onApplied={()=>{setDirty(true);setStatus('Assistant rewrite applied. Autosave is on.');}} />
    {outputsOpen && <SermonOutputPanel t={t} editor={editor} outputs={preparation.outputs} getCurrent={outputCurrent} captureSource={captureOutputSource} profile={assistantProfile} disabled={!!sermon.formatting} onUpdate={update=>changePreparation({...prepRef.current,outputs:update(prepRef.current.outputs || {})})} onJump={jumpTo} onClose={()=>setOutputsOpen(false)} />}
    {showHistory && <SermonHistory recordId={recordId} t={t} onClose={()=>setShowHistory(false)} onRestore={restoreVersion} onCheckpoint={name=>persist(name)} />}
    {reviewConflict && conflict && <SermonConflict record={conflict} t={t} onResolve={resolveConflict} />}
  </section>;
}

export function SavedSermonsPanel({t,onOpen,onClose,refresh,localOnly=false}) {
  const [items,setItems]=useState([]),[search,setSearch]=useState(''),[field,setField]=useState('all'),[audience,setAudience]=useState(''),[theme,setTheme]=useState(''),[sort,setSort]=useState('recent'),[status,setStatus]=useState('Loading…');
  useEffect(()=>{
    let live=true;
    const update=()=>window.savedSermons.load({localOnly}).then(result=>{if(live){setItems(result.items);setStatus(result.warning || '');}}).catch(e=>{if(live)setStatus(e.message);});
    const localUpdate=()=>window.savedSermons.load({localOnly:true}).then(result=>{if(live)setItems(result.items);}).catch(()=>{});
    void update();const unsubscribe=window.savedSermons.subscribe(localUpdate);
    return()=>{live=false;unsubscribe();};
  },[refresh,localOnly]);
  const entries=React.useMemo(()=>items.map(item=>libraryEntry(item)),[items]);
  const matches=searchLibrary(entries,{query:search,field,audience,theme,sort});
  const themes=[...new Set(items.flatMap(item=>item.preparation?.themes || []))].sort();
  const audiences=[...new Set(entries.map(entry=>entry.fields.audience))].sort();
  const fieldStyle={width:'100%',boxSizing:'border-box',padding:10,minHeight:44,fontSize:16,background:t.inputBg,color:t.text,border:`1px solid ${t.surfaceBorder}`,borderRadius:6};
  return <div style={{padding:16,overflowY:'auto',color:t.text}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3>Saved Sermons</h3><button onClick={onClose}>Close</button></div>
    <p style={{fontSize:12,color:t.textMuted}}>{import.meta.env.DEV?'Stored on this device for future visits.':'Stored in your database, with a device backup.'}</p>
    <input aria-label="Search saved sermons" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, passage, theme or story…" style={{...fieldStyle,marginBottom:8}} />
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,marginBottom:12}}>
      <label>Search in<select aria-label="Search field" value={field} onChange={e=>setField(e.target.value)} style={fieldStyle}>{Object.entries(SEARCH_FIELDS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <label>Sort<select aria-label="Library sort" value={sort} onChange={e=>setSort(e.target.value)} style={fieldStyle}><option value="recent">Most recent</option><option value="title">Title</option><option value="relevance">Best match</option></select></label>
      <label>Audience<select aria-label="Library audience" value={audience} onChange={e=>setAudience(e.target.value)} style={fieldStyle}><option value="">All audiences</option>{audiences.map(value=><option key={value}>{value}</option>)}</select></label>
      <label>Theme<select aria-label="Library theme" value={theme} onChange={e=>setTheme(e.target.value)} style={fieldStyle}><option value="">All themes</option>{themes.map(value=><option key={value}>{value}</option>)}</select></label>
    </div>
    <p role="status" style={{fontSize:12}}>{matches.length} of {items.length} sermons{status?` · ${status}`:''}</p>
    {!!items.length && !matches.length && <p>No sermons match. Try another phrase or clear a filter.</p>}
    {!items.length && !status && <p>No saved sermons yet. Open a sermon and choose Save sermon.</p>}
    {matches.map(({record:item,fields,hits})=><button key={item.id} onClick={()=>onOpen(item)} style={{width:'100%',textAlign:'left',padding:12,marginBottom:8,borderRadius:8,border:`1px solid ${t.surfaceBorder}`,background:t.surface,color:t.text,cursor:'pointer'}}>
      <strong>{item.title}</strong><br/><span style={{display:'block',fontSize:12,margin:'6px 0',color:t.textMuted}}>{[fields.scripture,fields.themes,fields.audience].filter(Boolean).join(' · ')}</span>{!!hits.length && <span style={{display:'block',fontSize:11}}>Matched: {hits.map(key=>SEARCH_FIELDS[key]).join(', ')}</span>}{item.preparation?.reflections?.length>0 && <span style={{display:'block',fontSize:11}}>{item.preparation.reflections.length} delivery reflections</span>}<span style={{fontSize:11,color:t.textMuted}}>{new Date(item.updatedAt).toLocaleString()} · {item.conflict?'Needs attention':item.pending?'Waiting to sync':'Saved'}</span>
    </button>)}
  </div>;
}
