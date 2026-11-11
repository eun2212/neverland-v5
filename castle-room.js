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
   </div>
   <div class="castle-window-view" hidden>
    <canvas width="960" height="450" role="img" aria-label="별빛 아래 움직이는 관람차, 회전목마, 롤러코스터"></canvas>
    <button type="button" data-room="back">침실로 돌아가기</button>
   </div>
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
  ctx.globalAlpha=1;
  function disk(x,y,r,color){
   ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }
  disk(746,85,34,'#ffdcad');disk(759,73,31,'#1b1738');
  for(let i=0;i<12;i++)disk(i*88,441,125+(i%4)*15,i%2?'#574e72':'#615677');
  ctx.fillStyle='#211c42';ctx.fillRect(0,363,960,87);
  drawCoaster(t);
  // Tents and the low park midway sit behind the moving attractions.
  for(const [x,y,w] of [[55,348,77],[144,359,78],[456,350,72],[527,359,49],[827,350,91],[908,366,53]]){
   ctx.fillStyle='#373064';ctx.fillRect(x-w/2,y,w,38);
   ctx.beginPath();ctx.moveTo(x-w*.58,y);ctx.quadraticCurveTo(x-11,y-13,x,y-41);
   ctx.quadraticCurveTo(x+11,y-13,x+w*.58,y);ctx.fillStyle='#9176c8';ctx.fill();
   ctx.fillStyle='#da9abc';ctx.fillRect(x,y-41,15,5);
   for(let j=-2;j<=2;j++)disk(x+j*w/6,y+9,2.2,'#f3c899');
  }
  ctx.lineWidth=5;ctx.strokeStyle='#e1b6a9';
  ctx.beginPath();ctx.moveTo(245,365);ctx.lineTo(312,222);ctx.lineTo(380,365);ctx.stroke();
  ctx.beginPath();ctx.arc(312,222,106,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6+t*.15,x=312+106*Math.cos(a),y=222+106*Math.sin(a);
   ctx.beginPath();ctx.moveTo(312,222);ctx.lineTo(x,y);ctx.lineWidth=2;ctx.stroke();
   ctx.fillStyle=i%2?'#eabbbe':'#a4d3c8';ctx.fillRect(x-10,y-5,20,13);
   disk(x,y-6,3,'#ffdf9d');
  }
  disk(312,222,12,'#f9cd9a');
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
  cancelAnimationFrame(frame);
  bedroom.hidden=outside;view.hidden=!outside;
  if(outside){
   windowStart=performance.now();draw(windowStart);
   message('창유리 너머로 관람차가 돌고, 희미한 음악이 밤공기를 타고 옵니다.');
   view.querySelector('button').focus();
  }else{
   message('따뜻한 이불과 오래된 나무 책상에 달빛이 내려앉습니다.');
   bedroom.querySelector('.room-window').focus();
  }
 }
 room.addEventListener('click',event=>{
  const action=event.target.closest('[data-room]')?.dataset.room;
  if(!action||!options)return;
  if(action==='leave'){options.leave();return;}
  if(action==='window'||action==='back'){look(action==='window');return;}
  if(action==='book'){
   message('책 사이에 이 밤의 엔딩들이 기록되어 있습니다.');
   const list=document.createElement('ol');
   for(const line of options.getRecords()){const item=document.createElement('li');item.textContent=line;list.append(item);}
   copy.append(list);
  }else if(action==='photo'){
   message('불 켜진 관람차 앞에서 누군가 손을 흔들고 있습니다.');
   button('앨범 열기',()=>window.NEVERLAND_TOOLS?.album());
  }else if(action==='record'){
   message('바늘이 천천히 홈을 따라갑니다. 레코드에서 잔잔한 음악이 흐릅니다.');
   button(window.NEVERLAND_BGM?.state.muted?'음악 켜기':'음악 끄기',()=>{document.getElementById('sound').click();room.querySelector('[data-room="record"]').click();copy.querySelector('button').focus();});
  }else{
   const letter='밤에 눈을 뜨면 정문으로 나오세요. 캡틴 훅 옆에서 기다릴게요. — 키퍼';
   message(letter);
   window.NEVERLAND_DIALOGUE?.record('창가의 편지',letter);
   button('대사 로그 열기',()=>window.NEVERLAND_DIALOGUE?.openLog());
  }
 });
 window.NEVERLAND_ROOM={
  get active(){return !!options;},
  get cue(){return view.hidden?'bedroom':'window';},
  open(next){
   options=next;room.hidden=false;bedroom.hidden=false;view.hidden=true;
   message(next.first?'달빛이 비치는 침대에서 눈을 떴습니다. 창밖에서 희미한 음악이 들려옵니다.':'따뜻한 이불과 오래된 나무 책상에 달빛이 내려앉습니다.');
   room.querySelector('h1').focus();
  },
  close(){cancelAnimationFrame(frame);room.hidden=true;options=null;}
 };
})();
