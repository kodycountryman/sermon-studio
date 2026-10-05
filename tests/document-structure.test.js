import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSections,mapOffset,reconcileComments,moveSection} from '../js/document-structure.js';

const blocks=[{id:'a',text:'Introduction',heading:true},{id:'b',text:'Opening story'},{id:'c',text:'Main point',heading:true},{id:'d',text:'John 3:16',scripture:'John 3:16'},{id:'e',text:'Closing',heading:true}];
test('section boundaries contain complete paragraphs and scripture navigation',()=>{
  const sections=buildSections(blocks);assert.deepEqual(sections.map(s=>s.blockIds),[['a','b'],['c','d'],['e']]);assert.equal(sections[1].references[0].label,'John 3:16');
  assert.deepEqual(buildSections(blocks,{c:{heading:false}}).map(s=>s.blockIds),[['a','b','c','d'],['e']]);
  assert.equal(buildSections(blocks,{b:{heading:true,label:'My story'}})[1].title,'My story');
});
test('moving sections preserves block identity and includes their body paragraphs',()=>{
  const children=blocks.map(block=>({id:block.id,getAttribute:()=>block.id}));
  const pointNode=children[2];
  const root={children,insertBefore(node,anchor){this.children.splice(this.children.indexOf(node),1);const index=anchor?this.children.indexOf(anchor):this.children.length;this.children.splice(index,0,node);}};
  assert.equal(moveSection(root,buildSections(blocks),'c','a'),true);assert.deepEqual(root.children.map(n=>n.id),['c','d','a','b','e']);
  assert.equal(root.children[0],pointNode); // Moving keeps the original DOM node and its attachments.
  assert.equal(moveSection(root,buildSections(blocks),'bad','a'),false);
});
test('comments follow text inserted before or rewritten inside their passage',()=>{
  assert.equal(mapOffset('Hello world','Dear Hello world',6),11);
  const comment={id:'note',anchor:{start:{blockId:'b',offset:8},end:{blockId:'b',offset:13},quote:'story'},resolved:false};
  const next=reconcileComments([comment],[{id:'b',text:'Opening story'}],[{id:'b',text:'My Opening story'}])[0];
  assert.equal(next.anchor.start.offset,11);assert.equal(next.anchor.end.offset,16);assert.equal(next.detached,false);
});
test('deleting annotated text preserves the comment as a detached note',()=>{
  const note={text:'Find a source',anchor:{start:{blockId:'b',offset:8},end:{blockId:'b',offset:13},quote:'story'}};
  assert.equal(reconcileComments([note],[{id:'b',text:'Opening story'}],[{id:'b',text:'Opening '}])[0].detached,true);
  const removed=reconcileComments([note],blocks,blocks.filter(item=>item.id!=='b'))[0];assert.equal(removed.detached,true);assert.equal(removed.text,'Find a source');
});
test('reordering blocks leaves same-block comment anchors unchanged',()=>{
  const note={anchor:{start:{blockId:'b',offset:0},end:{blockId:'b',offset:7},quote:'Opening'}};
  assert.deepEqual(reconcileComments([note],blocks,[blocks[2],blocks[3],blocks[0],blocks[1],blocks[4]])[0].anchor,note.anchor);
});
