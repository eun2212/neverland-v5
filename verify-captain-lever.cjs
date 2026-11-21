// Real Captain Hook story callbacks with the shared rollercoaster lever.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
let suite=fs.readFileSync(path.join(__dirname,'verify-full-story.cjs'),'utf8');
suite+=`
vm.runInContext(fs.readFileSync(path.join(root,'keeper-story.js'),'utf8'),sandbox,{filename:'keeper-story.js'});
class LeverElement {constructor(){this.listeners={};this.attrs={};this.children=[];this.style={setProperty(){}};this.classList={add(){}};}set innerHTML(v){this.parts={p:new LeverElement()};for(const k of ['track','handle','hand','status','cancel'])this.parts['.coaster-lever__'+k]=new LeverElement();}querySelector(q){return this.parts[q]}append(e){this.children.push(e)}remove(){this.removed=true}setAttribute(k,v){this.attrs[k]=v}addEventListener(k,f){(this.listeners[k]??=[]).push(f)}focus(){}getBoundingClientRect(){return {left:0,width:100}}setPointerCapture(id){this.capture=id}hasPointerCapture(id){return this.capture===id}releasePointerCapture(){this.capture=null}fire(k,e={}){e.preventDefault??=()=>{};for(const f of this.listeners[k]||[])f(e)}}
const create=document.createElement.bind(document),mounts=[];document.createElement=tag=>tag==='section'||tag==='img'?new LeverElement():create(tag);
let timers=[],counter=0;sandbox.setTimeout=f=>{timers.push([++counter,f]);return counter};sandbox.clearTimeout=id=>timers=timers.filter(t=>t[0]!==id);const flush=()=>{while(timers.length)timers.shift()[1]()};
Object.defineProperty(Element.prototype,'previousElementSibling',{get(){return this._prev??=new Element()}});Object.defineProperty(Element.prototype,'parentNode',{get(){return this._parent??={append(e){mounts.push(e)}}}});
const append=Element.prototype.append;Element.prototype.append=function(...items){for(const item of items)if(item instanceof LeverElement)mounts.push(item);append.apply(this,items)};
vm.runInContext(fs.readFileSync(path.join(root,'coaster-lever.js'),'utf8'),sandbox,{filename:'coaster-lever.js'});
const originalGet=document.getElementById;document.getElementById=id=>id==='captainVisual'?null:originalGet(id);
function key(panel,key){panel.querySelector('.coaster-lever__handle').fire('keydown',{key})}
function first(){run("newGame();s.keeperIntroduced=true;firstLever3d=true;world3d.enterRide(0);world3d.forceBoard(0);keeperFirstBoarding3d();drain();$('choices').children[3].onclick();");return mounts.at(-1)}
let panel=first();test(!el('overlay').innerHTML.includes('captain-visual'),'first boarding omits old captain illustration');test(panel&&panel.querySelector('.coaster-lever__handle').attrs['aria-valuenow']==='0','first boarding opens shared lever');key(panel,'End');run("test($('text').textContent.includes('제 말대로'),'first lever preserves dialogue');drain();test(world3d.state.interior.running,'first lever starts ride');");
panel=first();key(panel,'ArrowLeft');flush();run("test($('text').textContent.includes('제 말대로'),'forced first lever continues story');drain();test(world3d.state.interior.running,'forced first lever starts ride');");
panel=first();panel.querySelector('.coaster-lever__cancel').fire('click');test(run("$('choices').children.length===4 && !world3d.state.interior.running"),'cancel returns to first boarding menu');
function revisit(){run("newGame();s.ride=0;world3d.enterRide(0);world3d.forceBoard(0);atControl3d=true;openPuzzle();atControl3d=false;");return mounts.at(-1)}
panel=revisit();test(!el('overlay').innerHTML.includes('captain-visual'),'revisit omits old captain illustration');key(panel,'End');run("drain();test($('choices').children.length===3,'one lever preserves keeper choice');$('choices').children[1].onclick();drain();test(world3d.state.interior.running && pendingRideResult.kind==='normal','one lever starts real ride');");
panel=revisit();key(panel,'ArrowLeft');flush();run("drain();test($('choices').children.length===3,'forced reverse reaches keeper choice without safety failure');$('choices').children[1].onclick();drain();test(world3d.state.interior.running,'forced reverse starts ride');");
panel=revisit();panel.querySelector('.coaster-lever__cancel').fire('click');test(run('!world3d.state.interior.running'),'revisit cancel does not launch');
console.log('PASS: first boarding, forced and normal start, cancellation, single revisit lever and forced departure');
`;
vm.runInThisContext('(function(require,__dirname){'+suite+'\n})',{filename:__filename})(require,__dirname);
