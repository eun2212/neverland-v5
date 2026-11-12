'use strict';
(function(){
 let active=null,dialog,body,status,title;
 const reduced=()=>window.NEVERLAND_TOOLS?.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
 function button(label,onClick){
  const element=document.createElement('button');
  element.type='button';element.textContent=label;element.onclick=onClick;return element;
 }
 function message(text){status.textContent=text;}
 function finish(text,game){
  if(active.frame)cancelAnimationFrame(active.frame);
  body.replaceChildren(button('다시 하기',()=>start(game)));message(text);
  body.firstElementChild.focus();
 }
 function rings(game){
  let shot=0,score=0;
  const targets=[{peg:'가운데',range:'중간'},{peg:'왼쪽',range:'가까움'},{peg:'오른쪽',range:'멀리'}];
  function round(){
   const target=targets[shot];
   const group=document.createElement('select');group.setAttribute('aria-label','던지는 세기');
   for(const range of ['가까움','중간','멀리']){
    const option=document.createElement('option');option.value=option.textContent=range;group.append(option);
   }
   const throws=['왼쪽','가운데','오른쪽'].map(label=>button('◎ '+label,()=>{
    if(label===target.peg&&group.value===target.range)score++;
    shot++;
    if(shot===targets.length)finish('성공 '+score+' / '+targets.length+' · 라운드 완료',game);
    else round();
   }));
   body.replaceChildren(group,...throws);
   message('목표: '+target.peg+' · '+target.range+' · '+(shot+1)+' / 3회');
   group.focus();
  }
  round();
 }
 function stars(game){
  let hits=0,mistakes=0;
  const route=[2,4,0,5,1];
  const cells=Array.from({length:6},(_,i)=>button('',()=>{
   if(i!==route[hits]){
    mistakes++;
    message('다른 칸이에요. 빛나는 별을 맞히세요. 빗나감 '+mistakes);
    return;
   }
   hits++;
   if(hits===route.length)finish('별 다섯 개 명중 · 빗나감 '+mistakes,game);
   else paint();
  }));
  function paint(){
   cells.forEach((cell,i)=>{const target=i===route[hits];cell.textContent=target?'✦':'·';cell.setAttribute('aria-label',(i+1)+'번 칸'+(target?' · 빛나는 별':''));});
   message('빛나는 별을 맞히세요. 명중 '+hits+' / 5');
  }
  body.replaceChildren(...cells);paint();cells[0].focus();
 }
 function pairs(game){
  let first=-1,second=-1,matched=0;
  const cards=['☾','✦','♡','✦','☾','♡'];
  function hidePair(){
   for(const i of [first,second]){buttons[i].textContent='?';buttons[i].setAttribute('aria-label',(i+1)+'번 뒤집힌 카드');}
   first=second=-1;cover.hidden=true;buttons.find(cell=>!cell.disabled)?.focus();
  }
  const buttons=cards.map((symbol,i)=>{
   const cell=button('?',()=>{
    if(first===i||second!==-1)return;
    cell.textContent=symbol;cell.setAttribute('aria-label',(i+1)+'번 카드 '+symbol);
    if(first===-1){first=i;return;}
    second=i;
    if(cards[first]===symbol){
     buttons[first].disabled=cell.disabled=true;
     first=second=-1;matched++;
     if(matched===3)finish('세 쌍을 모두 찾았습니다.',game);
     else{message('일치! '+matched+' / 3');buttons.find(item=>!item.disabled).focus();}
    }else{message('서로 다른 카드입니다. 다시 뒤집어 보세요.');cover.hidden=false;cover.focus();}
   });
   cell.setAttribute('aria-label',(i+1)+'번 뒤집힌 카드');return cell;
  });
  const cover=button('카드 덮기',hidePair);cover.hidden=true;
  body.replaceChildren(...buttons,cover);message('카드를 두 장씩 뒤집어 같은 그림 세 쌍을 찾으세요.');buttons[0].focus();
 }
 function timing(game){
  let tries=0,score=0,position=0,startTime=performance.now(),tick=0;
  const meter=document.createElement('progress');meter.max=100;meter.value=0;meter.setAttribute('aria-label','박자 위치');
  const advance=button('박자 한 칸 이동',()=>{tick=(tick+1)%11;position=tick*10;meter.value=position;message('현재 '+position+' · 목표 40~60');});
  const hit=button('지금!',()=>{
   if(position>=40&&position<=60)score++;
   tries++;tick=position=0;startTime=performance.now();
   if(tries===3){finish('박자 성공 '+score+' / 3',game);return;}
   message('가운데 40~60에서 누르세요. '+tries+' / 3회 · 성공 '+score);
  });
  function frame(now){
   const still=reduced();
   advance.hidden=!still;
   if(!still){const phase=((now-startTime)%2000)/1000;position=(phase>1?2-phase:phase)*100;}
   meter.value=position;
   active.frame=requestAnimationFrame(frame);
  }
  body.replaceChildren(meter,hit,advance);
  message('가운데 40~60에서 누르세요. 동작 줄이기에서는 한 칸씩 이동할 수 있습니다.');
  active.frame=requestAnimationFrame(frame);hit.focus();
 }
 function start(game){
  if(active.frame)cancelAnimationFrame(active.frame);
  active.frame=0;
  ({rings,stars,pairs,timing})[game](game);
 }
 function build(){
  dialog=document.createElement('dialog');dialog.id='booth-game';dialog.setAttribute('aria-labelledby','booth-game-title');
  dialog.innerHTML='<h2 id="booth-game-title"></h2><p role="status"></p><div class="booth-game-body"></div><button type="button" data-booth-cat>고양이 안아 주기</button><p data-cat-response role="status"></p><button type="button" data-booth-close>공원으로 돌아가기</button>';
  document.body.append(dialog);
  title=dialog.querySelector('h2');status=dialog.querySelector('[role=status]');body=dialog.querySelector('.booth-game-body');
  const cat=dialog.querySelector('[data-booth-cat]'),response=dialog.querySelector('[data-cat-response]');
  cat.onclick=()=>{response.textContent=window.NEVERLAND_MASCOT?.encounter('game')||'';};
  dialog.querySelector('[data-booth-close]').onclick=()=>close(true);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close(true);});
 }
 function close(returnToPark=false){
  if(!active)return;
  const {frame,onReturn}=active;active=null;
  if(frame)cancelAnimationFrame(frame);
  dialog.close();
  if(returnToPark)onReturn();
 }
 window.NEVERLAND_BOOTH_GAMES={
  get active(){return !!active;},
  open(id,onReturn){
   const booth=window.NEVERLAND_LAYOUT.games.find(item=>item.id===id);
   if(active||!booth)return;
   if(!dialog)build();
   active={onReturn,frame:0};
   dialog.querySelector('[data-booth-cat]').hidden=!window.NEVERLAND_MASCOT;
   dialog.querySelector('[data-cat-response]').textContent='';
   title.textContent=booth.name;dialog.showModal();start(id);
  },
  close
 };
})();
