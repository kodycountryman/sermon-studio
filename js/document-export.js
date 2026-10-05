import {documentParagraphs} from './sermon-outputs.js';
export function pdfDefinition(source,paragraphs,layout='manuscript'){
  const print=layout==='print';
  return {info:{title:source.title,subject:`Sermon source version ${source.versionId || source.revision}`},pageSize:'LETTER',pageMargins:[42,42,42,42],defaultStyle:{fontSize:Number(source.fontSize)||12,lineHeight:1.6,color:'#111111'},content:paragraphs.map(paragraph=>({text:paragraph.runs.every(run=>!run.text || run.text==='\n')?'\n':[...(paragraph.prefix?[{text:paragraph.prefix}]:[]),...paragraph.runs.map(run=>({text:run.text,fontSize:run.fontSize,bold:!!run.bold,italics:!!run.italics,decoration:run.underline?'underline':undefined,color:print?'#111111':`#${run.color||'111111'}`,background:!print && run.background?`#${run.background}`:undefined}))],margin:[0,0,0,0]}))};
}
export async function wordDocument(source,paragraphs,layout='manuscript'){
  const {Document,Paragraph,TextRun}=await import('docx'),print=layout==='print';
  return new Document({title:source.title,description:`Sermon source version ${source.versionId || source.revision}`,styles:{default:{document:{run:{font:'Arial',size:(Number(source.fontSize)||12)*2},paragraph:{spacing:{before:0,after:0,line:384}}}}},sections:[{properties:{page:{size:{width:12240,height:15840},margin:{top:840,bottom:840,left:840,right:840}}},children:paragraphs.map(paragraph=>new Paragraph({spacing:{before:0,after:0,line:384},children:[...(paragraph.prefix?[new TextRun({text:paragraph.prefix})]:[]),...paragraph.runs.flatMap(run=>run.text.split('\n').map((text,index)=>new TextRun({text,break:index?1:undefined,bold:!!run.bold,italics:!!run.italics,underline:run.underline?{}:undefined,color:print?'111111':run.color||'111111',shading:!print && run.background?{fill:run.background}:undefined,size:(run.fontSize||Number(source.fontSize)||12)*2,font:'Arial'})))]}))}]});
}
export async function exportBlob(source,format,layout='manuscript',doc=document){
  const paragraphs=documentParagraphs(source.content,source.fontSize,doc);
  if(format==='docx'){const [{Packer},word]=await Promise.all([import('docx'),wordDocument(source,paragraphs,layout)]);return Packer.toBlob(word);}
  const [module,fonts]=await Promise.all([import('pdfmake/build/pdfmake.js'),import('pdfmake/build/vfs_fonts.js')]);
  const pdf=module.default || module,vfs=fonts.default || fonts;pdf.addVirtualFileSystem(vfs.pdfMake?.vfs || vfs.vfs || vfs);
  return new Promise((resolve,reject)=>{try{pdf.createPdf(pdfDefinition(source,paragraphs,layout)).getBlob(resolve);}catch(e){reject(e);}});
}
export function downloadBlob(blob,title,extension){
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${title.replace(/[\\/:*?"<>|]/g,' ').slice(0,110)||'Sermon'}.${extension}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
