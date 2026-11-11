const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const browser={};
const lib={window:browser,console};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'vendor/three.min.js'),'utf8'),lib);
const T=lib.THREE;
const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>o[k]??(()=>{})});
const canvas=()=>({width:1,height:1,style:{},getContext:()=>ctx});
const root={children:[{},{}],insertBefore(){},clientWidth:800,clientHeight:600,classList:{toggle(){},add(){},remove(){}}};
let next,draws=0,park;
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
 render(scene){draws++;if(scene.children.length>10)park=scene;}
}
const art={'00':{src:'mock'}};
const document={
 getElementById:id=>id==='world-root'?root:id==='keeper-art'?{textContent:JSON.stringify(art)}:{dataset:{}},
 createElement:canvas,body:{classList:{contains:()=>false}}
};
Object.assign(browser,{
 THREE:{...T,WebGLRenderer:Renderer,
  PMREMGenerator:class{fromScene(){return{texture:new T.Texture()}}dispose(){}},
  TextureLoader:class{load(){return new T.Texture()}}},
 NEVERLAND_DREAM_STAGE:()=>({update(){}}),
 NEVERLAND_INTERIOR_SCENES:{create:()=>({update(){}})},
 NEVERLAND_FRACTURE:{create:()=>({update(){}})},
 NEVERLAND_KEEPER_VEINS:{texture:()=>new T.Texture()},
 neverlandWorld:{state:{
  player:{x:0,z:16.4,yaw:Math.PI,pitch:0,eye:1.65},
  elapsed:0,config:{},running:{},exitReveal:{age:-1}
 }}
});
const sandbox={window:browser,document,devicePixelRatio:1,innerWidth:800,innerHeight:600,
 s:{phase:'main'},newGame(){},matchMedia:()=>({matches:false}),requestAnimationFrame:fn=>{next=fn;return 1},performance};
vm.createContext(sandbox);
for(const file of ['carnival-layout.js','castle-scene.js','carnival-scene.js','lost-boys.js']){
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
console.log('PASS: real Three.js geometry builds and renders its first frame with a WebGL adapter.');
