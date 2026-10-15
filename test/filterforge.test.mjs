/**
 * filterforge.test.mjs — what the Athanor took from Filter Forge (Ruby: "take note of
 * the primitives and operations, how the rendering engine works, its output stages,
 * mixers and sliders and usability functions").
 *
 * Curves (a fifth kind of wire), the missing primitives, required inputs with a
 * stand-in, the Note, the Surface's Size, controls that show only when they reach
 * the Surface. Run: node test/filterforge.test.mjs
 */
import { readFileSync } from 'fs';
globalThis.document = { createElement: () => ({ getContext: () => null }) };
const S = await import('../steps.js');
const C = await import('../athanor.js');
const F = await import('../forge.js');
let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const W = 40, H = 40;
const node = (id, name, data, ins = {}) => ({ id, name, data, inputs: Object.fromEntries(Object.entries(ins).map(([k, [nd, o]]) => ['input_' + k, { connections: [{ node: String(nd), input: 'output_' + o }] }])), outputs: { output_1: { connections: [] } } });
const graph = (nodes, v = 3) => JSON.stringify({ v, drawflow: { Home: { data: Object.fromEntries(nodes.map(n => [n.id, n])) } } });
const run = (nodes, out, ctx = {}) => C.evalAthanor(graph([...nodes, node(99, 'surface', { ground: 'grey', ...(ctx.surface || {}) }, { 1: out })]), W, H, { seed: 3, knobs: [], tints: [], ...ctx }, {});
const preview = (nodes, id) => C.evalAthanor(graph(nodes), W, H, { seed: 3, knobs: [], tints: [], all: true }, {}).get(String(id));
const px = (im, x, y) => im.r[y*W + x];

// ---- curves ----
check('a fifth kind of wire: the curve, with its own color, name and help', S.VALUE_TYPES.includes('curve') && /--t-curve:#[0-9A-Fa-f]{6}[\s\S]*\.forge-veil\{[^}]*--t-curve:/.test(readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8')) && F.FORGE_TYPE_NAMES.curve === 'a curve'
  && S.STEP_CATEGORIES.includes('Curves') && Object.values(S.STEPS).filter(s => s.cat === 'Curves').length >= 3);
{ const c = t => S.curveAt(t, 0.5), mk = (shape, extra = {}) => preview([node(1, 'curve', { shape, amount: 25, count: 4, ...extra })], 1);
  const lin = S.STEPS.curve.run({ num: (n, k, d) => n.data[k] ?? d, P: (n, k, d) => n.data[k] ?? d }, { data: { shape: 'linear' } })[0];
  const stairs = S.STEPS.curve.run({ num: (n, k, d) => n.data[k] ?? d, P: (n, k, d) => n.data[k] ?? d }, { data: { shape: 'stairs', count: 2 } })[0];
  check('Curve: linear is t, stairs steps, and every shape can be read anywhere between its samples', Math.abs(S.curveAt(lin, 0.3) - 0.3) < 1e-6 && S.curveAt(stairs, 0.1) === 0 && S.curveAt(stairs, 0.5) === 0.5 && S.curveAt(stairs, 0.95) === 1);
  check('a curve previews as its graph (a bright line on dark)', (() => { const p = mk('linear'); return p && Math.max(...p.r) > 0.9 && p.r.filter(v => v > 0.5).length < W*H*0.2; })()); }
{ const wave = [node(1, 'curve', { shape: 'wave', count: 2 })];
  const tc = run([node(2, 'gradient', { shape: 'linear', angle: 0 }), ...wave, node(3, 'tonecurve', { mix: 100 }, { 1: [2, 1], 2: [1, 1] })], [3, 1]);
  check('Tone Curve runs a gradient through a wave: light and dark bands across the page', px(tc, 0, 20) < 0.1 && px(tc, 10, 20) > 0.9 && px(tc, 20, 20) < 0.1);
  const pr = run([node(1, 'curve', { shape: 'impulse', amount: 50 }), node(2, 'profile', { shape: 'radial' }, { 1: [1, 1] })], [2, 1]);
  check('Profile Gradient: a radial impulse is a ring, bright halfway out', px(pr, 20, 20) < 0.2 && px(pr, 30, 20) > 0.8);
  const ops = preview([node(1, 'curve', { shape: 'linear' }), node(2, 'curveops', { op: 'reverse' }, { 1: [1, 1] })], 2);
  check('Curve Ops changes a curve (Reverse: a falling line)', !!ops); }

