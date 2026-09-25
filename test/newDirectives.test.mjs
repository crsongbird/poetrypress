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

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
