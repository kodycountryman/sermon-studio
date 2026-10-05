import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {documentParagraphs,highlightedPoints,mergeSlides,slideState,parseMaterials,sourceChanged} from '../js/sermon-outputs.js';
import {pdfDefinition,wordDocument} from '../js/document-export.js';
import {Packer} from 'docx';
const {document}=parseHTML('<html><body></body></html>');
const content='<div data-ss-block="a" style="color:#ff0000"><p><span style="background-color:#ffe066;font-size:18pt"><b><u>Main point</u></b></span><br>Scripture</p></div><ol start="3"><li>Response</li></ol><p><br></p>';
const source={title:'Sermon',content,fontSize:12,audience:'general',versionId:'v1'};
test('Export preserves nested colors, highlight, emphasis, sizes, hard breaks and list numbering',()=>{
 const p=documentParagraphs(content,12,document);assert.equal(p[0].runs[0].color,'FF0000');assert.equal(p[0].runs[0].background,'FFE066');assert.equal(p[0].runs[0].bold,true);assert.equal(p[0].runs[0].underline,true);assert.equal(p[0].runs[0].fontSize,18);assert.equal(p[0].runs[1].text,'\n');assert.equal(p[1].prefix,'3. ');assert.equal(p[0].blockId,'a');
 const pdf=pdfDefinition(source,p);assert.deepEqual(pdf.content[0].margin,[0,0,0,0]);assert.equal(pdf.content[0].text[0].fontSize,18);assert.equal(pdf.content[0].text[0].background,'#FFE066');assert.equal(pdf.content[2].text,'\n');const print=pdfDefinition(source,p,'print');assert.equal(print.content[0].text[0].background,undefined);assert.equal(print.content[0].text[0].color,'#111111');
});
test('Word generation produces a real archive for the formatted document',async()=>{const blob=await Packer.toBuffer(await wordDocument(source,documentParagraphs(content,12,document)));assert.equal(blob.subarray(0,2).toString(),'PK');assert.ok(blob.length>5000);});
test('Slide queue keeps edited wording and order, deduplicates and detects changed or removed passages',()=>{
 const points=highlightedPoints(content,12,document);assert.equal(points[0].quote,'Main point');const first=mergeSlides([],points,source,()=> 'slide1');first[0].text='My slide wording';const again=mergeSlides(first,points,source);assert.equal(again.length,1);assert.equal(again[0].text,'My slide wording');assert.equal(slideState(first[0],[{...points[0],quote:'New point'}]),'changed');assert.equal(slideState(first[0],[]),'removed');assert.equal(slideState(first[0],points),'current');
});
test('Interrupted material streams only accept complete drafts and stale detection checks manuscript identity',()=>{
 assert.deepEqual(parseMaterials('<<<MATERIAL:summary>>>Complete<<<END_MATERIAL>>><<<MATERIAL:group>>>unfinished'),[{kind:'summary',text:'Complete'}]);assert.equal(sourceChanged(source,{...source,preparation:{}}),false);assert.equal(sourceChanged(source,{...source,content:content+'new'}),true);assert.equal(sourceChanged(source,{...source,fontSize:18}),true);assert.equal(sourceChanged(source,{...source,audience:'students'}),true);
});
