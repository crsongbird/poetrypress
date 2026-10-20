/**
 * groups.test.mjs — groups in an Athanor graph (a group is a part made of parts) and ports saved by name.
 *   - a grouped Agate draws exactly what the loose one drew, and its slider stays on the page
 *   - ports by name: every starter and texture chain goes to names and back unchanged; a part that gains an input
 *     keeps every saved wire on the setting it was on
 *   - groups inside groups, a group used twice, a group that contains itself, a group whose insides are gone
 *   - validateGraph keeps a group's insides, and counts them toward the limit
 *
 * Run with: node test/groups.test.mjs
 */
import { installCanvasMock } from './canvasMock.mjs';
import { check, done } from './harness.mjs';
installCanvasMock();
const A = await import('../athanor.js');
const S = await import('../steps.js');
const { TEXTURE_CHAINS } = await import('../chains.js');

const copy = o => JSON.parse(JSON.stringify(o));
const node = (id, name, data = {}, inputs = {}) => ({ id, name, data, class: '', html: '', typenode: false, inputs, outputs: {}, pos_x: 0, pos_y: 0 });
const wire = (n, o = 1) => ({ connections: [{ node: String(n), input: 'output_' + o }] });
const ctx = { knobs: [37, 50, 50, 50, 50, 50, 50, 50], tints: ['#e0c090', '#203040'], seed: 4242, light: 315, scale: 1 };
const same = (a, b) => { if(!a || !b) return false; let d = 0; for(let i = 0; i < a.r.length; i++) d = Math.max(d, Math.abs(a.r[i] - b.r[i]), Math.abs(a.g[i] - b.g[i]), Math.abs(a.b[i] - b.b[i])); return d === 0; };

check('a new graph is version 5', A.ATHANOR_VERSION === 5);

// ---- a grouped Agate: noise, knob, math, waves and levels inside a group ----
const agate = A.athanorStarter('agate'), H = agate.drawflow.Home.data;
const grouped = (() => {
  const inner = {}; for(const id of ['1', '2', '3', '4', '5']) inner[id] = copy(H[id]);
  inner['12'] = node(12, 'groupout', {}, { input_1: wire(5) });
  const home = {}; for(const id of ['6', '7', '8', '9']) home[id] = copy(H[id]);
  home['10'] = node(10, 'group', { name: 'Bands', module: 'g10' });
  home['8'].inputs.input_1 = wire(10);
  return { v: 5, drawflow: { Home: { data: home }, g10: { data: inner } } };
})();
check('a group draws exactly what its parts drew loose', same(A.evalAthanor({ ...agate, v: 5 }, 48, 48, ctx), A.evalAthanor(grouped, 48, 48, ctx)));
check('a Knob inside a group, its port unwired, is still its slider on the page',
  JSON.stringify(A.athanorKnobs(grouped)) === JSON.stringify(A.athanorKnobs(agate)) && A.athanorKnobs(grouped).length === 1);
check('a group counts every part inside it', A.athanorBudget(grouped).nodes === A.athanorBudget(agate).nodes);
check('a group\'s ports are its insides\': the Knob an input, one result', (() => { const P = A.groupPorts(grouped.drawflow.g10); return P.ins.length === 1 && P.ins[0].id === '2' && P.ins[0].kind === 'value' && P.outs === 1; })());
// wired: a Knob on the page into the group's port takes the inner Knob's place
{ const g = copy(grouped); g.drawflow.Home.data['11'] = { ...copy(H['2']), id: 11, data: { ...H['2'].data, slot: '3', name: 'Outside' } }; g.drawflow.Home.data['10'].inputs.input_1 = wire(11);
  const flat = A.athanorFlat(g).nodes;
  check('a wire into a group\'s port takes the place of the part inside', !flat['2'] && flat['3'].inputs.input_2.connections[0].node === '11'
    && A.athanorKnobs(g).map(k => k.slot).join() === '3'); }
// the step previews: the insides by id, and the group showing its result
{ const all = A.evalAthanor(grouped, 24, 24, { ...ctx, all: true });
  check('the step previews show a group\'s insides, and the group what its result shows', all.has('3') && all.get('10') === all.get('5') && A.athanorStepIds(grouped).join() === '1,2,3,4,5,6,7,8,9,10,12'); }

