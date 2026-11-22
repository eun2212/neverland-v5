'use strict';
(function(){
 const duration=30;
 let ui=null,run=null;
 const motionReduced=()=>window.NEVERLAND_TOOLS?.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;

 function createModel({T,scene,cube,ball,cylinder,beam,curve,batch}){
  const site=window.NEVERLAND_LAYOUT.coaster;
  const fixed=new T.Group(),train=new T.Group();
  const outline=new T.Shape();
  for(const [i,[x,z]] of [[-30,59],[-32,65],[-32,89],[-26,93],[24,93],[29,88],[30,64],[23,57],[-17,57]].entries()){
   if(i===0)outline.moveTo(x,z);else outline.lineTo(x,z);
  }
  outline.closePath();
  const plaza=new T.Mesh(new T.ShapeGeometry(outline),new T.MeshStandardMaterial({
   color:0xc8ab80,roughness:.92,emissive:0x8b6c4b,emissiveIntensity:.14
  }));
  plaza.rotation.x=-Math.PI/2;plaza.position.y=.008;plaza.receiveShadow=true;fixed.add(plaza);
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
    ball(top.x,top.y+.24,top.z,.086,'bulb',fixed);
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
  function star(px,py,pz,r,floor){
   const shape=new T.Shape();
   for(let i=0;i<8;i++){
    const angle=Math.PI/2+i*Math.PI/4,length=i%2?r*.27:r;
    const sx=Math.cos(angle)*length,sy=Math.sin(angle)*length;
    if(i===0)shape.moveTo(sx,sy);else shape.lineTo(sx,sy);
   }
   shape.closePath();
   const mark=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshStandardMaterial({
    color:0xf3d28b,metalness:.24,roughness:.68,emissive:0xe2ad48,emissiveIntensity:floor?.09:.45
   }));
   mark.position.set(px,py,pz);
   if(floor)mark.rotation.x=-Math.PI/2;
   mark.receiveShadow=floor;
   fixed.add(mark);
  }
  star(x,5.17,z-1.4,.82,false);
  for(let i=-8;i<=8;i++)ball(x+i*.42,4.25,z-.65,.065,'bulb',fixed);
  for(const [px,pz,r] of [[-13,-65,2],[-22,-62,1.3],[-5,-61,1.45],[6,-64,2],[18,-63,1.2],[-22,-68,.9],[15,-69,1.05]]){
   star(px,.047,pz,r,true);
  }
  for(const offset of [-3.3,3.3])star(x+offset,3.65,z-.61,.28,false);
  // The passenger is part of the leading car, so it follows every climb and roll.
  // Face remains hidden behind the hair, as in the player's established design.
  let passengerMale=null,passengerFemale=null;
  function makePassenger(car,gender){
   const person=new T.Group();person.name='coaster-passenger-'+gender;car.add(person);
   cube(0,.33,.04,.50,.52,.28,'red',person); // red cardigan
   cube(0,.39,-.108,.19,.37,.035,'cream',person); // white shirt
   for(const side of [-1,1]){
    cube(side*.31,.35,-.01,.13,.43,.15,'red',person);
    ball(side*.31,.35,-.12,.075,'cream',person);
    cube(side*.14,.13,-.26,.20,.16,.48,'dark',person); // seated legs
   }
   ball(0,.99,.04,.205,'cream',person);
   ball(0,1.10,.08,.205,'dark',person);
   cube(0,.96,.20,.38,.27,.16,'dark',person);
   if(gender==='female') cube(0,.64,.21,.34,.42,.12,'dark',person);
   return person;
  }
  const cars=Array.from({length:3},(_,i)=>{
   const car=new T.Group();train.add(car);
   cube(0,.02,0,1.24,.24,1.45,i?'greenLight':'red',car);
   cube(0,.26,.34,1.15,.53,.17,'cream',car);
   for(const side of [-1,1]){
    cube(side*.55,.23,0,.1,.39,1.4,'gold',car);
    ball(side*.45,.3,-.72,.08,'bulb',car);
   }
   if(i===0){passengerMale=makePassenger(car,'male');passengerFemale=makePassenger(car,'female');}
   return car;
  });
  batch(fixed);cars.forEach(car=>batch(car,[passengerMale,passengerFemale].filter(Boolean)));
  const length=track.getLength();
  // A complete barrel roll, eased at both ends so the train leaves and returns upright.
  function roll(u){
   const p=Math.max(0,Math.min(1,(u-.25)/.24));
   return Math.PI*2*(p*p*(3-2*p));
  }
  const fireworks=new T.Group();fireworks.name='coaster-fireworks';scene.add(fireworks);
  const bursts=[.18,.43,.69].map((u,index)=>{
   const origin=track.getPointAt(u),direction=track.getTangentAt(u);
   origin.addScaledVector(direction,11);origin.y+=8;
   const group=new T.Group();group.position.copy(origin);fireworks.add(group);
   const sparks=Array.from({length:24},(_,i)=>{
    const spark=ball(0,0,0,.13,['bulb','redLight','gold'][index],group);
    const angle=i*Math.PI*2/24;
    return {spark,dx:Math.cos(angle),dy:Math.sin(angle),dz:Math.sin(i*2.4)*.35};
   });
   return {group,sparks,start:[.12,.37,.63][index]};
  });
  function place(progress){
   cars.forEach((car,i)=>{
    const u=(progress+1-i*1.65/length)%1;
    car.position.copy(track.getPointAt(u));
    car.lookAt(car.position.clone().sub(track.getTangentAt(u)));
    car.rotateZ(roll(u));
   });
  }
  place(0);
  return {update(camera,hidden){
   fixed.visible=train.visible=!hidden;
   const active=run;
   const selectedGender=active?.gender==='male'?'male':'female';
   passengerMale.visible=!!active&&selectedGender==='male';
   passengerFemale.visible=!!active&&selectedGender==='female';
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
   const effectsOn=!!active&&!hidden&&active.startedAt!==null&&!active.completed&&!motionReduced();
   fireworks.visible=effectsOn;
   if(effectsOn){
    const elapsed=(performance.now()-active.startedAt)/(duration*1000);
    bursts.forEach(({group,sparks,start})=>{
     const phase=(elapsed-start)/.16;
     group.visible=phase>=0&&phase<1;
     if(!group.visible)return;
     const radius=1+phase*5,scale=Math.max(.05,1-phase);
     sparks.forEach(({spark,dx,dy,dz},i)=>{
      spark.position.set(dx*radius,dy*radius-phase*phase*1.5,dz*radius);
      spark.scale.setScalar(.13*scale*(i%3===0?1.5:1));
     });
    });
   }
   if(!active||hidden)return;
   if(motionReduced()){
    camera.position.set(-9,9,-63);camera.lookAt(-8,5,-77);return;
   }
   const seat=track.getPointAt(progress),ahead=track.getPointAt((progress+.016)%1);
   const backward=track.getTangentAt(progress).normalize();
   camera.position.copy(seat).addScaledVector(backward,-3.1);camera.position.y+=2.35;
   ahead.y+=.88;camera.lookAt(ahead);
   camera.rotateZ(-roll(progress));
  }};
 }

 function buildUI(){
  const shell=document.createElement('section');
  shell.id='coaster-board';shell.hidden=true;shell.setAttribute('aria-labelledby','coaster-title');
  shell.innerHTML='<h2 id="coaster-title"></h2><p role="status"></p><button type="button" data-coaster-leave>공원으로 돌아가기</button>';
  document.body.append(shell);
  shell.querySelector('h2').textContent=window.NEVERLAND_LAYOUT.coaster.name;
  const status=shell.querySelector('[role=status]'),leave=shell.querySelector('[data-coaster-leave]');
  leave.onclick=()=>close(true);
  return {shell,status,leave,lever:null};
 }
 function close(returnToPark=false){
  if(!run)return;
  const {onReturn,completed}=run;run=null;
  ui.lever?.destroy();ui.lever=null;ui.leave.hidden=false;
  ui.shell.hidden=true;ui.shell.classList.remove('coaster-running','coaster-lever-open');
  document.body.classList.remove('coaster-active');
  if(returnToPark)onReturn(completed);
 }
 window.NEVERLAND_COASTER={
  createModel,
  get active(){return !!run;},
  open(onReturn){
   if(run)return;
   ui??=buildUI();
   run={onReturn,startedAt:null,completed:false,gender:window.neverland?.state?.gender==='male'?'male':'female'};
   ui.status.textContent='안전바를 아래로 당겨 출발하세요.';
   document.body.classList.add('coaster-active');
   ui.shell.hidden=false;ui.leave.hidden=true;ui.shell.classList.add('coaster-lever-open');
   ui.lever=window.NEVERLAND_COASTER_SAFETYBAR.mount(ui.shell,{
    gender:run.gender,
    onStart(){
     ui.lever?.destroy();ui.lever=null;if(!run)return;
     ui.leave.hidden=false;ui.shell.classList.remove('coaster-lever-open');
     run.startedAt=performance.now();ui.shell.classList.add('coaster-running');
     ui.status.textContent='열차가 출발합니다.';ui.leave.focus();
    },
    onCancel(){ui.lever=null;close(true);}
   });
  },
  close
 };
})();
