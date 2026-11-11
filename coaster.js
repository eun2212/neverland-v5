'use strict';
(function(){
 const duration=30;
 let ui=null,run=null;
 const motionReduced=()=>window.NEVERLAND_TOOLS?.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;

 function createModel({T,scene,cube,ball,cylinder,beam,curve,batch}){
  const site=window.NEVERLAND_LAYOUT.coaster;
  const fixed=new T.Group(),train=new T.Group();
  fixed.name='north-coaster-track';train.name='north-coaster-train';scene.add(fixed,train);
  const track=new T.CatmullRomCurve3([
   [-13,3,-73],[-6,3,-73],[3,4,-73],[14,13,-73],[21,9,-78],[17,4,-85],
   [6,7,-89],[-4,11,-88],[-13,5,-88],[-22,4,-83],[-22,5,-77]
  ].map(p=>new T.Vector3(...p)),true,'centripetal');
  const right=(u)=>{const d=track.getTangentAt(u);return new T.Vector3(-d.z,0,d.x).normalize();};
  for(const side of [-1,1]){
   const rail=Array.from({length:101},(_,i)=>{
    const u=i/100;return track.getPointAt(u).addScaledVector(right(u),side*.68).toArray();
   });
   curve(rail,.095,side===1?'gold':'redLight',fixed);
  }
  for(let i=0;i<90;i++){
   const u=i/90,p=track.getPointAt(u),r=right(u);
   beam(p.clone().addScaledVector(r,-.78).toArray(),p.clone().addScaledVector(r,.78).toArray(),.07,'wood',fixed);
   if(i%5!==0)continue;
   for(const side of [-1,1]){
    const top=p.clone().addScaledVector(r,.54*side),foot=p.clone().addScaledVector(r,1.18*side);
    beam([foot.x,0,foot.z],top.toArray(),.12,'green',fixed);
   }
   beam([p.x+r.x*1.18,0,p.z+r.z*1.18],[p.x-r.x*.54,p.y*.74,p.z-r.z*.54],.068,'greenLight',fixed);
  }
  const [x,z]=site.door;
  cube(x,0,z-2.3,8,.28,5.3,'stone',fixed);
  for(const offset of [-3.35,3.35]){
   cylinder(x+offset,.28,z-1.4,.17,4.2,'green',fixed);
   ball(x+offset,4.55,z-1.4,.17,'bulb',fixed);
  }
  cube(x,4.2,z-1.4,7.5,.36,1.4,'cream',fixed);
  const sign=document.createElement('canvas');sign.width=640;sign.height=128;
  const ink=sign.getContext('2d');
  ink.fillStyle='#311d39';ink.fillRect(0,0,640,128);
  ink.fillStyle='#fff1bd';ink.textAlign='center';ink.font='bold 56px sans-serif';
  ink.fillText(site.name,320,85);
  const map=new T.CanvasTexture(sign);map.colorSpace=T.SRGBColorSpace;
  const plate=new T.Mesh(new T.PlaneGeometry(6.5,1.3),new T.MeshBasicMaterial({map,toneMapped:false}));
  plate.position.set(x,3.4,z-.67);fixed.add(plate);
  const cars=Array.from({length:3},(_,i)=>{
   const car=new T.Group();train.add(car);
   cube(0,.02,0,1.24,.24,1.45,i?'greenLight':'red',car);
   cube(0,.26,.34,1.15,.53,.17,'cream',car);
   for(const side of [-1,1]){
    cube(side*.55,.23,0,.1,.39,1.4,'gold',car);
    ball(side*.45,.3,-.72,.08,'bulb',car);
   }
   return car;
  });
  batch(fixed);cars.forEach(car=>batch(car));
  const length=track.getLength();
  function place(progress){
   cars.forEach((car,i)=>{
    const u=(progress+1-i*1.65/length)%1;
    car.position.copy(track.getPointAt(u));
    car.lookAt(car.position.clone().sub(track.getTangentAt(u)));
   });
  }
  place(0);
  return {update(camera,hidden){
   fixed.visible=train.visible=!hidden;
   const active=run;
   let progress=0;
   if(active?.startedAt!==null&&active?.startedAt!==undefined){
    const t=Math.min(1,(performance.now()-active.startedAt)/(duration*1000));
    progress=t-.13*Math.sin(2*Math.PI*t)/(2*Math.PI);
    if(t===1&&!active.completed){
     active.completed=true;
     ui.status.textContent='열차가 승강장에 도착했습니다.';
     ui.leave.focus();
    }
   }
   place(progress);
   if(!active||hidden)return;
   if(motionReduced()){
    camera.position.set(-9,9,-63);camera.lookAt(-8,5,-77);return;
   }
   const seat=track.getPointAt(progress),ahead=track.getPointAt((progress+.016)%1);
   camera.position.copy(seat);camera.position.y+=1.12;
   ahead.y+=1.02;camera.lookAt(ahead);
  }};
 }

 function buildUI(){
  const shell=document.createElement('section');
  shell.id='coaster-board';shell.hidden=true;shell.setAttribute('aria-labelledby','coaster-title');
  shell.innerHTML='<h2 id="coaster-title"></h2><p>왼쪽 기어를 오른쪽 홈으로 끌어 놓으세요. 키보드로는 기어에 포커스한 뒤 Enter 또는 Space를 누르세요.</p><div class="coaster-gears"></div><p role="status"></p><button type="button" data-coaster-leave>공원으로 돌아가기</button>';
  document.body.append(shell);
  shell.querySelector('h2').textContent=window.NEVERLAND_LAYOUT.coaster.name;
  const status=shell.querySelector('[role=status]'),leave=shell.querySelector('[data-coaster-leave]');
  const tray=shell.querySelector('.coaster-gears');
  const gears=[];
  for(const name of ['금빛','자주','민트']){
   const row=document.createElement('div');row.className='coaster-gear-row';
   const button=document.createElement('button');button.type='button';button.textContent='⚙ '+name+' 기어';
   const slot=document.createElement('span');slot.className='coaster-gear-slot';slot.textContent=name+' 홈';
   row.append(button,slot);tray.append(row);gears.push({button,slot});
   let drag=null;
   function latch(){
    if(!run||run.startedAt!==null||button.disabled)return;
    button.disabled=true;slot.textContent='⚙ '+name+' 체결';slot.classList.add('latched');run.count++;
    if(run.count<gears.length){
     status.textContent=run.count+' / '+gears.length+'개 체결';
     if(document.activeElement===button)gears.find(g=>!g.button.disabled)?.button.focus();
     return;
    }
    run.startedAt=performance.now();
    shell.classList.add('coaster-running');
    status.textContent='기어가 모두 체결됐습니다. 열차가 출발합니다.';
    leave.focus();
   }
   function clear(){
    drag=null;button.style.translate='';
   }
   button.addEventListener('pointerdown',event=>{
    if(!run||button.disabled||drag||event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};
    button.setPointerCapture(event.pointerId);
   });
   button.addEventListener('pointermove',event=>{
    if(drag?.id!==event.pointerId)return;
    button.style.translate=(event.clientX-drag.x)+'px '+(event.clientY-drag.y)+'px';
   });
   button.addEventListener('pointerup',event=>{
    if(drag?.id!==event.pointerId)return;
    clear();
    const r=slot.getBoundingClientRect();
    if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)latch();
    else status.textContent='기어를 오른쪽의 같은 색 홈에 놓으세요.';
   });
   for(const type of ['pointercancel','lostpointercapture'])button.addEventListener(type,clear);
   button.addEventListener('click',event=>{if(event.detail===0)latch();});
   gears.at(-1).reset=()=>{clear();button.disabled=false;slot.classList.remove('latched');slot.textContent=name+' 홈';};
  }
  leave.onclick=()=>close(true);
  return {shell,status,leave,gears};
 }
 function close(returnToPark=false){
  if(!run)return;
  const {onReturn}=run;run=null;
  ui.shell.hidden=true;ui.shell.classList.remove('coaster-running');
  document.body.classList.remove('coaster-active');
  if(returnToPark)onReturn();
 }
 window.NEVERLAND_COASTER={
  createModel,
  get active(){return !!run;},
  open(onReturn){
   if(run)return;
   ui??=buildUI();
   run={onReturn,count:0,startedAt:null,completed:false};
   for(const gear of ui.gears)gear.reset();
   ui.status.textContent='0 / '+ui.gears.length+'개 체결';
   document.body.classList.add('coaster-active');
   ui.shell.hidden=false;ui.gears[0].button.focus();
  },
  close
 };
})();
