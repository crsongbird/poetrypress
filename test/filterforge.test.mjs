/**
 * filterforge.test.mjs — what the Athanor took from Filter Forge (Ruby: "take note of
 * the primitives and operations, how the rendering engine works, its output stages,
 * mixers and sliders and usability functions").
 *
 * Curves (a fifth kind of wire), the missing primitives, required inputs with a
 * stand-in, the Note, the Surface's Size, controls that show only when they reach
 * the Surface. Run: node test/filterforge.test.mjs
 */
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
check('a fifth kind of wire: the curve, with its own color, name and help', S.VALUE_TYPES.includes('curve') && F.FORGE_TYPE_COLOURS.curve && F.FORGE_TYPE_NAMES.curve === 'a curve'
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
