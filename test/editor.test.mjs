/**
 * editor.test.mjs — PML syntax highlighting.
 *
 * highlightLine/highlightDocument are pure, so the colouring can be tested
 * exactly. The property that matters most is NOT which colour a token gets —
 * it is that the mirror's text content matches the textarea's character for
 * character. If highlighting ever drops, duplicates or re-orders a
 * character, the colour drifts away from the text underneath it and the
 * whole approach falls apart silently.
 *
 * Run: node test/editor.test.mjs
 */
import { highlightLine, highlightDocument, findBracketPair } from '../editor.js';

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

// strip tags and decode the few entities we emit
const textOf = html => String(html)
  .replace(/<[^>]*>/g, '')
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')
  .replace(/\u200b/g,'');

const SAMPLES = [
  '## Wanting [(Aether)]',
  'in  <our native language/f:12>',
  'The <aether/scale:115/fx2,#A98CFF,26,0,0> bled out',
  '<*rainbows and starlight and awe*/rainbow>, and',
  '> a quoted line~A/r',
  '-# small aside with **bold** and ~~strike~~',
  '#D Drop cap line',
  '#S small caps line',
  'escaped \\[not accent\\] and \\\\ backslash',
  'plain text with no markup at all',
  '',
  '   indented continuation line',
  '<unclosed segment with no close',
  '{[gradient]} and [{reverse]}',
];

// --- the load-bearing property ---
let mismatch = null;
for(const line of SAMPLES){
  const round = textOf(highlightLine(line));
  if(round !== line && !(line === '' && round === '')) { mismatch = { line, round }; break; }
}
check('highlighting never alters the text it colours', mismatch === null);
if(mismatch) console.log('   in:', JSON.stringify(mismatch.line), '\n   out:', JSON.stringify(mismatch.round));

// document level, including blank lines
const doc = SAMPLES.join('\n');
const docText = textOf(highlightDocument(doc)).split('\n').length;
// The mirror is ONE continuous flow, not one block per line: per-line blocks
// each round their height to device pixels independently, and those errors
// accumulate into whole lines of vertical drift.
check('the mirror contains no block elements at all',
  !/<div|<p[ >]|<pre/.test(highlightDocument(doc)));
check('every logical line gets an inline anchor for the gutter',
  (highlightDocument(doc).match(/class="ln-mark"/g) || []).length === SAMPLES.length);
check('lines are separated by real newlines, for pre-wrap to break',
  highlightDocument('a\nb').includes('\n'));

// --- HTML safety: the poem is user input and must never become markup ---
const evil = '<script>alert(1)</script> & <img src=x onerror=y>';
const out = highlightLine(evil);
check('angle brackets in the poem are escaped, not executed',
  !out.includes('<script>') && !out.includes('<img'));
check('ampersands survive escaping intact', textOf(highlightLine('a & b')) === 'a & b');

