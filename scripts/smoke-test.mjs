import fs from 'node:fs';
import assert from 'node:assert/strict';

const base=new URL('../',import.meta.url);
const html=fs.readFileSync(new URL('index.html',base),'utf8');
const source=fs.readFileSync(new URL('game3d.js',base),'utf8');
const legacy=fs.readFileSync(new URL('legacy-2d.html',base),'utf8');
const merge=fs.readFileSync(new URL('merge.html',base),'utf8');
const photo=fs.readFileSync(new URL('assets/nyc-family-sprite.jpg',base));

assert.match(html,/<canvas id="view"/);
assert.match(html,/<script type="module" src="\.\/game3d\.js"><\/script>/);
assert.match(html,/id="puzzle"/);
assert.match(html,/id="cookUI"/);
assert.match(html,/id="controls"/);
assert.match(html,/id="loading"/);
assert.match(source,/import \* as THREE from 'https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.1\/build\/three\.module\.js'/);
assert.match(source,/new THREE.WebGLRenderer/);
assert.match(source,/renderer\.shadowMap\.enabled=true/);
assert.match(source,/THREE.ACESFilmicToneMapping/);
assert.match(source,/new THREE.PerspectiveCamera/);
assert.match(source,/cam\(-2,5\.3,7\.8,\.7,1\.25,0,true\)/,'Airport camera must begin inside terminal');
assert.ok(!source.includes("box(135,8,.35,'#7b9aa9',51,4,10.7"),'Opaque wall must not block camera');
assert.match(source,/portrait\?8:9/,'The chase camera must stay in front of terminal wall');
assert.match(source,/const portrait=innerHeight>innerWidth/,'Camera should handle portrait iPhone screens');
assert.match(source,/camera\.fov=mobile\?68:57/,'Portrait camera must widen the vertical view');
assert.match(source,/Math\.min\(devicePixelRatio\|\|1,mobile\?1\.5:2\)/,'Render resolution should be capped for mobile');

assert.match(source,/function attachPortrait\(/);
assert.match(source,/assets\/nyc-family-sprite\.jpg/);
assert.ok(source.includes('buildNYC(0);world={...world,stop:0,board:'));
for(const section of ['setup1','setup2','setup3','setup4','physics1','physics2','physics3','solve','foodSpawn','foodSelect','deliver']){
 assert.match(source,new RegExp('function '+section+'\\('),'Missing '+section);
}
const withoutImport=source.replace(/^import \* as THREE from [^\n]+\n/,'');
assert.notEqual(withoutImport,source,'Import statement was not removed');
new Function(withoutImport);

const puzzles=[
 [[2,3,5],7],[[1,4,6],11],[[2,5,8],10],
 [[3,4,7],14],[[1,6,9],16],[[4,7,8],19]
];
for(const [values,goal] of puzzles){
 const possible=[0,1,2,3,4,5,6,7].some(mask=>values.reduce((sum,val,i)=>sum+((mask>>i)&1?val:0),0)===goal);
 assert.ok(possible,'Unsolvable elevator puzzle: '+goal);
}
assert.ok(legacy.includes('Kapløb til flyet'),'2D backup missing');
assert.ok(merge.includes('NYC Memories'),'Original merge game backup missing');
assert.ok(photo.length>2000,'Family photo sprite is empty');
assert.deepEqual([...photo.subarray(0,2)],[0xff,0xd8]);
console.log('PASS: WebGL 3D structure, PBR lighting, four levels, JS syntax, elevator puzzles, backups and photo asset.');
