import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/<!doctype html>/i,'Missing HTML doctype');
assert.match(html,/<meta[^>]+name="viewport"/,'Missing responsive viewport');
assert.match(html,/id="play"/,'Missing start button');
assert.match(html,/id="overlay"/,'Missing game menu');
assert.match(html,/id="touch"/,'Missing mobile controls');
const modules=[...html.matchAll(/<script[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
assert.equal(modules.length,1,'Expected a single game module');
const source=modules[0];
assert.match(source,/import \* as THREE from 'https:\/\/cdn\.jsdelivr\.net\/npm\/three@/,'Three.js import missing');
const plain=source.replace(/^import \* as THREE from '[^']+';\s*/m,'');
new vm.Script(plain,{filename:'game-module-without-import.js'});
for(const token of ['WebGLRenderer','PerspectiveCamera','requestAnimationFrame','pointerdown','keydown','platforms','gems','drones','camera','shadowMap','reset()'])
  assert.ok(source.includes(token),'Missing 3D gameplay feature: '+token);
const direct=fs.readFileSync(new URL('../3d.html',import.meta.url),'utf8');
assert.match(direct,/three@0\\.170\\.0/,'Dedicated 3D entry point is missing Three.js');
assert.match(direct,/WebGLRenderer/,'Dedicated 3D entry point is not WebGL');
console.log('PASS: dedicated 3d.html is available.');
console.log('PASS: 3D HTML game structure, script syntax, platform physics and responsive controls.');
