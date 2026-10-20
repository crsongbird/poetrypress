/**
 * textParsers.test.mjs — the poem-text markup language (PML) as the parser
 * reads it: nesting, escapes, gradients, quotes, rules, blocks over lines; and
 * what each directive stores, with its bare default (/scale, /track, /basis,
 * /jitter, the alignments, the flag gradients, /op /blend /rot /arc /wave /gap
 * /font /color /glass /cut), rhyme tags, the #D #S prefixes, <3, and bold and
 * italic over lines. Pure logic, no DOM/canvas needed at all. (That old poems
 * parse exactly as they did is pmlCompat.test.mjs.)
 *
 * Run: node test/textParsers.test.mjs
 */
import { buildLines, applyEscapes, tokenizeInline } from '../textParsers.js';
import { readFileSync } from 'fs';
import { check, fail, done } from './harness.mjs';


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
  fail('default poem threw: ' + e.message);
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

// ---- what each directive stores, and its bare default ----
function firstPart(text){
  return buildLines(text, true, true)[0].parts[0];
}

// /scale — a percentage, bare defaults to 100
check('/scale:150 stores 150 (percentage, not absolute px)', firstPart('<x/scale:150>').customSize === 150);
check('bare /scale defaults to 100', firstPart('<x/scale>').customSize === 100);

// /track — percentage, bare defaults to 100
check('/track:50 stores 50', firstPart('<x/track:50>').customTracking === 50);
check('bare /track defaults to 100', firstPart('<x/track>').customTracking === 100);

// /basis — signed percentage, bare defaults to +30
check('/basis:-50 stores -50', firstPart('<x/basis:-50>').customBasis === -50);
check('bare /basis defaults to +30', firstPart('<x/basis>').customBasis === 30);

// /jitter — percentage, bare defaults to 100
check('/jitter:200 stores 200', firstPart('<x/jitter:200>').customJitter === 200);
check('bare /jitter defaults to 100', firstPart('<x/jitter>').customJitter === 100);

// /left /right /center aliases alongside /l /c /r
check('/left aliases to left', firstPart('<x/left>').justify === 'left');
check('/right aliases to right', firstPart('<x/right>').justify === 'right');
check('/center aliases to center', firstPart('<x/center>').justify === 'center');
check('/l still works (compat)', firstPart('<x/l>').justify === 'left');
check('/r still works (compat)', firstPart('<x/r>').justify === 'right');
check('/c still works (compat)', firstPart('<x/c>').justify === 'center');

// flag gradient shortcuts
const rainbow = firstPart('<x/rainbow>').customGradient;
check('/rainbow has 6 stops', rainbow.length === 6);
check('/rainbow starts red', rainbow[0].toLowerCase() === '#e40303');
const rainbowRev = firstPart('<x/rainbow:rev>').customGradient;
check('/rainbow:rev reverses the order', rainbowRev[0].toLowerCase() === rainbow[5].toLowerCase() && rainbowRev[5].toLowerCase() === rainbow[0].toLowerCase());

const trans = firstPart('<x/trans>').customGradient;
check('/trans has 5 stops', trans.length === 5);
check('/trans is symmetric (blue-pink-white-pink-blue)', trans[0].toLowerCase() === trans[4].toLowerCase() && trans[1].toLowerCase() === trans[3].toLowerCase());

const lesbian = firstPart('<x/lesbian>').customGradient;
check('/lesbian has 7 stops', lesbian.length === 7);
check('/lesbian starts dark orange', lesbian[0].toLowerCase() === '#d52d00');

// bare /fx1 /fx2 sane defaults
check('bare /fx1 gets a default outline', firstPart('<x/fx1>').customEffect.type === 'outline');
check('bare /fx2 gets a default shadow', firstPart('<x/fx2>').customEffect.type === 'shadow');
// bare /f is a no-op (no sane default font index)
check('bare /f does not set customFontIdx', firstPart('<x/f>').customFontIdx === null);

// rhyme-scheme tags
const rhymeLine = buildLines('some words~A', true, true)[0];
check('~A tag detected and stripped from display', rhymeLine.rhymeLetter === 'A' && !JSON.stringify(rhymeLine.segments).includes('~A'));
const rhymeLineWithAlign = buildLines('some words~C/r', true, true)[0];
check('~C coexists with a trailing /r alignment suffix', rhymeLineWithAlign.rhymeLetter === 'C' && rhymeLineWithAlign.alignOverride === 'right');
const noRhyme = buildLines('some words', true, true)[0];
check('no rhyme tag means rhymeLetter is null', noRhyme.rhymeLetter === null);

