'use strict';
(function(){
 const room=document.createElement('section');
 room.id='castle-room';
 room.hidden=true;
 room.setAttribute('aria-labelledby','castle-room-title');
 room.innerHTML=`
  <header><h1 id="castle-room-title" tabindex="-1">달빛 성의 침실</h1></header>
  <div class="castle-illustration">
   <div class="castle-bedroom">
    <button type="button" class="room-door" data-room="leave" aria-label="성 정문으로 나가기"></button>
    <i class="room-starlight" aria-hidden="true"></i>
    <button type="button" class="room-window" data-room="window" aria-label="창가에 앉기"></button>
    <button type="button" class="room-letter" data-room="letter" aria-label="대사 로그"></button>
    <button type="button" class="room-book" data-room="book" aria-label="엔딩 기록"></button>
    <button type="button" class="room-record" data-room="record" aria-label="음악"></button>
    <button type="button" class="room-photo" data-room="photo" aria-label="앨범"></button>
    <span class="room-avatar" aria-hidden="true"><span class="room-sprite"></span></span>
    <span class="room-exit-art" aria-hidden="true"><span></span></span>
   </div>
   <div class="castle-window-view" hidden>
    <canvas width="960" height="450" role="img" aria-label="별빛 아래 움직이는 관람차, 회전목마, 롤러코스터, 자이로드롭"></canvas>
    <button type="button" data-room="back">침실로 돌아가기</button>
   </div>
  </div>
  <div class="room-controls" aria-label="침실 이동 및 상호작용">
   <div class="room-directions">
    <button type="button" data-direction="ArrowUp" aria-label="위로 이동">↑</button>
    <button type="button" data-direction="ArrowLeft" aria-label="왼쪽으로 이동">←</button>
    <button type="button" data-direction="ArrowDown" aria-label="아래로 이동">↓</button>
    <button type="button" data-direction="ArrowRight" aria-label="오른쪽으로 이동">→</button>
   </div>
   <button type="button" data-room-use disabled>상호작용 · E</button>
   <button type="button" data-room-skip hidden>기상 장면 건너뛰기</button>
  </div>
  <div class="castle-room-copy" aria-live="polite"></div>`;
 document.body.append(room);
 const bedroom=room.querySelector('.castle-bedroom');
 const view=room.querySelector('.castle-window-view');
 const canvas=view.querySelector('canvas');
 const ctx=canvas.getContext('2d');
 const copy=room.querySelector('.castle-room-copy');
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 let options=null,frame=0,windowStart=0;
 const movement=window.NEVERLAND_BEDROOM_MOVEMENT;
 const avatar=room.querySelector('.room-avatar');
 const sprite=avatar.querySelector('.room-sprite');
 const controls=room.querySelector('.room-controls');
 const use=room.querySelector('[data-room-use]');
 const skip=room.querySelector('[data-room-skip]');
 const hotspots=new Map([...bedroom.querySelectorAll('[data-room]')].map(el=>[el.dataset.room,el]));
 const keys=new Map(),touches=new Map();
 let pose={...movement.entrance},walkFrame=0,lastWalk=0,wakeAge=null,exit=null,walkAge=0,nearest=null;
 const reduced=()=>media.matches||window.NEVERLAND_TOOLS?.settings.reduced;
 const available=()=>options&&!bedroom.hidden&&!window.NEVERLAND_SAVES?.open&&
  !window.NEVERLAND_TOOLS?.open&&!window.NEVERLAND_DIALOGUE?.open;
 function clearMovement(){keys.clear();touches.clear();}
 function paintAvatar(moving=false){
  const wakePose=wakeAge===null?null:wakeAge<.8?'lying':wakeAge<1.48?'sitting':wakeAge<2.14?'feet':'standing';
  const wakePoint={lying:[.312,.65,4],sitting:[.432,.742,5],feet:[.453,.791,6],standing:[pose.x,pose.y,7]}[wakePose];
  avatar.style.left=(wakePoint?.[0]??pose.x)*100+'%';
  avatar.style.top=(wakePoint?.[1]??pose.y)*100+'%';
  avatar.dataset.pose=wakePose||pose.facing;
  const cell=wakePoint?.[2]??(moving&&!reduced()?Math.floor(walkAge/.125)%4:4);
  sprite.style.backgroundPositionX=(cell*100/7)+'%';
  const close=wakeAge===null&&!exit?movement.nearest(pose):null;
  if(close!==nearest||use.disabled!==!close){
   nearest=close;
   use.disabled=!close;
   use.textContent=close?hotspots.get(close).getAttribute('aria-label')+' · E':'가까이 가서 상호작용 · E';
   for(const [action,el] of hotspots)el.classList.toggle('room-nearby',action===close);
  }
 }
 function finishWake(){
  wakeAge=null;skip.hidden=true;
  message('방향키나 WASD로 움직이세요. 물건 가까이에서 E를 누르세요.');
  paintAvatar();
 }
 function step(now){
  const dt=lastWalk?Math.min(.05,(now-lastWalk)/1000):0;
  lastWalk=now;
  let dx=0,dy=0;
  if(exit){
   exit.age+=dt;
   if(reduced()||exit.age>=1.15){options.leave();return;}
   const approach=Math.min(1,exit.age/.42);
   if(exit.age<.69){
    pose.x=exit.x+(.112-exit.x)*approach;
    pose.y=exit.y+(.786-exit.y)*approach;
   }else{
    bedroom.classList.add('door-open');
    const pass=Math.min(1,(exit.age-.69)/.36);
    pose.x=.112-.026*pass;pose.y=.786-.048*pass;
    avatar.style.opacity=String(1-pass);
   }
   walkAge+=dt;
   paintAvatar(exit.age<.42||exit.age>.69);
   walkFrame=requestAnimationFrame(step);
   return;
  }
  if(available()){
   if(wakeAge!==null){
    wakeAge+=dt;
    if(reduced()||wakeAge>=2.65)finishWake();
   }else{
    for(const key of new Set([...keys.keys(),...touches.values()])){
     const [x,y,facing]=movement.directions[key];dx+=x;dy+=y;pose.facing=facing;
    }
    const beforeX=pose.x,beforeY=pose.y;
    movement.move(pose,Math.sign(dx),Math.sign(dy),dt);
    if(pose.x!==beforeX||pose.y!==beforeY)walkAge+=dt;else dx=dy=0;
   }
  }
  if(!available())clearMovement();
  paintAvatar(!!(dx||dy));
  walkFrame=requestAnimationFrame(step);
 }
 function startWalking(){
  cancelAnimationFrame(walkFrame);lastWalk=0;paintAvatar();
  walkFrame=requestAnimationFrame(step);
 }
 function keyName(event){return event.key.length===1?event.key.toLowerCase():event.key;}
 window.addEventListener('keydown',event=>{
  if(!available()||event.altKey||event.ctrlKey||event.metaKey)return;
  const key=keyName(event);
  if(!(key in movement.directions)&&key!=='e')return;
  event.preventDefault();event.stopImmediatePropagation();
  if(wakeAge!==null||exit)return;
  if(key==='e'){if(!event.repeat&&nearest)activate(nearest);return;}
  keys.set(key,true);
 },true);
 window.addEventListener('keyup',event=>keys.delete(keyName(event)),true);
 window.addEventListener('blur',clearMovement);
 for(const el of controls.querySelectorAll('[data-direction]')){
  el.addEventListener('pointerdown',event=>{
   if(!available()||wakeAge!==null||exit)return;
   event.preventDefault();el.setPointerCapture(event.pointerId);
   touches.set(event.pointerId,el.dataset.direction);
   const [dx,dy,facing]=movement.directions[el.dataset.direction];
   pose.facing=facing;movement.move(pose,dx,dy,.025);paintAvatar(true);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])
   el.addEventListener(type,event=>touches.delete(event.pointerId));
  el.addEventListener('click',event=>{
   if(event.detail!==0||!available()||wakeAge!==null||exit)return;
   const [dx,dy,facing]=movement.directions[el.dataset.direction];
   pose.facing=facing;movement.move(pose,dx,dy,.05);paintAvatar();
  });
 }
 use.onclick=()=>{if(available()&&nearest)activate(nearest);};
 skip.onclick=()=>{finishWake();room.querySelector('h1').focus();};

 function message(text){
  const p=document.createElement('p');
  p.textContent=text;
  copy.replaceChildren(p);
 }
 function button(label,action){
  const el=document.createElement('button');
  el.type='button';el.textContent=label;el.onclick=action;copy.append(el);
 }
 // Draw the wax marks once so the grain stays fixed as the rides move.
 const grain=document.createElement('canvas');
 grain.width=960;grain.height=450;
 const wax=grain.getContext('2d');
 let seed=173;
 function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 for(let i=0;i<19000;i++){
  const x=random()*960,y=random()*450,length=2+random()*13;
  wax.strokeStyle=i%3?'#a897ff18':'#08071c33';
  wax.lineWidth=.4+random()*1.4;
  wax.beginPath();wax.moveTo(x,y);wax.lineTo(x+length,y-length*.55);wax.stroke();
 }
 const coasterStart=423,coasterEnd=944;
 function coasterHeight(x){
  return 324-126*Math.exp(-(((x-528)/54)**2))-167*Math.exp(-(((x-813)/57)**2));
 }
 function drawCoaster(t){
  ctx.lineJoin='round';ctx.lineCap='round';
  ctx.strokeStyle='#604d88';ctx.lineWidth=3;
  for(let x=439;x<coasterEnd;x+=27){
   const y=coasterHeight(x)+7;
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,369);
   ctx.moveTo(x,366);ctx.lineTo(x+24,coasterHeight(x+24)+8);ctx.stroke();
  }
  for(const [offset,color] of [[7,'#9c73b1'],[0,'#d79ace']]){
   ctx.strokeStyle=color;ctx.lineWidth=3;
   ctx.beginPath();ctx.moveTo(coasterStart,coasterHeight(coasterStart)+offset);
   for(let x=coasterStart+3;x<=coasterEnd;x+=3)ctx.lineTo(x,coasterHeight(x)+offset);
   ctx.stroke();
  }
  ctx.strokeStyle='#bf8fbd';ctx.lineWidth=2;
  for(let x=coasterStart+6;x<coasterEnd;x+=10){
   const y=coasterHeight(x);
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+7);ctx.stroke();
  }
  const head=coasterStart+((t*43+390)%581);
  for(let i=4;i>=0;i--){
   const x=head-i*12;
   if(x<coasterStart||x>coasterEnd)continue;
   const slope=(coasterHeight(x+1)-coasterHeight(x-1))/2;
   ctx.save();ctx.translate(x,coasterHeight(x));ctx.rotate(Math.atan(slope));
   ctx.fillStyle=i===0?'#edabd1':'#a88ae2';ctx.fillRect(-5,-8,11,6);
   ctx.fillStyle='#ffe5a9';ctx.fillRect(i===0?3:-2,-7,3,2);
   ctx.restore();
  }
 }
 function drawDrop(t){
  const x=402,top=156,base=363;
  ctx.fillStyle='#4c3b73';ctx.fillRect(x-8,top,16,base-top);
  ctx.strokeStyle='#bb9bd8';ctx.lineWidth=2;
  ctx.strokeRect(x-8,top,16,base-top);
  for(let y=top+8;y<base-12;y+=14){
   ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x+8,y+11);ctx.stroke();
  }
  ctx.fillStyle='#e7afd8';ctx.fillRect(x-13,top-7,26,8);
  ctx.fillStyle='#fbe0a8';ctx.fillRect(x-2,top-13,4,5);
  const cycle=(t+3)%11;
  const lift=cycle<6?cycle/6:cycle<7.5?1:Math.max(0,1-((cycle-7.5)/1.7)**2);
  const y=base-26-lift*158;
  ctx.fillStyle='#a883cb';ctx.fillRect(x-22,y,44,10);
  ctx.fillStyle='#e8b3da';ctx.fillRect(x-21,y+7,42,4);
  for(let i=-2;i<=2;i++){
   ctx.fillStyle='#4b315e';ctx.fillRect(x+i*8-3,y-5,6,12);
   ctx.fillStyle='#ffdf9d';ctx.fillRect(x+i*8-2,y+7,4,3);
  }
 }
 function draw(now){
  const t=media.matches||window.NEVERLAND_TOOLS?.settings.reduced?0:(now-windowStart)/1000;
  const sky=ctx.createLinearGradient(0,0,0,450);
  sky.addColorStop(0,'#131027');sky.addColorStop(.76,'#282655');sky.addColorStop(1,'#785595');
  ctx.fillStyle=sky;ctx.fillRect(0,0,960,450);
  for(let i=0;i<73;i++){
   ctx.fillStyle=i%4?'#c9bddb':'#ffe4b6';
   ctx.globalAlpha=.55+.34*Math.cos(i+t*.8);
   ctx.fillRect((i*173)%960,(i*79)%235,i%5===0?3:2,2);
  }
  for(let i=0;i<19;i++){
   const x=26+i*49,y=24+(i*53)%124,r=i%5===0?9:3+i%3;
   ctx.globalAlpha=.73+.17*Math.sin(t*.85+i);
   ctx.fillStyle=['#ffe3ad','#efa7cc','#c4aae9','#b9decd'][i%4];
   ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.24,y-r*.21);
   ctx.lineTo(x+r*.8,y);ctx.lineTo(x+r*.22,y+r*.2);ctx.lineTo(x,y+r);
   ctx.lineTo(x-r*.23,y+r*.21);ctx.lineTo(x-r*.81,y);ctx.lineTo(x-r*.22,y-r*.2);
   ctx.closePath();ctx.fill();
  }
  ctx.globalAlpha=1;
  function disk(x,y,r,color){
   ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }
  disk(746,85,34,'#ffdcad');disk(759,73,31,'#1b1738');
  for(let i=0;i<12;i++)disk(i*88,441,125+(i%4)*15,i%2?'#574e72':'#615677');
  ctx.fillStyle='#211c42';ctx.fillRect(0,363,960,87);
  drawCoaster(t);drawDrop(t);
  // Tents and the low park midway sit behind the moving attractions.
  for(const [x,y,w] of [[55,348,77],[144,359,78],[456,350,72],[527,359,49],[827,350,91],[908,366,53]]){
   ctx.fillStyle='#373064';ctx.fillRect(x-w/2,y,w,38);
   ctx.beginPath();ctx.moveTo(x-w*.58,y);ctx.quadraticCurveTo(x-11,y-13,x,y-41);
   ctx.quadraticCurveTo(x+11,y-13,x+w*.58,y);ctx.fillStyle='#9176c8';ctx.fill();
   ctx.fillStyle='#da9abc';ctx.fillRect(x,y-41,15,5);
   for(let j=-2;j<=2;j++)disk(x+j*w/6,y+9,2.2,'#f3c899');
  }
  const wheelX=280,wheelY=222,radius=106;
  ctx.lineWidth=7;ctx.strokeStyle='#725687';
  ctx.beginPath();ctx.moveTo(wheelX-67,365);ctx.lineTo(wheelX,wheelY);
  ctx.lineTo(wheelX+68,365);ctx.stroke();
  ctx.lineWidth=2;ctx.strokeStyle='#d4a6c2';
  ctx.beginPath();ctx.moveTo(wheelX-67,365);ctx.lineTo(wheelX,wheelY);
  ctx.lineTo(wheelX+68,365);ctx.stroke();
  const spokes=Array.from({length:12},(_,i)=>{
   const angle=i*Math.PI/6+t*.15;
   return [wheelX+radius*Math.cos(angle),wheelY+radius*Math.sin(angle)];
  });
  ctx.lineWidth=2;ctx.strokeStyle='#b299df';ctx.beginPath();
  for(const [x,y] of spokes){ctx.moveTo(wheelX,wheelY);ctx.lineTo(x,y);}
  ctx.stroke();
  ctx.lineWidth=5;ctx.strokeStyle='#ecc5d5';
  ctx.beginPath();ctx.arc(wheelX,wheelY,radius,0,Math.PI*2);ctx.stroke();
  ctx.lineWidth=1;ctx.strokeStyle='#fbd99b';
  ctx.beginPath();ctx.arc(wheelX,wheelY,radius-3,0,Math.PI*2);ctx.stroke();
  for(const [i,[x,y]] of spokes.entries()){
   ctx.lineWidth=2;ctx.strokeStyle='#fbd99b';
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+9);ctx.stroke();
   ctx.fillStyle=i%2?'#f2a5e0':'#a8cdc6';
   ctx.beginPath();ctx.roundRect(x-9,y+8,18,13,4);ctx.fill();
   ctx.fillStyle='#4b386a';ctx.fillRect(x-5,y+11,10,4);
   disk(x,y,2.5,'#fbd99b');
  }
  disk(wheelX,wheelY,12,'#8766d2');disk(wheelX,wheelY,6,'#fbd99b');
  ctx.fillStyle='#473168';ctx.beginPath();ctx.ellipse(671,352,85,23,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#b881bf';ctx.lineWidth=5;ctx.stroke();
  const horses=Array.from({length:8},(_,i)=>({i,a:i*Math.PI/4+t*.5})).sort((a,b)=>Math.sin(a.a)-Math.sin(b.a));
  for(const {i,a} of horses){
   const x=671+Math.cos(a)*67,y=326+Math.sin(a)*15+Math.sin(a*2+i)*5;
   ctx.strokeStyle='#f5cb9b';ctx.beginPath();ctx.moveTo(x,278);ctx.lineTo(x,y+12);ctx.stroke();
   ctx.fillStyle=i%2?'#e9bfd2':'#b8a6eb';
   ctx.beginPath();ctx.moveTo(x-13,y);ctx.quadraticCurveTo(x-6,y-7,x+4,y-4);
   ctx.lineTo(x+8,y-14);ctx.lineTo(x+15,y-11);ctx.lineTo(x+17,y-5);
   ctx.lineTo(x+10,y-5);ctx.lineTo(x+6,y+6);ctx.lineTo(x-10,y+6);ctx.closePath();ctx.fill();
   ctx.fillRect(x-8,y+4,3,8);ctx.fillRect(x+3,y+4,3,8);
  }
  ctx.fillStyle='#d98ca9';ctx.beginPath();ctx.moveTo(584,283);ctx.quadraticCurveTo(650,257,671,229);ctx.quadraticCurveTo(692,257,758,283);ctx.closePath();ctx.fill();
  for(let i=0;i<17;i++){
   ctx.globalAlpha=.72+.28*Math.cos(i*.76-t*2);
   disk(589+i*10,283,3,'#ffdf9d');
  }
  ctx.globalAlpha=1;
  for(let i=0;i<31;i++)disk(i*33,390+12*Math.sin(i*2.8),2.4,i%2?'#f3c093':'#d5acc7');
  ctx.drawImage(grain,0,0);
  frame=requestAnimationFrame(draw);
 }
 function look(outside){
  cancelAnimationFrame(frame);cancelAnimationFrame(walkFrame);clearMovement();
  controls.hidden=outside;bedroom.hidden=outside;view.hidden=!outside;
  if(outside){
   windowStart=performance.now();draw(windowStart);
   message('창유리 너머로 관람차가 돌고, 희미한 음악이 밤공기를 타고 옵니다.');
   view.querySelector('button').focus();
  }else{
   message('따뜻한 이불과 오래된 나무 책상에 달빛이 내려앉습니다.');
   startWalking();bedroom.querySelector('.room-window').focus();
  }
 }
 function activate(action){
  if(!options)return;
  if(action==='back'){look(false);return;}
  if(!available()||wakeAge!==null||exit)return;
  if(!movement.nearby(pose,action)){
   message('물건 가까이로 이동한 뒤 E를 누르세요.');return;
  }
  clearMovement();
  if(action==='leave'){
   if(reduced()){options.leave();return;}
   exit={x:pose.x,y:pose.y,age:0};pose.facing='left';
   paintAvatar();return;
  }
  if(action==='window'){look(true);return;}
  if(action==='book'){
   message('책 사이에 이 밤의 엔딩들이 기록되어 있습니다.');
   const list=document.createElement('ol');
   for(const line of options.getRecords()){const item=document.createElement('li');item.textContent=line;list.append(item);}
   copy.append(list);
  }else if(action==='photo'){
   message('불 켜진 관람차 앞에서 누군가 손을 흔들고 있습니다.');
   window.NEVERLAND_TOOLS?.album();
  }else if(action==='record'){
   message('바늘이 천천히 홈을 따라갑니다. 레코드에서 잔잔한 음악이 흐릅니다.');
   button(window.NEVERLAND_BGM?.state.muted?'음악 켜기':'음악 끄기',()=>{document.getElementById('sound').click();activate('record');copy.querySelector('button').focus();});
  }else{
   const letter='밤에 눈을 뜨면 정문으로 나오세요. 캡틴 훅 옆에서 기다릴게요. — 키퍼';
   message(letter);
   window.NEVERLAND_DIALOGUE?.record('창가의 편지',letter);
   window.NEVERLAND_DIALOGUE?.openLog();
  }
 }
 room.addEventListener('click',event=>{
  const action=event.target.closest('[data-room]')?.dataset.room;
  if(action)activate(action);
 });
 window.NEVERLAND_ROOM={
  get active(){return !!options;},
  get cue(){return view.hidden?'bedroom':'window';},
  get transitioning(){return wakeAge!==null||!!exit;},
  get checkpoint(){return options?{first:options.first,windowView:!view.hidden,pose:{...pose}}:null;},
  open(next){
   options=next;room.hidden=false;bedroom.hidden=false;view.hidden=true;controls.hidden=false;
   const saved=next.roomSave?.pose;
   pose={...(movement.valid(saved)?saved:movement.bedside)};
   exit=null;walkAge=0;avatar.style.opacity='';bedroom.classList.remove('door-open');
   wakeAge=!next.roomSave&&!reduced()?0:null;
   skip.hidden=wakeAge===null;
   avatar.dataset.gender=next.gender;
   sprite.style.backgroundImage=next.gender==='male'?'url(assets/bedroom-walk-male.png)':'url(assets/bedroom-walk-female.png)';
   message(next.first?'달빛이 비치는 침대에서 눈을 떴습니다. 창밖에서 희미한 음악이 들려옵니다.':'따뜻한 이불과 오래된 나무 책상에 달빛이 내려앉습니다.');
   if(next.windowView)look(true);else{startWalking();room.querySelector('h1').focus();}
  },
  close(){cancelAnimationFrame(frame);cancelAnimationFrame(walkFrame);clearMovement();room.hidden=true;options=null;wakeAge=null;exit=null;}
 };
})();
