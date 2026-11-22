/* A self-contained pixel chase interlude for the mirror maze. */
(function (global) {
  'use strict';
  let active = null;
  const COLS = 23, ROWS = 15, TILE = 32;
  const notes = [110, 130.81, 146.83, 164.81, 146.83, 130.81, 103.83, 98];

  function makeMaze() {
    // Seeded depth-first carving makes a reproducible, completely connected maze.
    let seed = 1937;
    const rand = n => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
    const map = Array.from({length: ROWS}, () => Array(COLS).fill(1));
    const stack = [[1, 1]]; map[1][1] = 0;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const choices = [[2,0],[-2,0],[0,2],[0,-2]].filter(([dx,dy]) =>
        x + dx > 0 && x + dx < COLS - 1 && y + dy > 0 && y + dy < ROWS - 1 && map[y+dy][x+dx]);
      if (!choices.length) { stack.pop(); continue; }
      const [dx,dy] = choices[rand(choices.length)];
      map[y+dy/2][x+dx/2] = map[y+dy][x+dx] = 0;
      stack.push([x+dx,y+dy]);
    }
    // Additional cross passages allow the player to evade the pursuer.
    for (let y=2; y<ROWS-2; y++) for (let x=2; x<COLS-2; x++) {
      if (map[y][x] && rand(100) < 8 && ((!map[y][x-1] && !map[y][x+1]) || (!map[y-1][x] && !map[y+1][x]))) map[y][x] = 0;
    }
    return map;
  }
  function shortest(map, from, target) {
    const key = (x,y) => y * COLS + x;
    const queue = [[from.x,from.y]], seen = new Set([key(from.x,from.y)]), prev = new Map();
    for (let i=0; i<queue.length; i++) {
      const [x,y] = queue[i];
      if (x === target.x && y === target.y) break;
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx=x+dx, ny=y+dy, k=key(nx,ny);
        if (nx<0 || ny<0 || nx>=COLS || ny>=ROWS || map[ny][nx] || seen.has(k)) continue;
        seen.add(k); prev.set(k,[x,y]); queue.push([nx,ny]);
      }
    }
    let step=[target.x,target.y];
    if (!seen.has(key(step[0],step[1]))) return from;
    while (prev.has(key(step[0],step[1]))) {
      const p=prev.get(key(step[0],step[1]));
      if (p[0]===from.x && p[1]===from.y) return {x:step[0],y:step[1]};
      step=p;
    }
    return from;
  }
  function music(level) {
    let context, timer, count=0, stopped=false;
    try {
      const AudioContext = global.AudioContext || global.webkitAudioContext;
      if (!AudioContext) return {stop: () => {}, resume: () => {}, suspend: () => {}};
      context = new AudioContext();
      if (document.hidden && context.state === 'running') context.suspend().catch(() => {});
      else if (!document.hidden && context.state === 'suspended') context.resume().catch(() => {});
      function pulse() {
        if (stopped) return;
        if (document.hidden) { timer=global.setTimeout(pulse,225); return; }
        const t=context.currentTime;
        const oscillator=context.createOscillator(), gain=context.createGain();
        oscillator.type='triangle'; oscillator.frequency.value=notes[count % notes.length] * (count%16 > 11 ? 2 : 1);
        gain.gain.setValueAtTime(0.0001,t); gain.gain.exponentialRampToValueAtTime(Math.max(0.0001,0.025*level),t+0.02); gain.gain.exponentialRampToValueAtTime(0.0001,t+0.21);
        oscillator.connect(gain); gain.connect(context.destination); oscillator.start(t); oscillator.stop(t+0.22);
        if (count%4===0) {
          const bass=context.createOscillator(), envelope=context.createGain(); bass.type='sine'; bass.frequency.setValueAtTime(62,t); bass.frequency.exponentialRampToValueAtTime(38,t+0.16);
          envelope.gain.setValueAtTime(0.05*level,t); envelope.gain.exponentialRampToValueAtTime(0.0001,t+0.19);
          bass.connect(envelope); envelope.connect(context.destination); bass.start(t); bass.stop(t+0.2);
        }
        count++; timer=global.setTimeout(pulse,225);
      }
      pulse();
    } catch (_) { if (context) context.close().catch(() => {}); return {stop: () => {}, resume: () => {}, suspend: () => {}}; }
    return {stop: () => { stopped=true; global.clearTimeout(timer); if(context) context.close().catch(() => {}); }, resume: () => { if(context && !document.hidden && context.state === 'suspended') context.resume().catch(() => {}); }, suspend: () => { if(context && context.state === 'running') context.suspend().catch(() => {}); }};
  }
  function start(options) {
    options=options || {};
    if (active) active.destroy();
    const map=makeMaze(), female=/female|girl|woman|여/i.test(String(options.gender || ''));
    let player={x:1,y:1}, monster={x:COLS-2,y:1}, exit={x:COLS-2,y:ROWS-2};
    let phase='intro', ended=false, raf=0, lastMove=0, lastMonster=0, introAt=performance.now(), held=null;
    const overlay=document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#050815;display:flex;align-items:center;justify-content:center;font-family:monospace;color:#f6e9d4;';
    overlay.innerHTML='<div style="width:min(100vw,1060px);height:min(100dvh,760px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:10px;box-sizing:border-box"><div style="width:100%;display:flex;justify-content:space-between;gap:8px;align-items:center"><strong style="color:#f5c977;letter-spacing:.12em;font-size:clamp(13px,2vw,21px)">NEVERLAND · MIRROR MAZE</strong><span style="font-size:clamp(10px,1.4vw,14px);color:#b6a9d8">방향키 / WASD로 이동 · 빛나는 문으로 탈출</span></div><canvas aria-label="도트 거울 미로 추격 장면" width="736" height="480" style="display:block;max-width:100%;max-height:72%;object-fit:contain;image-rendering:pixelated;border:2px solid #675782;box-shadow:0 0 32px #371e5866;background:#0b0b1b"></canvas><div data-caption style="height:2.4em;text-align:center;line-height:1.4;color:#f6dca9;font-size:clamp(12px,1.6vw,16px)"></div><div data-controls style="display:grid;grid-template-columns:repeat(3,42px);gap:3px;touch-action:none;user-select:none"><span></span><button data-dir="up">▲</button><span></span><button data-dir="left">◀</button><button data-dir="down">▼</button><button data-dir="right">▶</button></div></div>';
    document.body.appendChild(overlay);
    const canvas=overlay.querySelector('canvas'), ctx=canvas.getContext('2d'), caption=overlay.querySelector('[data-caption]');
    overlay.querySelectorAll('button').forEach(button=>{button.style.cssText='background:#29213d;border:1px solid #8b75a2;color:#fff;padding:7px;cursor:pointer;touch-action:none;font-size:18px';});
    const bgm=global.NEVERLAND_BGM, wasMuted=!!bgm?.state?.muted, volume=bgm?.state?.volume ?? .65;
    if (!wasMuted) bgm?.mute(true);
    const chaseMusic=wasMuted || volume <= 0 ? {stop: () => {}, resume: () => {}, suspend: () => {}} : music(volume);
    function visibilityChange(){if(document.hidden){held=null;chaseMusic.suspend();}else chaseMusic.resume();}
    document.addEventListener('visibilitychange',visibilityChange);
    const dirs={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]};
    const names={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
    function move(dir) {
      if (phase!=='chase') return;
      const nx=player.x+dir[0], ny=player.y+dir[1];
      if (nx>=0 && nx<COLS && ny>=0 && ny<ROWS && !map[ny][nx]) {player.x=nx; player.y=ny;}
      if (player.x===exit.x && player.y===exit.y) {
        ended=true; destroy(); if(typeof options.onEscape==='function') options.onEscape(); return;
      }
      checkCaught();
    }
    function keydown(e) {
      chaseMusic.resume();
      if (phase==='caught' && (e.key==='Enter' || e.key===' ')) { e.preventDefault(); reset(); return; }
      if (dirs[e.key]) {e.preventDefault(); e.stopPropagation(); if (!e.repeat) { held=dirs[e.key]; move(held); lastMove=performance.now(); }}
    }
    function keyup(e) {if(dirs[e.key]) {e.preventDefault(); held=null;}}
    function checkCaught() {
      if (phase==='chase' && player.x===monster.x && player.y===monster.y) {
        phase='caught'; held=null; caption.textContent='붙잡혔다… Enter를 눌러 다시 도망치세요.';
      }
    }
    function reset() {player={x:1,y:1}; monster={x:COLS-2,y:1}; phase='chase'; lastMonster=performance.now()+1000; caption.textContent='도망쳐! 빛나는 출구를 찾아.';}
    function drawCharacter(x,y,isMonster,isCat) {
      const px=x*TILE, py=y*TILE;
      if (isCat) {
        ctx.fillStyle='#f8f1e5'; ctx.fillRect(px+8,py+12,16,12); ctx.fillRect(px+6,py+6,5,9); ctx.fillRect(px+21,py+6,5,9); ctx.fillRect(px+22,py+19,6,4);
        ctx.fillStyle='#593d75';ctx.fillRect(px+11,py+15,3,3);ctx.fillRect(px+19,py+15,3,3); return;
      }
      if (isMonster) {
        ctx.fillStyle='#8c3f91'; ctx.fillRect(px+5,py+3,22,25); ctx.fillRect(px+2,py+9,5,18); ctx.fillRect(px+25,py+9,5,18);
        ctx.fillStyle='#e6d8ec';ctx.fillRect(px+9,py+10,5,4);ctx.fillRect(px+19,py+10,5,4);ctx.fillStyle='#e84665';ctx.fillRect(px+12,py+20,10,3);return;
      }
      ctx.fillStyle=female?'#55374c':'#49352f'; ctx.fillRect(px+8,py+3,16,11); if(female){ctx.fillRect(px+6,py+9,4,10);ctx.fillRect(px+22,py+9,4,10);}
      ctx.fillStyle='#e7b28f';ctx.fillRect(px+10,py+8,12,8);
      ctx.fillStyle=female?'#cf7494':'#6b92ad';ctx.fillRect(px+8,py+16,16,9); ctx.fillStyle='#33314b';ctx.fillRect(px+9,py+25,5,5);ctx.fillRect(px+18,py+25,5,5);
    }
    function draw(now) {
      if(ended) return;
      if(phase==='intro') {
        const elapsed=now-introAt;
        caption.textContent=elapsed<2800?'고양이의 그림자가 거울 속에서 일그러진다…':'“도망쳐 봐. 여기서는 아무도 널 구하지 못해.”';
        if(elapsed>5500){phase='chase';lastMonster=now+1000;caption.textContent='도망쳐! 빛나는 출구를 찾아.';}
      }
      if(phase==='chase') {
        if(held && now-lastMove>145){move(held);lastMove=now;if(ended)return;}
        if(now-lastMonster>360){monster=shortest(map,monster,player);lastMonster=now;checkCaught();}
      }
      ctx.fillStyle='#090b19';ctx.fillRect(0,0,canvas.width,canvas.height);
      for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++) {
        const px=x*TILE,py=y*TILE;
        if(map[y][x]) {ctx.fillStyle=(x+y)%2?'#29233d':'#302941';ctx.fillRect(px,py,TILE,TILE);ctx.fillStyle='#51465e';ctx.fillRect(px,py,TILE,3);ctx.fillStyle='#211b30';ctx.fillRect(px,py+28,TILE,4);}
        else {ctx.fillStyle=(x+y)%2?'#17192b':'#1c1d31';ctx.fillRect(px,py,TILE,TILE);if((x*7+y*13)%19===0){ctx.fillStyle='#786488';ctx.fillRect(px+8,py+8,2,2);}}
      }
      const ex=exit.x*TILE,ey=exit.y*TILE;
      ctx.fillStyle='#dcb36d';ctx.fillRect(ex+6,ey+3,20,27);ctx.fillStyle='#b8e9db';ctx.fillRect(ex+10,ey+7,12,21);ctx.fillStyle='#fff3c1';ctx.fillRect(ex+18,ey+17,2,2);
      drawCharacter(player.x,player.y,false,false);
      drawCharacter(monster.x,monster.y,true,phase==='intro' && now-introAt<2800);
      if(phase==='intro'){ctx.fillStyle='rgba(5,4,15,.78)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(canvas.width/2-80,canvas.height/2-94);ctx.scale(5,5);drawCharacter(0,0,true,now-introAt<2800);ctx.restore();}
      if(phase==='caught'){ctx.fillStyle='rgba(10,0,15,.72)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.textAlign='center';ctx.fillStyle='#f1d6d8';ctx.font='bold 28px monospace';ctx.fillText('CAUGHT',canvas.width/2,canvas.height/2);ctx.font='16px sans-serif';ctx.fillText('Enter / 화면을 눌러 다시 시도',canvas.width/2,canvas.height/2+34);}
      raf=requestAnimationFrame(draw);
    }
    function clickRetry(){if(phase==='caught')reset();}
    function pointerDown(e){chaseMusic.resume();const button=e.target.closest('button[data-dir]');if(!button)return;e.preventDefault();held=names[button.dataset.dir];move(held);lastMove=performance.now();}
    function pointerUp(){held=null;}
    function destroy(){if(ended && !overlay.isConnected)return;ended=true;cancelAnimationFrame(raf);chaseMusic.stop();if (!wasMuted) bgm?.mute(false);document.removeEventListener('visibilitychange',visibilityChange);document.removeEventListener('keydown',keydown,true);document.removeEventListener('keyup',keyup,true);overlay.removeEventListener('pointerdown',pointerDown);global.removeEventListener('pointerup',pointerUp);overlay.remove();if(active && active.destroy===destroy)active=null;}
    document.addEventListener('keydown',keydown,true);document.addEventListener('keyup',keyup,true);
    overlay.addEventListener('pointerdown',pointerDown);overlay.addEventListener('click',clickRetry);global.addEventListener('pointerup',pointerUp);
    active={destroy};raf=requestAnimationFrame(draw);return active;
  }
  global.NeverlandChase={start, close: () => { if (active) active.destroy(); }};
})(window);

