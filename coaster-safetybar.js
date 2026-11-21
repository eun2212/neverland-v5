(function(){
'use strict';
// One gesture closes the coaster restraint; the surrounding ride owns launch.
window.NEVERLAND_COASTER_SAFETYBAR={
 mount(container,options={}){
  if(!container||typeof options.onStart!=='function') throw new TypeError('container and onStart required');
  const root=document.createElement('section'); root.className='coaster-safetybar';
  root.innerHTML='<h2>안전바 내리기</h2><p>안전바를 아래로 끝까지 당겨 주세요. 방향키 ↓도 사용할 수 있어요.</p><p class="safetybar__status" role="status" aria-live="polite"></p><div class="safetybar__scene"><div class="safetybar__rails" aria-hidden="true"></div><div class="safetybar__seat" aria-hidden="true"><span>✦</span></div><img class="safetybar__rider" alt="" aria-hidden="true"><button type="button" class="safetybar__handle" role="slider" aria-label="안전바" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span aria-hidden="true">✦　SAFE　✦</span></button><img class="safetybar__hands" src="assets/keeper-safetybar-long-arms.png?v=20261121" alt="" aria-hidden="true"></div><div class="safetybar__actions"><button type="button" class="safetybar__refuse">멈추고 싶어요</button><button type="button" class="safetybar__cancel">돌아가기</button></div>';
  const rider=root.querySelector('.safetybar__rider');
  rider.src=options.gender==='male'?'assets/coaster-rider-male-v2.png?v=20261121':'assets/coaster-rider-female-v2.png?v=20261121';
  container.append(root);
  const handle=root.querySelector('.safetybar__handle'),scene=root.querySelector('.safetybar__scene'),status=root.querySelector('.safetybar__status'),refuse=root.querySelector('.safetybar__refuse'),cancel=root.querySelector('.safetybar__cancel');
  let state='ready',value=0,furthest=0,pointer=null,startY=0,startValue=0,maxY=0,timer=null;
  function schedule(fn,ms){clearTimeout(timer);timer=setTimeout(fn,ms)}
  function paint(){root.style.setProperty('--bar-position',value+'%');root.style.setProperty('--bar-top',(12+value*.6)+'%');root.style.setProperty('--hands-top',(-31+value*.6)+'%');handle.setAttribute('aria-valuenow',String(Math.round(value)));handle.setAttribute('aria-valuetext',value===0?'열림, 위쪽':value===100?'잠김, 아래쪽':Math.round(value)+'% 내림')}
  function release(){if(pointer!==null){const id=pointer;pointer=null;if(handle.hasPointerCapture?.(id))handle.releasePointerCapture(id)}}
  function destroy(){if(state==='destroyed')return;state='destroyed';clearTimeout(timer);release();root.remove()}
  function finish(forced){if(state==='destroyed'||state==='done')return;state='done';clearTimeout(timer);release();value=100;paint();handle.disabled=true;refuse.disabled=true;cancel.disabled=true;status.textContent='안전바가 잠겼어요. 출발합니다.';options.onStart({forced})}
  function force(){if(state!=='ready')return;state='advising';clearTimeout(timer);release();handle.setAttribute('aria-disabled','true');refuse.disabled=true;status.textContent='키퍼: “걱정하지 마세요. 제가 꼭 잡아드릴게요.”';schedule(()=>{if(state!=='advising')return;state='forcing';root.classList.add('is-forcing');value=100;paint();schedule(()=>finish(true),2500)},2500)}
  function idle(){if(state!=='ready')return;status.textContent='키퍼: “천천히 내리면 돼요. 기다리고 있을게요.”';schedule(force,15000)}
  function activity(){if(state==='ready'){status.textContent='';schedule(idle,25000)}}
  function move(next){if(state!=='ready')return;if(next < -3||(furthest>1&&next<furthest-3)){force();return} value=Math.max(0,Math.min(100,next));furthest=Math.max(furthest,value);paint();activity();if(value>=100)finish(false)}
  function pointerValue(e){const rect=scene.getBoundingClientRect();return rect.height?startValue+(e.clientY-startY)/(rect.height*.60)*100:value}
  handle.addEventListener('pointerdown',e=>{if(state!=='ready'||pointer!==null||e.button!==0)return;pointer=e.pointerId;startY=maxY=e.clientY;startValue=value;handle.setPointerCapture(pointer);e.preventDefault();activity()});
  handle.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;const rect=scene.getBoundingClientRect();if(e.clientY<maxY-Math.max(3,rect.height*.018)){force();return}maxY=Math.max(maxY,e.clientY);move(pointerValue(e))});
  handle.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;move(pointerValue(e));release()});
  for(const event of ['pointercancel','lostpointercapture'])handle.addEventListener(event,e=>{if(e.pointerId===pointer)pointer=null});
  handle.addEventListener('keydown',e=>{let next;if(e.key==='ArrowDown'||e.key==='ArrowRight')next=value+10;else if(e.key==='ArrowUp'||e.key==='ArrowLeft')next=value-10;else if(e.key==='Home')next=0;else if(e.key==='End')next=100;else return;e.preventDefault();move(next)});
  refuse.addEventListener('click',force);cancel.addEventListener('click',()=>{if(state==='done'||state==='destroyed')return;destroy();options.onCancel?.()});
  root.addEventListener('keydown',e=>{if(e.key==='Escape'&&state!=='done'&&state!=='destroyed'){e.preventDefault();destroy();options.onCancel?.()}});
  paint();activity();if(options.focus!==false)handle.focus();return {element:root,destroy};
 }
};
})();
