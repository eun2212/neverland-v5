'use strict';
// Exercise sign painting before and after its artwork loads, including failure.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/carnival-scene.js','utf8');
for(const asset of ['midway-sign-frame.png','midway-food-sign-frame.png']){
 const bytes=fs.readFileSync(__dirname+'/assets/'+asset);
 assert(bytes.length>1000&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),asset+' must be a valid PNG');
}
const start=source.indexOf('// The frame is shared by all six signs');
const end=source.indexOf('function gameBoothRoof',start);
assert(start>=0&&end>start,'sign implementation is present');
const images=[],canvases=[];
class ImageMock{constructor(){images.push(this)}set src(value){this.url=value}}
class CanvasTexture{constructor(canvas){this.canvas=canvas;this.needsUpdate=false}}
class PlaneGeometry{constructor(width,height){this.width=width;this.height=height}}
class MeshBasicMaterial{constructor(options){Object.assign(this,options)}}
const T={CanvasTexture,PlaneGeometry,MeshBasicMaterial,SRGBColorSpace:'srgb',DoubleSide:'double'};
const document={createElement(type){
 assert.equal(type,'canvas');
 const calls=[];
 const ctx={calls,clearRect(){},fillRect(){},strokeRect(){},drawImage(image){calls.push(['image',image.url])},fillText(value){calls.push(['text',value])}};
 const canvas={getContext(){return ctx},calls};canvases.push(canvas);return canvas;
}};
const context={document,T,Image:ImageMock,mesh:(g,m,parent)=>({geometry:g,material:m,parent})};
vm.runInNewContext(source.slice(start,end)+'\nthis.makeFood=shopSign;this.makeGame=gameBoothSign;this.arts=gameBoothArt;this.foodNames=foodSignNames;',context);
const parent={};
const labels=[context.foodNames.drinks,context.foodNames.candy];
assert.deepEqual(labels,['STARLIGHT DRINKS','MOONCLOUD CANDY']);
assert(source.includes('shopSign(foodSignNames[shop.id]||shop.id.toUpperCase()'),'physical food signs use the English name for each booth');
const foods=labels.map(label=>context.makeFood(label,5.45,1.09,'#fff',parent));
const games=Object.values(context.arts).map(art=>context.makeGame(art,parent));
assert.equal(canvases.length,6);assert.equal(images.length,5);
for(let i=0;i<2;i++)assert(canvases[i].calls.some(x=>x[0]==='text'&&x[1]===labels[i]),'food fallback includes its name');
for(let i=0;i<4;i++)assert(canvases[i+2].calls.some(x=>x[0]==='text'&&x[1]===Object.values(context.arts)[i].title),'game fallback includes its title');
assert.equal(canvases.flatMap(c=>c.calls.filter(x=>x[0]==='image')).length,0,'fallback requires no image');
images[0].onload();
assert.equal(canvases.slice(2).flatMap(c=>c.calls.filter(x=>x[0]==='image')).length,4,'game art updates all four signs');
assert.equal(canvases.slice(0,2).flatMap(c=>c.calls.filter(x=>x[0]==='image')).length,0,'food names remain readable if its image fails');
images[1].onload();
assert.equal(canvases.slice(0,2).flatMap(c=>c.calls.filter(x=>x[0]==='image')).length,2,'food art updates both food signs');
for(const item of [...foods,...games])assert(item.material.map.needsUpdate,'updated canvas is uploaded');
console.log('PASS: six readable fallback signs and shared artwork loading');
