import {BIBLE_BOOKS} from './deep-study.js';
export const SEARCH_FIELDS={all:'Everything',title:'Title',text:'Manuscript',scripture:'Scripture',themes:'Themes',audience:'Audience',stories:'Linked stories'};
export const themeTags=text=>[...new Set(text.split(',').map(tag=>tag.trim()).filter(Boolean))].slice(0,30);
const normalize=text=>String(text || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[–—]/g,'-').toLowerCase().replace(/\s+/g,' ').trim();
const reference=new RegExp(`\\b(?:${BIBLE_BOOKS.slice().sort((a,b)=>b.length-a.length).join('|')})\\s+\\d{1,3}(?::\\d{1,3}(?:[–-]\\d{1,3})?)?`,'gi');
export function libraryEntry(record,doc=document){
 const root=doc.createElement('div');root.innerHTML=record.content;for(const node of root.querySelectorAll('script,style'))node.remove();
 const text=[...root.childNodes].map(node=>node.textContent).join(' '),prep=record.preparation || {};
 const stories=(prep.storyUses || []).map(use=>`${use.storyTitle || ''} ${(use.blockIds || []).map(id=>[...root.children].find(node=>node.getAttribute('data-ss-block')===id)?.textContent || '').join(' ')}`).join(' ');
 return {record,fields:{title:record.title || '',text,scripture:[...new Set(text.match(reference) || [])].join(' · '),themes:(prep.themes || []).join(', '),audience:prep.audience || 'general',stories}};
}
export function searchLibrary(entries,{query='',field='all',audience='',theme='',sort='recent'}={}){
 const tokens=normalize(query).split(' ').filter(Boolean);
 const matches=entries.flatMap(entry=>{
  if(audience && entry.fields.audience!==audience)return [];
  if(theme && !(entry.record.preparation?.themes || []).some(tag=>normalize(tag)===normalize(theme)))return [];
  const fields=field==='all'?Object.keys(entry.fields):[field];
  if(!tokens.every(token=>fields.some(key=>normalize(entry.fields[key]).includes(token))))return [];
  const hits=tokens.length?fields.filter(key=>tokens.some(token=>normalize(entry.fields[key]).includes(token))):[];
  const score=hits.includes('title')?2:hits.includes('themes')?1:0;
  return [{...entry,hits,score}];
 });
 return matches.sort((a,b)=>sort==='title'?a.fields.title.localeCompare(b.fields.title):sort==='relevance' && b.score!==a.score?b.score-a.score:(b.record.updatedAt || 0)-(a.record.updatedAt || 0));
}
export function reflectionEntry(value,source,now=Date.now(),uuid=()=>crypto.randomUUID()){
 const minutes=Number(value.minutes);
 if(!value.date || !/^\d{4}-\d{2}-\d{2}$/.test(value.date) || !Number.isFinite(Date.parse(value.date)) || new Date(value.date).toISOString().slice(0,10)!==value.date)throw new Error('Choose a delivery date.');
 if(value.minutes!=='' && (!Number.isFinite(minutes) || minutes<=0 || minutes>600))throw new Error('Enter an actual duration between 0 and 600 minutes, or leave it blank.');
 return {id:uuid(),createdAt:now,date:value.date,venue:value.venue.trim(),actualSeconds:value.minutes===''?null:Math.round(minutes*60),worked:value.worked.trim(),changes:value.changes.trim(),followUp:value.followUp.trim(),source};
}
