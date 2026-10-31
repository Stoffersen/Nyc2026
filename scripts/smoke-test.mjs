import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8');
const sprite=fs.readFileSync(new URL('assets/nyc-family-sprite.jpg',root));
assert.equal(sprite[0],0xff);
assert.equal(sprite[1],0xd8);
assert.ok(sprite.length>2000);
assert.match(html,/FAMILY QUEST/);
assert.match(html,/href="merge.html"/);
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,1);
const original=scripts[0][1];
new vm.Script(original);
for(const phrase of ['Kapløb til flyet','Ditte i M&M’S Store','Elevatoren til toppen','New York Food Quest','function physics1(','function physics2(','function solve(','function foodTap(','function foodSpawn(','function serveFood(']){
  assert.ok(original.includes(phrase),'Missing '+phrase);
}
const injected=original.replace(/\}\)\(\);\s*$/,'window.__qa={startLevel,pass,finish,game:()=>game,mode:()=>mode,level:()=>level,toggleSwitch,solve,foodSpawn,foodTap,serveFood};})();');
assert.ok(injected.includes('window.__qa={'));
const E={},elements=new Map(),gradient={addColorStop(){}};let scheduled=null;
const canvasContext=new Proxy({
 createLinearGradient:()=>gradient,createRadialGradient:()=>gradient
},{get(obj,key){return key in obj?obj[key]:()=>{}},set(obj,key,val){obj[key]=val;return true}});
const createElement=key=>({
 textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){}},
 addEventListener:(type,cb)=>E[key+':'+type]=cb,getContext:()=>canvasContext,
 setPointerCapture(){},setAttribute(){},getBoundingClientRect:()=>({left:0,top:0})
});
const doc={querySelector(key){if(!elements.has(key))elements.set(key,createElement(key));return elements.get(key)},getElementById(id){return this.querySelector('#'+id)}};
class ImgStub{set src(v){this._src=v}}
class Param{setValueAtTime(){} exponentialRampToValueAtTime(){}}
class AudioNode{constructor(){this.gain=new Param();this.frequency=new Param()}connect(){return this}start(){}stop(){}}
class AudioStub{constructor(){this.currentTime=0;this.state='running';this.destination=new AudioNode()}createGain(){return new AudioNode()}createOscillator(){return new AudioNode()}resume(){}}
const window={devicePixelRatio:1,AudioContext:AudioStub};
const sandbox={window,document:doc,Image:ImgStub,addEventListener:(key,fn)=>E['window:'+key]=fn,requestAnimationFrame:fn=>scheduled=fn,Math,console};
vm.runInNewContext(injected,sandbox,{timeout:5000});
assert.ok(scheduled,'Animation loop absent');
scheduled(16);
assert.equal(window.__qa.mode(),'panel');
assert.ok(E['#dialogStart:click']);
E['#dialogStart:click']();
assert.equal(window.__qa.level(),1);
for(let i=0;i<30;i++)scheduled(i*16);
for(const level of [1,2,3,4]){
 window.__qa.startLevel(level);
 for(let i=0;i<20;i++)scheduled((i+200+level*20)*16);
 assert.equal(window.__qa.level(),level);
 assert.equal(window.__qa.mode(),'play');
}
window.__qa.startLevel(3);
for(let floor=0;floor<6;floor++){
 const p=window.__qa.game().puzzles[floor];
 const mask=Array.from({length:8},(_,i)=>i).find(m=>p.v.reduce((sum,v,i)=>sum+((m>>i&1)?v:0),0)===p.goal);
 assert.notEqual(mask,undefined,'Impossible elevator floor '+floor);
 for(let i=0;i<3;i++)if((mask>>i)&1)window.__qa.toggleSwitch(i);
 window.__qa.solve();
}
assert.equal(window.__qa.mode(),'panel','Elevator should lead to success transition');
window.__qa.startLevel(4);
const g=window.__qa.game();
for(let stop=0;stop<4;stop++){
 g.board[0]=g.orders[stop];g.chosen=0;window.__qa.serveFood();
}
assert.equal(window.__qa.mode(),'panel','Final level should show completion panel');
assert.match(elements.get('#dialogHeading').innerHTML,/CHAMPIONS/);
console.log('PASS: four levels, sprite asset, intro, animation, all elevator puzzles, food deliveries, final victory.');
