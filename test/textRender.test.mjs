/**
 * textRender.test.mjs — the poem drawn through the REAL render(), not just the
 * parser: every PML feature that shapes or colors text renders without
 * throwing (drop caps, small caps, /track, /basis, /jitter, the flag
 * gradients, rhyme markers, glass, cut, blends, arcs and waves, named styles,
 * fonts by name); a tracked segment takes the room it is drawn in (a measure
 * once blind to /track drew the next words on top of it); the text's caches
 * follow the poem and the typeface; and the shaped lines' geometry.
 * Pixels are the eye's to judge (see canvasMock.mjs); what is checked is what
 * render() draws, and where.
 *
 * Run: node test/textRender.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

// every 2D context the page makes, watched: each run of text it draws, where, and in which font
const drawn = [];
const watch = c => { if(c._watched) return c; c._watched = true;
  const f = c.fillText; c.fillText = function(t, x, y){ drawn.push({ t: String(t), x, y, font: c.font }); return f.apply(c, arguments); };
  return c; };
const watchedCanvas = () => { const cv = makeMockCanvas(), g = cv.getContext.bind(cv); cv.getContext = (...a) => watch(g(...a)); return cv; };
installCanvasMock();
const registry = installDomMock((w, h) => watch(makeMockContext(w, h)), watchedCanvas);
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

// ---- a tracked segment takes the room it is drawn in ----
// A tracked word is drawn letter by letter, each a tracked step apart; what follows it must start one more
// step past its last letter. (Found from a screenshot: "color" measured narrow but drew wide, and
// "learns to spread" was drawn over it.)
{ const draw = poem => { registry['poemText'].value = poem; drawn.length = 0; render(); return drawn.slice(); };
  const runs = draw('a <color/track:140> learns to spread');
  const at = t => runs.findIndex(r => r.t === t), r = at('r'), after = runs.findIndex(x => /^\s*learns to spread$/.test(x.t));
  const step = r > 0 ? runs[r].x - runs[r - 1].x : 0;
  check('a tracked segment takes the room it is drawn in: the words after /track:140 start one tracked step past its last letter, not on top of it',
    r > 0 && after > r && step > 10 && Math.abs((runs[after].x - runs[r].x) - step) < 1);

  // ---- the text's caches follow the poem and the typeface ----
  const a = draw('## A Totally Different Poem\n\nJust checking.'), again = draw('## A Totally Different Poem\n\nJust checking.');
  check('a poem drawn twice unchanged draws the same runs', JSON.stringify(a.map(x => [x.t, x.x, x.y])) === JSON.stringify(again.map(x => [x.t, x.x, x.y])));
  const b = draw('## Flood\n\nBack to something else.');
  check('a changed poem is drawn anew (the line cache follows the poem): the new lines, none of the old',
    a.some(x => x.t === 'Just checking.') && b.some(x => x.t === 'Back to something else.') && !b.some(x => x.t === 'Just checking.'));
  const { FONTS } = await import('../appOptions.js'), other = FONTS.findIndex(f => !b.some(x => x.font.includes('"' + f.family + '"')));
  registry['fontFamily'].value = String(other); registry['fontFamily'].dispatchEvent({ type: 'change' });
  const c = draw('## Flood\n\nBack to something else.');
  check('a new typeface is drawn in (the measures follow the font)', other >= 0 && c.some(x => x.t === 'Back to something else.' && x.font.includes('"' + FONTS[other].family + '"'))); }

// ---- the shaped lines' geometry ----
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

// PUNCTUATION (ROADMAP G2): the page records where each mark sits, after the runs, as "x,y,mark" (which every reader
// of the runs passes over), each inside its line's run and in reading order
{ const { textLayoutNow } = await import('../canvasRenderer.js'), { poemMarks, poemRuns } = await import('../steps.js');
  registry['poemText'].value = 'Wait, then go.\nNo marks here';
  render();
  const lay = textLayoutNow(), marks = poemMarks(lay), runs = poemRuns(lay), r = runs[0] || [0, 0, 0, 0];
  check('the page records the poem\'s punctuation: a comma then a full stop, inside the first line\'s run, in reading order',
    marks.length === 2 && marks[0][2] === 2 && marks[1][2] === 1 && marks[0][0] < marks[1][0] && marks.every(([x, y]) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]));
  check('…and the runs read as they did (the marks are three numbers: passed over by every reader of the runs)', runs.length === 2 && lay.split(';').length === 4); }

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