// ---- primitives ----
check('Filter Forge\'s missing primitives are parts, each with its doc', ['bricon', 'highpass', 'sharpen', 'motionblur', 'offset', 'perlin', 'bricks', 'curve', 'curveops', 'tonecurve', 'profile', 'note'].every(k => S.STEPS[k] && S.STEPS[k].doc.length > 40));
{ const a = run([node(1, 'perlin', {})], [1, 1]), b = run([node(1, 'perlin', {})], [1, 1]), c = run([node(1, 'perlin', {})], [1, 1], { seed: 9 });
  check('Perlin Noise is the same for the same seed, different for another', a.r.every((v, i) => v === b.r[i]) && a.r.some((v, i) => v !== c.r[i]) && Math.max(...a.r) - Math.min(...a.r) > 0.2); }
{ const br = C.evalAthanor(graph([node(1, 'bricks', { rows: 4, mortar: 20 }), node(99, 'surface', { ground: 'grey' }, { 1: [1, 2] })]), W, H, { seed: 1, knobs: [], tints: [] }, {});
  check('Bricks hands on the mortar between the bricks (white on the joints)', px(br, 10, 0) === 1 && px(br, 10, 5) === 0 && px(br, 20, 5) === 1); }
check('Math has Filter Forge\'s useful RGB Math (divide, power, average, screen, modulo, sine), the old operations unchanged', ['add', 'multiply', 'max', 'min', 'difference', 'subtract', 'divide', 'power', 'average', 'screen', 'modulo', 'sine'].every(o => S.STEPS.math.params[0][4].options.includes(o)) && S.STEPS.math.params[0][4].options[0] === 'add');

// ---- more of Filter Forge's primitives (ROADMAP §2 F): shapes, a mesh, noises, a drifting gradient, RGB Math ----
{ const Pt = await import('../stepsPatterns.js');
  const across = (im, y = 20) => Array.from({ length: W }, (_, x) => im.r[y*W + x] > 0.5 ? 1 : 0), runs = row => row.filter((v, i) => v && !row[i - 1]).length;
  const el = run([node(1, 'ellipse', { size: 80, height: 100, rings: 3, line: 100, soft: 0 })], [1, 1]);
  check('Ellipse: three rings drawn as lines are crossed six times on a line through the center', runs(across(el)) === 6);
  const dist = run([node(1, 'ellipse', { size: 160, height: 50 })], [1, 2]), ar = run([node(1, 'ellipse', {})], [1, 3]);
  check('…its Distance is 0 at the center and grows outward faster across its short axis, and Around runs once round', dist.r[20*W + 20] < 0.05 && dist.r[26*W + 20] > dist.r[20*W + 26] && Math.abs(ar.r[20*W + 30] - 0.5) < 0.05 && ar.r[10*W + 20] < 0.3);
  const sq = run([node(1, 'polygon', { sides: 4, size: 100, angle: 45 })], [1, 1]), bv = run([node(1, 'polygon', { sides: 4, size: 100, angle: 45 })], [1, 2]);
  check('Polygon: four sides turned 45° is a square (its corner filled, a point past its side empty); its Bevel rises flat to the center',
    sq.r[11*W + 11] > 0.5 && sq.r[20*W + 39] < 0.5 && bv.r[20*W + 20] > 0.95 && Math.abs((bv.r[20*W + 23] - bv.r[20*W + 26]) - (bv.r[20*W + 26] - bv.r[20*W + 29])) < 0.02);
  const st = run([node(1, 'polygon', { sides: 5, star: 60, size: 80 })], [1, 1]);
  check('…and Star pulls every other corner in: a five-pointed star covers less than its pentagon', st.r.reduce((a, v) => a + v, 0) < run([node(1, 'polygon', { sides: 5, size: 80 })], [1, 1]).r.reduce((a, v) => a + v, 0)*0.75);
  const pts = Array.from({ length: 60 }, (_, i) => [Math.abs(Math.sin(i*12.9898)*437.5) % 100, Math.abs(Math.sin(i*78.233)*943.1) % 100]), tris = Pt.patDelaunay(pts);
  const inCircle = tris.some(([a, b, c]) => { const [ax, ay] = pts[a], [bx, by] = pts[b], [cx, cy] = pts[c], d = 2*(ax*(by - cy) + bx*(cy - ay) + cx*(ay - by));
    const ux = ((ax*ax + ay*ay)*(by - cy) + (bx*bx + by*by)*(cy - ay) + (cx*cx + cy*cy)*(ay - by))/d, uy = ((ax*ax + ay*ay)*(cx - bx) + (bx*bx + by*by)*(ax - cx) + (cx*cx + cy*cy)*(bx - ax))/d, r2 = (ax - ux)**2 + (ay - uy)**2;
    return pts.some((p, i) => i !== a && i !== b && i !== c && (p[0] - ux)**2 + (p[1] - uy)**2 < r2*(1 - 1e-9)); });
  check('Triangle Mesh is Delaunay: no point lies inside another triangle\'s circle, and n points make 2n − 2 − (hull) triangles', tris.length > 60 && tris.length < 120 && !inCircle);
  const py = run([node(1, 'pyramids', { scale: 4, vary: 0 })], [1, 1]);
  check('Pyramids: each cell rises to 1 at its middle and falls to 0 at its edge', Math.max(...py.r) > 0.9 && Math.min(...py.r) < 0.06);
  const two = run([node(1, 'gradient', { angle: 0 }), node(2, 'noisegrad', { drift: 0, smooth: 100, stops: 2, ca: '#000000', cb: '#FFFFFF' }, { 1: [1, 1] })], [2, 1]);
  const drift = run([node(1, 'gradient', { angle: 0 }), node(2, 'noisegrad', { drift: 80, stops: 8, ca: '#000000', cb: '#FFFFFF' }, { 1: [1, 1] })], [2, 1]);
  check('Noise Gradient: with no drift and two stops it is the plain gradient; with drift its colors stray', Math.abs(two.r[20*W + 30] - 30/W) < 0.06 && drift.r.some((v, i) => Math.abs(v - drift.g[i]) > 0.05));
  const fl = run([node(1, 'gradient', { angle: 0 }), node(2, 'number', { value: 25 }), node(3, 'math', { op: 'floor' }, { 1: [1, 1], 2: [2, 1] })], [3, 1]);
  const gt = run([node(1, 'gradient', { angle: 0 }), node(2, 'number', { value: 50 }), node(3, 'math', { op: 'greater' }, { 1: [1, 1], 2: [2, 1] })], [3, 1]);
  check('Math: Floor snaps to steps of B (a gradient becomes four terraces); Greater is white only where A is lighter than B', new Set(fl.r.map(v => Math.round(v*100))).size <= 5 && gt.r[20*W + 5] === 0 && gt.r[20*W + 35] === 1);
  const stones = run([node(1, 'cells', { scale: 40, gap: 30 })], [1, 4]);
  check('Cells hands on Stones too: rounded, highest in the middle, with gaps of 0 between', Math.max(...stones.r) > 0.9 && stones.r.filter(v => v === 0).length > W*H*0.05); }

