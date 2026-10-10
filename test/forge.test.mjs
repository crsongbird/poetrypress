/**
 * forge.test.mjs — the Athanor (a node editor for new surfaces), scaffold:
 * its parts are Vellum's own primitives, every node draws its controls, the
 * graph is saved with the look, and Drawflow (the established library) is
 * loaded only when the Athanor is opened.
 */
import { readFileSync } from 'fs';
let failures = 0;
const check = (name, ok) => { console.log((ok ? 'ok: ' : 'FAIL: ') + name); if(!ok) failures++; };
const F = await import('../forge.js');
const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8'), html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

check('the parts come from what Vellum has: inputs (knobs, hues, dial, seed), noises, textures, stitches, shaping, light & colour, a Surface',
  ['knob','hue','dial','seed','noise','cells','turing','texture','stitch','levels','warp','light','tint','blend','surface'].every(k => F.FORGE_NODES[k])
  && Object.values(F.FORGE_NODES).every(n => F.FORGE_CATEGORIES.includes(n.cat)));
check('every node draws its own controls (bound with df-*) and starts at its defaults',
  Object.keys(F.FORGE_NODES).every(k => { const h = F.forgeNodeHtml(k, { textures: ['linen'], stitches: ['scallop'] }); const d = F.forgeNodeData(k);
    return h.includes('forge-node-title') && F.FORGE_NODES[k].params.every(p => h.includes('df-' + p[0]) && d[p[0]] === p[3]); }));
check('the blend node offers the GPU blends too', ['vivid-light','linear-light','pin-light','subtract','divide'].every(b => F.FORGE_BLENDS.includes(b)));
check('a graph is described in a few words', F.describeForge('{}').startsWith('Empty')
  && F.describeForge(JSON.stringify({ drawflow: { Home: { data: { 1: { name: 'noise', outputs: { output_1: { connections: [{ node: '2' }] } } }, 2: { name: 'surface', data: { name: 'Moss Glass' }, outputs: {} } } } } })) === '2 nodes, 1 wire → “Moss Glass”');
