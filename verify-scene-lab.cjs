const fs=require('fs'),vm=require('vm'),path=require('path');
let suite=fs.readFileSync(path.join(__dirname,'verify-full-story.cjs'),'utf8');
suite+=`
Element.prototype.focus=function(){document.activeElement=this;};document.documentElement=new Element();
Object.defineProperty(Element.prototype,'previousElementSibling',{get(){return new Element();}});
Object.defineProperty(Element.prototype,'parentNode',{get(){return new Element();}});
for(const file of ['keeper-story.js','ending-dialogue.js','ending-world.js','dialogue-controls.js','game-tools.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
run(\`
const tools=window.NEVERLAND_TOOLS;let mounts=[],destroyed=0,forced=0,keyEvents=[];
window.NEVERLAND_COASTER_LEVER={mount(host,options){mounts.push('captain');return{destroy(){destroyed++}}}};
window.NEVERLAND_RIDE_INTERACTIONS={mount(host,options){mounts.push(options.ride);return{destroy(){destroyed++}}}};
const originalQuery=document.querySelector;
document.querySelector=(q)=>q.includes('__refuse')?{click(){forced++}}:q.includes('__handle')?{dispatchEvent(e){keyEvents.push(e.key)}}:originalQuery(q);
window.KeyboardEvent=class{constructor(type,opts){this.key=opts.key}};
window.NEVERLAND_COASTER={active:false,open(callback){this.active=true;this.onReturn=callback},close(){this.active=false}};
let boothId='';window.NEVERLAND_BOOTH_GAMES={active:false,open(id,onReturn){this.active=true;boothId=id;this.onReturn=onReturn},close(){this.active=false}};
for(const id of [0,1,2,4]){tools.jump('control',id);test(mounts.at(-1)===(id===0?'captain':id),'control opens actual mount '+id);test(world3d.state.interior.ride===id&&world3d.state.interior.seated,'control enters seated ride '+id);}
tools.jump('force',0);test(keyEvents.at(-1)==='ArrowLeft','captain force dispatches real reverse input');
for(const id of [1,2,4]){let before=forced;tools.jump('force',id);test(forced===before+1,'force invokes refusal '+id);}
for(const id of [0,1,2,4]){tools.jump('running',id);test(world3d.state.interior.running,'running starts ride '+id);test(pendingRideResult?.kind===(id===0?'tutorial':'normal'),'running keeps completion routing '+id);}
tools.jump('incident',1);test(keeperStoryState.incidents.size===1&&s.phase==='story','incident opens keeper scene');
tools.jump('coaster-force');test(window.NEVERLAND_COASTER.active&&forced>=4,'coaster force opens and invokes refusal');
tools.jump('coaster-running');test(window.NEVERLAND_COASTER.active&&keyEvents.at(-1)==='End','coaster running uses real end input');
for(const booth of window.NEVERLAND_LAYOUT.games){tools.jump('booth',booth.id);test(!window.NEVERLAND_BOOTH_GAMES.active,'booth entry remains in world');tools.jump('booth-play',booth.id);test(window.NEVERLAND_BOOTH_GAMES.active&&boothId===booth.id,'actual booth opens '+booth.id);}
tools.jump('dream','accuse');test(keeperStoryState.dream==='accuse','dream shortcut records selected branch');
test(destroyed>0,'opening a different checkpoint destroys old mounted control');
test(tools.testing,'new checkpoints stay in test mode');tools.jump('title');test(!tools.testing&&s.phase==='profile','title exits testing');
\`);console.log('PASS: '+assertions+' assertions including fine-grained scene checkpoints and cleanup.');`;
vm.runInThisContext('(function(require,__dirname){'+suite+'\n})',{filename:__filename})(require,__dirname);
