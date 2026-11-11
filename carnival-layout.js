// Shared world coordinates: rendering, walking, map and story all use this layout.
window.NEVERLAND_LAYOUT=(()=>{
 const booth=(id,name,side,z,symbol)=>{
  const x=side*23,inward=-side;
  return {id,name,x,z,inward,door:[x+inward*3.6,z],symbol};
 };
 return {
 rides:[{id:'captain',name:'캡틴 훅',x:0,z:24,control:[0,20.1],verb:'붉은 레버를 당긴다'},{id:'wheel',name:'별의 관람차',x:23,z:-44,control:[17,-35],verb:'별 모양 손잡이를 돌린다'},{id:'carousel',name:'장미 회전목마',x:-23,z:-44,control:[-17,-35],verb:'오르골 태엽을 감는다'},{id:'mirror',name:'거울 미로',x:-23,z:-5,control:[-16,1],verb:'거울의 각도를 바꾼다'},{id:'tea',name:'달빛 찻잔',x:23,z:-5,control:[16,1],verb:'보라색 찻잔의 손잡이를 돌린다'}],
 clues:[[-5,19.75],[30,-34],[-30,-34],[-30,3],[30,3]],
 keepers:[[-3,18],[13,-32],[-13,-32],[-13,5],[13,5]],
 spawn:{x:0,z:24,yaw:0},entry:[0,50],center:[0,-24],bounds:{minX:-74,maxX:74,minZ:-95,maxZ:61},castleExit:[0,-16],
 shops:[booth('drinks','별빛 음료 코너',-1,-60),booth('candy','달구름 솜사탕',1,-60)],
 games:[
  booth('rings','금빛 링 던지기',-1,-66.05,'◎'),
  booth('stars','별 맞히기',1,-66.05,'✦'),
  booth('pairs','기억 짝맞추기',-1,-53.95,'◇'),
  booth('timing','박자 맞추기',1,-53.95,'♪')
 ],
 coaster:{name:"별바람 롤러코스터",door:[-13,-67],bounds:[-25,25,-92,-70]},
 boothExit(booth){return {x:booth.door[0]+booth.inward,z:booth.door[1],yaw:-booth.inward*Math.PI/2};},
 castleDistance(x,z){return Math.hypot(Math.max(0,Math.abs(x)-5.9),Math.max(0,Math.abs(z-this.center[1])-4.65));},
 terrain(x,z){const r=Math.hypot(x,z+24);if(r<9.8)return .28;if(r>=9.8&&r<=14.2&&(Math.abs(x)<2.8||Math.abs(z+24)<2.8)){const t=(r-9.8)/4.4;return .28+Math.sin(t*Math.PI)*.55;}return 0;},
 water(x,z){const r=Math.hypot(x,z+24);return r>10&&r<14&&Math.abs(x)>2.7&&Math.abs(z+24)>2.7;},
 colliders(){const c=[],b=(x,z,w,d)=>c.push({a:x-w/2-.2,b:x+w/2+.2,l:z-d/2-.2,r:z+d/2+.2});
  b(0,-24,11.8,9.3);b(this.rides[0].x,this.rides[0].z,12.1,6);for(const shop of [...this.shops,...this.games]){b(shop.x+shop.inward*.45,shop.z,1.4,4.8);for(const x of [-1.75,1.75])for(const z of [-2.65,2.65])b(shop.x+x,shop.z+z,.28,.28);}
  for(const x of[-6.6,6.6])b(x,this.entry[1],2.4,2.4);
  const [left,right,back,front]=this.coaster.bounds;
  b((left+right)/2,(back+front)/2,right-left,front-back);
  for(const r of this.rides)b(r.control[0],r.control[1],.7,.7);
  for(const x of[-29.6,-16.4])b(x,-6,.3,10);b(-23,-11,13,.3);for(const x of[-27,-23,-19])b(x,-7,.18,5);
  return c;
 }
 };
})();
