'use strict';
// A brief, skippable intertitle between existing story scenes.
(function(){
 const chapters={
  start:['CHAPTER 01','네버랜드의 초대','The Invitation'],
  fracture:['CHAPTER 02','빛이 사라진 곳','Beyond the Lights'],
  awake:['CHAPTER 03','다시 눈을 뜨다','Awakening'],
  exit:['CHAPTER 04','드러난 출구','The Door Appears'],
  escape:['CHAPTER 05','새벽 너머로','Beyond the Dawn']
 };
 let shown=new Set(),active=null,timer=null,sequence=0;
 const style=document.createElement('style');
 style.textContent=`
 .chapter-card{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:hidden;background:radial-gradient(ellipse at 50% 46%,#26382feb 0%,#111b19f7 52%,#080c0bf9 100%);color:#fff2cf;text-align:center;cursor:pointer;font-family:Georgia,'Noto Serif KR',serif}
 .chapter-card:before,.chapter-card:after{content:'';position:absolute;inset:6%;border:1px solid #cead6b77;pointer-events:none}.chapter-card:after{inset:7%;border-color:#c9a7602a}
 .chapter-card__inner{padding:2rem;max-width:85vw;animation:chapter-appear .65s ease both}
 .chapter-card__number{font:600 .78rem system-ui,sans-serif;letter-spacing:.35em;color:#e5c780}
 .chapter-card h1{margin:.65em 0 .4em;font-size:clamp(2rem,5vw,4rem);font-weight:500;letter-spacing:.08em;text-shadow:0 2px 24px #e5c78044}
 .chapter-card__subtitle{font-size:clamp(.85rem,1.5vw,1.15rem);letter-spacing:.22em;color:#e8cf9b}
 .chapter-card__skip{position:absolute;bottom:10%;left:0;right:0;font: .78rem system-ui,sans-serif;letter-spacing:.08em;color:#e0d4b3aa}
 @keyframes chapter-appear{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
 @media(prefers-reduced-motion:reduce){.chapter-card__inner{animation:none}}
 `;
 document.head.append(style);
 function clear(runNext){
  if(!active)return;
  clearTimeout(timer);timer=null;
  const entry=active;active=null;
  document.removeEventListener('keydown',onKey,true);
  entry.node.remove();document.body.classList.remove('chapter-card-active');
  if(runNext)entry.next?.();
  if(runNext)window.sync3d?.();
 }
 function onKey(event){
  if(!active)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(['Enter',' ','Escape'].includes(event.key))clear(true);
 }
 function present(key,next,options={}){
  const data=chapters[key];
  if(!data)return false;
  if(shown.has(key))return active?.key===key;
  shown.add(key);clear(true);
  const node=document.createElement('div');
  node.className='chapter-card';node.setAttribute('role','dialog');node.setAttribute('aria-label',data[0]+' '+data[1]);
  node.innerHTML='<div class="chapter-card__inner"><div class="chapter-card__number">'+data[0]+'</div><h1>'+data[1]+'</h1><div class="chapter-card__subtitle">'+data[2]+'</div></div><div class="chapter-card__skip">클릭 또는 Enter로 계속</div>';
  const id=++sequence;active={node,next,id,key};document.body.append(node);document.body.classList.add('chapter-card-active');
  window.neverlandWorld?.configure({paused:true});
  node.addEventListener('click',()=>clear(true));
  document.addEventListener('keydown',onKey,true);
  if(!options.hold)timer=setTimeout(()=>{if(active?.id===id)clear(true);},2700);
  return true;
 }
 function reset(){sequence++;clear(false);shown=new Set();}
 window.NEVERLAND_CHAPTER={present,reset,get active(){return !!active;}};
})();
