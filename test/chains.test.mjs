/**
 * chains.test.mjs — the long refactor: one library of STEPS (steps.js) that
 * both the Athanor and Vellum's textures are made of, and the textures
 * rebuilt as CHAINS of them (chains.js): each opens in the Athanor as a
 * template, reads its own sliders and the dial, and old looks made before
 * the dial took over Harsh Rain's slant and the Hatch's angle come back as
 * they were.
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

const { STEPS, stepRange, paramPort } = await import('../steps.js');
const { TEXTURE_CHAINS } = await import('../chains.js');
const F = await import('../forge.js');
const A = await import('../athanor.js');

// one library
check('every Athanor part is a step, and every step does something', Object.keys(F.FORGE_NODES).every(k => STEPS[k] && typeof STEPS[k].run === 'function')
  && Object.keys(STEPS).every(k => F.FORGE_NODES[k]));
check('the evaluator walks the graph; the steps do the work (no node code left in athanor.js)', !/switch\(n\.name\)/.test(src('athanor.js')) && /STEPS\[n\.name\]/.test(src('athanor.js')));
check('the steps carry their own cost (the budget reads it)', Object.values(STEPS).every(s => typeof s.cost === 'function') && /\(STEPS\[n\.name\] \|\| \{\}\)\.cost/.test(src('athanor.js')));
check('new steps for the chains: Colour, Soft Forms, Streaks, Hatching (Marks)', ['colour', 'forms', 'streaks', 'hatching'].every(k => STEPS[k]) && STEPS.streaks.cat === 'Marks');

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
check('the Athanor\'s Open menu lists the app\'s textures as templates, under the Surface menu\'s own group headings (TEXTURE_GROUPS), after the starters', /TEXTURE_GROUPS\.map\(g => \[g, g\.types\.filter\(t => TEXTURE_CHAINS\[t\]\)/.test(src('forge.js')) && /FORGE_BAR\.starters/.test(src('forge.js')));
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
}

// old looks: the slider's old job becomes the dial's direction
{
  installCanvasMock();
  const reg = installDomMock(makeMockContext, makeMockCanvas);
  await import('../appEvents.js?chains');
  const save = () => { reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); return JSON.parse(reg['advancedJson'].value); };
  const load = obj => { reg['advancedJson'].value = JSON.stringify(obj); reg['advancedLoadBtn'].dispatchEvent({ type: 'click' }); };
  const base = save();
  check('a look says which format it was saved in', base.lookVersion === 3);
  const { lookVersion, ...old } = base;
  load({ ...old, texture: true, textureType: 'rainstreaks', texP1: '200', texP2: '-30', textureLight: '315' });
  let s = save();
  check('an old Harsh Rain look: Slant −30° becomes the dial at 30°, no gusts', s.textureLight === '30' && +s.texP2 === 0 && +s.texP1 === 200);
  load({ ...old, texture: true, textureType: 'hatch', texP1: '64', texP2: '400', textureLight: '315' });
  s = save();
  check('an old Silverpoint Hatch look: Hatch Angle 64° becomes the dial at 154°, Cross-Hatching as it was', s.textureLight === '154' && +s.texP1 === 38 && +s.texP2 === 400);
  load({ ...base, texture: true, textureType: 'rainstreaks', texP2: '30', textureLight: '200' });
  s = save();
  check('a new look is left as it is', s.textureLight === '200' && +s.texP2 === 30);
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

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
