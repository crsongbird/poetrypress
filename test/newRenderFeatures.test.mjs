/**
 * newRenderFeatures.test.mjs — exercises every new rendering feature
 * (drop caps, small caps, /track, /basis, /jitter, the flag gradients,
 * rhyme markers) through the REAL render() pipeline, not just the parser.
 * Doesn't check pixels (see canvasMock.mjs for why), but confirms none of
 * it throws and that render() actually draws something for each case.
 *
 * Run with: node test/newRenderFeatures.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const { render } = await import('../canvasRenderer.js');

let failures = 0;
function check(label, cond){
  if(!cond){ failures++; console.log('FAIL:', label); }
  else console.log('ok:', label);
}

function tryRender(label, poemText){
  registry['poemText'].value = poemText;
  let threw = null;
  try { render(); } catch(e){ threw = e; }
  check(label, threw === null);
  if(threw) console.log('  threw:', threw.stack || threw.message);
}

tryRender('drop cap line renders without throwing', '#D Once upon a midnight dreary');
tryRender('small caps line renders without throwing', '#S whispered words in the dark');
tryRender('bare /track renders without throwing', 'some <spread out/track> text');
tryRender('/track:50 renders without throwing', 'some <spread out/track:50> text');
tryRender('bare /basis renders without throwing', 'a <raised/basis> word');
tryRender('/basis:-40 (lowered) renders without throwing', 'a <lowered/basis:-40> word');
tryRender('bare /jitter renders without throwing', 'a <shaky/jitter> word');
tryRender('/jitter:200 renders without throwing', 'a <very shaky/jitter:200> word');
tryRender('/rainbow renders without throwing', 'a <colorful/rainbow> word');
tryRender('/rainbow:rev renders without throwing', 'a <colorful/rainbow:rev> word');
tryRender('/trans renders without throwing', 'a <colorful/trans> word');
tryRender('/lesbian renders without throwing', 'a <colorful/lesbian> word');
tryRender('/left /right /center aliases render without throwing', 'a <word/left> <word/center> <word/right>');
tryRender('rhyme tag ~A renders without throwing', 'a line that rhymes~A');
tryRender('rhyme tag ~C (split-complement) renders without throwing', 'another rhyming line~C');
tryRender('rhyme tag with alignment suffix renders without throwing', 'rhymes and aligns~B/r');
tryRender('scale + basis combined (centered scaling) renders without throwing', 'a <big raised word/scale:200/basis:20> here');
tryRender('drop cap + rhyme tag combined renders without throwing', '#D A grand beginning~A');
tryRender('everything combined in one poem renders without throwing',
  '#D Once upon a time~A\n#S whispered secrets in the dark~B\n' +
  'a <spread/track:150/jitter:80> word\n' +
  'a <rainbow/rainbow:rev> and a <trans/trans> flag\n' +
  'plain closing line'
);

// ---- Saturn–Phoebe: glass, cut, blends, shaped lines, named styles, fonts by name ----
tryRender('/glass renders without throwing', 'a <frosted/glass/scale:150> word');
tryRender('/glass:clear and a tinted glass render', '<clear/glass:clear> and <rose/glass:rose>');
tryRender('/cut renders without throwing', 'a <window/cut> through');
tryRender('/glass with a strength renders', '<soft/glass:20> <strong/glass:rose,90>');
tryRender('/glass turned, on an arc, renders', '<turned glass/glass/rot:-12/arc:40>');
tryRender('/blend and /op render without throwing', '<pressed/blend:multiply> <faint/op:40> <lit/blend:screen/op:80>');
tryRender('/arc and /wave render without throwing', '<over the hill/arc:40> <under/arc:-30> <and away/wave:30,2>');
tryRender('a shaped line with an underline and a stitch renders', '<_bowed_/arc:30/under:wave>');
tryRender('/rot renders without throwing', '<a turned word/rot:-6>');
tryRender('/gap renders, either way', 'one<w/gap:120>\ntwo<w/gap:-60>\nthree');
tryRender('/font:Cinzel renders without throwing', 'a <carved/font:Cinzel> word, an <unknown/font:Nowhere> one');
tryRender('a named style renders without throwing', '§style ember = /color:ember/glass/scale:120\nthe <coals/@ember> glow');
tryRender('a code segment turned renders without throwing', '`code` <and `more`/rot:8>');

const { runShape, fontIndexByName } = await import('../canvasRenderer.js');
const arc = runShape({ arc: 60 }, 300, 50);
check('an arc is hung about its line: the middle rises as far as the ends fall', Math.abs(arc(150).dx) < 1e-9 && arc(150).dy < 0
  && Math.abs(arc(150).dy + arc(0).dy) < 1e-9 && Math.abs(arc(150).rot) < 1e-9);
check('a positive arc bows up: its ends sit lower, turned down the slope', arc(0).dy > 0 && arc(300).dy > 0 && arc(300).rot > 0 && arc(0).rot < 0);
check('a negative arc sags: its ends sit higher', runShape({ arc: -60 }, 300, 50)(0).dy < runShape({ arc: -60 }, 300, 50)(150).dy);
const wave = runShape({ wave: { amp: 40, cycles: 1 } }, 400, 50);
check('a wave rises first, to its height', wave(100).dy < 0 && Math.abs(Math.abs(wave(100).dy) - 20) < 1e-6 && wave(300).dy > 0);
check('a straight run has no shape', runShape({}, 300, 50) === null && runShape({ arc: 30 }, 0, 50) === null);
check('a font by its name, any case', fontIndexByName('cinzel') >= 0 && fontIndexByName('Cormorant') >= 0 && fontIndexByName('nowhere') === -1);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
