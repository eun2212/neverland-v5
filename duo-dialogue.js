'use strict';
// Keep the ordinary dialogue flow, while framing the two characters together.
(function(){
 let active=false, cat=null;
 const css=document.createElement('style');
 css.textContent=`
 .stage.neverland-duo .keeper{display:block!important;left:3%!important;right:auto!important;transform:none!important;width:39%!important;height:83%!important;bottom:-3%!important;object-position:center bottom!important;z-index:2!important;opacity:1!important}
 .stage.neverland-duo .duo-cat-portrait{display:block;position:absolute;z-index:2;right:6%;top:8%;width:min(34vw,420px);height:min(48vh,360px);object-fit:cover;object-position:49% 47%;border:2px solid #d3b57d;border-radius:48% 48% 12% 12%;box-shadow:0 9px 26px #0c191bb5,0 0 0 5px #273e36c9;background:#202a1b;pointer-events:none}
 @media(max-width:700px){.stage.neverland-duo .keeper{left:-10%!important;width:68%!important;height:75%!important;bottom:2%!important}.stage.neverland-duo .duo-cat-portrait{right:3%;top:7%;width:41vw;height:28vh;max-height:240px}}
 `;
 document.head.append(css);
 function end(){
  active=false;
  const stage=document.getElementById('stage');
  stage?.classList.remove('neverland-duo');
  if(cat){cat.remove();cat=null;}
 }
 function begin(){
  end();
  const stage=document.getElementById('stage');
  if(!stage)return;
  active=true;stage.classList.add('neverland-duo');
  cat=document.createElement('img');cat.className='duo-cat-portrait';
  cat.src='assets/mascot-cat.png';cat.alt='별빛 고양이';
  stage.append(cat);
 }
 function play(lines,done){
  begin();
  if(typeof window.story!=='function'){end();done?.();return;}
  window.story(lines,()=>{end();done?.();});
 }
 document.addEventListener('click',event=>{
  if(active&&event.target?.closest?.('#restart-confirm-yes, #yes'))end();
 },true);
 const stage=document.getElementById('stage');
 if(stage&&typeof MutationObserver!=='undefined'){
  new MutationObserver(()=>{if(active&&stage.classList.contains('walking'))end();}).observe(stage,{attributes:true,attributeFilter:['class']});
 }
 window.NEVERLAND_DUO={begin,end,play,get active(){return active;}};
})();
