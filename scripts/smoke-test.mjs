import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/<!doctype html>/i,'Missing HTML doctype');
assert.match(html,/<canvas\b[^>]*id="game"/,'Missing game canvas');
assert.match(html,/id="start"/,'Missing start control');
assert.match(html,/id="overlay"/,'Missing start screen');
assert.match(html,/name="viewport"/,'Missing responsive viewport');
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
assert.equal(inline.length,1,'Expected one inline game script');
new vm.Script(inline[0],{filename:'game.js'});
for(const marker of ['requestAnimationFrame','pointerdown','keydown','newGame()','platforms','enemies','coins','camera'])assert.ok(inline[0].includes(marker),'Missing core feature: '+marker);
console.log('PASS — HTML structure, game JavaScript syntax, and core gameplay assets.');
