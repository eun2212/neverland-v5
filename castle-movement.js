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
 const shopActions={leave:[.105,.825],record:[.80,.884]};
 function walkable(x,y,shop){
  if(shop)return x>=.045&&x<=.955&&y>=.811&&y<=.941&&(x<.518||y>=.857);
  return x>=.045&&x<=.955&&y>=.607&&y<=.941&&
   !furniture.some(([left,right,top,bottom])=>x>left&&x<right&&y>top&&y<bottom);
 }
 function valid(pose,shop){
  return !!pose&&walkable(pose.x,pose.y,shop)&&['up','down','left','right'].includes(pose.facing);
 }
 function move(pose,dx,dy,seconds,shop){
  const scale=Math.min(.05,Math.max(0,seconds))*.34/(Math.hypot(dx,dy)||1);
  const x=pose.x+dx*scale,y=pose.y+dy*scale*(1672/941);
  if(walkable(x,pose.y,shop))pose.x=x;
  if(walkable(pose.x,y,shop))pose.y=y;
 }
 function distance(pose,action,anchors){
  const [x,y]=anchors[action];
  return Math.hypot(pose.x-x,(pose.y-y)*941/1672);
 }
 function nearby(pose,action,shop){const points=shop?shopActions:anchors;return !!points[action]&&distance(pose,action,points)<=.076;}
 function nearest(pose,shop){
  const points=shop?shopActions:anchors;
  let best=null,range=.076;
  for(const action of Object.keys(points)){
   const d=distance(pose,action,points);
   if(d<range){best=action;range=d;}
  }
  return best;
 }
 window.NEVERLAND_BEDROOM_MOVEMENT={entrance,bedside,directions,valid,move,nearby,nearest};
})();
