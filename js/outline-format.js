export const outlineStyles = {
  normal:'', point:'background:#ffe066;color:#000;font-weight:700;text-decoration:underline;',
  scripture:'color:#cc0000;', story:'color:#00b4d8;', example:'color:#7b2fbe;', oneliner:'font-weight:700;text-decoration:underline;',
};
export function outlineLines(text) {
  let blank=true;
  return text.replace(/\r\n?/g,'\n').split('\n').flatMap(line=>{
    if(!line.trim()){blank=true;return [];}
    const item={id:0,text:line.trim().replace(/\s+/g,' '),blankBefore:blank};
    blank=false;return [item];
  }).map((line,id)=>({...line,id}));
}
function baseType(text) {
  if(/^(?:\d+[.)]\s+)?[A-Z][A-Z\s:—–!?',.\d-]{5,}$/.test(text)) return 'point';
  if(/^Homerun:|^Final line:/i.test(text)) return 'oneliner';
  if(/^(?:[1-3]\s+)?[A-Za-z]+\s+\d+:\d+/.test(text)) return 'scripture';
  return 'normal';
}
export function renderOutlineLines(lines, labels=new Map()) {
  const escape=text=>text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  let html='',paragraph='',words=0;
  const flush=()=>{
    if(paragraph) html+=`<p style="margin:0;line-height:1.6;font-family:Arial,sans-serif;font-size:12pt;color:#111;">${paragraph}</p>`;
    paragraph='';words=0;
  };
  for(const line of lines){
    const label=labels.get(line.id);
    const type=label && Object.hasOwn(outlineStyles,label.type)?label.type:baseType(line.text);
    const start=label && typeof label.paragraphStart==='boolean'?label.paragraphStart : line.blankBefore || type==='point' || type==='scripture' || type==='oneliner' || words>90;
    if(start) flush();
    paragraph+=`${paragraph?' ':''}<span style="${outlineStyles[type]}">${escape(line.text)}</span>`;
    words+=line.text.split(/\s+/).length;
  }
  flush();return html;
}
export function readOutlineLabels(raw, source) {
  const parsed=JSON.parse(raw.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));
  if(!Array.isArray(parsed.lines)) throw new Error('Could not read the formatting response. Please try again.');
  const ids=new Set(source.map(line=>line.id));
  const labels=new Map();
  for(const line of parsed.lines){
    if(Number.isInteger(line.id) && ids.has(line.id) && Object.hasOwn(outlineStyles,line.type)) labels.set(line.id,line);
  }
  // Missing or invalid classifications keep the source text with basic formatting.
  return labels;
}

// Compact newline-delimited classifications can be applied before generation ends.
export function readOutlineRow(raw, sourceLength) {
  const compact=raw.trim().match(/^(\d+)([npsteo])([01])$/);
  let row;if(compact)row=[Number(compact[1]),compact[2],Number(compact[3])];
  else try{row=JSON.parse(raw.trim());}catch{return null;}
  const types={n:'normal',p:'point',s:'scripture',t:'story',e:'example',o:'oneliner'};
  if(!Array.isArray(row) || !Number.isInteger(row[0]) || row[0]<0 || row[0]>=sourceLength || !types[row[1]] || ![0,1].includes(row[2]))return null;
  return {id:row[0],type:types[row[1]],paragraphStart:row[2]===1};
}
