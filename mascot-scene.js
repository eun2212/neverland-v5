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
 const maze=window.NEVERLAND_CHASE_MAZE;
 const {size,rows}=maze;
 const {x:exitX,z:exitZ}=maze.point(maze.exit.row,maze.exit.col);
 const rear=maze.point(rows.length-1,0).z;
 box(escape,floor,0,-.13,(exitZ+rear)/2,size*rows[0].length,.25,size*rows.length);
 for(const {x,z} of maze.walls){
  box(escape,edge,x,1.55,z,size,3.1,size);
  box(escape,purple,x,3.1,z,size,.14,size);
 }
 for(const {x,z} of maze.stars.slice(1)){
  const mark=star(escape,x,.018,z,.37);mark.rotation.x=-Math.PI/2;
 }
 const doorZ=exitZ-1.8;
 for(const side of [-1,1])box(escape,gold,exitX+side*1.55,1.45,doorZ,.20,2.9,.28);
 box(escape,gold,exitX,2.91,doorZ,3.3,.19,.28);
 star(escape,exitX,3.55,doorZ,.71);
 box(escape,mat(0xffe6ad,true),exitX,1.37,doorZ-.2,2.92,2.72,.06);
 const brokenKey=new T.Group();brokenKey.name='broken-keeper-key';brokenKey.position.set(exitX+1.55,1.18,doorZ+.26);escape.add(brokenKey);
 const ring=mesh(brokenKey,new T.TorusGeometry(.23,.046,8,20),gold,-.07,.39,0);
 ring.rotation.z=-.27;
 box(brokenKey,gold,-.03,.11,0,.105,.42,.10).rotation.z=-.24;
 box(brokenKey,gold,.14,-.21,0,.095,.32,.10).rotation.z=.36;
 box(brokenKey,gold,.19,-.32,0,.22,.085,.10).rotation.z=.36;
 const scarePose=maze.point(maze.spawn.row,maze.spawn.col);
 const changingCat=cat.clone();changingCat.name='transforming-ragdoll';escape.add(changingCat);
 const monster=new T.Group();monster.name='neverland-pursuer';escape.add(monster);
 ball(monster,purple,0,1.63,-.53,.94,.72,1.27);
 ball(monster,pink,0,2.11,.37,.86,.69,.68);
 ball(monster,purple,0,2.1,.51,.75,.57,.64);
 ball(monster,dark,0,2.06,.94,.61,.47,.21);
 const eyes=[-.24,.24].map(x=>ball(monster,gold,x,2.13,1.128,.068));
 for(const side of [-1,1]){
  const ear=mesh(monster,new T.ConeGeometry(.24,.64,6),purple,side*.57,2.79,.49);
  ear.rotation.z=-side*.22;
 }
 const sleeves=[];
 for(const side of [-1,1]){
  const sleeve=ball(monster,purple,side*.78,1.0,.37,.35,1.1,.39);
  sleeve.rotation.z=side*.22;sleeves.push(sleeve);
  ball(monster,pink,side*.94,.17,.62,.39,.17,.69);
  ball(monster,purple,side*.63,.59,-1.03,.23,.64,.34);
  ball(monster,pink,side*.62,.11,-1.28,.27,.12,.42);
 }
 let revealStart=null,scareStart=null;
 return {escape,scareCamera(camera,t,still){
  const progress=still?1:Math.min(1,(t-scareStart)/.29);
  camera.position.set(scarePose.x,2.10,scarePose.z+3.25-progress*1.65);
  camera.lookAt(scarePose.x,2.10,scarePose.z+.99);
 },update(state,t,still){
  const feature=window.NEVERLAND_MASCOT;
  const guide=feature?.guide,active=feature?.chase;
  const interior=state.interior;
  const rideCat=interior&&!interior.running&&state.config.free&&state.config.forcedRide<0&&feature?.rideSpot(interior.ride);
  const spot=guide||rideCat||(!interior&&state.config.free&&feature?.catSpot);
  const visible=spot&&!state.config.epilogue&&!state.passage;
  cat.visible=!!visible;catLight.visible=!!visible&&!guide;
  if(visible){
   const near=Math.hypot(state.player.x-spot.x,state.player.z-spot.z)<2.35;
   const rub=near&&!guide&&!still?Math.sin(t*3.4)*.25:0;
   cat.position.set(spot.x+rub,0,spot.z);
   cat.rotation.set(0,guide?Math.atan2(state.player.x-spot.x,state.player.z-spot.z):.45,rub*.22);
   catLight.position.set(spot.x+(guide?0:.42),.54,spot.z+(guide?0:.22));
   catLight.visible=!!visible&&(!!guide||near);
  }
  const reveal=feature?.reveal;
  if(reveal)revealStart??=t;
  else revealStart=null;
  const progress=reveal?(still?1:Math.min(1,(t-revealStart)/1.65)):1;
  changingCat.visible=!!reveal&&progress<.64;
  changingCat.position.set(-4,0,0);
  changingCat.rotation.y=Math.PI/2;
  changingCat.scale.set(1+progress*.8,1+progress*1.5,1+progress*.8);
  monster.visible=!!active||!!reveal&&progress>=.42;
  monster.scale.setScalar(reveal?Math.max(.3,progress):1);
  if(reveal){monster.position.set(-4,0,0);monster.rotation.y=Math.PI/2;}
  if(active?.scare){
   scareStart??=t;
   monster.position.set(scarePose.x,0,scarePose.z);monster.rotation.set(0,0,0);
   eyes.forEach(eye=>{eye.visible=true;});
   sleeves.forEach(sleeve=>{sleeve.rotation.x=-.42;});
   return;
  }
  scareStart=null;
  if(active){
   const p=state.player,q=active.monster;
   monster.position.set(q.x,0,q.z);monster.lookAt(p.x,0,p.z);
   eyes.forEach((eye,i)=>{eye.visible=still||!active.started||Math.sin(t*(i?2.6:3.7)+i)*Math.sin(t*5.8+i*3)>-.83;});
   sleeves.forEach((sleeve,i)=>{sleeve.rotation.x=still?0:Math.sin(t*6+i*Math.PI)*.34;});
  }
 }};
};
