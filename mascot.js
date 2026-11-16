'use strict';
(function(){
 const maze=window.NEVERLAND_CHASE_MAZE,limit=64;
 const center=({row,col})=>maze.point(row,col);
 const startPoint=center(maze.start),exitPoint=center(maze.exit),spawnPoint=center(maze.spawn);
 function turnHint(player,target){
  const angle=Math.atan2(player.x-target.x,player.z-target.z)-player.yaw;
  const turn=Math.atan2(Math.sin(angle),Math.cos(angle));
  return Math.abs(turn)<.48?'↑':Math.abs(turn)>2.5?'↶':turn>0?'←':'→';
 }
 let run=null,mazeTime=0,mazeField=null,guide=null,reveal=null;
 const catSpot={x:3,z:3};
 const reduced=()=>window.NEVERLAND_TOOLS?.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const ui=document.createElement('div');
 ui.id='final-chase-status';ui.hidden=true;ui.setAttribute('role','status');document.body.append(ui);
 let audio=null,bus=null,scareTimer=null;
 const voices=new Set();
 function volume(){return window.NEVERLAND_BGM?.state.muted?0:(window.NEVERLAND_TOOLS?.settings.volume??65)/100;}
 function stopSound(){
  for(const voice of voices)voice.stop();
  voices.clear();
 }
 function tone(type,from,to,duration,peak,delay=0){
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context||!volume())return;
  if(!audio){
   audio=new Context();bus=audio.createGain();bus.connect(audio.destination);
  }
  if(audio.state==='suspended')audio.resume().catch(()=>{});
  bus.gain.value=volume();
  const now=audio.currentTime+delay,voice=audio.createOscillator(),envelope=audio.createGain();
  voice.type=type;voice.frequency.setValueAtTime(from,now);
  voice.frequency.exponentialRampToValueAtTime(to,now+duration);
  envelope.gain.setValueAtTime(.001,now);
  envelope.gain.linearRampToValueAtTime(peak,now+.045);
  envelope.gain.exponentialRampToValueAtTime(.001,now+duration);
  voice.connect(envelope).connect(bus);voices.add(voice);
  voice.onended=()=>{voices.delete(voice);voice.disconnect();envelope.disconnect();};
  voice.start(now);voice.stop(now+duration+.01);
 }
 function updateSound(){
  if(bus)bus.gain.value=volume();
  if(document.hidden||!volume()||(world3d.state.config.paused&&!run?.scare))stopSound();
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSound();});
 function scream(peak){
  tone('sawtooth',260,98,.50,peak*.43);
  tone('triangle',510,185,.62,peak,.025);
  tone('triangle',687,236,.48,peak*.57,.04);
 }
 function approachSound(distance,dt){
  run.soundDelay-=dt;
  if(run.soundDelay>0||distance>20)return;
  const near=1-Math.min(1,distance/20);
  run.soundDelay=1.4-near*.98;
  tone('triangle',65+near*30,29,.24,.026+near*.10);
  tone('sawtooth',116,62,.16,.013+near*.024,.14);
 }
 const touchKeys=new Map(), controls=document.createElement('div');
 controls.id='chase-touch-controls';
 controls.setAttribute('role','group');
 controls.setAttribute('aria-label','미로 이동');
 for(const [key,label] of [['arrowleft','왼쪽 보기'],['w','전진'],['arrowright','오른쪽 보기'],['a','왼쪽 이동'],['s','후진'],['d','오른쪽 이동'],['shift','달리기']]){
  const button=document.createElement('button');
  button.type='button';button.textContent=label;
  button.addEventListener('pointerdown',event=>{
   if(!run||run.failed||event.pointerType==='mouse')return;
   event.preventDefault();
   button.setPointerCapture(event.pointerId);
   touchKeys.set(event.pointerId,key);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']){
   button.addEventListener(type,event=>touchKeys.delete(event.pointerId));
  }
  controls.append(button);
 }
 document.body.append(controls);
 window.addEventListener('blur',()=>touchKeys.clear());
 function start(done,origin=world3d.state.player){
  clear();
  run={done,origin,age:0,started:false,failed:false,monster:{...spawnPoint},soundDelay:.5,waypoint:null,targetKey:null,field:null};
  close();explore3d('바닥의 별빛을 따라 출구로 달리세요. WASD 이동 · Shift 달리기 · 터치에서는 이동과 달리기를 함께 누르세요.');
  world3d.jumpToPark(startPoint.x,startPoint.z,Math.PI);
  document.body.classList.add('chase-active');
  ui.hidden=false;ui.textContent='네버랜드가 앞에 있습니다. 뒤를 돌아 별빛을 따라가세요.';
  scream(.065);
 }
 function resetMaze(){mazeTime=0;guide=null;}
 function clear(){
  clearTimeout(scareTimer);scareTimer=null;stopSound();
  touchKeys.clear();run=null;reveal=null;resetMaze();ui.hidden=true;document.body.classList.remove('chase-active');
 }
 function finish(){
  if(!run||run.failed)return;
  const {done,origin}=run;
  clear();world3d.jumpToPark(origin.x,origin.z);
  done();
 }
 function gameOver(reason){
  scareTimer=null;run.scare=false;stopSound();
  modal('<h1>게임 오버</h1><p>'+reason+'</p><button id="chase-retry" type="button">추격 직전부터 다시</button>');
  const retry=$('chase-retry');
  retry.onclick=()=>{const {done,origin}=run;start(done,origin);};
  retry.focus?.();
 }
 function fail(reason,caught=false){
  run.failed=true;touchKeys.clear();document.body.classList.remove('chase-active');ui.hidden=true;world3d.configure({paused:true});
  document.exitPointerLock?.();stopSound();
  if(!caught){gameOver(reason);return;}
  run.scare=true;scream(.16);
  scareTimer=setTimeout(()=>gameOver(reason),reduced()?750:900);
 }
 function pursue(player,dt,moving){
  const targetCell=maze.cell(player.x,player.z),targetKey=maze.key(targetCell);
  if(run.targetKey!==targetKey){
   run.field=maze.field(targetCell);
   run.targetKey=targetKey;
  }
  const monster=run.monster,cell=maze.cell(monster.x,monster.z);
  if(!run.waypoint){
   const from=center(cell);
   if(Math.hypot(monster.x-from.x,monster.z-from.z)>.001&&maze.key(cell)!==targetKey){
    run.waypoint=from;
   }else{
    const next=run.field.next(cell);
    if(next)run.waypoint=center(next);
   }
  }
  const target=run.waypoint||player;
  const dx=target.x-monster.x,dz=target.z-monster.z,distance=Math.hypot(dx,dz);
  const step=Math.min(distance,dt*(moving?4.6:0.9));
  if(distance){
   monster.x+=dx/distance*step;
   monster.z+=dz/distance*step;
  }
  if(distance<=step)run.waypoint=null;
 }
 function tick(player,dt,moving){
  if(!run||run.failed||!dt)return;
  if(moving)run.started=true;
  if(run.started)run.age+=dt;
  const cell=maze.cell(player.x,player.z);
  if(Math.hypot(player.x-exitPoint.x,player.z-exitPoint.z)<1.35){finish();return;}
  pursue(player,dt,moving);
  if(maze.key(cell)===maze.key(maze.cell(run.monster.x,run.monster.z))&&Math.hypot(player.x-run.monster.x,player.z-run.monster.z)<1.05){
   fail('네버랜드가 당신을 따라잡았습니다.',true);return;
  }
  if(run.age>=limit){fail('출구가 닫히기 전에 도착하지 못했습니다.');return;}
  const path=run.field.distance.get(maze.key(maze.cell(run.monster.x,run.monster.z)));
  const distance=Math.hypot(player.x-run.monster.x,player.z-run.monster.z);
  approachSound(Math.max(distance,(path??Infinity)*maze.size-maze.size),dt);
  const next=maze.toExit.next(cell);
  const hint='키퍼의 별빛 '+turnHint(player,next?center(next):exitPoint);
  const status=hint+' · '+(run.started?Math.ceil(limit-run.age)+'초':'이동하면 제한 시간이 시작됩니다.');
  if(ui.textContent!==status)ui.textContent=status;
 }
 function mazeGuide(player,interior,dt,valid){
  if(interior?.ride!==3){resetMaze();return;}
  mazeTime+=dt;
  if(mazeTime<30)return;
  const finish=window.NEVERLAND_INTERIORS[3].finish;
  const key=(x,z)=>x+','+z;
  const offsets=[[.5,0],[-.5,0],[0,.5],[0,-.5]];
  if(!mazeField){
   mazeField=new Map([[key(...finish),0]]);
   const queue=[finish];
   for(let i=0;i<queue.length;i++){
    const [x,z]=queue[i],depth=mazeField.get(key(x,z));
    for(const [dx,dz] of offsets){
     const nx=x+dx,nz=z+dz,id=key(nx,nz);
     if(!mazeField.has(id)&&valid(nx,nz)){mazeField.set(id,depth+1);queue.push([nx,nz]);}
    }
   }
  }
  let best=null,score=Infinity;
  const sx=Math.round(player.x*2)/2,sz=Math.round(player.z*2)/2;
  for(let x=sx-1;x<=sx+1;x+=.5)for(let z=sz-1;z<=sz+1;z+=.5){
   const d=Math.hypot(x-player.x,z-player.z),depth=mazeField.get(key(x,z));
   if(depth===undefined||d<.42||d>1.25||![.25,.5,.75,1].every(t=>valid(player.x+(x-player.x)*t,player.z+(z-player.z)*t)))continue;
   const rank=depth+d*.15;
   if(rank<score){score=rank;best={x,z};}
  }
  guide=best||{x:finish[0],z:finish[1]};
  const dx=guide.x-player.x,dz=guide.z-player.z;
  const angle=Math.atan2(-dx,-dz)-player.yaw,turn=Math.atan2(Math.sin(angle),Math.cos(angle));
  world3d.showGuide(Math.hypot(player.x-finish[0],player.z-finish[1])<1.7?'고양이가 흰 출구를 찾았습니다. E로 나가세요.':'고양이를 따라가세요 '+(Math.abs(turn)<.5?'↑':turn>0?'←':'→'));
 }
 function rideSpot(ride){
  const [x,z]=window.NEVERLAND_INTERIORS[ride].spawn;
  return {x:x+2,z};
 }
 const encounters={
  ride:'고양이가 안전바 아래에서 가르랑거립니다. 그 박자에 맞춰 멈춰 있던 기구의 전구가 하나씩 켜집니다.',
  game:'고양이가 앞발을 들어 안아 달라는 듯 올려다봅니다. 품에 들자, 뒤쪽 점수판에 손님 한 명이 잠깐 더해집니다.',
  drinks:'고양이가 발목에 몸을 비빕니다. 소다 거품 속 관람차 그림자가 고양이 꼬리가 흔들리는 쪽으로 함께 움직입니다.'
 };
 function encounter(place){
  const text=encounters[place];
  window.NEVERLAND_DIALOGUE?.record('고양이',text);
  return text;
 }
 function catDialogue(emergency=false,place=null){
  const text=place?encounter(place):emergency?'고양이가 비상정지 손잡이를 당깁니다. 기구가 움직이기 전에 잠겼습니다. 장치를 다시 맞추세요.':'푸른 눈의 렉돌이 다리에 몸을 비비고 별 모양 전구를 켭니다.';
  if(!place)window.NEVERLAND_DIALOGUE?.record('고양이',text);
  modal('<h1>별빛 고양이</h1><img class="mascot-portrait" src="assets/mascot-cat.png" alt="작은 모자와 금빛 장식을 한 렉돌"><p>'+text+'</p><button type="button" id="mascot-return">돌아가기</button>');
  $('mascot-return').onclick=()=>explore3d();
  $('mascot-return').focus?.();
 }
 const oldHelp=offerHelp;
 offerHelp=function(...args){
  const {interior,reality}=world3d.state;
  if(reality.unlocked&&interior&&interior.ride!==3&&puzzle?.failed&&!s.catStopUsed){
   s.catStopUsed=true;log('cat-emergency-stop');
   puzzle=null;explore3d();catDialogue(true);return;
  }
  return oldHelp(...args);
 };
 const oldChoice=finishChoice;
 finishChoice=function(win,choice){
  const id=chooseEnding(win,choice);
  if(win&&(choice==='alone'||choice==='together')&&(id===2||id===5)){
   const origin=world3d.state.player;
   reveal={};
   story([
    ['','렉돌이 발치에 몸을 비빈다. 목에 달린 별이 꺼지자, 고양이의 등이 솟구치고 앞발이 바닥을 긁는다. 푸른 눈이 금빛으로 변한다.'],
    ['네버랜드','내가 네버랜드야. 손님 발길이 끊긴 뒤로, 네가 처음이었어. 네가 나가면 또 아무도 없잖아.'],
    ['키퍼','저도 손님이었어요. 나가려던 날, 이곳이 문을 삼켰죠. 그 뒤로 계속 여기 갇혀 있었어요.'],
    ['','고양이가 있던 자리에서 거대한 형체가 일어선다. 난간이 솟아 길을 여러 갈래로 가른다. 키퍼가 열쇠를 꺾어 열린 문틈에 끼운다.'],
    ['키퍼','제가 남긴 별을 따라가요. 문이 닫히기 전에 건너요!']
   ],()=>start(()=>oldChoice(win,choice),origin));
   return;
  }
  return oldChoice(win,choice);
 };
 window.NEVERLAND_MASCOT={
  catSpot,rideSpot,clear,resetMaze,tick,updateSound,mazeGuide,catDialogue,encounter,
  get reveal(){return reveal;},
  get active(){return !!run;},get chase(){return run;},get guide(){return guide;},
  touchKey:key=>Array.from(touchKeys.values()).includes(key),
  valid:maze.valid
 };
})();