// ---- parameter mapping: every setting a part declares in `maps` follows a map point by point (from v3, or the
// version it names: `scale:4`), and only the map's average in an older graph ----
{ const T = ['#FF3000', '#0030FF'];
  // what each kind of input is fed (a picture: Perlin noise tinted in two hues, so a hue's turn shows)
  const feed = { field: (id, nodes) => (nodes.push(node(id, 'perlin', { scale: 120 })), [id, 1]),
    image: (id, nodes) => (nodes.push(node(id + 50, 'perlin', { scale: 90 }), node(id, 'tint', {}, { 1: [id + 50, 1] })), [id, 1]),
    curve: (id, nodes) => (nodes.push(node(id, 'curve', { shape: 'wave', count: 2 })), [id, 1]) };
  // only the inputs a part needs (a mask on Mix, or a gloss map on the Light Engine, would stand in for the setting), and settings that let the mapped one show
  const only = { mix: [1, 2], material: [1, 2] };
  const extra = { motionblur: { length: 100 }, grow: { radius: 60 }, highpass: { radius: 100 }, sharpen: { radius: 100 }, material: { relief: 200, shine: 100 }, grid: { kind: 'dots' } };
  const canvasDrawn = new Set(['scatter']);   // (draws its marks on a canvas, which Node can't rasterize: checked by eye)
  // the setting driven by a gradient (angle 0 or 180), or by a Number at the gradient's average (`flat`)
  const avg = (() => { const g = C.evalAthanor(graph([node(1, 'gradient', { shape: 'linear', angle: 0 }), node(99, 'surface', { ground: 'grey' }, { 1: [1, 1] })]), W, H, { seed: 3, knobs: [], tints: T }, {});
    let t = 0; for(const x of g.r) t += x; return t/g.r.length; })();
  const outOf = (k, key, angle, v) => { const s = S.STEPS[k], nodes = [angle === 'flat' ? node(1, 'number', { value: avg*100 }) : node(1, 'gradient', { shape: 'linear', angle })], ins = {};
    s.inTypes.slice(0, s.dataIns).forEach((t, j) => { if(feed[t] && (!only[k] || only[k].includes(j + 1))) ins[j + 1] = feed[t](10 + j, nodes); });
    ins[S.paramPort(k, key)] = [1, 1];
    nodes.push(node(5, k, { ...(extra[k] || {}) }, ins), node(99, 'surface', { ground: 'grey' }, { 1: [5, 1] }));
    const im = C.evalAthanor(graph(nodes, v), W, H, { seed: 3, knobs: [], tints: T }, {});
    return im ? (im.r || im) : null; };
  const diff = (a, b) => { let t = 0; for(let i = 0; i < a.length; i++) t += Math.abs(a[i] - b[i]); return t/a.length; };
  const mapped = Object.entries(S.STEPS).flatMap(([k, s]) => s.maps.map(key => [k, key]));
  const stray = mapped.filter(([k, key]) => !S.STEPS[k].paramPorts.includes(key));
  check('every setting declared as taking a map is a real setting with a ⚙ port' + (stray.length ? ': ' + stray.join(' ') : ''), mapped.length >= 30 && !stray.length);
  const still = [], leaks = [];
  for(const [k, key] of mapped.filter(([k]) => !canvasDrawn.has(k))){
    const since = S.STEPS[k].mapsSince[key] || 3;
    const a3 = outOf(k, key, 0, since), b3 = outOf(k, key, 180, since), a2 = outOf(k, key, 0, since - 1), f2 = outOf(k, key, 'flat', since - 1);
    if(!a3 || !b3 || diff(a3, b3) < 0.002) still.push(k + '.' + key);
    if(!a2 || !f2 || diff(a2, f2) > 1e-3) leaks.push(k + '.' + key); }
  check('in a graph of its version each of them follows the map point by point (a gradient and its reverse give different pictures)' + (still.length ? ': not for ' + still.join(', ') : ''), !still.length);
  check('in the version before, each takes only the map\'s average (as a Number at that average does), so old graphs draw as they did' + (leaks.length ? ': not for ' + leaks.join(', ') : ''), !leaks.length);
  // a setting not in the list never maps: Pixelate reads Size whole even in the newest graph
  const pa = outOf('pixelate', 'size', 0, C.ATHANOR_VERSION), pb = outOf('pixelate', 'size', 'flat', C.ATHANOR_VERSION);
  check('a setting not declared reads a map\'s average, even in the newest graph', !S.STEPS.pixelate.maps.includes('size') && diff(pa, pb) < 1e-4); }

