'use strict';
window.NEVERLAND_KEEPER_MELT=(function(){
 const width=192,height=288;
 const palette=[[255,197,125],[240,157,207],[169,143,234],[251,222,174]];
 const frames=new Map(),textures=new Map();
 let pool=null;
 function stage(level){return Math.max(0,Math.min(100,Math.round(level*100)));}
 function front(level,u){
  return 1-.63*level+.042*Math.sin(u*19+.7)+.028*Math.sin(u*43)+.012*Math.cos(u*79);
 }
 function frame(level){
  const key=stage(level);
  if(frames.has(key))return frames.get(key);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext?.('2d');
  if(!ctx)return null;
  const image=ctx.createImageData(width,height);
  if(key>0){
   for(let x=0;x<width;x++){
    const u=x/(width-1),edge=front(key/100,u);
    const drip=Math.pow(Math.max(0,Math.sin(u*67+1.2)),12)*.078;
    for(let y=0;y<height;y++){
     const dy=y/(height-1)-edge;
     if(dy<-.024)continue;
     const noise=((Math.imul(x+11,1879)^Math.imul(y+23,719))&63)/63;
     const j=(y*width+x)*4;
     let color,alpha;
     if(dy<.026+drip){
      const stripe=Math.min(3,Math.floor((dy+.024)/(.05+drip)*4));
      color=palette[stripe].map(c=>Math.round(c*(.88+noise*.12)));
      alpha=Math.min(1,(dy+.024)/.009)*.97;
     }else{
      const block=((Math.imul(Math.floor(x/7)+1,371)^Math.imul(Math.floor(y/5)+1,797))&31);
      const scan=y%4<2;
      const tone=block>28?238:scan?52+block*5:15+block*3;
      color=[tone,tone,tone];alpha=.86;
      if(block<2&&x%13<8)alpha=.34;
     }
     image.data.set([...color,Math.round(alpha*255)],j);
    }
   }
  }
  ctx.putImageData(image,0,0);
  const result={canvas,url:null};
  frames.set(key,result);return result;
 }
 function puddleCanvas(){
  if(pool)return pool;
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
  const ctx=canvas.getContext?.('2d');
  if(!ctx)return null;
  for(let layer=0;layer<11;layer++){
   const scale=1-layer*.079;
   ctx.beginPath();
   for(let i=0;i<=96;i++){
    const a=i/96*Math.PI*2;
    const r=1+.082*Math.sin(a*5+.55)+.046*Math.cos(a*9-layer*.34);
    const x=128+Math.cos(a)*109*scale*r,y=64+Math.sin(a)*47*scale*r;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }
   const rgb=palette[layer%palette.length];
   ctx.fillStyle='rgb('+rgb.join(',')+')';ctx.fill();
  }
  pool=canvas;return pool;
 }
 function texture(T,canvas){
  if(!canvas)return null;
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  map.minFilter=T.LinearFilter;map.magFilter=T.LinearFilter;return map;
 }
 return{
  front,
  finalSource(source){return source.replace('keeper-v3-','keeper-final-').replace(/\.webp$/,'.png');},
  poolScale(level){return level<=0?0:.28+.72*level;},
  texture(T,level){
   const key=stage(level);
   if(!textures.has(key))textures.set(key,texture(T,frame(level)?.canvas));
   return textures.get(key);
  },
  maskURL(level){
   const art=frame(level);
   if(!art)return '';
   return art.url??=art.canvas.toDataURL('image/png');
  },
  poolTexture(T){return texture(T,puddleCanvas());},
  poolURL(){return puddleCanvas()?.toDataURL('image/png')||'';}
 };
})();