// ---- ports by name ----
check('a part\'s ports by name: its inputs, ⚙ settings and outputs', (() => { const P = A.stepPortNames('blend');
  return P.ins.slice(0, 3).join() === 'in:base,in:layer,in:mask' && P.ins.includes('set:opacity') && P.outs.join() === 'out:image'; })());
{ let bad = [];
  const all = { ...Object.fromEntries(Object.keys(A.ATHANOR_STARTERS).map(k => [k, A.athanorStarter(k)])), ...Object.fromEntries(Object.keys(TEXTURE_CHAINS).map(k => ['chain:' + k, A.athanorStarter(k)])) };
  for(const [k, g] of Object.entries(all)){ if(!g) continue; const back = A.athanorNumbered(A.athanorNamed(g));
    if(JSON.stringify(back.drawflow.Home.data) !== JSON.stringify(g.drawflow.Home.data)) bad.push(k); }
  check('every starter and texture chain goes to names and back unchanged' + (bad.length ? ' (' + bad.slice(0, 5).join(', ') + ')' : ''), bad.length === 0); }
check('a saved v5 graph is named, and walks as the numbered one', (() => { const n = A.athanorNamed(grouped); return A.athanorIsNamed(n) && same(A.evalAthanor(n, 32, 32, ctx), A.evalAthanor(grouped, 32, 32, ctx)); })());
// A10's proof: a part gains an input, and an old (named) graph's wires still reach the same settings
{ const named = A.athanorNamed(agate), W = S.STEPS.waves, keep = { ins: W.ins, inTypes: W.inTypes, dataIns: W.dataIns };
  const fq = A.athanorNamed(agate);   // (a ⚙ wire on Waves' Frequency, by name)
  fq.drawflow.Home.data['4'].inputs['set:freq'] = { connections: [{ node: '2', input: 'out:value' }] };
  const pk = S.paramPort('waves', 'freq');
  try {
    W.ins = ['a new input', ...W.ins]; W.inTypes = ['field', ...W.inTypes]; W.dataIns += 1; A.athanorPortNamesReset();
    const n = A.athanorNumbered(fq).drawflow.Home.data['4'].inputs, pk2 = S.paramPort('waves', 'freq');
    check('a part that gains an input keeps its saved wires on the same ports (warp, and the ⚙ wire on Frequency)',
      pk2 === pk + 1 && (n['input_2'] || {}).connections[0].node === '3' && (n['input_' + pk2] || {}).connections[0].node === '2' && !n['input_1']);
  } finally { Object.assign(W, keep); A.athanorPortNamesReset(); }
  check('names are read again after', A.athanorNumbered(named).drawflow.Home.data['4'].inputs.input_1.connections[0].node === '3'); }

// ---- groups in groups, a group used twice, a group that holds itself ----
{ const g = copy(grouped);
  // the whole of g10 inside an outer group g20
  g.drawflow.g20 = { data: { '10': g.drawflow.Home.data['10'], '21': node(21, 'groupout', {}, { input_1: wire(10) }) } };
  g.drawflow.Home.data['20'] = node(20, 'group', { name: 'Outer', module: 'g20' }); delete g.drawflow.Home.data['10'];
  g.drawflow.Home.data['8'].inputs.input_1 = wire(20);
  check('a group inside a group draws the same', same(A.evalAthanor(g, 32, 32, ctx), A.evalAthanor(grouped, 32, 32, ctx))); }
{ const g = copy(grouped);
  // the same insides used by two groups, mixed: both are made (the second's parts renamed)
  g.drawflow.Home.data['30'] = node(30, 'group', { name: 'Again', module: 'g10' });
  g.drawflow.Home.data['31'] = node(31, 'mix', {}, { input_1: wire(10), input_2: wire(30) });
  const flat = A.athanorFlat(g).nodes;
  check('a group used twice: both made, the second\'s parts renamed', !!flat['30/3'] && !!flat['3'] && flat['31'].inputs.input_2.connections[0].node === '30/5'); }
{ const g = copy(grouped); g.drawflow.g10.data['40'] = node(40, 'group', { module: 'g10' });
  let ok = true; try { A.athanorFlat(g); A.evalAthanor(g, 16, 16, ctx); } catch(e){ ok = false; }
  check('a group that holds itself is cut, not walked for ever', ok); }
{ const g = copy(grouped); delete g.drawflow.g10;
  const flat = A.athanorFlat(g).nodes;
  check('a group whose insides are gone gives nothing (and its readers nothing from it)', !flat['10'] && !flat['8'].inputs.input_1.connections.length); }