// ---- required inputs ----
check('required inputs are known for the parts that need one', S.STEPS.blur.required.includes(1) && S.STEPS.levels.required.includes(1) && !S.STEPS.mix.required.length && !S.STEPS.noise.required.length);
{ const p = preview([node(1, 'blur', { radius: 2 })], 1), real = C.evalAthanor(graph([node(1, 'blur', { radius: 2 }), node(99, 'surface', { ground: 'grey' }, { 1: [1, 1] })]), W, H, { seed: 1, knobs: [], tints: [] }, {});
  check('an empty required input shows a stand-in pattern in the step preview (a gray map\'s part sees it in gray), and never reaches the Surface', p && Math.max(...p.r) - Math.min(...p.r) > 0.1 && real && real.r.every(v => Math.abs(v - real.r[0]) < 1e-6)); }

// ---- the Note, the Size, the controls ----
check('a Note makes nothing and breaks nothing', run([node(5, 'note', { text: 'hello' }), node(1, 'noise', {})], [1, 1]) !== null && S.STEPS.note.outs.length === 0);
{ const a = run([node(1, 'noise', { scale: 40 })], [1, 1]), b = run([node(1, 'noise', { scale: 40 })], [1, 1], { surface: { size: 100 } }), c = run([node(1, 'noise', { scale: 40 })], [1, 1], { surface: { size: 300 } });
  check('the Surface\'s Size scales every distance in the graph; at 100 it is exactly as before', a.r.every((v, i) => v === b.r[i]) && a.r.some((v, i) => v !== c.r[i])); }
{ const g = graph([node(1, 'knob', { slot: '1', name: 'Wired' }), node(2, 'knob', { slot: '2', name: 'Loose' }), node(3, 'number', {}), node(4, 'blur', {}, { 1: [3, 1], [S.paramPort('blur', 'radius')]: [1, 1] }),
    node(6, 'hue', { slot: '2', name: 'Loose Hue' }), node(99, 'surface', {}, { 1: [4, 1] })]);
  check('controls show only when they reach the Surface (Filter Forge: a control not connected to the Result isn\'t shown)', JSON.stringify(C.athanorKnobs(g).map(k => k.label)) === '["Wired"]' && C.athanorHues(g).length === 0); }
console.log(failures ? `\n${failures} FAILURES` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
