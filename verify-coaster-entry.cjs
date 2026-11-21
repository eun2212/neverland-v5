'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
class E {
 constructor(){ this.hidden=false; this.classList={add(){},remove(){}}; this.parts={}; }
 set innerHTML(v){ this.html=v; this.parts.h2=new E(); this.parts['[role=status]']=new E(); this.parts['[data-coaster-leave]']=new E(); }
 querySelector(s){ return this.parts[s]; } setAttribute(){} focus(){}
}
let options=null, destroyed=0, returned=0;
const body = new E(); body.append=()=>{};
const window={NEVERLAND_LAYOUT:{coaster:{name:'별바람 롤러코스터'}},NEVERLAND_COASTER_SAFETYBAR:{mount(shell,opts){options=opts;return{destroy(){destroyed++;}};}}};
vm.runInNewContext(fs.readFileSync('coaster.js','utf8'),{window,document:{body,createElement:()=>new E()},performance:{now:()=>123}});
const coaster=window.NEVERLAND_COASTER;
coaster.open(()=>returned++); assert.equal(coaster.active,true); assert.ok(options,'safety bar mounts immediately');
options.onCancel(); assert.equal(coaster.active,false); assert.equal(returned,1,'cancel returns to park');
coaster.open(()=>returned++); const launch=options; launch.onStart(); assert.equal(coaster.active,true); assert.ok(destroyed>0,'safety bar is cleaned on start');
coaster.close(true); assert.equal(coaster.active,false); assert.equal(returned,2,'running ride can return');
coaster.open(()=>returned++); coaster.close(false); assert.equal(returned,2,'close without return preserves callback contract');
console.log('PASS: coaster opens safety bar directly, cancels to park, starts and closes');
