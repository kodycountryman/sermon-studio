// ─── SERMON STUDIO APP ──────────────────────────────────────────────────────
// All React components. Config, prompts, and utils are loaded from separate files.

// ── React (works in both Vite/npm and legacy CDN modes) ────────────────────
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

// ── Mobile detection hook ────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── READ-ONLY RENDER ─────────────────────────────────────────────────────────
function ReadOnly({ text }) {
  const parse = (str, lk) => {
    const rx = /<(BOLD|ITALIC|SCRIPTURE|ONELINER|SCREEN|HEADER|STORY|SUMMARY|JOKE|EXAMPLE)(?:\s+ref="[^"]*")?>([\s\S]*?)<\/\1>/g;
    const parts = []; let last = 0, m;
    while ((m = rx.exec(str)) !== null) {
      if (m.index > last) parts.push(<span key={`t${lk}${last}`}>{str.slice(last, m.index)}</span>);
      const [, tag, content] = m; const k = `${lk}${m.index}`;
      if (tag === "HEADER")    parts.push(<div key={k} style={{fontWeight:700,textTransform:"uppercase",borderBottom:"2px solid #e0c080",paddingBottom:3,marginTop:20,marginBottom:6,fontSize:"12pt",letterSpacing:"1px"}}>{content}</div>);
      else if (tag === "SCREEN")    parts.push(<span key={k} style={{fontWeight:800,textDecoration:"underline"}}>{content}</span>);
      else if (tag === "BOLD")      parts.push(<strong key={k}>{content}</strong>);
      else if (tag === "ITALIC")    parts.push(<em key={k}>{content}</em>);
      else if (tag === "ONELINER")  parts.push(<strong key={k}><em style={{color:"#8b4000"}}>{content}</em></strong>);
      else if (tag === "SCRIPTURE") parts.push(<span key={k} style={{color:"#cc0000",fontStyle:"italic"}}>{content}</span>);
      else if (tag === "STORY")     parts.push(<span key={k} style={{color:"#00b4d8"}}>{content}</span>);
      else if (tag === "SUMMARY")   parts.push(<span key={k} style={{color:"#2d9b2d"}}>{content}</span>);
      else if (tag === "JOKE")      parts.push(<span key={k} style={{color:"#00b4d8"}}>{content}</span>);
      else if (tag === "EXAMPLE")   parts.push(<span key={k} style={{color:"#7b2fbe"}}>{content}</span>);
      else if (tag === "CLOSING")   parts.push(<span key={k} style={{color:"#e67e00"}}>{content}</span>);
      last = m.index + m[0].length;
    }
    if (last < str.length) parts.push(<span key={`e${lk}`}>{str.slice(last)}</span>);
    return parts;
  };
  return (
    <div style={{fontFamily:"Inter,sans-serif",fontSize:"11pt",color:"#111",lineHeight:1.7}}>
      {(text || "").split("\n").map((line, i) => (
        <div key={i} style={{minHeight:"1.1em"}}>{line.trim() === "" ? <span>&nbsp;</span> : parse(line, i)}</div>
      ))}
    </div>
  );
}

function TheoTabbed({ text, secs }) {
  const [active, setActive] = useState("all");
  const useSecs = secs || THEO_SECS;
  const parsed = parseTheoSections(text, useSecs);
  const content = active === "all" ? text : (parsed[active] || "No content for this section.");

  // Section color map for study style
  const secColors = {
    overview:"#1a5fa8", hebrew:"#2e7d32", historical:"#7b3f00", scholars:"#4a0072",
    tensions:"#b71c1c", crossref:"#00695c", preaching:"#e65100", cautions:"#37474f", all:"#333"
  };

  return (
    <div style={{background:"#fff",border:"1px solid #e0d0c0",borderRadius:10,overflow:"hidden"}}>
      {/* Tab bar */}
      <div style={{display:"flex",overflowX:"auto",background:"#faf6f0",borderBottom:"1px solid #e0d0c0",gap:0}}>
        {useSecs.map(s => {
          const col = secColors[s.key] || "#555";
          return (
            <button key={s.key} onClick={() => setActive(s.key)} style={{
              padding:"8px 12px", border:"none",
              borderBottom: active===s.key ? `2.5px solid ${col}` : "2.5px solid transparent",
              background:"transparent", color: active===s.key ? col : "#8a7060",
              fontFamily:"Inter,sans-serif", fontSize:11, fontWeight:active===s.key?700:400,
              cursor:"pointer", whiteSpace:"nowrap", transition:"color 0.15s",
            }}>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Content area — professional study style */}
      <div style={{padding:"24px 28px", lineHeight:1.75}}>
        {active === "all"
          ? (
            // "All" view: render each section as a titled card
            useSecs.filter(s=>s.marker&&parsed[s.key]).map(s => {
              const col = secColors[s.key]||"#555";
              return (
                <div key={s.key} style={{marginBottom:28, paddingBottom:24, borderBottom:"1px solid #f0e8dc"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <div style={{width:3,height:20,background:col,borderRadius:2,flexShrink:0}}/>
                    <h3 style={{margin:0,fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:700,color:col,textTransform:"uppercase",letterSpacing:"1px"}}>{s.label}</h3>
                  </div>
                  <ReadOnly text={parsed[s.key]}/>
                </div>
              );
            })
          )
          : (
            <div>
              {active !== "all" && (
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                  <div style={{width:3,height:22,background:secColors[active]||"#555",borderRadius:2}}/>
                  <h3 style={{margin:0,fontFamily:"Inter,sans-serif",fontSize:15,fontWeight:700,color:secColors[active]||"#333",textTransform:"uppercase",letterSpacing:"1px"}}>
                    {useSecs.find(s=>s.key===active)?.label}
                  </h3>
                </div>
              )}
              <ReadOnly text={content}/>
            </div>
          )
        }
      </div>
    </div>
  );
}

// ─── LOADING BAR ─────────────────────────────────────────────────────────────
function LoadingBar({ active, modeId, length, t }) {
  const [pct, setPct] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const intervalRef = useRef(null);
  const startRef = useRef(null);

  const estSecs = modeId === "theology" ? THEOLOGY_EST_SECS
    : modeId === "illustration" ? ILLUS_EST_SECS
    : (LENGTHS[length]?.estApiSecs || 90);

  const msgs = modeId === "theology"
    ? ["Searching the commentaries...","Diving into Greek and Hebrew...","Cross-referencing passages...","Consulting the scholars...","Pulling it together..."]
    : modeId === "illustration"
    ? ["Finding the right stories...","Asking what Rich would do...","Connecting culture to scripture...","Adding the punches...","Almost there..."]
    : (LENGTHS[length]?.msgs || ["Writing...","Building the points...","Almost there..."]);

  useEffect(() => {
    if (active) {
      setPct(0); setMsgIdx(0);
      startRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startRef.current) / 1000;
        const raw = elapsed / estSecs;
        // Ease curve: fast to 60%, slows down, never hits 100
        const p = Math.min(96, raw < 0.6 ? raw * 100 : 60 + (raw - 0.6) * 90);
        setPct(p);
        setMsgIdx(Math.min(msgs.length - 1, Math.floor((p / 96) * msgs.length)));
      }, 400);
    } else {
      clearInterval(intervalRef.current);
      if (pct > 0) { setPct(100); setTimeout(() => setPct(0), 700); }
    }
    return () => clearInterval(intervalRef.current);
  }, [active]);

  if (!active && pct === 0) return null;

  const remaining = Math.max(0, Math.round(estSecs * (1 - pct / 100)));
  const timeLabel = remaining > 90 ? `~${Math.ceil(remaining / 60)} min left` : remaining > 0 ? `~${remaining}s left` : "Finishing...";

  return (
    <div style={{marginTop:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
        <span style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.textMuted,fontStyle:"italic"}}>{msgs[msgIdx]}</span>
        <span style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.textFaint}}>{pct < 98 ? timeLabel : "Finishing..."}</span>
      </div>
      <div style={{height:5,background:t.surface,borderRadius:10,overflow:"hidden",border:`1px solid ${t.surfaceBorder}`}}>
        <div style={{height:"100%",width:`${pct}%`,background:t.accentGrad,borderRadius:10,transition:"width 0.35s ease-out",boxShadow:`0 0 10px ${t.accent}66`}} />
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}>
        <span style={{fontFamily:"Inter,sans-serif",fontSize:10,color:t.textFaint}}>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ─── WORD COUNT BADGE ─────────────────────────────────────────────────────────
function WordCountBadge({ text, length, t, inline }) {
  const wc = countWords(text);
  if (!wc) return null;
  const cfg = LENGTHS[length];
  const minW = cfg?.wMin; const maxW = cfg?.wMax;
  const inRange = cfg ? (wc >= minW && wc <= maxW) : true;
  const color = !cfg ? t.accent : inRange ? "#2a9a52" : wc < (minW || 0) ? "#e08030" : "#cc4444";
  const minMin = Math.round((minW || wc) / 150);
  const maxMin = Math.round((maxW || wc) / 100);
  if (inline) return (
    <span style={{display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", background:`${color}18`, border:`1px solid ${color}40`, borderRadius:20}}>
      <span style={{fontFamily:"Inter,sans-serif", fontSize:11, fontWeight:700, color}}>{wc.toLocaleString()} words</span>
      {cfg && <span style={{fontFamily:"Inter,sans-serif", fontSize:10, color:t.textMuted}}>{inRange ? `(${minMin}-${maxMin} min)` : wc < (minW||0) ? "↑ short" : "↓ long"}</span>}
    </span>
  );
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:t.surface,border:`1px solid ${t.surfaceBorder}`,borderRadius:8,marginBottom:12}}>
      <span style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.textMuted}}>Generated:</span>
      <span style={{fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:700,color}}>{wc.toLocaleString()}</span>
      {cfg && <span style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.textMuted}}>Target: {minW.toLocaleString()} to {maxW.toLocaleString()} words ({minMin} to {maxMin} min)</span>}
      {cfg && !inRange && <span style={{fontFamily:"Inter,sans-serif",fontSize:11,color,fontWeight:600}}>{wc < (minW||0) ? "Under target" : "Over target"}</span>}
    </div>
  );
}

// ─── RICH TEXT EDITOR ─────────────────────────────────────────────────────────
// EDITOR_FONTS, EDITOR_SIZES, EDITOR_COLORS loaded from config.js

