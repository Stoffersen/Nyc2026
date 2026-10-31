import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8');
assert.match(html,/<!doctype html>/i);
assert.match(html,/<canvas[^>]+id="scene"/);
assert.match(html,/id="start"/);
assert.match(html,/name="viewport"/);
assert.match(html,/assets\/nyc-family-sprite\.jpg/);
const match=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.equal(match.length,1);
const src=match[0][1];
new vm.Script(src,{filename:'merge-game.js'});
for(const f of ['function merge(','function drop(','function physics(','function lose(','function drawTile(','pointerdown','pointerup','localStorage','requestAnimationFrame'])
 assert.ok(src.includes(f),'Missing '+f);
const photo=fs.readFileSync(new URL('assets/nyc-family-sprite.jpg',root));
assert.ok(photo.length>2000);
assert.equal(photo[0],0xff);assert.equal(photo[1],0xd8);
const events={};const elements=new Map();let scheduled=null;const fakeGradient={addColorStop(){}};
const ctx=new Proxy({createLinearGradient:()=>fakeGradient,createRadialGradient:()=>fakeGradient,measureText:()=>({width:50})},{get(t,k){if(k in t)return t[k];return ()=>{}},set(t,k,v){t[k]=v;return true}});
const makeElement=(name)=>({id:name,textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){}},addEventListener(type,cb){events[name+':'+type]=cb},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){}});
const canvas=makeElement('scene');elements.set('#scene',canvas);
const document={querySelector(sel){if(!elements.has(sel))elements.set(sel,makeElement(sel));return elements.get(sel)}};
class ImageStub{set src(x){this._src=x}get src(){return this._src}}
const storage=new Map();
const sandbox={document,Image:ImageStub,innerWidth:950,innerHeight:820,devicePixelRatio:1,performance:{now:()=>0},Math,console,
 navigator:{vibrate:()=>{}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
 addEventListener:(type,cb)=>{events['window:'+type]=cb},requestAnimationFrame:cb=>{scheduled=cb},
 AudioContext:undefined,webkitAudioContext:undefined};
vm.runInNewContext(src,sandbox,{timeout:4000});
assert.ok(events['#start:click'],'Missing start button handler');
events['#start:click']();
assert.ok(scheduled,'Animation was not scheduled');
for(let i=1;i<8;i++){const next=scheduled;next(i*16.67)}
assert.ok(events['scene:pointerdown']&&events['scene:pointerup'],'Missing pointer handlers');
for(let n=0;n<4;n++){
 events['scene:pointerdown']({clientX:475,pointerId:1,preventDefault(){}});
 events['scene:pointerup']({clientX:475,pointerId:1,preventDefault(){}});
 for(let i=1;i<=32;i++){const next=scheduled;next((10+n*40+i)*16.67)}
}
assert.ok(elements.get('#score').textContent!==undefined,'Score UI missing');
assert.ok(events['#pause:click'],'Missing pause handler');
events['#pause:click']();assert.equal(elements.get('#pause').textContent,'▶ Fortsæt');
events['#pause:click']();assert.equal(elements.get('#pause').textContent,'Ⅱ Pause');
console.log('PASS: HTML structure, sprite, syntax, interactive game loop, drop controls, pause and render.');
