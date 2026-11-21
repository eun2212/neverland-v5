'use strict';
// Exercise each ride without a GPU or network; browser rendering is checked separately.
const assert = require('assert');
const vm = require('vm');
const fs = require('fs');
let nextTimer = 0, now = 0, timers = new Map();
function setTimer(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, at: now + delay }); return id; }
function advance(ms) { const end = now + ms; while (true) { let first = null; for (const [id, t] of timers) if (t.at <= end && (!first || t.at < first.t.at)) first = { id, t }; if (!first) break; now = first.t.at; timers.delete(first.id); first.t.fn(); } now = end; }
class Element {
  constructor(tag = 'div') { this.tag = tag; this.children = []; this.parent = null; this.listeners = {}; this.attrs = {}; this.style = { setProperty(k, v) { this[k] = v; } }; this.classList = { add() {}, toggle() {} }; this.isConnected = true; this.textContent = ''; }
  set innerHTML(value) { this.html = value; if (value.includes('ride-interaction__controls')) { for (const key of ['h2', 'ride-interaction__hint', 'ride-interaction__status', 'ride-interaction__scene', 'ride-interaction__controls', 'ride-interaction__refuse']) { const e = new Element(key); e.className = key; this.append(e); } } }
  setAttribute(k,v) { this.attrs[k] = v; }
  append(...elements) { for (const e of elements) { e.parent = this; this.children.push(e); } }
  setPointerCapture() {}
  getBoundingClientRect() { return {top:0,left:0,height:200,width:200}; }
  remove() { this.isConnected = false; if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this); }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  emit(name, extra = {}) { for (const fn of this.listeners[name] || []) fn({ key: '', button: 0, preventDefault() {}, ...extra }); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) { const out = []; const visit = n => { for (const c of n.children) { if ((selector[0] === '.' && c.className?.split(' ').includes(selector.slice(1))) || selector === c.tag) out.push(c); visit(c); } }; visit(this); return out; }
}
const document = { body: new Element(), createElement: tag => new Element(tag), createElementNS: (_, tag) => new Element(tag) };
const window = {};
vm.runInNewContext(fs.readFileSync('ride-interactions.js', 'utf8'), { document, window, setTimeout: setTimer, clearTimeout: id => timers.delete(id) });
function mount(ride) { const parent = new Element(), calls = []; const ui = window.NEVERLAND_RIDE_INTERACTIONS.mount(parent, { ride, onStart: result => calls.push(result) }); return { parent, root: parent.children[0], calls, ui }; }
function reset() { now = 0; timers = new Map(); }
for (const ride of [1, 2, 4]) {
  reset(); const x = mount(ride);
  if (ride === 1) x.root.querySelectorAll('.ride-interaction__star').forEach(star => star.emit('click'));
  else { const wheel = x.root.querySelector(ride === 4 ? '.ride-interaction__pot' : '.ride-interaction__wheel'); for (let i = 0; i < 10; i++) wheel.emit('keydown', { key: ride === 4 ? 'ArrowDown' : 'ArrowRight' }); }
  assert.deepStrictEqual(JSON.parse(JSON.stringify(x.calls)), [{ forced: false }], `ride ${ride}: direct completion`);
  advance(60000); assert.strictEqual(x.calls.length, 1, `ride ${ride}: completion fires once`);
  reset(); const y = mount(ride); y.root.querySelector('.ride-interaction__refuse').emit('click'); advance(10000);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(y.calls)), [{ forced: true }], `ride ${ride}: refusal`);
  reset(); const z = mount(ride); advance(25000); assert.ok(z.root.querySelector('.ride-interaction__status').textContent.includes('키퍼')); assert.strictEqual(z.calls.length, 0); advance(23000); assert.deepStrictEqual(JSON.parse(JSON.stringify(z.calls)), [{ forced: true }], `ride ${ride}: idle`);
  reset(); const w = mount(ride); w.root.querySelector('.ride-interaction__refuse').emit('click'); w.ui.destroy(); advance(60000); assert.strictEqual(w.calls.length, 0, `ride ${ride}: destroy`);
}
for (const ride of [2,4]) { reset(); const x=mount(ride); x.root.querySelector(ride === 4 ? '.ride-interaction__pot' : '.ride-interaction__wheel').emit('keydown',{key:ride === 4 ? 'ArrowUp' : 'ArrowLeft'}); advance(10000); assert.deepStrictEqual(JSON.parse(JSON.stringify(x.calls)),[{forced:true}],`ride ${ride}: reverse`); }
reset(); const stars=mount(1); stars.root.querySelector('.ride-interaction__refuse').emit('click'); advance(2750); assert.ok(Math.abs(parseFloat(stars.root.style['--hand-x'])-19.04)<.01); assert.ok(Math.abs(parseFloat(stars.root.style['--hand-y'])-68)<.01); advance(500); assert.ok(Math.abs(parseFloat(stars.root.style['--hand-x'])-33.66)<.01); assert.ok(Math.abs(parseFloat(stars.root.style['--hand-y'])-35.6)<.01); stars.ui.destroy();
reset(); const pour=mount(4); const pot=pour.root.querySelector('.ride-interaction__pot'); assert.ok(pot.html.includes('assets/teacup-teapot.png'),'teapot uses its illustrated asset'); const beforeHandY=parseFloat(pour.root.style['--hand-pour-y']); pot.emit('pointerdown',{pointerId:1,clientY:0}); pot.emit('pointermove',{pointerId:1,clientY:90}); assert.ok(Number.isFinite(beforeHandY) && parseFloat(pour.root.style['--hand-pour-y']) > beforeHandY, 'glove follows the descending teapot handle'); assert.deepStrictEqual(JSON.parse(JSON.stringify(pour.calls)),[{forced:false}],'teapot pointer drag pours to completion');
let notes = 0;
window.AudioContext = class { constructor(){this.state='running';this.currentTime=0;this.destination={};} createOscillator(){return {frequency:{setValueAtTime(){}},connect(g){return g;},start(){notes++;},stop(){},disconnect(){}};} createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};} };
window.NEVERLAND_BGM={state:{muted:false}}; window.NEVERLAND_TOOLS={settings:{volume:65}};
reset(); const sound=mount(2); assert.equal(notes,0,'audio never starts on mount'); sound.root.querySelector('.ride-interaction__wheel').emit('keydown',{key:'ArrowRight'}); assert.equal(notes,1,'manual winding plays music');
window.NEVERLAND_BGM.state.muted=true; sound.root.querySelector('.ride-interaction__wheel').emit('keydown',{key:'ArrowRight'}); assert.equal(notes,1,'mute prevents notes');
reset(); notes=0; window.NEVERLAND_BGM.state.muted=false; const forced=mount(2); forced.root.querySelector('.ride-interaction__refuse').emit('click'); advance(10000); assert.equal(notes,0,'forced winding does not autoplay audio');
console.log('ride interactions: direct, refusal, idle, reverse, keyboard, cancellation and single completion passed');