// #D / #S line prefixes
const dropCapLine = buildLines('#D Once upon a time', true, true)[0];
check('#D marks dropCap and strips the prefix', dropCapLine.dropCap === true && !JSON.stringify(dropCapLine.segments).includes('#D'));
const smallCapsLine = buildLines('#S WHISPERED WORDS', true, true)[0];
check('#S marks smallCaps and strips the prefix', smallCapsLine.smallCaps === true);
const normalLine = buildLines('plain text', true, true)[0];
check('normal lines have dropCap/smallCaps false', normalLine.dropCap === false && normalLine.smallCaps === false);

// glass, cut, blends, opacity, shaped lines, names (Ruby approved, Saturn–Phoebe)
const P = firstPart('<w/op:50/blend:screen/rot:-10/arc:30/wave:20,3/gap:150/font:Cinzel/color:rose/glass:#8af/cut>');
check('/op:50 stores 50', P.customOpacity === 50);
check('/blend:screen stores screen', P.customBlend === 'screen');
check('/rot:-10 stores -10', P.customRotate === -10);
check('/arc:30 stores 30', P.customArc === 30);
check('/wave:20,3 stores amp and cycles', P.customWave && P.customWave.amp === 20 && P.customWave.cycles === 3);
check('/gap:150 stores 150, and the line takes it', P.customGap === 150 && buildLines('<w/gap:150>', true, true)[0].gap === 150);
check('/font:Cinzel keeps the name for the renderer', P.customFontName === 'Cinzel');
check('/color:rose is the app rose', P.customColor === '#e7a0b8');
check('/glass:#8af is tinted glass', P.glass && P.glass.kind === 'frost' && P.glass.tint);
check('/cut marks a window', P.cut === true);
const bare = firstPart('<w/op/blend/rot/arc/wave/gap/glass>');
check('bare forms take their defaults', bare.customOpacity === 60 && bare.customBlend === 'multiply' && bare.customRotate === -8
  && bare.customArc === 30 && bare.customWave.amp === 25 && bare.customWave.cycles === 2 && bare.customGap === 100 && bare.glass.kind === 'frost');
check('/glass:clear is clear glass', firstPart('<w/glass:clear>').glass.kind === 'clear');
check('/glass takes a strength, alone or with a tint or kind', firstPart('<w/glass:80>').glass.strength === 80
  && (g => g.tint === '#e7a0b8' && g.strength === 30)(firstPart('<w/glass:rose,30>').glass) && (g => g.kind === 'clear' && g.strength === 70)(firstPart('<w/glass:clear,70>').glass)
  && !('strength' in firstPart('<w/glass>').glass) && firstPart('<w/glass:250>').glass.strength === 100);
check('/blend:dodge reads as color-dodge', firstPart('<w/blend:dodge>').customBlend === 'color-dodge');
check('an unknown blend sets nothing', firstPart('<w/blend:fizz>').customBlend == null);
check('/colour: is /color:', firstPart('<w/colour:midnightblue>').customColor === '#191970');
check('/op is held to 0…100', firstPart('<w/op:250>').customOpacity === 100);
check('a part without the new directives has none of them set',
  ['customOpacity', 'customBlend', 'customRotate', 'customArc', 'customWave', 'customGap', 'customFontName', 'glass', 'cut'].every(k => firstPart('<w/scale:120>')[k] == null));
check('a line without /gap has no gap', !('gap' in buildLines('<w/scale:120>', true, true)[0]));
// <3 is always a heart
const heart = buildLines('I <3 you <so/scale:150>', true, true)[0];
check('<3 never opens a segment', heart.parts && heart.parts.some(p => p.customSize === 150 && p.segments.map(s => s.text).join('') === 'so')
  && heart.parts.map(p => p.segments.map(s => s.text).join('')).join('').includes('<3'));
// bold and italic run over lines
const bl = buildLines('**bold over\nlines** done', true, true);
check('bold left open runs on to its closer', bl[0].segments.every(s => s.bold) && bl[1].segments[0].bold && bl[1].segments[0].text === 'lines'
  && !bl[1].segments[bl[1].segments.length - 1].bold);
const it = buildLines('*leaning\nstill* not', true, true);
check('italic left open runs on to its closer', it[0].segments.every(s => s.italic) && it[1].segments[0].italic && !it[1].segments[it[1].segments.length - 1].italic);
check('a bold never closed still ends with its line', buildLines('**alone\nplain', true, true)[1].segments.every(s => !s.bold));

done();
