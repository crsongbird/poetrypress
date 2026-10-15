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

// "Wanting", the old default poem, kept as a fixture (the app opens on a welcome page now)
const flood = readFileSync(new URL('./fixtures/wanting.pml', import.meta.url), 'utf8');

let lines;
try {
  lines = buildLines(flood, true, true);
  check('default poem parses without throwing', true);
  check('produces the expected number of lines', lines.length === 20);
  // NOTE: quote-line detection is tested on its own literal input below --
  // asserting it here only worked while the default poem happened to contain
  // a '>' line, which is not a property of the parser.
  check('segmentation parts detected', lines.some(l => l.parts));
} catch(e){
  failures++;
  console.log('FAIL: default poem threw:', e.message);
}

// Quote lines, tested directly rather than via whatever the default poem is
const quoted = buildLines('> a line held apart', true, true)[0];
check('a > prefix produces a quote line', quoted.type === 'quote');
check('the > prefix is stripped from the text',
  quoted.segments.map(s => s.text).join('') === 'a line held apart');
check('quote lines are italicised', quoted.segments.every(s => s.italic));


// ---- rules: --- and its directives ----
{
  const P = await import('../textParsers.js');
  const r = t => P.parseRule(t, true, true);
  check('--- is a rule, and [---] {---} take the accents', r('---').color === null && r('[---]').color === 'accent1' && r('{---}').color === 'accent2');
  check('<---/50%/c> sets width and alignment; the \\ form works too',
    r('<---/50%/c>').width === 0.5 && r('<---/50%/c>').align === 'c' && r('<---\\25%\\r>').width === 0.25 && r('<---\\25%\\r>').align === 'r');
  check('rules take scale:N and the words left / center / right', r('<---/scale:50/center>').width === 0.5 && r('<---/scale:50/center>').align === 'c');
  check('a rule can take its own color', r('<---/#:ff00aa>').customColor === '#ff00aa');
  check('rules take a stitch and a side', r('<---/vine/up/60%>').style === 'vine' && r('<---/vine/up/60%>').side === -1);
  check('rules take a motif size and a thread weight', r('<---/wave/size:150/weight:200>').size === 150 && r('<---/wave/size:150/weight:200>').weight === 200);
  check('--- with words after it, or four dashes, stays text', r('--- text') === null && r('----') === null);
  check('a rule is a blank line that carries it (layout treats it as a blank line)',
    P.buildLines('a\n---\nb', true, true)[1].isBlank === true && !!P.buildLines('a\n---\nb', true, true)[1].rule);
  check('a plain name has segments, not parts (the credit reads both shapes)', (l => !l.parts && !!l.segments)(P.buildLines('@ruby', true, true)[0]));
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : failures+' FAILURES');
process.exit(failures === 0 ? 0 : 1);