// --- colouring by element ---
const seg = highlightLine('<word/scale:150>');
check('the segmentation brackets are sharp', /pml-bracket">&lt;/.test(seg));
check('a directive name is coloured as touch', /pml-directive">scale/.test(seg));
check('a directive value is coloured separately', /pml-value">150/.test(seg));

const head = highlightLine('## Title');
check('a line prefix takes the whimsy colour', /pml-prefix">##/.test(head));

const emph = highlightLine('**bold** and *italic*');
check('emphasis markers are chaos', (emph.match(/pml-emph/g) || []).length === 4);

const esc = highlightLine('\\[literal\\]');
check('an escape covers both characters', (esc.match(/pml-escape/g) || []).length === 2);
check('an escaped bracket is NOT coloured as a bracket', !/pml-bracket/.test(esc));

const rhyme = highlightLine('a line~B');
check('a trailing rhyme tag is marked', /pml-rhyme">~B/.test(rhyme));
check('a tilde mid-line is not mistaken for a rhyme tag',
  !/pml-rhyme/.test(highlightLine('a ~B b')));

// --- wrapping indent ---
// The mirror must NOT indent: a textarea cannot be given a hanging indent, so
// any indent here slides the highlight off the real text and misplaces the
// caret. This was an application-breaking bug.
check('the mirror never applies a hanging indent',
  !highlightDocument('    four\n\tone\nnone').includes('text-indent'));
check('the mirror never applies padding to a line',
  !highlightDocument('    four').includes('padding-left'));
check('the whole document round-trips, newlines included',
  textOf(highlightDocument('a\n  b\n\nc')).replace(/\u200b/g,'') === 'a\n  b\n\nc');

// --- an empty line must still occupy a row ---
check('a trailing empty line still occupies a row',
  highlightDocument('a\n').endsWith('\u200b'));

// ---- the real default poem, line by line ----
// Comparing whole documents does not work: each logical line is its own
// element, so stripping tags also removes the newlines between them. Compare
// per line element instead.
import { readFileSync } from 'fs';
const htmlSrc = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const defaultPoem = htmlSrc.match(/<textarea id="poemText"[^>]*>([\s\S]*?)<\/textarea>/)[1];
const renderedLines = textOf(highlightDocument(defaultPoem))
  .replace(/\u200b/g, '')
  .split('\n');
const srcLines = defaultPoem.split('\n');
check('the default poem produces one element per line', renderedLines.length === srcLines.length);
check('every line of the default poem round-trips exactly',
  srcLines.every((l, i) => l === renderedLines[i]));

// ---- bracket families are distinguishable ----
const brk = highlightLine('[a]{b}(c)<d>');
check('square brackets get their own class', /pml-sq">\[/.test(brk));
check('curly brackets get their own class', /pml-cu">\{/.test(brk));
check('parentheses get their own class', /pml-paren">\(/.test(brk));
check('the segmentation operator keeps the structural class', /pml-bracket">&lt;/.test(brk));
check('the four families are all different classes',
  new Set(['pml-sq','pml-cu','pml-paren','pml-bracket'].filter(c => brk.includes(c))).size === 4);
check('bracket colouring still does not alter the text', textOf(brk) === '[a]{b}(c)<d>');

// ---- bracket-pair matching ----
const T = String.raw`a [b {c} d] \[e\] <f/g:1> \\[real]`;
const pairAt = c => findBracketPair(T, c);
check('a bracket before the caret finds its partner', JSON.stringify(pairAt(T.indexOf('[') + 1)) === '[2,10]');
check('nested pairs match their own level', JSON.stringify(pairAt(T.indexOf('{') + 1)) === '[5,7]');
check('a closing bracket finds its opener', JSON.stringify(pairAt(T.indexOf(']') + 1)) === '[10,2]');
check('the segment operator\'s angle brackets match', !!pairAt(T.indexOf('<') + 1));
check('an escaped bracket is not a bracket', pairAt(T.indexOf('\\[') + 2) === null);
check('a bracket after an escaped BACKSLASH is real', !!pairAt(T.indexOf('\\\\[') + 3));
check('an unmatched bracket shows nothing', findBracketPair('a [ b', 3) === null);
check('no bracket at the caret shows nothing', findBracketPair('plain', 2) === null);

// marking must not alter a single character of the mirror
const marked = highlightDocument(T, new Set(pairAt(T.indexOf('[') + 1)));
check('exactly the two characters of the pair are marked', (marked.match(/pml-match/g) || []).length === 2);
check('marking leaves the text identical',
  textOf(marked).replace(/\u200b/g, '') === T);
check('without marks, nothing is marked', !/pml-match/.test(highlightDocument(T)));
// a marked paint followed by an unmarked one: the second must be clean
highlightDocument(T, new Set([2, 10]));
check('marks do not leak into the next paint', !/pml-match/.test(highlightDocument(T)));

// the mark may paint, but must never take up space
const cssSrc = readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8');
const matchRule = (cssSrc.match(/\.pml-match\{[^}]*\}/) || [''])[0];
check('the match style exists', matchRule.length > 0);
check('the match style cannot move text',
  !/(padding|margin|border(?!-radius)|font-weight|letter-spacing|width|font-size)\s*:/.test(matchRule));

// the caret moves without typing, so the pair must follow taps and keys
const edSrc = readFileSync(new URL('../editor.js', import.meta.url), 'utf8');
check('the pair repaints when the caret moves',
  /for\(const evt of \['click', 'keyup', 'select'\]\)/.test(edSrc));
check('no pair is shown while selecting a range',
  /selectionStart !== textarea\.selectionEnd\) return null/.test(edSrc));

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
