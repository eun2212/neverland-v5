'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const base=path.join(__dirname,'..','neverland-v4');
class Element {
 constructor(){this.listeners={};this.children=[];this.parent=null;this.hidden=false;this.disabled=false;this.style={setProperty(){},translate:''};this.classList={add(){},remove(){}};this.attrs={};}
 set innerHTML(value){this.parts={};const names=value.includes('coaster-lever__track')?['.coaster-lever__track','.coaster-lever__handle','.coaster-lever__hand','.coaster-lever__status','.coaster-lever__cancel']:['h2','.coaster-gears','[role=status]','[data-coaster-leave]'];for(const name of names)this.parts[name]=new Element();}
 querySelector(s){return this.parts[s]} append(...els){for(const e of els){e.parent=this;this.children.push(e)}} remove(){this.removed=true;if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this)} setAttribute(k,v){this.attrs[k]=v} addEventListener(k,f){(this.listeners[k]??=[]).push(f)} fire(k,e={}){e.preventDefault??=()=>{};for(const f of this.listeners[k]||[])f(e)} focus(){document.activeElement=this} getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100,width:100}} setPointerCapture(id){this.capture=id} hasPointerCapture(id){return this.capture===id} releasePointerCapture(){this.capture=null}
}
const document={body:new Element(),createElement:()=>new Element(),activeElement:null};let now=0,queue=[],nextId=0;
const window={NEVERLAND_LAYOUT:{coaster:{name:'test',door:[-13,-67]}},matchMedia:()=>({matches:false})};
const ctx={window,document,performance:{now:()=>now},matchMedia:window.matchMedia,setTimeout:f=>{queue.push([++nextId,f]);return nextId},clearTimeout:id=>queue=queue.filter(x=>x[0]!==id)};vm.createContext(ctx);
for(const file of ['coaster-lever.js','coaster.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx,{filename:file});
function flush(){while(queue.length)queue.shift()[1]()}
let returns=0;const api=window.NEVERLAND_COASTER;api.open(()=>returns++);
const shell=document.body.children[0],tray=shell.querySelector('.coaster-gears'),status=shell.querySelector('[role=status]'),leave=shell.querySelector('[data-coaster-leave]');
const gears=tray.children.map(row=>row.children[0]);function latch(){for(const gear of gears)gear.fire('click',{detail:0})}function lever(){return shell.children.find(c=>c.className==='coaster-lever')}
latch();assert(tray.hidden&&leave.hidden);let panel=lever();assert(panel,'three gears open lever');assert(api.active);
panel.querySelector('.coaster-lever__cancel').fire('click');assert(panel.removed);assert(!tray.hidden&&!leave.hidden);assert(gears.every(g=>!g.disabled));assert.match(status.textContent,/0 \/ 3/);
latch();panel=lever();panel.querySelector('.coaster-lever__handle').fire('keydown',{key:'End'});assert(panel.removed);assert.match(status.textContent,/출발/);leave.onclick();assert.equal(returns,1);assert(!api.active);
api.open(()=>returns++);assert(gears.every(g=>!g.disabled));latch();panel=lever();panel.querySelector('.coaster-lever__handle').fire('keydown',{key:'ArrowLeft'});flush();assert(panel.removed);assert.match(status.textContent,/출발/);api.close();
api.open(()=>returns++);latch();panel=lever();panel.querySelector('.coaster-lever__handle').fire('keydown',{key:'ArrowLeft'});api.close();flush();assert(panel.removed);assert(!api.active);
console.log('PASS: gear-to-lever, cancellation, re-entry, direct and forced launch, close during forced motion');
