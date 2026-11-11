'use strict';
(function(){
 const entrance={x:.105,y:.83,facing:'right'};
 const bedside={x:.48,y:.79,facing:'down'};
 const furniture=[
  [.177,.465,.57,.813], // bed
  [.666,.986,.57,.842]  // desk and chair
 ];
 const anchors={
  leave:[.095,.78],window:[.579,.628],letter:[.504,.633],
  book:[.703,.87],record:[.817,.87],photo:[.929,.87]
 };
 const directions={
  ArrowLeft:[-1,0,'left'],a:[-1,0,'left'],
  ArrowRight:[1,0,'right'],d:[1,0,'right'],
  ArrowUp:[0,-1,'up'],w:[0,-1,'up'],
  ArrowDown:[0,1,'down'],s:[0,1,'down']
 };
 function walkable(x,y){
  return x>=.045&&x<=.955&&y>=.607&&y<=.941&&
   !furniture.some(([left,right,top,bottom])=>x>left&&x<right&&y>top&&y<bottom);
 }
 function valid(pose){
  return !!pose&&walkable(pose.x,pose.y)&&['up','down','left','right'].includes(pose.facing);
 }
 function move(pose,dx,dy,seconds){
  const scale=Math.min(.05,Math.max(0,seconds))*.34/(Math.hypot(dx,dy)||1);
  const x=pose.x+dx*scale,y=pose.y+dy*scale*(1672/941);
  if(walkable(x,pose.y))pose.x=x;
  if(walkable(pose.x,y))pose.y=y;
 }
 function distance(pose,action){
  const [x,y]=anchors[action];
  return Math.hypot(pose.x-x,(pose.y-y)*941/1672);
 }
 function nearby(pose,action){return !!anchors[action]&&distance(pose,action)<=.076;}
 function nearest(pose){
  let best=null,range=.076;
  for(const action of Object.keys(anchors)){
   const d=distance(pose,action);
   if(d<range){best=action;range=d;}
  }
  return best;
 }
 window.NEVERLAND_BEDROOM_MOVEMENT={entrance,bedside,directions,valid,move,nearby,nearest};
})();
