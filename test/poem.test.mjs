/**
 * poem.test.mjs — surfaces that know where the poem is.
 *
 * From the future-directions doc Ruby shared: "Treat readability as part of
 * the shader, not a final warning." The Athanor's The Poem part hands the
 * page's layout to a graph (the page's own record of it, and Text Clearing,
 * are drawn through the real render() in textRender.test.mjs).
 *
 * Run: node test/poem.test.mjs
 */
import { check, done } from './harness.mjs';
globalThis.document = { createElement: () => ({ getContext: () => null }) };
const { STEPS, poemRuns, stepDistance } = await import('../steps.js'), { WIKI_PARTS } = await import('../athanorWikiParts.js');
const { evalAthanor, athanorStarter } = await import('../athanor.js');
const { textureKeyFor } = await import('../textureGenerators.js');

// the exact distance transform
{ const w = 9, h = 7, m = new Float32Array(w*h); m[3*w + 4] = 1;
  const d = stepDistance(m, w, h);
  check('the distance transform is exact (Felzenszwalb): 0 on the mask, Euclidean away from it',
    d[3*w + 4] === 0 && Math.abs(d[3*w + 7] - 3) < 1e-6 && Math.abs(d[0] - Math.hypot(4, 3)) < 1e-5); }

check('the layout parses as runs of six numbers, junk passed over', poemRuns('0.1,0.1,0.5,0.15,0,0;oops;0.1,0.3,0.4,0.35,1,1').length === 2 && poemRuns('').length === 0);

// The Poem, run in a tiny graph: each output into a Surface
const graphFor = out => JSON.stringify({ v: 2, drawflow: { Home: { data: {
  1: { id: 1, name: 'poem', data: { padding: 0, softness: 0, reach: 50 }, inputs: {}, outputs: { output_1: { connections: [] }, output_2: { connections: [] }, output_3: { connections: [] }, output_4: { connections: [] } } },
  2: { id: 2, name: 'surface', data: { name: 'T', ground: 'grey' }, inputs: { input_1: { connections: [{ node: '1', input: 'output_' + out }] }, input_2: { connections: [] } }, outputs: {} } } } } });
const text = '0.1,0.1,0.6,0.15,0,0;0.1,0.2,0.5,0.25,1,0;0.1,0.6,0.7,0.65,2,1';
const W = 100, H = 100, at = (im, x, y) => im.r[y*W + x];
const run = (out, t) => evalAthanor(graphFor(out), W, H, { seed: 1, knobs: [], tints: [], text: t }, {});
const words = run(1, text), dist = run(2, text), lines = run(3, text), stanzas = run(4, text), none = run(2, '');
check('Words is white on the words and dark away from them', at(words, 30, 12) > 0.9 && at(words, 90, 90) < 0.05);
check('Distance is 0 at the words and grows away from them', at(dist, 30, 12) < 0.02 && at(dist, 30, 40) > at(dist, 30, 30) && at(dist, 95, 95) > 0.3);
check('Lines are bands across the whole page, a different gray for each line', at(lines, 95, 12) > 0 && at(lines, 95, 22) > at(lines, 95, 12) && at(lines, 95, 45) === 0);
check('Stanzas split the page between them', at(stanzas, 50, 5) !== at(stanzas, 50, 95));
check('with no poem laid out, Distance is 1 everywhere (nothing is near any words)', none.r.every(v => v === 1));
check('The Poem has a Rhymes output and a rhyme to pick', STEPS.poem.outs.includes('rhymes') && STEPS.poem.params.some(p => p[0] === 'rhyme'));
// its three globals: Aware (the surface is Text Aware), In the Letters (blended into them, Shape Aware) and Round
// the Words (Shape Aware on the page)
{ const E = o => ({ ctx: { text: '0.1,0.1,0.9,0.2,0,0,0', ...o }, ww: 8, wh: 8, N: 64, num: (n, k, d) => d, P: (n, k, d) => d, boxBlur: f => f });
  const a = STEPS.poem.run(E({}), {}), b = STEPS.poem.run(E({ aware: false }), {}), c = STEPS.poem.run(E({ fill: true }), {}), d = STEPS.poem.run(E({ around: true }), {}), h = STEPS.poem.run(E({ around: 0.4 }), {});
  check('The Poem hands on three numbers: Aware (1 unless the surface is not Text Aware), In the Letters (1 when it fills them) and Round the Words (1 under Shape Aware on the page)',
    a[5] === 1 && a[6] === 0 && a[7] === 0 && b[5] === 0 && c[6] === 1 && d[7] === 1 && a.length === 9);
  check('…each as strong as Shape Strength says', Math.abs(h[7] - 0.4) < 1e-9);
  const { wordsRoom } = await import('../texCore.js'), t = '0.4,0.4,0.6,0.5,0,0,0', full = wordsRoom({ around: 1, text: t }, 20, 20), half = wordsRoom({ around: 0.5, text: t }, 20, 20);
  check('the words\' room: none on the words at full strength, half at half, the page far off untouched', full[10*20 + 10] === 0 && Math.abs(half[10*20 + 10] - 0.5) < 1e-6 && full[0] === 1 && half[0] === 1 && wordsRoom({ text: t }, 20, 20) === null); }
