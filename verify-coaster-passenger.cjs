'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),T=require('./vendor/three.min.js');
class E{constructor(){this.hidden=false;this.classList={add(){},remove(){}};this.nodes={h2:{textContent:''},'[role=status]':{textContent:''},'[data-coaster-leave]':{hidden:false,focus(){}}}}set innerHTML(v){}querySelector(n){return this.nodes[n]}setAttribute(){}focus(){}}
const root={append(){},classList:{add(){},remove(){}}}, layout={coaster:{door:[0,-66],name:'coaster'}};let options,now=0;
const win={NEVERLAND_LAYOUT:layout,neverland:{state:{gender:'male'}},NEVERLAND_COASTER_SAFETYBAR:{mount(c,o){options=o;return{destroy(){}}}}};
vm.runInNewContext(fs.readFileSync('coaster.js','utf8'),{window:win,document:{body:root,createElement:()=>new E()},performance:{now:()=>now},matchMedia:()=>({matches:false}),Math});
const geom=new T.BoxGeometry(1,1,1),mat=new T.MeshBasicMaterial();
function obj(parent){const x=new T.Mesh(geom,mat);parent.add(x);return x}
const api={T,scene:new T.Scene(),cube:(x,y,z,w,h,d,m,p)=>obj(p),ball:(x,y,z,r,m,p)=>obj(p),cylinder:(x,y,z,r,h,m,p)=>obj(p),beam(){},curve(){},batch(){}};
const model=win.NEVERLAND_COASTER.createModel(api),camera=new T.PerspectiveCamera();
win.NEVERLAND_COASTER.open(()=>{});model.update(camera,false);const male=api.scene.getObjectByName('coaster-passenger-male'),female=api.scene.getObjectByName('coaster-passenger-female');
assert(male&&female);assert.equal(male.visible,true);assert.equal(female.visible,false);assert.equal(options.gender,'male');
options.onStart();now=5000;model.update(camera,false);const pos=camera.position.clone();now=7000;model.update(camera,false);assert(camera.position.distanceTo(pos)>0,'follow camera advances with ride');
win.NEVERLAND_COASTER.close(false);win.neverland.state.gender='female';win.NEVERLAND_COASTER.open(()=>{});model.update(camera,false);assert.equal(male.visible,false);assert.equal(female.visible,true);assert.equal(options.gender,'female');console.log('PASS: selected gender in safety bar and 3D rider, moving follow camera');