check('the graph is saved with the look (PERSISTED forgeGraph, a hidden field), but editing it is not an undo step',
  /\['forgeGraph',\s+'forgeGraph',\s+'text'\]/.test(ev) && html.includes('<input type="hidden" id="forgeGraph"') && /NOT_A_LOOK = new Set\(\[[^\]]*'forgeGraph'/.test(ev));
check('Drawflow loads only when the Athanor opens, from the CDN at an exact version', /drawflow@\d+\.\d+\.\d+\/dist\/drawflow\.min\.js/.test(readFileSync(new URL('../forge.js', import.meta.url), 'utf8')) && !/drawflow/.test(html.split('</head>')[0]));
check('under Esoterica, with its own card and a full-screen editor', /<details class="card" data-tab="more" id="forgePanel">/.test(html) && html.includes('id="forgeVeil"'));

// ---- the evaluator (athanor.js): a graph made into a picture ----
{
  const C = await import('../athanor.js');
  let id = 1; const nodes = {};
  const node = (name, data = {}) => { const i = String(id++); nodes[i] = { id: +i, name, data, inputs: {}, outputs: {} }; return i; };
  const wire = (from, out, to, inp) => { (nodes[to].inputs['input_' + inp] ||= { connections: [] }).connections.push({ node: from, input: 'output_' + out });
    (nodes[from].outputs['output_' + out] ||= { connections: [] }).connections.push({ node: to, output: 'input_' + inp }); };
  const k = node('knob', { slot: '1', name: 'Grain', def: 40 }), h = node('hue', { slot: '2', name: 'Soot' });
  const nz = node('noise', { scale: 30, octaves: 3 }), lv = node('levels', { lo: 10, hi: 90, gamma: 50 }), tint = node('tint', {}), mix = node('mix', { t: 50 });
  const cells = node('cells', { scale: 30, jitter: 80 }), blend = node('blend', { mode: 'multiply', opacity: 100 }), surf = node('surface', { name: 'Test Ground' });
  wire(nz, 1, lv, 1); wire(lv, 1, tint, 1); wire(h, 1, tint, 3); wire(tint, 1, blend, 1); wire(cells, 2, mix, 1); wire(k, 1, mix, 3); wire(mix, 1, blend, 2);
  wire(blend, 1, surf, 1); wire(cells, 1, surf, 2);
  const graph = JSON.stringify({ drawflow: { Home: { data: nodes } } });
  check('a graph names its sliders (Knob nodes), its hues (Hue nodes) and itself (the Surface)',
    JSON.stringify(C.athanorKnobs(graph)) === JSON.stringify([{ slot: 1, label: 'Grain', def: 40 }]) && C.athanorHues(graph)[0].label === 'Soot' && C.athanorName(graph) === 'Test Ground');
  const { withSeed } = await import('../texCore.js');
  const run = (knob, seed = 5) => withSeed(seed, () => C.evalAthanor(graph, 48, 48, { knobs: [knob, 50, 50, 50, 50, 50], tints: ['#FFFFFF', '#203040'], light: 315, seed }, {}));
  const a = run(40), b = run(40), c = run(90), d = run(40, 6);
  const same = (x, y) => x.r.every((v, i) => v === y.r[i]);
  check('it evaluates every node to a picture, the same every time for the same seed (Surface lit by the dial)', a && a.r.length === 48*48 && same(a, b) && a.r.some(v => v > 0.05));
  check('…the knob moves it, and so does the seed', !same(a, c) && !same(a, d));
  check('no Surface (or no graph): nothing to show', C.evalAthanor('', 8, 8, {}, {}) === null);
  check('the cache knows the graph (positions don\'t count)', C.athanorHash(graph) !== C.athanorHash('') && C.athanorHash(graph) === C.athanorHash(graph.replace(/"data"/, '"data"')));
  const T = await import('../textureGenerators.js');
  check('the Athanor is a surface like any other: its own Surface Variant, keyed by its graph, carried by the renderer',
    T.TEXTURE_PARAMS.athanor.length === 6 && T.textureKeyFor('athanor', 10, 10, { graph }) !== T.textureKeyFor('athanor', 10, 10, { graph: '' })
    && /const graph = type === 'athanor' \? \(\(\$\('forgeGraph'\) \|\| \{\}\)\.value \|\| ''\) : undefined;/.test(readFileSync(new URL('../canvasRenderer.js', import.meta.url), 'utf8'))
    && html.includes('<option value="athanor" id="athanorOption">'));
  check('the page names its sliders and hues from the graph, before a look\'s knobs are restored',
    /function applyAthanorGraph\(redraw = true\)\{/.test(ev) && ev.indexOf("if(s.forgeGraph !== undefined && $('forgeGraph'))") < ev.indexOf('syncTextureParams(true);\n  syncTextureTools(true);'));

  // ---- stages 4–5: versions, kept results, the budget, starters, more parts ----
  check('a graph has a version (none = 1); new ones are the newest, and the cache knows it',
    C.athanorVersion(graph) === 1 && C.athanorVersion(JSON.stringify({ v: 2 })) === 2 && C.ATHANOR_VERSION === 2
    && C.athanorHash(graph) !== C.athanorHash(JSON.stringify({ ...JSON.parse(graph), v: 2 })));
  const g2 = JSON.stringify({ ...JSON.parse(graph), v: 2 });
  const run2 = (gr, knob = 40, seed = 5) => C.evalAthanor(gr, 48, 48, { knobs: [knob, 50, 50, 50, 50, 50], tints: ['#FFFFFF', '#203040'], light: 315, seed }, {});
  C.clearAthanorCache();
  const e1 = run2(g2), hits0 = C.athanorCacheInfo().hits, e2 = run2(g2);
  check('version 2: each node keeps its result between edits — made again only when it or what feeds it changes',
    same(e1, e2) && C.athanorCacheInfo().hits > hits0 && C.athanorCacheInfo().entries > 0);
  // the same graph with its nodes listed in another order makes the same picture (each node's own randomness)
  const rev = JSON.parse(g2); rev.drawflow.Home.data = Object.fromEntries(Object.entries(rev.drawflow.Home.data).reverse());
  C.clearAthanorCache(); const e3 = run2(JSON.stringify(rev)); C.clearAthanorCache(); const e4 = run2(g2);
  check('…each node draws its own randomness (from the seed and its id), so the order it is reached in never matters', same(e3, e4));
  const big = { v: 2, drawflow: { Home: { data: {} } } };
  for(let i = 1; i <= 70; i++) big.drawflow.Home.data[i] = { id: i, name: 'blur', data: {}, inputs: {}, outputs: {} };
  const heavy = { v: 2, drawflow: { Home: { data: {} } } };
  for(let i = 1; i <= 20; i++) heavy.drawflow.Home.data[i] = { id: i, name: 'light', data: {}, inputs: {}, outputs: {} };
  check('the work budget: past it a graph is drawn coarser (never more than 3×), past 64 nodes not at all — and the editor says so',
    C.athanorBudget(graph).scale === 1 && C.athanorBudget(heavy).scale > 1 && C.athanorBudget(heavy).scale <= 3 && C.athanorBudget(big).tooMany
    && F.describeForge(big).includes('too many nodes') && F.describeForge(heavy).includes('reduced detail')
    && /const B = athanorBudget\(extra\.graph \|\| ''\);/.test(readFileSync(new URL('../textureGenerators.js', import.meta.url), 'utf8')));
  const starters = Object.keys(C.ATHANOR_STARTERS);
  check('five starter graphs, each a working surface (evaluated here; the Reaction–Diffusion one needs the page\'s textures)',
    starters.length === 5 && starters.filter(k => k !== 'bloom').every(k => { const gr = C.athanorStarter(k); const im = run2(JSON.stringify(gr));
      return gr.v === 2 && im && im.r.some(v => v > 0.02) && C.athanorName(gr) === C.ATHANOR_STARTERS[k].label; }));
  check('…offered from the editor\'s bar, with every part\'s ports filled in on load', html.includes('id="forgeStarter"')
    && /P\.ins\.forEach\(\(_, j\) => \{ n\.inputs\['input_' \+ \(j \+ 1\)\]/.test(readFileSync(new URL('../forge.js', import.meta.url), 'utf8')));
  {
    let id2 = 1; const nd = {}; const mk = (name, data = {}) => { const i = String(id2++); nd[i] = { id: +i, name, data, inputs: {}, outputs: {} }; return i; };
    const wr = (a, o, b, j) => { (nd[b].inputs['input_' + j] ||= { connections: [] }).connections.push({ node: a, input: 'output_' + o }); };
    const gr = mk('gradient', { shape: 'linear', angle: 0 }), po = mk('posterize', { steps: 4 }), tr = mk('transform', { scale: 50, angle: 45 }), eg = mk('edges', { strength: 50 }), sf = mk('surface', {});
    wr(gr, 1, po, 1); wr(po, 1, tr, 1); wr(tr, 1, eg, 1); wr(eg, 1, sf, 1);
    const gg = JSON.stringify({ v: 2, drawflow: { Home: { data: nd } } });
    const im = run2(gg); const levels = new Set(); const pz = C.evalAthanor(JSON.stringify({ v: 2, drawflow: { Home: { data: { ...nd, 5: { ...nd[5], inputs: { input_1: { connections: [{ node: po, input: 'output_1' }] } } } } } } }), 48, 48, { seed: 1 }, {});
    for(const v of pz.r) levels.add(Math.round(v*1000));
    check('new parts: Posterize (steps), Tile & Rotate, Edge Detect', ['posterize', 'transform', 'edges'].every(k => F.FORGE_NODES[k]) && levels.size === 4 && im.r.some(v => v > 0.2) && im.r.some(v => v < 0.05));
  }
}

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
