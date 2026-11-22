const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=fs.readFileSync(path.join(__dirname,'verify-full-story.cjs'),'utf8');
const checks=String.raw`
sandbox.document.body.append=function(){};
let delayed;
sandbox.setTimeout=fn=>{delayed=fn;return 1;};
sandbox.clearTimeout=()=>{delayed=null;};
sandbox.finishScare=()=>delayed?.();
const sound={started:0,stops:0};
sandbox.sound=sound;
sandbox.AudioContext=class{
 constructor(){this.currentTime=0;this.destination={};}
 createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
 createOscillator(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(node){return node;},disconnect(){},start(){sound.started++;},stop(at){if(at===undefined)sound.stops++;}};}
};
let chaseClock=2e8;
sandbox.driveChase=(sprint=false)=>{
 const pet=sandbox.NEVERLAND_MASCOT,maze=sandbox.NEVERLAND_CHASE_MAZE,player=sandbox.worldQA.player;
 let frames=0;
 if(sprint)handlers.keydown({key:'Shift',repeat:false,preventDefault(){}});
 for(const target of maze.stars.slice(1)){
  player.yaw=Math.atan2(player.x-target.x,player.z-target.z);
  handlers.keydown({key:'w',repeat:false,preventDefault(){}});
  while(pet.active&&!pet.chase.failed&&Math.hypot(player.x-target.x,player.z-target.z)>.07&&frames<64*60){
   frames++;frame(chaseClock+=1000/60);
   if(pet.active&&!maze.valid(pet.chase.monster.x,pet.chase.monster.z))throw Error('pursuer crossed a wall');
  }
  handlers.keyup({key:'w'});
 }
 if(sprint)handlers.keyup({key:'Shift'});
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
for(let i=0;i<602;i++)worldQA.updateProgress(.05);
test(!pet.guide,'maze cat waits until the player accepts help');
pet.enableMirrorGuide();
worldQA.updateProgress(.05);
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
const edges=maze.rows.reduce((total,line,row)=>total+[...line].reduce((count,kind,col)=>count+(kind==='#'?0:Number(maze.open({row:row+1,col}))+Number(maze.open({row,col:col+1}))),0),0);
test(edges-maze.toExit.distance.size+1>=3,'at least three independent loops connect alternative routes');
test(!worldQA.valid(4,0)&&worldQA.valid(-4,0),'chase collision blocks wall cells');
test(maze.toExit.distance.size===maze.rows.join('').replaceAll('#','').length,'all maze branches connect to the exit route');
const deadEnd=maze.point(8,9);
test(maze.open(maze.cell(deadEnd.x,deadEnd.z))&&!maze.valid(deadEnd.x,deadEnd.z+4),'branch ends at a wall');
test(pet.encounter('ride').includes('가르랑')&&pet.encounter('game').includes('안아')&&pet.encounter('drinks').includes('몸을 비빕니다'),'three locations have distinct interactions');
test(pet.active&&pet.chase.age===0&&worldQA.player.z===0,'escape choice opens chase checkpoint');
test(Math.abs(worldQA.player.yaw-Math.PI)<.01&&pet.chase.monster.z>0,'checkpoint faces the pursuer down the open corridor');
const idleMonsterZ=pet.chase.monster.z;
worldQA.updateProgress(.05);
test(pet.chase.age===0&&pet.chase.monster.z<idleMonsterZ,'pursuer approaches even while the timer waits for actual movement');
worldQA.player.z=-.08;worldQA.updateProgress(.05,true);
test(pet.chase.age===.05&&idleMonsterZ-pet.chase.monster.z>.2,'first movement starts the timer and accelerates the pursuer');
for(let i=0;i<170&&!pet.chase.failed;i++)worldQA.updateProgress(.05);
test(window.sound.started>3,'chase emits proximity sounds before capture');
test(pet.chase.failed&&pet.chase.scare,'capture opens the close-up before game over');
test(!($('overlay').innerHTML||'').includes('게임 오버'),'game over waits for the close-up');
const stops=window.sound.stops;
finishScare();
test(window.sound.stops>stops,'game over cuts off the scream');
test(!pet.chase.scare&&$('overlay').innerHTML.includes('게임 오버'),'close-up leads to game over');
const previousBgm=window.NEVERLAND_BGM;
window.NEVERLAND_BGM={state:{muted:true},update(){}};
const startedVoices=window.sound.started;
$('chase-retry').onclick();
test(window.sound.started===startedVoices,'muting suppresses the checkpoint scream');
window.NEVERLAND_BGM=previousBgm;
test(pet.active&&!pet.chase.failed&&pet.chase.age===0&&worldQA.player.z===0,'retry restores chase checkpoint');
pet.chase.age=63.98;
worldQA.player.z=-.08;worldQA.updateProgress(.05,true);
for(let i=0;i<530&&!pet.chase.failed;i++)worldQA.updateProgress(.05);
test(pet.chase.failed&&$('overlay').innerHTML.includes('도착하지 못했습니다'),'time limit gives game over');
$('chase-retry').onclick();
driveChase();
test(pet.chase?.failed&&completedChoice===null,'normal walking is too slow to escape');
finishScare();$('chase-retry').onclick();
const seconds=driveChase(true);
test(completedChoice===2&&seconds<25,'sprinting reaches the exit and retains the solo ending');
console.log('Sprint run: '+seconds.toFixed(2)+'s');
startMain();Object.assign(s,{K:8,M:4,N:10,I:4,cleared:new Set([0,1,2])});
finishChoice(true,'together');drain();
test(pet.active,'qualified together ending enters chase');
Object.assign(worldQA.player,maze.point(maze.exit.row,maze.exit.col));worldQA.updateProgress(.05,true);
test(completedChoice===5&&!pet.active,'together chase retains ending five');
\`);
console.log('PASS: cat intervention, real maze navigation, chase timing, capture, timeout, retry, and original exit endings.');
`;
eval(base+checks.replaceAll('\\'+String.fromCharCode(96),String.fromCharCode(96)));
