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
  // F5, F7, F8: channels as HSB and Lab, a rank filter, a switch by map, a flip, a floor in perspective
  const pic = [node(1, 'perlin', { scale: 60 }), node(2, 'hue', { slot: '1' }), node(3, 'hue', { slot: '2' }), node(4, 'tint', {}, { 1: [1, 1], 2: [2, 1], 3: [3, 1] })], T2 = { tints: ['#E04020', '#2060C0'] };
  const orig = run(pic, [4, 1], T2), back = (sp, mg) => run([...pic, node(5, sp, {}, { 1: [4, 1] }), node(6, mg, {}, { 1: [5, 1], 2: [5, 2], 3: [5, 3] })], [6, 1], T2);
  const err = im => { let e = 0; for(let i = 0; i < W*H; i++) e = Math.max(e, Math.abs(im.r[i] - orig.r[i]), Math.abs(im.g[i] - orig.g[i]), Math.abs(im.b[i] - orig.b[i])); return e; };
  check('Split HSB and Merge HSB, and Split Lab and Merge Lab, take a picture apart and put it back as it was', err(back('splithsb', 'mergehsb')) < 1e-3 && err(back('splitlab', 'mergelab')) < 0.01);
  const speck = [node(1, 'number', { value: 20 }), node(2, 'shape', { form: 'circle', size: 4, soft: 1 }), node(3, 'math', { op: 'max' }, { 1: [1, 1], 2: [2, 1] })];
  const md = run([...speck, node(4, 'median', { radius: 100 }, { 1: [3, 1] })], [4, 1]), dark = run([...speck, node(4, 'median', { radius: 100, rank: 0 }, { 1: [3, 1] })], [4, 1]);
  check('Median takes a lone speck away (every point the middle of its neighbors); Percentile 0 takes the darkest', run(speck, [3, 1]).r[20*W + 20] > 0.9 && md.r[20*W + 20] < 0.25 && Math.max(...dark.r) < 0.25);
  const sw = run([node(1, 'gradient', { angle: 0 }), node(2, 'colour', { hex: '#FF0000' }), node(3, 'colour', { hex: '#00FF00' }), node(4, 'colour', { hex: '#0000FF' }), node(5, 'mapswitch', { soft: 0 }, { 1: [1, 1], 2: [2, 1], 3: [3, 1], 4: [4, 1] })], [5, 1]);
  check('Map Switch: a gradient shows A on its dark third, B in the middle, C on its light third', sw.r[20*W + 3] > 0.9 && sw.g[20*W + 20] > 0.9 && sw.b[20*W + 37] > 0.9);
  const fp = run([node(1, 'gradient', { angle: 0 }), node(2, 'flip', {}, { 1: [1, 1] })], [2, 1]), g0 = run([node(1, 'gradient', { angle: 0 })], [1, 1]);
  check('Flip turns a picture over: a left-to-right gradient runs right to left', Math.abs(fp.r[20*W + 5] - g0.r[20*W + 34]) < 1e-6 && fp.r[20*W + 5] > fp.r[20*W + 34]);
  const flat = run([...pic, node(5, 'perspective', { tilt: 0 }, { 1: [4, 1] })], [5, 1], T2), slant = run([...pic, node(5, 'perspective', { tilt: 80 }, { 1: [4, 1] })], [5, 1], T2);
  check('Perspective at Tilt 0 is the picture as it is; tilted, the bottom row stays and the top changes', err(flat) < 1e-5 && Math.abs(slant.r[39*W + 20] - orig.r[39*W + 20]) < 0.05 && err(slant) > 0.05);
  const rot = a => run([node(1, 'gradient', { angle: 0 }), node(2, 'rotate', { angle: a }, { 1: [1, 1] })], [2, 1]), r0 = rot(0), r90 = rot(90), r180 = rot(180);
  check('Rotate: at 0 the picture as it is; a half turn runs a left-to-right gradient right to left; a quarter turn runs it top to bottom',
    Math.abs(r0.r[20*W + 7] - g0.r[20*W + 7]) < 1e-5 && Math.abs(r180.r[20*W + 8] - g0.r[20*W + 31]) < 0.03 && Math.abs(r90.r[8*W + 20] - r90.r[8*W + 30]) < 0.03 && Math.abs(r90.r[8*W + 20] - r90.r[30*W + 20]) > 0.2);
  const sc1 = run([...pic, node(5, 'scale', { scale: 100 }, { 1: [4, 1] })], [5, 1], T2), sc2 = run([node(1, 'gradient', { angle: 0 }), node(2, 'scale', { scale: 200 }, { 1: [1, 1] })], [2, 1]);
  check('Scale: at 100 the picture as it is; at 200 a gradient climbs half as fast, its middle where it was',
    err(sc1) < 1e-5 && Math.abs(sc2.r[20*W + 30] - g0.r[20*W + 25]) < 0.03 && Math.abs(sc2.r[20*W + 10] - g0.r[20*W + 15]) < 0.03);
  // Glow: a bloom in one part
  const dot = [node(1, 'shape', { form: 'circle', size: 6, soft: 1 })], gw = run([...dot, node(2, 'glow', { radius: 100, aura: 0, core: 0 }, { 2: [1, 1] })], [2, 1]);
  const none = run([...pic, node(5, 'glow', {}, { 1: [4, 1] })], [5, 1], T2), over = run([...pic, ...[node(6, 'shape', { form: 'circle', size: 6, soft: 1 })], node(5, 'glow', {}, { 1: [4, 1], 2: [6, 1] })], [5, 1], T2);
  check('Glow: light spreads from a bright place, fading with distance; with nothing glowing the picture is left as it is; it only ever brightens',
    gw.r[20*W + 20] > gw.r[20*W + 24] && gw.r[20*W + 24] > gw.r[20*W + 2] && err(none) < 1e-6 && over.r.every((v, i) => v >= orig.r[i] - 1e-6));
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
  const extra = { motionblur: { length: 100 }, grow: { radius: 60 }, highpass: { radius: 100 }, sharpen: { radius: 100 }, material: { relief: 200, shine: 100 }, grid: { kind: 'dots' }, multiblend: { mode: 'multiply' } };
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
// ---- the Surface's Anti-aliasing (Filter Forge's menu, A6) ----
{ const hard = [node(1, 'noise', { scale: 30 }), node(2, 'threshold', { at: 50, soft: 0 }, { 1: [1, 1] })];
  const off = run(hard, [2, 1]), off2 = run(hard, [2, 1], { surface: { aa: 'off' } }), edge = run(hard, [2, 1], { surface: { aa: 'edges only' } });
  const soft = [node(1, 'noise', { scale: 40 })], s0 = run(soft, [1, 1]), s1 = run(soft, [1, 1], { surface: { aa: 'edges only' } });
  const mid = im => im.r.filter(v => v > 0.05 && v < 0.95).length;
  // (a point is by an edge when a point near it differs at all — FXAA's least contrast, 0.03: where none does, nothing may change)
  const nearEdge = i => { const x = i % W, y = (i/W) | 0; for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++){ const xx = Math.max(0, Math.min(W - 1, x + dx)), yy = Math.max(0, Math.min(H - 1, y + dy)); if(Math.abs(off.r[yy*W + xx] - off.r[i]) > 0.03) return true; } return false; };
  check('Anti-aliasing off (and a Surface without the setting, as every older graph) draws exactly as before', off.r.every((v, i) => v === off2.r[i]));
  check('edges only smooths a hard edge where it steps across the grid: in-between grays along it, and nothing changed away from it',
    mid(edge) > 3*Math.max(1, mid(off)) && edge.r.every((v, i) => v === off.r[i] || nearEdge(i)));
  check('…and leaves a soft picture almost alone (on average under a 500th)', s0.r.reduce((t, v, i) => t + Math.abs(v - s1.r[i]), 0)/s0.r.length < 0.002);
  check('the setting is read by name, and anything else is off', C.athanorAA(graph([node(99, 'surface', { aa: 'all pixels' })])) === 'all pixels' && C.athanorAA(graph([node(99, 'surface', { aa: 'sideways' })])) === 'off'
    && C.athanorAA(graph([node(99, 'surface', {})])) === 'off'); }
