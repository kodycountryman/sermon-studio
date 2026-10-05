import {DOCUMENT_ASSISTANT_SYSTEM} from './document-assistant.js';
export const AUDIENCE_NAMES={general:'General',youth:'Youth',adults:'Adults',staff:'Staff teaching',guest:'Guest speaking'};
export const defaultAssistantProfile=()=>({
  theology:DOCUMENT_ASSISTANT_SYSTEM.match(/^THEOLOGY: (.*)$/m)[1],
  voice:DOCUMENT_ASSISTANT_SYSTEM.match(/^VOICE: (.*)$/m)[1],
  rules:DOCUMENT_ASSISTANT_SYSTEM.match(/^RULES: (.*)$/m)[1],
  formatting:'Use readable paragraphs with 0pt before and after. Keep Scripture quotations intact. Match the manuscript color categories using the supported formatting tags.',
  audiences:{general:'Use the current sermon context to understand the audience. Ask if it is unclear.',youth:'Speak clearly to middle and high school students. Use relatable examples without talking down to them.',adults:'Speak to adults with varied life circumstances and biblical knowledge. Offer practical next steps.',staff:'Focus on ministry leadership, healthy teams, discipleship and concrete application.',guest:'Do not assume shared church language, traditions or familiarity with the speaker. Explain unfamiliar terms.'},
});
export function normalizeProfile(value={}){
  const defaults=defaultAssistantProfile();
  return {...defaults,...Object.fromEntries(['theology','voice','rules','formatting'].map(key=>[key,typeof value?.[key]==='string'?value[key]:defaults[key]])),audiences:{...defaults.audiences,...value?.audiences}};
}
export function assistantSystem(base,profile,audience='general'){
  const settings=normalizeProfile(profile);
  const protocol=base.replace(/^(THEOLOGY|VOICE|RULES):.*\n/gm,'').replace(/^The pastor is Evangelical Protestant.*\n/m,'').replace('No Markdown, HTML or dashes in your prose.','No Markdown or HTML in study output.');
  return `${protocol}\nPASTOR SETTINGS:\nTheology: ${settings.theology}\nVoice: ${settings.voice}\nWriting rules: ${settings.rules}\nPresentation preferences: ${settings.formatting}\nAudience: ${AUDIENCE_NAMES[audience] || 'General'}\nAudience guidance: ${settings.audiences[audience] || settings.audiences.general}\nAudience guidance changes presentation, not theology. Keep the response protocol above intact.`;
}
export function normalizeStory(value){
  return {id:value.id,title:value.title || 'Untitled story',text:value.text || value.content || '',themes:Array.isArray(value.themes)?value.themes:Array.isArray(value.tags)?value.tags:(value.tags || '').split(',').map(item=>item.trim()).filter(Boolean),seconds:Number(value.seconds) || 0,privacy:value.privacy || '',anonymized:!!value.anonymized,category:value.category || '',uses:Array.isArray(value.uses)?value.uses:[],archived:!!value.archived};
}
export function storyHtml(text){
  const escape=value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  return text.trim().split(/\n\s*\n/).map(paragraph=>`<p style="margin:0;line-height:1.6;"><span style="color:#00b4d8;">${escape(paragraph).replace(/\n/g,'<br>')}</span></p>`).join('');
}