function RichEditor({ rawText, length, t: theme }) {
  const edRef = useRef(null);
  const colorBtnRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [activeColor, setActiveColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selPop, setSelPop] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInstr, setAiInstr] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [savedRange, setSavedRange] = useState(null);
  const [savedHtml, setSavedHtml] = useState("");
  const [showFmtPop, setShowFmtPop] = useState(false);
  const [liveWc, setLiveWc] = useState(0);

  useEffect(() => {
    if (edRef.current && rawText) {
      edRef.current.innerHTML = rawToHtml(rawText);
      setLiveWc(countWords(rawText));
    }
  }, [rawText]);

  function handleInput() {
    if (edRef.current) setLiveWc(countWords(edRef.current.innerText || ""));
  }

  function onMouseUp() {
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().trim().length < 10) { setSelPop(null); return; }
      const range = sel.getRangeAt(0), rect = range.getBoundingClientRect(), er = edRef.current.getBoundingClientRect();
      const div = document.createElement("div"); div.appendChild(range.cloneContents());
      setSavedHtml(div.innerHTML); setSavedRange(range.cloneRange());
      setSelPop({ x: rect.left - er.left + rect.width / 2, y: rect.top - er.top - 52, text: sel.toString().trim() });
    }, 10);
  }

  async function runAiEdit() {
    if (!aiInstr.trim() || !selPop) return;
    setAiLoading(true);
    try {
      const newText = await callAI({
        system: AI_EDIT_SYSTEM,
        messages: [{ role:"user", content:`HTML context:\n${savedHtml}\n\nPlain text: "${selPop.text}"\n\nInstruction: ${aiInstr}\n\nReturn ONLY the rewritten text with proper custom tags.` }],
        maxTokens: 4000, model: "gpt-4o-mini",
      });
      if (newText && savedRange && edRef.current) {
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(savedRange);
        document.execCommand("insertHTML", false, parseLineToHtml(newText));
      }
    } catch(e) { console.error(e); }
    setAiLoading(false); setAiOpen(false); setSelPop(null); setAiInstr(""); setShowFmtPop(false);
  }

  const exec = (cmd, val = null) => { edRef.current?.focus(); document.execCommand(cmd, false, val); };
  function doPrint() {
    const html = edRef.current?.innerHTML || "";
    const win = window.open("","_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Sermon</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&display=swap');
*{box-sizing:border-box;}
body{font-family:Inter,sans-serif;font-size:12pt;line-height:1.8;max-width:680px;margin:40px auto;color:#111;padding:0 24px;}
@media print{body{margin:0;max-width:100%;padding:0;}@page{margin:1in;}}
[style*="color:#cc0000"]{color:#cc0000!important;font-style:italic;}
[style*="font-weight:800"]{font-weight:800;text-decoration:underline;}
[style*="text-transform:uppercase"]{text-transform:uppercase!important;font-weight:700;border-bottom:2px solid #c8722a;padding-bottom:4px;margin-top:28px;font-size:11pt;letter-spacing:1px;display:block;}
strong{font-weight:700;}em{font-style:italic;}
</style></head><body>${html}</body></html>`);
    win.document.close();
    setTimeout(()=>{win.focus();win.print();},450);
  }

  function doCopy() {
    const html = edRef.current?.innerHTML || "", plain = edRef.current?.innerText || "";
    navigator.clipboard.write([new ClipboardItem({ "text/plain": new Blob([plain], {type:"text/plain"}), "text/html": new Blob([`<html><body>${html}</body></html>`], {type:"text/html"}) })]).catch(() => navigator.clipboard.writeText(plain));
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  }
  function doPrint() {
    const html = edRef.current?.innerHTML || "";
    const win = window.open("","_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>Sermon</title><style>
      body{font-family:Inter,sans-serif;font-size:12pt;line-height:1.7;max-width:700px;margin:40px auto;color:#111;padding:0 20px;}
      @media print{body{margin:20px;}}
      strong{font-weight:700;}em{font-style:italic;}
      [style*="color:#cc0000"]{color:#cc0000!important;font-style:italic;}
      [style*="color:#00b4d8"]{color:#00b4d8!important;}
      [style*="font-weight:800"]{font-weight:800;text-decoration:underline;}
      h2,h3{text-transform:uppercase;border-bottom:2px solid #e0c080;padding-bottom:4px;margin-top:24px;}
    </style></head><body>${html}</body></html>`);
    win.document.close();
    setTimeout(()=>win.print(), 400);
  }

  const isLight = (theme?.bg||"").includes("#fff") || (theme?.bg||"").startsWith("#f");
  const tbBg = isLight ? "#f8f8f4" : "rgba(255,255,255,0.07)";
  const tbBorder = isLight ? "#d0cdc0" : (theme?.surfaceBorder||"#333");
  const tbText = isLight ? "#333" : (theme?.text||"#ddd");
  const tbHover = isLight ? "#ede8d8" : "rgba(255,255,255,0.14)";
  const tbBarBg = isLight ? "#f4f2ec" : (theme?.panelBg||"#111");
  const TB = ({onClick, title, children}) => (
    <button onMouseDown={e=>{e.preventDefault();onClick();}} title={title}
      style={{padding:"4px 7px",border:`1px solid ${tbBorder}`,borderRadius:4,background:tbBg,cursor:"pointer",fontSize:12,color:tbText,minWidth:26,display:"flex",alignItems:"center",justifyContent:"center"}}
      onMouseEnter={e=>e.currentTarget.style.background=tbHover}
      onMouseLeave={e=>e.currentTarget.style.background=tbBg}>
      {children}
    </button>
  );
  const Sep = () => <div style={{width:1,background:tbBorder,margin:"0 3px",alignSelf:"stretch"}} />;

  return (
    <div style={{background:"#fff",border:"1.5px solid #d0c0a0",borderRadius:8,overflow:"visible",position:"relative",isolation:"isolate"}}>
      {/* ── Sticky header: word-count + toolbar ── */}
      <div style={{position:"sticky",top:0,zIndex:52,borderRadius:"8px 8px 0 0",overflow:"hidden"}}>  
      {/* Live word count bar */}
      {liveWc > 0 && (() => {
        const cfg = length ? LENGTHS[length] : null;
        const inRange = cfg ? (liveWc >= cfg.wMin && liveWc <= cfg.wMax) : true;
        const barColor = !cfg ? "#c8722a" : inRange ? "#2a9a52" : liveWc < (cfg?.wMin||0) ? "#e08030" : "#cc4444";
        const pct = cfg ? Math.min(100, Math.round((liveWc / cfg.wMax) * 100)) : null;
        const minMin = cfg ? Math.round(cfg.wMin / 150) : null;
        const maxMin = cfg ? Math.round(cfg.wMax / 100) : null;
        return (
          <div style={{background:"#f5f0ea",borderBottom:"1px solid #e8d8c0",padding:"5px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontFamily:"Inter,sans-serif",fontSize:11,color:"#8a7060"}}>Words:</span>
            <span style={{fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:700,color:barColor,minWidth:42}}>{liveWc.toLocaleString()}</span>
            {cfg && (
              <>
                <div style={{flex:1,minWidth:80,maxWidth:180,height:4,background:"#e0d0c0",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:barColor,borderRadius:4,transition:"width 0.2s ease"}}/>
                </div>
                <span style={{fontFamily:"Inter,sans-serif",fontSize:10,color:"#aaa",whiteSpace:"nowrap"}}>
                  target {cfg.wMin.toLocaleString()}–{cfg.wMax.toLocaleString()}
                  {" "}({minMin}–{maxMin} min)
                </span>
                {!inRange && <span style={{fontFamily:"Inter,sans-serif",fontSize:10,fontWeight:700,color:barColor}}>{liveWc < cfg.wMin ? "↑ under" : "↓ over"}</span>}
              </>
            )}
          </div>
        );
      })()}
      {/* Toolbar */}
      <div style={{background:tbBarBg,borderBottom:`1px solid ${tbBorder}`,padding:"6px 10px",display:"flex",flexWrap:"wrap",gap:3,alignItems:"center"}}>
        <select onMouseDown={e=>e.stopPropagation()} defaultValue="Arial" onChange={e=>{exec("fontName",e.target.value);edRef.current?.focus();}} style={{padding:"3px 5px",border:`1px solid ${tbBorder}`,borderRadius:4,fontSize:12,background:tbBg,color:tbText}}>
          {EDITOR_FONTS.map(f=><option key={f} value={f}>{f}</option>)}
        </select>
        <select onMouseDown={e=>e.stopPropagation()} defaultValue="11pt" onChange={e=>{const pt=parseInt(e.target.value);exec("fontSize","7");edRef.current?.querySelectorAll("font[size='7']").forEach(el=>{el.removeAttribute("size");el.style.fontSize=`${pt}pt`;});}} style={{padding:"3px 5px",border:`1px solid ${tbBorder}`,borderRadius:4,fontSize:12,background:tbBg,color:tbText}}>
          {EDITOR_SIZES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <Sep/>
        <TB onClick={()=>exec("bold")} title="Bold"><strong>B</strong></TB>
        <TB onClick={()=>exec("italic")} title="Italic"><em>I</em></TB>
        <TB onClick={()=>exec("underline")} title="Underline"><u>U</u></TB>
        <TB onClick={()=>exec("strikeThrough")} title="Strike"><s>S</s></TB>
        <Sep/>
        <TB onClick={()=>exec("justifyLeft")} title="Left">←</TB>
        <TB onClick={()=>exec("justifyCenter")} title="Center">≡</TB>
        <TB onClick={()=>exec("justifyRight")} title="Right">→</TB>
        <Sep/>
        <TB onClick={()=>exec("insertUnorderedList")} title="Bullets">•≡</TB>
        <TB onClick={()=>exec("insertOrderedList")} title="Numbers">1≡</TB>
        <TB onClick={()=>exec("indent")} title="Indent">⇥</TB>
        <TB onClick={()=>exec("outdent")} title="Outdent">⇤</TB>
        <Sep/>
        <div style={SS.posRel}>
          <button ref={colorBtnRef} onMouseDown={e=>{e.preventDefault();setShowColorPicker(p=>!p);}} style={{padding:"3px 7px",border:"1px solid #d0c0a0",borderRadius:4,background:"#faf6f0",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:3}}>
            <span style={{borderBottom:`3px solid ${activeColor}`,paddingBottom:1}}>A</span><span style={{fontSize:9}}>▼</span>
          </button>
          {showColorPicker && (() => {
            const r = colorBtnRef.current?.getBoundingClientRect();
            return (
              <div style={{position:"fixed",top:(r?.bottom||60)+4,left:r?.left||0,zIndex:9999,background:"#fff",border:"1px solid #d0c0a0",borderRadius:6,padding:8,display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,boxShadow:"0 4px 24px rgba(0,0,0,0.22)",minWidth:160}}>
                {EDITOR_COLORS.map(c=><button key={c} onMouseDown={e=>{e.preventDefault();exec("foreColor",c);setActiveColor(c);setShowColorPicker(false);}} style={{width:22,height:22,background:c,border:"1px solid #ccc",borderRadius:3,cursor:"pointer"}}/>)}
              </div>
            );
          })()}
        </div>
        <TB onClick={()=>exec("hiliteColor","#ffff99")} title="Highlight">🖊</TB>
        <Sep/>
        <TB onClick={()=>exec("undo")} title="Undo">↩</TB>
        <TB onClick={()=>exec("redo")} title="Redo">↪</TB>
        <div style={{marginLeft:"auto"}} />
      </div>

      </div>{/* /sticky-header */}

      {/* Editable area */}
      <div style={SS.posRel}>
        <div ref={edRef} contentEditable suppressContentEditableWarning
          onMouseUp={onMouseUp}
          onInput={handleInput}
          onKeyUp={()=>{const s=window.getSelection();if(!s||s.isCollapsed)setSelPop(null);}}
          onMouseDown={()=>setShowColorPicker(false)}
          style={{minHeight:500,padding:"32px 40px",fontFamily:"Inter,sans-serif",fontSize:"11pt",color:"#111",lineHeight:1.55,outline:"none",background:"#fff"}}
        />
        {selPop && !aiOpen && (
          <div style={{position:"absolute",left:Math.max(4,selPop.x-120),top:Math.max(4,selPop.y),zIndex:300,userSelect:"none"}}>
            {/* Main pill bar */}
            <div style={{background:"#1a1208",border:"1px solid #c8722a",borderRadius:8,padding:"7px 12px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(0,0,0,0.5)",whiteSpace:"nowrap"}}>
              <span style={{fontSize:13}}>✨</span>
              <button onMouseDown={e=>{e.preventDefault();setAiOpen(true);setAiInstr("");setShowFmtPop(false);}} style={{background:"linear-gradient(135deg,#c8722a,#e08030)",border:"none",borderRadius:5,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",padding:"5px 12px"}}>AI Edit</button>
              <button onMouseDown={e=>{e.preventDefault();setShowFmtPop(p=>!p);}} style={{background:showFmtPop?"linear-gradient(135deg,#2a4acc,#4060ee)":"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:5,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",padding:"5px 12px",display:"flex",alignItems:"center",gap:5}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Format
              </button>
              <button onMouseDown={e=>{e.preventDefault();setSelPop(null);setShowFmtPop(false);}} style={{background:"transparent",border:"none",color:"#6a5040",cursor:"pointer",fontSize:15,lineHeight:1}}>✕</button>
            </div>
            {/* Format panel */}
            {showFmtPop && (
              <div style={{marginTop:6,background:"#fff",border:"1px solid #d0c0a0",borderRadius:10,padding:12,boxShadow:"0 6px 28px rgba(0,0,0,0.22)",minWidth:300}}>
                <p style={{margin:"0 0 8px",fontSize:10,fontWeight:700,color:"#888",letterSpacing:"1px",textTransform:"uppercase",fontFamily:"Inter,sans-serif"}}>Sermon Types</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:10}}>
                  {[["Scripture","#cc0000",true],["Story","#00b4d8",false],["Summary","#2d9b2d",false],["Example","#7b2fbe",false],["Closing","#e67e00",false],["One-liner","#8b4000",true]].map(([label,color,italic])=>(
                    <button key={label} onMouseDown={e=>{e.preventDefault();
                      if(savedRange){const sel=window.getSelection();sel.removeAllRanges();sel.addRange(savedRange);}
                      document.execCommand("foreColor",false,color);
                      if(italic) document.execCommand("italic",false,null);
                      if(label==="One-liner"){document.execCommand("bold",false,null);}
                      setShowFmtPop(false);}}
                      style={{padding:"5px 4px",border:`1.5px solid ${color}22`,borderRadius:6,background:`${color}11`,cursor:"pointer",fontSize:11,fontWeight:600,color,fontFamily:"Inter,sans-serif",fontStyle:italic?"italic":"normal",display:"flex",alignItems:"center",gap:4}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0,display:"inline-block"}}/>
                      {label}
                    </button>
                  ))}
                </div>
                <p style={{margin:"0 0 6px",fontSize:10,fontWeight:700,color:"#888",letterSpacing:"1px",textTransform:"uppercase",fontFamily:"Inter,sans-serif"}}>Headers</p>
                <div style={{display:"flex",gap:5,marginBottom:10}}>
                  {[["H1","2em",800],["H2","1.5em",700],["H3","1.2em",700],["Body","1em",400]].map(([label,size,weight])=>(
                    <button key={label} onMouseDown={e=>{e.preventDefault();
                      if(savedRange){const sel=window.getSelection();sel.removeAllRanges();sel.addRange(savedRange);}
                      document.execCommand("fontSize",false,"7");
                      edRef.current?.querySelectorAll("font[size='7']").forEach(el=>{el.removeAttribute("size");el.style.fontSize=size;el.style.fontWeight=weight;});
                      setShowFmtPop(false);}}
                      style={{flex:1,padding:"5px 4px",border:"1.5px solid #d0c0a0",borderRadius:6,background:"#faf8f5",cursor:"pointer",fontSize:11,fontWeight:weight>500?700:400,color:"#333",fontFamily:"Inter,sans-serif"}}>
                      {label}
                    </button>
                  ))}
                </div>
                <p style={{margin:"0 0 6px",fontSize:10,fontWeight:700,color:"#888",letterSpacing:"1px",textTransform:"uppercase",fontFamily:"Inter,sans-serif"}}>Style</p>
                <div style={{display:"flex",gap:5}}>
                  {[["Bold","bold",null,()=>document.execCommand("bold",false,null)],["Italic","italic",null,()=>document.execCommand("italic",false,null)],["Underline","underline",null,()=>document.execCommand("underline",false,null)],["Clear","normal",null,()=>{document.execCommand("removeFormat",false,null);document.execCommand("foreColor",false,"#000000");}]].map(([label])=>(
                    <button key={label} onMouseDown={e=>{e.preventDefault();
                      if(savedRange){const sel=window.getSelection();sel.removeAllRanges();sel.addRange(savedRange);}
                      if(label==="Bold")document.execCommand("bold",false,null);
                      else if(label==="Italic")document.execCommand("italic",false,null);
                      else if(label==="Underline")document.execCommand("underline",false,null);
                      else if(label==="Clear"){document.execCommand("removeFormat",false,null);document.execCommand("foreColor",false,"#000000");}
                      setShowFmtPop(false);}}
                      style={{flex:1,padding:"5px 4px",border:"1.5px solid #d0c0a0",borderRadius:6,background:"#faf8f5",cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif",color:"#333",fontWeight:label==="Bold"?700:400,fontStyle:label==="Italic"?"italic":"normal",textDecoration:label==="Underline"?"underline":"none"}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {aiOpen && (
          <div style={{position:"absolute",left:Math.max(4,(selPop?.x||200)-185),top:Math.max(4,(selPop?.y||100)),zIndex:400,background:"#100c06",border:"1.5px solid #c8722a",borderRadius:10,padding:18,width:380,boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{color:"#e09050",fontSize:13,fontWeight:700,fontFamily:"Inter,sans-serif"}}>✨ AI Edit Selection</span>
              <button onClick={()=>{setAiOpen(false);setSelPop(null);}} style={{background:"transparent",border:"none",color:"#6a5040",cursor:"pointer",fontSize:15}}>✕</button>
            </div>
            <div style={{background:"rgba(255,255,255,0.05)",borderRadius:6,padding:"8px 10px",marginBottom:10,fontSize:11,color:"#7a6050",fontFamily:"Inter,sans-serif",maxHeight:55,overflow:"hidden"}}>
              "{(selPop?.text||"").slice(0,130)}{(selPop?.text||"").length>130?"...":""}"
            </div>
            <textarea value={aiInstr} onChange={e=>setAiInstr(e.target.value)} placeholder="What should I do? e.g. Make this funnier. Punch up the landing. Simplify this." rows={3}
              onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)runAiEdit();}}
              style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid #3a2010",borderRadius:6,color:"#f0e6d3",fontFamily:"Inter,sans-serif",fontSize:12,padding:"8px 10px",resize:"none",outline:"none"}}
            />
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button onClick={runAiEdit} disabled={aiLoading||!aiInstr.trim()} style={{flex:1,padding:"9px 0",background:aiLoading?"#555":"linear-gradient(135deg,#c8722a,#e08030)",border:"none",borderRadius:6,color:"#fff",fontSize:13,fontWeight:700,cursor:aiLoading?"not-allowed":"pointer"}}>
                {aiLoading?"Rewriting...":"Rewrite"}
              </button>
              <button onClick={()=>{setAiOpen(false);setSelPop(null);}} style={{padding:"9px 14px",background:"transparent",border:"1px solid #3a2010",borderRadius:6,color:"#7a6050",fontSize:12,cursor:"pointer"}}>Cancel</button>
            </div>
            <p style={{margin:"6px 0 0",fontSize:10,color:"#4a3020",fontFamily:"Inter,sans-serif"}}>CMD + Enter to run</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CHAT PANEL ───────────────────────────────────────────────────────────────
function ChatPanel({ systemPrompt, initialOutput, initialInput }) {
  const [messages, setMessages] = useState([]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const botRef = useRef(null);

  useEffect(() => {
    if (initialOutput) setMessages([{role:"user",content:initialInput||""},{role:"assistant",content:initialOutput}]);
  }, [initialOutput, initialInput]);
  useEffect(() => { botRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  async function send() {
    if (!inp.trim() || loading) return;
    const msg = inp.trim(); setInp("");
    const msgs = [...messages, {role:"user",content:msg}]; setMessages(msgs); setLoading(true);
    try {
      const reply = await callAI({ system:systemPrompt, messages:msgs, maxTokens:8000 });
      setMessages([...msgs,{role:"assistant",content:reply}]);
    } catch(e) { setMessages([...msgs,{role:"assistant",content:"Something went wrong. Please try again."}]); }
    setLoading(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",background:"#fff",border:"1.5px solid #d0c0a0",borderRadius:8,overflow:"hidden"}}>
      <div style={{overflowY:"auto",padding:"24px 28px",maxHeight:700}}>
        {messages.map((m,i) => (
          <div key={i} style={{marginBottom:22}}>
            {m.role==="user"
              ? <div style={{display:"flex",justifyContent:"flex-end"}}><div style={{background:"linear-gradient(135deg,#c8722a,#e08030)",color:"#fff",borderRadius:"10px 10px 2px 10px",padding:"10px 16px",maxWidth:"70%",fontFamily:"Inter,sans-serif",fontSize:"11pt"}}>{m.content}</div></div>
              : <ReadOnly text={m.content} />
            }
          </div>
        ))}
        {loading && <div style={{fontFamily:"Inter,sans-serif",fontSize:"11pt",color:"#888",fontStyle:"italic"}}>Thinking...</div>}
        <div ref={botRef} />
      </div>
      <div style={{borderTop:"1px solid #e0d0c0",padding:"12px 16px",background:"#faf6f0",display:"flex",gap:10}}>
        <textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Ask a follow-up. Go deeper. Push harder." rows={2}
          style={{flex:1,background:"#fff",border:"1px solid #d0c0a0",borderRadius:6,padding:"8px 12px",fontFamily:"Inter,sans-serif",fontSize:"11pt",resize:"none",outline:"none",color:"#111"}}/>
        <button onClick={send} disabled={loading||!inp.trim()} style={{padding:"0 20px",background:loading?"#ccc":"linear-gradient(135deg,#c8722a,#e08030)",border:"none",borderRadius:6,color:"#fff",fontSize:13,fontWeight:700,cursor:loading?"not-allowed":"pointer"}}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

// ─── SERMON IDEA GEN ─────────────────────────────────────────────────────────
function IdeaGen() {
  const [messages, setMessages] = useState([]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const botRef = useRef(null);
  useEffect(() => { botRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  async function callApi(msgs) {
    return await callAI({ system:IDEA_SYSTEM, messages:msgs, maxTokens:4000 });
  }
  async function start() {
    setStarted(true); setLoading(true);
    const msgs = [{role:"user",content:"I need help finding my next sermon. Ask me the right questions."}]; setMessages(msgs);
    try { const r = await callApi(msgs); setMessages([...msgs,{role:"assistant",content:r}]); } catch(e) {}
    setLoading(false);
  }
  async function send() {
    if (!inp.trim()||loading) return;
    const msg = inp.trim(); setInp("");
    const msgs = [...messages,{role:"user",content:msg}]; setMessages(msgs); setLoading(true);
    try { const r = await callApi(msgs); setMessages([...msgs,{role:"assistant",content:r}]); } catch(e) {}
    setLoading(false);
  }

  if (!started) return (
    <div style={{textAlign:"center",padding:"60px 40px",background:"rgba(255,255,255,0.02)",border:"1.5px solid #2a1608",borderRadius:12}}>
      <div style={{fontSize:52,marginBottom:18}}>💭</div>
      <h3 style={{fontFamily:"Inter,sans-serif",color:"#f0e0c8",fontSize:26,fontWeight:700,margin:"0 0 12px"}}>What Should I Preach?</h3>
      <p style={{fontFamily:"Inter,sans-serif",color:"#7a6050",fontSize:15,maxWidth:420,margin:"0 auto 28px",lineHeight:1.7}}>Not sure which direction to go? Answer a few questions and find what God is stirring in your heart right now.</p>
      <button onClick={start} style={{padding:"16px 44px",background:"linear-gradient(135deg,#c8722a,#e08030)",border:"none",borderRadius:8,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:20,fontWeight:700,cursor:"pointer"}}>Find My Next Message</button>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",background:"#fff",border:"1.5px solid #d0c0a0",borderRadius:8,overflow:"hidden",minHeight:500}}>
      <div style={{overflowY:"auto",padding:"24px 28px",maxHeight:700}}>
        {messages.map((m,i) => (
          <div key={i} style={{marginBottom:22}}>
            {m.role==="user"&&i===0 ? null
              : m.role==="user"
              ? <div style={{display:"flex",justifyContent:"flex-end"}}><div style={{background:"linear-gradient(135deg,#c8722a,#e08030)",color:"#fff",borderRadius:"10px 10px 2px 10px",padding:"10px 16px",maxWidth:"70%",fontFamily:"Inter,sans-serif",fontSize:"11pt"}}>{m.content}</div></div>
              : <div style={{fontFamily:"Inter,sans-serif",fontSize:"11pt",color:"#111",lineHeight:1.75}}>{m.content.split("\n").map((l,j)=><div key={j} style={{minHeight:"1.1em"}}>{l||<span>&nbsp;</span>}</div>)}</div>
            }
          </div>
        ))}
        {loading && <div style={{fontFamily:"Inter,sans-serif",color:"#888",fontSize:"11pt",fontStyle:"italic"}}>Thinking...</div>}
        <div ref={botRef} />
      </div>
      <div style={{borderTop:"1px solid #e0d0c0",padding:"12px 16px",background:"#faf6f0",display:"flex",gap:10}}>
        <textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Share what's on your heart..." rows={2}
          style={{flex:1,background:"#fff",border:"1px solid #d0c0a0",borderRadius:6,padding:"8px 12px",fontFamily:"Inter,sans-serif",fontSize:"11pt",resize:"none",outline:"none",color:"#111"}}/>
        <button onClick={send} disabled={loading||!inp.trim()} style={{padding:"0 20px",background:loading?"#ccc":"linear-gradient(135deg,#c8722a,#e08030)",border:"none",borderRadius:6,color:"#fff",fontSize:13,fontWeight:700,cursor:loading?"not-allowed":"pointer"}}>
          {loading?"...":"Send"}
        </button>
      </div>
    </div>
  );
}

// ─── BIBLE READER ─────────────────────────────────────────────────────────────
// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────
function SettingsPanel({ currentTheme, onTheme, onClose, t, inline, preacherName, onPreacherName, defaultTrans, onDefaultTrans, fontSize, onFontSize }) {
  const [folder, setFolder] = useState(null);
  // API keys now managed server-side via Cloudflare Worker proxy
  const [keySaved, setKeySaved] = useState(false);

  const ChevronRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
  const ChevronLeft = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );

  const FolderHeader = ({ title }) => (
    <div style={{padding:"13px 16px 11px",borderBottom:`1px solid ${t.panelBorder}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <button onClick={()=>setFolder(null)}
        style={{display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,background:t.surface,border:`1px solid ${t.surfaceBorder}`,borderRadius:8,cursor:"pointer",color:t.textMuted,flexShrink:0,transition:"all 0.15s"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.color=t.accent;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=t.surfaceBorder;e.currentTarget.style.color=t.textMuted;}}>
        <ChevronLeft/>
      </button>
      <h3 style={{margin:0,fontFamily:"Inter,sans-serif",color:t.text,fontSize:15,fontWeight:700,flex:1}}>{title}</h3>
      <button onClick={onClose} style={{background:"transparent",border:"none",color:t.textMuted,cursor:"pointer",fontSize:17,lineHeight:1,padding:"2px 4px"}}>✕</button>
    </div>
  );

  const MenuRow = ({ id, icon, label, sub, accent }) => (
    <button onClick={()=>setFolder(id)}
      style={{width:"100%",display:"flex",alignItems:"center",gap:13,padding:"12px 16px",background:"transparent",border:"none",borderBottom:`1px solid ${t.panelBorder}`,cursor:"pointer",textAlign:"left",transition:"background 0.14s"}}
      onMouseEnter={e=>e.currentTarget.style.background=t.surface}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <div style={{width:36,height:36,borderRadius:9,background:`${accent}1a`,border:`1px solid ${accent}35`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:accent}}>
        {icon}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:600,color:t.text,marginBottom:1}}>{label}</div>
        <div style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.textMuted}}>{sub}</div>
      </div>
      <span style={{color:t.textFaint,flexShrink:0}}><ChevronRight/></span>
    </button>
  );

  const SettingLabel = ({children}) => (
    <p style={{fontFamily:"Inter,sans-serif",fontSize:10,color:t.textMuted,letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,margin:"0 0 8px"}}>{children}</p>
  );

  // ── ROOT ─────────────────────────────────────────────────────────────────
  if (!folder) return (
    <div style={{...SS.flexColFull}}>
      <div style={{padding:"14px 16px 12px",borderBottom:`1px solid ${t.panelBorder}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <h3 style={{margin:0,fontFamily:"Inter,sans-serif",color:t.text,fontSize:16,fontWeight:700}}>Settings</h3>
        <button onClick={onClose} style={{background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:6,color:t.textMuted,cursor:"pointer",padding:"4px 10px",fontFamily:"Inter,sans-serif",fontSize:12}}>✕ Close</button>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        <MenuRow id="themes" label="Themes" sub={`Active: ${(THEMES[currentTheme]||THEMES.burnt).name}`} accent={t.accent}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>}
        />
        <MenuRow id="profile" label="Profile" sub="Your name and preacher voice" accent="#7b94f0"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        />
        <MenuRow id="display" label="Display" sub={`Font size: ${fontSize||"11pt"}`} accent="#4cc870"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
        />
        {/* API key management removed — keys are now server-side via Cloudflare proxy */}
        <MenuRow id="about" label="About" sub="Sermon Studio" accent="#b07dd4"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>}
        />
      </div>
    </div>
  );

  // ── THEMES ───────────────────────────────────────────────────────────────
  if (folder === "themes") return (
    <div className="drawer-enter" style={{...SS.flexColFull}}>
      <FolderHeader title="Themes"/>
      <div style={{flex:1,overflowY:"auto",padding:"14px 14px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {Object.entries(THEMES).map(([key, th]) => {
            const isOn = currentTheme === key;
            return (
              <button key={key} onClick={()=>onTheme(key)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"11px 13px",background:isOn?th.accentGrad:t.surface,border:`1.5px solid ${isOn?t.accent:t.panelBorder}`,borderRadius:10,cursor:"pointer",transition:"all 0.18s",textAlign:"left"}}>
                <span style={{fontSize:21,lineHeight:1,flexShrink:0}}>{th.emoji}</span>
                <span style={{fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:700,color:isOn?"#fff":t.text,flex:1}}>{th.name}</span>
                <div style={{display:"flex",gap:4,flexShrink:0}}>
                  {[th.bg.includes("gradient")?th.accent:th.bg, th.accent, th.text].map((c,i)=>(
                    <span key={i} style={{width:11,height:11,borderRadius:"50%",background:c,border:"1px solid rgba(255,255,255,0.2)",display:"inline-block"}}/>
                  ))}
                </div>
                {isOn && <span style={{color:"#fff",fontSize:14,marginLeft:2}}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── PROFILE ──────────────────────────────────────────────────────────────
  if (folder === "profile") return (
    <div className="drawer-enter" style={{...SS.flexColFull}}>
      <FolderHeader title="Profile"/>
      <div style={{flex:1,overflowY:"auto",padding:"20px 18px"}}>
        <SettingLabel>Your Name</SettingLabel>
        <input value={preacherName||""} onChange={e=>onPreacherName&&onPreacherName(e.target.value)} placeholder="e.g. Kody Countryman"
          style={{width:"100%",background:t.inputBg,border:`1.5px solid ${t.inputBorder}`,borderRadius:8,padding:"10px 12px",fontFamily:"Inter,sans-serif",fontSize:13,color:t.inputText,outline:"none",boxSizing:"border-box",transition:"border-color 0.15s"}}
          onFocus={e=>e.target.style.borderColor=t.accent}
          onBlur={e=>e.target.style.borderColor=t.inputBorder}
        />
        <p style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.textMuted,margin:"8px 0 0",lineHeight:1.6}}>
          The AI uses this name when writing in your voice. All generated sermons will sound like you.
        </p>
      </div>
    </div>
  );

  // ── BIBLE ────────────────────────────────────────────────────────────────
  if (folder === "display") return (
    <div className="drawer-enter" style={{...SS.flexColFull}}>
      <FolderHeader title="Display"/>
      <div style={{flex:1,overflowY:"auto",padding:"16px 14px"}}>
        <SettingLabel>Editor Font Size</SettingLabel>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {[
            {s:"10pt",label:"Small",    sub:"Compact, more text visible"},
            {s:"11pt",label:"Default",  sub:"Balanced — recommended"},
            {s:"12pt",label:"Medium",   sub:"Comfortable reading"},
            {s:"14pt",label:"Large",    sub:"Easier on the eyes"},
          ].map(({s,label,sub})=>{
            const isOn=(fontSize||"11pt")===s;
            return (
              <button key={s} onClick={()=>onFontSize&&onFontSize(s)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"10px 13px",background:isOn?t.accentGrad:t.surface,border:`1.5px solid ${isOn?t.accent:t.panelBorder}`,borderRadius:9,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                <span style={{fontFamily:"Inter,sans-serif",fontSize:17,fontWeight:900,color:isOn?"#fff":t.textMuted,minWidth:34,flexShrink:0}}>{s}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,color:isOn?"#fff":t.text}}>{label}</div>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:10,color:isOn?"rgba(255,255,255,0.65)":t.textMuted}}>{sub}</div>
                </div>
                {isOn && <span style={{color:"#fff",fontSize:13}}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // API key management removed — keys are now server-side via Cloudflare proxy

  // ── ABOUT ────────────────────────────────────────────────────────────────
  if (folder === "about") return (
    <div className="drawer-enter" style={{...SS.flexColFull}}>
      <FolderHeader title="About"/>
      <div style={{flex:1,overflowY:"auto",padding:"32px 20px 20px"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill={t.accent} style={{display:"block",margin:"0 auto 14px"}}>
            <path d="M12 2C9 6 7 9 7 13a5 5 0 0 0 10 0c0-4-2-7-5-11zm0 15a3 3 0 0 1-3-3c0-2.5 1.2-4.8 3-7.5 1.8 2.7 3 5 3 7.5a3 3 0 0 1-3 3z"/>
          </svg>
          <h2 style={{margin:"0 0 4px",fontFamily:"Inter,sans-serif",color:t.text,fontSize:20,fontWeight:900}}>Sermon Studio</h2>
          
        </div>
        {[
          {label:"Voice",     value:"Kody Countryman"},
          {label:"AI Model",  value: "Claude Sonnet 4.6 (Server-side)"},
          {label:"Storage",   value:"Local device"},
          {label:"Built for", value:"Preachers who mean business"},
        ].map(({label,value})=>(
          <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${t.panelBorder}`}}>
            <span style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.textMuted}}>{label}</span>
            <span style={{fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:600,color:t.text}}>{value}</span>
          </div>
        ))}
        <p style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.textFaint,lineHeight:1.7,margin:"22px 0 0",textAlign:"center"}}>
          The Word, built.
        </p>
      </div>
    </div>
  );

  return null;
}
// ─── HISTORY PANEL ────────────────────────────────────────────────────────────
// MODE_COLORS, HIST_TABS loaded from config.js

// Small SVG icons for each mode tab, colored to match
const HistTabIcon = ({type, size=13, color}) => {
  const s = {width:size,height:size,display:"inline-block",verticalAlign:"middle",marginRight:4};
  if (type==="outline") return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
  if (type==="manuscript") return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
  if (type==="illustration") return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>;
  if (type==="theology") return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
  if (type==="idea") return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6l-.7.4V18H9v-2.6l-.7-.4A7 7 0 0 1 12 2z"/></svg>;
  return null;
};

// Smart metadata for history items
function histItemMeta(item) {
  const modeId = item.modeId;
  if ((modeId==="outline"||modeId==="manuscript") && item.length && LENGTHS[item.length]) {
    return `${LENGTHS[item.length].label} sermon`;
  }
  if (modeId==="theology") return "Deep Study";
  if (modeId==="illustration") return "Illustrations";
  if (modeId==="idea") return "Sermon Idea";
  return null;
}

function HistPanel({ history, onLoad, onDelete, onClose, t, inline, loadedId }) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  const filtered = [...history].reverse().filter(item => {
    if (tab !== "all" && item.modeId !== tab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase(), plain = stripTags(item.output||"").toLowerCase();
    return (item.title||"").toLowerCase().includes(q)||(item.input||"").toLowerCase().includes(q)||plain.includes(q);
  });

  return (
    <div style={{...SS.flexColFull}}>
      <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${t.panelBorder}`,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontFamily:"Inter,sans-serif",color:t.text,fontSize:16,fontWeight:700}}>History</h3>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:6,color:t.textMuted,cursor:"pointer",padding:"4px 10px",fontFamily:"Inter,sans-serif",fontSize:12}}>✕ Close</button>
        </div>
        <div style={SS.posRel}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2.5" strokeLinecap="round" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sermons, themes, passages..."
            style={{width:"100%",background:t.inputBg,border:`1px solid ${t.inputBorder||t.panelBorder}`,borderRadius:6,padding:"7px 10px 7px 30px",fontFamily:"Inter,sans-serif",fontSize:12,color:t.inputText,outline:"none"}}/>
          {search && <button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:t.textMuted,cursor:"pointer",fontSize:13}}>✕</button>}
        </div>
      </div>

      {/* Color-coded icon tabs */}
      <div style={{display:"flex",overflowX:"auto",borderBottom:`1px solid ${t.panelBorder}`,padding:"0 6px",gap:0,flexShrink:0}}>
        {HIST_TABS.map(tb => {
          const isActive = tab===tb.key;
          const col = tb.color || t.accent;
          return (
            <button key={tb.key} onClick={()=>setTab(tb.key)} style={{
              padding:"7px 9px",border:"none",
              borderBottom:isActive?`2.5px solid ${col}`:"2.5px solid transparent",
              background:"transparent",cursor:"pointer",whiteSpace:"nowrap",
              display:"flex",alignItems:"center",gap:3,
              opacity:isActive?1:0.6,transition:"opacity 0.15s",
            }}>
              {tb.icon ? <HistTabIcon type={tb.icon} color={isActive?col:t.textMuted} size={12}/> : null}
              <span style={{fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:isActive?700:400,color:isActive?col:t.textMuted}}>
                {tb.label}
              </span>
            </button>
          );
        })}
      </div>


      <div style={{padding:"4px 16px",fontFamily:"Inter,sans-serif",fontSize:10,color:t.textFaint,flexShrink:0}}>
        {filtered.length} item{filtered.length!==1?"s":""}{search?` matching "${search}"`:""}</div>

      <div style={{flex:1,overflowY:"auto",padding:"4px 12px 14px"}}
        ref={el=>{if(el){el.style.setProperty("--sb-thumb",t.accent);el.style.setProperty("--sb-track",t.panelBg);}}}>
        {filtered.length === 0 && (
          <p style={{color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:12,textAlign:"center",marginTop:24}}>{search?`No results for "${search}"`:tab==="all"?"Nothing here yet.":"No "+tab+" content yet."}</p>
        )}
          {filtered.length > 0 && filtered.map(item => {
              const plain = stripTags(item.output||"");
              const snip = search ? (()=>{const idx=plain.toLowerCase().indexOf(search.toLowerCase());if(idx<0)return null;return"..."+plain.slice(Math.max(0,idx-20),idx+80)+"...";})() : null;
              const mc = MODE_COLORS[item.modeId] || "#888";
              const meta = histItemMeta(item);
              return (
                <div key={item.id} style={{background: loadedId===item.id ? `${mc}14` : t.surface, border:`1px solid ${loadedId===item.id ? mc : t.panelBorder}`,borderLeft:`3px solid ${mc}`,borderRadius:6,padding:"5px 8px",marginBottom:4,transition:"background 0.2s,border-color 0.2s",display:"flex",alignItems:"center",gap:7}}>
                  <HistTabIcon type={item.modeId} color={mc} size={11}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:1}}>
                      <span style={{fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:600,color:t.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1}}>{item.title}</span>
                    </div>
                    <span style={{fontFamily:"Inter,sans-serif",color:t.textFaint,fontSize:9}}>{item.modeLabel}{meta?` · ${meta}`:""} · {new Date(item.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                  </div>
                  <button onClick={()=>onLoad(item)} style={{padding:"3px 9px",background:loadedId===item.id?"transparent":t.accentGrad,border:loadedId===item.id?`1.5px solid ${mc}`:"none",borderRadius:4,color:loadedId===item.id?mc:"#fff",fontFamily:"Inter,sans-serif",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                    {loadedId===item.id?"✓":"Load"}
                  </button>
                  <button onClick={()=>setConfirmId(item.id)}
                    style={{padding:"3px 7px",background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:4,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:10,cursor:"pointer",flexShrink:0}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#c04030";e.currentTarget.style.color="#c04030";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=t.panelBorder;e.currentTarget.style.color=t.textMuted;}}>
                    ✕
                  </button>
                </div>
              );
            })
        }
      </div>

      {confirmId && (
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:t.panelBg,border:`1.5px solid ${t.accent}`,borderRadius:10,padding:24,width:270,textAlign:"center"}}>
            <p style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:16,fontWeight:700,margin:"0 0 6px"}}>Delete this?</p>
            <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,margin:"0 0 18px"}}>Cannot be undone.</p>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmId(null)} style={{flex:1,padding:"8px 0",background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:6,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:12,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{onDelete(confirmId);setConfirmId(null);}} style={{flex:1,padding:"8px 0",background:"#c03020",border:"none",borderRadius:6,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN MODES CONFIG ────────────────────────────────────────────────────────
const MAIN_MODES = [
  { id:"outline",      label:"Outline",       isEditor:true,  isChat:false, desc:"Tight structured outline with 5 title ideas.", placeholder:"Drop a scripture, theme, or idea...\n\nExamples:\nJohn 11\nIdentity in Christ\nRomans 8:28", btnLabel:"Build the Outline",      system:OUTLINE_SYSTEM,      outputTitle:"Your Outline",            userMsg:i=>`Create a sermon outline for: ${i}` },
  { id:"manuscript",   label:"Manuscript",    isEditor:true,  isChat:false, desc:"Every word. Ready to preach.", placeholder:"Paste your outline here or drop a scripture or theme...", btnLabel:"Write the Manuscript",   system:MANUSCRIPT_SYSTEM,   outputTitle:"Your Manuscript",         userMsg:i=>`Write a full word-for-word sermon manuscript for: ${i}` },
  { id:"illustration", label:"Illustrations", isEditor:false, isChat:true,  desc:"Killer illustrations plus follow-up chat.", placeholder:"Topic or passage?\n\nExamples:\nForgiveness\nJohn 4\nSurrender", btnLabel:"Generate Illustrations", system:ILLUSTRATION_SYSTEM, outputTitle:"Your Illustrations",     userMsg:i=>`Generate killer sermon illustration ideas for: ${i}` },
  { id:"theology",     label:"Deep Study",    isEditor:false, isChat:true,  desc:"Seminary-level study with tabbed sections.", placeholder:"What do you want to study?\n\nExamples:\nThe nature of grace\nJohn 1:1\nAtonement theories", btnLabel:"Run the Deep Study", system:THEOLOGY_SYSTEM, outputTitle:"Your Theological Study", userMsg:i=>`Conduct a thorough theological study on: ${i}` },
];


// ─── KODY'S REAL SERMONS (pre-loaded into history) ─────────────────────────
const KODY_SERMONS = [
  // ── FULL SERMON 1: ONE GOD THREE ROLES ZERO CONFUSION ─────────────────────
  {
    id:"kody-sermon-trinity", timestamp:1700000010000, modeId:"manuscript", modeLabel:"Manuscript",
    title:"One God. Three Roles. Zero Confusion. (Trinity)",
    length:"40",
    input:"One God Three Roles Zero Confusion — Trinity, Matthew 28:19-20, Father Son Holy Spirit, identity, relationship with God",
    output:`<HEADER>ONE GOD. THREE ROLES. ZERO CONFUSION.</HEADER>

[GUEST SPEAKING OPENER]
Church family! What is up?! Man it is so good to be back here with you. It has been a minute — I feel like that cousin who shows up only for weddings and baptisms but shows up like we have been best friends forever.

If this is your first time here and you are looking at me like "who is this guy and why does he look like some of the other people here?" — that is fair. My name is Kody. I am a pastor at GFC. [MENTION: my brother, my dad if present.] I am a husband to the most amazing wife, Madii. I am a dad to three beautiful kids — which means I am permanently tired.

Back home I am a youth pastor. Which means I speak fluent Gen Z, have a PhD in pizza ordering, and I know way more about Minecraft than any human my age should.

I love God, I love people, and I love the Church. And I am genuinely honored to be here today.

Before we dive in — can we take a second to honor your pastor and leaders here? Come on, give them a big shout. This is a special church. God is clearly doing something here and you are part of it.

<SCRIPTURE ref="Matthew 28:19-20 (NIV)">Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age. (Matthew 28:19-20, NIV)</SCRIPTURE>

[Pray briefly]

I want to preach from this thought today: One God. Three Roles. Zero Confusion.

<JOKE>Have you ever tried to explain something and immediately regretted it? That is the Trinity. It is like explaining TikTok to your grandma. "Okay so people dance, but sometimes it is about cooking, but also it is political, but also it is cats, but also —" You have lost her. Or trying to explain taxes to a 7-year-old. "Well you make money but you do not get to keep all of it and the government takes some and —" "Why?" "I do not even know anymore." Or trying to explain your Starbucks order. "Yeah I will have a half-sweet iced oat milk shaken espresso, but make it blonde, extra cold foam, 2 pumps of grace, 1 pump of forgiveness." Bro. It is just coffee.</JOKE>

That is what it can feel like when someone asks "what is the Trinity?" One God. Three Persons. But not three Gods. And not one person just playing three roles. Yeah. Exactly.

Here is the thing — just because it is hard to explain does not mean it is not essential to understand.

Most of us have heard about the Trinity. Father, Son, Spirit. But if we are honest, we either avoid thinking about it because it feels too complicated, or we have a version in our head that is just wrong.

And here is why this matters: If you do not really know who God is, you will never fully love or trust Him.

Think about this. Most people say they believe in God. They will even say "God is love." But how could God be love before creation if there was no one to love? Love requires relationship. And from eternity — before the world was created — God was not lonely. He was complete. Father, Son, and Holy Spirit — loving, glorifying, serving each other perfectly. God is not a solo act. He is a community. And here is the crazy part — He is inviting us into that community. That is the heart of the Gospel.

So today I want to break it down simply. Three roles. How each one changes your life. Let's go.

<HEADER>1. THE FATHER — THE SOURCE OF LOVE</HEADER>

Let's start with one of the most well-known passages in the Bible. Do not zone out just because you have heard it before.

<SCRIPTURE ref="John 3:16-17 (NIV)">For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. For God did not send his Son into the world to condemn the world, but to save the world through him. (John 3:16-17, NIV)</SCRIPTURE>

Slow that down. "For God so loved." That is the starting point. The Father is the origin of this entire story.

Before the manger. Before the cross. Before the empty tomb. There was a Father who loved His kids so much that He gave. He initiated the rescue plan. He made the first move. He is not a passive observer — He is the source of the mission.

Let me be real with you. That word "Father" hits different for people in this room.

Some of you hear that word and feel comfort. Security. Warmth.

Others hear it — and it is complicated. Because your earthly father was absent. Or angry. Or emotionally shut down. Or just never really there. And without realizing it, maybe you projected all of that onto God. You started believing He is distant. Unpredictable. Impossible to please. Like He is always waiting for you to mess up.

But hear me today: God is not the reflection of your earthly father. He is the perfection of what a Father should be.

He is not moody. He is not distracted. He is not emotionally unavailable. He is not waiting for you to prove something. He is present. He is tender. He is consistent. He is generous. He is protective. And most of all — He is loving.

We often stop at verse 16. But look at what 17 says! "God did not send His Son into the world to condemn the world, but to save the world through Him." Some of us need to let that verse wreck our picture of God. Because for too long we have believed He is more interested in condemnation than compassion.

That is not the heart of the Father.

He did not send Jesus to point fingers. He sent Jesus to open arms. He is not waiting to punish you. He is longing to restore you.

When you see God as Judge, you will hide from Him when you mess up. When you see Him as Father, you will run to Him — especially when you mess up. Because you know you are not coming to a courtroom. You are coming home.

You are a son. You are a daughter. You are chosen. You are deeply loved by a perfect Father.

And that love? It did not stay distant. His love moved. Because He sent the Son.

He did not send a letter. He came Himself. The Father's love sent the Son — but the Son did not just deliver a message. He became the message.

<HEADER>2. THE SON — THE WAY TO THE FATHER</HEADER>

<SCRIPTURE ref="John 14:6-7 (NIV)">Jesus answered, I am the way and the truth and the life. No one comes to the Father except through me. If you really know me, you will know my Father as well. From now on, you do know him and have seen him. (John 14:6-7, NIV)</SCRIPTURE>

Let me just say this: that is either the most arrogant thing anyone has ever said — or it is the most important truth in the history of humanity.

Jesus is not offering advice. He is not suggesting a path. He is declaring reality. "I am the way. I am the truth. I am the life." Not a way. Not one of many truths. Not a life philosophy. THE way. THE truth. THE life.

And the point of Jesus — is not just Jesus. It is to get us back to the Father. That is what sin broke in the garden. Relationship with the Father. That is what Jesus came to restore.

God put on skin. Born in a barn. Walked dirty roads. Probably got leg cramps. Got hungry. Felt tired. Experienced grief. Took on betrayal, pain, temptation — and still did not sin. Why? So you and I could see what God is like.

Jesus is not God's representative. He is God revealed.

<SCRIPTURE ref="Colossians 1:15 (NIV)">He is the image of the invisible God. (Colossians 1:15, NIV)</SCRIPTURE>

But here is where a lot of people miss it. We reduce Jesus to a historical figure. A good man. A wise teacher. A peaceful activist. Someone who said cool things and wore sandals.

And Jesus was kind and wise and had incredible one-liners. But He did not come just to teach us how to be nicer people. He came to make us new people.

This is not about religion. This is not about rules. This is not about "try harder, do better, behave right." This is about relationship. Following Jesus is not about checking off spiritual boxes. It is about walking with a Person.

But you might be thinking — "Wait, did not Jesus go back to heaven? Did He not ascend?" Yes. He did. He returned to the Father. So the question is: if Jesus is not physically here, how is God still with us? How do we walk with Him, hear from Him, be led by Him?

That is where the Holy Spirit comes in.

<HEADER>3. THE HOLY SPIRIT — GOD WITH US, IN US</HEADER>

<SCRIPTURE ref="John 14:16-17 (NIV)">And I will ask the Father, and he will give you another advocate to help you and be with you forever — the Spirit of truth. The world cannot accept him, because it neither sees him nor knows him. But you know him, for he lives with you and will be in you. (John 14:16-17, NIV)</SCRIPTURE>

Pause with me.

If you have ever felt like God was far away — if you have ever thought "I believe in God but I do not feel close to Him" — this is the good news you have been waiting for.

Jesus is saying: I am going away. But I am not leaving you alone.

The same Spirit that raised Jesus from the dead is now being given to you. Not just to be with you — but to be in you. Come on, that is wild.

But let's be honest. Out of all three persons of the Trinity, the Holy Spirit is the one that makes people the most uncomfortable.

We are good with God the Father. That is safe. We are good with Jesus. Everybody loves Jesus. We have got the bracelets. WWJD. But the Holy Spirit? That is where people start getting twitchy. "Oh no, here comes the weird part."

Some of us grew up in churches where the Holy Spirit was never mentioned. Some of us grew up in churches where the Holy Spirit was the ONLY thing mentioned. But listen — the Holy Spirit is not a ghost to fear. He is God's presence to treasure.

He is fully God — eternal, powerful, personal. And Jesus says He is your Advocate. That word means helper, counselor, comforter, guide.

When you do not know what to do? The Spirit guides. When you feel overwhelmed? The Spirit comforts. When you feel spiritually dry? The Spirit fills. When you are ready to give up? The Spirit strengthens.

Too many of us are trying to follow Jesus without the power of the Holy Spirit. And it is exhausting.

<ILLUSTRATION>It is like trying to drive a car with no gas. You might be in the right lane — but you are not going anywhere.</ILLUSTRATION>

But when the Holy Spirit fills you, you get new strength. New joy. New perspective. New boldness. New peace. You stop striving in your own strength and start walking in His.

You were never meant to live the Christian life on willpower. You were meant to live it by His power.

<HEADER>4. THE TRINITY INVITES US IN</HEADER>

The Father loves you. The Son saves you. The Spirit lives in you.

And when you put it all together — here is the big truth: The Trinity shows us that God is love, God is near, and God is for us.

He is a relational God — a community of love — inviting us in.

<STORY ref="izzy-rsv">About six years ago, when my son Izzy was just six months old, he got really sick. RSV — which for adults might feel like a bad cold — can be really dangerous for infants. We rushed him to the hospital. They hooked him up to IVs, machines. There he was, this tiny little body, tubes everywhere, and there was nothing I could do. No sermon could fix it. I could not lead my way out of it. I was just a dad, desperate. And in that moment, sitting in a stiff hospital chair next to his crib, I felt a peace that made absolutely no sense. The doctors did not say anything reassuring. The circumstances did not change. But something in me did. It was not loud. It was not flashy. It was steady. I felt the love of the Father holding me — like, "I see you. I see him. I am here." I thought about the Son, Jesus — who suffered so that one day Izzy will never suffer again. And I knew the Spirit was right there in that room with us — giving me strength, whispering truth, reminding me, "You are not alone." That moment did not erase the pain. But it reminded me: God is real. God is near. And God is love. That is the Trinity.</STORY>

The Father loves you. The Son saves you. The Spirit lives in you.

All one God. Three roles. Zero confusion.

Here is the Gospel: You do not have to earn this. You do not have to fake your way into it. You do not have to get your life together first. Because of Jesus, you can step into the love of the Father and the presence of the Spirit — right now.

Salvation is not about working your way to God. It is about receiving the invitation He already gave you. And He is offering it today. Not to spectate. But to surrender.

[ALTAR CALL / SALVATION PRAYER — lead in slow, create space, do not rush]`
  },
  // ── FULL SERMON 2: SO LOVED ────────────────────────────────────────────────
  {
    id:"kody-sermon-soloved", timestamp:1700000011000, modeId:"manuscript", modeLabel:"Manuscript",
    title:"So Loved (John 3:16, Hosea and Gomer)",
    length:"25",
    input:"So Loved — John 3:16, Hosea and Gomer, God's unconditional love, midweek youth service",
    output:`<HEADER>SO LOVED</HEADER>

What is goin on everyone! You guys excited to be in church tonight? It has been so long since I have been in a live service. Go ahead right now and turn to someone and tell them you are so glad you are sitting next to them tonight!

[STAGE DIRECTION: Big energy. Let the room warm up.]

<JOKE>Now turn to the OTHER side. You know, your second choice. Give them an air five. Apparently you do not like them enough for them to be your first option.</JOKE>

Let's talk about Jesus a little bit tonight. Cool with you guys?

I started thinking this week — why do we love God? There are so many obvious reasons. He is always there for us. He protects us. He helps us. He blesses us. He does so much for us.

But when you boil it all the way down, it really comes to this one thing. The title. The only note you need to write down tonight: SO LOVED.

God SO loves you. God SO loves you. He cannot help himself. You know that, right? God does not have love. God does not do love. God IS love.

He is obsessed. John 3:16 does not just say "God loved the world." It says "God SO loves the world."

<STORY ref="dad-weird-al">Have you ever seen a dad or a mom with a bad case of the SO loves? They just SO love their kids. So much so that they are kind of embarrassing. I have one of those dads. He is the guy that thinks he is Weird Al. And he gets these songs stuck in his head, but he never remembers the actual words, so he always makes up his own. Nine out of ten times those songs are about my brothers and me and about how much he SO loves us. He will sing them anywhere. Through Walmart, at home, in church. Doesn't matter. He will take Hotline Bling — "you used to call me on my cell phone" — and he will sing "you used to sit up on dad's lap, we would always watch those games! Kody Kody I love you!" And it is great. I love the songs. But sometimes it is like — Dad, we are at church. People might think this is weird. My brother Sage was growing up playing baseball. Dad would be yelling at the umpire. "I don't care, hit it out of the park Sage!" He used to get thrown out. I would be at soccer running up and down the sidelines, never made a goal. Soccer is not my thing. Even at my golf matches you would swear Tiger Woods was playing. I was not that good but the way he cheered for me you would think I was. That is a dad with the SO loves.</STORY>

That is what God is like. He cannot stop watching. He cannot stop cheering. He will never stop loving.

Here is the thing. You could be sitting here tonight and say "I don't believe in God. Church is not my thing. Jesus who?" That is fine. I am just here to tell you — He will not ever stop. He is always going to be there. Why? Love. Love is the theme of life. Love is the theme of our existence. YOU are the thing of God's obsession. That scripture "God so loves the world" — that includes YOU.

<SCRIPTURE ref="John 3:16 (NIV)">For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. (John 3:16, NIV)</SCRIPTURE>

<HEADER>THE STORY OF HOSEA AND GOMER</HEADER>

About 750 years before God sent Jesus to solve the world's sin problem, God's unconditional love shows up on full display through a prophet named Hosea. He was one of the most famous people in Israel at the time. And God gave him one of the most embarrassing assignments in scripture.

God said: "Hosea. I want you to marry a prostitute." I would have been like — "God, I am pretty famous. There are a lot of people talking to me. I do not think I heard you right." "No. That is right. Marry a prostitute." So Hosea marries a woman named Gomer. Bummer of a name. She must not have been loved well.

For a while, things go really well. They have a baby boy, a baby girl, then another boy. Seems to be going great.

Then one morning Hosea wakes up and cannot find Gomer. Not in the bedroom. Not in the kitchen. Not in the living room. Not anywhere. She is gone.

Here is one of the most famous men in Israel — now a single dad with three kids. The embarrassment is real.

Eventually God comes back to Hosea and says: "Here is the plan. Go find her. And marry her again." What? "Yeah. Go find her."

<SCRIPTURE ref="Hosea 3:1 (NKJV)">Then the Lord said to me, Go again, love a woman who is loved by a lover and is committing adultery, just like the love of the Lord for the children of Israel. (Hosea 3:1, NKJV)</SCRIPTURE>

So Hosea goes down to the red light district. A holy man. A seer. A prophet. Walking through places a man of God should not be. Asking around — "Hey, have you seen my wife?" "Uh... yeah I saw her a couple days ago. My bad man, I didn't know you two were still together." "Yeah, it is cool. Do you know where she is?" "Last I saw her was a couple streets down. Hey good luck with that." "Yeah. Thanks."

He finally finds her. She is on the selling block. Being auctioned off in the sex slave industry. He walks in on the auction. His wife. "Excuse me sir, that is my wife." "I don't care who you say she is, she's mine and she's for sale."

What was that like for Gomer? She probably cannot even look at him. She never thought he would come here. And yet — he outbids everyone. He pays 15 pieces of silver and 5 bushels of barley. Then he says to her: "You shall stay with me."

Wait a second Hosea. She is already yours. "I know. But I will pay for what is already mine."

The Bible says "For the earth is the Lord's and the fullness thereof" — yet God sends His Son to spill His blood on the cross to pay for what is already His. We are already His. Just in case you did not know. YOU are already His.

<ONELINER>Hosea means Salvation. Gomer means Completion. Who is Hosea? That is our God. Who is Gomer? Me. And you.</ONELINER>

When Jesus is sitting with tax collectors and sinners in Matthew 9, the religious leaders say "why do you eat with such bad people?" And Jesus — who knew they would have known Hosea's story — quotes it back to them: "Go and learn what this means: I desire mercy and not sacrifice. For I have not come for those who think themselves righteous, but for those who know they are lost and desperate." He is saying: I AM your Hosea. I will go. I will look. I will search. I will pay whatever it costs. For you.

<STORY ref="kody-called-as-youth-pastor">I grew up a pretty good kid. Third generation pastor. I always thought — I don't have that super crazy testimony. What does God have to save me from? But I realized: even though I was a good person, I am Gomer. And if it had not been for Jesus paying the price for me, I am doomed. And God had a plan I did not expect. I was saving up to go to Hillsong Australia. The weather is perfect, they dress like me. Then Pastor Nate got his promotion, and Pastor Bobby called me personally. He said, "Your dad told me you'd say no because you're going to Australia. But I want to ask you personally to lead this youth ministry." I had about a week and a half to decide. I struggled — but Australia. And Kody, you are only 20. Nobody is going to listen to you. You are not ready. But I spent every minute I could in prayer, worship, getting input from my mentors. And I had this feeling — this is where God wants me. God changed my plans. And on the long 2-hour drive back from Lakeland one night, I actually started crying. Manly tears. Definitely not safe. But I could so clearly feel God ask me: "Would you go after Gomer if I asked you to?" And He said — "Kody. You are a Hosea. But you are also Gomer."</STORY>

Will you allow God to step into your life and be your Hosea? He has so loved us. So we ought to love Him. Love one another. Love the world. That is why we are here.

[ALTAR CALL — every head bowed, every eye closed]`
  },
  // ── FULL SERMON 3: RHYTHM OF CONVICTION AND CONFESSION ────────────────────
  {
    id:"kody-sermon-conviction", timestamp:1700000012000, modeId:"manuscript", modeLabel:"Manuscript",
    title:"The Rhythm of Conviction and Confession (1 John 1:9)",
    length:"25",
    input:"The Rhythm of Conviction and Confession — 1 John 1:9, repentance, sanctification, youth midweek, new year",
    output:`<HEADER>THE RHYTHM OF CONVICTION AND CONFESSION</HEADER>

Hey United, so glad you are here tonight. New year, new classes, new teachers. Unless you are homeschooled — then it is still your mom. Ha!

[STAGE DIRECTION: Welcome all campus locations — Land O Lakes, Carrolwood, Temple Terrace, Ybor, South Tampa, Clearwater, Suncoast, Lutz]

Last week Pastor Nate did an incredible job talking about the rhythm of picking up your cross. That daily decision to follow Jesus. That message is the foundation for everything in our walk with God. But tonight I want to ask a different question: what happens AFTER we make that decision? What happens when we are trying to walk out our faith and we stumble? What is the rhythm for the moments when we mess up?

Because if we are honest — all of us do.

<STORY ref="golf-cart-garage-door">I need to tell you about the first time I drove a car. Okay, technically it was a golf cart. But still. I thought I was a natural. Gas pedal. Brake pedal. Steering wheel. Easy. First time out I had the windows down, pretending I was going to pick up a date. Feeling confident. And then I drove full speed straight through a garage door. Not gently. Full send. Everyone inside thought the rapture was happening. My dad came running out like WHAT ARE YOU DOING. Dad, I am only in 4th grade. I was in a golf cart. Good news: that was not our house. Bad news: my parents still got the bill. The worst part? I now have PTSD. I grew up playing golf. Golf carts everywhere. Another swing, another flashback. I eventually figured it out. I learned to drive. But I did not get better by pretending the garage door got in my way. I got better by admitting: yeah, I messed that up. By listening to correction. By adjusting.</STORY>

How often do we do that in our walk with God? We make a mistake and we tell ourselves it is okay.
You post something on Instagram you know you should not — "It is not that bad, it is just a joke."
You copy someone's homework — "It is just this once." This is the fifth time this week.
You blow up at your parents — "They don't understand me."
You sneak out. You click on what you should not click on. You justify it.

You do not grow by pretending the wrong things are fine. You grow by being honest, letting God correct you, and adjusting your direction.

God saved us — which is amazing. But His plan does not stop there. We are not just saved from our sin. We are being made into something new. We are being made to look more and more like Jesus.

That process has a rhythm. And that rhythm is what we are talking about tonight.

If we want a changed life, we have got to step into: the rhythm of conviction and confession.

For a lot of people, the words "conviction" and "confession" sound heavy and negative. You might think conviction is God being disappointed, and confession is just an embarrassing list of all your failures.

But that is not true. That is not God's heart.

Conviction is not about shame — it is about love. It is a sign that God loves you too much to leave you where you are. He has not given up on you.

And confession is not about punishment — it is about purification. It is how we agree with God and let Him change us so we can keep moving forward without the weight holding us back.

Without this rhythm, we get stuck in one of two traps: Either we live in denial, acting like our sin is not a big deal. OR we live in shame, believing our sin is bigger than God's grace. Both are lies from the enemy.

God's plan is so much better. His plan is freedom. And this is how it works:

God convicts. We confess. God cleanses.

<HEADER>1. GOD CONVICTS US</HEADER>

Conviction is the work of the Holy Spirit in our hearts making us aware of sin. You ever get that feeling like — oh man, I should not have done that? That is the Holy Spirit.

<ILLUSTRATION>Think of it like a GPS. You take a wrong turn. Apple Maps does not shame you. It does not say "how could you miss that turn." It just says — recalculating. Make the next U-turn. The destination you want is the other direction. That is what conviction is. God saying: reroute. This is not the best path. Turn here.</ILLUSTRATION>

<SCRIPTURE ref="John 16:8 (ESV)">And when he comes, he will convict the world concerning sin and righteousness and judgment. (John 16:8, ESV)</SCRIPTURE>

When you feel that check in your spirit, do not run from it. See it as an invitation from God to draw closer to Him and get back on the right path.

<HEADER>2. WE CONFESS TO HIM</HEADER>

Confession is our response to God's conviction. The word "confess" in the Bible literally means to say the same thing — to agree with. When we confess our sin, we are simply agreeing with God. We are saying: God, you are right.

<SCRIPTURE ref="1 John 1:9 (NIV)">If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness. (1 John 1:9, NIV)</SCRIPTURE>

Confession is not a vague "God, sorry for everything." It is real and specific. God, I agree that my attitude toward my parents was dishonoring. God, I agree that the gossip was hurtful and wrong. God, I agree I should not have gone there.

The conviction leads us to confession. And confession — that is where the change takes place.

<HEADER>3. GOD CLEANSES US</HEADER>

Look at that verse again. The promise of 1 John 1:9 is not just that we are forgiven — but that we are purified. Cleaned. Changed.

<ILLUSTRATION>Think about it like this. You spill Coke all over your friend's white hoodie. Forgiveness says "you don't owe me for ruining the hoodie." But cleansing? Cleansing says "let's actually get that stain out so you can wear it again." Forgiveness takes away the guilt. Cleansing takes away the grip sin has on you.</ILLUSTRATION>

<SCRIPTURE ref="2 Corinthians 3:18 (NIV)">And we all, who with unveiled faces contemplate the Lord's glory, are being transformed into his image with ever-increasing glory. (2 Corinthians 3:18, NIV)</SCRIPTURE>

It is not overnight. It is step by step. Day by day. Rhythm by rhythm.

The anger that used to own you starts losing its control. The lust that used to call your name starts losing its grip. The gossip you used to thrive on starts to taste bitter instead of sweet.

God does not just forgive you and leave you stuck in the same habits. When you confess, He does not only forgive you — He starts changing you from the inside out.

The rhythm is simple. It is not a rhythm of shame. It is a rhythm of grace.
God convicts. We confess. God cleanses.

This is the rhythm of sanctification. This is how we become more like Jesus.

[ALTAR CALL — leaders up front, space to confess and receive freedom, close in prayer]`
  },
  // ── FULL SERMON 4: WHEN GOD'S TAKING TOO LONG ────────────────────────────
  {
    id:"kody-sermon-waitingongod", timestamp:1700000013000, modeId:"manuscript", modeLabel:"Manuscript",
    title:"When God's Taking Too Long (David, Waiting, Character)",
    length:"40",
    input:"When God's Taking Too Long — waiting on God, David and Goliath, 1 Samuel 16-24, character before crown, trust, surrender, AI culture",
    output:`<HEADER>WHEN GOD'S TAKING TOO LONG</HEADER>

Hey United, y'all feeling good tonight? Come on, if you are excited to be in church make some noise! If you love Jesus, make even more noise! Man, I love this place. I love that every week God meets us here.

[STAGE DIRECTION: Shout out all campus locations — Land O Lakes, Carrolwood, Temple Terrace, Ybor, South Tampa, Clearwater, Suncoast, Lutz]

<STORY ref="texas-roadhouse-rolls">So the other day I am at Texas Roadhouse. I ordered rolls. You know, the holy bread straight from heaven? They said twenty minutes. I said cool. Y'all — twenty minutes for eight rolls. That is like two and a half minutes per roll. I started questioning if they were growing the wheat in the back. I was about to go help them out in the kitchen. You know what the worst feeling in the world is? Waiting for something you can already see exists. It is right there. Other people are getting it. But yours has not come yet.</STORY>

Let's be honest — how many of you hate waiting?

<JOKE>If you are texting your friend and you see those bubbles pop up and then leave, you jump right to thinking about making new friends. Or if Netflix starts buffering and you are like — Lord, test me in every area but this one. Or you order something from Amazon and get mad when it does not show up same day.</JOKE>

We live in a culture that worships speed. Fast food. Fast Wi-Fi. Fast answers. And because of AI, it is getting worse. You can ask ChatGPT to write your essay, generate a song, fake your voice for a voicemail. You do not have to think, just type. You do not have to wait, just click.

But here is the danger — AI has trained us to believe instant is normal. The more we depend on it, the less we develop patience. And that mindset of fast, instant, now is creeping into our faith.

We want God to answer like Google. We want spiritual growth with two-day delivery.

But God does not work like that. He is not artificial. He is authentic. And authentic growth always takes time. Because God is not trying to give you something fast. He is trying to help you grow strong.

Waiting is where God grows character.

I want to look at the life of David. A man I think waited well. And there are four things from his life that can help us wait well too.

<HEADER>1. GOD CALLS YOU BEFORE YOU ARE READY</HEADER>

Israel was in a mess. Their current king, Saul, had started doing things his way instead of God's way. So God sends the prophet Samuel on a mission: "Go to Bethlehem. To a man named Jesse. One of his sons is going to be the next king."

Samuel shows up. Jesse lines up all his sons. The tall ones. The strong ones. The ones who look like they belong on a magazine cover. And one by one God says: "Nope. Not him. Not him either."

Samuel is confused. "Jesse, is this all you got?" "Well, there is David. But he is just the kid watching the sheep."

They bring David in — dirt on his hands, probably smells like sheep — and God tells Samuel: "That's the one. Anoint him."

<SCRIPTURE ref="1 Samuel 16:13 (NIV)">So Samuel took the horn of oil and anointed him in the presence of his brothers, and from that day on the Spirit of the Lord came powerfully upon David. (1 Samuel 16:13, NIV)</SCRIPTURE>

David was not ready to inherit what God had for him.

That is the moment we would expect the music to hit, the robe to go on, the crown to be placed. But instead — David goes right back to the pasture. No palace. No throne. Just sheep.

God's call was real. But David's character was not ready yet.

<ONELINER>The anointing came fast. The appointing came slow.</ONELINER>

God often shows you your future early so He can work on your heart before you get there. If God gave you everything you are praying for right now, it might not bless you — it might break you.

<HEADER>2. GOD TRAINS YOU IN HIDDEN PLACES</HEADER>

For a while David's life is just this: taking care of sheep, playing music, learning how to lead when nobody is following him.

Then one day his dad Jesse tells him — "Hey, go take some food to your brothers on the battlefield." David shows up basically just bringing DoorDash to the front lines. And while he is there, he hears this massive guy named Goliath trash-talking God's people. Everyone else is frozen. Soldiers who have trained for battle their whole lives are terrified.

But David? He is like — "Who is this guy talking about my God like that?"

<SCRIPTURE ref="1 Samuel 17:34-36 (NIV)">But David said to Saul, Your servant has been keeping his father's sheep. When a lion or a bear came and carried off a sheep from the flock, I went after it, struck it and rescued the sheep from its mouth. (1 Samuel 17:34-35, NIV)</SCRIPTURE>

David has been out there wrestling bears and lions with his bare hands. Nobody is posting about it. He did not have ChatGPT to ask "what is the lion's weakness?" Nobody is cheering him on. Nobody is even there. But God was watching.

So by the time Goliath shows up — David does not flinch. Because this is not his first fight. He had already seen God show up in private, so he could trust Him in public.

<ILLUSTRATION>Those are your hidden place moments. Nobody is hyping you up. Nobody is posting about you. But you keep showing up. Reading your Bible when nobody else is. Praying when your friends don't. Choosing to walk away from gossip when the group chat lights up. Honoring your parents even when they don't understand you. That is the hidden place. And God is watching every single moment of it.</ILLUSTRATION>

David swings the sling. The stone hits. Goliath drops. Victory.

Crowds are screaming his name. The king is impressed.

And you would think — surely now this is when David sits on the throne.

But no. Because even in victory, God still had more character to build.

<ONELINER>If you cannot stay humble after a win, you are not ready for a kingdom.</ONELINER>

<HEADER>3. GOD TESTS YOU THROUGH SERVING</HEADER>

<SCRIPTURE ref="1 Samuel 16:21-23 (NIV)">David came to Saul and entered his service. Saul liked him very much, and David became one of his armor-bearers. Whenever the spirit from God came on Saul, David would take up his lyre and play. Then relief would come to Saul; he would feel better, and the evil spirit would leave him. (1 Samuel 16:21-23, NIV)</SCRIPTURE>

Right after David is anointed, he ends up serving Saul. The same guy who is sitting in the seat God said would one day be his.

Think about that. You know you are called to lead, but God is asking you to serve. You know you are meant to build, but God is asking you to wait.

David could have said forget this. But instead he shows up. He plays the harp. He honors the person sitting in the position he was promised.

Because serving does not feel like progress — but God is not trying to hold you back. He is trying to build you up.

Before God lets you wear the crown, He will see if you can serve faithfully when it is sitting on someone else's head.

<HEADER>4. GOD SHAPES YOU IN SURRENDER</HEADER>

After Goliath, David goes from the palace to the wilderness. From crowds cheering his name to hiding in caves just trying to stay alive. Saul's insecurity turned into rage. Saul tries to kill him.

And it is there — in the darkness — that God begins shaping something even deeper.

<SCRIPTURE ref="1 Samuel 24:4-6 (NIV)">The men said, This is the day the Lord spoke of when he said to you, I will give your enemy into your hands for you to deal with as you wish. Then David crept up unnoticed and cut off a corner of Saul's robe. Afterward, David was conscience-stricken for having cut off a corner of his robe. (1 Samuel 24:4-5, NIV)</SCRIPTURE>

David creeps up. Blade in hand. His friends whisper — "This is it. God gave him to you." He cuts off a piece of Saul's robe instead of his head. And he walks away convicted. Even that small act felt wrong.

He knew: if I have to compromise to get something, I will have to compromise to keep it.

The test was not about killing Saul. It was about killing the impatience. It was about surrendering the timeline to God.

[VISUAL MOMENT — if applicable, walk to the throne prop, pick up the crown]

This represents your calling. Your dream. For some of you it is ministry. For some it is music, sports, leadership, a future marriage, a career that changes lives. That thing inside you that says — I know I am made for more.

And if you are anything like me, you have thought: I do not want to wait anymore. I want the influence now. The platform now. The relationship now. The reward now.

[Pause. Set the crown back down.]

But God is saying — you are not ready to wear the crown yet. I have still got character to build.

Because if He gave you the crown before He built your heart, the crown would not bless you. It would crush you.

The waiting was not punishment for David. It was preparation.

And here is the flip — David's story is really pointing to another King. His name is Jesus. And His crown was not made of gold. It was made of thorns. He did not rush to a throne. He carried a cross. He waited in silence for three days so that you could live forever in grace.

Maybe tonight you have been chasing your own crown. Trying to force something that is not ready yet. But God is saying: let Me build you before I bless you.

You do not have to make it happen. You do not have to control it. You just have to trust Him.

God loves you. Sin separates you. Jesus saves you. And tonight — you have an opportunity to surrender.

[ALTAR CALL]`
  },
];


// ─── STORIES PANEL ────────────────────────────────────────────────────────────
const KODY_STORIES = [
  {
    id:"ks-izzy-rsv",
    title:"Izzy in the Hospital (RSV)",
    category:"power",
    tags:"Trinity, Holy Spirit, Father, faith in crisis, prayer, peace, hospital, family",
    content:"About six years ago, when my son Izzy was just six months old, he got really sick. RSV — which for adults might feel like a bad cold — can be really dangerous for infants. We rushed him to the hospital. They hooked him up to IVs, machines. There he was, this tiny little body, tubes everywhere. And there was nothing I could do. No sermon could fix it. I could not lead my way out of it. I was just a dad, desperate. And in that moment, sitting in a stiff hospital chair next to his crib, I felt a peace that made absolutely no sense. The doctors did not say anything reassuring. The circumstances did not change. But something in me did. It was not loud. It was not flashy. It was steady. I felt the love of the Father holding me — like, I see you. I see him. I am here. I thought about the Son, Jesus — who suffered so that one day Izzy will never suffer again. And I knew the Spirit was right there in that room with us — giving me strength, whispering truth, reminding me, you are not alone. That moment did not erase the pain. But it reminded me — God is real. God is near. And God is love."
  },
  {
    id:"ks-golf-cart",
    title:"Golf Cart Through the Garage Door",
    category:"funny",
    tags:"mistakes, conviction, correction, growth, learning, humility, 4th grade, golf cart",
    content:"I need to tell you about the first time I drove a car. Okay, technically it was a golf cart. But still. I thought I was a natural. Gas pedal. Brake pedal. Steering wheel. Easy. First time out I had the windows down, pretending I was going to pick up a date. Feeling confident. And then I drove full speed straight through a garage door. Not gently. Full send. Everyone inside thought the rapture was happening. My dad came running out like WHAT ARE YOU DOING. Dad, I am only in 4th grade. I was in a golf cart. Good news: that was not our house. Bad news: my parents still got the bill. The worst part? I now have PTSD. I grew up playing golf. Golf carts everywhere. Another swing, another flashback. I eventually figured it out — but I did not get better at driving by pretending the garage door got in my way. I got better by admitting: yeah, I messed that up. By listening to correction. By adjusting."
  },
  {
    id:"ks-dad-weird-al",
    title:"Dad's Weird Al Songs (The So Loves)",
    category:"funny",
    tags:"God's love, Father, family, unconditional love, embarrassing dad, so loved",
    content:"Have you ever seen a dad or a mom with a bad case of the SO loves? They just SO love their kids. So much so that they are kind of embarrassing. I have one of those dads. He is the guy who thinks he is Weird Al. He gets these songs stuck in his head, but he never remembers the actual words, so he always makes up his own. Nine out of ten times those songs are about my brothers and me and about how much he SO loves us. He will sing them anywhere — through Walmart, at home, in church. He will take Hotline Bling — you used to call me on my cell phone — and sing: you used to sit up on dad's lap, we would always watch those games! Kody Kody I love you! It is great, I love the songs. But sometimes it is like — Dad, we are at church. When my brother Sage was playing baseball, Dad would be yelling at the umpire. The ump goes to our church, Dad! He didn't care. He used to get thrown out of games. I played soccer my whole life waiting for the day I made a goal — never happened, soccer is not my thing. Even at golf matches you would swear Tiger Woods was competing. I was not that good, but the way he cheered for me you would think I was. That is a dad with the SO loves. And that is exactly what I see when I read John 3:16."
  },
  {
    id:"ks-sage-basketball",
    title:"Sage's Basketball Tryouts (Shirt Off)",
    category:"funny",
    tags:"God's love, family, brother, cheering, identity, belonging",
    content:"I said I would never be that kind of embarrassing dad — because I am already that kind of brother. I took my brother Sage to his basketball tryouts when he was about 12. Little kid, really small at the time — now he is huge and honestly kind of intimidates me. It was just me, my friend, and about eight nannies in the stands. The kids were 12, missing layups, missing shots. Painful to watch when you love basketball. The scrimmage starts and nobody is passing to Sage. I am getting frustrated. I start yelling things like — you would be winning if you gave it to your best player. Finally somebody passes it to Sage. He is double-teamed, four feet behind the three-point line. I yell SAGE SHOOT IT. I do not know if he heard me or if it was just his sheer dominance, but he turns around and throws it up. Everything went into slow motion. Somehow it goes in. I jumped out of my seat, ripped my shirt off, and started waving it around my head. I got in the faces of all eight nannies. THAT IS MY BROTHER. So yes. I might be that kind of father."
  },
  {
    id:"ks-texas-roadhouse-rolls",
    title:"Texas Roadhouse Rolls (Waiting)",
    category:"funny",
    tags:"waiting, patience, God's timing, trust, frustration, culture of speed",
    content:"So the other day I am at Texas Roadhouse. I ordered rolls. You know, the holy bread straight from heaven? They said twenty minutes. I said cool. Y'all — twenty minutes for eight rolls. That is like two and a half minutes per roll. I started questioning if they were growing the wheat in the back. I was about to go help them out in the kitchen. You know what the worst feeling in the world is? Waiting for something you can already see exists. It is right there. Other people are getting it. But yours has not come yet. That is exactly what it feels like waiting on God sometimes."
  },
  {
    id:"ks-calling-youth-pastor",
    title:"Called to Lead Youth — Gave Up Australia",
    category:"calling",
    tags:"calling, surrender, obedience, faith, youth ministry, God's plan, Hosea, Gomer, plans changing",
    content:"I grew up a pretty good kid. Third generation pastor. I always thought — I do not have that super crazy testimony. What does God even have to save me from? But I realized: even though I was a good person, I am Gomer. And if it had not been for Jesus paying the price for me, I am doomed. And God had a plan I did not see coming. I was saving up to go to Hillsong Australia. Sydney, perfect weather, they dress like me there. Then Pastor Nate got his promotion, and Pastor Bobby called me personally. He said — your dad told me you would say no because you are going to Australia, but I want to ask you personally to lead this youth ministry. I had about a week and a half to decide. I was wrestling: but it is Australia. And Kody, you are only 20. Nobody is going to listen to you. You are not ready. I spent every minute I could in prayer, worship, getting input from my mentors. And I had this feeling — this is where God wants me. He changed my plans. And I was still really scared. But on the long two-hour drive back from Lakeland one night, I actually started crying. Manly tears of course. Definitely not safe to drive. But I could so clearly feel God ask me: would you go after Gomer if I asked you to? And He said — Kody, you are a Hosea. But you are also Gomer."
  },
  {
    id:"ks-guest-speaking-opener",
    title:"Guest Speaking Opener Pattern",
    category:"faith",
    tags:"guest speaking, opener, introduction, church visit, PCC, meta",
    content:"Church family! What is up?! Man it is so good to be back here with you. It has been a minute — I feel like that cousin who shows up only for weddings and baptisms but shows up like we have been best friends forever. My name is Kody. I am a pastor at GFC. I am a husband to the most amazing wife, Madii. I am a dad to three beautiful kids — which means I am permanently tired. Back home I am a youth pastor, which means I speak fluent Gen Z, have a PhD in pizza ordering, and I know way more about Minecraft than any adult my age should. I love God, I love people, and I love the Church. And I am genuinely honored to be here today. Before we dive in — can we take a second to honor your pastor and leaders here? Come on, give them a big shout. This is a special church and you are part of it."
  },
  {
    id:"ks-father-wound",
    title:"The Father Wound (God Is Not Your Earthly Father)",
    category:"power",
    tags:"Father of God, Father wound, identity, healing, adoption, love, fatherlessness, prodigal",
    content:"That word Father hits different for people in this room. Some of you hear it and feel comfort. Security. Warmth. Others hear it — and it is complicated. Because your earthly father was absent. Or angry. Or abusive. Or emotionally shut down. Or just never really there. And without realizing it, maybe you projected all of that onto God. You started believing He is distant. Unpredictable. Impossible to please. Like He is always waiting for you to mess up. But hear me today: God is not the reflection of your earthly father. He is the perfection of what a Father should be. He is not moody. He is not distracted. He is not emotionally unavailable. He is not waiting for you to prove something. He is present, tender, consistent, generous, protective — and most of all, He is loving. When you see God as Judge, you will hide from Him when you mess up. When you see Him as Father, you will run to Him — especially when you mess up. Because you know you are not coming to a courtroom. You are coming home."
  },
  {
    id:"ks-hosea-gomer",
    title:"Hosea Goes to the Red Light District",
    category:"power",
    tags:"Hosea, Gomer, unconditional love, redemption, searching for the lost, Jesus as Hosea, salvation, So Loved",
    content:"God gives Hosea one of the most embarrassing assignments in scripture. He says — I want you to marry a prostitute. Hosea is one of the most famous men in Israel. A prophet, a holy man, a speaker for God. And God says — marry a prostitute. Her name is Gomer. They get married, have three kids, things are going well. Then one morning Hosea wakes up and cannot find her. Checks every room. She is gone. Single dad, three kids, the most embarrassing situation imaginable. Eventually God comes back and says — go find her. And marry her again. So Hosea has to go to the red light district. A holy man walking through places he should not be, asking around — hey, have you seen my wife? I wonder if some of the guys he asked knew her in a way he did not want to think about. He finally finds her on the selling block — being auctioned off in the sex slave industry. His own wife. He walks in, outbids everyone, pays 15 pieces of silver and 5 bushels of barley. Someone says — wait, she is already yours. I know. But I will pay for what is already mine. Hosea means Salvation. Gomer means Completion. We are already His. Just in case you did not know — you are already His. But He paid the price anyway. That is the gospel."
  },
];

const STORY_CATEGORIES = [
  { key:"all",   label:"All Stories" },
  { key:"power", label:"Power Stories" },
  { key:"funny", label:"Funny Stories" },
];

function StoriesPanel({ stories, onClose, onAdd, onDelete, t }) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [newStory, setNewStory] = useState({ title:"", category:"funny", tags:"", content:"" });
  const [expandedId, setExpandedId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const filtered = (stories||[]).filter(s => {
    if (tab !== "all" && s.category !== tab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (s.title||"").toLowerCase().includes(q)
      || (s.content||"").toLowerCase().includes(q)
      || (s.tags||"").toLowerCase().includes(q);
  });

  function submitAdd() {
    if (!newStory.title.trim() || !newStory.content.trim()) return;
    onAdd({ ...newStory, id:"story-"+Date.now(), timestamp:Date.now() });
    setNewStory({ title:"", category:"funny", tags:"", content:"" });
    setAdding(false);
  }

  const catColors = { funny:"#d4a84b", power:"#b07dd4" };
  const catColor = c => catColors[c] || t.accent;

  return (
    <div style={{...SS.flexColFull}}>
      <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${t.panelBorder}`,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontFamily:"Inter,sans-serif",color:t.text,fontSize:16,fontWeight:700}}>Story Bank</h3>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setAdding(true)} style={{background:t.accentGrad,border:"none",borderRadius:6,color:"#fff",cursor:"pointer",padding:"4px 10px",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700}}>+ Add</button>
            <button onClick={onClose} style={{background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:6,color:t.textMuted,cursor:"pointer",padding:"4px 10px",fontFamily:"Inter,sans-serif",fontSize:12}}>✕ Close</button>
          </div>
        </div>
        <div style={SS.posRel}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2.5" strokeLinecap="round" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search stories, tags, keywords..."
            style={{width:"100%",background:t.inputBg,border:`1px solid ${t.inputBorder||t.panelBorder}`,borderRadius:6,padding:"7px 10px 7px 30px",fontFamily:"Inter,sans-serif",fontSize:12,color:t.inputText,outline:"none"}}/>
          {search && <button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:t.textMuted,cursor:"pointer",fontSize:13}}>✕</button>}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${t.panelBorder}`,flexShrink:0}}>
        {STORY_CATEGORIES.map(c => {
          const isActive = tab===c.key;
          const col = c.key==="all" ? t.accent : catColor(c.key);
          return (
            <button key={c.key} onClick={()=>setTab(c.key)} style={{flex:1,padding:"8px 0",border:"none",borderBottom:isActive?`2.5px solid ${col}`:"2.5px solid transparent",background:"transparent",color:isActive?col:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:isActive?700:400,cursor:"pointer"}}>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Add story form */}
      {adding && (
        <div style={{padding:"12px 14px",borderBottom:`1px solid ${t.panelBorder}`,background:t.surface,flexShrink:0}}>
          <p style={{margin:"0 0 8px",fontFamily:"Inter,sans-serif",color:t.text,fontSize:13,fontWeight:700}}>New Story</p>
          <input value={newStory.title} onChange={e=>setNewStory(s=>({...s,title:e.target.value}))} placeholder="Story title *"
            style={{width:"100%",background:t.inputBg,border:`1px solid ${t.inputBorder}`,borderRadius:5,padding:"6px 9px",color:t.inputText,fontFamily:"Inter,sans-serif",fontSize:12,outline:"none",marginBottom:6}}/>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            {["funny","power"].map(c=>(
              <button key={c} onClick={()=>setNewStory(s=>({...s,category:c}))}
                style={{flex:1,padding:"5px 0",border:`1.5px solid ${newStory.category===c?catColor(c):t.panelBorder}`,borderRadius:5,background:newStory.category===c?`${catColor(c)}20`:"transparent",color:newStory.category===c?catColor(c):t.textMuted,fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {c==="funny"?"😂 Funny":"⚡ Power"}
              </button>
            ))}
          </div>
          <input value={newStory.tags} onChange={e=>setNewStory(s=>({...s,tags:e.target.value}))} placeholder="Tags (comma separated): grace, dad, basketball..."
            style={{width:"100%",background:t.inputBg,border:`1px solid ${t.inputBorder}`,borderRadius:5,padding:"6px 9px",color:t.inputText,fontFamily:"Inter,sans-serif",fontSize:12,outline:"none",marginBottom:6}}/>
          <textarea value={newStory.content} onChange={e=>setNewStory(s=>({...s,content:e.target.value}))} placeholder="Write the full story here *" rows={5}
            style={{width:"100%",background:t.inputBg,border:`1px solid ${t.inputBorder}`,borderRadius:5,padding:"7px 9px",color:t.inputText,fontFamily:"Inter,sans-serif",fontSize:12,outline:"none",resize:"vertical",marginBottom:8}}/>
          <div style={{display:"flex",gap:7}}>
            <button onClick={submitAdd} style={{flex:1,padding:"7px 0",background:t.accentGrad,border:"none",borderRadius:5,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save Story</button>
            <button onClick={()=>setAdding(false)} style={{padding:"7px 12px",background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:5,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:12,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{padding:"5px 14px 2px",fontFamily:"Inter,sans-serif",fontSize:10,color:t.textFaint,flexShrink:0}}>
        {filtered.length} stor{filtered.length!==1?"ies":"y"}{search?` matching "${search}"`:""}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"4px 12px 16px"}}>
        {filtered.length === 0
          ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:36,marginBottom:12}}>📖</div>
              <p style={{fontFamily:"Inter,sans-serif",color:t.textFaint,fontSize:13}}>{search?"No stories match your search.":"No stories yet. Upload your sermons or add one manually."}</p>
            </div>
          )
          : filtered.map(story => {
            const isExp = expandedId === story.id;
            const cc = catColor(story.category);
            const tags = (story.tags||"").split(",").map(t=>t.trim()).filter(Boolean);
            return (
              <div key={story.id} style={{background:t.surface,border:`1px solid ${t.panelBorder}`,borderLeft:`3px solid ${cc}`,borderRadius:6,padding:"5px 8px",marginBottom:4}}>
                {/* Compact row */}
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:cc,flexShrink:0,display:"inline-block"}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <span style={{fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:600,color:t.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"block"}}>{story.title}</span>
                    <span style={{fontFamily:"Inter,sans-serif",fontSize:9,color:t.textFaint}}>{story.category==="funny"?"Funny":"Power"}{tags.length>0?` · ${tags.slice(0,3).join(", ")}`:""}</span>
                  </div>
                  <button onClick={()=>setExpandedId(isExp?null:story.id)} style={{padding:"3px 8px",background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:4,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:9,cursor:"pointer",flexShrink:0}}>
                    {isExp?"▲":"▼ Read"}
                  </button>
                  <button onClick={()=>setConfirmId(story.id)} style={{padding:"3px 7px",background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:4,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:10,cursor:"pointer",flexShrink:0}}
                    onMouseEnter={e=>{e.currentTarget.style.color="#c04030";e.currentTarget.style.borderColor="#c04030";}}
                    onMouseLeave={e=>{e.currentTarget.style.color=t.textMuted;e.currentTarget.style.borderColor=t.panelBorder;}}>✕</button>
                </div>
                {/* Expanded content */}
                {isExp && (
                  <p style={{margin:"7px 0 2px",fontFamily:"Inter,sans-serif",color:t.text,fontSize:12,lineHeight:1.7,whiteSpace:"pre-wrap",borderTop:`1px solid ${t.panelBorder}`,paddingTop:7}}>{story.content}</p>
                )}
              </div>
            );
          })
        }
      </div>

      {confirmId && (
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:t.panelBg,border:`1.5px solid ${t.accent}`,borderRadius:10,padding:22,width:260,textAlign:"center"}}>
            <p style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:15,fontWeight:700,margin:"0 0 6px"}}>Delete this story?</p>
            <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,margin:"0 0 16px"}}>Cannot be undone.</p>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmId(null)} style={{flex:1,padding:"7px 0",background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:6,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:12,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{onDelete(confirmId);setConfirmId(null);}} style={{flex:1,padding:"7px 0",background:"#c03020",border:"none",borderRadius:6,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UPLOAD PANEL ─────────────────────────────────────────────────────────────
function UploadPanel({ onClose, t, onVoiceUpdated, onStoriesFound, onHistoryAdd }) {
  const [phase, setPhase] = useState("idle"); // idle | queued | processing | merging | done | error
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [results, setResults] = useState([]); // per-file results
  const [mergedProfile, setMergedProfile] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const fileRef = useRef(null);

  async function readFileText(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.onerror = () => rej(new Error("Failed to read file"));
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        r.readAsArrayBuffer(file);
      } else {
        r.readAsText(file);
      }
    });
  }

  function handleFileSelect(fileList) {
    const arr = Array.from(fileList);
    if (!arr.length) return;
    setSelectedFiles(arr);
    setPhase("queued");
    setResults([]);
    setMergedProfile(null);
  }

  async function processAll() {
    setPhase("processing");
    const allResults = [];
    const allVoiceObs = [];
    let totalStories = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setCurrentIdx(i + 1);
      setCurrentFile(file.name);

      try {
        const raw = await readFileText(file).catch(() => "");
        const clean = (typeof raw === "string" ? raw : "")
          .replace(/[^\x20-\x7E\n\r\t]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (clean.length < 50) { allResults.push({ file: file.name, status: "skipped", reason: "Too short" }); continue; }

        const text = clean.slice(0, 15000);
        const aiRaw = await callAI({
          system: BULK_ANALYZE_SYSTEM,
          messages: [{ role: "user", content: `File name: ${file.name}\n\nSermon text:\n${text}` }],
          maxTokens: 4000,
        });

        const jsonMatch = aiRaw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) { allResults.push({ file: file.name, status: "failed", reason: "No JSON response" }); continue; }
        const parsed = JSON.parse(jsonMatch[0]);

        // Save stories to Supabase
        if (parsed.stories?.length) {
          for (const story of parsed.stories) {
            const storyObj = {
              id: "story-upload-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
              title: story.title || "Untitled Story",
              text: story.text || story.content || "",
              tags: Array.isArray(story.tags) ? story.tags : (story.tags || "").split(",").map(t => t.trim()).filter(Boolean),
            };
            window.cloudStories.save(storyObj).catch(() => {});
            totalStories++;
          }
          if (onStoriesFound) onStoriesFound(parsed.stories.map(s => ({
            title: s.title, text: s.text || s.content || "",
            tags: Array.isArray(s.tags) ? s.tags : (s.tags || "").split(",").map(t => t.trim()).filter(Boolean),
          })));
        }

        // Save to sermon history
        const histItem = {
          id: "upload-" + Date.now() + "-" + i,
          timestamp: parsed.date ? new Date(parsed.date).getTime() : Date.now() - (selectedFiles.length - i) * 86400000,
          modeId: parsed.mode === "outline" ? "outline" : "manuscript",
          modeLabel: parsed.mode === "outline" ? "Outline" : "Manuscript",
          title: parsed.title || file.name.replace(/\.\w+$/, ""),
          input: parsed.summary || "",
          output: text,
          length: null,
        };
        window.cloudHistory.save(histItem).catch(() => {});
        if (onHistoryAdd) onHistoryAdd(histItem);

        // Accumulate voice observations
        if (parsed.voiceObservations) {
          allVoiceObs.push({
            ...parsed.voiceObservations,
            date: parsed.date || null,
            sermonTitle: parsed.title || file.name,
          });
        }

        allResults.push({
          file: file.name,
          status: "ok",
          title: parsed.title,
          stories: parsed.stories?.length || 0,
          date: parsed.date,
          series: parsed.series,
        });
      } catch (e) {
        allResults.push({ file: file.name, status: "failed", reason: e.message });
      }
    }
    setResults(allResults);

    // Merge voice observations into profile
    if (allVoiceObs.length > 0) {
      setPhase("merging");
      try {
        const existing = await window.cloudVoiceProfile.load() || {};
        const mergeRaw = await callAI({
          system: VOICE_MERGE_SYSTEM,
          messages: [{
            role: "user",
            content: `EXISTING VOICE PROFILE (${existing.sermonCount || 0} sermons analyzed previously):\n${JSON.stringify(existing)}\n\nNEW OBSERVATIONS from ${allVoiceObs.length} sermons:\n${JSON.stringify(allVoiceObs)}\n\nTotal sermons analyzed: ${(existing.sermonCount || 0) + allVoiceObs.length}\nCurrent timestamp: ${Date.now()}`
          }],
          maxTokens: 4000,
        });
        const mergeMatch = mergeRaw.match(/\{[\s\S]*\}/);
        if (mergeMatch) {
          const merged = JSON.parse(mergeMatch[0]);
          merged.sermonCount = (existing.sermonCount || 0) + allVoiceObs.length;
          merged.lastUpdated = Date.now();
          setMergedProfile(merged);
          await window.cloudVoiceProfile.save(merged);
          await window.storage.set("sermon-voice-profile", JSON.stringify(merged));
          if (onVoiceUpdated) onVoiceUpdated(merged);
        }
      } catch (e) {
        console.warn("Voice merge failed:", e.message);
      }
    }

    setPhase("done");
  }

  const totalOk = results.filter(r => r.status === "ok").length;
  const totalStories = results.reduce((sum, r) => sum + (r.stories || 0), 0);
  const totalFailed = results.filter(r => r.status === "failed").length;

  return (
    <div style={{...SS.flexColFull}}>
      <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${t.panelBorder}`,flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h3 style={{margin:0,fontFamily:"Inter,sans-serif",color:t.text,fontSize:16,fontWeight:700}}>Upload Sermons</h3>
        <button onClick={onClose} style={{background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:6,color:t.textMuted,cursor:"pointer",padding:"4px 10px",fontFamily:"Inter,sans-serif",fontSize:12}}>✕ Close</button>
      </div>

      <div style={{flex:1,overflow:"auto",padding:"20px 18px"}}>

        {/* IDLE: file picker */}
        {phase === "idle" && (
          <>
            <div style={{textAlign:"center",padding:"20px 0 16px"}}>
              <div style={{fontSize:44,marginBottom:12}}>📂</div>
              <p style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:17,fontWeight:700,margin:"0 0 8px"}}>Train Your Voice</p>
              <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:13,lineHeight:1.6,margin:"0 0 20px"}}>
                Upload your past sermons. Each one is analyzed individually for your voice patterns, personal stories, and added to your sermon history.
              </p>
            </div>
            <div onClick={() => fileRef.current?.click()}
              style={{border:`2px dashed ${t.surfaceBorder}`,borderRadius:10,padding:"28px 20px",textAlign:"center",cursor:"pointer",transition:"border-color 0.2s",marginBottom:16}}
              onMouseEnter={e => e.currentTarget.style.borderColor = t.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = t.surfaceBorder}>
              <p style={{fontFamily:"Inter,sans-serif",color:t.accent,fontSize:14,fontWeight:700,margin:"0 0 4px"}}>Click to choose files</p>
              <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:11,margin:0}}>TXT, DOCX, PDF, or any text format. Upload as many as you want.</p>
            </div>
            <input ref={fileRef} type="file" multiple accept=".txt,.doc,.docx,.pdf,.pages,.rtf" style={{display:"none"}}
              onChange={e => handleFileSelect(e.target.files)} />
            <div style={{background:`${t.accent}12`,border:`1px solid ${t.accent}25`,borderRadius:8,padding:"10px 12px"}}>
              <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:11,lineHeight:1.6,margin:0}}>
                For each sermon, the AI extracts: voice patterns, personal stories (saved to Story Bank), dates, and adds the sermon to History. Your voice profile gets smarter with every upload.
              </p>
            </div>
          </>
        )}

        {/* QUEUED: show file list + Process All button */}
        {phase === "queued" && (
          <>
            <p style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:14,fontWeight:700,margin:"0 0 12px"}}>{selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected</p>
            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:16,maxHeight:300,overflowY:"auto"}}>
              {selectedFiles.map((f, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:t.surface,border:`1px solid ${t.surfaceBorder}`,borderRadius:6}}>
                  <span style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
                  <span style={{fontFamily:"Inter,sans-serif",fontSize:10,color:t.textMuted,flexShrink:0}}>{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
            <button onClick={processAll}
              style={{width:"100%",padding:"14px",background:t.accentGrad,border:"none",borderRadius:10,fontFamily:"Inter,sans-serif",fontSize:15,fontWeight:700,color:"#fff",cursor:"pointer",marginBottom:8}}>
              Process All Sermons
            </button>
            <button onClick={() => { setPhase("idle"); setSelectedFiles([]); }}
              style={{width:"100%",padding:"10px",background:"transparent",border:`1px solid ${t.surfaceBorder}`,borderRadius:8,fontFamily:"Inter,sans-serif",fontSize:12,color:t.textMuted,cursor:"pointer"}}>
              Choose Different Files
            </button>
          </>
        )}

        {/* PROCESSING: per-file progress */}
        {(phase === "processing" || phase === "merging") && (
          <div style={{textAlign:"center",padding:"30px 20px"}}>
            <div style={{fontSize:40,marginBottom:14}}>{phase === "merging" ? "🧬" : "🧠"}</div>
            <p style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:16,fontWeight:700,margin:"0 0 6px"}}>
              {phase === "merging" ? "Building your voice profile..." : `Analyzing sermon ${currentIdx} of ${selectedFiles.length}`}
            </p>
            <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,margin:"0 0 20px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentFile}</p>
            <div style={{height:6,background:t.surface,borderRadius:10,overflow:"hidden",border:`1px solid ${t.surfaceBorder}`}}>
              <div style={{height:"100%",width: phase === "merging" ? "95%" : `${(currentIdx / selectedFiles.length) * 90}%`,background:t.accentGrad,borderRadius:10,transition:"width 0.5s ease"}} />
            </div>
            <p style={{fontFamily:"Inter,sans-serif",color:t.textFaint,fontSize:10,marginTop:8}}>
              {phase === "merging" ? "Merging voice observations..." : `${results.filter(r=>r.status==="ok").length} processed, ${results.reduce((s,r)=>s+(r.stories||0),0)} stories found`}
            </p>
          </div>
        )}

        {/* DONE: summary */}
        {phase === "done" && (
          <div>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:40,marginBottom:8}}>✅</div>
              <p style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:16,fontWeight:700,margin:"0 0 4px"}}>Upload Complete</p>
              <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12}}>
                {totalOk} sermon{totalOk !== 1 ? "s" : ""} processed, {totalStories} stor{totalStories !== 1 ? "ies" : "y"} extracted{mergedProfile ? `, voice profile updated (${mergedProfile.sermonCount} total sermons)` : ""}
              </p>
            </div>

            {/* Per-file results */}
            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>
              {results.map((r, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:t.surface,border:`1px solid ${t.surfaceBorder}`,borderRadius:6}}>
                  <span style={{fontSize:12}}>{r.status === "ok" ? "✓" : r.status === "skipped" ? "—" : "✕"}</span>
                  <span style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.title || r.file}</span>
                  {r.date && <span style={{fontFamily:"Inter,sans-serif",fontSize:10,color:t.textMuted,flexShrink:0}}>{r.date}</span>}
                  {r.stories > 0 && <span style={{fontFamily:"Inter,sans-serif",fontSize:10,color:t.accent,flexShrink:0}}>{r.stories} stories</span>}
                  {r.status === "failed" && <span style={{fontFamily:"Inter,sans-serif",fontSize:10,color:"#e74c3c",flexShrink:0}}>{r.reason}</span>}
                </div>
              ))}
            </div>

            {/* Merged voice profile highlights */}
            {mergedProfile?.favoritePhrases?.length > 0 && (
              <div style={{background:t.surface,border:`1px solid ${t.panelBorder}`,borderRadius:8,padding:"12px 14px",marginBottom:12}}>
                <p style={{fontFamily:"Inter,sans-serif",color:t.accent,fontSize:10,textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:700,margin:"0 0 8px"}}>Your Phrases ({mergedProfile.sermonCount} sermons learned)</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {mergedProfile.favoritePhrases.slice(0, 12).map((p, i) => (
                    <span key={i} style={{background:`${t.accent}18`,border:`1px solid ${t.accent}30`,borderRadius:12,padding:"3px 10px",fontFamily:"Inter,sans-serif",fontSize:11,color:t.text,fontStyle:"italic"}}>"{p}"</span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setPhase("idle"); setSelectedFiles([]); setResults([]); }}
              style={{width:"100%",padding:"10px 0",background:t.accentGrad,border:"none",borderRadius:7,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:4}}>
              Upload More Sermons
            </button>
          </div>
        )}

        {phase === "error" && (
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
            <p style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:15,fontWeight:700,margin:"0 0 8px"}}>Something went wrong</p>
            <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,margin:"0 0 16px"}}>{errMsg || "Try uploading plain text (.txt) or Word (.docx) files."}</p>
            <button onClick={() => { setPhase("idle"); setSelectedFiles([]); }}
              style={{padding:"8px 20px",background:t.accentGrad,border:"none",borderRadius:6,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TUNE PANEL ────────────────────────────────────────────────────────────────
// TUNE_PASTORS, OUTLINE_METHODS, VENUE_TYPES, AUDIENCE_TYPES loaded from config.js

function TunePanel({ tuneSettings, onTune, onClose, t }) {
  const ts = tuneSettings || {};
  const [pastorSliders, setPastorSliders] = useState(ts.pastorSliders||{kody:80,rich:60,carl:40});
  const [enabledPastors, setEnabledPastors] = useState(() => {
    const ep = ts.enabledPastors;
    if (!ep) return new Set(["kody","rich"]);
    return ep instanceof Set ? ep : new Set(ep);
  });
  const [outlineMethod, setOutlineMethod] = useState(ts.outlineMethod||"kody");
  const [venue, setVenue] = useState(ts.venue||"home");
  const [audience, setAudience] = useState(ts.audience||"mixed");
  const [length, setLength] = useState(ts.length||"25");
  const [closingMoment, setClosingMoment] = useState(ts.closingMoment||"salvation");

  function togglePastor(id) {
    setEnabledPastors(prev => {
      const n = new Set(prev);
      if (n.has(id)) { if(n.size>1) n.delete(id); } else n.add(id);
      return n;
    });
  }

  function save() {
    const settings = { pastorSliders, enabledPastors:Array.from(enabledPastors), outlineMethod, venue, audience, length, closingMoment };
    onTune(settings);
  }

  const Section = ({label}) => (
    <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:10,letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:"18px 0 10px 0"}}>{label}</p>
  );

  return (
    <div style={{...SS.flexColFull}}>
      <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${t.panelBorder}`,flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h3 style={{margin:0,fontFamily:"Inter,sans-serif",color:t.text,fontSize:16,fontWeight:700}}>Tune Your Message</h3>
        <div style={{display:"flex",gap:6}}>
          <button onClick={save} style={{background:t.accentGrad,border:"none",borderRadius:6,color:"#fff",cursor:"pointer",padding:"5px 12px",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700}}>Apply</button>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:6,color:t.textMuted,cursor:"pointer",padding:"4px 10px",fontFamily:"Inter,sans-serif",fontSize:12}}>✕</button>
        </div>
      </div>

      <div style={{flex:1,overflow:"auto",padding:"4px 16px 20px"}}>

        {/* Sermon Length */}
        <Section label="Sermon Length"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {Object.entries(LENGTHS).map(([key,cfg])=>(
            <button key={key} onClick={()=>setLength(key)} style={{padding:"8px 10px",background:length===key?t.accentGrad:t.surface,border:`1.5px solid ${length===key?t.accent:t.panelBorder}`,borderRadius:7,cursor:"pointer",textAlign:"left"}}>
              <div style={{fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:700,color:length===key?"#fff":t.text}}>{cfg.label}</div>
              <div style={{fontFamily:"Inter,sans-serif",fontSize:9,color:length===key?"rgba(255,255,255,0.7)":t.textMuted,marginTop:2}}>{cfg.desc}</div>
            </button>
          ))}
        </div>

        {/* Voice blend */}
        <Section label="Voice Blend"/>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {TUNE_PASTORS.map(p => {
            const isOn = enabledPastors.has(p.id);
            return (
              <div key={p.id} style={{background:isOn?t.surface:"transparent",border:`1px solid ${isOn?t.surfaceBorder:t.panelBorder}`,borderRadius:8,padding:"8px 10px",opacity:isOn?1:0.5,transition:"all 0.15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:isOn?7:0}}>
                  <button onClick={()=>togglePastor(p.id)} style={{width:16,height:16,borderRadius:3,border:`1.5px solid ${isOn?t.accent:t.textMuted}`,background:isOn?t.accentGrad:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {isOn && <span style={{color:"#fff",fontSize:9,fontWeight:900}}>✓</span>}
                  </button>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,color:t.text}}>{p.name}</div>
                    <div style={{fontFamily:"Inter,sans-serif",fontSize:10,color:t.textMuted}}>{p.desc}</div>
                  </div>
                </div>
                {isOn && (
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontFamily:"Inter,sans-serif",fontSize:9,color:t.textFaint,minWidth:20}}>0</span>
                    <input type="range" min={0} max={100} value={pastorSliders[p.id]??50}
                      onChange={e=>setPastorSliders(prev=>({...prev,[p.id]:Number(e.target.value)}))}
                      style={{flex:1,accentColor:t.accent,cursor:"pointer"}}/>
                    <span style={{fontFamily:"Inter,sans-serif",fontSize:9,color:t.textFaint,minWidth:20,textAlign:"right"}}>100</span>
                    <span style={{fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700,color:t.accent,minWidth:26,textAlign:"right"}}>{pastorSliders[p.id]??50}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Outline method */}
        <Section label="Outline Structure"/>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {OUTLINE_METHODS.map(m=>(
            <button key={m.id} onClick={()=>setOutlineMethod(m.id)} style={{padding:"8px 12px",background:outlineMethod===m.id?t.accentGrad:t.surface,border:`1.5px solid ${outlineMethod===m.id?t.accent:t.panelBorder}`,borderRadius:7,cursor:"pointer",textAlign:"left",display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{width:12,height:12,borderRadius:"50%",background:outlineMethod===m.id?"#fff":t.panelBorder,flexShrink:0,marginTop:2,display:"inline-block"}}/>
              <div>
                <div style={{fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,color:outlineMethod===m.id?"#fff":t.text}}>{m.name}</div>
                <div style={{fontFamily:"Inter,sans-serif",fontSize:10,color:outlineMethod===m.id?"rgba(255,255,255,0.7)":t.textMuted,lineHeight:1.4}}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Venue */}
        <Section label="Where Are You Speaking?"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
          {VENUE_TYPES.map(v=>(
            <button key={v.id} onClick={()=>setVenue(v.id)} style={{padding:"8px 8px",background:venue===v.id?t.accentGrad:t.surface,border:`1.5px solid ${venue===v.id?t.accent:t.panelBorder}`,borderRadius:7,cursor:"pointer",textAlign:"left"}}>
              <div style={{fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700,color:venue===v.id?"#fff":t.text}}>{v.label}</div>
              <div style={{fontFamily:"Inter,sans-serif",fontSize:9,color:venue===v.id?"rgba(255,255,255,0.65)":t.textMuted,lineHeight:1.3,marginTop:1}}>{v.desc}</div>
            </button>
          ))}
        </div>

        {/* Audience */}
        <Section label="Audience"/>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {AUDIENCE_TYPES.map(a=>(
            <button key={a.id} onClick={()=>setAudience(a.id)} style={{padding:"6px 14px",background:audience===a.id?t.accentGrad:t.surface,border:`1.5px solid ${audience===a.id?t.accent:t.panelBorder}`,borderRadius:20,cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:600,color:audience===a.id?"#fff":t.textMuted}}>
              {a.label}
            </button>
          ))}
        </div>

        {/* Closing Moment */}
        <Section label="Closing Moment"/>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {[
            {id:"salvation",label:"Salvation Moment",desc:"Full gospel invitation. Call people to give their life to Jesus.",icon:"✝️"},
            {id:"altar",label:"Altar Call",desc:"Physical response. Come forward, kneel, respond publicly.",icon:"🙏"},
            {id:"response",label:"Response Moment",desc:"Softer in-seat decision. Hand raised, quiet commitment.",icon:"🕊️"},
            {id:"none",label:"No Closing Call",desc:"Teaching-focused. No formal invitation. Let the Spirit lead.",icon:"📖"},
          ].map(m=>(
            <button key={m.id} onClick={()=>setClosingMoment(m.id)} style={{padding:"9px 12px",background:closingMoment===m.id?t.accentGrad:t.surface,border:`1.5px solid ${closingMoment===m.id?t.accent:t.panelBorder}`,borderRadius:7,cursor:"pointer",textAlign:"left",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:15,flexShrink:0,marginTop:1}}>{m.icon}</span>
              <div>
                <div style={{fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,color:closingMoment===m.id?"#fff":t.text}}>{m.label}</div>
                <div style={{fontFamily:"Inter,sans-serif",fontSize:10,color:closingMoment===m.id?"rgba(255,255,255,0.7)":t.textMuted,lineHeight:1.4,marginTop:1}}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}


// ─── AI CRITIQUE PANEL ───────────────────────────────────────────────────────
// CRITIQUE_SECTIONS loaded from config.js


// ─── TAKEAWAY NOTES PANEL ────────────────────────────────────────────────────
// TAKEAWAY_SYSTEM loaded from prompts.js

function TakeawayPanel({ output, t }) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("sermon-takeaway-latest");
        if (r?.value) { setNotes(r.value); setOpen(true); }
      } catch(e) {}
    })();
  }, []);

  async function generate() {
    if (loading || !output) return;
    setLoading(true); setOpen(true);
    try {
      const text = await callAI({ system:TAKEAWAY_SYSTEM, messages:[{role:"user",content:"SERMON:\n"+output}], maxTokens:3000 });
      setNotes(text);
      await window.storage.set("sermon-takeaway-latest", text);
    } catch(e) { setNotes("Something went wrong generating notes. Try again."); }
    setLoading(false);
  }

  function copyNotes() {
    navigator.clipboard.writeText(notes).catch(()=>{});
  }

  const typeColors = { POINT:"#c8722a", SCRIPTURE:"#cc0000", "ONE-LINER":"#8b4000" };
  const typeLabels = { POINT:"Point", SCRIPTURE:"Scripture", "ONE-LINER":"One-Liner" };

  const items = notes ? notes.split("\n").filter(l=>l.trim().match(/^\d+\.\s*\[/)).map(l => {
    const m = l.trim().match(/^(\d+)\.\s*\[([^\]]+)\]\s*(.*)/s);
    if (!m) return null;
    return { num: parseInt(m[1]), type: m[2].trim().toUpperCase(), text: m[3].trim() };
  }).filter(Boolean) : [];

  const sectionColors = { "MAIN POINTS":"#c8722a", "ONE-LINERS":"#8b4000", "SCRIPTURES":"#cc0000" };

  return (
    <div style={{marginTop:16,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:10,overflow:"hidden",background:t.surface}}>
      {/* Header row */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:open?`1px solid ${t.surfaceBorder}`:"none",background:t.panelBg}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <span style={{fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:700,color:t.text,flex:1}}>Takeaway Notes</span>
        {notes && (
          <button onMouseDown={e=>{e.preventDefault();copyNotes();}} style={{padding:"4px 10px",background:"transparent",border:`1px solid ${t.surfaceBorder}`,borderRadius:5,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:600,cursor:"pointer"}}>
            Copy
          </button>
        )}
        {notes && (
          <button onMouseDown={e=>{e.preventDefault();setOpen(p=>!p);}} style={{padding:"4px 10px",background:"transparent",border:`1px solid ${t.surfaceBorder}`,borderRadius:5,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:600,cursor:"pointer"}}>
            {open?"Hide":"Show"}
          </button>
        )}
        <button onMouseDown={e=>{e.preventDefault();generate();}}
          disabled={loading}
          style={{padding:"6px 14px",background:t.accentGrad,border:"none",borderRadius:6,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,display:"flex",alignItems:"center",gap:6}}>
          {loading ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Generating...
            </>
          ) : notes ? "Regenerate" : "Generate Takeaway Notes"}
        </button>
      </div>

      {/* Notes content */}
      {open && notes && (
        <div style={{padding:"16px 18px"}}>
          {loading ? (
            <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:13,fontStyle:"italic",margin:0}}>Building your takeaway notes...</p>
          ) : items.length > 0 ? (
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {items.map((item,i)=>{
                const col = typeColors[item.type] || t.accent;
                const label = typeLabels[item.type] || item.type;
                const isOneLiner = item.type === "ONE-LINER";
                const isPoint = item.type === "POINT";
                return (
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 12px",borderLeft:`3px solid ${col}`,background:`${col}08`,borderRadius:"0 7px 7px 0"}}>
                    <span style={{fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700,color:col,minWidth:22,paddingTop:1,flexShrink:0}}>{item.num}.</span>
                    <div style={{flex:1}}>
                      <span style={{display:"inline-block",fontFamily:"Inter,sans-serif",fontSize:9,fontWeight:800,letterSpacing:"1px",textTransform:"uppercase",color:col,marginBottom:2,opacity:0.8}}>{label}</span>
                      <p style={{margin:0,fontFamily:"Inter,sans-serif",fontSize:12,color:t.text,lineHeight:1.55,fontWeight:isPoint?700:400,fontStyle:isOneLiner?"italic":"normal"}}>{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <pre style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.text,whiteSpace:"pre-wrap",margin:0,lineHeight:1.7}}>{notes}</pre>
          )}
        </div>
      )}
    </div>
  );
}

function CritiquePanel({ output, t }) {
  const [open, setOpen] = useState(false);
  const [critique, setCritique] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const CRITIQUE_SYSTEM = `You are a master sermon coach. Give direct, honest, pastoral feedback like a trusted mentor, not a cheerleader.
Analyze the sermon and structure your response with these EXACT section markers:
SECTION:HOOK
SECTION:STRUCTURE
SECTION:GOSPEL
SECTION:STORIES
SECTION:LANDING
Write 3 to 5 punchy, practical sentences after each marker. Be specific. Reference actual lines from the sermon.
End with one killer note about what is working best and one thing to sharpen.
Never use dashes. Never use markdown.`;

  async function runCritique() {
    if (loading) return;
    setOpen(true); setLoading(true); setCritique(""); setActiveTab("all");
    try {
      const critiqueText = await callAI({ system:CRITIQUE_SYSTEM, messages:[{role:"user",content:"Critique this sermon manuscript:\n\n"+output}], maxTokens:3000 });
      setCritique(critiqueText);
    } catch(e) { setCritique("Error running critique. Please try again."); }
    setLoading(false);
  }

  const parsed = {};
  if (critique) {
    let key="hook", lines=[];
    critique.split("\n").forEach(line => {
      const found = CRITIQUE_SECTIONS.find(s => s.key!=="all" && line.includes("SECTION:"+s.key.toUpperCase()));
      if(found){ if(lines.length) parsed[key]=lines.join("\n").trim(); key=found.key; lines=[]; }
      else lines.push(line);
    });
    if(lines.length) parsed[key]=lines.join("\n").trim();
  }
  const content = activeTab==="all" ? critique : (parsed[activeTab]||"No content for this section yet.");

  if (!open) return (
    <button onClick={runCritique}
      style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:8,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.15s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.color=t.accent;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=t.surfaceBorder;e.currentTarget.style.color=t.textMuted;}}>
      Sermon Critique
    </button>
  );

  return (
    <div style={{background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:10,overflow:"hidden",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderBottom:`1px solid ${t.surfaceBorder}`,background:t.panelBg}}>
        <span style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:14,fontWeight:700}}>Sermon Critique</span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={runCritique} disabled={loading} style={{padding:"4px 10px",background:t.accentGrad,border:"none",borderRadius:5,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.5:1}}>
            {loading?"Running...":"Rerun"}
          </button>
          <button onClick={()=>setOpen(false)} style={{background:"transparent",border:"none",color:t.textMuted,cursor:"pointer",fontSize:16,padding:"2px 6px"}}>✕</button>
        </div>
      </div>
      <div style={{display:"flex",overflowX:"auto",borderBottom:`1px solid ${t.surfaceBorder}`,padding:"0 6px"}}>
        {CRITIQUE_SECTIONS.map(s=>{
          const isA=activeTab===s.key;
          return <button key={s.key} onClick={()=>setActiveTab(s.key)} style={{padding:"7px 12px",border:"none",borderBottom:isA?`2.5px solid ${t.accent}`:"2.5px solid transparent",background:"transparent",color:isA?t.accent:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:isA?700:400,cursor:"pointer",whiteSpace:"nowrap"}}>{s.label}</button>;
        })}
      </div>
      <div style={{padding:"16px 18px",maxHeight:300,overflowY:"auto"}}>
        {loading
          ? <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,fontStyle:"italic"}}>Reading your sermon...</p>
          : <div style={{fontFamily:"Inter,sans-serif",fontSize:13,color:"#111",lineHeight:1.8}}>
              {content.split("\n").map((l,i)=><div key={i} style={{minHeight:"1em"}}>{l.trim()||<span>&nbsp;</span>}</div>)}
            </div>
        }
      </div>
    </div>
  );
}




// ─── SMALL GROUP QUESTIONS PANEL ─────────────────────────────────────────────
function SmallGroupPanel({ output, audience, t }) {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState("");
  const [loading, setLoading] = useState(false);

  const audienceMap = {
    kids:    "elementary-age children (ages 6-11). Use simple language, concrete examples, and short questions. Focus on feelings and simple choices.",
    teens:   "teenagers (ages 13-18). Be direct and real. Questions should feel relevant to their actual lives — school, friendships, social pressure, identity. No fluff.",
    young:   "young adults (ages 18-30). They are navigating career, relationships, purpose, and faith. Questions should be honest, open-ended, and not preachy.",
    adults:  "adults (ages 30+). Include questions that connect to marriage, parenting, career, and mature faith challenges.",
    mixed:   "a mixed-age group. Make questions accessible to all generations while still sparking real conversation.",
  };

  const SG_SYSTEM = `You are a small group curriculum writer for a church community.
Your job is to write thoughtful discussion questions based on a sermon's themes and ideas — NOT quoting the sermon directly.
The goal is relational depth, honest reflection, and real conversation. Not trivia. Not Sunday school.
Write questions that create vulnerability, spark genuine dialogue, and help people apply truth to their actual lives.
Audience: ${audienceMap[audience]||audienceMap.mixed}
Format your response with EXACTLY these section markers:
SECTION:ICE_BREAKER
SECTION:DIVING_IN
SECTION:GOING_DEEPER
SECTION:APPLICATION
SECTION:PRAYER_PROMPT
Write 2 questions per section except PRAYER_PROMPT (1 guided prompt).
ICE_BREAKER: light, relational, on-theme but safe to answer publicly.
DIVING_IN: connects to the sermon's central theme without quoting it. Broad enough for anyone.
GOING_DEEPER: pushes into honest self-reflection. Should feel a little uncomfortable in the best way.
APPLICATION: practical. What are you actually going to DO this week?
PRAYER_PROMPT: one short, honest prompt to guide the group in prayer together.
Never use dashes. Never use markdown. Never quote the sermon text directly.`;

  const SG_TABS = [
    { key:"all",           label:"All" },
    { key:"ice_breaker",   label:"Ice Breaker" },
    { key:"diving_in",     label:"Diving In" },
    { key:"going_deeper",  label:"Going Deeper" },
    { key:"application",   label:"Apply It" },
    { key:"prayer_prompt", label:"Prayer" },
  ];

  const [activeTab, setActiveTab] = useState("all");

  async function runSG() {
    if (loading) return;
    setOpen(true); setLoading(true); setQuestions(""); setActiveTab("all");
    try {
      const sgText = await callAI({ system:SG_SYSTEM, messages:[{role:"user",content:"Write small group questions based on the themes in this sermon (do not quote it directly):\n\n"+output}], maxTokens:2000 });
      setQuestions(sgText);
    } catch(e) { setQuestions("Error generating questions. Please try again."); }
    setLoading(false);
  }

  const parsed = {};
  if (questions) {
    let key="all", lines=[];
    questions.split("\n").forEach(line => {
      const found = SG_TABS.find(s => s.key!=="all" && line.includes("SECTION:"+s.key.toUpperCase()));
      if(found){ if(lines.length) parsed[key]=lines.join("\n").trim(); key=found.key; lines=[]; }
      else lines.push(line);
    });
    if(lines.length) parsed[key]=lines.join("\n").trim();
  }
  const content = activeTab==="all" ? questions : (parsed[activeTab]||"No content for this section yet.");

  if (!open) return (
    <button onClick={runSG}
      style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 10px",background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:8,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s",width:"100%"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.color=t.accent;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=t.surfaceBorder;e.currentTarget.style.color=t.textMuted;}}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      Small Group
    </button>
  );

  return (
    <div style={{background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:10,overflow:"hidden",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderBottom:`1px solid ${t.surfaceBorder}`,background:t.panelBg}}>
        <span style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:14,fontWeight:700}}>Small Group Questions</span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={runSG} disabled={loading} style={{padding:"4px 10px",background:t.accentGrad,border:"none",borderRadius:5,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.5:1}}>
            {loading?"Generating...":"Regenerate"}
          </button>
          <button onClick={()=>setOpen(false)} style={{background:"transparent",border:"none",color:t.textMuted,cursor:"pointer",fontSize:16,padding:"2px 6px"}}>✕</button>
        </div>
      </div>
      <div style={{display:"flex",overflowX:"auto",borderBottom:`1px solid ${t.surfaceBorder}`,padding:"0 6px"}}>
        {SG_TABS.map(s=>{
          const isA=activeTab===s.key;
          return <button key={s.key} onClick={()=>setActiveTab(s.key)} style={{padding:"7px 12px",border:"none",borderBottom:isA?`2.5px solid ${t.accent}`:"2.5px solid transparent",background:"transparent",color:isA?t.accent:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:isA?700:400,cursor:"pointer",whiteSpace:"nowrap"}}>{s.label}</button>;
        })}
      </div>
      <div style={{padding:"16px 18px",maxHeight:320,overflowY:"auto"}}>
        {loading
          ? <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,fontStyle:"italic"}}>Writing questions for your audience...</p>
          : <div style={{fontFamily:"Inter,sans-serif",fontSize:13,color:"#111",lineHeight:1.9}}>
              {content.split("\n").map((l,i)=>{
                const trimmed = l.trim();
                if (!trimmed) return <div key={i} style={{height:"0.7em"}} />;
                const isQ = trimmed.match(/^\d+\./) || trimmed.endsWith("?");
                return <div key={i} style={{marginBottom: isQ ? 10 : 4, fontWeight: isQ ? 500 : 400, color: isQ ? (t.text||"#111") : (t.textMuted||"#666")}}>{trimmed}</div>;
              })}
            </div>
        }
      </div>
    </div>
  );
}


// ─── STORY MATCH PANEL ───────────────────────────────────────────────────────
function StoryMatchPanel({ output, stories, t }) {
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  async function runMatch() {
    if (loading || !stories || stories.length === 0) return;
    setOpen(true); setLoading(true); setMatches([]);
    const storyList = stories.map((s,i) => "["+i+"] "+s.title+": "+s.content.slice(0,200)+"...").join("\n");
    const SYS = "You are a sermon illustration assistant. Given a sermon and a list of personal stories, identify which stories would fit well. For each match explain in one sentence why it fits and where in the sermon it could land. Return ONLY a JSON array like: [{index:0,title:string,fit:string}]. Up to 4 matches. Only strong fits. Return [] if none fit well. No markdown. No dashes.";
    try {
      const raw = await callAI({ system:SYS, messages:[{role:"user",content:"SERMON:\n"+output.slice(0,4000)+"\n\nSTORY BANK:\n"+storyList}], maxTokens:800, model:"gpt-4o-mini" });
      const clean = raw.replace(/^```[\w]*\n?/,"").replace(/\n?```$/,"").trim();
      try { const p=JSON.parse(clean); setMatches(Array.isArray(p)?p.map(m=>({...m,story:stories[m.index]})).filter(m=>m.story):[]); }
      catch(e) { setMatches([]); }
    } catch(e) { setMatches([]); }
    setLoading(false);
  }

  if (!open) return (
    <button onClick={runMatch}
      style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 10px",background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:8,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s",width:"100%"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.color=t.accent;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=t.surfaceBorder;e.currentTarget.style.color=t.textMuted;}}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
      Check Story Bank
    </button>
  );

  return (
    <div style={{background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:10,overflow:"hidden",gridColumn:"1/-1",marginTop:2}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderBottom:`1px solid ${t.surfaceBorder}`,background:t.panelBg}}>
        <span style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          Story Bank Matches
        </span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={runMatch} disabled={loading} style={{padding:"4px 10px",background:t.accentGrad,border:"none",borderRadius:5,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.5:1}}>
            {loading?"Checking...":"Recheck"}
          </button>
          <button onClick={()=>setOpen(false)} style={{background:"transparent",border:"none",color:t.textMuted,cursor:"pointer",fontSize:16,lineHeight:1,padding:"2px 6px"}}>&#x2715;</button>
        </div>
      </div>
      <div style={{padding:"12px 14px",maxHeight:260,overflowY:"auto"}}>
        {loading
          ? <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,fontStyle:"italic",margin:0}}>Scanning your story bank...</p>
          : matches.length === 0
            ? <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,margin:0}}>No strong matches found. Add more stories to improve results.</p>
            : matches.map((m,i)=>(
                <div key={i} style={{padding:"9px 11px",border:`1px solid ${t.panelBorder}`,borderLeft:`3px solid ${t.accent}`,borderRadius:7,marginBottom:7}}>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,color:t.text,marginBottom:2}}>{m.title}</div>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.textMuted,lineHeight:1.55}}>{m.fit}</div>
                </div>
              ))
        }
      </div>
    </div>
  );
}

// ─── ILLUSTRATION SEARCH PANEL ───────────────────────────────────────────────
function IllustrationSearchPanel({ output, t }) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function runSearch() {
    if (loading) return;
    setOpen(true); setLoading(true); setResults([]);
    try {
      const raw = await callAI({ system: ILLUSTRATION_SEARCH_SYSTEM, messages:[{role:"user",content:"Find illustrations for this sermon:\n\n"+output.slice(0,6000)}], maxTokens:2000 });
      const clean = raw.replace(/^```[\w]*\n?/,"").replace(/\n?```$/,"").trim();
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) setResults(JSON.parse(match[0]));
    } catch(e) { setResults([]); }
    setLoading(false);
  }

  if (!open) return (
    <button onClick={runSearch}
      style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 10px",background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:8,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s",width:"100%"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.color=t.accent;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=t.surfaceBorder;e.currentTarget.style.color=t.textMuted;}}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      Find Illustrations
    </button>
  );

  return (
    <div style={{background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:10,overflow:"hidden",gridColumn:"1/-1",marginTop:2}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderBottom:`1px solid ${t.surfaceBorder}`,background:t.panelBg}}>
        <span style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Illustration Library
        </span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={runSearch} disabled={loading} style={{padding:"4px 10px",background:t.accentGrad,border:"none",borderRadius:5,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.5:1}}>
            {loading?"Searching...":"Search Again"}
          </button>
          <button onClick={()=>setOpen(false)} style={{background:"transparent",border:"none",color:t.textMuted,cursor:"pointer",fontSize:16,lineHeight:1,padding:"2px 6px"}}>&#x2715;</button>
        </div>
      </div>
      <div style={{padding:"12px 14px",maxHeight:320,overflowY:"auto"}}>
        {loading
          ? <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,fontStyle:"italic",margin:0}}>Finding illustrations from history, culture, science...</p>
          : results.length === 0
            ? <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,margin:0}}>No illustrations found.</p>
            : results.map((r,i)=>(
                <div key={i} style={{padding:"10px 12px",border:`1px solid ${t.panelBorder}`,borderLeft:`3px solid #00b4d8`,borderRadius:7,marginBottom:7}}>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,color:t.text,marginBottom:2}}>{r.title}</div>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:10,color:t.accent,marginBottom:4}}>{r.source}</div>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.text,lineHeight:1.55,marginBottom:4}}>{r.illustration}</div>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.textMuted,lineHeight:1.5,fontStyle:"italic"}}>{r.connection}</div>
                </div>
              ))
        }
      </div>
    </div>
  );
}