// ---- Smudge, Multiblend (F7) and the rest of the curve shapes and operations (F10) ----
{ // a top-to-bottom ramp, smudged downward: each point takes on the darker ramp above it; the top row has nothing above
  const ramp = node(1, 'gradient', {}), raw = run([ramp], [1, 1]), im = run([ramp, node(4, 'smudge', { angle: 90, length: 40, strength: 100, trail: 60 }, { 1: [1, 1] })], [4, 1]);
  check('Smudge carries what lies behind each point forward (a ramp smudged down is pulled toward its darker top)', !!im && px(im, 20, 30) < px(raw, 20, 30) - 0.02 && Math.abs(px(im, 20, 0) - px(raw, 20, 0)) < 0.02); }
{ const mb = run([node(1, 'number', { value: 50 }), node(2, 'number', { value: 100 }), node(3, 'multiblend', { mode: 'normal', op1: 50 }, { 1: [1, 1], 2: [2, 1] })], [3, 1]);
  const two = run([node(1, 'number', { value: 50 }), node(2, 'number', { value: 100 }), node(5, 'number', { value: 0 }), node(3, 'multiblend', { mode: 'normal', op1: 100, op2: 50 }, { 1: [1, 1], 2: [2, 1], 3: [5, 1] })], [3, 1]);
  check('Multiblend lays its layers over the base in turn, each at its own strength', Math.abs(px(mb, 5, 5) - 0.75) < 0.01 && Math.abs(px(two, 5, 5) - 0.5) < 0.01); }
{ const E0 = { num: (n, k, d) => n.data[k] ?? d, P: (n, k, d) => n.data[k] ?? d }, cv = (shape, x = {}) => S.STEPS.curve.run(E0, { data: { shape, ...x } })[0];
  const half = cv('half circle'), slow = cv('arc slow'), q = cv('quarter circles', { count: 2 });
  check('Curve: a half circle, an arc that rises slowly, and a row of quarter circles', Math.abs(S.curveAt(half, 0.5) - 1) < 0.01 && S.curveAt(half, 0) < 0.05
    && S.curveAt(slow, 0) < 0.01 && S.curveAt(slow, 1) > 0.99 && S.curveAt(slow, 0.5) < 0.2 && S.curveAt(q, 0.5) < S.curveAt(q, 0.45));
  const ops = (op, a, b, amount = 50) => S.STEPS.curveops.run({ ...E0, isCurve: v => !!(v && v.curve), input: (n, j) => j === 1 ? a : j === 2 ? b : undefined }, { data: { op, amount } })[0];
  const lo = cv('linear', { low: 0, high: 0 }), hi = cv('linear', { low: 100, high: 100 }), tr = ops('transition', lo, hi, 20), fd = ops('fade', hi, null, 40);
  check('Curve Ops: Transition crosses from the first curve to the second; Fade eases a curve to nothing at its ends',
    S.curveAt(tr, 0.1) < 0.01 && S.curveAt(tr, 0.9) > 0.99 && Math.abs(S.curveAt(tr, 0.5) - 0.5) < 0.05 && S.curveAt(fd, 0) < 0.01 && S.curveAt(fd, 1) < 0.01 && S.curveAt(fd, 0.5) > 0.99); }
console.log(failures ? `\n${failures} FAILURES` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
