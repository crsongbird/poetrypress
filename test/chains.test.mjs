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

const { STEPS, stepRange } = await import('../steps.js');
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
const BIND = /^@(k[1-6]|dial|tilt)(\[\s*-?[\d.]+\s*,\s*-?[\d.]+\s*\])?$/;
for(const [type, ch] of Object.entries(TEXTURE_CHAINS)){
  const okNodes = ch.nodes.every(([s]) => STEPS[s]), okWires = ch.wires.every(([a, o, b, j]) => ch.nodes[a-1] && ch.nodes[b-1] && o <= STEPS[ch.nodes[a-1][0]].outs.length && j <= STEPS[ch.nodes[b-1][0]].ins.length);
  const binds = ch.nodes.flatMap(([, d]) => Object.values(d).filter(v => typeof v === 'string' && v[0] === '@'));
  check(`${ch.label}: its steps exist, its wires fit their ports, its bindings read`, okNodes && okWires && binds.length > 0 && binds.every(b => BIND.test(b)));
  const g = A.athanorStarter(type);
  check(`${ch.label}: opens as an Athanor template (Start from… → Vellum's textures), named, with its sliders`,
    g && A.athanorName(g) === ch.label && A.athanorKnobs(g).length >= 2);
}
check('the Athanor\'s menu lists Vellum\'s textures as templates', /Vellum’s textures/.test(src('forge.js')) && /TEXTURE_CHAINS/.test(src('forge.js')));
check('a bound param shows as written in its node (editable text)', F.forgeNodeHtml('streaks', {}, { angle: '@dial' }).includes('value="@dial"') && F.forgeNodeHtml('streaks', {}, { angle: '@dial' }).includes('forge-bound'));
check('a bound param with no range of its own reads its step\'s range', JSON.stringify(stepRange('hatching', 'cross')) === '[0,100]');

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
  check('a look says which format it was saved in', base.lookVersion === 2);
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

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
