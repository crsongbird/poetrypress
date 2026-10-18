/**
 * newDirectives.test.mjs — covers the DSL additions: /track, /basis,
 * /jitter (all percentage-based with sane bare defaults), /left /right
 * /center aliases, the /rainbow /trans /lesbian gradient shortcuts (+:rev),
 * rhyme-scheme tags (~A/~B/~C/~D), the #D/#S line prefixes, and the
 * /scale:n percentage change (previously absolute pixels).
 *
 * Run with: node test/newDirectives.test.mjs
 */
import { buildLines } from '../textParsers.js';

let failures = 0;
function check(label, cond){
  if(!cond){ failures++; console.log('FAIL:', label); }
  else console.log('ok:', label);
}

function firstPart(text){
  return buildLines(text, true, true)[0].parts[0];
}

// /scale — now a percentage, bare defaults to 100
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

// ---- Saturn–Phoebe (Ruby approved): glass, cut, blends, opacity, shaped lines, names ----
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

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
