// Verify the restored first Captain Hook interaction in the story harness.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
let suite=fs.readFileSync(path.join(__dirname,'verify-full-story.cjs'),'utf8');
suite+=`
vm.runInContext(fs.readFileSync(path.join(root,'keeper-story.js'),'utf8'),sandbox,{filename:'keeper-story.js'});
run(\`newGame();s.keeperIntroduced=true;firstLever3d=true;world3d.enterRide(0);world3d.forceBoard(0);keeperFirstBoarding3d();drain();
test($('choices').children.length===4,'boarding menu available');$('choices').children[3].onclick();test(s.phase==='tutorial'&&keeperStoryState.ready,'first lever opens');
test(typeof $('lever').oninput==='function'&&typeof $('launch').onclick==='function','original slider and launch are connected');
$('lever').oninput({target:{value:'60'}});test($('launch').disabled,'launch remains disabled before GO');
$('lever').oninput({target:{value:'100'}});test(!$('launch').disabled,'GO enables launch button');$('launch').onclick();test(!world3d.state.interior.running,'story precedes ride');drain();test(world3d.state.interior.running&&pendingRideResult.kind==='tutorial','launch dialogue starts real ride');\`);
console.log('PASS: restored Captain Hook slider, launch button, dialogue and first ride');
`;
vm.runInThisContext('(function(require,__dirname){'+suite+'\n})',{filename:__filename})(require,__dirname);
