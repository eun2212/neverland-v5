'use strict';
window.NEVERLAND_CASTLE = function ({T, scene, stat, cube, cylinder, ball, mesh}) {
 const stone = new T.MeshStandardMaterial({color:0xffe3ad, roughness:.7});
 const pearl = new T.MeshStandardMaterial({color:0xe3b64d, roughness:.6});
 const roof = new T.MeshStandardMaterial({color:0x6f253e, roughness:.55, metalness:.18});
 const mint = new T.MeshStandardMaterial({color:0x265945, roughness:.55});
 const light = new T.MeshStandardMaterial({color:0xffd598, emissive:0xffbd7d, emissiveIntensity:.7});
 const doorway = new T.MeshBasicMaterial({color:0x221525});
 const door = new T.MeshStandardMaterial({color:0x492439, roughness:.7});
 const z = window.NEVERLAND_LAYOUT.center[1];
 function tower(x, offset, radius, height, color) {
  cylinder(x,.28,z+offset,radius,height,stone);
  cylinder(x,height-.16,z+offset,radius*1.13,.45,pearl);
  cylinder(x,height+.29,z+offset,radius*1.25,radius*2.55,color,stat,.03,32);
  ball(x,height+.35+radius*2.55,z+offset,.16,light);
  for (let side=0;side<4;side++) {
   const angle=side*Math.PI/2;
   const windowPane=cube(x+Math.sin(angle)*radius,height*.68,z+offset+Math.cos(angle)*radius,.48,1.23,.13,light);
   windowPane.rotation.y=angle;
  }
 }
 cube(0,.28,z,10.8,.46,9.2,pearl);
 cube(0,.74,z,10,7.2,8,stone);
 cube(0,7.85,z,10.5,.38,8.5,pearl);
 for (let x=-4.8;x<=4.8;x+=1.2) {
  for (const side of [-1,1]) cube(x,8.23,z+side*4,.6,.6,.6,pearl);
 }
 for (const x of [-4.25,4.25]) {
  tower(x,3,1.45,10.6,roof);
  tower(x,-3,1.45,12,mint);
 }
 tower(0,-1.2,2.15,15.8,roof);
 for (const x of [-2.5,2.5]) tower(x,-.6,.95,12.7,mint);
 for (const side of [-1,1]) {
  for (const x of [-2.45,2.45]) cube(x,4.35,z+side*4.03,.6,1.38,.15,light);
 }
 const arch=new T.Shape();
 arch.moveTo(-1.65,0);arch.lineTo(1.65,0);arch.lineTo(1.65,2.7);
 arch.absarc(0,2.7,1.65,0,Math.PI,false);arch.lineTo(-1.65,0);
 const doors=[];
 for (let side=0;side<4;side++) {
  const angle=side*Math.PI/2, distance=side%2?5.025:4.025;
  const frame=mesh(new T.ShapeGeometry(arch),pearl);
  frame.position.set(Math.sin(angle)*distance,.73,z+Math.cos(angle)*distance);
  frame.rotation.y=angle;
  const recess=mesh(frame.geometry,doorway);recess.position.copy(frame.position);recess.rotation.y=angle;recess.translateZ(.026);recess.scale.set(.88,.95,1);
  const gate=new T.Group();
  gate.position.copy(frame.position);gate.rotation.y=angle;
  gate.translateZ(.07);scene.add(gate);
  const hinge=new T.Group();hinge.position.x=-1.37;gate.add(hinge);
  const panel=mesh(frame.geometry,door,hinge);
  panel.position.x=1.37;panel.scale.set(.83,.91,1);
  doors.push({gate,hinge});
 }
 const sparks=new T.Group();
 scene.add(sparks);
 sparks.visible=false;
 const colors=[0xffafd9,0xb6baff,0x9cf5df,0xffd691];
 for (let i=0;i<32;i++) {
  const material=new T.MeshBasicMaterial({color:colors[i%4],transparent:true,depthWrite:false});
  ball(0,0,0,.10,material,sparks).castShadow=false;
 }
 return function update(t,reduced,inside,opening) {
  doors.forEach(({gate,hinge},i)=>{gate.visible=!inside;hinge.rotation.y=opening?.side===i?-1.23*opening.progress:0;});
  const cycle=Math.floor(t/24), age=t%24-9;
  sparks.visible=!reduced&&age>0&&age<2.4;
  if (!sparks.visible) return;
  sparks.children.forEach((spark,i)=>{
   const a=i*2.39996, up=(i/31)*2-1, ring=Math.sqrt(1-up*up);
   const spread=age*(2.5+(i%5)*.58);
   spark.position.set((cycle%3-1)*6+Math.cos(a)*ring*spread,24+up*spread-age*age*.65,z-5+Math.sin(a)*ring*spread);
   spark.material.opacity=Math.min(1,age*5)*(1-age/2.4);
  });
 };
};
