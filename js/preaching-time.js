export const defaultTiming=()=>({pace:130,interactionPercent:10,extraSeconds:0});
const bounded=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
export function normalizeTiming(value={}){
  return {pace:bounded(value.pace,60,240,130),interactionPercent:bounded(value.interactionPercent,0,100,10),extraSeconds:bounded(value.extraSeconds,0,3600,0)};
}
export const wordCount=text=>text.trim()?text.trim().split(/\s+/u).length:0;
export function preachingSeconds(words,settings,includeExtra=true){
  if(!words)return 0;
  const timing=normalizeTiming(settings);
  return words/timing.pace*60*(1+timing.interactionPercent/100)+(includeExtra?timing.extraSeconds:0);
}
export function timeLabel(seconds){
  if(!seconds)return '0 min';
  if(seconds<60)return '<1 min';
  return `${Math.round(seconds/60*10)/10} min`;
}
export function timeSections(sections,blocks,settings){
  const counts=new Map(blocks.map(block=>[block.id,wordCount(block.rawText || block.text || '')]));
  return sections.map(section=>({...section,words:section.blockIds.reduce((sum,id)=>sum+(counts.get(id) || 0),0),seconds:preachingSeconds(section.blockIds.reduce((sum,id)=>sum+(counts.get(id) || 0),0),settings,false)}));
}
