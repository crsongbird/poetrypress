/**
 * forge.test.mjs — the Athanor (a node editor for new surfaces): its parts
 * are Vellum's own primitives, every node draws its controls, a graph is
 * evaluated into a picture, editing it is not a step of the look's undo, and
 * Drawflow (the established library) is loaded only when the Athanor opens.
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
let failures = 0;
const check = (name, ok) => { console.log((ok ? 'ok: ' : 'FAIL: ') + name); if(!ok) failures++; };
const S = await import('../steps.js');
const F = await import('../forge.js');
const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8'), html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

check('the parts come from what Vellum has: inputs (knobs, hues, dial, seed), noises, textures, stitches, shaping, light & colour, a Surface',
  ['knob','hue','dial','seed','noise','cells','turing','texture','stitch','levels','warp','light','tint','blend','surface'].every(k => F.FORGE_NODES[k])
  && Object.values(F.FORGE_NODES).every(n => F.FORGE_CATEGORIES.includes(n.cat)));
check('every node draws its own controls (bound with df-*) and starts at its defaults',
  Object.keys(F.FORGE_NODES).every(k => { const h = F.forgeNodeHtml(k, { textures: ['linen'], stitches: ['scallop'] }); const d = F.forgeNodeData(k);
    return h.includes('forge-node-title') && F.FORGE_NODES[k].params.every(p => h.includes('df-' + p[0]) && d[p[0]] === p[3]); }));
check('the blend node offers the GPU blends too', ['vivid-light','linear-light','pin-light','subtract','divide'].every(b => S.STEP_BLENDS.includes(b)));
check('a graph is described in a few words', F.describeForge('{}').startsWith('Empty')
  && F.describeForge(JSON.stringify({ drawflow: { Home: { data: { 1: { name: 'noise', outputs: { output_1: { connections: [{ node: '2' }] } } }, 2: { name: 'surface', data: { name: 'Moss Glass' }, outputs: {} } } } } })) === '2 nodes, 1 wire → “Moss Glass”');
check('Drawflow loads only when the Athanor opens: it is not in the page\'s <head>', !/drawflow/.test(html.split('</head>')[0]));
{
  const fsrc = readFileSync(new URL('../forge.js', import.meta.url), 'utf8'), css = readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8');
  check('a node carries its pin (its lock) and its menu',
    F.forgeNodeHtml('noise', { lock: '<svg></svg>' }).includes('data-act="pin"') && F.forgeNodeHtml('noise', {}).includes('data-act="menu"'));
  { const { layoutAthanor } = await import('../athanor.js');
    const chain = () => ({ 1: { name: 'noise', inputs: {}, outputs: { output_1: { connections: [{ node: '2' }] } } }, 2: { name: 'blur', inputs: { input_1: { connections: [{ node: '1' }] } }, outputs: { output_1: { connections: [{ node: '3' }] } } },
      3: { name: 'surface', inputs: { input_1: { connections: [{ node: '2' }] } }, outputs: {} }, 4: { name: 'noise', inputs: {}, outputs: { output_1: { connections: [{ node: '3' }] } } } });
    const t = layoutAthanor(chain()), w = layoutAthanor(chain(), 2.2);
    check('the view: everything in sight (⌖); Tidy lays parts in columns, left to right; Spread out the same, with wider gaps',
      html.includes('id="forgeFit"') && t[1].pos_x < t[2].pos_x && t[2].pos_x < t[3].pos_x && t[1].pos_x === t[4].pos_x
      && w[3].pos_x - w[1].pos_x > t[3].pos_x - t[1].pos_x && Math.abs(w[4].pos_y - w[1].pos_y) > Math.abs(t[4].pos_y - t[1].pos_y)); }
  check('kept surfaces: a shelf in this browser, opened again, saved as a file and brought in (each checked)',
    F.FORGE_SHELF_KEY === 'uv.forge.kept.v1' && typeof F.forgeShelf === 'function' && /v = validate \? validate\(r\.graph\)/.test(fsrc) && html.includes('id="forgeOpenSelect"') && /sub: shelfMenu/.test(fsrc));
  check('the Athanor wears the app\'s theme; only the wires and ports keep the colours of what they carry',
    /\.forge-veil\{ --fg-ground:var\(--bg-deep\); --fg-panel:var\(--bg-panel\)/.test(css) && /:root\[data-theme="vellum"\] \.forge-veil\{ --t-field/.test(css));
  check('on a phone: the parts are a drawer that scrolls with one finger (no dragging from it), the preview a small dock bottom right',
    html.includes('id="forgePartsBtn"') && /finePointer \? ' draggable="true"' : ''/.test(fsrc) && /\.forge-palette\{[^}]*touch-action:pan-y/.test(css) && html.includes('id="forgeDock"'));
}
check('opened from the top bar; a full-screen editor',
  html.includes('id="athanorTopBtn"') && html.includes('id="forgeVeil"'));

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
    JSON.stringify(C.athanorKnobs(graph).map(k => [k.slot, k.label, k.def, k.kind])) === JSON.stringify([[1, 'Grain', 40, 'slider']]) && C.athanorHues(graph)[0].label === 'Soot' && C.athanorName(graph) === 'Test Ground');
  const { withSeed } = await import('../texCore.js');
  const run = (knob, seed = 5) => withSeed(seed, () => C.evalAthanor(graph, 48, 48, { knobs: [knob, 50, 50, 50, 50, 50], tints: ['#FFFFFF', '#203040'], light: 315, seed }, {}));
  const a = run(40), b = run(40), c = run(90), d = run(40, 6);
  const same = (x, y) => x.r.every((v, i) => v === y.r[i]);
  check('it evaluates every node to a picture, the same every time for the same seed (Surface lit by the dial)', a && a.r.length === 48*48 && same(a, b) && a.r.some(v => v > 0.05));
  check('…the knob moves it, and so does the seed', !same(a, c) && !same(a, d));
  check('no Surface (or no graph): nothing to show', C.evalAthanor('', 8, 8, {}, {}) === null);
  check('the cache knows the graph (positions don\'t count)', C.athanorHash(graph) !== C.athanorHash('') && C.athanorHash(graph) === C.athanorHash(graph.replace(/"data"/, '"data"')));
  const T = await import('../textureGenerators.js');
  check('the Athanor is a surface like any other: its own Surface Variant, keyed by its graph',
    T.TEXTURE_PARAMS.athanor.length === 8 && T.textureKeyFor('athanor', 10, 10, { graph }) !== T.textureKeyFor('athanor', 10, 10, { graph: '' })
    && html.includes('<option value="athanor" id="athanorOption">'));
  check('the page names its sliders and hues from the graph, before a look\'s knobs are restored',
    /function applyAthanorGraph\(redraw = true\)\{/.test(ev) && ev.indexOf("if(s.forgeGraph !== undefined && $('forgeGraph'))") < ev.indexOf('syncTextureParams(true);\n  syncTextureTools(true);'));

  // MEMORY (Ruby: Circuit Board ran a phone out of memory): a part's result is let go once its readers have run
  { const { TEXTURE_CHAINS } = await import('../chains.js'), g = JSON.stringify(C.athanorStarter('circuit')), n = Object.keys(C.athanorNodes(g)).length;
    C.clearAthanorCache(); C.evalAthanor(g, 48, 48, { seed: 3, knobs: [50, 50, 50, 50, 50, 50], tints: [] }, {});
    const held = C.athanorCacheInfo().peak;
    check('a graph holds only the work in flight: Circuit Board (' + n + ' parts) never holds more than a third of its results at once (' + held + ')', !!TEXTURE_CHAINS.circuit && held > 0 && held <= n/3); }
  // ---- stages 4–5: versions, kept results, the budget, starters, more parts ----
  check('a graph has a version (none = 1); new ones are the newest, and the cache knows it',
    C.athanorVersion(graph) === 1 && C.athanorVersion(JSON.stringify({ v: 2 })) === 2 && C.ATHANOR_VERSION === 5
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
  for(let i = 1; i <= C.ATHANOR_LIMITS.nodes + 6; i++) big.drawflow.Home.data[i] = { id: i, name: 'blur', data: {}, inputs: {}, outputs: {} };
  const heavy = { v: 2, drawflow: { Home: { data: {} } } };
  for(let i = 1; i <= 20; i++) heavy.drawflow.Home.data[i] = { id: i, name: 'light', data: {}, inputs: {}, outputs: {} };
  check('the work budget: past it a graph is drawn coarser (never more than 3×), past ' + C.ATHANOR_LIMITS.nodes + ' nodes not at all — and the editor says so',
    C.athanorBudget(graph).scale === 1 && C.athanorBudget(heavy).scale > 1 && C.athanorBudget(heavy).scale <= 3 && C.athanorBudget(big).tooMany
    && F.describeForge(big).includes('too many nodes') && F.describeForge(heavy).includes('reduced detail'));
  const starters = Object.keys(C.ATHANOR_STARTERS);
  check('sixteen starter graphs, each a working surface (evaluated here; Reaction–Diffusion, Oil on Canvas, A Picture Under Glass and A Dropped Frame need the page\'s textures, and Paving Stones a canvas that paints)',
    starters.length === 16 && starters.filter(k => !['bloom', 'oil', 'vitrine', 'droppedframe', 'paving'].includes(k)).every(k => { const gr = C.athanorStarter(k); const im = run2(JSON.stringify(gr));
      return gr.v === C.ATHANOR_VERSION && im && im.r.some(v => v > 0.02) && C.athanorName(gr) === C.ATHANOR_STARTERS[k].label; }));
  // FILTER FORGE'S MAP INPUTS (v3): a gray map on a ⚙ setting sets it point by point; v2 took its average
  { const mk = v => JSON.stringify({ v, drawflow: { Home: { data: {
      1: { id: 1, name: 'gradient', data: { shape: 'linear', angle: 0 }, inputs: {}, outputs: { output_1: { connections: [] } } },
      2: { id: 2, name: 'number', data: { value: 50 }, inputs: {}, outputs: { output_1: { connections: [] } } },
      3: { id: 3, name: 'threshold', data: { at: 50, soft: 0 }, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] }, ['input_' + S.paramPort('threshold', 'at')]: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: { output_1: { connections: [] } } },
      4: { id: 4, name: 'surface', data: { name: 'T', ground: 'grey' }, inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] }, input_2: { connections: [] } }, outputs: {} } } } } });
    const a = C.evalAthanor(mk(3), 40, 40, { seed: 1, knobs: [], tints: [] }, {}), b = C.evalAthanor(mk(2), 40, 40, { seed: 1, knobs: [], tints: [] }, {});
    const row = im => [2, 20, 37].map(x => Math.round(im.r[20*40 + x]));
    check('map inputs (v3, Filter Forge): a gradient on Threshold\'s ⚙ At sets the threshold point by point — the picture splits; a v2 graph still takes the average',
      JSON.stringify(row(a)) !== JSON.stringify(row(b)) && new Set(row(a)).size > 1 && new Set(row(b)).size === 1);
    check('the textures\' own chains stay v2 (their pictures never change); a starter is the newest', C.athanorStarter('stainedglass').v === 2 && C.athanorStarter('ripples').v === C.ATHANOR_VERSION); }
  check('…offered from the editor\'s bar (Open), with every part\'s ports filled in on load', html.includes('id="forgeOpenSelect"')
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
  {
    // THE LIGHT ENGINE (stepsLight.js): a picture and its heights lit by the dial — turn the dial, the light moves
    let id3 = 1; const nd = {}; const mk = (name, data = {}) => { const i = String(id3++); nd[i] = { id: +i, name, data, inputs: {}, outputs: {} }; return i; };
    const wr = (a, o, b, j) => { (nd[b].inputs['input_' + j] ||= { connections: [] }).connections.push({ node: a, input: 'output_' + o }); };
    const ns = mk('noise', { scale: 60, octaves: 4 }), co = mk('colour', { hex: '#C08040' }), me = mk('material', { relief: 100, gloss: 40, shine: 50, shadow: 60, occlusion: 35, ambient: 35 }), sf = mk('surface', {});
    wr(co, 1, me, 1); wr(ns, 1, me, 2); wr(me, 1, sf, 1);
    const gg = JSON.stringify({ v: 2, drawflow: { Home: { data: nd } } }), at = deg => C.evalAthanor(gg, 48, 48, { seed: 3, light: deg, knobs: [50, 50, 50, 50, 50, 50], tints: ['#FFFFFF', '#000000'] }, {});
    const a = at(315), b = at(135); let diff = 0, spread = 0; for(let i = 0; i < a.r.length; i++){ diff += Math.abs(a.r[i] - b.r[i]); spread = Math.max(spread, Math.abs(a.r[i] - 0.75)); }
    check('THE LIGHT ENGINE lights a picture by its heights: the dial moves the light; Oil Paint, Canvas Weave and Paint Swipes are parts too; the oil-on-canvas module sits inside Painted Landscape and Painter\'s Frustration, and Oil on Canvas is a starter to learn from (Ruby)',
      ['material', 'oilpaint', 'canvasweave'].every(k => F.FORGE_NODES[k] && F.FORGE_NODES[k].doc.length > 40) && diff/a.r.length > 0.004 && spread > 0.02
      && !!C.ATHANOR_STARTERS.oil && (CH => CH.TEXTURE_CHAINS.brushstrokes.canvas && Object.values(CH.TEXTURE_CHAINS).some(c => c.nodes.some(([k]) => k === 'oilpaint')))(await import('../chains.js')));
    check('A PART\'S COLOR is the kind of thing it makes (its output\'s type), as its dots and wires are',
      F.forgePartColour(F.FORGE_NODES.noise) === 'var(--t-field)' && F.forgePartColour(F.FORGE_NODES.oilpaint) === 'var(--t-image)' && F.forgePartColour(F.FORGE_NODES.knob) === 'var(--t-value)');
  }
}

{ const fsrc = readFileSync(new URL('../forge.js', import.meta.url), 'utf8');
  check('the Athanor\'s grid pans wherever it is pressed: the container\'s first class is Drawflow\'s own (it pans only on "parent-drawflow" or "drawflow")',
    /class="parent-drawflow forge-canvas"/.test(html) && /area\.classList\[0\] !== 'parent-drawflow'/.test(fsrc) && /e\.button === 1 \|\| \(e\.button === 0 && spaceHeld\)/.test(fsrc));
}

// ---- the graph is the Athanor's to undo (it keeps its own edits): editing it is not a step of the look's history ----
{ installCanvasMock();
  const reg = installDomMock(makeMockContext, makeMockCanvas);
  await import('../appEvents.js');
  const wait = ms => new Promise(r => setTimeout(r, ms)), undo = reg['undoBtn'];
  const edit = (id, v) => { if(v !== undefined) reg[id].value = v; document.dispatchEvent({ type: 'input', target: reg[id] }); };
  await wait(50); const before = undo.disabled;
  edit('forgeGraph', '{"drawflow":{"Home":{"data":{}}},"edited":1}'); await wait(500); const afterGraph = undo.disabled;
  edit('textureOpacity'); await wait(500);
  check('editing the graph is not an undo step of the look (the next change in the controls is, and carries it)', before && afterGraph && !undo.disabled); }

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
