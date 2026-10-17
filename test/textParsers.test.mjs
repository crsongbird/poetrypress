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

// blocks over lines and nesting (Ruby: "treat [] {} like a pseudo segment operator and allow it (and the normal
// segment operator) to split lines … it should still allow hierarchy")
{
  const L = t => buildLines(t, true, true), col = l => (l.parts ? l.parts.flatMap(p => p.segments) : l.segments);
  const text = l => col(l).map(s => s.text).join('');
  const a = L("[You can't bottle what you\nCan't understand.]");
  check('a bracket left open runs on over the lines until it closes (no stray closer left)', a.every(l => col(l).every(s => s.color === 'accent1')) && text(a[1]) === "Can't understand.");
  const b = L('[This is a stanza\nThat should be colored\nAnd centered]/c');
  check('…alignment after its closer aligns every line of the block', b.every(l => l.alignOverride === 'center' && col(l).every(s => s.color === 'accent1')));
  const c = L('{[Were doing something strange\nBut bear with me, dear}]/jitter:200/f:12');
  check('…other directives after its closer make it a segment, line by line', c.every(l => l.parts && l.parts.length === 1 && l.parts[0].customJitter === 200 && l.parts[0].customFontIdx === 12 && col(l).every(s => s.color === 'gradFwd')));
  check('a segment runs over lines too', L('<line one\nline two/c>').every(l => l.parts && l.parts[0].justify === 'center') && text(L('<line one\nline two/c>')[1]) === 'line two');
  const d = L('[outer {inner\nmore} rest]/c');
  check('…and they nest: brackets put back to back on a carried line are never read as a gradient', col(d[1]).map(s => s.color).join() === 'accent2,accent1' && text(d[1]) === 'more rest');
  const e = L('<a <b/f:3> c/scale:150>')[0].parts;
  check('a segment within a segment takes both: the outer\'s directives, then its own', e.length === 3 && e.every(p => p.customSize === 150) && e[1].customFontIdx === 3 && e[0].customFontIdx == null);
  check('a bracket open before a segment runs through it while it closes after', L('[a <b/f:3> c]')[0].parts.every(p => p.segments.every(s => s.color === 'accent1')));
  check('what never closes ends with its line, as it always did', col(L('[never closed\nplain line')[1])[0].color === null);
  check('a lone "<3" keeps the old reading, and "/or" after a bracket is text', L('<I <3 you/c>')[0].parts[0].segments[0].text === 'I <3 you' && text(L('[and]/or')[0]) === 'and/or');
  check('prefixes stay the first line\'s and rhymes stay each line\'s own', (l => l[0].type === 'heading' && l[1].type === 'normal' && l[1].rhymeLetter === 'A' && l[1].alignOverride === 'right')(L('## [open\nmiddle ~A\nend]/r')));
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : failures+' FAILURES');
process.exit(failures === 0 ? 0 : 1);
