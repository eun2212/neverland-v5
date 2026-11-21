'use strict';
// Verify the approved titles, all entrance anchors, and async image fallback.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/carnival-scene.js','utf8');
const layout=fs.readFileSync(__dirname+'/carnival-layout.js','utf8');
const start=src.indexOf('// The frame is shared by all six signs');
const end=src.indexOf('function gameBoothRoof',start);
const signsStart=src.indexOf('const rideSignSpecs=');
const signsEnd=src.indexOf('// Batch static meshes',signsStart);
assert(start>=0&&end>start&&signsStart>=0&&signsEnd>signsStart);
const images=[],boards=[];
class MockImage{constructor(){images.push(this)}set src(value){this.url=value}}
class CanvasTexture{constructor(canvas){this.canvas=canvas;this.needsUpdate=false}}
class PlaneGeometry{constructor(width,height){this.width=width;this.height=height}}
class MeshBasicMaterial{constructor(options){Object.assign(this,options)}}
const T={CanvasTexture,PlaneGeometry,MeshBasicMaterial,SRGBColorSpace:'srgb',DoubleSide:'double'};
const document={createElement(kind){
 assert.equal(kind,'canvas');const calls=[];
 const ctx={clearRect(){},fillRect(){},strokeRect(){},drawImage(img){calls.push(['image',img.url])},fillText(text){calls.push(['text',text])}};
 return {getContext(){return ctx},calls};
}};
const window={};const stat={};
const context={window,document,T,stat,Image:MockImage,mesh:(geometry,material,parent)=>{
 const board={geometry,material,parent,position:{set(x,y,z){Object.assign(this,{x,y,z})}}};boards.push(board);return board;
}};
vm.runInNewContext(layout,context);
context.L=context.window.NEVERLAND_LAYOUT;
vm.runInNewContext(src.slice(start,end)+'\n'+src.slice(signsStart,signsEnd),context);
const expected=[['captain',"Hook's Last Voyage"],['wheel','Flight to Neverland'],['carousel',"Lost Boys' Carousel"],['mirror','Mermaid Lagoon Mirrors'],['tea',"Tinker Bell's Tea Party"],['coaster','Beyond the Second Star']];
assert.equal(boards.length,6);assert.equal(images.length,5);
for(let i=0;i<expected.length;i++){
 const [id,title]=expected[i],b=boards[i];
 const anchor=id==='coaster'?context.L.coaster.door:context.L.rides.find(r=>r.id===id).control;
 assert.equal(b.name,'ride-sign-'+id);assert.equal(b.parent,stat);
 assert(b.material.map.canvas.calls.some(call=>call[0]==='text'&&call[1]===title),'fallback title '+id);
 assert.equal(b.position.x,anchor[0]);assert(b.position.y>3.5,'clear above pedestrians');
 assert(b.position.z<anchor[1],'behind the entrance and facing the park');
 assert.equal(b.material.side,T.DoubleSide);
}
for(const [i,asset] of [[2,'ride-sign-voyage.png'],[3,'ride-sign-starlight.png'],[4,'ride-sign-lagoon.png']]){
 assert(images[i].url.includes(asset));
 const bytes=fs.readFileSync(__dirname+'/assets/'+asset);
 assert(bytes.length>1000&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),asset+' is PNG');
 images[i].onload();
}
for(const board of boards){
 assert(board.material.map.canvas.calls.some(call=>call[0]==='image'),'theme frame applied to '+board.name);
 assert(board.material.map.needsUpdate);
}
console.log('PASS: six approved ride titles, entrance anchors, fallback and loaded artwork');
