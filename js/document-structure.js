import {BIBLE_BOOKS} from './deep-study.js';
const scripturePattern=new RegExp(`\\b(${BIBLE_BOOKS.slice().sort((a,b)=>b.length-a.length).join('|')})\\s+\\d{1,3}:\\d{1,3}(?:[–-]\\d{1,3})?`,'i');
export const emptyPreparation=()=>({scratchpad:'',comments:[],sections:{},research:[],storyUses:[],audience:'general'});
const blockTags=new Set(['P','DIV','H1','H2','H3','H4','BLOCKQUOTE','UL','OL']);
export function ensureBlocks(root,uuid=()=>crypto.randomUUID()){
  // Group loose inline text without changing its wording or formatting.
  let wrapper=null;
  for(const node of [...root.childNodes]){
    if(node.nodeType===1 && blockTags.has(node.tagName)){wrapper=null;continue;}
    if(node.nodeType===3 && !node.textContent.trim() && !wrapper)continue;
    if(!wrapper){wrapper=root.ownerDocument.createElement('div');root.insertBefore(wrapper,node);}
    wrapper.appendChild(node);
  }
  const seen=new Set();
  for(const element of root.children){
    let id=element.getAttribute('data-ss-block');
    if(!id || seen.has(id)){id=`block-${uuid()}`;element.setAttribute('data-ss-block',id);}
    seen.add(id);
  }
  return [...root.children];
}
export function blockForNode(root,node){
  let element=node?.nodeType===1?node:node?.parentElement;
  while(element && element.parentElement!==root)element=element.parentElement;
  return element?.parentElement===root?element:null;
}
export function describeBlocks(root){
  return [...root.children].map(element=>{
    const text=element.textContent.trim();
    const styled=[element,...element.querySelectorAll('[style]')];
    const highlighted=styled.some(el=>['rgb(255, 224, 102)','#ffe066','yellow','rgb(255, 255, 0)'].includes(el.style.backgroundColor) && el.textContent.trim().length>=text.length*.7);
    const red=styled.some(el=>['rgb(204, 0, 0)','#cc0000','red','rgb(255, 0, 0)'].includes(el.style.color));
    const reference=text.match(scripturePattern);
    return {id:element.getAttribute('data-ss-block'),text,rawText:element.textContent,heading:/^H[1-4]$/.test(element.tagName) || (highlighted && text.length<=180),scripture:reference && (red || text.length<85)?reference[0]:null};
  });
}
export function buildSections(blocks,overrides={}){
  const sections=[];
  blocks.forEach((block,index)=>{
    if(index===0 || (overrides[block.id]?.heading ?? block.heading))sections.push({id:block.id,title:overrides[block.id]?.label || block.text || 'Opening',start:index,blockIds:[],references:[]});
    const section=sections.at(-1);section.blockIds.push(block.id);
    if(block.scripture)section.references.push({id:block.id,label:block.scripture});
  });
  return sections;
}
export function moveSection(root,sections,id,beforeId){
  const section=sections.find(item=>item.id===id),target=sections.find(item=>item.id===beforeId);
  if(!section || id===beforeId || (beforeId && !target))return false;
  const children=[...root.children],byId=new Map(children.map(node=>[node.getAttribute('data-ss-block'),node]));
  const anchor=target?byId.get(target.id):null;
  const nodes=section.blockIds.map(blockId=>byId.get(blockId));
  if(nodes.some(node=>!node) || (target && !anchor))return false;
  for(const node of nodes)root.insertBefore(node,anchor);
  return true;
}
function offsetWithin(element,node,offset){const range=element.ownerDocument.createRange();range.selectNodeContents(element);range.setEnd(node,offset);return range.toString().length;}
export function anchorSelection(root,range){
  if(!range || range.collapsed || !root.contains(range.commonAncestorContainer))return null;
  const start=blockForNode(root,range.startContainer),end=blockForNode(root,range.endContainer);
  if(!start || !end)return null;
  return {start:{blockId:start.getAttribute('data-ss-block'),offset:offsetWithin(start,range.startContainer,range.startOffset)},end:{blockId:end.getAttribute('data-ss-block'),offset:offsetWithin(end,range.endContainer,range.endOffset)},quote:range.toString()};
}
export function mapOffset(before,after,offset,bias='start'){
  let prefix=0;while(prefix<before.length && prefix<after.length && before[prefix]===after[prefix])prefix++;
  let suffix=0;while(suffix<before.length-prefix && suffix<after.length-prefix && before[before.length-1-suffix]===after[after.length-1-suffix])suffix++;
  const oldEnd=before.length-suffix,newEnd=after.length-suffix;
  if(offset<prefix || (offset===prefix && bias==='end'))return offset;
  if(offset>=oldEnd)return Math.max(prefix,offset+after.length-before.length);
  return bias==='start'?prefix:newEnd;
}
export function reconcileComments(comments,before,after){
  const old=new Map(before.map(block=>[block.id,block.rawText ?? block.text])),current=new Map(after.map(block=>[block.id,block.rawText ?? block.text]));
  return comments.map(comment=>{
    const anchor=comment.anchor;if(!anchor)return {...comment,detached:true};
    if(!current.has(anchor.start.blockId) || !current.has(anchor.end.blockId))return {...comment,detached:true};
    const next={...anchor,start:{...anchor.start},end:{...anchor.end}};
    for(const side of ['start','end']){
      const position=next[side],was=old.get(position.blockId),text=current.get(position.blockId);
      if(was!=null && was!==text)position.offset=mapOffset(was,text,position.offset,side);
      position.offset=Math.min(position.offset,text.length);
    }
    const startIndex=after.findIndex(block=>block.id===next.start.blockId),endIndex=after.findIndex(block=>block.id===next.end.blockId);
    const detached=endIndex<startIndex || (startIndex===endIndex && next.end.offset<=next.start.offset);
    return {...comment,anchor:next,detached};
  });
}
function pointAt(element,offset){
  const walker=element.ownerDocument.createTreeWalker(element,4);let node,last;
  while((node=walker.nextNode())){last=node;if(offset<=node.length)return [node,offset];offset-=node.length;}
  return last?[last,last.length]:[element,0];
}
export function rangeFromAnchor(root,anchor){
  if(!anchor)return null;
  const blocks=new Map([...root.children].map(el=>[el.getAttribute('data-ss-block'),el]));
  const start=blocks.get(anchor.start.blockId),end=blocks.get(anchor.end.blockId);if(!start || !end)return null;
  const range=root.ownerDocument.createRange();range.setStart(...pointAt(start,anchor.start.offset));range.setEnd(...pointAt(end,anchor.end.offset));return range.collapsed?null:range;
}
