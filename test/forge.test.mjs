/**
 * forge.test.mjs — the Crucible (a node editor for new surfaces), scaffold:
 * its parts are Vellum's own primitives, every node draws its controls, the
 * graph is saved with the look, and Drawflow (the established library) is
 * loaded only when the Crucible is opened.
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
check('Drawflow loads only when the Crucible opens, from the CDN at an exact version', /drawflow@\d+\.\d+\.\d+\/dist\/drawflow\.min\.js/.test(readFileSync(new URL('../forge.js', import.meta.url), 'utf8')) && !/drawflow/.test(html.split('</head>')[0]));
check('under Esoterica, with its own card and a full-screen editor', /<details class="card" data-tab="more" id="forgePanel">/.test(html) && html.includes('id="forgeVeil"'));

// ---- the evaluator (crucible.js): a graph made into a picture ----
{
  const C = await import('../crucible.js');
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
    JSON.stringify(C.crucibleKnobs(graph)) === JSON.stringify([{ slot: 1, label: 'Grain', def: 40 }]) && C.crucibleHues(graph)[0].label === 'Soot' && C.crucibleName(graph) === 'Test Ground');
  const { withSeed } = await import('../texCore.js');
  const run = (knob, seed = 5) => withSeed(seed, () => C.evalCrucible(graph, 48, 48, { knobs: [knob, 50, 50, 50, 50, 50], tints: ['#FFFFFF', '#203040'], light: 315, seed }, {}));
  const a = run(40), b = run(40), c = run(90), d = run(40, 6);
  const same = (x, y) => x.r.every((v, i) => v === y.r[i]);
  check('it evaluates every node to a picture, the same every time for the same seed (Surface lit by the dial)', a && a.r.length === 48*48 && same(a, b) && a.r.some(v => v > 0.05));
  check('…the knob moves it, and so does the seed', !same(a, c) && !same(a, d));
  check('no Surface (or no graph): nothing to show', C.evalCrucible('', 8, 8, {}, {}) === null);
  check('the cache knows the graph (positions don\'t count)', C.crucibleHash(graph) !== C.crucibleHash('') && C.crucibleHash(graph) === C.crucibleHash(graph.replace(/"data"/, '"data"')));
  const T = await import('../textureGenerators.js');
  check('the Crucible is a surface like any other: its own Surface Variant, keyed by its graph, carried by the renderer',
    T.TEXTURE_PARAMS.crucible.length === 6 && T.textureKeyFor('crucible', 10, 10, { graph }) !== T.textureKeyFor('crucible', 10, 10, { graph: '' })
    && /const graph = type === 'crucible' \? \(\(\$\('forgeGraph'\) \|\| \{\}\)\.value \|\| ''\) : undefined;/.test(readFileSync(new URL('../canvasRenderer.js', import.meta.url), 'utf8'))
    && html.includes('<option value="crucible" id="crucibleOption">'));
  check('the page names its sliders and hues from the graph, before a look\'s knobs are restored',
    /function applyCrucibleGraph\(redraw = true\)\{/.test(ev) && ev.indexOf("if(s.forgeGraph !== undefined && $('forgeGraph'))") < ev.indexOf('syncTextureParams(true);\n  syncTextureTools(true);'));
}

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
