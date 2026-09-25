/**
 * cssReduction.test.mjs — guards the stylesheet against two failure modes of
 * cleaning it up.
 *
 * 1. Fallback pairs. `height:var(--vvh); height:100dvh` sets one property twice
 *    IN ONE BLOCK deliberately: a browser that does not understand dvh drops
 *    that line and keeps the first. A "last one wins" dedupe cannot see that
 *    and deletes the fallback. This happened once.
 *
 * 2. Sediment. Repeated iteration left earlier declarations overridden by
 *    later ones of the exact same selector. Those are dead and were removed;
 *    this keeps the count from quietly climbing back.
 *
 * Run: node test/cssReduction.test.mjs
 */
import { readFileSync } from 'fs';

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const css = readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8');

// ---- fallback pairs must survive ----
check('the app height keeps its --vvh fallback before dvh',
  /height:var\(--vvh\);\s*height:100dvh/.test(css));
check('the tab bar keeps its --vvh fallback before dvh',
  /top:calc\(var\(--vvh\) - var\(--tabbar-h\)\);\s*top:calc\(100dvh - var\(--tabbar-h\)\)/.test(css));

// ---- sediment stays down ----
// Count top-level declarations overridden by a LATER BLOCK of the same
// selector. Same-block repeats are fallbacks and do not count.
function topLevel(src){
  const out = []; let i = 0;
  const clean = src.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
  while(i < clean.length){
    const b = clean.indexOf('{', i); if(b < 0) break;
    const sel = clean.slice(i, b).trim().replace(/\s+/g, ' ');
    let d = 1, j = b + 1;
    while(j < clean.length && d){ if(clean[j] === '{') d++; else if(clean[j] === '}') d--; j++; }
    if(!sel.startsWith('@')) out.push([sel, clean.slice(b + 1, j - 1)]);
    i = j;
  }
  return out;
}
const rules = topLevel(css);
const seen = new Map();
let dead = 0;
rules.forEach(([sel, body], ri) => {
  for(const d of body.split(';')){
    const k = d.split(':')[0].trim();
    if(!k || !d.includes(':')) continue;
    const key = sel + '|' + k;
    if(seen.has(key) && seen.get(key) !== ri) dead++;
    seen.set(key, ri);
  }
});
check('overridden declarations stay near zero', dead <= 10);
if(dead > 10) console.log('   overridden declarations:', dead);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
