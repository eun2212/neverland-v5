const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const browser={};
const lib={window:browser,console};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'vendor/three.min.js'),'utf8'),lib);
const T=lib.THREE;
const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>o[k]??(()=>{})});
const canvas=()=>({width:1,height:1,style:{},getContext:()=>ctx});
const root={children:[{},{}],insertBefore(){},clientWidth:800,clientHeight:600,classList:{toggle(){},add(){},remove(){}}};
let next,draws=0,park,camera,now=0,reduced=false;
class Renderer{
 constructor(){
  this.domElement=canvas();
  this.shadowMap={};
  this.capabilities={isWebGL2:false,getMaxAnisotropy:()=>4};
  this.info={render:{calls:0,triangles:0}};
 }
 setPixelRatio(v){this.ratio=v}
 getPixelRatio(){return this.ratio}
 setSize(w,h){this.domElement.width=w;this.domElement.height=h}
 setRenderTarget(){}
 render(scene,view){draws++;if(scene.children.length>10){park=scene;camera=view;}}
}
const art={'00':{src:'assets/keeper-v3-01-basic.webp'},'08':{src:'assets/keeper-v3-10-stay.webp'}};
const document={
 getElementById:id=>id==='world-root'?root:id==='keeper-art'?{textContent:JSON.stringify(art)}:{dataset:{}},
 createElement:canvas,body:{classList:{contains:()=>false}}
};
Object.assign(browser,{
 THREE:{...T,WebGLRenderer:Renderer,
  PMREMGenerator:class{fromScene(){return{texture:new T.Texture()}}dispose(){}},
  TextureLoader:class{load(src){const texture=new T.Texture();texture.name=src;return texture;}}},
 NEVERLAND_DREAM_STAGE:()=>({update(){}}),
 NEVERLAND_INTERIOR_SCENES:{create:()=>({update(){}})},
 NEVERLAND_FRACTURE:{create:()=>({update(){}})},
 neverlandWorld:{state:{
  player:{x:0,z:16.4,yaw:Math.PI,pitch:0,eye:1.65},
  elapsed:0,config:{},running:{},exitReveal:{age:-1}
 }}
});
const sandbox={window:browser,document,devicePixelRatio:1,innerWidth:800,innerHeight:600,
 s:{phase:'main'},newGame(){},matchMedia:()=>({matches:reduced}),requestAnimationFrame:fn=>{next=fn;return 1},performance:{now:()=>now}};
vm.createContext(sandbox);
for(const file of ['carnival-layout.js','castle-scene.js','keeper-melt.js','coaster.js','mascot-scene.js','carnival-scene.js','lost-boys.js']){
 vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),sandbox,{filename:file});
}
assert(browser.carnivalScene);
assert.equal(typeof next,'function');
next();
assert(draws>0);
const coords=[[-6,15],[6,15],[-9,-10],[9,-10],[31,-30],[-31,-29],[-32,6],[31,6]];
const dolls=coords.map(([x,z])=>park.children.find(object=>object.isGroup&&object.position.x===x&&object.position.z===z));
assert(dolls.every(doll=>doll&&!doll.visible),'ordinary dolls stay hidden before free roam');
browser.neverlandWorld.state.config.free=true;
next();assert(dolls.every(doll=>doll.visible),'all eight ordinary dolls appear at original park coordinates');
browser.neverlandWorld.state.interior={ride:1};
next();assert(dolls.every(doll=>!doll.visible),'ordinary park dolls stay outside ride interiors');
browser.neverlandWorld.state.interior=null;
browser.neverlandWorld.state.passage={};
next();assert(dolls.every(doll=>!doll.visible),'ordinary park dolls stay outside the passage');
const puddle=park.getObjectByName('keeper-melt-puddle');
assert(puddle.visible,'passage keeper has a puddle');
const keeper=park.children.find(o=>o.isSprite);
const shader={uniforms:{},fragmentShader:T.ShaderLib.sprite.fragmentShader};
keeper.material.onBeforeCompile(shader);
assert(shader.uniforms.keeperMeltMap.value?.isTexture);
assert(shader.fragmentShader.includes('diffuseColor.rgb=mix(diffuseColor.rgb,melt.rgb,melt.a)'));
browser.neverlandWorld.state.passage=null;
next();assert(!puddle.visible,'puddle resets when melt is zero');
Object.assign(browser.neverlandWorld.state.config,{exit:true,exitRide:1,confronting:true,keeperMelt:1});
next();
assert.match(keeper.material.map.name,/keeper-final-10-stay/);
assert(!puddle.visible,'final effect replaces the pastel puddle');
reduced=true;next();assert.equal(shader.uniforms.keeperGlitch.value,0,'reduced motion keeps the final glitch static');
reduced=false;Object.assign(browser.neverlandWorld.state.config,{exit:false,confronting:false,keeperMelt:0});
next();assert.match(keeper.material.map.name,/keeper-v3-01-basic/);