// ─── SCRIPTURE CROSS-REFERENCE PANEL ─────────────────────────────────────────
function ScriptureCrossRefPanel({ output, t }) {
  const [open, setOpen] = useState(false);
  const [refs, setRefs] = useState([]);
  const [loading, setLoading] = useState(false);

  async function runCrossRef() {
    if (loading) return;
    setOpen(true); setLoading(true); setRefs([]);
    try {
      const raw = await callAI({ system: CROSS_REF_SYSTEM, messages:[{role:"user",content:"Find cross-references for this sermon:\n\n"+output.slice(0,6000)}], maxTokens:2000 });
      const clean = raw.replace(/^```[\w]*\n?/,"").replace(/\n?```$/,"").trim();
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) setRefs(JSON.parse(match[0]));
    } catch(e) { setRefs([]); }
    setLoading(false);
  }

  if (!open) return (
    <button onClick={runCrossRef}
      style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 10px",background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:8,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s",width:"100%"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="#cc0000";e.currentTarget.style.color="#cc0000";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=t.surfaceBorder;e.currentTarget.style.color=t.textMuted;}}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      Cross-References
    </button>
  );

  return (
    <div style={{background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:10,overflow:"hidden",gridColumn:"1/-1",marginTop:2}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderBottom:`1px solid ${t.surfaceBorder}`,background:t.panelBg}}>
        <span style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Scripture Cross-References
        </span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={runCrossRef} disabled={loading} style={{padding:"4px 10px",background:t.accentGrad,border:"none",borderRadius:5,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.5:1}}>
            {loading?"Searching...":"Search Again"}
          </button>
          <button onClick={()=>setOpen(false)} style={{background:"transparent",border:"none",color:t.textMuted,cursor:"pointer",fontSize:16,lineHeight:1,padding:"2px 6px"}}>&#x2715;</button>
        </div>
      </div>
      <div style={{padding:"12px 14px",maxHeight:320,overflowY:"auto"}}>
        {loading
          ? <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,fontStyle:"italic",margin:0}}>Finding related passages...</p>
          : refs.length === 0
            ? <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,margin:0}}>No cross-references found.</p>
            : refs.map((r,i)=>(
                <div key={i} style={{padding:"10px 12px",border:`1px solid ${t.panelBorder}`,borderLeft:`3px solid #cc0000`,borderRadius:7,marginBottom:7}}>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,color:"#cc0000",marginBottom:3}}>{r.reference}</div>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.text,lineHeight:1.55,fontStyle:"italic",marginBottom:4}}>{r.text}</div>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.textMuted,lineHeight:1.5}}>{r.connection}</div>
                </div>
              ))
        }
      </div>
    </div>
  );
}

