'use strict';
(function(){
 const version=1,key='neverland-manual-save-';
 const storySets=['visited','cleared','topics','clues','replyScores','eventChecks'];
 const storyNumbers=['K','M','N','I','ride','talks','escapeBonus','diceWins','wins','help','exitRide','survivedRides'];
 const storyFlags=['keeperIntroduced','exit','dollKeeperAsked'];
 const keeperSets=['incidents','responses','evidence'];
 const keeperNumbers=['boundaries','suspicion','trust'];
 const keeperFlags=['orientation','ready','confessed'];
 const poseKeys=['x','z','yaw','pitch','eye'];
 const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
 const integer=value=>Number.isSafeInteger(value);
 const ride=value=>integer(value)&&value>=0&&value<5;
 const scalar=value=>typeof value==='string'||integer(value);
 const arrayOf=(value,test)=>Array.isArray(value)&&value.every(test);
 const hasFields=(value,keys,test)=>keys.every(key=>test(value[key]));
 const pick=(value,keys)=>Object.fromEntries(keys.map(key=>[key,value[key]]));
 function encode(value,sets){
  return {...value,...Object.fromEntries(sets.map(key=>[key,[...value[key]]]))};
 }
 function decode(value,fields,sets){
  return {...pick(value,fields),...Object.fromEntries(sets.map(key=>[key,new Set(value[key])]))};
 }
 function reason(){
  if(window.NEVERLAND_MASCOT?.active)return '마지막 추격 중에는 저장할 수 없습니다.';
  const world=world3d.state;
  if(window.NEVERLAND_BOOTH_GAMES?.active)return '미니게임을 마치고 공원으로 돌아오면 저장할 수 있습니다.';
  if(window.NEVERLAND_COASTER?.active)return '롤러코스터에서 공원으로 돌아오면 저장할 수 있습니다.';
  if(window.carnivalScene?.castleEntering||window.NEVERLAND_ROOM?.transitioning)return '침실 장면이 끝나면 저장할 수 있습니다.';
  if(window.NEVERLAND_TOOLS?.testing)return '제작 테스트 중에는 저장할 수 없습니다.';
  if(forcedRide3d!==null||pendingRideResult||world.interior||world.passage)
   return '탑승과 장막 장면이 끝나고 공원으로 돌아오면 저장할 수 있습니다.';
  if(world.config.epilogue||confronting3d||s.phase==='ending'||s.phase==='graveyard')
   return '엔딩과 출구 장면에서는 저장할 수 없습니다.';
  if($('overlay').children.length||queue.length||after||keeperStoryState.orientation)
   return '대화나 선택을 마치고 공원 또는 침실로 돌아오면 저장할 수 있습니다.';
  if(!window.NEVERLAND_ROOM?.active&&
     (s.phase!=='main'||!$('stage').classList.contains('walking')||window.carnivalScene?.overview))
   return '공원에서 걷거나 침실에 있을 때 저장할 수 있습니다.';
  return '';
 }
 function capture(){
  const world=world3d.state;
  return {
   version,time:Date.now(),parkRevision:7,
   story:encode({
    dollMemories:{},dollKeeperAsked:false,
    ...s
   },storySets),
   keeper:encode(keeperStoryState,keeperSets),
   player:pick(world.player,poseKeys),
   progress:{free:free3d,intro:intro3d,firstLever:firstLever3d,target:target3d,zone:world.zone,fractureUnlocked:world.reality.unlocked},
   room:window.NEVERLAND_ROOM?.checkpoint??null,
   log:window.NEVERLAND_DIALOGUE.history.slice(-500)
  };
 }
 function parkedPose(save){
  const {player,story,progress}=save;
  const config={free:progress.free,exit:story.exit,exitRide:story.exitRide};
  if((save.parkRevision??1)<3){
   const blockedByShip=Math.abs(player.x)<6.25&&Math.abs(player.z-24)<3.2;
   if(progress.intro||progress.firstLever||blockedByShip){
    const [x,z]=window.NEVERLAND_LAYOUT.rides[0].control;
    return {x,z:z-3.7,yaw:Math.PI,pitch:0,eye:1.65};
   }
  }
  if((save.parkRevision??1)<7&&progress.free){
   for(const shop of window.NEVERLAND_LAYOUT.shops){
    const revision=save.parkRevision??1;
    const oldDoor=revision<5?[Math.sign(shop.x)*63,-20.4]:[Math.sign(shop.x)*(revision===5?26:20),-61.4];
    if(save.room?.shop===shop.id||Math.hypot(player.x-oldDoor[0],player.z-oldDoor[1])<2.7){
     return {...player,...window.NEVERLAND_LAYOUT.boothExit(shop)};
    }
   }
  }
  if(world3d.canRestorePark(player.x,player.z,config))return player;
  if((save.parkRevision??1)<7&&progress.free){
   const layout=window.NEVERLAND_LAYOUT;
   const shop=[...layout.shops,...layout.games].find(shop=>Math.abs(player.x-shop.x)<2.2&&Math.abs(player.z-shop.z)<3);
   if(shop)return {...player,...layout.boothExit(shop)};
  }
  const coaster=window.NEVERLAND_LAYOUT.coaster;
  const [left,right,back,front]=coaster.bounds;
  if((save.parkRevision??1)<4&&progress.free&&player.x>left-.2&&player.x<right+.2&&player.z>back-.2&&player.z<front+.2)
   return {...player,x:coaster.door[0],z:coaster.door[1]};
  return null;
 }
 function validate(save){
  if(!object(save)||save.version!==version||!integer(save.time)||!Number.isFinite(new Date(save.time).getTime()))return false;
  const {story,keeper,player,progress,room,log}=save;
  if(![story,keeper,player,progress].every(object))return false;
  if(typeof story.name!=='string'||!story.name.trim()||story.name.length>20||
     !['female','male'].includes(story.gender)||!['confident','moderate','timid'].includes(story.temper)||
     !hasFields(story,storyNumbers,integer)||!hasFields(story,storyFlags,v=>typeof v==='boolean')||
     !ride(story.ride)||!ride(story.exitRide)||!hasFields(story,storySets,v=>arrayOf(v,scalar))||
     !['visited','cleared','clues','eventChecks'].every(key=>arrayOf(story[key],ride))||
     !arrayOf(story.actions,a=>object(a)&&typeof a.kind==='string'&&ride(a.ride))||
     !object(story.dollMemories)||(story.catStopUsed!==undefined&&typeof story.catStopUsed!=='boolean'))return false;
  if(!hasFields(keeper,keeperNumbers,integer)||!hasFields(keeper,keeperFlags,v=>typeof v==='boolean')||
     keeper.orientation||typeof keeper.dream!=='string'||typeof keeper.stance!=='string'||
     !hasFields(keeper,keeperSets,v=>arrayOf(v,scalar)))return false;
  if(!hasFields(player,poseKeys,Number.isFinite)||Math.abs(player.pitch)>Math.PI||player.eye<1||player.eye>3||
     !ride(progress.zone)||!hasFields(progress,['free','intro','firstLever','fractureUnlocked'],v=>typeof v==='boolean')||
     (progress.target!==null&&(!arrayOf(progress.target,Number.isFinite)||progress.target.length!==2)))return false;
  if(room!==null&&(!object(room)||!hasFields(room,['first','windowView'],v=>typeof v==='boolean')))return false;
  if(room?.shop!==undefined&&(![...window.NEVERLAND_LAYOUT.shops,...window.NEVERLAND_LAYOUT.games].some(shop=>shop.id===room.shop)||room.first||room.windowView))return false;
  if(room?.pose!==undefined&&!window.NEVERLAND_BEDROOM_MOVEMENT?.valid(room.pose,room.shop))return false;
  if(story.phase!==(room?.first?'profile':'main')||
     (room?.first&&(progress.free||progress.intro||progress.firstLever||story.exit)))return false;
  if(!arrayOf(log,e=>object(e)&&typeof e.who==='string'&&typeof e.text==='string')||log.length>500)return false;
  return !!parkedPose(save);
 }
 function restore(save){
  const {story,keeper,progress,room,log}=save;
  const player=parkedPose(save);
  newGame();
  queue=[];after=null;puzzle=null;
  Object.assign(s,decode(story,['name','gender','temper','phase','actions','dollMemories',...storyNumbers,...storyFlags],storySets));
  s.catStopUsed=story.catStopUsed===true;
 Object.assign(keeperStoryState,decode(keeper,['dream','stance',...keeperNumbers,...keeperFlags],keeperSets));
  free3d=progress.free;intro3d=progress.intro;firstLever3d=progress.firstLever;target3d=progress.target;
  close();
  if(room?.first)sync3d();
  else explore3d(intro3d?'성 정문에서 후크의 마지막 항해 쪽으로 걸어가세요.':firstLever3d?'후크의 마지막 항해 입구에서 E로 승선하세요.':undefined);
  world3d.restorePark(player,progress);
  if((save.parkRevision??1)<3&&(progress.intro||progress.firstLever)){
   target3d=controls3d[0];sync3d();
  }
  if(room?.shop){const {shops,games}=window.NEVERLAND_LAYOUT;openShop3d([...shops,...games].find(shop=>shop.id===room.shop),room);}
  else if(room)openCastle3d(room.first,room.windowView,room);
  window.NEVERLAND_DIALOGUE.restore(log.filter(entry=>entry.who!=='체셔'));
  world3d.audio();
 }
 function readSlot(slot){
  let raw;
  try{raw=localStorage.getItem(key+slot);}catch{return {error:'브라우저 저장소를 읽을 수 없습니다.'};}
  if(raw===null)return {raw};
  try{
   const save=JSON.parse(raw);
   if(save?.version!==version)return {raw,error:'지원하지 않는 저장 버전입니다.'};
   if(validate(save))return {raw,save};
  }catch{}
  return {raw,error:'저장 데이터를 읽을 수 없습니다.'};
 }
 const menu=document.createElement('button');
 menu.id='manual-save-menu';menu.type='button';menu.textContent='저장 메뉴';menu.setAttribute('aria-haspopup','dialog');
 const dialog=document.createElement('dialog');
 dialog.id='manual-save-dialog';dialog.setAttribute('aria-labelledby','manual-save-title');
 dialog.innerHTML='<header><h2 id="manual-save-title"></h2><button type="button" data-save-close>닫기</button></header><p data-save-info></p><div data-save-slots></div><p data-save-status role="status"></p>';
 document.body.append(menu,dialog);
 const title=dialog.querySelector('h2'),closeButton=dialog.querySelector('[data-save-close]');
 const info=dialog.querySelector('[data-save-info]'),slots=dialog.querySelector('[data-save-slots]');
 const status=dialog.querySelector('[data-save-status]');
 const format=new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short'});
 function addButton(parent,label,action){
  const button=document.createElement('button');
  button.type='button';button.textContent=label;button.onclick=action;parent.append(button);
  return button;
 }
 function render(){
  const loading=s.phase==='profile'&&!window.NEVERLAND_ROOM?.active;
  const blocked=loading?'':reason();
  title.textContent=loading?'저장 불러오기':'수동 저장';
  info.textContent=blocked||(loading?'이어서 플레이할 슬롯을 선택하세요.':'현재 위치와 이야기 진행을 이 브라우저에 저장합니다.');
  slots.replaceChildren();
  for(let slot=1;slot<=3;slot++){
   const state=readSlot(slot);
   const row=document.createElement('div');
   const name=document.createElement('strong');
   name.textContent='슬롯 '+slot;
   const detail=document.createElement('span');
   detail.textContent=state.save?state.save.story.name+' · '+format.format(state.save.time):state.error||'빈 슬롯';
   row.append(name,detail);
   slots.append(row);
   if(loading){
    addButton(row,'불러오기',()=>{
     const latest=readSlot(slot);
     if(!latest.save){render();status.textContent=latest.error||'비어 있는 슬롯입니다.';return;}
     dialog.close();
     restore(latest.save);
    }).disabled=!state.save;
    continue;
   }
   function write(){
    const restriction=reason(),latest=readSlot(slot);
    if(restriction||latest.raw!==state.raw){
     render();status.textContent=restriction||'슬롯이 변경되었습니다. 다시 확인해 주세요.';return;
    }
    try{
     const save=capture();
     if(!validate(save)){status.textContent='현재 위치를 저장할 수 없습니다. 주변의 열린 길로 이동해 주세요.';return;}
     localStorage.setItem(key+slot,JSON.stringify(save));
     render();status.textContent='슬롯 '+slot+'에 저장했습니다.';slots.children[slot-1].querySelector('button').focus();
    }catch{status.textContent='저장할 수 없습니다. 브라우저 저장 공간과 설정을 확인해 주세요.';}
   }
   const action=addButton(row,'저장',()=>{
    if(state.raw===null){write();return;}
    action.disabled=true;
    const confirm=addButton(row,'덮어쓰기 확인',write);
    addButton(row,'취소',()=>{render();slots.children[slot-1].querySelector('button').focus();});
    confirm.focus();
   });
   action.disabled=!!blocked||state.raw===undefined;
  }
 }
 menu.onclick=()=>{
  status.textContent='';
  window.NEVERLAND_DIALOGUE.stop();
  world3d.clearMovement();
  render();dialog.showModal();
  closeButton.focus();
 };
 closeButton.onclick=()=>dialog.close();
 window.NEVERLAND_SAVES={get open(){return dialog.open;}};
 function connectTitle(){
  const start=$('start');
  if(!start?.isConnected)return;
  const load=document.createElement('button');
  load.type='button';load.id='manual-save-load';load.textContent='저장 불러오기';
  load.onclick=menu.onclick;
  start.after(load);
 }
 const initialNewGame=newGame;
 newGame=function(...args){
  dialog.close();
  queue=[];after=null;puzzle=null;
  const result=initialNewGame(...args);
  connectTitle();
  return result;
 };
 connectTitle();
})();