console.log('PASS: real Three.js geometry builds and renders its first frame with a WebGL adapter.');

function element(){
 const handlers={},children=[];
 return {
  children,style:{},classList:{add(){},remove(){}},setAttribute(){},append(...nodes){children.push(...nodes);},
  addEventListener(type,handler){handlers[type]=handler;},focus(){document.activeElement=this;},
  fire(type,event){handlers[type](event);},setPointerCapture(id){this.captured=id;},
  getBoundingClientRect(){return {left:120,right:200,top:20,bottom:70};}
 };
}
const board=element(),tray=element(),status=element(),leave=element();
const nodes={h2:element(),'.coaster-gears':tray,'[role=status]':status,'[data-coaster-leave]':leave};
board.querySelector=key=>nodes[key];
document.createElement=tag=>tag==='section'?board:element();
document.body.append=()=>{};
document.body.classList.add=()=>{};
document.body.classList.remove=()=>{};
browser.neverlandWorld.state.passage=null;
let returns=0;
browser.NEVERLAND_COASTER.open(()=>returns++);
const [first,second,third]=tray.children.map(row=>row.children[0]);
first.fire('pointerdown',{button:0,pointerId:11,clientX:10,clientY:30});
assert.equal(first.captured,11);
first.fire('pointermove',{pointerId:11,clientX:160,clientY:35});
assert.equal(first.style.translate,'150px 5px');
first.fire('pointerup',{pointerId:11,clientX:80,clientY:35});
assert(!first.disabled,'incorrect target does not latch');
first.fire('pointerdown',{button:0,pointerId:12,clientX:10,clientY:30});
first.fire('pointerup',{pointerId:12,clientX:160,clientY:35});
assert(first.disabled,'touch pointer drop latches the gear');
second.fire('click',{detail:0});
third.fire('click',{detail:0});
assert.match(status.textContent,/출발/);
next();
const train=park.getObjectByName('north-coaster-train');
assert.equal(train.children.length,3);
const start=train.children[0].position.clone();
now=5000;next();
assert(train.children[0].position.distanceTo(start)>3,'train travels on the track');
reduced=true;next();const fixedCamera=camera.position.clone();
now=10000;next();
assert(camera.position.equals(fixedCamera),'reduced motion keeps the camera still');
now=30001;next();
assert.match(status.textContent,/도착/);
assert(train.children[0].position.distanceTo(start)<.001,'train stops at the station after one lap');
leave.onclick();assert.equal(returns,1);assert(!browser.NEVERLAND_COASTER.active);
console.log('PASS: captured gear drag, keyboard latching, three-car motion, station return, and reduced-motion camera.');

const transformation=browser.NEVERLAND_MASCOT_SCENE(T,new T.Scene());
browser.NEVERLAND_MASCOT={reveal:{}};
transformation.update(browser.neverlandWorld.state,10,false);
assert(transformation.escape.getObjectByName('transforming-ragdoll').visible);
assert(!transformation.escape.getObjectByName('neverland-pursuer').visible);
transformation.update(browser.neverlandWorld.state,12,false);
assert(!transformation.escape.getObjectByName('transforming-ragdoll').visible);
assert(transformation.escape.getObjectByName('neverland-pursuer').visible);

browser.NEVERLAND_MASCOT={active:true,chase:{monster:{x:.25,z:4}},catSpot:{x:3,z:3}};
browser.neverlandWorld.state.player={x:0,z:0,yaw:0,pitch:0,eye:1.65};
next();
assert(park.getObjectByName('neverland-pursuer'),'dedicated chase scene renders pursuer');
assert(park.getObjectByName('broken-keeper-key'),'fixed exit has broken key geometry');
console.log('PASS: Three.js chase scene renders the pursuer and fixed exit.');