check('every new part has its doc', ['poem', 'grow', 'pixelate', 'twirl', 'mirror', 'chroma'].every(k => STEPS[k] && (WIKI_PARTS[k] || {}).line.length > 40));
check('the Ripples from the Words starter teaches with The Poem', /"name":"poem"/.test(JSON.stringify(athanorStarter('ripples'))));

// PUNCTUATION (ROADMAP G2): the page's "x,y,mark" points, read by The Poem's ninth output; every reader of the runs passes them over
{ const { poemMarks, punctMark } = await import('../steps.js'), { wordsRoom } = await import('../texCore.js');
  const lay = '0.1,0.4,0.9,0.5,0,0,0;0.3,0.47,2;0.85,0.47,1', P = (marks, glow = 100) => STEPS.poem.run({ ctx: { text: lay }, ww: 100, wh: 100, N: 10000,
    num: (n, k, d) => k === 'glow' ? glow : d, P: (n, k, d) => k === 'marks' ? marks : d, boxBlur: f => f }, {})[8];
  const every = P('every mark'), pauses = P('pauses , ; :'), wide = P('every mark', 300);
  check('the marks parse as three numbers each; a run of six or more is never a mark, and the runs\' readers pass the marks over',
    poemMarks(lay).length === 2 && poemRuns(lay).length === 1 && poemMarks('0.1,0.1,0.5,0.15,0,0').length === 0 && punctMark(',') === 2 && punctMark('a') === 0
    && wordsRoom({ around: 1, text: lay }, 20, 20)[0] === 1);
  check('The Poem\'s Punctuation: bright on each mark, dark away from them; Pauses keeps the comma and drops the full stop',
    STEPS.poem.outs[8] === 'punctuation' && every[47*100 + 30] > 0.9 && every[47*100 + 85] > 0.9 && every[10*100 + 10] === 0 && pauses[47*100 + 30] > 0.9 && pauses[47*100 + 85] === 0);
  check('…and its Glow reaches further when turned up', wide[47*100 + 40] > every[47*100 + 40]); }

// SHAPE STRENGTH moves how far a graph built on The Poem keeps clear (Ruby: "the threshold"): under Shape Aware (`around`),
// the Words mask spreads by Padding × strength and the Distance reads farther near the words; Shape Aware off, as always
{ const lay = '0.3,0.45,0.7,0.55,0,0,0', P = (around, out) => STEPS.poem.run({ ctx: { text: lay, around }, ww: 100, wh: 100, N: 10000,
    num: (n, k, d) => ({ padding: 100, softness: 0, reach: 35 })[k] ?? d, P: (n, k, d) => d, boxBlur: f => f }, {})[out];
  const wordsAt = (a, y) => P(a, 0)[y*100 + 50], distAt = (a, y) => P(a, 1)[y*100 + 50];
  check('Shape Aware at full strength (or off) keeps the graph\'s own margin: the Words mask reaches a Padding beyond the line',
    wordsAt(0, 62) === 1 && wordsAt(1, 62) === 1 && distAt(0, 70) === distAt(1, 70));
  const ringGap = a => distAt(a, 74) - distAt(a, 70);
  check('…at half strength the margin is half as wide, and the Distance near the words reads farther; farther out its steps keep their spacing',
    wordsAt(0.5, 62) === 0 && wordsAt(0.5, 58) === 1 && distAt(0.5, 66) > distAt(1, 66)*1.6 && Math.abs(ringGap(0.5) - ringGap(1)) < 1e-4);
  check('…and at 0 (Shape Aware on) nothing is kept clear: the Distance starts a quarter out at the letters, its steps beyond unchanged',
    wordsAt(0.001, 50) < 0.02 && distAt(0.001, 57) >= 0.25 && distAt(0.001, 57) < 0.35 && Math.abs(ringGap(0.001) - ringGap(1)) < 1e-4); }

