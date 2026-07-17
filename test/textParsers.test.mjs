/**
 * textParsers.test.mjs — smoke tests for the poem-text markup language, run
 * with `node test/textParsers.test.mjs` from the project root. Pure logic,
 * no DOM/canvas needed at all.
 */
import { buildLines, applyEscapes, tokenizeInline } from '../textParsers.js';
import { readFileSync } from 'fs';

let failures = 0;
function check(label, cond){
  if(!cond){ failures++; console.log('FAIL:', label); }
  else console.log('ok:', label);
}

// nesting
const nested = tokenizeInline('**bold [with accent] still bold**', true, true);
check('bold survives across a nested accent span',
  nested.every(s => s.bold) && nested.some(s => s.color === 'accent1'));

// escaping
const escaped = tokenizeInline(applyEscapes('\\[literal\\] text'), true, true);
check('escaped brackets produce literal uncolored text',
  escaped.map(s=>s.text).join('') === '[literal] text' && escaped.every(s => s.color === null));

// gradient close tolerance (both orderings, both directions)
for(const src of ['{[a]}', '{[a}]', '[{a]}', '[{a}]']){
  const segs = tokenizeInline(src, true, true);
  check(`gradient closes correctly: ${src}`, segs.length === 1 && segs[0].text === 'a');
}

// the actual default poem, read straight from index.html rather than
// retyped here — avoids this test ever drifting out of sync with reality
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const m = html.match(/<textarea id="poemText">([\s\S]*?)<\/textarea>/);
const flood = m[1];

let lines;
try {
  lines = buildLines(flood, true, true);
  check('default Flood poem parses without throwing', true);
  check('produces the expected number of lines', lines.length === 17);
  check('quote lines detected', lines.some(l => l.type === 'quote'));
  check('segmentation parts detected', lines.some(l => l.parts));
} catch(e){
  failures++;
  console.log('FAIL: default poem threw:', e.message);
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : failures+' FAILURES');
process.exit(failures === 0 ? 0 : 1);
