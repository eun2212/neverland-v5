// Player menus and reproducible authoring checkpoints. Never infer a story callback from text.
(function(){
 'use strict';
 const key='neverland-settings-v1',albumKey='neverland-album-v1';
 function read(k,fallback){try{return JSON.parse(localStorage.getItem(k))||fallback;}catch{return fallback;}}
 const settings=Object.assign({font:18,auto:65,volume:65,reduced:false},read(key,{}));
 let collected=read(albumKey,[]);if(!Array.isArray(collected))collected=[];
 let testing=false,resetting=false,opened=false,paused=false,focus=null;
 const nav=document.createElement('nav');nav.id='game-menu';nav.setAttribute('aria-label','게임 메뉴');
 nav.innerHTML='<button id="game-log">로그</button><button id="game-album">앨범</button><button id="game-settings">설정</button><button id="game-jump">장면 이동 · 제작</button>';
 document.body.append(nav);
 const shell=document.createElement('section');shell.id='game-tools';shell.hidden=true;shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-labelledby','game-tools-title');
 shell.innerHTML='<div class="tools-panel"><div class="tools-heading"><h2 id="game-tools-title"></h2><button id="tools-close">닫기 · Esc</button></div><div id="tools-content"></div></div>';document.body.append(shell);
 const badge=document.createElement('div');badge.id='test-play-badge';badge.hidden=true;badge.textContent='제작 테스트 · 수집 기록에 저장되지 않음';document.body.append(badge);
 function persist(){try{localStorage.setItem(key,JSON.stringify(settings));}catch{}}
 function apply(){document.documentElement.style.setProperty('--dialogue-font',settings.font+'px');document.body.classList.toggle('reduce-motion',settings.reduced);window.NEVERLAND_BGM?.setVolume(settings.volume/100);}
 function hide(){if(!opened)return;opened=false;shell.hidden=true;world3d.configure({paused});focus?.focus?.();}
 function show(title){window.NEVERLAND_DIALOGUE?.closeLog();window.NEVERLAND_DIALOGUE?.stop();if(!opened){focus=document.activeElement;paused=!!world3d.state.config.paused;}opened=true;shell.hidden=false;world3d.configure({paused:true});document.exitPointerLock?.();$('game-tools-title').textContent=title;$('tools-content').replaceChildren();$('tools-content').classList.remove('dev-console');$('tools-close').focus();return $('tools-content');}
 function node(tag,text,parent){const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;}
 function action(parent,text,fn){const b=node('button',text,parent);b.onclick=fn;return b;}
 function collect(id){if(resetting||testing||collected.includes(id))return;collected.push(id);try{localStorage.setItem(albumKey,JSON.stringify(collected));}catch{}}
 function album(){const host=show('앨범 · 네버랜드의 기억');node('p','플레이에서 만난 키퍼의 표정과 이벤트 그림을 모읍니다. 엔딩은 기록으로 보관하며, 채택되지 않은 엔딩 그림은 표시하지 않습니다.',host);
  const grid=node('div','',host);grid.className='album-grid';const seen=new Set();
  for(const [id,item]of Object.entries(keeperArt)){if(seen.has(item.src))continue;seen.add(item.src);const card=node('article','',grid);if(collected.includes('pose:'+item.src)){const image=document.createElement('img');image.src=item.src;image.alt=item.name;card.append(image);node('p',item.name,card);}else{node('div','◇',card).className='album-lock';node('p','아직 만나지 않은 표정',card);}}
  for(const [id,src]of Object.entries(eventArt)){const card=node('article','',grid);if(collected.includes('event:'+id)){const image=document.createElement('img');image.src=src;image.alt=id==='parade'?'퍼레이드':'주사위 승리';card.append(image);node('p',image.alt,card);}else{node('div','◇',card).className='album-lock';node('p','아직 만나지 않은 이벤트',card);}}
  node('h3','엔딩 기록 · '+endings.length+' / 5',host);for(let id=1;id<=5;id++)node('p',endings.includes(id)?'✦ '+endingData[id][0]:'◇ 아직 쓰이지 않은 이야기',host);
 }
 function options(){const host=show('설정');node('p','설정은 이 브라우저에 보관됩니다. 진행 자동 저장은 없으며, 장면 이동은 제작 테스트용입니다.',host);
  function range(label,field,min,max,step,unit){const row=node('label','',host);row.className='setting-row';const title=node('span',label,row),out=node('output',settings[field]+unit,row),input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=settings[field];input.setAttribute('aria-label',label);row.append(input);input.oninput=()=>{settings[field]=Number(input.value);out.value=settings[field]+unit;apply();persist();};}
  range('대사 글자 크기','font',16,30,1,'px');range('Auto 읽기 간격 · 클수록 느림','auto',30,120,5,'ms/글자');range('배경음 크기','volume',0,100,5,'%');
  const label=node('label','',host);label.className='setting-check';const input=document.createElement('input');input.type='checkbox';input.checked=settings.reduced;label.append(input);node('span','동작 줄이기 · 미로의 점멸과 화면 효과 완화',label);input.onchange=()=>{settings.reduced=input.checked;apply();persist();};
  action(host,window.NEVERLAND_BGM?.state.muted?'소리 켜기':'소리 끄기',()=>{$('sound').click();options();});
  node('h3','읽기 도구',host);node('p','대화 중 스킵은 계속 대사만 넘깁니다. Auto는 읽기 간격에 맞춰 진행하며, 선택지에서는 둘 다 멈춥니다. Esc로 정지할 수 있습니다.',host);
  action(host,'대사 로그 열기',()=>{hide();window.NEVERLAND_DIALOGUE.openLog();});
 }
 function profile(){const title=s?.phase==='profile';return{name:(title?$('player')?.value?.trim():s?.name)||'여행자',gender:(title?$('gender')?.value:s?.gender)==='male'?'male':'female',temper:(title?$('temper')?.value:s?.temper)||'moderate'};}
 function prepare(){const p=profile();hide();window.NEVERLAND_DIALOGUE.closeLog();newGame();testing=true;badge.hidden=false;close();Object.assign(s,p,{phase:'main',keeperIntroduced:true});queue=[];after=null;puzzle=null;releaseForcedRide3d();pendingRideResult=null;atControl3d=false;atExit3d=false;confronting3d=false;free3d=true;intro3d=false;firstLever3d=false;target3d=null;keeperStoryState.orientation=false;keeperStoryState.ready=true;world3d.configure({free:true,paused:false});}
 function late(){world3d.unlockFracture();s.cleared=new Set([0,1,2,3]);s.visited=new Set([0,1,2,3,4]);s.clues=new Set([0,1,2,3,4]);s.survivedRides=4;s.K=10;s.M=4;s.N=12;s.I=6;s.wins=3;s.exit=true;s.exitRide=1;s.ride=1;keeperStoryState.dream='accuse';keeperStoryState.evidence=new Set([0,1,2,3,4]);}
 function jump(where,id=0){
  if(where==='title'){hide();newGame();return;}
  const parkState=where==='park'&&s.phase!=='profile'?{story:s,keeper:keeperStoryState}:null;
  prepare();
  if(parkState){s=parkState.story;keeperStoryState=parkState.keeper;s.phase='main';s.talks=0;}
  if(where==='start'){free3d=false;keeperOrientation3d();}
  else if(where==='first'){world3d.unlockFracture();s.visited=new Set([0]);keeperStoryState.dream='';finishFracture3d();}
  else if(['ride','control','force','running','incident'].includes(where)){
   if(!Number.isInteger(id)||id<0||id>=rides.length){explore3d();return;}
   s.ride=id;s.visited.add(id);s.talks=0;world3d.jumpToPark(controls3d[id][0],controls3d[id][1]+5);world3d.enterRide(id);
   if(id===3){pendingRideResult={kind:'mirror',help:false,risk:false};explore3d(rides[id].name+' · 반대편 흰 출구를 찾아가세요.');}
   else{
    world3d.forceBoard(id);
    if(id===0){free3d=false;firstLever3d=true;}
    if(where==='ride'){if(id===0)keeperFirstBoarding3d();else explore3d(rides[id].name+' · 탑승했습니다. E 또는 기구 조작 버튼을 누르세요.');}
    else if(where==='running'){
     pendingRideResult=id===0?{kind:'tutorial'}:{kind:'normal',help:false,risk:false};
     if(id===0)world3d.setRidePower(100);
     world3d.startRide(id===0?8:undefined);explore3d(rides[id].name+' · 운행 중 테스트');
    }else if(where==='incident'&&id!==0){success(false);}
    else{
     if(id===0)openFirstLever3d();
     else{atControl3d=true;try{original3d.openPuzzle();}finally{atControl3d=false;}}
     sync3d();
     if(where==='force'){
      if(id===0){const handle=document.querySelector('.coaster-lever__handle');handle?.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));}
      else document.querySelector('.ride-interaction__refuse')?.click();
     }
    }
   }
  }
  else if(['coaster','coaster-force','coaster-running'].includes(where)){
   world3d.jumpToPark(...window.NEVERLAND_LAYOUT.coaster.door);explore3d(window.NEVERLAND_LAYOUT.coaster.name+' · 승강장에서 테스트합니다.');
   window.NEVERLAND_COASTER.open(()=>{explore3d();$('walking-map').focus?.();});
   if(where==='coaster-force')document.querySelector('.safetybar__refuse')?.click();
   else if(where==='coaster-running'){const handle=document.querySelector('.safetybar__handle');handle?.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));}
  }
  else if(where==='booth'||where==='booth-play'){
   const booth=window.NEVERLAND_LAYOUT.games.find(game=>game.id===id);if(!booth){explore3d();return;}
   const pos=window.NEVERLAND_LAYOUT.boothExit(booth);world3d.jumpToPark(pos.x,pos.z,pos.yaw);explore3d(booth.name+' · 부스 앞 테스트');
   if(where==='booth-play')window.NEVERLAND_BOOTH_GAMES?.open(booth.id,()=>explore3d());
  }
  else if(where==='dream'){world3d.unlockFracture();s.visited=new Set([0]);keeperStoryState.dream='';dreamAnswer(['doubt','comfort','accuse'].includes(id)?id:'doubt');}
  else if(where==='park'){s.ride=id;world3d.jumpToPark(controls3d[id][0],controls3d[id][1]+5);explore3d('공원으로 돌아왔습니다. 제작 메뉴에서 다음 장면으로 이동할 수 있습니다.');}
  else if(where==='exit'){late();world3d.jumpToPark(controls3d[1][0]+4,controls3d[1][1]+6);explore3d('출구가 나타난 직후 · 앞의 출구에서 E를 누르면 고백이 시작됩니다.');world3d.faceExit();}
  else if(where==='branch'){late();confronting3d=true;keeperStoryState.confessed=true;world3d.jumpToPark(controls3d[1][0]+4,controls3d[1][1]+6);sync3d();world3d.faceExit();keeperFinalChoices();}
  else if(where==='chase'){late();window.NEVERLAND_MASCOT.start(()=>end(2));}
  else if(where==='outside'){late();s.phase='final';end(2);}
  else if(where==='ending'){late();s.phase='final';end(id);}
  sync3d();world3d.audio();
 }
 function jumps(){
  const host=show('장면 이동 · 제작');host.classList.add('dev-console');
  const info=node('div','',host);info.className='dev-console__info';
  node('strong','DEVELOPER / SCENE LAB',info);
  const p=profile();node('p',`테스트 전용 · ${p.name} · ${p.gender==='male'?'남':'여'} · 수집 기록에 저장되지 않음`,info);
  node('p','분기를 선택하면 현재 진행을 테스트 상태로 교체합니다. 일반 플레이는 타이틀에서 다시 시작하세요.',info);
  const nav=node('nav','',host);nav.className='dev-console__nav';nav.setAttribute('aria-label','장면 종류');
  function group(title,caption){const section=node('section','',host);section.className='dev-section';const head=node('div','',section);head.className='dev-section__heading';node('h3',title,head);node('p',caption,head);action(nav,title,()=>section.scrollIntoView?.({behavior:'smooth',block:'start'}));const grid=node('div','',section);grid.className='dev-grid';return grid;}
  function card(grid,title,description,choices){const el=node('article','',grid);el.className='dev-card';node('h4',title,el);node('p',description,el);const buttons=node('div','',el);buttons.className='dev-card__actions';for(const [label,fn]of choices)action(buttons,label,fn);return el;}
  const storyGrid=group('스토리','주요 대화와 선택 분기');
  card(storyGrid,'시작','키퍼의 첫 안내와 선택지',[['안내 대화',()=>jump('start')],['첫 사고 후',()=>jump('first')]]);
  card(storyGrid,'첫 꿈의 반응','사고 직후 선택한 대사부터 시작',[['의심',()=>jump('dream','doubt')],['위로 요청',()=>jump('dream','comfort')],['정지 장치 추궁',()=>jump('dream','accuse')]]);
  card(storyGrid,'출구와 대치','출구 발견 이후의 장면',[['출구 등장',()=>jump('exit')],['최종 선택',()=>jump('branch')],['마지막 추격',()=>jump('chase')],['현실로 탈출',()=>jump('outside')]]);
  const ridesGrid=group('놀이기구','탑승 · 조작 · 강제 개입 · 운행 상태를 바로 확인');
  rides.forEach((ride,id)=>{
   if(id===3){card(ridesGrid,ride.name,'미로 입구에서 직접 탐색합니다.',[['미로 출발',()=>jump('ride',id)]]);return;}
   const choices=[['탑승',()=>jump('ride',id)],['조작 화면',()=>jump('control',id)],['키퍼 개입',()=>jump('force',id)],['운행 중',()=>jump('running',id)]];
   if(id!==0)choices.push(['출발 전 선택',()=>jump('incident',id)]);
   card(ridesGrid,ride.name,id===0?'첫 탑승 및 레버 조작':'기구별 장치와 출발 전 대화',choices);
  });
  card(ridesGrid,window.NEVERLAND_LAYOUT.coaster.name,'안전바와 강제 조작, 주행 카메라',[['안전바',()=>jump('coaster')],['키퍼 개입',()=>jump('coaster-force')],['운행 중',()=>jump('coaster-running')]]);
  const boothGrid=group('미니게임 부스','공원 안 부스 위치와 실제 게임 화면');
  for(const booth of window.NEVERLAND_LAYOUT.games)card(boothGrid,booth.name,'부스 입구 또는 게임을 바로 열기',[['부스 앞',()=>jump('booth',booth.id)],['게임 시작',()=>jump('booth-play',booth.id)]]);
  const endingGrid=group('엔딩','각 결말의 실제 공간을 미리보기');
  for(let id=1;id<=5;id++)card(endingGrid,String(id).padStart(2,'0')+' · '+endingData[id][0],'수집 기록에 저장되지 않습니다.',[['미리보기',()=>jump('ending',id)]]);
  const bottom=node('div','',host);bottom.className='dev-console__footer';action(bottom,'현재 기구에서 공원으로',()=>jump('park',s.ride||0));action(bottom,'타이틀 · 일반 플레이',()=>jump('title'));
 }
 const oldNew=newGame;newGame=function(...args){hide();testing=false;badge.hidden=true;resetting=true;try{return oldNew(...args);}finally{resetting=false;}};
 const oldPose=showKeeperPose;showKeeperPose=function(id,...args){const result=oldPose(id,...args);if(s?.phase!=='profile'&&keeperArt[id])collect('pose:'+keeperArt[id].src);return result;};
 const oldEvent=showEventArt;showEventArt=function(id,...args){const result=oldEvent(id,...args);collect('event:'+id);return result;};
 $('game-log').onclick=()=>{hide();window.NEVERLAND_DIALOGUE.openLog();};$('game-album').onclick=album;$('game-settings').onclick=options;$('game-jump').onclick=jumps;$('tools-close').onclick=hide;
 shell.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();hide();}if(e.key==='Tab'){const items=Array.from(shell.querySelectorAll('button,input,select')).filter(el=>!el.disabled);const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 document.addEventListener('keydown',e=>{if(opened){if(!shell.contains(e.target))return;e.stopPropagation();}},{capture:true});
 window.NEVERLAND_TOOLS={get testing(){return testing;},get open(){return opened;},get settings(){return{...settings};},jump,hide,album,options,jumps};apply();
})();
