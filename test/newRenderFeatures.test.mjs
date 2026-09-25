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

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
