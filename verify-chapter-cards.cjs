'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const events={},timers=new Map();let timerId=0,paused=0,sync=0,continued=0;
function element(){return {classList:{add(){},remove(){}},setAttribute(){},addEventListener(k,fn){this[k]=fn},remove(){this.removed=true}}}
const context={document:{head:{append(){}},body:{append(){},classList:{add(){},remove(){}}},createElement:element,addEventListener(k,fn){events[k]=fn},removeEventListener(k){delete events[k]}},window:{neverlandWorld:{configure(options){if(options.paused)paused++}},sync3d(){sync++}},setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout(id){timers.delete(id)}};
vm.createContext(context);vm.runInContext(fs.readFileSync('chapter-cards.js','utf8'),context);
const c=context.window.NEVERLAND_CHAPTER;
assert(c.present('start',()=>continued++));assert(c.active);assert.equal(paused,1);assert.equal(continued,0,'story waits behind title');
assert(c.present('start',()=>continued++),'repeat transition waits for the existing card');
assert.equal([...timers.values()][0].ms,2700);let event={key:'Enter',preventDefault(){},stopImmediatePropagation(){}};events.keydown(event);assert.equal(continued,1);assert(!c.active);assert.equal(sync,1);assert(!c.present('start',()=>continued++),'same chapter does not repeat');
assert(c.present('fracture',()=>continued++));[...timers.values()][0].fn();assert.equal(continued,2,'automatic dismissal resumes story');
assert(c.present('awake',()=>continued++));c.reset();assert(!c.active);assert.equal(continued,2,'reset cancels pending continuation');assert(c.present('start',()=>continued++),'new game permits chapter again');
events.keydown(event);assert.equal(continued,3);
for(const key of ['exit','escape']){assert(c.present(key,()=>continued++));events.keydown(event)}
assert.equal(continued,5);assert(!c.present('unknown'));console.log('PASS: five chapter cards, skip, timing, pause, duplicate suppression, restart cleanup and story continuations.');
