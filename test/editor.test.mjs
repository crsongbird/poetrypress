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
import { check, done, effective, uiSource } from './harness.mjs';
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

// (the mark may paint, but must never take up space: invariants.test, §7 Phones)

// the caret moves without typing, so the pair must follow taps and keys
const edSrc = readFileSync(new URL('../editor.js', import.meta.url), 'utf8');
check('the pair repaints when the caret moves',
  /for\(const evt of \['click', 'keyup', 'select'\]\)/.test(edSrc));
check('no pair is shown while selecting a range',
  /selectionStart !== textarea\.selectionEnd\) return null/.test(edSrc));

// ---- unknown directives, underlined, with a hint (Saturn–Phoebe) ----
{
  const { hintText } = await import('../editor.js');
  const hs = [];
  const html = highlightDocument('§style ember = /color:ember\nI <3 you <hot/@ember/glas/blend:fizz> <a/@nope/op:50>', null, hs);
  check('the text is unchanged by underlining', textOf(html).split('\n')[1] === 'I <3 you <hot/@ember/glas/blend:fizz> <a/@nope/op:50>');
  check('three directives are flagged: a misspelling, a bad value, an unnamed style', hs.length === 3);
  check('a misspelling suggests the nearest name', /\/glass\?/.test(hs[0].text));
  check('a known name with a bad value says so', /PML knows \/blend/.test(hs[1].text));
  check('an unnamed style says how to name one', /§style nope/.test(hs[2].text));
  check('a style the poem names is not flagged', !hs.some(h => /@ember/.test(h.text)));
  check('the hint follows the caret into a flagged directive', hintText(hs, hs[1].at + 3) === hs[1].text);
  check('elsewhere, the first one with its line', hintText(hs, 0).startsWith(hs[0].text) && /line 2/.test(hintText(hs, 0)));
  check('nothing to say, no hint', hintText([], 0) === '');
  check('<3 is a heart, not a segment bracket', !/pml-bracket">&lt;<\/span>3/.test(highlightLine('I <3 you')));
  check('a flagged directive carries the underline class', /pml-unknown/.test(highlightLine('<x/zzz>')) && !/pml-unknown/.test(highlightLine('<x/glass/op:50>')));
}


// ---- THE TWO LAYERS' STYLES (moved here from mobileCss.test, the suite of its concern): the mirror and the textarea must
// agree on everything that decides where a glyph lands, one scroller, one grid cell, and a way out if they ever disagree
const edCss = readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8'), edJs = readFileSync(new URL('../editor.js', import.meta.url), 'utf8'), evJs = uiSource();
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
// ---- editor ----
// The mirror and the textarea must agree on every property that decides
// where a line breaks, or the colour drifts off the text.
for(const [prop, want] of [['white-space','pre-wrap'],['overflow-wrap','break-word'],
                            ['box-sizing','border-box'],['padding','7px 9px']])
  check(`mirror and textarea share ${prop}`,
    (effective(edCss, '.editor-input, .editor-mirror', prop) || '').startsWith(want));
const fontBlock = (edCss.match(/\.editor-input, \.editor-mirror, \.editor-gutter\{[^}]*\}/) || [''])[0];
for(const prop of ['font-family','font-size','line-height','tab-size'])
  check(`mirror and textarea share ${prop}`, fontBlock.includes(prop));
check('the textarea renders no glyphs of its own',
  /\.editor-input\{[^}]*color:transparent/.test(edCss));
check('the caret stays visible', /caret-color/.test(edCss));
check('the editor has a line-number gutter', html.includes('id="poemGutter"'));

// ---- editor scrolling: exactly one scroller ----
// The caret drifting "multiple lines off" was scroll desync: the textarea
// scrolled inside itself while the mirror was scrolled to match by hand, and
// any difference in content height accumulated. The textarea now grows to its
// full content height and the wrap is the only scrolling box.
check('the textarea is grown to its content height', /scrollHeight/.test(edJs));
check('the textarea itself does not scroll', /\.editor-input\{[^}]*overflow:hidden/.test(edCss));
check('the wrap is the scrolling box', /\.editor-wrap\{[^}]*overflow:auto/.test(edCss));
check('height is applied to the wrap, not the textarea',
  /\.editor-wrap \{ height: calc\(var\(--vvh\)/.test(edCss) &&
  !/#poemText \{\s*height:/.test(edCss));

// ---- overlay geometry ----
// Absolute positioning only guarantees the mirror fills its container, not
// that it lays out like the textarea. One shared grid cell guarantees both.
check('mirror and textarea occupy the same grid cell',
  /\.editor-mirror\{[^}]*grid-area:1 \/ 1 \/ 2 \/ 2/.test(edCss) &&
  /\.editor-input\{[^}]*grid-area:1 \/ 1 \/ 2 \/ 2/.test(edCss));
// paint() writes the textarea height, so observing it loops against itself
check('no ResizeObserver watches the element the editor resizes',
  !/new ResizeObserver|\.observe\(/.test(edJs));
check('resizes repaint the editor explicitly instead',
  /visualViewport[\s\S]{0,120}repaintEditor/.test(evJs) &&
  /requestAnimationFrame\(repaintEditor\)/.test(evJs));

// ---- editor metrics: the two layers must shape text identically ----
// Two drift causes that reading CSS does not reveal: shaping does not cross
// <span> boundaries, so ligatures/kerning that form in the textarea do not
// form in the span-split mirror; and Chrome on Android inflates text in block
// elements but not in form controls, so a <pre> and a <textarea> can be
// boosted differently.
const metricBlock = (edCss.match(/\.editor-input, \.editor-mirror\{[^}]*font-variant-ligatures[^}]*\}/) || [''])[0];
check('ligatures are disabled on both layers', /font-variant-ligatures:none/.test(metricBlock));
check('kerning is disabled on both layers', /font-kerning:none/.test(metricBlock));
check('contextual alternates are disabled', /"calt" 0/.test(metricBlock));
check('mobile text autosizing cannot inflate one layer',
  /text-size-adjust:100%/.test(metricBlock));
for(const prop of ['font-family','font-size','line-height','letter-spacing','word-spacing',
                   'white-space','overflow-wrap','word-break','padding','box-sizing','min-height'])
  check(`${prop} is forced identical on both layers`,
    new RegExp(prop + ':[^;]*!important').test(metricBlock));
// (bold in the mirror would advance differently from the plain textarea: invariants.test, §7 Phones)

// ---- escape hatch ----
// Highlighting is two layers that must agree about where every glyph lands.
// If they disagree on some device, the user must still be able to write.
check('highlighting can be switched off', html.includes('id="highlightToggle"'));
check('switching it off hides the mirror', /\.plain-editor \.editor-mirror\{[^}]*display:none/.test(edCss));
check('switching it off makes the textarea visible again',
  /\.plain-editor \.editor-input\{[^}]*-webkit-text-fill-color:var\(--text-main\)/.test(edCss));
// per-line blocks round independently and the errors accumulate downward
check('the mirror uses no per-line block boxes', /\.pml-line\{ display:inline/.test(edCss));
check('line anchors take up no space', /\.ln-mark\{[^}]*display:inline !important/.test(edCss));


done();
