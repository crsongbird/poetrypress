/**
 * chains.test.mjs — the textures as CHAINS (chains.js) of the one library of
 * STEPS (steps.js) that both the Athanor and Vellum's textures are made of:
 * each chain opens in the Athanor as a template and reads its own sliders
 * and the dials. (Old looks from before a chain's change open in
 * audit.test.mjs, with every other old look.)
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
import { check, done } from './harness.mjs';
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

const { STEPS, stepRange, paramPort } = await import('../steps.js');
const { TEXTURE_CHAINS } = await import('../chains.js');
const F = await import('../forge.js');
const A = await import('../athanor.js');

// one library
check('every Athanor part is a step, and every step does something', Object.keys(F.FORGE_NODES).every(k => STEPS[k] && typeof STEPS[k].run === 'function')
  && Object.keys(STEPS).every(k => F.FORGE_NODES[k]));
check('the steps carry their own cost (the budget reads it)', Object.values(STEPS).every(s => typeof s.cost === 'function'));

// the chains
for(const [type, ch] of Object.entries(TEXTURE_CHAINS)){
  const okNodes = ch.nodes.every(([s]) => STEPS[s]), okWires = ch.wires.every(([a, o, b, j]) => ch.nodes[a-1] && ch.nodes[b-1] && o <= STEPS[ch.nodes[a-1][0]].outs.length && j <= STEPS[ch.nodes[b-1][0]].ins.length);
  const binds = ch.nodes.flatMap(([, d]) => Object.values(d).filter(v => typeof v === 'string' && v[0] === '@'));
  // it TEACHES by its wiring: every Knob and Dial is wired, into a ⚙ port (a param), nothing hidden in a binding
  const inputsWired = ch.nodes.every(([s], i) => !['knob', 'dial'].includes(s) || ch.wires.some(([a]) => a === i + 1))
    && ch.wires.some(([a, , b, j]) => j > STEPS[ch.nodes[b-1][0]].dataIns);
  check(`${ch.label}: its steps exist, its wires fit their ports, and its sliders and dial are WIRED to the params they drive`, okNodes && okWires && binds.length === 0 && inputsWired);
  const g = A.athanorStarter(type);
  check(`${ch.label}: opens as an Athanor template (Open → the app's own textures), named, with its sliders`,
    g && A.athanorName(g) === ch.label && A.athanorKnobs(g).length >= 2);
}
check('the Athanor\'s Open menu lists the app\'s textures as templates, under the Surface menu\'s own group headings (TEXTURE_GROUPS), each with its starters and studies', /TEXTURE_GROUPS\.map\(g => \[g, g\.types\.filter\(t => TEXTURE_CHAINS\[t\]\)/.test(src('forge.js')) && /FORGE_BAR\.starterMark/.test(src('forge.js')));
check('a bound param shows as written in its node (editable text)', F.forgeNodeHtml('streaks', {}, { angle: '@dial' }).includes('value="@dial"') && F.forgeNodeHtml('streaks', {}, { angle: '@dial' }).includes('forge-bound'));
check('a bound param with no range of its own reads its step\'s range', JSON.stringify(stepRange('hatching', 'cross')) === '[0,100]');
check('every range param of a working step has a ⚙ port after the step\'s own (Filter Forge: every slider takes a wire); inputs and the Surface have none',
  Object.values(STEPS).every(s => s.ins.length === s.dataIns + s.paramPorts.length && s.inTypes.length === s.ins.length && s.outTypes.length === s.outs.length)
  && STEPS.streaks.paramPorts.includes('angle') && STEPS.knob.paramPorts.length === 0 && STEPS.surface.paramPorts.length === 0);
{
  // a wired value drives its param across the param's range, and every param stays inside its range
  const nodes = { 1: { id: 1, name: 'knob', data: { slot: '1', def: 50 }, inputs: {}, outputs: {} },
    2: { id: 2, name: 'levels', data: { lo: 0, hi: 100, gamma: 50 }, inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } }, outputs: {} },
    3: { id: 3, name: 'gradient', data: { shape: 'linear', angle: 0 }, inputs: {}, outputs: {} },
    4: { id: 4, name: 'surface', data: {}, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } }, outputs: {} } };
  const g = k => ({ v: 2, drawflow: { Home: { data: k } } });
  const lo = n => { const img = A.evalAthanor(g(n), 16, 16, { knobs: [100, 0, 0, 0, 0, 0], light: 0, seed: 1 }); return img.r[15]; };
  const plain = lo(nodes);
  const wired = JSON.parse(JSON.stringify(nodes)); wired[2].inputs['input_' + paramPort('levels', 'lo')] = { connections: [{ node: '1', input: 'output_1' }] };
  const crazy = JSON.parse(JSON.stringify(nodes)); crazy[2].data.lo = 1e9;
  check('a Knob wired to a ⚙ port sets that param (Levels\' Low at 100: everything below it black)', plain > 0 && lo(wired) === 0);
  check('a param set far outside its range is held inside it (a graph from anywhere can\'t ask for a billion of anything)', lo(crazy) === lo(wired));
}

// as textures (the real canvas, if it is here)
let canvasOK = false;
try {
  const { createCanvas, Path2D } = await import('@napi-rs/canvas');
  globalThis.Path2D = Path2D; globalThis.document = { createElement: () => createCanvas(1, 1) }; canvasOK = true;
} catch(e){ console.log('(no @napi-rs/canvas here: the drawing checks are skipped)'); }
if(canvasOK){
  const T = await import('../textureGenerators.js');
  const draw = (type, o) => { T.clearTextureCache(); const c = T.getTextureCanvas(type, 240, 240, { seed: 7, scale: 1/2, lightTilt: 100, ...o }); return c.getContext('2d').getImageData(0, 0, 240, 240).data; };
  const orient = d => { let xx = 0, yy = 0, xy = 0; const L = (x, y) => d[(y*240 + x)*4];
    for(let y = 1; y < 239; y++) for(let x = 1; x < 239; x++){ const gx = L(x+1,y) - L(x-1,y), gy = L(x,y+1) - L(x,y-1); xx += gx*gx; yy += gy*gy; xy += gx*gy; }
    return ((0.5*Math.atan2(2*xy, xx - yy)*180/Math.PI + 90) % 180 + 180) % 180; };
  const near = (a, b, tol) => Math.abs(((a - b + 90) % 180 + 180) % 180 - 90) < tol;
  const spread = d => { let lo = 255, hi = 0; for(let i = 0; i < d.length; i += 4){ lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); } return hi - lo; };
  // dial 45 (from the upper right): lines run "/" — 135° on screen (y down)
  check('Harsh Rain comes from the dial (45°: "/", 0°: straight down)', near(orient(draw('rainstreaks', { light: 45, p1: 100, p2: 0 })), 135, 12) && near(orient(draw('rainstreaks', { light: 0, p1: 100, p2: 0 })), 90, 12));
  check('…and Gusts changes it', spread(draw('rainstreaks', { light: 0, p2: 0 })) > 40 && draw('rainstreaks', { light: 0, p2: 0 }).some((v, i, a) => v !== draw('rainstreaks', { light: 0, p2: 100 })[i]));
  check('Silverpoint Hatch runs along the dial (125°: the old 35° hatching)', near(orient(draw('hatch', { light: 125, p1: 0, p2: 300 })), 35, 12));
  const ink = d => { let s = 0; for(let i = 0; i < d.length; i += 4) s += 128 - d[i]; return s; };
  check('…and Cross-Hatching lays more ink as it rises', ink(draw('hatch', { light: 125, p1: 100, p2: 200 })) > ink(draw('hatch', { light: 125, p1: 0, p2: 200 }))*1.2);
  // the preview is the saved image, smaller (Ruby): what grows by chance on its grid grows on the export's. This page
  // at a third is a grid one row off the export's, which routed another board and ran other cracks.
  const boxes = cv => { const W = cv.width, H = cv.height, d = cv.getContext('2d').getImageData(0, 0, W, H).data, s = new Float64Array(16*28), n = new Float64Array(16*28);
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){ const i = Math.min(27, y*28/H | 0)*16 + Math.min(15, x*16/W | 0), q = (y*W + x)*4; s[i] += d[q] + d[q+1] + d[q+2]; n[i] += 3; }
    return s.map((v, i) => v/n[i]); };
  for(const type of ['circuit', 'crackle']){ const page = [385, 684];
    const A = boxes(T.getTextureCanvas(type, 128, 228, { seed: 7, scale: 128/385, page })), B = boxes(T.getTextureCanvas(type, 385, 684, { seed: 7, scale: 1, page }));
    let d = 0; for(let i = 0; i < A.length; i++) d += Math.abs(A[i] - B[i]);
    check(`${type}: the preview grows the saved image's picture (${(d/A.length).toFixed(1)})`, d/A.length < 4.5); }
}

// the Athanor's Knob kinds on the page (the booted app)
{
  installCanvasMock();
  const reg = installDomMock(makeMockContext, makeMockCanvas);
  await import('../appEvents.js?chains');
  const save = () => { reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); return JSON.parse(reg['advancedJson'].value); };
  const load = obj => { reg['advancedJson'].value = JSON.stringify(obj); reg['advancedLoadBtn'].dispatchEvent({ type: 'click' }); };
  const base = save();
  // A KNOB'S KIND (ROADMAP D1): on the page, a switch is a slider of two marks named Off and On, locked to them;
  // steps are their marks; in the graph, a switch hands on 0 or 1 and steps only their marks
  const knobGraph = (kind, extra = {}) => JSON.stringify({ v: 4, drawflow: { Home: { data: {
    1: { id: 1, name: 'knob', data: { slot: '1', name: 'Storm', def: 50, kind, ...extra }, inputs: {}, outputs: { output_1: { connections: [] } } },
    2: { id: 2, name: 'perlin', data: {}, inputs: { ['input_' + paramPort('perlin', 'rough')]: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: { output_1: { connections: [] } } },
    3: { id: 3, name: 'surface', data: { name: 'K' }, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } }, outputs: {} } } } } });
  const TG = await import('../textureGenerators.js');
  load({ ...base, texture: true, textureType: 'athanor', forgeGraph: knobGraph('switch') }); await new Promise(r => setTimeout(r, 60));
  const sw = TG.TEXTURE_PARAMS.athanor[0];
  check('a switch Knob is a slider of two marks, Off and On, locked to them', JSON.stringify(sw.ticks) === '[0,100]' && JSON.stringify(sw.names) === '["Off","On"]'
    && reg['texP1'].dataset.ticks === '0,100' && reg['texP1'].dataset.snapTicks === '1' && TG.paramReadout(sw, 100) === 'On');
  load({ ...base, texture: true, textureType: 'athanor', forgeGraph: knobGraph('steps', { steps: 3, names: 'Calm, Restless, Storm' }) }); await new Promise(r => setTimeout(r, 60));
  const st = TG.TEXTURE_PARAMS.athanor[0];
  check('…three Steps are three named marks', JSON.stringify(st.ticks) === '[0,50,100]' && TG.paramReadout(st, 48) === 'Restless');
  const K = (kind, v, extra) => { const run = STEPS.knob.run({ ctx: { knobs: [v] }, num: (n, k, d) => n.data[k] ?? d, P: (n, k, d) => n.data[k] ?? d }, { data: { slot: '1', kind, ...extra } }); return run[0]; };
  check('…and in the graph a switch is 0 or 1, steps only their marks, a slider as it is', K('switch', 49) === 0 && K('switch', 51) === 1 && K('steps', 40, { steps: 3 }) === 0.5 && K('slider', 40) === 0.4 && K(undefined, 40) === 0.4);
}

// ---- the Surface card's 🜉 Open in the Athanor: a texture's chain at the page's sliders ----
{ const T = await import('../textureGenerators.js'), defs = T.paramsFor('kintsugi');
  const knobs = g => Object.values(A.athanorNodes(g)).filter(n => n.name === 'knob').sort((a, b) => a.data.slot - b.data.slot).map(n => n.data.def);
  const at = knobs(A.athanorStarterAt('kintsugi', defs, ['200', '100', '70']));
  check('opened from the Surface card, a chain\'s Knobs stand where the sliders do (Seam Width 200 of 50–300 is 60 of 100)', Math.abs(at[0] - 60) < 1e-9 && Math.abs(at[1] - (100 - 20)/380*100) < 1e-9 && at[2] === 70);
  const every = Object.keys(TEXTURE_CHAINS).filter(t => T.TEXTURE_PARAMS[t]).every(t => { const d = T.paramsFor(t), g = A.athanorStarterAt(t, d, d.map(x => x.def));
    return Object.values(A.athanorNodes(g)).filter(n => n.name === 'knob').every(n => { const s = +n.data.slot, x = d[s - 1]; return !x || Math.abs(n.data.def - (x.def - x.min)/(x.max - x.min)*100) < 1e-9; }); });
  check('…and at every texture\'s own defaults, every Knob stands at its slider\'s default', every);
  check('a surface that is not a graph has nothing to open', A.athanorStarterAt('astral', [], []) === null); }

// ---- Under Glass (Ruby: a glass to lay over another surface): clean glass leaves what is under it alone ----
{ const clean = A.evalAthanor(JSON.stringify(A.athanorStarter('underglass')), 24, 32, { seed: 9, knobs: [0, 0, 0, 0, 0, 0, 0, 0], tints: [], light: 315, lightTilt: 70 }, {});
  check('Under Glass with every knob at 0 is exactly mid-gray, which its blend leaves alone', !!clean && [clean.r, clean.g, clean.b].every(ch => ch.every(v => Math.round(v*255) === 128)));
  const pane = JSON.stringify({ v: 4, drawflow: { Home: { data: {
    1: { id: 1, name: 'colour', data: { hex: '#336699' }, inputs: {}, outputs: { output_1: { connections: [] } } },
    2: { id: 2, name: 'glasspane', data: {}, inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: { output_1: { connections: [] } } },
    3: { id: 3, name: 'surface', data: { name: 'G', ground: 'colour' }, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } }, outputs: {} } } } } });
  const seen = A.evalAthanor(pane, 16, 16, { seed: 1, knobs: [], tints: [] }, {});
  check('…and a Glass Pane with nothing on its glass shows its picture exactly', !!seen && seen.r.every(v => Math.round(v*255) === 0x33) && seen.b.every(v => Math.round(v*255) === 0x99)); }

// the Ringworld's World: each band names its world; By the Seed picks one of the six (now and then Mixed),
// and Mixed lays three different ones side by side
{ const { rgWorldOf, RG_WORLDS } = await import('../stepsRing.js');
  const named = [14, 29, 43, 57, 71, 86].map(v => rgWorldOf(1234, v).name), seeded = Array.from({ length: 60 }, (_, s) => rgWorldOf(s*7919, 0)), mixed = rgWorldOf(99, 100);
  check('the Ringworld\'s World: each band its world, in order', named.join() === RG_WORLDS.slice(1, 7).join());
  check('…By the Seed picks among them (and sometimes Mixed), each world a single list but Mixed\'s three, all different',
    seeded.every(w => RG_WORLDS.includes(w.name) && w.name !== 'seed') && new Set(seeded.map(w => w.name)).size >= 5 && seeded.every(w => w.name === 'mixed' ? w.list.length === 3 : w.list.join() === w.name)
    && mixed.name === 'mixed' && new Set(mixed.list).size === 3); }

// the Ringworld's LENS is held under 118° across the page's short side however far the camera zooms out (Ruby: "clamp
// the extremes of this fov"), and a middling zoom is left as it was
{ const G = await import('../stepsGenerative.js'), r = zoom => G.ringParams({ band: 45, walls: 12, altitude: 15, seed: 9, lens: 75, zoom, look: 0, lift: 15 }).lens;
  check('the Ringworld\'s widest lens is held under 118°, a middling one untouched', r(25) <= 118 && Math.abs(r(100) - 75) < 1e-9); }

// the Ringworld's SUN (Ruby: the light dial sets it, in the world, whatever the camera's turn): overhead it is the
// ring's own star; at the dial's rim it is on the horizon; facing the dial's way (camera Turn = the dial's angle) puts it
// straight ahead; east of where you look it stands to the right; its guide is where the painting puts it
{ const G = await import('../stepsGenerative.js'), ring = look => ({ band: 45, walls: 12, altitude: 15, placeBy: 'where the seed says', seed: 9, lens: 75, zoom: 100, look, up: 0.6, curved: true });
  const L = G.ringCamera(G.ringParams(ring(0))), star = G.ringSunDir(L, 315, 0), s = Math.hypot(L.Px, L.z0);
  check('the Ringworld\'s sun: overhead it is the ring\'s own star, at the ring\'s middle; at the dial\'s rim, on the horizon',
    Math.abs(star[0] + L.Px/s) < 1e-9 && Math.abs(star[2] + L.z0/s) < 1e-9 && Math.abs(G.ringSunDir(L, 120, 1)[0]) < 1e-9);
  const ahead = G.ringSunGuide(1, 1, ring(120), 120, 0.9), east = G.ringSunGuide(1, 1, ring(0), 90, 0.9), west = G.ringSunGuide(1, 1, ring(0), 270, 0.9), behind = G.ringSunGuide(1, 1, ring(180), 0, 0.95);
  const off = p => p === null || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1;
  check('…facing the dial\'s way puts it straight ahead; east of where you look it stands right, west left; behind you, off the frame',
    !!ahead && Math.abs(ahead.x - 0.5) < 0.01 && !!east && !!west && east.x > 0.5 && west.x < 0.5 && off(behind)); }

// the Ringworld orbiting Saturn (Ruby; The Arch's Saturn): never draws no Saturn, always does, and by the seed
// it is one ring in four, the rest drawn exactly as with never
{ const M = await import('./canvasMock.mjs'), doc = globalThis.document; M.installCanvasMock();   // (the DOM mock's canvases go uncounted)
  const drawn = (saturn, seed) => { const g = A.athanorStarter('ringpaint');
    for(const n of Object.values(A.athanorNodes(g))) if(n.name === 'ringarch') n.data = { ...n.data, saturn };
    M.resetCreatedCanvases(); A.evalAthanor(g, 160, 160, { seed, knobs: [], tints: [], canvas: true }, {});
    return JSON.stringify(M.createdCanvases.map(c => c.getContext('2d')._stats)); };
  const seeds = Array.from({ length: 24 }, (_, i) => i + 1), saturnine = seeds.filter(s => drawn('by the seed', s) !== drawn('never', s));
  check('The Arch\'s Saturn: always draws something never does', seeds.slice(0, 4).every(s => drawn('always', s) !== drawn('never', s)));
  check(`…by the seed, about one ring in four orbits Saturn (${saturnine.length} of 24), the others exactly as never`, saturnine.length >= 2 && saturnine.length <= 12
    && saturnine.every(s => drawn('by the seed', s) === drawn('always', s)));
  globalThis.document = doc; }

done();