// ─── ORIGINALITY CHECK PANEL ─────────────────────────────────────────────────
function OriginalityCheckPanel({ output, t }) {
  const [open, setOpen] = useState(false);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);

  async function runCheck() {
    if (loading) return;
    setOpen(true); setLoading(true); setFlags([]);
    try {
      const raw = await callAI({ system: ORIGINALITY_CHECK_SYSTEM, messages:[{role:"user",content:"Check this sermon for originality:\n\n"+output.slice(0,8000)}], maxTokens:2000 });
      const clean = raw.replace(/^```[\w]*\n?/,"").replace(/\n?```$/,"").trim();
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) setFlags(JSON.parse(match[0]));
    } catch(e) { setFlags([]); }
    setLoading(false);
  }

  const sevColor = { high:"#e74c3c", medium:"#f39c12", low:"#95a5a6" };

  if (!open) return (
    <button onClick={runCheck}
      style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 10px",background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:8,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s",width:"100%"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="#f39c12";e.currentTarget.style.color="#f39c12";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=t.surfaceBorder;e.currentTarget.style.color=t.textMuted;}}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Originality Check
    </button>
  );

  return (
    <div style={{background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:10,overflow:"hidden",gridColumn:"1/-1",marginTop:2}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderBottom:`1px solid ${t.surfaceBorder}`,background:t.panelBg}}>
        <span style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Originality Check
          {!loading && flags.length === 0 && <span style={{color:"#2d9b2d",fontSize:11,fontWeight:600,marginLeft:6}}>All Clear</span>}
          {!loading && flags.length > 0 && <span style={{color:"#f39c12",fontSize:11,fontWeight:600,marginLeft:6}}>{flags.length} flag{flags.length!==1?"s":""}</span>}
        </span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={runCheck} disabled={loading} style={{padding:"4px 10px",background:t.accentGrad,border:"none",borderRadius:5,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.5:1}}>
            {loading?"Checking...":"Recheck"}
          </button>
          <button onClick={()=>setOpen(false)} style={{background:"transparent",border:"none",color:t.textMuted,cursor:"pointer",fontSize:16,lineHeight:1,padding:"2px 6px"}}>&#x2715;</button>
        </div>
      </div>
      <div style={{padding:"12px 14px",maxHeight:320,overflowY:"auto"}}>
        {loading
          ? <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,fontStyle:"italic",margin:0}}>Scanning for originality...</p>
          : flags.length === 0
            ? <p style={{fontFamily:"Inter,sans-serif",color:"#2d9b2d",fontSize:12,margin:0,fontWeight:600}}>This sermon looks original. No significant flags found.</p>
            : flags.map((f,i)=>(
                <div key={i} style={{padding:"10px 12px",border:`1px solid ${t.panelBorder}`,borderLeft:`3px solid ${sevColor[f.severity]||"#95a5a6"}`,borderRadius:7,marginBottom:7,background:`${sevColor[f.severity]||"#95a5a6"}08`}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                    <span style={{fontFamily:"Inter,sans-serif",fontSize:10,fontWeight:700,color:sevColor[f.severity],textTransform:"uppercase",letterSpacing:"0.5px"}}>{f.severity}</span>
                    <span style={{fontFamily:"Inter,sans-serif",fontSize:10,color:t.textMuted}}>Similar to: {f.source}</span>
                  </div>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.text,lineHeight:1.55,marginBottom:4,fontStyle:"italic"}}>"{f.text?.slice(0,150)}{f.text?.length>150?"...":""}"</div>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.textMuted,lineHeight:1.5}}>{f.suggestion}</div>
                </div>
              ))
        }
      </div>
    </div>
  );
}

