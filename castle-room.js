'use strict';
(function(){
 const room=document.createElement('section');
 room.id='castle-room';
 room.hidden=true;
 room.setAttribute('aria-labelledby','castle-room-title');
 room.innerHTML=`
  <header><h1 id="castle-room-title" tabindex="-1">달빛 성의 침실</h1><button type="button" data-room="leave">성 정문으로 나가기</button></header>
  <div class="castle-illustration">
   <div class="castle-bedroom">
    <div class="castle-moon-window" aria-hidden="true">☾</div>
    <div class="castle-bed" aria-hidden="true"></div>
    <div class="castle-desk" aria-hidden="true"></div>
    <button type="button" class="room-book" data-room="book"><span aria-hidden="true">📖</span>책</button>
    <button type="button" class="room-record" data-room="record"><span aria-hidden="true">◉</span>레코드 플레이어</button>
    <button type="button" class="room-photo" data-room="photo"><span aria-hidden="true">▣</span>사진</button>
    <button type="button" class="room-letter" data-room="letter"><span aria-hidden="true">✉</span>새 편지</button>
    <button type="button" class="room-window" data-room="window">창가에 앉기</button>
   </div>
   <div class="castle-window-view" hidden>
    <canvas width="960" height="450" role="img" aria-label="별빛 아래 천천히 도는 관람차와 불 켜진 회전목마"></canvas>
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
 function draw(now){
  const t=media.matches||window.NEVERLAND_TOOLS?.settings.reduced?0:(now-windowStart)/1000;
  const sky=ctx.createLinearGradient(0,0,0,450);
  sky.addColorStop(0,'#161631');sky.addColorStop(.76,'#706283');sky.addColorStop(1,'#f0a5a7');
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
  disk(746,85,34,'#ffdcad');disk(759,73,31,'#2a2545');
  for(let i=0;i<12;i++)disk(i*88,441,125+(i%4)*15,i%2?'#574e72':'#615677');
  ctx.fillStyle='#3d405f';ctx.fillRect(0,363,960,87);
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
  for(let i=0;i<7;i++){
   const a=i*.91+t*.67,x=671+Math.cos(a)*65,y=329+Math.sin(a)*15;
   ctx.strokeStyle='#f5cb9b';ctx.beginPath();ctx.moveTo(x,278);ctx.lineTo(x,y+12);ctx.stroke();
   ctx.fillStyle='#ebd2d6';ctx.fillRect(x-9,y,18,7);disk(x+8,y-3,5,'#ebd2d6');
  }
  ctx.fillStyle='#d98ca9';ctx.beginPath();ctx.moveTo(584,283);ctx.quadraticCurveTo(650,257,671,229);ctx.quadraticCurveTo(692,257,758,283);ctx.closePath();ctx.fill();
  for(let i=0;i<17;i++)disk(589+i*10,283,3,'#ffdf9d');
  for(let i=0;i<31;i++)disk(i*33,390+12*Math.sin(i*2.8),2.4,i%2?'#f3c093':'#d5acc7');
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
