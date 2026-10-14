/**
 * poem.test.mjs — surfaces that know where the poem is.
 *
 * From the future-directions doc Ruby shared: "Treat readability as part of
 * the shader, not a final warning." The page records where its words sit
 * (canvasRenderer TEXT_LAYOUT); Text Clearing quiets any surface behind
 * them; the Athanor's The Poem part hands the same layout to a graph.
 *
 * Run: node test/poem.test.mjs
 */
import { readFileSync } from 'fs';
globalThis.document = { createElement: () => ({ getContext: () => null }) };
const { STEPS, poemRuns, stepDistance } = await import('../steps.js');
const { evalAthanor, athanorStarter } = await import('../athanor.js');
const { textureKeyFor } = await import('../textureGenerators.js');
let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const cr = readFileSync(new URL('../canvasRenderer.js', import.meta.url), 'utf8');

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
check('every new part has its doc', ['poem', 'grow', 'pixelate', 'twirl', 'mirror', 'chroma'].every(k => STEPS[k] && STEPS[k].doc.length > 40));
check('the Ripples from the Words starter teaches with The Poem', /"name":"poem"/.test(JSON.stringify(athanorStarter('ripples'))));

// the cache: the layout is part of a graph's key only when the graph asks for it
{ const g = JSON.stringify(athanorStarter('ripples'));
  const a = textureKeyFor('athanor', 300, 400, { graph: g, text: 'a' }), b = textureKeyFor('athanor', 300, 400, { graph: g, text: 'b' }), c = textureKeyFor('linen', 300, 400, { text: 'a' }), d = textureKeyFor('linen', 300, 400, {});
  check('a poem graph\'s cache key follows the layout; any other surface\'s never does', a !== b && c === d); }

// the page's side
check('the renderer records each run as fractions of the page, and asks one more frame when the layout changes',
  /let TEXT_LAYOUT = '';/.test(cr) && /textRuns\.push\(\[x0\/W, top\/H, x1\/W, \(top \+ h\)\/H, lineNo, stanza, rhyme\]/.test(cr) && /if\(lay !== TEXT_LAYOUT\)\{ TEXT_LAYOUT = lay;/.test(cr));
check('Text Clearing takes a soft mask of the words out of each surface layer (destination-out), the mask made small in page fractions',
  /c\.globalCompositeOperation = 'destination-out'; c\.globalAlpha = Math\.min\(1, amount\);/.test(cr) && /const mw = 192, mh = Math\.max\(8, Math\.round\(192\*H\/W\)\)/.test(cr));
check('only a graph with The Poem in it is sent the layout', /const text = graph && graphUsesPoem\(graph\) \? TEXT_LAYOUT : undefined;/.test(cr));
console.log(failures ? `\n${failures} FAILURES` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