// ─── DELIVER MODE (full-screen sermon reader with timer) ──────────────────────
function DeliverMode({ text, title, onClose, t }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [fontSize, setFontSize] = useState(22);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  const parse = (str, lk) => {
    const rx = /<(BOLD|ITALIC|SCRIPTURE|ONELINER|SCREEN|HEADER|STORY|SUMMARY|JOKE|EXAMPLE)(?:\s+ref="[^"]*")?>([\s\S]*?)<\/\1>/g;
    const parts = []; let last = 0, m;
    while ((m = rx.exec(str)) !== null) {
      if (m.index > last) parts.push(<span key={"t"+lk+last}>{str.slice(last, m.index)}</span>);
      const [, tag, content] = m; const k = lk+""+m.index;
      if (tag === "HEADER") parts.push(<div key={k} style={{fontWeight:800, textTransform:"uppercase", borderBottom:"3px solid rgba(255,255,255,0.3)", paddingBottom:8, marginTop:36, marginBottom:12, fontSize:"0.7em", letterSpacing:"3px", opacity:0.7}}>{content}</div>);
      else if (tag === "SCREEN") parts.push(<div key={k} style={{fontWeight:800, textDecoration:"underline", fontSize:"1.1em", margin:"16px 0"}}>{content}</div>);
      else if (tag === "SCRIPTURE") parts.push(<div key={k} style={{color:"#ffaa66", fontStyle:"italic", margin:"12px 0", paddingLeft:20, borderLeft:"3px solid #ffaa66"}}>{content}</div>);
      else if (tag === "ONELINER") parts.push(<div key={k} style={{fontWeight:800, fontSize:"1.15em", color:"#ffe0a0", margin:"16px 0", fontStyle:"italic"}}>{content}</div>);
      else if (tag === "JOKE") parts.push(<span key={k} style={{color:"#ffb0d0"}}>{content}</span>);
      else if (tag === "STORY") parts.push(<span key={k} style={{color:"#90c0ff"}}>{content}</span>);
      else parts.push(<span key={k}>{content}</span>);
      last = m.index + m[0].length;
    }
    if (last < str.length) parts.push(<span key={"e"+lk}>{str.slice(last)}</span>);
    return parts;
  };

  return (
    <div style={{position:"fixed", inset:0, background:"#050505", zIndex:2000, display:"flex", flexDirection:"column", overflow:"hidden"}}>
      {/* Top bar */}
      <div style={{display:"flex", alignItems:"center", gap:16, padding:"12px 24px", borderBottom:"1px solid rgba(255,255,255,0.08)", flexShrink:0}}>
        <span style={{fontFamily:"Inter,sans-serif", color:"rgba(255,255,255,0.9)", fontSize:15, fontWeight:700, flex:1}}>{title}</span>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <button onClick={()=>setFontSize(f=>Math.max(14,f-2))} style={{padding:"4px 10px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:5, color:"#fff", fontSize:13, cursor:"pointer"}}>A−</button>
          <button onClick={()=>setFontSize(f=>Math.min(40,f+2))} style={{padding:"4px 10px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:5, color:"#fff", fontSize:13, cursor:"pointer"}}>A+</button>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.07)", borderRadius:8, padding:"6px 14px"}}>
          <span style={{fontFamily:"Inter,sans-serif", fontSize:22, fontWeight:700, color:"#fff", letterSpacing:"2px", fontVariantNumeric:"tabular-nums"}}>{mins}:{secs}</span>
          <button onClick={()=>setRunning(r=>!r)} style={{padding:"5px 12px", background:running?"#c03020":"#2a8a40", border:"none", borderRadius:5, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer"}}>
            {running ? "⏸ Pause" : "▶ Start"}
          </button>
          <button onClick={()=>{setElapsed(0);setRunning(false);}} style={{padding:"5px 8px", background:"rgba(255,255,255,0.1)", border:"none", borderRadius:5, color:"rgba(255,255,255,0.6)", fontSize:11, cursor:"pointer"}}>Reset</button>
        </div>
        <button onClick={onClose} style={{padding:"6px 14px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, color:"rgba(255,255,255,0.7)", fontSize:12, cursor:"pointer", fontFamily:"Inter,sans-serif"}}>✕ Exit</button>
      </div>
      {/* Content */}
      <div style={{flex:1, overflowY:"auto", padding:"40px 80px", maxWidth:900, margin:"0 auto", width:"100%"}}>
        <div style={{fontFamily:"Inter,sans-serif", fontSize:fontSize, color:"rgba(255,255,255,0.92)", lineHeight:1.85}}>
          {(text||"").split("\n").map((line, i) => (
            <div key={i} style={{minHeight:"1.2em"}}>{line.trim()===""?<span>&nbsp;</span>:parse(line,i)}</div>
          ))}
        </div>
      </div>
      {/* Bottom progress hint */}
      <div style={{padding:"8px 24px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"center"}}>
        <span style={{fontFamily:"Inter,sans-serif", fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:"2px"}}>DELIVER MODE — PRESS ESC OR CLICK EXIT TO CLOSE</span>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
// SVG icon components for sidebar
const IconIdea = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6l-.7.4V18H9v-2.6l-.7-.4A7 7 0 0 1 12 2z"/>
  </svg>
);
const IconHistory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconStories = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IconSoap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a5 5 0 0 1 5 5v1h1a3 3 0 0 1 0 6h-1v1a5 5 0 0 1-10 0v-1H6a3 3 0 0 1 0-6h1V7a5 5 0 0 1 5-5z"/>
    <line x1="9" y1="11" x2="15" y2="11"/>
    <line x1="9" y1="14" x2="13" y2="14"/>
  </svg>
);
const IconMakeMine = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const IconTune = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
    <line x1="17" y1="16" x2="23" y2="16"/>
  </svg>
);

// ─── SHARED STATIC STYLES ────────────────────────────────────────────────────
const SS = {
  flexColFull:  { display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" },
  flexColFlex1: { display:"flex", flexDirection:"column", flex:1, minHeight:0 },
  posRel:       { position:"relative" },
  spin:         { animation:"spin 0.9s linear infinite" },
  flex1MinW0:   { flex:1, minWidth:0 },
};

const SIDEBAR_ITEMS = [
  { id:"history",  Icon:IconHistory,  label:"History" },
  { id:"stories",  Icon:IconStories,  label:"Stories" },
  { id:"idea",     Icon:IconIdea,     label:"Ideas" },
  { id:"upload",   Icon:IconUpload,   label:"Upload" },
  { id:"soap",     Icon:IconSoap,     label:"S.O.A.P" },
  { id:"makemine", Icon:IconMakeMine, label:"Make It Mine" },
  { id:"settings", Icon:IconSettings, label:"Settings" },
];

// ─── SERMON WORKSHOP CONFIG ───────────────────────────────────────────────────
const WORKSHOP_STAGES = [
  {
    id:"scripture", label:"Text Study", desc:"What scripture is God putting on your heart this week?",
    stageContext:"Help the pastor explore the scripture passage. Ask what drew them to this text, what the Holy Spirit seems to be highlighting, and what their congregation is walking through that makes this timely. Once you understand the passage and pastoral context, summarize what you know in a brief update with both the scripture reference and key context."
  },
  {
    id:"idea", label:"Big Idea", desc:"Narrow it down to the one thing the whole sermon is about.",
    stageContext:"Help the pastor distill everything into ONE big idea — the single sentence they want every person to leave with. Push for clarity and punch. It should be short, memorable, and feel inevitable given the text. If they give you something vague, push for a sharper version. Ask: 'If you could only land one thing, what would it be?'"
  },
  {
    id:"structure", label:"Structure", desc:"Map how the sermon flows from open to close.",
    stageContext:"Help the pastor develop 3 main points that each support the big idea and flow naturally to the next. Think through: the opening hook/story, how tension is set up, how each point connects to the text, and how it all lands in the closing invitation. Once points are solid, update the brief with the points array."
  },
  {
    id:"illustrate", label:"Illustrations", desc:"Find the story for each point that makes it unforgettable.",
    stageContext:"For each main point, help the pastor find the right illustration. Ask about personal stories first — lived experience always hits harder than generic examples. If they don't have a personal story, help them find a cultural or biblical one. One great story per point. Once illustrations are decided, add them to the brief."
  },
  {
    id:"application", label:"Application", desc:"What does this sermon ask people to actually do or decide?",
    stageContext:"Help the pastor land the application and closing. What should people do differently this week? What decision are you asking them to make at the end? Make the application concrete and the closing invitation specific. Vague application kills good sermons. Once decided, update the brief with both the application and call to action."
  },
];

const WORKSHOP_QUICK_ACTIONS = [
  { label:"Next Stage →",       prompt:"_NEXT_STAGE_" },
  { label:"Give me 3 options",  prompt:"Give me 3 different options or directions I could take this. Be specific and concrete for each one." },
  { label:"Summarize so far",   prompt:"Summarize everything we have decided so far for this sermon. What do we have locked in and what is still open?" },
  { label:"Punch it up",        prompt:"Look at what we have and tell me what is the weakest element right now. Then give me a stronger version of it." },
  { label:"What comes next?",   prompt:"Based on where we are, what is the single most important thing we need to nail down next?" },
];

// SOAP_SYSTEM loaded from prompts.js

// ─── SOAP PANEL ──────────────────────────────────────────────────────────────
// ─── MAKE IT MINE PANEL ──────────────────────────────────────────────────────
function MakeMinePanel({ onClose, t, onLaunchCoach, onPdfDone }) {
  const [panelMode, setPanelMode] = useState("ai"); // "ai" | "pdf"

  // ── AI mode state ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState("idle"); // idle | reading | analyzing | done | error
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("feedback");
  const [errMsg, setErrMsg] = useState("");
  const fileRef = useRef(null);

  // ── PDF format mode state ──────────────────────────────────────────────────
  const [pdfPhase, setPdfPhase] = useState("idle"); // idle | preview | loading | done | error
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfHtml, setPdfHtml] = useState("");
  const [pdfErr, setPdfErr] = useState("");
  const [copied, setCopied] = useState(false);
  const pdfRef = useRef(null);
  const [pdfFile, setPdfFile] = useState(null); // hold the File object until user clicks Format
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });

  // ── Saved projects state ───────────────────────────────────────────────────
  const [savedProjects, setSavedProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    setLoadingProjects(true);
    window.cloudProjects.load().then(projects => {
      setSavedProjects(projects || []);
      setLoadingProjects(false);
    }).catch(() => setLoadingProjects(false));
  }, []);

  function startFreshCoach() {
    const id = "proj-" + Date.now();
    const project = { id, title: "New Sermon", content: "", sourceType: "manual", coachMessages: [], createdAt: new Date().toISOString() };
    window.cloudProjects.save(project).catch(()=>{});
    if (onLaunchCoach) onLaunchCoach(project);
  }

  function launchCoachWithContent(content, title, sourceType, sourceFile) {
    const id = "proj-" + Date.now();
    const project = { id, title: title || fileName || "Uploaded Sermon", content, sourceType: sourceType || "upload", sourceFile: sourceFile || fileName, coachMessages: [], createdAt: new Date().toISOString() };
    window.cloudProjects.save(project).catch(()=>{});
    if (onLaunchCoach) onLaunchCoach(project);
  }

  function openSavedProject(proj) {
    if (onLaunchCoach) onLaunchCoach(proj);
  }

  async function deleteSavedProject(id) {
    setSavedProjects(prev => prev.filter(p => p.id !== id));
    window.cloudProjects.delete(id).catch(()=>{});
  }

  // ── AI: read plain text file ───────────────────────────────────────────────
  async function readFile(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.onerror = () => rej(new Error("Failed to read file"));
      r.readAsText(file);
    });
  }

  async function processFile(file) {
    setFileName(file.name); setPhase("reading"); setResult(null); setErrMsg("");
    let text = "";
    try {
      text = await readFile(file);
      text = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, "\n").trim();
      if (text.length < 50) throw new Error("Could not read text from this file. Try saving as .txt first.");
    } catch(e) { setErrMsg(e.message); setPhase("error"); return; }
    setPhase("analyzing");

    const system = `You are a sermon coach helping pastor Kody Countryman take someone else's outline or message and make it completely his own.
${KODY_VOICE}
Analyze the uploaded content and return a JSON object with this exact structure:
{
  "sourceType": "outline OR manuscript OR notes",
  "bigIdea": "the core message in one sentence",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["what is missing or weak 1", "what is missing 2", "what is missing 3"],
  "kodyNotes": ["specific coaching note for Kody 1", "coaching note 2", "coaching note 3", "coaching note 4"],
  "rewrittenOutline": "A full rewritten outline in Kody's voice using his exact structure: crowd opener idea, tension setup, 3 punchy points with SCREEN tags, gospel turn, closing challenge. Use HEADER tags for section names and SCREEN tags for the main points.",
  "titleIdeas": ["Title option 1", "Title option 2", "Title option 3", "Title option 4", "Title option 5"],
  "kodyOneLiner": "One killer one-liner Kody could own from this message"
}`;

    try {
      const raw = await callAI({
        system,
        messages: [{ role: "user", content: `Here is the sermon content to analyze and make mine:\n\n${text.slice(0,15000)}` }],
        maxTokens: 4000,
      });
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse response.");
      const parsed = JSON.parse(match[0]);
      setResult(parsed); setPhase("done"); setTab("feedback");
    } catch(e) { setErrMsg(e.message || "Something went wrong."); setPhase("error"); }
  }

  // ── PDF: stage file for preview (don't auto-process) ────────────────────────
  function stagePdf(file) {
    setPdfFile(file);
    setPdfFileName(file.name);
    setPdfPhase("preview");
    setPdfHtml("");
    setPdfErr("");
    setCopied(false);
    setPdfProgress({ current: 0, total: 0 });
  }

  // ── PDF: extract highlights with PDF.js ────────────────────────────────────
  // Supports both annotation-based highlights AND content-stream colored rectangles.
  async function processPdf(file) {
    setPdfPhase("loading"); setPdfHtml(""); setPdfErr(""); setCopied(false);
    try {
      const lib = window.pdfjsLib;
      if (!lib) throw new Error("PDF.js not loaded. Refresh the page and try again.");
      lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
      setPdfProgress({ current: 0, total: pdf.numPages });
      let html = "";
      const OPS = lib.OPS;

      function escHtml(s) {
        return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      }

      // Map a highlight color (0–1 float RGB) to a CSS style.
      // Yellow (1,1,0) and Green (0,1,0) → slide points: yellow bg + bold + underline
      // Pink/light-red → scripture: red italic
      // Cyan (0,1,1) → aqua blue story text
      function colorToStyle(r, g, b) {
        // Skip white / near-white backgrounds
        if (r > 0.95 && g > 0.95 && b > 0.95) return null;

        // Yellow (1,1,0) — section headers / slide points
        if (r > 0.8 && g > 0.8 && b < 0.3) {
          return "font-weight:700;text-decoration:underline;background:#ffe066;color:#000;";
        }
        // Green (0,1,0) — key slide points
        if (g > 0.8 && r < 0.3 && b < 0.3) {
          return "font-weight:700;text-decoration:underline;background:#ffe066;color:#000;";
        }
        // Cyan (0,1,1) — stage notes / story text → aqua blue
        if (g > 0.8 && b > 0.8 && r < 0.3) {
          return "color:#00b4d8;font-weight:400;";
        }
        // Pink / light red (r high, g/b moderate-to-low) — scripture
        if (r > 0.7 && g < 0.85 && b < 0.9 && (r - g > 0.05 || r - b > 0.05)) {
          return "color:#cc0000;font-style:italic;font-weight:400;";
        }
        // Blue (pure blue)
        if (b > 0.7 && r < 0.3 && g < 0.3) {
          return "color:#00b4d8;font-weight:400;";
        }
        // Red (pure red)
        if (r > 0.7 && g < 0.3 && b < 0.3) {
          return "color:#cc0000;font-style:italic;font-weight:400;";
        }
        return null;
      }

      // Extract colored rectangles from the page content stream (operator list).
      // These are background rects drawn before text — used as "highlights" in many PDFs.
      // Returns rects in PDF bottom-up coordinate space (matching text item coordinates).
      async function extractContentRects(page) {
        const ops = await page.getOperatorList();
        const viewport = page.getViewport({ scale: 1 });
        const pageHeight = viewport.height;
        const rects = [];
        let fillColor = [0, 0, 0];
        let currentTransform = [1, 0, 0, 1, 0, 0];

        for (let i = 0; i < ops.fnArray.length; i++) {
          const fn = ops.fnArray[i];
          const args = ops.argsArray[i];

          // Track fill color changes (PDF.js gives 0–255)
          if (fn === OPS.setFillRGBColor && args.length >= 3) {
            fillColor = [args[0], args[1], args[2]];
          } else if (fn === OPS.setFillGray && args.length >= 1) {
            fillColor = [args[0], args[0], args[0]];
          } else if (fn === OPS.setFillCMYKColor && args.length >= 4) {
            const [c, m, yk, k] = args;
            fillColor = [(1-Math.min(1,c+k))*255, (1-Math.min(1,m+k))*255, (1-Math.min(1,yk+k))*255];
          }

          // Track transform changes
          if (fn === OPS.transform) {
            currentTransform = args;
          }

          // Detect rectangle drawing: constructPath with rect subop
          if (fn === OPS.constructPath) {
            const subops = args[0] || [];
            const coords = args[1] || [];
            let ci = 0;
            for (const subop of subops) {
              if (subop === OPS.rectangle && ci + 3 < coords.length) {
                const [rx, ry, rw, rh] = [coords[ci], coords[ci+1], coords[ci+2], coords[ci+3]];
                // Normalize colors from 0–255 to 0–1 for colorToStyle
                const r01 = fillColor[0] / 255, g01 = fillColor[1] / 255, b01 = fillColor[2] / 255;
                const style = colorToStyle(r01, g01, b01);
                if (style && Math.abs(rw) > 10 && Math.abs(rh) > 3) {
                  // Apply current transform to get page coordinates (top-down)
                  const [a,b,c,d,e,f] = currentTransform;
                  const px = a * rx + c * ry + e;
                  const py = b * rx + d * ry + f;
                  const pw = Math.abs(a * rw);
                  const ph = Math.abs(d * rh);
                  // Convert from top-down to bottom-up (to match text Y coordinates)
                  const bottomUpY = pageHeight - py - ph;
                  rects.push({ x0: px, y0: bottomUpY, x1: px + pw, y1: bottomUpY + ph, style });
                }
                ci += 4;
              } else if (subop === OPS.moveTo) { ci += 2; }
              else if (subop === OPS.lineTo) { ci += 2; }
              else if (subop === OPS.curveTo) { ci += 6; }
              else if (subop === OPS.curveTo2 || subop === OPS.curveTo3) { ci += 4; }
              else if (subop === OPS.closePath) { /* no coords */ }
            }
          }
        }
        return rects;
      }

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setPdfProgress({ current: pageNum, total: pdf.numPages });
        const page = await pdf.getPage(pageNum);
        const [annotations, textContent, contentRects] = await Promise.all([
          page.getAnnotations(),
          page.getTextContent(),
          extractContentRects(page),
        ]);

        // Build highlight list from BOTH annotation-based and content-stream rects
        const highlightRects = [];

        // 1) Standard annotations
        for (const a of annotations) {
          if (a.subtype === "Highlight" && a.color) {
            const [r, g, b] = a.color.map(v => v > 1 ? v/255 : v);
            const style = colorToStyle(r, g, b);
            if (style) {
              const [x1, y1, x2, y2] = a.rect;
              highlightRects.push({ x0: Math.min(x1,x2), y0: Math.min(y1,y2), x1: Math.max(x1,x2), y1: Math.max(y1,y2), style });
            }
          }
        }

        // 2) Content-stream colored rectangles
        for (const cr of contentRects) {
          highlightRects.push(cr);
        }

        // Check if a point at (x, y) falls inside any highlight rect. Returns style or null.
        function getHighlightStyleAt(x, y) {
          for (const hl of highlightRects) {
            if (x >= hl.x0 - 3 && x <= hl.x1 + 3 && y >= hl.y0 - 3 && y <= hl.y1 + 3) {
              return hl.style;
            }
          }
          return null;
        }

        // For a text item, split it into segments based on which parts are highlighted.
        // This handles partial highlights (e.g. one word in a sentence).
        function splitByHighlight(item) {
          const [,,,,ix,iy] = item.transform;
          const str = item.str;
          if (!str || str.length === 0) return [{ str, style: null }];

          const charWidth = item.width / Math.max(str.length, 1);
          const segments = [];
          let currentStyle = getHighlightStyleAt(ix, iy);
          let segStart = 0;

          for (let ci = 1; ci <= str.length; ci++) {
            const charX = ix + ci * charWidth;
            const style = ci < str.length ? getHighlightStyleAt(charX, iy) : null;
            if (style !== currentStyle || ci === str.length) {
              segments.push({ str: str.slice(segStart, ci), style: currentStyle });
              currentStyle = style;
              segStart = ci;
            }
          }
          return segments;
        }

        // Group text items into lines by Y coordinate
        const lineMap = new Map();
        for (const item of textContent.items) {
          if (!item.str) continue;
          const [,,,,ix,iy] = item.transform;
          const roundY = Math.round(iy);
          let lineKey = null;
          for (const ky of lineMap.keys()) {
            if (Math.abs(ky - roundY) <= 4) { lineKey = ky; break; }
          }
          if (lineKey === null) lineKey = roundY;
          if (!lineMap.has(lineKey)) lineMap.set(lineKey, []);
          lineMap.get(lineKey).push({ str: item.str, x: ix, y: iy, width: item.width, transform: item.transform });
        }

        // PDF Y is bottom-up, sort descending = top of page first
        const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);

        for (const yk of sortedYs) {
          const lineItems = lineMap.get(yk).sort((a, b) => a.x - b.x);
          let lineHtml = "";
          for (const item of lineItems) {
            if (!item.str) continue;
            const segments = splitByHighlight(item);
            for (const seg of segments) {
              const escaped = escHtml(seg.str);
              lineHtml += seg.style
                ? `<span style="${seg.style}">${escaped}</span>`
                : `<span style="font-weight:400;">${escaped}</span>`;
            }
          }
          const plainCheck = lineHtml.replace(/<[^>]+>/g, "").trim();
          if (plainCheck) {
            html += `<div style="margin:0 0 8px;padding:0;line-height:1.7;font-family:Arial,sans-serif;font-size:12pt;color:#111;">${lineHtml}</div>`;
          }
        }

        // No page break dividers — seamless output
      }

      if (!html.trim()) throw new Error("No readable text found. This PDF may use scanned images instead of real text.");
      setPdfHtml(html);
      setPdfPhase("done");
      // Push formatted content to main area
      if (onPdfDone) onPdfDone({ html, fileName: file.name });
    } catch(e) {
      setPdfErr(e.message || "Failed to process PDF.");
      setPdfPhase("error");
    }
  }

  async function copyFormatted() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": new Blob([pdfHtml], { type: "text/html" }) })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: copy plain text
      const tmp = document.createElement("div");
      tmp.innerHTML = pdfHtml;
      await navigator.clipboard.writeText(tmp.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const AI_TABS = [
    { id:"feedback", label:"Feedback" },
    { id:"outline",  label:"My Version" },
    { id:"titles",   label:"Titles" },
  ];

  const modeBtnBase = { padding:"7px 16px", borderRadius:20, fontFamily:"Inter,sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.15s" };

  return (
    <div style={{...SS.flexColFull}}>
      {/* Header */}
      <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${t.panelBorder}`,flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h3 style={{margin:0,fontFamily:"Inter,sans-serif",color:t.text,fontSize:16,fontWeight:700}}>Make It Mine</h3>
          <p style={{margin:"2px 0 0",fontFamily:"Inter,sans-serif",fontSize:11,color:t.textMuted}}>
            {panelMode === "ai" ? "Drop any outline or message — get it in your voice" : "Upload a highlighted PDF — get it in your formatting"}
          </p>
        </div>
        <button onClick={onClose} style={{background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:6,color:t.textMuted,cursor:"pointer",padding:"4px 10px",fontFamily:"Inter,sans-serif",fontSize:12}}>✕</button>
      </div>

      {/* Mode toggle */}
      <div style={{padding:"10px 16px 0",borderBottom:`1px solid ${t.panelBorder}`,flexShrink:0,display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setPanelMode("ai")}
          style={{...modeBtnBase, border:`1px solid ${panelMode==="ai"?t.accent:t.surfaceBorder}`, background:panelMode==="ai"?t.accentGrad:"transparent", color:panelMode==="ai"?"#fff":t.textMuted}}>
          🧠 AI Analysis
        </button>
        <button onClick={()=>setPanelMode("pdf")}
          style={{...modeBtnBase, border:`1px solid ${panelMode==="pdf"?t.accent:t.surfaceBorder}`, background:panelMode==="pdf"?t.accentGrad:"transparent", color:panelMode==="pdf"?"#fff":t.textMuted}}>
          🎨 PDF Format
        </button>
        <button onClick={startFreshCoach}
          style={{...modeBtnBase, marginLeft:"auto", border:`1px solid ${t.surfaceBorder}`, background:"transparent", color:t.accent, fontSize:11}}>
          + Start Fresh
        </button>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"18px 16px"}}>

        {/* ── AI MODE ─────────────────────────────────────────────────── */}
        {panelMode === "ai" && (
          <>
            {phase === "idle" && (
              <>
                <div
                  onClick={()=>fileRef.current?.click()}
                  onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=t.accent;}}
                  onDragLeave={e=>e.currentTarget.style.borderColor=t.surfaceBorder}
                  onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){if(f.type==="application/pdf"||f.name.toLowerCase().endsWith(".pdf")){setPanelMode("pdf");stagePdf(f);}else{processFile(f);}}}}
                  style={{border:`2px dashed ${t.surfaceBorder}`,borderRadius:12,padding:"36px 20px",textAlign:"center",cursor:"pointer",transition:"border-color 0.2s",marginBottom:16}}>
                  <div style={{fontSize:40,marginBottom:10}}>✏️</div>
                  <p style={{fontFamily:"Inter,sans-serif",color:t.accent,fontSize:14,fontWeight:700,margin:"0 0 6px"}}>Drop a file or click to browse</p>
                  <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:11,margin:0,lineHeight:1.6}}>
                    .txt, .docx, .pdf, .rtf — any sermon outline, manuscript, or notes from another preacher
                  </p>
                </div>
                <input ref={fileRef} type="file" accept=".txt,.doc,.docx,.pdf,.rtf,.pages" style={{display:"none"}}
                  onChange={e=>{const f=e.target.files[0];if(f){if(f.type==="application/pdf"||f.name.toLowerCase().endsWith(".pdf")){setPanelMode("pdf");stagePdf(f);}else{processFile(f);}}}}/>
                <div style={{background:`${t.accent}10`,border:`1px solid ${t.accent}20`,borderRadius:8,padding:"10px 12px"}}>
                  <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:11,lineHeight:1.6,margin:0}}>
                    You'll get: what's strong, what's weak, coaching notes for your delivery, a full rewrite in your voice, 5 title ideas, and a killer one-liner you can own.
                  </p>
                </div>
              </>
            )}

            {(phase === "reading" || phase === "analyzing") && (
              <div style={{textAlign:"center",padding:"50px 20px"}}>
                <div style={{fontSize:36,marginBottom:14}}>{phase==="reading"?"📄":"🧠"}</div>
                <p style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:15,fontWeight:700,margin:"0 0 6px"}}>
                  {phase==="reading" ? "Reading your file..." : "Making it yours..."}
                </p>
                <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,margin:0}}>{fileName}</p>
              </div>
            )}

            {phase === "error" && (
              <div style={{padding:"20px 0"}}>
                <div style={{background:"#e74c3c15",border:"1px solid #e74c3c40",borderRadius:8,padding:"14px",marginBottom:14}}>
                  <p style={{fontFamily:"Inter,sans-serif",color:"#e74c3c",fontSize:13,margin:0}}>{errMsg || "Something went wrong. Try again."}</p>
                </div>
                <button onClick={()=>{setPhase("idle");setFileName("");setErrMsg("");}}
                  style={{width:"100%",padding:"10px",background:t.accentGrad,border:"none",borderRadius:8,fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>
                  Try Another File
                </button>
              </div>
            )}

            {phase === "done" && result && (
              <>
                <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
                  {AI_TABS.map(tb=>(
                    <button key={tb.id} onClick={()=>setTab(tb.id)}
                      style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${tab===tb.id?t.accent:t.surfaceBorder}`,background:tab===tb.id?t.accentGrad:"transparent",color:tab===tb.id?"#fff":t.textMuted,fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      {tb.label}
                    </button>
                  ))}
                  <button onClick={()=>{setPhase("idle");setFileName("");setResult(null);}}
                    style={{marginLeft:"auto",padding:"6px 12px",borderRadius:20,border:`1px solid ${t.surfaceBorder}`,background:"transparent",color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:11,cursor:"pointer"}}>
                    New File
                  </button>
                </div>

                {tab === "feedback" && (
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div style={{background:`${t.accent}10`,border:`1px solid ${t.accent}25`,borderRadius:8,padding:"12px 14px"}}>
                      <p style={{fontFamily:"Inter,sans-serif",fontSize:10,color:t.accent,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 4px"}}>Big Idea</p>
                      <p style={{fontFamily:"Inter,sans-serif",fontSize:13,color:t.text,margin:0,fontWeight:600}}>{result.bigIdea}</p>
                    </div>
                    <div style={{background:"#1a7a2a15",border:"1px solid #1a7a2a30",borderRadius:8,padding:"12px 14px"}}>
                      <p style={{fontFamily:"Inter,sans-serif",fontSize:10,color:"#1a7a2a",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 8px"}}>What's Strong</p>
                      {(result.strengths||[]).map((s,i)=>(
                        <p key={i} style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.text,margin:"0 0 5px",paddingLeft:12,borderLeft:"2px solid #1a7a2a"}}>✓ {s}</p>
                      ))}
                    </div>
                    <div style={{background:"#e74c3c10",border:"1px solid #e74c3c25",borderRadius:8,padding:"12px 14px"}}>
                      <p style={{fontFamily:"Inter,sans-serif",fontSize:10,color:"#e74c3c",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 8px"}}>What's Missing</p>
                      {(result.gaps||[]).map((g,i)=>(
                        <p key={i} style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.text,margin:"0 0 5px",paddingLeft:12,borderLeft:"2px solid #e74c3c"}}>✕ {g}</p>
                      ))}
                    </div>
                    <div style={{background:t.surface,border:`1px solid ${t.surfaceBorder}`,borderRadius:8,padding:"12px 14px"}}>
                      <p style={{fontFamily:"Inter,sans-serif",fontSize:10,color:t.accent,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 8px"}}>Coaching Notes for You</p>
                      {(result.kodyNotes||[]).map((n,i)=>(
                        <p key={i} style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.text,margin:"0 0 7px",paddingLeft:12,borderLeft:`2px solid ${t.accent}`}}>💬 {n}</p>
                      ))}
                    </div>
                    {result.kodyOneLiner && (
                      <div style={{background:"#ffe06625",border:"2px solid #ffe066",borderRadius:8,padding:"12px 14px"}}>
                        <p style={{fontFamily:"Inter,sans-serif",fontSize:10,color:"#a07800",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 4px"}}>Your One-Liner</p>
                        <p style={{fontFamily:"Inter,sans-serif",fontSize:14,color:"#111",fontWeight:700,margin:0}}>"{result.kodyOneLiner}"</p>
                      </div>
                    )}
                  </div>
                )}

                {tab === "outline" && (
                  <div style={{background:"#fff",borderRadius:8,padding:"16px",fontFamily:"Arial,sans-serif",fontSize:"11pt",color:"#111",lineHeight:1.6}}
                    dangerouslySetInnerHTML={{__html: rawToHtml(result.rewrittenOutline||"")}}/>
                )}

                {tab === "titles" && (
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {(result.titleIdeas||[]).map((title,i)=>(
                      <div key={i} style={{background:t.surface,border:`1px solid ${t.surfaceBorder}`,borderRadius:8,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.textMuted,fontWeight:700,minWidth:20}}>{i+1}.</span>
                        <span style={{fontFamily:"Inter,sans-serif",fontSize:13,color:t.text,fontWeight:600,flex:1}}>{title}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Launch Coach button */}
                <button
                  onClick={() => launchCoachWithContent(
                    result.rewrittenOutline || result.bigIdea || "",
                    (result.titleIdeas && result.titleIdeas[0]) || "Uploaded Sermon",
                    "upload", fileName
                  )}
                  style={{width:"100%", marginTop:16, padding:"12px", background:t.accentGrad, border:"none", borderRadius:8, fontFamily:"Inter,sans-serif", fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
                  🧠 Launch Coach with This Content
                </button>
              </>
            )}
          </>
        )}

        {/* ── PDF FORMAT MODE ──────────────────────────────────────────── */}
        {panelMode === "pdf" && (
          <>
            {pdfPhase === "idle" && (
              <>
                <div
                  onClick={()=>pdfRef.current?.click()}
                  onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=t.accent;}}
                  onDragLeave={e=>e.currentTarget.style.borderColor=t.surfaceBorder}
                  onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f&&f.type==="application/pdf")stagePdf(f);}}
                  style={{border:`2px dashed ${t.surfaceBorder}`,borderRadius:12,padding:"36px 20px",textAlign:"center",cursor:"pointer",transition:"border-color 0.2s",marginBottom:16}}>
                  <div style={{fontSize:40,marginBottom:10}}>🎨</div>
                  <p style={{fontFamily:"Inter,sans-serif",color:t.accent,fontSize:14,fontWeight:700,margin:"0 0 6px"}}>Drop a PDF or click to browse</p>
                  <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:11,margin:0,lineHeight:1.6}}>.pdf files only — highlight colors are extracted automatically</p>
                </div>
                <input ref={pdfRef} type="file" accept=".pdf,application/pdf" style={{display:"none"}}
                  onChange={e=>{if(e.target.files[0])stagePdf(e.target.files[0]);}}/>
                <div style={{background:t.surface,border:`1px solid ${t.surfaceBorder}`,borderRadius:8,padding:"12px 14px"}}>
                  <p style={{fontFamily:"Inter,sans-serif",fontSize:10,color:t.accent,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 8px"}}>Highlight Color Legend</p>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{display:"inline-block",width:14,height:14,borderRadius:3,background:"#4caf50",flexShrink:0}}/>
                      <span style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.textMuted}}>Green highlight → <strong style={{color:"#000",background:"#ffe066",padding:"0 3px",fontWeight:700,textDecoration:"underline"}}>Bold + underline + yellow</strong></span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{display:"inline-block",width:14,height:14,borderRadius:3,background:"#e53935",flexShrink:0}}/>
                      <span style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.textMuted}}>Red highlight → <em style={{color:"#cc0000"}}>Red italic text</em></span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{display:"inline-block",width:14,height:14,borderRadius:3,background:"#00b4d8",flexShrink:0}}/>
                      <span style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.textMuted}}>Blue highlight → <span style={{color:"#00b4d8"}}>Aqua blue text</span></span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{display:"inline-block",width:14,height:14,borderRadius:3,background:"#888",flexShrink:0}}/>
                      <span style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.textMuted}}>All other text → normal weight, Arial 12pt</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {pdfPhase === "preview" && pdfFile && (
              <div style={{textAlign:"center",padding:"30px 20px"}}>
                <div style={{fontSize:48,marginBottom:16}}>📄</div>
                <p style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:16,fontWeight:700,margin:"0 0 4px"}}>{pdfFileName}</p>
                <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,margin:"0 0 24px"}}>{(pdfFile.size / 1024).toFixed(0)} KB</p>
                <button
                  onClick={() => processPdf(pdfFile)}
                  style={{width:"100%",padding:"14px",background:t.accentGrad,border:"none",borderRadius:10,fontFamily:"Inter,sans-serif",fontSize:15,fontWeight:700,color:"#fff",cursor:"pointer",marginBottom:12}}>
                  🎨 Format My PDF
                </button>
                <button
                  onClick={()=>{setPdfPhase("idle");setPdfFile(null);setPdfFileName("");}}
                  style={{width:"100%",padding:"10px",background:"transparent",border:`1px solid ${t.surfaceBorder}`,borderRadius:8,fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:600,color:t.textMuted,cursor:"pointer"}}>
                  Choose Different File
                </button>
              </div>
            )}

            {pdfPhase === "loading" && (
              <div style={{textAlign:"center",padding:"50px 20px"}}>
                <div style={{fontSize:36,marginBottom:14}}>📑</div>
                <p style={{fontFamily:"Inter,sans-serif",color:t.text,fontSize:15,fontWeight:700,margin:"0 0 6px"}}>Formatting your PDF...</p>
                <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:12,margin:"0 0 20px"}}>{pdfFileName}</p>
                {pdfProgress.total > 0 && (
                  <>
                    <div style={{width:"100%",height:6,background:t.surface,borderRadius:3,overflow:"hidden",marginBottom:8}}>
                      <div style={{height:"100%",background:t.accentGrad,borderRadius:3,transition:"width 0.3s ease",width:`${(pdfProgress.current / pdfProgress.total) * 100}%`}}/>
                    </div>
                    <p style={{fontFamily:"Inter,sans-serif",color:t.textMuted,fontSize:11,margin:0}}>Page {pdfProgress.current} of {pdfProgress.total}</p>
                  </>
                )}
              </div>
            )}

            {pdfPhase === "error" && (
              <div style={{padding:"20px 0"}}>
                <div style={{background:"#e74c3c15",border:"1px solid #e74c3c40",borderRadius:8,padding:"14px",marginBottom:14}}>
                  <p style={{fontFamily:"Inter,sans-serif",color:"#e74c3c",fontSize:13,margin:0}}>{pdfErr}</p>
                </div>
                <button onClick={()=>{setPdfPhase("idle");setPdfFileName("");setPdfErr("");}}
                  style={{width:"100%",padding:"10px",background:t.accentGrad,border:"none",borderRadius:8,fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>
                  Try Another PDF
                </button>
              </div>
            )}

            {pdfPhase === "done" && pdfHtml && (
              <>
                <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontFamily:"Inter,sans-serif",fontSize:11,color:t.textMuted,flex:1}}>{pdfFileName}</span>
                  <button onClick={copyFormatted}
                    style={{padding:"7px 16px",borderRadius:20,border:`1px solid ${copied?"#1a7a2a":t.accent}`,background:copied?"#1a7a2a20":t.accentGrad,color:copied?"#1a7a2a":"#fff",fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    {copied ? "✓ Copied!" : "Copy Formatted"}
                  </button>
                  <button onClick={()=>{setPdfPhase("idle");setPdfFileName("");setPdfHtml("");setCopied(false);}}
                    style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${t.surfaceBorder}`,background:"transparent",color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:11,cursor:"pointer"}}>
                    New PDF
                  </button>
                </div>
                <div style={{background:"#fff",borderRadius:8,padding:"20px",border:"1px solid #e0e0e0"}}
                  dangerouslySetInnerHTML={{__html: pdfHtml}}/>

                {/* Launch Coach with PDF content */}
                <button
                  onClick={() => {
                    const tmp = document.createElement("div");
                    tmp.innerHTML = pdfHtml;
                    launchCoachWithContent(tmp.innerText, pdfFileName.replace(/\.pdf$/i,""), "pdf", pdfFileName);
                  }}
                  style={{width:"100%", marginTop:14, padding:"12px", background:t.accentGrad, border:"none", borderRadius:8, fontFamily:"Inter,sans-serif", fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
                  🧠 Launch Coach with This Content
                </button>
              </>
            )}
          </>
        )}

        {/* ── SAVED PROJECTS ──────────────────────────────────────────────── */}
        {savedProjects.length > 0 && (
          <div style={{marginTop:24, paddingTop:18, borderTop:`1px solid ${t.panelBorder}`}}>
            <p style={{fontFamily:"Inter,sans-serif", fontSize:10, color:t.accent, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", margin:"0 0 10px"}}>Saved Projects</p>
            <div style={{display:"flex", flexDirection:"column", gap:6}}>
              {savedProjects.map(proj => (
                <div key={proj.id} style={{background:t.surface, border:`1px solid ${t.surfaceBorder}`, borderRadius:8, padding:"10px 12px", display:"flex", alignItems:"center", gap:8}}>
                  <div style={{flex:1, cursor:"pointer"}} onClick={() => openSavedProject(proj)}>
                    <p style={{fontFamily:"Inter,sans-serif", fontSize:12, color:t.text, fontWeight:600, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{proj.title || "Untitled"}</p>
                    <p style={{fontFamily:"Inter,sans-serif", fontSize:10, color:t.textMuted, margin:"2px 0 0"}}>
                      {proj.sourceType || "manual"} · {(proj.coachMessages||[]).length} messages
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteSavedProject(proj.id); }}
                    style={{background:"transparent", border:"none", color:t.textMuted, cursor:"pointer", fontSize:14, padding:"2px 6px", opacity:0.5}}
                    onMouseEnter={e=>e.currentTarget.style.opacity="1"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="0.5"}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {loadingProjects && (
          <div style={{marginTop:24, textAlign:"center"}}>
            <p style={{fontFamily:"Inter,sans-serif", fontSize:11, color:t.textMuted}}>Loading saved projects...</p>
          </div>
        )}

      </div>
    </div>
  );
}

function SoapPanel({ onClose, t }) {
  const [input, setInput]     = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);

  function parseSoap(text) {
    const markers = ["SUMMARY","SCRIPTURE","OBSERVATION","APPLICATION","PRAYER","ONELINERS"];
    const out = {};
    const norm = text.replace(/\r\n/g,"\n");
    markers.forEach((m, i) => {
      // match "MARKER:" or "MARKER:\n" anywhere in text
      const re = new RegExp(m + ":\\s*\\n?");
      const match = re.exec(norm);
      if (!match) return;
      const contentStart = match.index + match[0].length;
      const nextPositions = markers.slice(i + 1)
        .map(nm => { const r = new RegExp(nm+":\\s*\\n?"); const mx = r.exec(norm); return mx ? mx.index : -1; })
        .filter(p => p > match.index);
      const end = nextPositions.length > 0 ? Math.min(...nextPositions) : norm.length;
      out[m] = norm.slice(contentStart, end).trim();
    });
    return out;
  }

  async function generate() {
    if (!input.trim() || loading) return;
    setLoading(true); setResult(null); setError("");
    try {
      const text = await callAI({ system:SOAP_SYSTEM, messages:[{role:"user",content:`Do a S.O.A.P. study on: ${input}`}], maxTokens:3000 });
      if (!text) { setError("Empty response. Try again."); setLoading(false); return; }
      setResult(parseSoap(text));
    } catch(e) { setError("Network error: " + (e.message || "Try again.")); }
    setLoading(false);
  }

  function copyAll() {
    if (!result) return;
    const lines = [
      "S.O.A.P. STUDY — " + input.toUpperCase(),
      "",
      "SUMMARY",
      result.SUMMARY || "",
      "",
      "SCRIPTURE",
      result.SCRIPTURE || "",
      "",
      "OBSERVATION",
      result.OBSERVATION || "",
      "",
      "APPLICATION",
      result.APPLICATION || "",
      "",
      "PRAYER",
      result.PRAYER || "",
      "",
      "ONE-LINERS",
      result.ONELINERS || "",
    ].join("\n");
    navigator.clipboard.writeText(lines).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  }

  const soapSections = [
    { key:"SUMMARY",     label:"Summary",     color:"#4a9ede", icon:"📖" },
    { key:"SCRIPTURE",   label:"Scripture",   color:"#cc0000", icon:"✝" },
    { key:"OBSERVATION", label:"Observation", color:"#2e7d32", icon:"👁" },
    { key:"APPLICATION", label:"Application", color:"#c8622a", icon:"⚡" },
    { key:"PRAYER",      label:"Prayer",      color:"#7b3f00", icon:"🙏" },
  ];

  const panelHeaderStyle = { padding:"14px 16px 10px", borderBottom:`1px solid ${t.panelBorder}`, flexShrink:0 };

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
      {/* Header */}
      <div style={panelHeaderStyle}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:t.accent}}/>
            <h3 style={{margin:0,fontFamily:"Inter,sans-serif",color:t.text,fontSize:15,fontWeight:800,letterSpacing:"-0.2px"}}>S.O.A.P. Study</h3>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:6,color:t.textMuted,cursor:"pointer",padding:"4px 10px",fontFamily:"Inter,sans-serif",fontSize:12}}>✕ Close</button>
        </div>
        <p style={{margin:"0 0 10px",fontFamily:"Inter,sans-serif",fontSize:11,color:t.textMuted,lineHeight:1.5}}>Drop a verse or passage for a quick devotional study.</p>
        <textarea
          rows={3}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)generate();}}
          placeholder={"John 3:16\nPsalm 23\nRomans 8:28-39"}
          style={{width:"100%",background:t.inputBg,border:`1px solid ${t.inputBorder}`,borderRadius:7,padding:"9px 11px",fontFamily:"Inter,sans-serif",fontSize:12,color:t.inputText,resize:"none",outline:"none",lineHeight:1.6,marginBottom:8}}
        />
        <button onClick={generate} disabled={loading||!input.trim()}
          style={{width:"100%",padding:"10px 0",background:loading||!input.trim()?t.surfaceBorder:t.accentGrad,border:"none",borderRadius:7,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:700,cursor:loading||!input.trim()?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.15s"}}>
          {loading
            ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={SS.spin}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Studying the Word...</>
            : "Run S.O.A.P. Study"
          }
        </button>
        {error && <p style={{fontFamily:"Inter,sans-serif",color:"#e05555",fontSize:11,margin:"6px 0 0"}}>{error}</p>}
      </div>

      {/* Results */}
      <div style={{flex:1,overflowY:"auto",padding:"10px 14px 20px"}}>
        {!result && !loading && (
          <div style={{textAlign:"center",padding:"40px 16px"}}>
            <div style={{fontSize:32,marginBottom:10}}>📖</div>
            <p style={{fontFamily:"Inter,sans-serif",color:t.textFaint,fontSize:12,lineHeight:1.6}}>Enter a scripture or passage above to generate your S.O.A.P. study.</p>
          </div>
        )}

        {loading && (
          <div style={{padding:"20px 0"}}>
            {[0.7,0.9,0.5,0.8,0.6,0.75].map((w,i)=>(
              <div key={i} style={{height:10,background:t.surfaceBorder,borderRadius:5,marginBottom:10,width:`${w*100}%`,opacity:0.4,animation:"pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.1}s`}}/>
            ))}
          </div>
        )}

        {result && !loading && (
          <>
            {/* Title + copy */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,paddingBottom:10,borderBottom:`1px solid ${t.panelBorder}`}}>
              <span style={{fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700,color:t.accent,textTransform:"uppercase",letterSpacing:"1px"}}>{input}</span>
              <button onClick={copyAll} style={{padding:"3px 10px",background:"transparent",border:`1px solid ${t.surfaceBorder}`,borderRadius:5,fontFamily:"Inter,sans-serif",fontSize:10,color:copied?"#4caf72":t.textMuted,cursor:"pointer",fontWeight:copied?700:400}}>
                {copied?"✓ Copied":"Copy All"}
              </button>
            </div>

            {/* S.O.A.P. sections */}
            {soapSections.map(sec => {
              if (!result[sec.key]) return null;
              return (
                <div key={sec.key} style={{marginBottom:14,padding:"11px 13px",background:t.surface,border:`1px solid ${t.panelBorder}`,borderLeft:`3px solid ${sec.color}`,borderRadius:"0 8px 8px 0"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}>
                    <span style={{fontSize:11}}>{sec.icon}</span>
                    <span style={{fontFamily:"Inter,sans-serif",fontSize:10,fontWeight:800,color:sec.color,textTransform:"uppercase",letterSpacing:"1.2px"}}>{sec.label}</span>
                  </div>
                  <p style={{margin:0,fontFamily:"Inter,sans-serif",fontSize:12,color:sec.key==="SCRIPTURE"?sec.color:t.text,lineHeight:1.7,whiteSpace:"pre-wrap",fontStyle:sec.key==="PRAYER"?"italic":"normal",fontWeight:sec.key==="SCRIPTURE"?600:400}}>{result[sec.key]}</p>
                </div>
              );
            })}

            {/* Standout Thoughts */}
            {result.ONELINERS && (()=>{
              const thoughts = result.ONELINERS.split("\n").map(l=>l.replace(/^\d+\.\s*/,"").replace(/^[""]|[""]$/g,"").trim()).filter(Boolean);
              if (!thoughts.length) return null;
              return (
                <div style={{marginTop:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                    <div style={{height:1,flex:1,background:`linear-gradient(90deg,${t.accent}60,transparent)`}}/>
                    <span style={{fontFamily:"Inter,sans-serif",fontSize:9,fontWeight:800,color:t.accent,textTransform:"uppercase",letterSpacing:"2px",whiteSpace:"nowrap"}}>Standout Thoughts</span>
                    <div style={{height:1,flex:1,background:`linear-gradient(90deg,transparent,${t.accent}60)`}}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {thoughts.map((thought,i)=>(
                      <div key={i} style={{background:`linear-gradient(135deg,${t.accent}14,${t.accent}06)`,border:`1px solid ${t.accent}35`,borderRadius:8,padding:"10px 14px",position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:8,left:10,fontFamily:"Georgia,serif",fontSize:28,color:`${t.accent}20`,lineHeight:1,userSelect:"none"}}>"</div>
                        <p style={{margin:0,fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:700,color:t.text,lineHeight:1.5,fontStyle:"italic",paddingLeft:10}}>{thought}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}

// ─── LOCK SCREEN ─────────────────────────────────────────────────────────────
function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [dots, setDots] = useState([]);
  const [checking, setChecking] = useState(false);

  async function handleDigit(d) {
    if (pin.length >= 6 || checking) return;
    const next = pin + d;
    setPin(next);
    setDots(next.split(""));
    if (next.length === 6) {
      setChecking(true);
      let valid = false;
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: next }),
        });
        if (res.ok) {
          const data = await res.json();
          valid = !!data.valid;
        }
      } catch { /* server unavailable */ }
      if (valid) {
        sessionStorage.setItem("sermon_unlocked", "1");
        setTimeout(onUnlock, 200);
        return;
      }
      setShake(true);
      setChecking(false);
      setTimeout(() => { setShake(false); setPin(""); setDots([]); }, 600);
    }
  }
  function handleBack() {
    const next = pin.slice(0, -1);
    setPin(next); setDots(next.split(""));
  }

  const digits = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];

  return (
    <div style={{position:"fixed",inset:0,background:"#111",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:9999,fontFamily:"Inter,sans-serif"}}>
      <svg width="38" height="38" viewBox="0 0 24 24" fill="#c97a3a" style={{marginBottom:16}}>
        <path d="M12 2C9 6 7 9 7 13a5 5 0 0 0 10 0c0-4-2-7-5-11zm0 15a3 3 0 0 1-3-3c0-2.5 1.2-4.8 3-7.5 1.8 2.7 3 5 3 7.5a3 3 0 0 1-3 3z"/>
      </svg>
      <div style={{color:"#fff",fontSize:22,fontWeight:800,marginBottom:4,letterSpacing:0.5}}>Sermon Studio</div>
      <div style={{color:"#888",fontSize:12,marginBottom:36,letterSpacing:1}}>ENTER PASSCODE</div>

      <div style={{display:"flex",gap:16,marginBottom:40,animation:shake?"shake 0.5s ease":"none"}}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{width:14,height:14,borderRadius:"50%",background:dots[i] ? "#c97a3a" : "transparent",border:"2px solid",borderColor:dots[i]?"#c97a3a":"#444",transition:"all 0.15s"}}/>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3, 72px)",gap:12}}>
        {digits.flat().map((d, i) => {
          if (d === "") return <div key={i}/>;
          const isBack = d === "⌫";
          return (
            <button key={i} onClick={() => isBack ? handleBack() : handleDigit(d)}
              style={{width:72,height:72,borderRadius:"50%",background:isBack?"transparent":"#1e1e1e",border:isBack?"none":"1px solid #333",color:isBack?"#888":"#fff",fontSize:isBack?20:22,fontWeight:isBack?400:600,cursor:"pointer",transition:"all 0.12s",display:"flex",alignItems:"center",justifyContent:"center"}}
              onMouseEnter={e=>{ if(!isBack) e.currentTarget.style.background="#2a2a2a"; }}
              onMouseLeave={e=>{ if(!isBack) e.currentTarget.style.background="#1e1e1e"; }}
            >{d}</button>
          );
        })}
      </div>

      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }`}</style>
    </div>
  );
}

// ─── QUICK FORMAT BAR ────────────────────────────────────────────────────────
// ─── UNDO TOAST ──────────────────────────────────────────────────────────────
function UndoToast({ items, onUndo, onDismiss }) {
  if (!items || items.length === 0) return null;
  const latest = items[items.length - 1];
  return (
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:9999,display:"flex",alignItems:"center",gap:12,padding:"10px 18px",background:"#1a1a1a",border:"1px solid #333",borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",fontFamily:"Inter,sans-serif",maxWidth:"90vw"}}>
      <span style={{fontSize:13,color:"#ccc",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        "{latest.title || "Item"}" deleted
      </span>
      <button onClick={() => onUndo(latest)}
        style={{padding:"5px 14px",background:"linear-gradient(135deg,#c8722a,#e08030)",border:"none",borderRadius:6,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
        Undo
      </button>
      <button onClick={() => onDismiss(latest)}
        style={{background:"transparent",border:"none",color:"#666",cursor:"pointer",fontSize:14,padding:"2px 4px",flexShrink:0}}>
        &#x2715;
      </button>
    </div>
  );
}

// ─── VOICE PROFILE APPENDIX ──────────────────────────────────────────────────
// Converts the dynamic voice profile (learned from uploads) into a system prompt appendix.
function buildVoiceAppendix(profile) {
  if (!profile || !profile.sermonCount) return "";
  const parts = [`\n\nADDITIONAL VOICE PATTERNS (learned from ${profile.sermonCount} real sermons by this preacher):`];
  if (profile.favoritePhrases?.length) parts.push(`Favorite phrases: ${profile.favoritePhrases.slice(0, 15).map(p => `"${p}"`).join(", ")}`);
  if (profile.humorPatterns) parts.push(`Humor style: ${profile.humorPatterns}`);
  if (profile.openingStyle) parts.push(`Opening style: ${profile.openingStyle}`);
  if (profile.closingStyle) parts.push(`Closing style: ${profile.closingStyle}`);
  if (profile.tensionBuilding) parts.push(`Tension building: ${profile.tensionBuilding}`);
  if (profile.transitionPhrases?.length) parts.push(`Transition phrases: ${profile.transitionPhrases.slice(0, 10).map(p => `"${p}"`).join(", ")}`);
  if (profile.crowdMoments?.length) parts.push(`Crowd moments: ${profile.crowdMoments.slice(0, 8).join("; ")}`);
  if (profile.gospelTurnStyle) parts.push(`Gospel turn: ${profile.gospelTurnStyle}`);
  if (profile.scriptureApproach) parts.push(`Scripture approach: ${profile.scriptureApproach}`);
  if (profile.sentenceStyle) parts.push(`Sentence style: ${profile.sentenceStyle}`);
  if (profile.uniqueVocab?.length) parts.push(`Unique vocabulary: ${profile.uniqueVocab.slice(0, 15).join(", ")}`);
  parts.push("Use these real patterns to make the output sound authentically like this preacher.");
  return parts.join("\n");
}

function QuickFormatBar({ editorRef, t, vertical, onDone }) {
  const [loading, setLoading] = useState(null); // category key or null

  async function runFormat(catKey) {
    if (loading || !editorRef.current) return;
    const cat = QUICK_FORMAT_CATEGORIES[catKey];
    if (!cat) return;

    const text = editorRef.current.innerText;
    if (!text || text.trim().length < 30) {
      alert("Not enough text to format. Add more content first.");
      return;
    }

    setLoading(catKey);
    try {
      const raw = await callAI({
        system: QUICK_FORMAT_SYSTEM,
        messages: [{ role: "user", content: `CATEGORY: ${cat.prompt}\n\nSERMON TEXT:\n${text.slice(0, 20000)}` }],
        maxTokens: 4000,
      });

      // Parse JSON response
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) { setLoading(null); return; }
      const snippets = JSON.parse(match[0]);
      if (!snippets.length) { setLoading(null); return; }

      // Apply formatting by walking text nodes and wrapping matches
      let applied = 0;
      for (const snippet of snippets) {
        const target = snippet.text;
        if (!target || target.length < 3) continue;
        applyStyleToText(editorRef.current, target, cat.style);
        applied++;
      }
    } catch (e) {
      console.warn("Quick format error:", e.message);
      alert("Format failed: " + e.message);
    }
    setLoading(null);
  }

  // Walk text nodes in a contentEditable and wrap matching text with a styled span
  function applyStyleToText(root, searchText, cssStyle) {
    // Normalize whitespace for matching
    const normalize = s => s.replace(/\s+/g, " ").trim();
    const normalizedSearch = normalize(searchText);
    if (!normalizedSearch) return;

    // Collect all text nodes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);

    // Build a combined string with node boundaries tracked
    let combined = "";
    const nodeRanges = []; // { node, start, end }
    for (const tn of textNodes) {
      const start = combined.length;
      combined += tn.textContent;
      nodeRanges.push({ node: tn, start, end: combined.length });
    }

    const normalizedCombined = normalize(combined);
    const idx = normalizedCombined.indexOf(normalizedSearch);
    if (idx === -1) return;

    // Map normalized index back to raw index (approximate — good enough for most cases)
    // Find the raw position by scanning through combined text
    let rawIdx = 0, normIdx = 0;
    const rawToNorm = [];
    for (let i = 0; i < combined.length; i++) {
      if (combined[i].match(/\s/) && (i === 0 || combined[i-1].match(/\s/))) continue;
      rawToNorm.push(i);
    }

    // Simpler approach: find the search text directly in the combined raw text
    let rawStart = combined.indexOf(searchText);
    if (rawStart === -1) {
      // Try with collapsed whitespace
      const collapsedCombined = combined.replace(/\s+/g, " ");
      const collapsedIdx = collapsedCombined.indexOf(normalizedSearch);
      if (collapsedIdx === -1) return;
      rawStart = collapsedIdx; // approximate
    }
    const rawEnd = rawStart + searchText.length;

    // Find which text nodes contain the range
    const range = document.createRange();
    let startSet = false, endSet = false;

    for (const nr of nodeRanges) {
      if (!startSet && rawStart >= nr.start && rawStart < nr.end) {
        range.setStart(nr.node, rawStart - nr.start);
        startSet = true;
      }
      if (startSet && !endSet && rawEnd > nr.start && rawEnd <= nr.end) {
        range.setEnd(nr.node, rawEnd - nr.start);
        endSet = true;
        break;
      }
    }

    if (!startSet || !endSet) return;

    // Wrap the range with a styled span
    try {
      const span = document.createElement("span");
      span.setAttribute("style", cssStyle);
      range.surroundContents(span);
    } catch (e) {
      // surroundContents can fail if range crosses element boundaries
      // Fallback: extract and re-insert
      try {
        const fragment = range.extractContents();
        const span = document.createElement("span");
        span.setAttribute("style", cssStyle);
        span.appendChild(fragment);
        range.insertNode(span);
      } catch (e2) { /* skip this snippet */ }
    }
  }

  const cats = Object.entries(QUICK_FORMAT_CATEGORIES);
  return (
    <div style={{display:"flex", flexDirection: vertical ? "column" : "row", alignItems: vertical ? "stretch" : "center", gap: vertical ? 4 : 6, flexWrap:"wrap"}}>
      {!vertical && <span style={{fontFamily:"Inter,sans-serif", fontSize:10, fontWeight:700, color:t.textMuted, letterSpacing:"0.5px", textTransform:"uppercase"}}>Format:</span>}
      {cats.map(([key, cat]) => (
        <button key={key}
          onClick={() => { runFormat(key); }}
          disabled={!!loading}
          style={{
            padding: vertical ? "8px 14px" : "4px 10px", borderRadius: vertical ? 8 : 14,
            border:`1.5px solid ${loading === key ? cat.color : t.surfaceBorder}`,
            background: loading === key ? `${cat.color}15` : "transparent",
            color: cat.color, fontFamily:"Inter,sans-serif", fontSize: vertical ? 13 : 11, fontWeight:600,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading && loading !== key ? 0.4 : 1,
            transition:"all 0.15s", whiteSpace:"nowrap",
            display:"flex", alignItems:"center", gap:6, textAlign:"left",
          }}>
          {loading === key && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin 1s linear infinite"}}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          )}
          <span style={{width:8, height:8, borderRadius:"50%", background:cat.color, flexShrink:0}}/>
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// ─── COACH VIEW (split: editor + AI chat) ────────────────────────────────────
function CoachView({ project, onExit, t }) {
  const [content, setContent]     = useState(project.content || "");
  const [messages, setMessages]   = useState(project.coachMessages || []);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending]     = useState(false);
  const [title, setTitle]         = useState(project.title || "Untitled");
  const chatEndRef = useRef(null);
  const saveTimerRef = useRef(null);
  const editorRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [showFormatDrop, setShowFormatDrop] = useState(false);
  // Audio recording
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecRef = useRef(null);
  const recordTimerRef = useRef(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      const chunks = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        setRecording(false);
        clearInterval(recordTimerRef.current);
        setRecordTime(0);
        // Transcribe
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = await res.json();
          if (data.text && editorRef.current) {
            // Append transcribed text to editor
            const div = document.createElement("div");
            div.style.cssText = "margin:0 0 8px;padding:0;line-height:1.7;font-family:Arial,sans-serif;font-size:12pt;color:#111;";
            div.textContent = data.text;
            editorRef.current.appendChild(div);
            setContent(Date.now().toString()); // trigger save
          } else if (data.error) {
            alert("Transcription failed: " + data.error);
          }
        } catch (e) {
          alert("Transcription error: " + e.message);
        }
        setTranscribing(false);
      };
      mediaRecRef.current = mr;
      mr.start();
      setRecording(true);
      setRecordTime(0);
      recordTimerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
    } catch (e) {
      alert("Microphone access denied. Please allow microphone access to record.");
    }
  }

  function stopRecording() {
    if (mediaRecRef.current && mediaRecRef.current.state === "recording") {
      mediaRecRef.current.stop();
    }
  }

  // Initialize editor with HTML content
  useEffect(() => {
    if (editorRef.current) {
      const c = project.content || "";
      // Detect if content is already HTML (from PDF formatting or previous save)
      const isHtml = project.isHtml || /<(div|span|strong|em)\b/i.test(c);
      if (isHtml) {
        editorRef.current.innerHTML = c;
      } else {
        // Plain text — wrap in styled divs like rawToHtml does
        editorRef.current.innerHTML = rawToHtml(c);
      }
    }
  }, []);

  function getEditorContent() {
    return editorRef.current ? editorRef.current.innerHTML : content;
  }

  function getEditorText() {
    return editorRef.current ? editorRef.current.innerText : content;
  }

  // Auto-save content to Firebase (debounced)
  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const html = getEditorContent();
      window.cloudProjects.save({ ...project, content: html, title, coachMessages: messages, isHtml: true }).catch(()=>{});
    }, 2000);
    return () => clearTimeout(saveTimerRef.current);
  }, [content, title, messages]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim() || sending) return;
    const userMsg = { role:"user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setChatInput("");
    setSending(true);

    // Stream coach response
    const streamingMsg = { role:"assistant", content: "" };
    setMessages([...updated, streamingMsg]);
    try {
      const sermonText = getEditorText();
      const systemWithContent = `${COACH_SYSTEM}\n\nHere is the preacher's current sermon content:\n\n${sermonText.slice(0, 15000)}`;
      const aiMessages = updated.map(m => ({ role: m.role, content: m.content }));
      const reply = await callAIStream({
        system: systemWithContent, messages: aiMessages, maxTokens: 4000,
        onChunk: (delta) => {
          streamingMsg.content += delta;
          setMessages([...updated, { ...streamingMsg }]);
        },
      });
      const final = [...updated, { role:"assistant", content: reply }];
      setMessages(final);
      window.cloudProjects.updateMessages(project.id, final).catch(()=>{});
    } catch(e) {
      const final = [...updated, { role:"assistant", content: `Error: ${e.message}` }];
      setMessages(final);
    }
    setSending(false);
  }

  function handleHotButton(btn) {
    sendMessage(btn.prompt);
  }

  const inputStyle = { width:"100%", padding:"10px 14px", background:t.inputBg, border:`1.5px solid ${t.inputBorder}`, borderRadius:8, color:t.inputText, fontFamily:"Inter,sans-serif", fontSize:13, lineHeight:1.5, resize:"none", outline:"none", boxSizing:"border-box" };

  return (
    <div className="coach-wrap" style={{display:"flex", flex:1, overflow:"hidden"}}>
      {/* ── LEFT: Sermon Editor ────────────────────────────────────────────── */}
      <div className="coach-left" style={{flex:1, display:"flex", flexDirection:"column", borderRight:`1px solid ${t.panelBorder}`}}>
        {/* Editor header */}
        <div style={{padding:"8px 14px", borderBottom:`1px solid ${t.panelBorder}`, display:"flex", alignItems:"center", gap:8, flexShrink:0, position:"relative"}}>
          <button onClick={onExit}
            style={{width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${t.surfaceBorder}`, borderRadius:8, background:"transparent", color:t.textMuted, fontFamily:"Inter,sans-serif", fontSize:14, cursor:"pointer", flexShrink:0}}>
            X
          </button>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Sermon title..."
            style={{flex:1, minWidth:0, background:"transparent", border:"none", color:t.text, fontFamily:"Inter,sans-serif", fontSize:14, fontWeight:700, outline:"none"}}
          />
          {/* Mic button */}
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={transcribing}
            style={{
              width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center",
              border:`1px solid ${recording ? "#e74c3c" : t.surfaceBorder}`,
              borderRadius:8, background: recording ? "#e74c3c20" : "transparent",
              color: recording ? "#e74c3c" : t.textMuted,
              cursor: transcribing ? "not-allowed" : "pointer", flexShrink:0, position:"relative",
            }}>
            {transcribing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin 1s linear infinite"}}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
            {recording && <span style={{position:"absolute", top:-2, right:-2, width:8, height:8, borderRadius:"50%", background:"#e74c3c", animation:"pulse 1s infinite"}}/>}
          </button>
          {recording && <span style={{fontFamily:"Inter,sans-serif", fontSize:10, color:"#e74c3c", fontWeight:600, flexShrink:0}}>{Math.floor(recordTime/60)}:{String(recordTime%60).padStart(2,"0")}</span>}

          <div style={{position:"relative", flexShrink:0}}>
            <button
              onClick={() => setShowFormatDrop(p => !p)}
              style={{padding:"5px 12px", borderRadius:16, border:`1px solid ${showFormatDrop ? t.accent : t.surfaceBorder}`, background:showFormatDrop ? `${t.accent}15` : "transparent", color:showFormatDrop ? t.accent : t.textMuted, fontFamily:"Inter,sans-serif", fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4}}>
              Format
              <span style={{fontSize:8}}>{showFormatDrop ? "\u25B2" : "\u25BC"}</span>
            </button>
            {showFormatDrop && (
              <div style={{position:"absolute", top:"100%", right:0, marginTop:6, background:t.panelBg, border:`1px solid ${t.surfaceBorder}`, borderRadius:10, padding:8, zIndex:500, boxShadow:"0 8px 24px rgba(0,0,0,0.4)", minWidth:180}}>
                <QuickFormatBar editorRef={editorRef} t={t} vertical onDone={() => setShowFormatDrop(false)}/>
              </div>
            )}
          </div>
        </div>

        {/* Rich editor area */}
        <div style={{flex:1, overflowY:"auto", background:"#fff"}}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => setContent(Date.now().toString())}
            style={{minHeight:"100%", padding:"32px 40px", fontFamily:"Arial,sans-serif", fontSize:"12pt", color:"#111", lineHeight:1.7, outline:"none", background:"#fff"}}
          />
        </div>
      </div>

      {/* ── RIGHT: AI Coach Chat ──────────────────────────────────────────── */}
      <div className="coach-right" style={{width:420, minWidth:320, display:"flex", flexDirection:"column", background:t.panelBg}}>
        {/* Coach header */}
        <div style={{padding:"8px 12px", borderBottom:`1px solid ${t.panelBorder}`, flexShrink:0}}>
          <h3 style={{margin:0, fontFamily:"Inter,sans-serif", color:t.text, fontSize:13, fontWeight:700}}>AI Sermon Coach</h3>
          <p style={{margin:"2px 0 0", fontFamily:"Inter,sans-serif", fontSize:9, color:t.textMuted, letterSpacing:"0.3px"}}>Stanley + Wilkerson + Furtick + Lentz + Groeschel</p>
        </div>

        {/* Hot buttons — horizontal scroll on mobile */}
        <div style={{padding:"6px 10px", borderBottom:`1px solid ${t.panelBorder}`, display:"flex", flexWrap:"nowrap", gap:5, flexShrink:0, overflowX:"auto", WebkitOverflowScrolling:"touch"}}>
          {COACH_HOT_BUTTONS.map(btn => (
            <button key={btn.id}
              onClick={() => handleHotButton(btn)}
              disabled={sending}
              style={{padding:"5px 10px", borderRadius:14, border:`1px solid ${t.surfaceBorder}`, background:t.surface, color:t.textMuted, fontFamily:"Inter,sans-serif", fontSize:11, fontWeight:600, cursor:sending?"not-allowed":"pointer", opacity:sending?0.5:1, transition:"all 0.15s", whiteSpace:"nowrap", flexShrink:0}}>
              {btn.emoji} {btn.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={{flex:1, overflowY:"auto", padding:"14px 14px 10px"}}>
          {messages.length === 0 && (
            <div style={{textAlign:"center", padding:"40px 16px"}}>
              <div style={{fontSize:36, marginBottom:12}}>🧠</div>
              <p style={{fontFamily:"Inter,sans-serif", color:t.text, fontSize:14, fontWeight:700, margin:"0 0 8px"}}>Your coaching team is ready</p>
              <p style={{fontFamily:"Inter,sans-serif", color:t.textMuted, fontSize:12, lineHeight:1.6, margin:0}}>
                Type your sermon on the left, then ask me anything or tap a hot button above. I'll reference your actual content when coaching.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{marginBottom:12, display:"flex", flexDirection:"column", alignItems: msg.role === "user" ? "flex-end" : "flex-start"}}>
              <div style={{
                maxWidth:"90%",
                padding:"10px 14px",
                borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: msg.role === "user" ? t.accentGrad : t.surface,
                border: msg.role === "user" ? "none" : `1px solid ${t.surfaceBorder}`,
                color: msg.role === "user" ? "#fff" : t.text,
              }}>
                <p style={{fontFamily:"Inter,sans-serif", fontSize:12, lineHeight:1.7, margin:0, whiteSpace:"pre-wrap"}}>{msg.content}</p>
              </div>
              <span style={{fontFamily:"Inter,sans-serif", fontSize:9, color:t.textMuted, marginTop:3, paddingLeft:4, paddingRight:4}}>
                {msg.role === "user" ? "You" : "Coach"}
              </span>
            </div>
          ))}

          {sending && (
            <div style={{marginBottom:12, display:"flex", flexDirection:"column", alignItems:"flex-start"}}>
              <div style={{padding:"10px 14px", borderRadius:"14px 14px 14px 4px", background:t.surface, border:`1px solid ${t.surfaceBorder}`}}>
                <div className="ld" style={{fontFamily:"Inter,sans-serif", fontSize:12, color:t.textMuted}}>
                  <span>.</span><span>.</span><span>.</span> thinking
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef}/>
        </div>

        {/* Input area */}
        <div style={{padding:"10px 12px 14px", borderTop:`1px solid ${t.panelBorder}`, flexShrink:0}}>
          <div style={{display:"flex", gap:8}}>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }}
              placeholder="Ask your coaching team..."
              rows={2}
              style={{...inputStyle, flex:1}}
            />
            <button
              onClick={() => sendMessage(chatInput)}
              disabled={!chatInput.trim() || sending}
              style={{padding:"0 16px", background:t.accentGrad, border:"none", borderRadius:8, color:"#fff", fontFamily:"Inter,sans-serif", fontSize:12, fontWeight:700, cursor:(!chatInput.trim()||sending)?"not-allowed":"pointer", opacity:(!chatInput.trim()||sending)?0.5:1, alignSelf:"stretch"}}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WORKSHOP BRIEF SECTION HELPER ───────────────────────────────────────────
function BriefSection({ title, value, placeholder, t }) {
  return (
    <div>
      <div style={{fontFamily:"Inter,sans-serif",fontSize:10,fontWeight:700,color:t.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4}}>{title}</div>
      <div style={{fontFamily:"Inter,sans-serif",fontSize:12,color:value?t.text:t.textFaint,lineHeight:1.55,fontStyle:value?"normal":"italic"}}>
        {value || placeholder}
      </div>
    </div>
  );
}

// ─── WORKSHOP VIEW ────────────────────────────────────────────────────────────
function WorkshopView({ onExit, onGenerate, voiceProfile, t }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [brief, setBrief] = useState({
    scripture:"", context:"", bigIdea:"",
    points:[], illustrations:[], application:"", callToAction:""
  });
  const chatEndRef = useRef(null);
  const isMobile = useIsMobile();
  const currentStage = WORKSHOP_STAGES[stageIdx];

  // Launch opening message when the workshop loads
  useEffect(() => { kickStage(0, []); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  function parseBriefUpdate(text) {
    const m = text.match(/<<<BRIEF_UPDATE>>>([\s\S]*?)<<<END>>>/);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return null; }
  }

  function stripBriefUpdate(text) {
    return text.replace(/<<<BRIEF_UPDATE>>>[\s\S]*?<<<END>>>/g, "").trim();
  }

  function applyUpdate(update) {
    if (!update) return;
    const valid = ["scripture","context","bigIdea","points","illustrations","application","callToAction"];
    setBrief(prev => {
      const next = { ...prev };
      if (update.field !== undefined && update.value !== undefined) {
        if (valid.includes(update.field)) next[update.field] = update.value;
      } else {
        Object.keys(update).forEach(k => { if (valid.includes(k)) next[k] = update[k]; });
      }
      return next;
    });
  }

  function buildSystemPrompt(currentBrief) {
    const voiceAppendix = buildVoiceAppendix(voiceProfile);
    const s = WORKSHOP_STAGES[stageIdx];
    return `${WORKSHOP_SYSTEM}${voiceAppendix}\n\nCURRENT STAGE: ${s.label}\nSTAGE COACHING GOAL: ${s.stageContext}\n\nCURRENT SERMON BRIEF:\n${JSON.stringify(currentBrief, null, 2)}`;
  }

  async function kickStage(idx, existingMessages) {
    const s = WORKSHOP_STAGES[idx];
    const briefAtStart = { scripture:"", context:"", bigIdea:"", points:[], illustrations:[], application:"", callToAction:"" };
    const voiceAppendix = buildVoiceAppendix(voiceProfile);
    const sys = `${WORKSHOP_SYSTEM}${voiceAppendix}\n\nCURRENT STAGE: ${s.label}\nSTAGE COACHING GOAL: ${s.stageContext}\n\nCURRENT SERMON BRIEF:\n${JSON.stringify(briefAtStart, null, 2)}`;

    const openMsg = idx === 0
      ? "Start our session. Welcome the pastor warmly in 1-2 sentences, then jump straight into your first question for the Text Study stage. Keep it short and energizing."
      : `We are moving into the ${s.label} stage. Briefly acknowledge what we have built so far, then ask your first focused question for this stage.`;

    const streamingMsg = { role:"assistant", content:"" };
    setMessages([...existingMessages, streamingMsg]);
    setSending(true);
    try {
      const reply = await callAIStream({
        system: sys,
        messages: [{ role:"user", content: openMsg }],
        maxTokens: 500,
        onChunk: (delta) => {
          streamingMsg.content += delta;
          setMessages([...existingMessages, { ...streamingMsg }]);
        },
      });
      const cleaned = stripBriefUpdate(reply);
      const update = parseBriefUpdate(reply);
      if (update) applyUpdate(update);
      setMessages([...existingMessages, { role:"assistant", content: cleaned }]);
    } catch(e) {
      setMessages([...existingMessages, { role:"assistant", content:"Let's build your sermon. What scripture is God putting on your heart this week?" }]);
    }
    setSending(false);
  }

  async function sendMessage(text) {
    if (!text.trim() || sending) return;
    const userMsg = { role:"user", content:text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setChatInput("");
    setSending(true);

    const streamingMsg = { role:"assistant", content:"" };
    setMessages([...updated, streamingMsg]);
    try {
      const sys = buildSystemPrompt(brief);
      const aiMessages = updated.map(m => ({ role:m.role, content:m.content }));
      const reply = await callAIStream({
        system: sys,
        messages: aiMessages,
        maxTokens: 800,
        onChunk: (delta) => {
          streamingMsg.content += delta;
          setMessages([...updated, { ...streamingMsg }]);
        },
      });
      const cleaned = stripBriefUpdate(reply);
      const update = parseBriefUpdate(reply);
      if (update) applyUpdate(update);
      setMessages([...updated, { role:"assistant", content: cleaned }]);
    } catch(e) {
      setMessages([...updated, { role:"assistant", content:`Error: ${e.message}` }]);
    }
    setSending(false);
  }

  function handleQuickAction(action) {
    if (action.prompt === "_NEXT_STAGE_") {
      if (stageIdx < WORKSHOP_STAGES.length - 1) {
        const next = stageIdx + 1;
        setStageIdx(next);
        // kickStage needs the current brief — pass via closure
        const s = WORKSHOP_STAGES[next];
        const voiceAppendix = buildVoiceAppendix(voiceProfile);
        const sys = `${WORKSHOP_SYSTEM}${voiceAppendix}\n\nCURRENT STAGE: ${s.label}\nSTAGE COACHING GOAL: ${s.stageContext}\n\nCURRENT SERMON BRIEF:\n${JSON.stringify(brief, null, 2)}`;
        const openMsg = `We are moving into the ${s.label} stage. Briefly acknowledge what we have decided so far, then ask your first focused question for this new stage.`;
        const streamingMsg = { role:"assistant", content:"" };
        const existingMessages = messages;
        setMessages([...existingMessages, streamingMsg]);
        setSending(true);
        callAIStream({
          system: sys,
          messages: [{ role:"user", content: openMsg }],
          maxTokens: 500,
          onChunk: (delta) => {
            streamingMsg.content += delta;
            setMessages([...existingMessages, { ...streamingMsg }]);
          },
        }).then(reply => {
          const cleaned = stripBriefUpdate(reply);
          const update = parseBriefUpdate(reply);
          if (update) applyUpdate(update);
          setMessages([...existingMessages, { role:"assistant", content: cleaned }]);
          setSending(false);
        }).catch(e => {
          setMessages([...existingMessages, { role:"assistant", content:`Let's move to ${s.label}. ${s.desc}` }]);
          setSending(false);
        });
      }
    } else {
      sendMessage(action.prompt);
    }
  }

  function buildExportPrompt() {
    const b = brief;
    const parts = [];
    if (b.scripture)          parts.push(`SCRIPTURE: ${b.scripture}`);
    if (b.context)            parts.push(`CONTEXT: ${b.context}`);
    if (b.bigIdea)            parts.push(`BIG IDEA: ${b.bigIdea}`);
    if (b.points?.length)     parts.push(`MAIN POINTS:\n${b.points.map((p,i)=>`${i+1}. ${p.title}${p.summary?` — ${p.summary}`:""}`).join("\n")}`);
    if (b.illustrations?.length) parts.push(`ILLUSTRATIONS:\n${b.illustrations.map((il,i)=>`${i+1}. For point "${il.point}": ${il.illustration}`).join("\n")}`);
    if (b.application)        parts.push(`APPLICATION: ${b.application}`);
    if (b.callToAction)       parts.push(`CALL TO ACTION: ${b.callToAction}`);
    return parts.join("\n\n");
  }

  const hasBriefContent = brief.scripture || brief.bigIdea || brief.points?.length > 0 || brief.application;
  const inputStyle = { width:"100%", padding:"10px 14px", background:t.inputBg, border:`1.5px solid ${t.inputBorder}`, borderRadius:8, color:t.inputText, fontFamily:"Inter,sans-serif", fontSize:13, lineHeight:1.5, resize:"none", outline:"none", boxSizing:"border-box" };

  return (
    <div className="coach-wrap" style={{display:"flex", flex:1, overflow:"hidden"}}>

      {/* ── LEFT: Sermon Brief ──────────────────────────────────────────────── */}
      <div className="coach-left" style={{
        width: isMobile ? "100%" : 320, flexShrink:0,
        display:"flex", flexDirection:"column",
        borderRight:`1px solid ${t.panelBorder}`, overflowY:"auto",
      }}>
        {/* Header */}
        <div style={{padding:"10px 14px", borderBottom:`1px solid ${t.panelBorder}`, display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
          <button onClick={onExit}
            style={{width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${t.surfaceBorder}`, borderRadius:7, background:"transparent", color:t.textMuted, fontFamily:"Inter,sans-serif", fontSize:12, cursor:"pointer"}}>
            ✕
          </button>
          <span style={{fontFamily:"Inter,sans-serif", fontSize:13, fontWeight:700, color:t.text, flex:1}}>📋 Sermon Brief</span>
        </div>

        {/* Stage progress bar */}
        <div style={{padding:"10px 14px 8px", borderBottom:`1px solid ${t.panelBorder}`, flexShrink:0}}>
          <div style={{display:"flex", gap:3, marginBottom:6}}>
            {WORKSHOP_STAGES.map((s, i) => (
              <div key={s.id}
                title={s.label}
                onClick={() => i <= stageIdx && setStageIdx(i)}
                style={{
                  flex:1, height:4, borderRadius:2, cursor: i <= stageIdx ? "pointer" : "default",
                  background: i < stageIdx ? t.accent : i === stageIdx ? t.accent : t.surfaceBorder,
                  opacity: i > stageIdx ? 0.3 : 1,
                  transition:"all 0.3s",
                }}
              />
            ))}
          </div>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <span style={{fontFamily:"Inter,sans-serif", fontSize:11, color:t.accent, fontWeight:700}}>{currentStage.label}</span>
            <span style={{fontFamily:"Inter,sans-serif", fontSize:10, color:t.textMuted}}>{stageIdx+1} / {WORKSHOP_STAGES.length}</span>
          </div>
        </div>

        {/* Brief content */}
        <div style={{flex:1, overflowY:"auto", padding:"14px", display:"flex", flexDirection:"column", gap:14}}>
          <BriefSection title="Scripture" value={brief.scripture} placeholder="Not decided yet" t={t}/>
          {brief.context && <BriefSection title="Context" value={brief.context} placeholder="" t={t}/>}
          <BriefSection title="Big Idea" value={brief.bigIdea} placeholder="Not decided yet" t={t}/>

          {/* Points */}
          <div>
            <div style={{fontFamily:"Inter,sans-serif", fontSize:10, fontWeight:700, color:t.textMuted, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:6}}>Main Points</div>
            {brief.points?.length ? brief.points.map((p,i) => (
              <div key={i} style={{marginBottom:6, padding:"8px 10px", background:t.surface, borderRadius:8, borderLeft:`3px solid ${t.accent}`}}>
                <div style={{fontFamily:"Inter,sans-serif", fontSize:12, fontWeight:600, color:t.text}}>{i+1}. {p.title}</div>
                {p.summary && <div style={{fontFamily:"Inter,sans-serif", fontSize:11, color:t.textMuted, marginTop:2}}>{p.summary}</div>}
              </div>
            )) : (
              <div style={{fontFamily:"Inter,sans-serif", fontSize:12, color:t.textFaint, fontStyle:"italic"}}>Not decided yet</div>
            )}
          </div>

          {/* Illustrations */}
          {brief.illustrations?.length > 0 && (
            <div>
              <div style={{fontFamily:"Inter,sans-serif", fontSize:10, fontWeight:700, color:t.textMuted, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:6}}>Illustrations</div>
              {brief.illustrations.map((il,i) => (
                <div key={i} style={{marginBottom:6, padding:"8px 10px", background:t.surface, borderRadius:8, borderLeft:"3px solid #00b4d8"}}>
                  <div style={{fontFamily:"Inter,sans-serif", fontSize:10, color:"#00b4d8", fontWeight:700, marginBottom:2}}>{il.point}</div>
                  <div style={{fontFamily:"Inter,sans-serif", fontSize:12, color:t.text}}>{il.illustration}</div>
                </div>
              ))}
            </div>
          )}

          <BriefSection title="Application" value={brief.application} placeholder="Not decided yet" t={t}/>
          {brief.callToAction && <BriefSection title="Call to Action" value={brief.callToAction} placeholder="" t={t}/>}
        </div>

        {/* Export buttons */}
        {hasBriefContent && (
          <div style={{padding:"12px 14px", borderTop:`1px solid ${t.panelBorder}`, display:"flex", gap:8, flexShrink:0}}>
            <button
              onClick={() => onGenerate(buildExportPrompt(), "outline")}
              style={{flex:1, padding:"9px 0", background:t.btnInactiveBg, border:`1px solid ${t.surfaceBorder}`, borderRadius:8, color:t.text, fontFamily:"Inter,sans-serif", fontSize:12, fontWeight:600, cursor:"pointer"}}>
              → Outline
            </button>
            <button
              onClick={() => onGenerate(buildExportPrompt(), "manuscript")}
              style={{flex:1, padding:"9px 0", background:t.accentGrad, border:"none", borderRadius:8, color:"#fff", fontFamily:"Inter,sans-serif", fontSize:12, fontWeight:700, cursor:"pointer"}}>
              → Manuscript
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT: Chat ─────────────────────────────────────────────────────── */}
      <div className="coach-right" style={{flex:1, display:"flex", flexDirection:"column", minWidth:0}}>
        {/* Chat header */}
        <div style={{padding:"10px 16px", borderBottom:`1px solid ${t.panelBorder}`, flexShrink:0}}>
          <div style={{fontFamily:"Inter,sans-serif", fontSize:13, fontWeight:700, color:t.text}}>
            🤝 Sermon Workshop
          </div>
          <div style={{fontFamily:"Inter,sans-serif", fontSize:11, color:t.textMuted, marginTop:1}}>
            {currentStage.desc}
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:10}}>
          {messages.map((m, i) => (
            <div key={i} style={{display:"flex", flexDirection:"column", alignItems:m.role==="user"?"flex-end":"flex-start"}}>
              <div style={{
                maxWidth:"85%", padding:"10px 14px",
                background: m.role==="user" ? t.accentGrad : t.surface,
                borderRadius: m.role==="user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                color: m.role==="user" ? "#fff" : t.text,
                fontFamily:"Inter,sans-serif", fontSize:13, lineHeight:1.65,
                whiteSpace:"pre-wrap",
                border: m.role==="assistant" ? `1px solid ${t.surfaceBorder}` : "none",
              }}>
                {m.content || (sending && i === messages.length - 1 ? <span style={{opacity:0.4}}>...</span> : "")}
              </div>
            </div>
          ))}
          <div ref={chatEndRef}/>
        </div>

        {/* Quick action chips */}
        <div style={{padding:"8px 16px 4px", display:"flex", gap:6, flexWrap:"wrap", borderTop:`1px solid ${t.panelBorder}`, flexShrink:0}}>
          {WORKSHOP_QUICK_ACTIONS.map(a => (
            <button key={a.label}
              onClick={() => handleQuickAction(a)}
              disabled={sending}
              style={{
                padding:"5px 10px", background:a.prompt==="_NEXT_STAGE_"?t.accentGrad:t.surface,
                border:`1px solid ${a.prompt==="_NEXT_STAGE_"?"transparent":t.surfaceBorder}`,
                borderRadius:16, color:a.prompt==="_NEXT_STAGE_"?"#fff":t.textMuted,
                fontFamily:"Inter,sans-serif", fontSize:11, fontWeight:600,
                cursor:sending?"not-allowed":"pointer", whiteSpace:"nowrap",
                opacity:sending?0.6:1,
              }}>
              {a.label}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div style={{padding:"8px 16px 16px", flexShrink:0}}>
          <div style={{display:"flex", gap:8, alignItems:"flex-end"}}>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }}
              placeholder="Share your thoughts..."
              rows={2}
              style={{...inputStyle, flex:1}}
              disabled={sending}
            />
            <button
              onClick={() => sendMessage(chatInput)}
              disabled={sending || !chatInput.trim()}
              style={{
                width:40, height:40, flexShrink:0, background:t.accentGrad,
                border:"none", borderRadius:8, color:"#fff",
                cursor:sending||!chatInput.trim()?"not-allowed":"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                opacity:sending||!chatInput.trim()?0.45:1, transition:"opacity 0.15s",
                fontSize:14,
              }}>
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
function App() {
  const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";
  const [locked, setLocked] = useState(() => isDev ? false : sessionStorage.getItem("sermon_unlocked") !== "1");
  const [modeId, setModeId]         = useState("outline");
  const [input, setInput]           = useState("");
  const [output, setOutput]         = useState("");
  const [versionStack, setVersionStack] = useState([]); // [{output, input, ts, label}] last 3
  const [activeVersion, setActiveVersion] = useState(null); // null = latest
  const [lastInput, setLastInput]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [history, setHistory]       = useState(KODY_SERMONS);
  const [length, setLength]         = useState("25");
  const [themeKey, setThemeKey]     = useState("burnt");
  // sidebar: null = collapsed icon rail only, or one of "idea"|"history"|"settings"
  const [sidePanel, setSidePanel]   = useState(null);
  const [loadedHistId, setLoadedHistId] = useState(null);
  const [preacherName, setPreacherName] = useState("Kody Countryman");
  const [defaultTrans, setDefaultTrans] = useState("KJV");
  const [editorFontSize, setEditorFontSize] = useState("11pt");
  const [stories, setStories] = useState([]);
  const [tuneSettings, setTuneSettings] = useState({ pastorSliders:{kody:80,rich:60,carl:40}, enabledPastors:["kody","rich"], outlineMethod:"kody", venue:"home", audience:"mixed", length:"25", closingMoment:"salvation" });
  const [voiceProfile, setVoiceProfile] = useState(null);
  const outRef = useRef(null);
  const pdfEditorRef = useRef(null);
  const [deliverMode, setDeliverMode] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [coachMode, setCoachMode] = useState(false);
  const [workshopMode, setWorkshopMode] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [undoItems, setUndoItems] = useState([]);
  const undoTimersRef = useRef(new Map());
  const [coachProject, setCoachProject] = useState(null);
  const [pdfResult, setPdfResult] = useState(null); // { html, fileName }

  function launchCoach(project) {
    setCoachProject(project);
    setCoachMode(true);
    setWorkshopMode(false);
    setSidePanel(null);
    setPdfResult(null);
  }
  function exitCoach() {
    setCoachMode(false);
    setCoachProject(null);
  }
  function launchWorkshop() {
    setWorkshopMode(true);
    setCoachMode(false);
    setCoachProject(null);
    setSidePanel(null);
    setPdfResult(null);
  }
  function exitWorkshop() {
    setWorkshopMode(false);
  }
  function handleWorkshopExport(prompt, targetModeId) {
    setInput(prompt);
    setModeId(targetModeId);
    setOutput("");
    setVersionStack([]);
    setActiveVersion(null);
    setWorkshopMode(false);
  }
  function handlePdfDone(result) {
    setPdfResult(result);
    setSidePanel(null); // close Make It Mine panel — content shows in main area
  }
  function clearPdfResult() {
    setPdfResult(null);
  }

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setDeliverMode(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Autosave draft ─────────────────────────────────────────────────────────
  const draftSaveRef = useRef(null);
  useEffect(() => {
    if (!input.trim()) return;
    clearTimeout(draftSaveRef.current);
    draftSaveRef.current = setTimeout(async () => {
      try { await window.storage.set("sermon-draft", JSON.stringify({ input, modeId, length, ts: Date.now() })); } catch(e) {}
    }, 1200);
    return () => clearTimeout(draftSaveRef.current);
  }, [input, modeId, length]);

  const mode = MAIN_MODES.find(m => m.id === modeId) || MAIN_MODES[0];
  const t = THEMES[themeKey] || THEMES.burnt;

  useEffect(() => {
    // ── Load history from cloud first, fallback to localStorage ──────────────
    (async () => {
      try {
        const cloud = await window.cloudHistory.load();
        if (cloud && cloud.length > 0) {
          const cloudIds = new Set(cloud.map(h => h.id));
          const merged = [...KODY_SERMONS.filter(s => !cloudIds.has(s.id)), ...cloud];
          setHistory(merged);
          return;
        }
        // Cloud empty — try local
        const r = await window.storage.get("sermon-history-v3");
        if (r?.value) {
          const stored = JSON.parse(r.value);
          const storedIds = new Set(stored.map(h => h.id));
          const merged = [...KODY_SERMONS.filter(s => !storedIds.has(s.id)), ...stored];
          setHistory(merged);
          // Migrate local → cloud
          stored.forEach(item => window.cloudHistory.save(item).catch(()=>{}));
          return;
        }
        setHistory(KODY_SERMONS);
      } catch(e) { setHistory(KODY_SERMONS); }
    })();
    // ── Load stories from cloud first ─────────────────────────────────────────
    (async () => {
      try {
        const cloud = await window.cloudStories.load();
        if (cloud && cloud.length > 0) {
          const cloudIds = new Set(cloud.map(s => s.id));
          const merged = [...KODY_STORIES.filter(s => !cloudIds.has(s.id)), ...cloud];
          setStories(merged);
          return;
        }
        const r = await window.storage.get("sermon-stories");
        if (r?.value) {
          const stored = JSON.parse(r.value);
          const storedIds = new Set(stored.map(s => s.id));
          const merged = [...KODY_STORIES.filter(s => !storedIds.has(s.id)), ...stored];
          setStories(merged);
          stored.forEach(s => window.cloudStories.save(s).catch(()=>{}));
        } else {
          setStories(KODY_STORIES);
        }
      } catch(e) { setStories(KODY_STORIES); }
    })();
    (async () => {
      try { const r = await window.storage.get("sermon-theme"); if (r?.value && THEMES[r.value]) setThemeKey(r.value); } catch(e) {}
    })();
    (async () => {
      try { const r = await window.storage.get("sermon-mode"); if (r?.value && MAIN_MODES.find(m=>m.id===r.value)) setModeId(r.value); } catch(e) {}
    })();
    (async () => {
      try { const r = await window.storage.get("sermon-length"); if (r?.value) setLength(r.value); } catch(e) {}
    })();
    (async () => {
      try {
        // Try localStorage first, then Supabase
        const r = await window.storage.get("sermon-voice-profile");
        if (r?.value) { setVoiceProfile(JSON.parse(r.value)); return; }
        const cloud = await window.cloudVoiceProfile.load();
        if (cloud) { setVoiceProfile(cloud); await window.storage.set("sermon-voice-profile", JSON.stringify(cloud)); }
      } catch(e) {}
    })();
    (async () => {
      try { const r = await window.storage.get("sermon-tune"); if (r?.value) setTuneSettings(JSON.parse(r.value)); } catch(e) {}
    })();
    (async () => {
      try {
        const r = await window.storage.get("sermon-draft");
        if (r?.value) {
          const d = JSON.parse(r.value);
          if (d.input && d.ts && (Date.now() - d.ts) < 7 * 24 * 60 * 60 * 1000) {
            setInput(d.input);
            if (d.modeId && MAIN_MODES.find(m=>m.id===d.modeId)) setModeId(d.modeId);
            if (d.length && LENGTHS[d.length]) setLength(d.length);
          }
        }
      } catch(e) {}
    })();
  }, []);

  async function saveHist(item) {
    const u = [...history, item].slice(-80); setHistory(u);
    try { await window.storage.set("sermon-history-v3", JSON.stringify(u)); } catch(e) {}
    window.cloudHistory.save(item).catch(()=>{});
  }
  async function delHist(id) {
    const item = history.find(h => h.id === id);
    const u = history.filter(h => h.id !== id); setHistory(u);
    try { await window.storage.set("sermon-history-v3", JSON.stringify(u)); } catch(e) {}
    // Soft delete: schedule cloud delete after 8 seconds, allow undo
    if (item) {
      const undoKey = "hist-" + id;
      setUndoItems(prev => [...prev, { key: undoKey, type: "history", id, item, title: item.title }]);
      const timer = setTimeout(() => {
        window.cloudHistory.delete(id).catch(()=>{});
        undoTimersRef.current.delete(undoKey);
        setUndoItems(prev => prev.filter(u => u.key !== undoKey));
      }, 8000);
      undoTimersRef.current.set(undoKey, timer);
    }
  }
  async function addStory(story) {
    const u = [...stories, story]; setStories(u);
    try { await window.storage.set("sermon-stories", JSON.stringify(u)); } catch(e) {}
    window.cloudStories.save(story).catch(()=>{});
  }
  async function addStoriesBatch(newStories) {
    const existIds = new Set(stories.map(s=>s.id));
    const toAdd = newStories
      .filter(s=>!existIds.has("story-upload-"+s.title))
      .map((s,i)=>({...s, id:"story-upload-"+Date.now()+"-"+i, timestamp:Date.now()}));
    if (!toAdd.length) return;
    const u = [...stories, ...toAdd]; setStories(u);
    try { await window.storage.set("sermon-stories", JSON.stringify(u)); } catch(e) {}
  }
  async function deleteStory(id) {
    const item = stories.find(s => s.id === id);
    const u = stories.filter(s=>s.id!==id); setStories(u);
    try { await window.storage.set("sermon-stories", JSON.stringify(u)); } catch(e) {}
    if (item) {
      const undoKey = "story-" + id;
      setUndoItems(prev => [...prev, { key: undoKey, type: "story", id, item, title: item.title }]);
      const timer = setTimeout(() => {
        window.cloudStories.delete(id).catch(()=>{});
        undoTimersRef.current.delete(undoKey);
        setUndoItems(prev => prev.filter(u => u.key !== undoKey));
      }, 8000);
      undoTimersRef.current.set(undoKey, timer);
    }
  }
  async function applyTune(settings) {
    setTuneSettings(settings);
    setLength(settings.length||"25");
    try { await window.storage.set("sermon-tune", JSON.stringify(settings)); } catch(e) {}
    setSidePanel(null);
  }
  async function applyTheme(key) {
    setThemeKey(key);
    try { await window.storage.set("sermon-theme", key); } catch(e) {}
  }

  async function switchMode(id) {
    setModeId(id); setOutput(""); setInput(""); setVersionStack([]); setActiveVersion(null);
    try { await window.storage.set("sermon-mode", id); } catch(e) {}
  }

  async function changeLength(val) {
    setLength(val);
    try { await window.storage.set("sermon-length", val); } catch(e) {}
  }


  const abortRef = useRef(null);

  async function generate(force=false) {
    if (!input.trim()) return;
    if (output && !force) { setShowRegenConfirm(true); return; }
    setShowRegenConfirm(false);
    setLoading(true); setOutput(""); setError("");
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const closingExtra = tuneSettings.closingMoment ? `\n\nCLOSING MOMENT INSTRUCTION: ${CLOSING_NOTES[tuneSettings.closingMoment]||CLOSING_NOTES.salvation}` : "";
      const tuneExtra = buildTuneInstructions(tuneSettings, modeId);
      const voiceExtra = buildVoiceAppendix(voiceProfile);
      const sys = (mode.isEditor ? buildSystemWithLength(mode.system, length) : mode.system) + closingExtra + tuneExtra + voiceExtra;
      const lengthCfg = LENGTHS[length];
      const userContent = mode.isEditor
        ? `${mode.userMsg(input)}\n\nWORD COUNT: ${lengthCfg.wMin}–${lengthCfg.wMax} words total. Stop at ${lengthCfg.wMax}.`
        : mode.userMsg(input);
      // Stream response word-by-word
      const text = await callAIStream({
        system: sys,
        messages: [{ role: "user", content: userContent }],
        maxTokens: 16000,
        onChunk: (delta) => setOutput(prev => prev + delta),
        signal: ac.signal,
      }) || "No response received.";
      setOutput(text); setLastInput(input); setActiveVersion(null);
      setVersionStack(prev => {
        const entry = { output:text, input, ts:Date.now(), label:"v"+(prev.length+1) };
        const updated = [entry, ...prev].slice(0,3);
        return updated.map((v,i) => ({...v, label:"v"+(updated.length-i)}));
      });
      await saveHist({ id:Date.now().toString(), timestamp:Date.now(), modeId, modeLabel:mode.label, title:extractTitle(input,modeId), input, output:text, length });
      try { await window.storage.delete("sermon-draft"); } catch(e) {}
      setTimeout(() => outRef.current?.scrollIntoView({behavior:"smooth"}), 100);
    } catch(e) {
      if (e.name === "AbortError") { /* user stopped */ }
      else setError(e.message || "Something went wrong. Check your connection and try again.");
    }
    abortRef.current = null;
    setLoading(false);
  }

  function stopGeneration() {
    if (abortRef.current) abortRef.current.abort();
  }

  async function expandToManuscript() {
    if (!output || modeId !== "outline") return;
    if (!window.confirm("This will switch to Manuscript mode and write the full sermon from your outline. Continue?")) return;
    const outlineText = output;
    await switchMode("manuscript");
    // Small delay for mode to settle, then set input and generate
    setTimeout(async () => {
      setInput(outlineText);
      setOutput(""); setError("");
      setLoading(true);
      try {
        const closingExtra = tuneSettings.closingMoment ? `\n\nCLOSING MOMENT INSTRUCTION: ${CLOSING_NOTES[tuneSettings.closingMoment]||CLOSING_NOTES.salvation}` : "";
        const tuneExtra = buildTuneInstructions(tuneSettings, "manuscript");
        const msMode = MAIN_MODES.find(m=>m.id==="manuscript");
        const sys = buildSystemWithLength(msMode.system, length) + closingExtra + tuneExtra + buildVoiceAppendix(voiceProfile);
        const text = await callAIStream({ system:sys, messages:[{role:"user",content:`Write a full word-for-word sermon manuscript from this outline:\n\n${outlineText}`}], maxTokens:16000, onChunk:(delta)=>setOutput(prev=>prev+delta) }) || "No response received.";
        setOutput(text); setLastInput(outlineText); setActiveVersion(null);
        setVersionStack([{ output:text, input:outlineText, ts:Date.now(), label:"v1" }]);
        await saveHist({ id:Date.now().toString(), timestamp:Date.now(), modeId:"manuscript", modeLabel:"Manuscript", title:extractTitle(outlineText,"manuscript"), input:outlineText, output:text, length });
        setTimeout(() => outRef.current?.scrollIntoView({behavior:"smooth"}), 100);
      } catch(e) { setError("Something went wrong expanding the outline."); }
      setLoading(false);
    }, 80);
  }

  function loadHist(item) {
    setModeId(item.modeId); setInput(item.input||""); setLastInput(item.input||""); setOutput(item.output||"");
    if (item.length) setLength(item.length);
    setVersionStack([]); setActiveVersion(null);
    setLoadedHistId(item.id);
    // Keep sidebar open, just scroll main content
    setTimeout(() => outRef.current?.scrollIntoView({behavior:"smooth"}), 150);
  }

  function toggleSide(id) {
    setSidePanel(prev => prev === id ? null : id);
  }

  // Sidebar: narrow icon-only rail always, panel slides out beside it
  const [sidebarW, setSidebarW] = useState(380);
  const SIDEBAR_W = sidebarW;
  const [railHovered, setRailHovered] = useState(false);
  const RAIL_W = railHovered ? 180 : 56;
  const dragRef = useRef(null);

  function startDrag(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarW;
    function onMove(ev) {
      const delta = ev.clientX - startX;
      const next = Math.min(600, Math.max(240, startW + delta));
      setSidebarW(next);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const css = useMemo(() => `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&display=swap');
    *{box-sizing:border-box;}
    html,body,#root{height:100%;margin:0;font-family:'Inter',system-ui,sans-serif;}
    .tf{font-family:Inter,sans-serif;}  /* display/hero only */
    .bf{font-family:'Inter',system-ui,sans-serif;} /* all UI text */
    .flame{display:inline-block;animation:flicker 1.8s ease-in-out infinite alternate;}
    @keyframes flicker{0%{transform:scaleY(1) rotate(-1deg);opacity:1;}100%{transform:scaleY(1.06) rotate(1deg);opacity:0.85;}}
    .mbtn{padding:12px 14px;border:1.5px solid transparent;border-radius:8px;cursor:pointer;font-family:Inter,sans-serif;font-weight:600;font-size:13px;transition:all 0.18s;display:flex;align-items:center;justify-content:center;gap:7px;}
    .mbtn.on{background:${t.btnActiveBg};color:#fff;box-shadow:0 4px 18px rgba(0,0,0,0.3);}
    .mbtn.off{background:${t.btnInactiveBg};border-color:${t.btnInactiveBorder};color:${t.btnInactiveText};}
    .mbtn.off:hover{border-color:${t.accent};color:${t.accent};}
    .lbtn{padding:10px 12px;border:1.5px solid ${t.surfaceBorder};border-radius:8px;cursor:pointer;font-family:Inter,sans-serif;font-size:12px;font-weight:600;transition:all 0.18s;background:${t.surface};color:${t.textMuted};text-align:center;}
    .lbtn.on{border-color:${t.accent};color:${t.accent};}
    .lbtn:hover:not(.on){border-color:${t.accentHover};color:${t.accentHover};}
    .gbtn{width:100%;padding:18px;background:${t.accentGrad};border:none;border-radius:8px;color:white;font-family:Inter,sans-serif;font-size:20px;font-weight:700;cursor:pointer;transition:all 0.18s;}
    .gbtn:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 8px 30px rgba(0,0,0,0.3);}
    .gbtn:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
    .app-ta{width:100%;background:${t.inputBg};border:1.5px solid ${t.inputBorder};border-radius:8px;color:${t.inputText};font-family:Inter,sans-serif;font-size:15px;line-height:1.75;padding:20px;resize:vertical;outline:none;transition:border-color 0.18s;}
    .app-ta:focus{border-color:${t.accent};}
    .app-ta::placeholder{color:${t.inputPlaceholder};}
    .divider{height:1px;background:${t.divider};margin:40px 0;}
    .ld span{display:inline-block;animation:bounce 1.2s infinite;}
    .ld span:nth-child(2){animation-delay:0.2s;}.ld span:nth-child(3){animation-delay:0.4s;}
    @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:0.3;}40%{transform:translateY(-5px);opacity:1;}}
    @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
    .badge{display:inline-block;background:${t.badge};border:1px solid ${t.badgeBorder};border-radius:20px;padding:4px 16px;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${t.badgeText};font-family:Inter,sans-serif;font-weight:600;}
    .mgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .lgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
    [contenteditable]:focus{outline:none;}
    /* sidebar rail uses inline styles */
    /* Themed scrollbars */
    ::-webkit-scrollbar{width:5px;height:5px;}
    ::-webkit-scrollbar-track{background:${t.panelBg};}
    ::-webkit-scrollbar-thumb{background:${t.accent}55;border-radius:10px;}
    ::-webkit-scrollbar-thumb:hover{background:${t.accent}aa;}
    /* CSS var override for inline-ref'd scrollbars */
    [style*="--sb-thumb"]::-webkit-scrollbar-thumb{background:var(--sb-thumb,${t.accent})55;}
    [style*="--sb-thumb"]::-webkit-scrollbar-thumb:hover{background:var(--sb-thumb,${t.accent})aa;}
    [style*="--sb-track"]::-webkit-scrollbar-track{background:var(--sb-track,${t.panelBg});}
    /* Sidebar panel */
    .side-panel{width:${SIDEBAR_W}px;min-width:0;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid ${t.panelBorder};background:${t.panelBg};transition:width 0.22s cubic-bezier(0.4,0,0.2,1);position:relative;}
    .side-panel.collapsed{width:0;border-right:none;}
    .side-panel.dragging{transition:none;}
    .drag-handle{position:absolute;top:0;right:0;width:5px;height:100%;cursor:ew-resize;z-index:30;background:transparent;}
    .drag-handle:hover{background:${t.accent}40;}
    @keyframes shimmer{0%{background-position:-600px 0;}100%{background-position:600px 0;}}
    .shimmer-line{height:14px;border-radius:7px;background:linear-gradient(90deg,${t.surface} 25%,${t.surfaceBorder} 50%,${t.surface} 75%);background-size:1200px 100%;animation:shimmer 1.6s infinite linear;}

    /* ── Page / drawer transitions ───────────────────────────────────────── */
    @keyframes fadeSlideIn{from{opacity:0;transform:translateX(14px);}to{opacity:1;transform:translateX(0);}}
    @keyframes fadeSlideOut{from{opacity:1;transform:translateX(0);}to{opacity:0;transform:translateX(-14px);}}
    @keyframes fadeSlideUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    @keyframes pulse{0%,100%{opacity:0.4;}50%{opacity:0.8;}}
    @keyframes scaleIn{from{opacity:0;transform:scale(0.97);}to{opacity:1;transform:scale(1);}}

    .drawer-enter{animation:fadeSlideIn 0.22s cubic-bezier(0.25,0.46,0.45,0.94) both;}
    .drawer-back{animation:fadeSlideOut 0.18s cubic-bezier(0.25,0.46,0.45,0.94) both;}
    .fade-up{animation:fadeSlideUp 0.2s cubic-bezier(0.25,0.46,0.45,0.94) both;}
    .fade-in{animation:fadeIn 0.18s ease both;}
    .scale-in{animation:scaleIn 0.2s cubic-bezier(0.34,1.2,0.64,1) both;}

    /* ── UI polish ───────────────────────────────────────────────────────── */
    button{font-family:'Inter',system-ui,sans-serif;}
    input,textarea,select{font-family:'Inter',system-ui,sans-serif;}
    .gbtn{font-family:'Inter',system-ui,sans-serif;font-size:15px;font-weight:600;letter-spacing:0.01em;}
    .app-ta{font-family:'Inter',system-ui,sans-serif;font-size:15px;line-height:1.7;}
    .panel-heading{font-family:'Inter',system-ui,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;}
    .ui-label{font-family:'Inter',system-ui,sans-serif;font-size:11px;font-weight:500;letter-spacing:0.03em;}
    .ui-body{font-family:'Inter',system-ui,sans-serif;font-size:13px;font-weight:400;line-height:1.6;}
    .ui-mono{font-family:'SF Mono','Fira Code',monospace;font-size:12px;}
    @media(max-width:768px){
      .desktop-rail{display:none!important;}
      .mobile-bar{display:flex!important;}
      .side-panel:not(.collapsed){position:fixed!important;left:0!important;top:48px!important;width:100%!important;height:calc(100% - 48px)!important;z-index:999!important;border-right:none!important;}
      .side-panel.collapsed{width:0!important;overflow:hidden!important;}
      .main-pad{padding:16px 12px 60px!important;padding-top:64px!important;}
      .mode-pill-wrap{padding:4px!important;gap:3px!important;border-radius:14px!important;overflow-x:auto!important;flex-wrap:nowrap!important;}
      .mode-pill-btn{flex-direction:column!important;gap:2px!important;padding:7px 6px!important;border-radius:10px!important;font-size:10px!important;letter-spacing:0!important;white-space:nowrap!important;}
      .mode-pill-btn .mode-icon svg{width:16px!important;height:16px!important;}
      .app-ta{font-size:16px!important;padding:14px!important;}
      .gbtn{font-size:16px!important;padding:14px!important;}
      .divider{margin:16px 0!important;}
      .coach-wrap{flex-direction:column!important;margin-top:48px!important;}
      .coach-left{border-right:none!important;min-height:40vh!important;}
      .coach-right{width:100%!important;min-width:0!important;max-height:50vh!important;border-top:1px solid rgba(255,255,255,0.1)!important;}
      .coach-tab-bar{display:flex!important;}
    }
    @media(min-width:769px){
      .mobile-bar{display:none!important;}
      .coach-tab-bar{display:none!important;}
    }
  `, [themeKey, sidebarW]);

  // Inline styles for the sidebar content panel header
  const panelTitleStyle = useMemo(() => ({ fontFamily:"Inter,sans-serif", color:t.text, fontSize:16, fontWeight:700, margin:0 }), [t.text]);
  const panelHeaderStyle = useMemo(() => ({ padding:"16px 18px 12px", borderBottom:`1px solid ${t.panelBorder}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }), [t.panelBorder]);
  const closeBtn = useMemo(() => ({ background:"transparent", border:"none", color:t.textMuted, cursor:"pointer", fontSize:18, lineHeight:1, padding:"2px 4px" }), [t.textMuted]);

  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />;

  return (
    <div style={{display:"flex", height:"100vh", overflow:"hidden", background:t.bg, color:t.text}}>
      <style>{css}</style>
      {deliverMode && output && <DeliverMode text={output} title={mode.outputTitle} onClose={()=>setDeliverMode(false)} t={t}/>}

      {/* ── MOBILE: top bar ── */}
      <div className="mobile-bar" style={{
        position:"fixed", top:0, left:0, right:0, height:48, zIndex:1000,
        display:"none", alignItems:"center", justifyContent:"space-between",
        padding:"0 14px", background:t.panelBg, borderBottom:`1px solid ${t.panelBorder}`,
      }}>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={t.accent}>
            <path d="M12 2C9 6 7 9 7 13a5 5 0 0 0 10 0c0-4-2-7-5-11zm0 15a3 3 0 0 1-3-3c0-2.5 1.2-4.8 3-7.5 1.8 2.7 3 5 3 7.5a3 3 0 0 1-3 3z"/>
          </svg>
          <span style={{fontFamily:"Inter,sans-serif", fontSize:14, fontWeight:800, color:t.titleColor, letterSpacing:"-0.3px"}}>Sermon Studio</span>
        </div>
        <button
          onClick={() => setMobileMenu(prev => !prev)}
          style={{background:"transparent", border:"none", color:t.textMuted, cursor:"pointer", padding:6}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── MOBILE: menu overlay ── */}
      {mobileMenu && (
        <div style={{position:"fixed", top:48, left:0, right:0, bottom:0, zIndex:1001, background:t.panelBg, overflowY:"auto", padding:"16px"}}>
          <div style={{display:"flex", flexDirection:"column", gap:4}}>
            {SIDEBAR_ITEMS.map(item => (
              <button key={item.id}
                onClick={() => { setMobileMenu(false); setSidePanel(item.id); }}
                style={{display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10, border:"none", background:t.surface, color:t.text, fontFamily:"Inter,sans-serif", fontSize:14, fontWeight:600, cursor:"pointer", textAlign:"left"}}>
                <span style={{color:t.accent}}><item.Icon/></span>
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { setMobileMenu(false); launchWorkshop(); }}
              style={{display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10, border:"none", background:t.surface, color:t.text, fontFamily:"Inter,sans-serif", fontSize:14, fontWeight:600, cursor:"pointer", textAlign:"left"}}>
              <span style={{color:t.accent}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </span>
              Sermon Workshop
            </button>
          </div>
        </div>
      )}

      {/* ── LEFT: icon rail (expands on hover) ── */}
      <div className="desktop-rail" style={{
        width:RAIL_W, flexShrink:0, display:"flex", flexDirection:"column",
        alignItems:"flex-start", paddingTop:14, paddingBottom:14, gap:4,
        borderRight:`1px solid ${t.panelBorder}`, background:t.panelBg, zIndex:20,
        transition:"width 0.2s cubic-bezier(0.4,0,0.2,1)",
        overflow:"hidden",
      }}
        onMouseEnter={()=>setRailHovered(true)}
        onMouseLeave={()=>setRailHovered(false)}
      >
        {/* Logo mark — home button */}
        <div title="Home" onClick={()=>{ setOutput(""); setInput(""); setVersionStack([]); setActiveVersion(null); setSidePanel(null); }}
          style={{
            marginBottom:8, userSelect:"none", cursor:"pointer", padding:4, borderRadius:8,
            transition:"opacity 0.15s", display:"flex", alignItems:"center", gap:10,
            paddingLeft:17, width:"100%",
          }}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.65"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={t.accent} style={{flexShrink:0}}>
            <path d="M12 2C9 6 7 9 7 13a5 5 0 0 0 10 0c0-4-2-7-5-11zm0 15a3 3 0 0 1-3-3c0-2.5 1.2-4.8 3-7.5 1.8 2.7 3 5 3 7.5a3 3 0 0 1-3 3z"/>
          </svg>
          <span style={{
            fontSize:13, fontWeight:600, color:t.accent, whiteSpace:"nowrap",
            opacity: railHovered ? 1 : 0, transition:"opacity 0.15s",
          }}>Sermon Studio</span>
        </div>
        <div style={{width: railHovered ? "calc(100% - 16px)" : 32, height:1, background:t.surfaceBorder, marginBottom:4, marginLeft:8, transition:"width 0.2s"}}/>

        {SIDEBAR_ITEMS.map(item => {
          const isActive = sidePanel === item.id;
          return (
            <button key={item.id}
              onClick={() => toggleSide(item.id)}
              title={railHovered ? undefined : item.label}
              style={{
                position:"relative",
                width: railHovered ? "calc(100% - 16px)" : 40,
                marginLeft: railHovered ? 8 : 8,
                height:40, display:"flex", alignItems:"center",
                justifyContent:"flex-start", gap:10,
                paddingLeft: railHovered ? 9 : 11,
                border:"none", borderRadius:9, cursor:"pointer",
                background: isActive ? t.btnActiveBg : "transparent",
                color: isActive ? "#fff" : t.textMuted,
                transition:"all 0.15s",
              }}
              onMouseEnter={e=>{ if(!isActive){e.currentTarget.style.background=t.surface;e.currentTarget.style.color=t.accent;} }}
              onMouseLeave={e=>{ if(!isActive){e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.textMuted;} }}>
              {/* VS Code-style active edge bar */}
              {isActive && <span style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:3,height:26,background:t.accent,borderRadius:"0 3px 3px 0",pointerEvents:"none"}}/>}
              <span style={{flexShrink:0, display:"flex"}}><item.Icon/></span>
              <span style={{
                fontSize:13, fontWeight:500, whiteSpace:"nowrap",
                opacity: railHovered ? 1 : 0, transition:"opacity 0.12s",
              }}>{item.label}</span>
            </button>
          );
        })}

        {/* Workshop launch button */}
        <div style={{width: railHovered ? "calc(100% - 16px)" : 32, height:1, background:t.surfaceBorder, margin:"4px 0 4px 8px", transition:"width 0.2s"}}/>
        <button
          onClick={launchWorkshop}
          title={railHovered ? undefined : "Sermon Workshop"}
          style={{
            position:"relative",
            width: railHovered ? "calc(100% - 16px)" : 40,
            marginLeft:8,
            height:40, display:"flex", alignItems:"center",
            justifyContent:"flex-start", gap:10,
            paddingLeft: railHovered ? 9 : 11,
            border:"none", borderRadius:9, cursor:"pointer",
            background: workshopMode ? t.btnActiveBg : "transparent",
            color: workshopMode ? "#fff" : t.textMuted,
            transition:"all 0.15s",
          }}
          onMouseEnter={e=>{ if(!workshopMode){e.currentTarget.style.background=t.surface;e.currentTarget.style.color=t.accent;} }}
          onMouseLeave={e=>{ if(!workshopMode){e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.textMuted;} }}>
          {workshopMode && <span style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:3,height:26,background:t.accent,borderRadius:"0 3px 3px 0",pointerEvents:"none"}}/>}
          <span style={{flexShrink:0, display:"flex"}}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </span>
          <span style={{
            fontSize:13, fontWeight:500, whiteSpace:"nowrap",
            opacity: railHovered ? 1 : 0, transition:"opacity 0.12s",
          }}>Workshop</span>
        </button>
      </div>

      {/* ── LEFT: expanded side panel ── */}
      <div className={`side-panel ${sidePanel ? "" : "collapsed"}`} style={{width: sidePanel ? SIDEBAR_W : 0, minWidth:0}}>
        {sidePanel && <div className="drag-handle" onMouseDown={startDrag}/>}
        {sidePanel === "idea" && (
          <>
            <div style={panelHeaderStyle}>
              <h2 style={{...panelTitleStyle, display:"flex", alignItems:"center", gap:8}}><IconIdea/> Sermon Ideas</h2>
              <button style={closeBtn} onClick={()=>setSidePanel(null)}>✕</button>
            </div>
            <div style={{flex:1, overflow:"auto"}}>
              <IdeaGen/>
            </div>
          </>
        )}

        {sidePanel === "history" && (
          <HistPanel history={history} onLoad={loadHist} onDelete={delHist} onClose={()=>setSidePanel(null)} t={t} inline={true} loadedId={loadedHistId}/>
        )}

        {sidePanel === "settings" && (
          <SettingsPanel
            currentTheme={themeKey} onTheme={applyTheme} onClose={()=>setSidePanel(null)} t={t} inline={true}
            preacherName={preacherName} onPreacherName={setPreacherName}
            defaultTrans={defaultTrans} onDefaultTrans={setDefaultTrans}
            fontSize={editorFontSize} onFontSize={setEditorFontSize}
            voiceProfile={voiceProfile}
          />
        )}

        {sidePanel === "stories" && (
          <StoriesPanel stories={stories} onClose={()=>setSidePanel(null)} onAdd={addStory} onDelete={deleteStory} t={t}/>
        )}

        {sidePanel === "upload" && (
          <UploadPanel
            onClose={()=>setSidePanel(null)} t={t}
            onVoiceUpdated={profile=>setVoiceProfile(profile)}
            onStoriesFound={newStories=>addStoriesBatch(newStories)}
            onHistoryAdd={item => setHistory(prev => [item, ...prev].slice(0, 200))}
          />
        )}

        {sidePanel === "tune" && (
          <TunePanel tuneSettings={tuneSettings} onTune={applyTune} onClose={()=>setSidePanel(null)} t={t}/>
        )}

        {sidePanel === "soap" && (
          <SoapPanel onClose={()=>setSidePanel(null)} t={t}/>
        )}
        {sidePanel === "makemine" && (
          <MakeMinePanel onClose={()=>setSidePanel(null)} t={t} onLaunchCoach={launchCoach} onPdfDone={handlePdfDone}/>
        )}
      </div>

      {/* ── RIGHT: main content area (or Coach View or Workshop) ── */}
      {coachMode && coachProject ? (
        <CoachView project={coachProject} onExit={exitCoach} t={t}/>
      ) : workshopMode ? (
        <WorkshopView
          onExit={exitWorkshop}
          onGenerate={handleWorkshopExport}
          voiceProfile={voiceProfile}
          t={t}
        />
      ) : (
      <div style={{flex:1, overflowY:"auto", display:"flex", flexDirection:"column"}}>
        <div className="main-pad" style={{maxWidth:900, margin:"0 auto", padding:"52px 32px 80px", width:"100%"}}>

          {/* Header — hero on first visit, slim bar once you have output */}
          {!output && !pdfResult ? (
            <div style={{textAlign:"center", marginBottom:48}}>
              <div style={{marginBottom:14}}><span className="badge">Sermon Studio</span></div>
              <h1 className="tf" style={{fontSize:"clamp(36px,5vw,60px)", fontWeight:900, lineHeight:1.05, margin:"0 0 14px", color:t.titleColor, letterSpacing:"-1px"}}>
                <span className="flame">🔥</span> The Word, <span style={{color:t.titleAccent}}>Built.</span>
              </h1>
              <p className="bf" style={{fontSize:16, color:t.textMuted, maxWidth:460, margin:"0 auto", lineHeight:1.6}}>
                Drop a scripture or theme. Walk away with a sermon ready to preach.
              </p>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28,paddingBottom:16,borderBottom:`1px solid ${t.surfaceBorder}`}}>
              <span style={{fontSize:18}}>🔥</span>
              <span className="tf" style={{fontSize:15,fontWeight:900,color:t.titleColor,letterSpacing:"-0.3px"}}>Sermon Studio</span>
              
            </div>
          )}

          <div className="divider"/>

          {/* ── PDF RESULT VIEW ── */}
          {pdfResult && (
            <div style={{marginBottom:32}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                <span style={{fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:700,color:t.text,flex:1}}>
                  📄 {pdfResult.fileName}
                </span>
                <button
                  onClick={async ()=>{
                    try {
                      await navigator.clipboard.write([new ClipboardItem({"text/html":new Blob([pdfResult.html],{type:"text/html"})})]);
                    } catch { const tmp=document.createElement("div");tmp.innerHTML=pdfResult.html;await navigator.clipboard.writeText(tmp.innerText); }
                  }}
                  style={{padding:"7px 16px",borderRadius:20,border:`1px solid ${t.accent}`,background:t.accentGrad,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  Copy Formatted
                </button>
                <button
                  onClick={()=>{
                    const tmp=document.createElement("div"); tmp.innerHTML=pdfResult.html;
                    launchCoach({ id:"proj-"+Date.now(), title:pdfResult.fileName.replace(/\.pdf$/i,""), content:pdfResult.html, sourceType:"pdf", sourceFile:pdfResult.fileName, coachMessages:[], createdAt:new Date().toISOString(), isHtml:true });
                  }}
                  style={{padding:"7px 16px",borderRadius:20,border:`1px solid ${t.accent}`,background:t.accentGrad,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  🧠 Send to Coach
                </button>
                <button onClick={clearPdfResult}
                  style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${t.surfaceBorder}`,background:"transparent",color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:11,cursor:"pointer"}}>
                  Close
                </button>
              </div>
              <div style={{display:"flex", flexWrap:"wrap", gap:10, marginBottom:12, padding:"10px 14px", background:t.surface, border:`1px solid ${t.surfaceBorder}`, borderRadius:8}}>
                {[["Green → slide point","#4caf50"],["Red → scripture","#cc0000"],["Blue → story","#00b4d8"],["Normal text","#888"]].map(([l,c])=>(
                  <span key={l} style={{display:"flex", alignItems:"center", gap:5, fontFamily:"Inter,sans-serif", fontSize:11, color:t.textMuted}}>
                    <span style={{width:9, height:9, borderRadius:"50%", background:c, display:"inline-block"}}/>{l}
                  </span>
                ))}
              </div>
              <div style={{marginBottom:12}}>
                <QuickFormatBar editorRef={pdfEditorRef} t={t}/>
              </div>
              <div
                ref={pdfEditorRef}
                contentEditable suppressContentEditableWarning
                dangerouslySetInnerHTML={{__html: pdfResult.html}}
                style={{background:"#fff",borderRadius:8,padding:"32px 40px",border:"1px solid #e0e0e0",minHeight:400,fontFamily:"Arial,sans-serif",fontSize:"12pt",color:"#111",lineHeight:1.7,outline:"none",cursor:"text"}}
              />
            </div>
          )}

          {/* ── Primary mode nav — Apple-style segmented pill ── */}
          {(() => {
            const ModeIcons = {
              outline: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              ),
              manuscript: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              ),
              illustration: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4"/><path d="M12 16h.01"/>
                </svg>
              ),
              theology: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              ),
            };
            const SUB = {
              outline:"Skeleton + 5 titles",
              manuscript:"Every word, ready to preach",
              illustration:"Stories + follow-up chat",
              theology:"Seminary-level study",
            };
            return (
              <div className="mode-pill-wrap" style={{
                display:"flex", gap:6, padding:6,
                background:t.panelBg,
                border:`1.5px solid ${t.surfaceBorder}`,
                borderRadius:18,
                marginBottom:24,
                boxShadow:"inset 0 1px 3px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.04)",
              }}>
                {MAIN_MODES.map(m => {
                  const isOn = modeId === m.id;
                  return (
                    <button key={m.id}
                      className="mode-pill-btn"
                      onClick={()=>switchMode(m.id)}
                      title={SUB[m.id]}
                      style={{
                        flex:1, display:"flex", flexDirection:"row",
                        alignItems:"center", justifyContent:"center",
                        gap:7, padding:"9px 10px",
                        background: isOn ? t.accentGrad : "transparent",
                        border:"none", borderRadius:13,
                        cursor:"pointer",
                        color: isOn ? "#fff" : t.textMuted,
                        fontFamily:"Inter,sans-serif",
                        fontSize:13, fontWeight: isOn ? 700 : 500,
                        letterSpacing:"0.01em",
                        transition:"all 0.2s cubic-bezier(0.34,1.3,0.64,1)",
                        boxShadow: isOn
                          ? "0 2px 10px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.12) inset"
                          : "none",
                        transform: isOn ? "scale(1.01)" : "scale(1)",
                        whiteSpace:"nowrap",
                        minWidth:0,
                        overflow:"hidden",
                      }}
                      onMouseEnter={e=>{ if(!isOn){e.currentTarget.style.background=t.surface;e.currentTarget.style.color=t.text;} }}
                      onMouseLeave={e=>{ if(!isOn){e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.textMuted;} }}>
                      <span className="mode-icon" style={{opacity: isOn ? 1 : 0.7, display:"flex", alignItems:"center", flexShrink:0}}>
                        {ModeIcons[m.id]}
                      </span>
                      <span style={{overflow:"hidden",textOverflow:"ellipsis",minWidth:0}}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Tune config card */}
          {mode.isEditor && (
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:18, padding:"10px 14px", background:t.surface, border:`1.5px solid ${t.surfaceBorder}`, borderRadius:10, cursor:"pointer"}}
              onClick={()=>setSidePanel(prev=>prev==="tune"?null:"tune")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
              <span style={{fontFamily:"Inter,sans-serif", fontSize:12, fontWeight:700, color:t.accent}}>
                {LENGTHS[length]?.label}
              </span>
              <span style={{fontFamily:"Inter,sans-serif", fontSize:12, color:t.textMuted}}>·</span>
              <span style={{fontFamily:"Inter,sans-serif", fontSize:12, color:t.textMuted}}>
                {(VENUE_TYPES.find(v=>v.id===tuneSettings.venue)||VENUE_TYPES[0]).label}
              </span>
              <span style={{fontFamily:"Inter,sans-serif", fontSize:12, color:t.textMuted}}>·</span>
              <span style={{fontFamily:"Inter,sans-serif", fontSize:12, color:t.textMuted}}>
                {(AUDIENCE_TYPES.find(a=>a.id===tuneSettings.audience)||AUDIENCE_TYPES[4]).label}
              </span>
              <span style={{marginLeft:"auto", fontFamily:"Inter,sans-serif", fontSize:11, color:t.textFaint}}>Click to tune →</span>
            </div>
          )}

          {/* Input + generate */}
          <div style={{marginBottom:10}}>
            <textarea className="app-ta" rows={modeId==="manuscript"?14:7} value={input} onChange={e=>setInput(e.target.value)} placeholder={mode.placeholder}
              onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)generate();}}/>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:5}}>
              {input.trim() && <span className="bf" style={{fontSize:11, color:t.textFaint}}>{countWords(input).toLocaleString()} words in prompt</span>}
              <span className="bf" style={{fontSize:11, color:t.textFaint, marginLeft:"auto"}}>CMD + Enter to generate</span>
            </div>
          </div>
          {showRegenConfirm && (
            <div style={{marginBottom:10,padding:"12px 16px",background:`${t.accent}12`,border:`1.5px solid ${t.accent}`,borderRadius:8,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span style={{fontFamily:"Inter,sans-serif",fontSize:12,color:t.text,flex:1,fontWeight:600}}>You already have a sermon. Replace it?</span>
              <button onClick={()=>generate(true)} style={{padding:"5px 14px",background:t.accentGrad,border:"none",borderRadius:6,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>Yes, Regenerate</button>
              <button onClick={()=>setShowRegenConfirm(false)} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${t.surfaceBorder}`,borderRadius:6,color:t.textMuted,fontFamily:"Inter,sans-serif",fontSize:12,cursor:"pointer"}}>Cancel</button>
            </div>
          )}
          <div style={{display:"flex", gap:8}}>
            <button className="gbtn" onClick={loading ? stopGeneration : generate} disabled={!loading && !input.trim()} style={{position:"relative",overflow:"hidden", flex:1}}>
              {loading ? (
                <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={SS.spin}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  <span>{modeId==="theology" ? "Researching the Word..." : modeId==="illustration" ? "Finding your stories..." : "Writing your sermon..."}</span>
                </span>
              ) : (
                <>{mode.btnLabel}{mode.isEditor && <span style={{opacity:0.65, fontStyle:"italic", fontSize:15}}> — {LENGTHS[length].label}</span>}</>
              )}
            </button>
            {loading && (
              <button className="gbtn" onClick={stopGeneration}
                style={{width:60, background:"#e74c3c", flexShrink:0}}>
                Stop
              </button>
            )}
          </div>
          <LoadingBar active={loading} modeId={modeId} length={length} t={t}/>
          {/* Shimmer skeleton while loading */}
          {loading && (
            <div className="scale-in" style={{marginTop:36,padding:"28px 32px",background:t.surface,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:10}}>
              <div style={{marginBottom:20,display:"flex",gap:10,alignItems:"center"}}>
                <div className="shimmer-line" style={{width:"45%"}}/>
                <div className="shimmer-line" style={{width:"20%",opacity:0.5}}/>
              </div>
              {[1,0.9,0.7,1,0.6,0.85,1,0.75,0.9,0.5].map((w,i)=>(
                <div key={i} className="shimmer-line" style={{width:`${w*100}%`,marginBottom:10,height:i%4===3?20:13,opacity:i%4===3?0.7:0.5}}/>
              ))}
              <div style={{marginTop:24,display:"flex",gap:8}}>
                <div className="shimmer-line" style={{width:"30%",height:18,opacity:0.4}}/>
                <div className="shimmer-line" style={{width:"22%",height:18,opacity:0.3}}/>
              </div>
            </div>
          )}

          {error && <p className="bf" style={{color:"#e06050", marginTop:14, fontSize:13}}>{error}</p>}

          {/* Output */}
          {output && (
            <div className="fade-up" style={{marginTop:52}} ref={outRef}>
              <div className="divider"/>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <h2 className="tf" style={{color:t.titleAccent, fontSize:22, fontWeight:700, margin:0}}>{mode.outputTitle}</h2>
                  {modeId==="outline" && output && (
                    <button onClick={expandToManuscript}
                      style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",background:t.accentGrad,border:"none",borderRadius:7,color:"#fff",fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      Expand to Manuscript
                    </button>
                  )}
                  {/* Version switcher — only shows when there are multiple versions */}
                  {versionStack.length > 1 && (
                    <div style={{display:"flex",gap:4,alignItems:"center",background:t.surface,border:`1px solid ${t.surfaceBorder}`,borderRadius:20,padding:"3px 6px"}}>
                      <button
                        onClick={()=>{ setOutput(versionStack[versionStack.length-1>0?versionStack.length-1:0].output); setActiveVersion("latest"); }}
                        title="Latest version"
                        style={{padding:"3px 10px",border:"none",borderRadius:14,background:activeVersion===null?"transparent":"transparent",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:activeVersion===null?700:400,color:activeVersion===null?t.accent:t.textMuted,transition:"all 0.15s"}}>
                        Latest
                      </button>
                      {[...versionStack].reverse().map((v,i)=>(
                        <button key={v.ts} onClick={()=>{ setOutput(v.output); setInput(v.input); setActiveVersion(v.ts); }}
                          title={`${v.label} — ${new Date(v.ts).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}`}
                          style={{padding:"3px 9px",border:"none",borderRadius:14,background:activeVersion===v.ts?t.accentGrad:"transparent",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:activeVersion===v.ts?700:400,color:activeVersion===v.ts?"#fff":t.textMuted,transition:"all 0.15s"}}>
                          {v.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {mode.isEditor && <span className="bf" style={{color:t.textMuted, fontSize:11}}>Highlight text to AI edit it</span>}
                {mode.isChat && <span className="bf" style={{color:t.textMuted, fontSize:11}}>Continue the conversation below</span>}
              </div>

              {mode.isEditor && (
                <div style={{display:"flex", flexWrap:"wrap", gap:10, marginBottom:12, padding:"10px 14px", background:t.surface, border:`1px solid ${t.surfaceBorder}`, borderRadius:8}}>
                  {[["Scripture","#cc0000"],["Story","#00b4d8"],["Summary","#2d9b2d"],["Example","#7b2fbe"],["Closing","#e67e00"],["One-liner","#8b4000"]].map(([l,c])=>(
                    <span key={l} style={{display:"flex", alignItems:"center", gap:5, fontFamily:"Inter,sans-serif", fontSize:11, color:t.textMuted}}>
                      <span style={{width:9, height:9, borderRadius:"50%", background:c, display:"inline-block"}}/>{l}
                    </span>
                  ))}
                </div>
              )}

              {(modeId==="outline"||modeId==="manuscript") && output && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:4}}>
                  <CritiquePanel output={output} t={t}/>
                  <SmallGroupPanel output={output} audience={tuneSettings?.audience||"mixed"} t={t}/>
                  <StoryMatchPanel output={output} stories={stories} t={t}/>
                  <IllustrationSearchPanel output={output} t={t}/>
                  <ScriptureCrossRefPanel output={output} t={t}/>
                  <OriginalityCheckPanel output={output} t={t}/>
                </div>
              )}
              {mode.isEditor && <RichEditor rawText={output} length={length} t={t}/>}
              {mode.isEditor && output && (
                <button
                  onClick={() => {
                    const plainText = stripTags(output);
                    const title = extractTitle(input, modeId);
                    launchCoach({
                      id: "proj-" + Date.now(),
                      title,
                      content: plainText,
                      sourceType: "generated",
                      sourceFile: null,
                      coachMessages: [],
                      createdAt: new Date().toISOString(),
                    });
                  }}
                  style={{width:"100%", marginBottom:12, padding:"12px", background:t.accentGrad, border:"none", borderRadius:8, fontFamily:"Inter,sans-serif", fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
                  🧠 Send to Coach
                </button>
              )}
              {mode.isEditor && output && <TakeawayPanel output={output} t={t}/>}
              {mode.isChat && modeId==="theology" && (
                <TheoTabbed text={output}/>
              )}
              {mode.isChat && modeId==="illustration" && <ChatPanel systemPrompt={mode.system} initialOutput={output} initialInput={lastInput}/>}
            </div>
          )}

          <div style={{marginTop:60, paddingTop:24, borderTop:`1px solid ${t.surfaceBorder}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8}}>
            <p className="bf" style={{color:t.textFaint, fontSize:10, letterSpacing:2, margin:0}}>SERMON STUDIO — BUILT FOR THE PREACHER WHO MEANS BUSINESS</p>

          </div>
        </div>
      </div>
      )}

      {/* Undo toast */}
      <UndoToast
        items={undoItems}
        onUndo={(undoItem) => {
          // Cancel the pending cloud delete
          const timer = undoTimersRef.current.get(undoItem.key);
          if (timer) { clearTimeout(timer); undoTimersRef.current.delete(undoItem.key); }
          // Restore item to state
          if (undoItem.type === "history") {
            setHistory(prev => [undoItem.item, ...prev]);
            window.storage.set("sermon-history-v3", JSON.stringify([undoItem.item, ...history])).catch(()=>{});
          } else if (undoItem.type === "story") {
            setStories(prev => [undoItem.item, ...prev]);
            window.storage.set("sermon-stories", JSON.stringify([undoItem.item, ...stories])).catch(()=>{});
          }
          setUndoItems(prev => prev.filter(u => u.key !== undoItem.key));
        }}
        onDismiss={(undoItem) => {
          // Immediately execute the cloud delete
          const timer = undoTimersRef.current.get(undoItem.key);
          if (timer) { clearTimeout(timer); undoTimersRef.current.delete(undoItem.key); }
          if (undoItem.type === "history") window.cloudHistory.delete(undoItem.id).catch(()=>{});
          else if (undoItem.type === "story") window.cloudStories.delete(undoItem.id).catch(()=>{});
          setUndoItems(prev => prev.filter(u => u.key !== undoItem.key));
        }}
      />
    </div>
  );
}


// ── Mount ─────────────────────────────────────────────────────────────────
// In Vite/npm mode, mounting is handled by src/main.jsx.
// In legacy CDN mode (index.html with Babel), this block runs directly.
if (typeof ReactDOM !== 'undefined' && ReactDOM.createRoot) {
  ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
}

export default App;
