'use strict';
(function(){
 const exitZ=-69.5, limit=25.5;
 let run=null,mazeTime=0,mazeField=null,guide=null;
 const catSpot={x:3,z:3};
 const reduced=()=>window.NEVERLAND_TOOLS?.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const ui=document.createElement('div');
 ui.id='final-chase-status';ui.hidden=true;ui.setAttribute('role','status');document.body.append(ui);
 let audio=null;
 function scream(){
  if(window.NEVERLAND_BGM?.state.muted)return;
  const gain=(window.NEVERLAND_TOOLS?.settings.volume??65)/100;
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context||!gain)return;
  audio??=new Context();audio.resume().catch(()=>{});
  const now=audio.currentTime,voice=audio.createOscillator(),envelope=audio.createGain();
  voice.type='triangle';
  voice.frequency.setValueAtTime(740,now);voice.frequency.exponentialRampToValueAtTime(210,now+.55);
  envelope.gain.setValueAtTime(.001,now);envelope.gain.linearRampToValueAtTime(.085*gain,now+.12);
  envelope.gain.exponentialRampToValueAtTime(.001,now+.56);
  voice.connect(envelope).connect(audio.destination);voice.start(now);voice.stop(now+.57);
 }
 function start(done,origin=world3d.state.player){
  run={done,origin,age:0,started:false,failed:false,monster:{x:0,z:10},last:null};
  close();explore3d('별이 빛나는 고정된 출구로 달리세요.');
  world3d.jumpToPark(0,0);
  document.body.classList.add('chase-active');
  ui.hidden=false;ui.textContent='W 또는 ↑로 전진 · 움직이면 제한 시간이 시작됩니다.';
 }
 function resetMaze(){mazeTime=0;guide=null;}
 function clear(){
  run=null;resetMaze();ui.hidden=true;document.body.classList.remove('chase-active');
 }
 function finish(){
  if(!run||run.failed)return;
  const {done,origin}=run;
  clear();world3d.jumpToPark(origin.x,origin.z);
  done();
 }
 function fail(reason){
  run.failed=true;ui.hidden=true;world3d.configure({paused:true});scream();
  modal('<h1>게임 오버</h1><p>'+reason+'</p><button id="chase-retry" type="button">추격 직전부터 다시</button>');
  const retry=$('chase-retry');
  retry.onclick=()=>{const {done,origin}=run;start(done,origin);};
  retry.focus?.();
 }
 function tick(player,dt){
  if(!run||run.failed)return;
  if(!run.last)run.last={x:0,z:0};
  if(!run.started&&Math.hypot(player.x-run.last.x,player.z-run.last.z)>.001){
   run.started=true;scream();
  }
  if(!run.started)return;
  run.age+=dt;
  if(player.z<=exitZ){finish();return;}
  const dx=player.x-run.monster.x,dz=player.z-run.monster.z,distance=Math.hypot(dx,dz);
  if(distance<1.15){fail('후드 괴물이 따라잡았습니다.');return;}
  if(run.age>=limit){fail('출구가 닫히기 전에 도착하지 못했습니다.');return;}
  const step=dt*(2.75+Math.min(.40,run.age*.016));
  run.monster.x+=dx/distance*step;run.monster.z+=dz/distance*step;
  ui.textContent='출구까지 '+Math.ceil(player.z-exitZ)+'m · '+Math.ceil(limit-run.age)+'초';
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
 function catDialogue(emergency=false){
  const text=emergency?'고양이가 비상정지 손잡이를 당깁니다. 기구가 움직이기 전에 잠겼습니다. 장치를 다시 맞추세요.':'푸른 눈의 렉돌이 다리에 몸을 비비고 별 모양 전구를 켭니다.';
  window.NEVERLAND_DIALOGUE?.record('고양이',text);
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
   story([['','후드를 쓴 형체가 길을 가로막는다. 키퍼는 열쇠를 꺾어 열린 출구를 고정한다.'],['키퍼','별빛이 보이는 쪽으로 가요. 문은 제가 붙잡고 있을게요.']],()=>start(()=>oldChoice(win,choice)));
   return;
  }
  return oldChoice(win,choice);
 };
 window.NEVERLAND_MASCOT={
  catSpot,clear,resetMaze,tick,mazeGuide,catDialogue,
  get active(){return !!run;},get chase(){return run;},get guide(){return guide;},
  valid(x,z){return Math.abs(x)<4.25&&z>=exitZ-1.4&&z<2;}
 };
})();
