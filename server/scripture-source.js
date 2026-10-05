import {getStudyReference} from '../js/deep-study.js';
export const TRANSLATIONS=['NASB','NLT','NIV','ESV'];
function plainText(html){
  return html.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi,'').replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi,'').replace(/<[^>]*>/g,' ').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))).replace(/&(?:nbsp|amp|lt|gt|quot|apos|rsquo|lsquo|rdquo|ldquo|ndash|mdash);/g,entity=>({'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&rsquo;':'’','&lsquo;':'‘','&rdquo;':'”','&ldquo;':'“','&ndash;':'–','&mdash;':'—'}[entity])).replace(/\s+/g,' ').trim();
}
export function extractVerse(html,version){
  const start=html.indexOf(`class="version-${version} `);
  if(start<0)return null;
  const end=html.indexOf('<a class="full-chap-link"',start);
  if(end<0)return null;
  const chunk=html.slice(start,end);
  if(!/class="text [^"]+"/.test(chunk))return null;
  const text=plainText(chunk.slice(chunk.indexOf('>')+1));
  return text && text.length<18000?text:null;
}
export async function lookupScripture(reference,signal){
  const normalized=getStudyReference(reference);
  if(!normalized || normalized!==reference.trim())throw new Error('Use a Bible reference, such as Philippians 2:3, with up to ten verses in one chapter.');
  const translations=await Promise.all(TRANSLATIONS.map(async version=>{
    const url=`https://www.biblegateway.com/passage/?search=${encodeURIComponent(normalized)}&version=${version}`;
    try{
      const response=await fetch(url,{signal:signal || AbortSignal.timeout(12000)});
      if(!response.ok)throw new Error('Source unavailable');
      const text=extractVerse(await response.text(),version);
      if(!text)throw new Error('No verse text');
      return {version,text,url,source:'Bible Gateway'};
    }catch{return {version,text:null,url,source:'Bible Gateway',error:'Verse text could not be retrieved. Open the source to read this translation.'};}
  }));
  return {reference:normalized,translations};
}
