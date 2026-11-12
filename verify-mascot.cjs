const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=fs.readFileSync(path.join(__dirname,'verify-full-story.cjs'),'utf8');
const checks=String.raw`
sandbox.document.body.append=function(){};
sandbox.driveChase=()=>{
 const pet=sandbox.NEVERLAND_MASCOT,maze=sandbox.NEVERLAND_CHASE_MAZE,player=sandbox.worldQA.player;
 let frames=0;
 for(const target of maze.stars.slice(1)){
  player.yaw=Math.atan2(player.x-target.x,player.z-target.z);
  handlers.keydown({key:'w',repeat:false,preventDefault(){}});
  while(pet.active&&!pet.chase.failed&&Math.hypot(player.x-target.x,player.z-target.z)>.07&&frames<64*60){
   frame(2e8+(++frames)*1000/60);
   if(pet.active&&!maze.valid(pet.chase.monster.x,pet.chase.monster.z))throw Error('pursuer crossed a wall');
  }
  handlers.keyup({key:'w'});
 }
 return frames/60;
};
run('let completedChoice=null;finishChoice=(win,choice)=>{completedChoice=chooseEnding(win,choice);};');
vm.runInContext(fs.readFileSync(path.join(root,'mascot.js'),'utf8'),sandbox,{filename:'mascot.js'});
run(\`
startMain();
s.ride=1;
world3d.unlockFracture();
world3d.enterRide(1);world3d.forceBoard(1);
puzzle={failed:true};
const mascotScore=s.K;
offerHelp();
test(s.catStopUsed&&s.K===mascotScore&&!world3d.state.interior.running,'cat stops the first failed ride without keeper points');
$('mascot-return').onclick();
operate(1);puzzle.failed=true;offerHelp();
test($('feedback').textContent.includes('키퍼'),'second failure uses original keeper choices');
startMain();s.ride=1;world3d.enterRide(1);explore3d();
const rideCat=window.NEVERLAND_MASCOT.rideSpot(1);
test(worldQA.valid(rideCat.x,rideCat.z),'ride cat appears on walkable ground');
Object.assign(worldQA.player,rideCat);
test(worldQA.nearest()?.place==='ride','ride cat has a reachable interaction');
startMain();s.ride=3;world3d.enterRide(3);explore3d();
const pet=window.NEVERLAND_MASCOT;
for(let i=0;i<599;i++)worldQA.updateProgress(.05);
test(!pet.guide,'maze hint waits for thirty seconds');
for(let i=0;i<3;i++)worldQA.updateProgress(.05);
test(!!pet.guide&&world3d.interiorValid(pet.guide.x,pet.guide.z),'maze cat begins on a walkable route');
let mascotSteps=0;
while(Math.hypot(worldQA.player.x,worldQA.player.z+8.5)>1.6&&mascotSteps++<180){
 const {x,z}=pet.guide;
 worldQA.player.x=x;worldQA.player.z=z;worldQA.updateProgress(.05);
}
test(mascotSteps<180,'maze guidance reaches the actual white exit');
startMain();
finishChoice(true,'alone');
test(!!pet.reveal&&$('text').textContent.includes('푸른 눈이 금빛'), 'cat transformation begins before the chase');
drain();
const maze=window.NEVERLAND_CHASE_MAZE;
test(!pet.reveal&&maze.stars.length>20,'branching maze loads after the reveal');
test(!worldQA.valid(4,0)&&worldQA.valid(-4,0),'chase collision blocks wall cells');
test(maze.toExit.distance.size===maze.rows.join('').replaceAll('#','').length,'all maze branches connect to the exit route');
const deadEnd=maze.point(8,9);
test(maze.open(maze.cell(deadEnd.x,deadEnd.z))&&!maze.valid(deadEnd.x,deadEnd.z+4),'branch ends at a wall');
test(pet.encounter('ride').includes('가르랑')&&pet.encounter('game').includes('안아')&&pet.encounter('drinks').includes('몸을 비빕니다'),'three locations have distinct interactions');
test(pet.active&&pet.chase.age===0&&worldQA.player.z===0,'escape choice opens chase checkpoint');
worldQA.updateProgress(.05);test(pet.chase.age===0,'timer waits for actual movement');
worldQA.player.z=-.08;worldQA.updateProgress(.05);
for(let i=0;i<170&&!pet.chase.failed;i++)worldQA.updateProgress(.05);
test(pet.chase.failed&&$('overlay').innerHTML.includes('게임 오버'),'monster catches stationary runner');
$('chase-retry').onclick();
test(pet.active&&!pet.chase.failed&&pet.chase.age===0&&worldQA.player.z===0,'retry restores chase checkpoint');
pet.chase.age=63.98;
worldQA.player.z=-.08;
for(let i=0;i<530&&!pet.chase.failed;i++)worldQA.updateProgress(.05);
test(pet.chase.failed&&$('overlay').innerHTML.includes('도착하지 못했습니다'),'time limit gives game over');
$('chase-retry').onclick();
const seconds=driveChase();
test(completedChoice===2&&seconds>28&&seconds<35,'normal walking leaves time to navigate and retains solo ending');console.log('Normal walking run: '+seconds.toFixed(2)+'s');
startMain();Object.assign(s,{K:8,M:4,N:10,I:4,cleared:new Set([0,1,2])});
finishChoice(true,'together');drain();
test(pet.active,'qualified together ending enters chase');
Object.assign(worldQA.player,maze.point(maze.exit.row,maze.exit.col));worldQA.updateProgress(.05);
test(completedChoice===5&&!pet.active,'together chase retains ending five');
\`);
console.log('PASS: cat intervention, real maze navigation, chase timing, capture, timeout, retry, and original exit endings.');
`;
eval(base+checks.replaceAll('\\'+String.fromCharCode(96),String.fromCharCode(96)));
