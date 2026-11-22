'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('story-3d.js','utf8');
const begin=source.indexOf('let mirrorChaseTimer='),end=source.indexOf('function updateRideUI()',begin);
assert(begin>=0&&end>begin,'mirror integration functions present');
const sandbox={console,window:{NEVERLAND_MASCOT:{resetMaze(){},enableMirrorGuide(){sandbox.guides++}},NeverlandChase:{start(options){sandbox.starts.push(options)}}},guides:0,starts:[],timers:new Map(),nextTimer:1,buttons:{},s:{gender:'male',ride:3},pendingRideResult:{kind:'mirror',help:false,risk:false},world3d:{state:{interior:{ride:3}},configure(){},notify(){},fracturePulse(){sandbox.pulses++},leaveRide(){sandbox.world3d.state.interior=null},animateRide(){},},pulses:0,completions:0,releases:0,sync3d(){},releaseForcedRide3d(){sandbox.releases++},commitSafeRide3d(){sandbox.completions++},modal(){sandbox.buttons={'mirror-guide-yes':{},'mirror-guide-no':{}}},close(){},explore3d(){},$(id){return sandbox.buttons[id]},setTimeout(fn,ms){const id=sandbox.nextTimer++;sandbox.timers.set(id,{fn,ms});return id},clearTimeout(id){sandbox.timers.delete(id)}};
vm.createContext(sandbox);
vm.runInContext(source.slice(begin,end)+'\nthis.api={offerMirrorGuide3d,cancelMirrorChase3d,finishMirror3d};',sandbox);
const {api}=sandbox;
function enter(){sandbox.world3d.state.interior={ride:3};api.offerMirrorGuide3d()}
function accept(){sandbox.buttons['mirror-guide-yes'].onclick()}
function refuse(){sandbox.buttons['mirror-guide-no'].onclick()}
enter();refuse();assert.equal(sandbox.starts.length,1,'refusal starts chase immediately');assert.equal(sandbox.starts[0].gender,'male');sandbox.starts[0].onEscape();assert.equal(sandbox.completions,1,'chase escape uses normal mirror completion');assert.equal(sandbox.releases,1);
enter();accept();assert.equal(sandbox.guides,1,'accepted help starts guide');assert.equal(sandbox.starts.length,1,'accepting help does not start chase immediately');let timer=[...sandbox.timers.values()][0];assert.equal(timer.ms,30000,'timer starts at 30 seconds');timer.fn();assert.equal(sandbox.starts.length,2,'elapsed timer starts chase');sandbox.starts[1].onEscape();
enter();accept();timer=[...sandbox.timers.values()][0];api.finishMirror3d();assert.equal(sandbox.timers.size,0,'early mirror exit cancels timer');timer.fn();assert.equal(sandbox.starts.length,2,'cancelled timer cannot trigger after exit');
enter();accept();timer=[...sandbox.timers.values()][0];api.cancelMirrorChase3d();sandbox.world3d.state.interior=null;timer.fn();assert.equal(sandbox.starts.length,2,'leaving cancels chase');
enter();accept();const stale=[...sandbox.timers.values()][0];api.cancelMirrorChase3d();enter();accept();stale.fn();assert.equal(sandbox.starts.length,2,'old visit cannot start chase in new visit');[...sandbox.timers.values()][0].fn();assert.equal(sandbox.starts.length,3,'new visit can trigger its own chase');
console.log('PASS: mirror refusal, accepted help, 30s timeout, early exit, leaving, re-entry and escape completion.');
