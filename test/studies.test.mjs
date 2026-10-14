/**
 * studies.test.mjs — the parts made for the surface studies, and the studies
 * themselves (athanorStudies.js): Ruby wants every surface from the
 * future-directions doc as a graph of parts in the Athanor, not a black box.
 * Run: node test/studies.test.mjs
 */
import { installCanvasMock } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
installDomMock(); installCanvasMock();
const S = await import('../steps.js');
const A = await import('../athanor.js');
const { ATHANOR_STUDIES } = await import('../athanorStudies.js');
let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const W = 40, H = 40;
const node = (id, name, data, ins = {}) => ({ id, name, data, inputs: Object.fromEntries(Object.entries(ins).map(([k, [nd, o]]) => ['input_' + k, { connections: [{ node: String(nd), input: 'output_' + o }] }])), outputs: { output_1: { connections: [] } } });
const graph = (nodes, v = 3) => JSON.stringify({ v, drawflow: { Home: { data: Object.fromEntries(nodes.map(n => [n.id, n])) } } });
const run = (nodes, out, ctx = {}) => A.evalAthanor(graph([...nodes, node(99, 'surface', { ground: 'colour' }, { 1: out })]), W, H, { seed: 3, knobs: [], tints: [], div: 1, ...ctx }, {});
const spread = im => { if(!im) return 0; let lo = 9, hi = -9; for(let i = 0; i < im.r.length; i++){ const v = im.r[i] + im.g[i] + im.b[i]; lo = Math.min(lo, v); hi = Math.max(hi, v); } return hi - lo; };
const at = (im, x, y) => im.r[y*W + x];

// ---- the new parts ----
check('the pattern parts exist, each with a doc', ['scatter', 'grid', 'border', 'lookup', 'displace', 'gradmap', 'spectrum'].every(k => S.STEPS[k] && S.STEPS[k].doc.length > 40));
check('Lookup, Displace and Gradient Map need their first input', ['lookup', 'displace', 'gradmap'].every(k => S.STEPS[k].required.includes(1)));
{ const b = run([node(1, 'border', { shape: 'square', width: 20, soft: 0 })], [1, 1]);
  check('Border Mask: white at the edge, black in the middle', at(b, 0, 20) > 0.9 && at(b, 20, 20) < 0.1); }
{ const g = run([node(1, 'grid', { kind: 'stripes', cells: 4, weight: 50, soft: 0 })], [1, 1]);
  check('Grid & Dots draws a pattern (stripes vary across the page)', spread(g) > 2); }
{ const gm = run([node(1, 'gradient', { shape: 'linear', angle: 0 }), node(2, 'gradmap', { stops: 2, c1: '#000000', c2: '#FF0000' }, { 1: [1, 1] })], [2, 1]);
  check('Gradient Map colors a map: black at its low end, red at its high', gm.r[20*W + 1] < 0.1 && gm.r[20*W + 38] > 0.9 && gm.g[20*W + 38] < 0.1); }
{ const sp = run([node(1, 'spectrum', { shape: 'linear', sat: 100, light: 50 })], [1, 1]);
  check('Spectrum is in color (red, green and blue differ somewhere)', sp && sp.r.some((r, i) => Math.abs(r - sp.g[i]) > 0.3)); }
{ const base = [node(1, 'gradient', { shape: 'linear', angle: 0 })];
  const plain = run([...base, node(2, 'displace', { amount: 0 }, { 1: [1, 1], 2: [1, 1] })], [2, 1]), moved = run([...base, node(3, 'noise', { scale: 10 }), node(2, 'displace', { amount: 100 }, { 1: [1, 1], 2: [3, 1] })], [2, 1]);
  check('Displace at 0 changes nothing; at 100 by noise, it moves the picture', Math.abs(at(plain, 20, 20) - 0.5) < 0.06 && plain.r.some((v, i) => Math.abs(v - moved.r[i]) > 0.02)); }
{ const a = run([node(1, 'noise', { scale: 20 })], [1, 1]), b = run([node(1, 'noise', { scale: 20, variation: 7 })], [1, 1]), a2 = run([node(1, 'noise', { scale: 20 })], [1, 1]);
  check('Variation: a new number is a new pattern; the same number is the same pattern', a.r.some((v, i) => Math.abs(v - b.r[i]) > 0.05) && a.r.every((v, i) => v === a2.r[i])); }
check('The Poem has a Rhymes output and a rhyme to pick', S.STEPS.poem.outs.includes('rhymes') && S.STEPS.poem.params.some(p => p[0] === 'rhyme'));

// ---- the studies ----
const st = Object.entries(ATHANOR_STUDIES);
check('there are at least 36 surface studies', st.length >= 36);
check('every study teaches: "This is…" and a "Try:"', st.every(([, s]) => /^This is/.test(s.teach) && /Try:/.test(s.teach)));
check('every study is made of general parts only (no Texture from the Menu, no unknown part)', st.every(([, s]) => s.nodes.every(([t]) => S.STEPS[t] && t !== 'texture')));
check('every study has exactly one Surface', st.every(([, s]) => s.nodes.filter(([t]) => t === 'surface').length === 1));
check('every study offers at least one Knob or the Dial', st.every(([, s]) => s.nodes.some(([t]) => t === 'knob' || t === 'dial')));
for(const [k] of st){
  const g = A.athanorStarter(k), v = A.validateGraph(JSON.stringify(g));
  const knobs = A.athanorKnobs(JSON.stringify(g));
  check(`${k}: opens as a newest-version graph, validates clean, and its knobs reach the Surface`, g.v === A.ATHANOR_VERSION && v.ok && !v.problems.length && knobs.length >= (g.drawflow.Home.data && Object.values(g.drawflow.Home.data).filter(n => n.name === 'knob').length));
}
check('Start from… offers the studies by name', (await import('../forge.js')) && true);
console.log(failures ? `\n${failures} FAILURES` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
