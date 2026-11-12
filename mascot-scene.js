'use strict';
window.NEVERLAND_MASCOT_SCENE=function(T,park){
 const escape=new T.Scene();escape.background=new T.Color('#170d27');escape.fog=new T.FogExp2('#21122f',.033);
 escape.add(new T.HemisphereLight(0xe7c9ff,0x4b244e,2.5));
 const lamp=new T.DirectionalLight(0xffdeb3,2.2);lamp.position.set(3,7,2);escape.add(lamp);
 const mat=(color,glow=false)=>glow?new T.MeshBasicMaterial({color}):new T.MeshStandardMaterial({color,roughness:.82});
 const ivory=mat(0xf0ddc3),brown=mat(0x766055),emerald=mat(0x173f32),gold=mat(0xffce74,true),wine=mat(0x76233a),blue=mat(0x81c9ff,true);
 const purple=mat(0x8060b4),pink=mat(0xde89c7),dark=mat(0x170c26),floor=mat(0x493655),edge=mat(0x684c78);
 function mesh(parent,geometry,material,x,y,z){
  const node=new T.Mesh(geometry,material);node.position.set(x,y,z);parent.add(node);return node;
 }
 function ball(parent,material,x,y,z,sx,sy=sx,sz=sx){
  const node=mesh(parent,new T.SphereGeometry(1,12,9),material,x,y,z);node.scale.set(sx,sy,sz);return node;
 }
 function box(parent,material,x,y,z,w,h,d){return mesh(parent,new T.BoxGeometry(w,h,d),material,x,y,z);}
 function star(parent,x,y,z,r){
  const shape=new T.Shape();
  for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,len=i%2?r*.41:r;const p=[Math.cos(a)*len,Math.sin(a)*len];if(i)shape.lineTo(...p);else shape.moveTo(...p);}
  shape.closePath();return mesh(parent,new T.ShapeGeometry(shape),gold,x,y,z);
 }
 const cat=new T.Group();cat.name='park-ragdoll';park.add(cat);
 ball(cat,ivory,0,.39,0,.36,.28,.54);ball(cat,wine,0,.56,-.12,.36,.17,.43);
 ball(cat,ivory,0,.68,.43,.34,.31,.29);ball(cat,brown,0,.73,.61,.27,.21,.125);
 ball(cat,ivory,0,.58,.685,.17,.095,.10);
 for(const side of [-1,1]){
  const ear=mesh(cat,new T.ConeGeometry(.115,.27,6),brown,side*.20,.99,.41);ear.rotation.z=-side*.21;
  ball(cat,blue,side*.115,.735,.71,.055,.057,.036);
  ball(cat,dark,side*.115,.735,.74,.024,.041,.014);
  for(const z of [-.31,.27])ball(cat,ivory,side*.215,.15,z,.108,.18,.13);
 }
 const tail=ball(cat,brown,-.08,.62,-.60,.14,.15,.43);tail.rotation.x=.55;
 mesh(cat,new T.CylinderGeometry(.20,.235,.25,16),emerald,.06,1.04,.43);
 mesh(cat,new T.CylinderGeometry(.27,.27,.045,16),gold,.06,.92,.43);
 star(cat,0,.49,.62,.093);
 const catLight=ball(park,gold,3,.6,3,.13);catLight.name='ragdoll-star-light';
 box(escape,floor,0,-.13,-32,8.8,.25,86);
 for(const side of [-1,1]){
  box(escape,edge,side*4.47,1.17,-32,.35,2.35,86);
  for(let z=5;z>-69;z-=5){
   box(escape,purple,side*4.2,.9,z,.32,1.8,.36);
   ball(escape,gold,side*4.16,1.86,z,.11);
  }
 }
 for(let z=-3;z>-64;z-=7){
  const mark=star(escape,0,.012,z,.45);mark.rotation.x=-Math.PI/2;
 }
 for(const side of [-1,1])box(escape,gold,side*1.55,1.45,-69.9,.20,2.9,.28);
 box(escape,gold,0,2.91,-69.9,3.3,.19,.28);star(escape,0,3.55,-69.85,.71);
 box(escape,mat(0xffe6ad,true),0,1.37,-70.1,2.92,2.72,.06);
 const brokenKey=new T.Group();brokenKey.name='broken-keeper-key';brokenKey.position.set(1.55,1.18,-69.64);escape.add(brokenKey);
 const ring=mesh(brokenKey,new T.TorusGeometry(.23,.046,8,20),gold,-.07,.39,0);
 ring.rotation.z=-.27;
 box(brokenKey,gold,-.03,.11,0,.105,.42,.10).rotation.z=-.24;
 box(brokenKey,gold,.14,-.21,0,.095,.32,.10).rotation.z=.36;
 box(brokenKey,gold,.19,-.32,0,.22,.085,.10).rotation.z=.36;
 const monster=new T.Group();monster.name='hooded-pursuer';escape.add(monster);
 ball(monster,purple,0,1.63,-.53,.94,.72,1.27);
 ball(monster,pink,0,2.11,.37,.86,.69,.68);
 ball(monster,purple,0,2.1,.51,.75,.57,.64);
 ball(monster,dark,0,2.06,.94,.61,.47,.21);
 const eyes=[-.24,.24].map(x=>ball(monster,gold,x,2.13,1.128,.068));
 const sleeves=[];
 for(const side of [-1,1]){
  const sleeve=ball(monster,purple,side*.78,1.0,.37,.35,1.1,.39);
  sleeve.rotation.z=side*.22;sleeves.push(sleeve);
  ball(monster,pink,side*.94,.17,.62,.39,.17,.69);
  ball(monster,purple,side*.63,.59,-1.03,.23,.64,.34);
  ball(monster,pink,side*.62,.11,-1.28,.27,.12,.42);
 }
 return {escape,update(state,t,still){
  const feature=window.NEVERLAND_MASCOT;
  const guide=feature?.guide,active=feature?.chase;
  const visible=!!feature&&!state.config.epilogue&&!state.passage&&(guide||(!state.interior&&state.config.free));
  cat.visible=!!visible;catLight.visible=!!visible&&!guide;
  if(visible){
   const spot=guide||feature.catSpot,near=Math.hypot(state.player.x-spot.x,state.player.z-spot.z)<2.35;
   const rub=near&&!guide&&!still?Math.sin(t*3.4)*.25:0;
   cat.position.set(spot.x+rub,0,spot.z);
   cat.rotation.set(0,guide?Math.atan2(state.player.x-spot.x,state.player.z-spot.z):.45,rub*.22);
   catLight.position.set(spot.x+(guide?0:.42),.54,spot.z+(guide?0:.22));
   catLight.visible=!!visible&&(!!guide||near);
  }
  if(active){
   const p=state.player,q=active.monster;
   monster.position.set(q.x,0,q.z);monster.lookAt(p.x,0,p.z);
   eyes.forEach((eye,i)=>{eye.visible=still||Math.sin(t*(i?2.6:3.7)+i)*Math.sin(t*5.8+i*3)>-.83;});
   sleeves.forEach((sleeve,i)=>{sleeve.rotation.x=still?0:Math.sin(t*6+i*Math.PI)*.34;});
  }
 }};
};
