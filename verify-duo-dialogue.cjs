const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{
 constructor(tag=''){this.tagName=tag;this.children=[];this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x)};}
 append(el){this.children.push(el);el.parent=this;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
}
const stage=new Element('stage'),head=new Element('head');let listener,received,done;
const document={head,getElementById:id=>id==='stage'?stage:null,createElement:tag=>new Element(tag),addEventListener:(event,fn)=>{if(event==='click')listener=fn;}};
const context={document,console,window:{story:(lines,callback)=>{received=lines;done=callback;}}};vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname+'/duo-dialogue.js','utf8'),context);
const api=context.window.NEVERLAND_DUO;let advanced=0;
const lines=[['고양이','여기 있어'],['키퍼','돌아가']];api.play(lines,()=>advanced++);
assert.equal(api.active,true);assert(stage.classList.contains('neverland-duo'));assert.equal(stage.children[0].src,'assets/mascot-cat.png');assert.equal(received,lines);
done();assert.equal(advanced,1);assert.equal(api.active,false);assert.equal(stage.children.length,0);assert(!stage.classList.contains('neverland-duo'));
api.play(lines,()=>{});listener({target:{closest:()=>true}});assert.equal(api.active,false);assert.equal(stage.children.length,0);
console.log('PASS: paired portraits, unchanged dialogue callbacks and restart cleanup');