// ---- loops (A4): a group with Repeats above 1 runs again and again, its first result fed back into its first input ----
{ const loop = reps => ({ v: 5, drawflow: { Home: { data: { '1': node(1, 'perlin', { scale: 30 }), '10': node(10, 'group', { name: 'Soften', module: 'g10', repeats: reps }, { input_1: wire(1) }),
    '99': node(99, 'surface', {}, { input_1: wire(10) }) } }, g10: { data: { '2': node(2, 'groupin', { name: 'Accumulated' }), '3': node(3, 'blur', { radius: 8 }, { input_1: wire(2) }),
    '4': node(4, 'groupout', {}, { input_1: wire(3) }) } } } });
  const chained = { v: 5, drawflow: { Home: { data: { '1': node(1, 'perlin', { scale: 30 }), '3': node(3, 'blur', { radius: 8 }, { input_1: wire(1) }), '5': node(5, 'blur', { radius: 8 }, { input_1: wire(3) }),
    '6': node(6, 'blur', { radius: 8 }, { input_1: wire(5) }), '99': node(99, 'surface', {}, { input_1: wire(6) }) } } } };
  check('a loop of three passes is the insides three times over, each fed the last', same(A.evalAthanor(loop(3), 32, 32, ctx), A.evalAthanor(chained, 32, 32, ctx)));
  check('a group that repeats once is the plain group', same(A.evalAthanor(loop(1), 32, 32, ctx), A.evalAthanor({ ...chained, drawflow: { Home: { data: { '1': chained.drawflow.Home.data['1'], '3': chained.drawflow.Home.data['3'], '99': node(99, 'surface', {}, { input_1: wire(3) }) } } } }, 32, 32, ctx)));
  check('each pass counts toward the part limit', A.athanorBudget(loop(4)).nodes === 2 + 4);
  const it = copy(loop(3)); it.drawflow.g10.data['5'] = node(5, 'loopiter');
  const flat = A.athanorFlat(it).nodes, vals = Object.values(flat).filter(n => n.name === 'number').map(n => n.data.value).sort((a, b) => a - b);
  check('Iteration counts the passes, 0 on the first and 1 on the last', vals.join() === '0,50,100');
  check('a loop runs at most sixteen times', Object.values(A.athanorFlat(loop(400)).nodes).filter(n => n.name === 'blur').length === A.ATHANOR_LOOP_MAX); }

// ---- validateGraph ----
{ const v = A.validateGraph(JSON.stringify(A.athanorNamed(grouped)));
  check('validateGraph keeps a group\'s insides, named as it was given', v.ok && !!v.graph.drawflow.g10 && A.athanorIsNamed(v.graph) && !v.problems.length
    && same(A.evalAthanor(v.graph, 24, 24, ctx), A.evalAthanor(grouped, 24, 24, ctx))); }
{ const g = copy(grouped); g.drawflow.Home.data['10'].data.module = 'nowhere';
  const v = A.validateGraph(JSON.stringify(g));
  check('validateGraph leaves out a group whose insides are missing', v.ok && !v.graph.drawflow.Home.data['10'] && v.problems.some(p => /group/.test(p))); }
{ const g = copy(grouped); g.drawflow.g10.data['50'] = node(50, 'surface');
  const v = A.validateGraph(JSON.stringify(g));
  check('validateGraph leaves out a Surface inside a group', v.ok && !v.graph.drawflow.g10.data['50']); }
{ const g = copy(grouped); for(let i = 0; i < A.ATHANOR_LIMITS.nodes; i++) g.drawflow.g10.data[String(100 + i)] = node(100 + i, 'number');
  const v = A.validateGraph(JSON.stringify(g));
  check('the limit counts the parts inside groups', v.ok && v.problems.some(p => /will not be drawn/.test(p)) && A.athanorBudget(v.graph).tooMany); }
// ---- an old graph is as it was ----
{ const old = { ...copy(agate), v: 4 };
  check('a graph without groups is read as it always was', A.athanorFlat(old).nodes === A.athanorNodes(old) || JSON.stringify(A.athanorFlat(old).nodes) === JSON.stringify(A.athanorNodes(old)));
  check('a v4 graph loads and draws unchanged', A.athanorVersion(old) === 4 && !A.athanorIsNamed(old) && same(A.evalAthanor(old, 32, 32, ctx), A.evalAthanor({ ...copy(agate), v: 4 }, 32, 32, ctx))); }

done();