// the cache: the layout is part of a graph's key only when the graph asks for it
{ const g = JSON.stringify(athanorStarter('ripples'));
  const a = textureKeyFor('athanor', 300, 400, { graph: g, text: 'a' }), b = textureKeyFor('athanor', 300, 400, { graph: g, text: 'b' }), c = textureKeyFor('linen', 300, 400, { text: 'a' }), d = textureKeyFor('linen', 300, 400, {});
  check('a poem graph\'s cache key follows the layout; any other surface\'s never does', a !== b && c === d); }

// the poem's ink (ROADMAP G3): an Ink part brings the text color in, and a graph with one changes with it
{ const inkGraph = JSON.stringify({ v: 4, drawflow: { Home: { data: {
    1: { id: 1, name: 'ink', data: { name: 'Ink' }, inputs: {}, outputs: { output_1: { connections: [] } } },
    2: { id: 2, name: 'surface', data: { name: 'T', ground: 'color' }, inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] }, input_2: { connections: [] } }, outputs: {} } } } } });
  const of = accents => { const im = evalAthanor(inkGraph, 8, 8, { seed: 1, knobs: [], tints: [], accents }, {}); return [im.r[0], im.g[0], im.b[0]].map(v => Math.round(v*255)); };
  check('an Ink part gives the poem\'s ink (the page passes it after the two accents)', JSON.stringify(of(['#FF0000', '#00FF00', '#204060'])) === '[32,64,96]');
  check('…and with no page (the Athanor\'s previews), the default pale ink', JSON.stringify(of(null)) === '[242,242,239]');
  const k = (graph, ink) => textureKeyFor('athanor', 300, 400, { graph, ink }), plain = JSON.stringify(athanorStarter('ripples'));
  check('an ink graph\'s cache key follows the ink; any other graph\'s never does', k(inkGraph, '#111111') !== k(inkGraph, '#EEEEEE') && k(plain, '#111111') === k(plain, '#EEEEEE')); }

// the page's side (the layout record and Text Clearing: drawn through the real render() in textRender.test.mjs)
{ const { chainReadsPoem } = await import('../textureGenerators.js');
  check('Circuit Board, Broken Glass and Dewy Webs always read it; Halftone, Flow-Field Ink, Contour Map and Silverpoint Hatch only under Shape Aware; Clouds never',
    ['circuit', 'brokenglass', 'dewwebs'].every(t => chainReadsPoem(t, false)) && ['halftone', 'flowfield', 'contour', 'hatch'].every(t => !chainReadsPoem(t, false) && chainReadsPoem(t, true)) && !chainReadsPoem('clouds', true)); }
// Circuit Board keeps clear of the poem's lines, keyed by them coarsely: a keystroke inside a line draws nothing again
{ const T = await import('../textureGenerators.js');
  const a = '0.1,0.2,0.3,0.23,0,0,0;0.31,0.2,0.4,0.23,0,0,0', b = '0.1,0.2,0.3,0.23,0,0,0;0.31,0.2,0.401,0.23,0,0,0', c = a + ';0.1,0.3,0.6,0.33,1,0,0';
  check('Circuit Board reads the poem by whole lines: typing inside a line keeps its key; a new line changes it',
    T.chainReadsPoem('circuit') && !T.chainReadsPoem('rainwater') && T.poemLines(a) === T.poemLines(b)
    && T.textureKeyFor('circuit', 64, 64, { text: a }) === T.textureKeyFor('circuit', 64, 64, { text: b }) && T.textureKeyFor('circuit', 64, 64, { text: a }) !== T.textureKeyFor('circuit', 64, 64, { text: c })
    && T.textureKeyFor('rainwater', 64, 64, { text: a }) === T.textureKeyFor('rainwater', 64, 64, { text: c })); }
done();
