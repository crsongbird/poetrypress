/**
 * kept.test.mjs — surfaces made in the Athanor and kept on the shelf (Ruby's Halftone2 report):
 * one name (the Surface part's name is the name it is kept under), wiring that can be copied,
 * shared and pasted back, and a kept surface chosen by name from the page's Surface menu.
 * Run: node test/kept.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
const store = {};
globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
installCanvasMock(); const reg = installDomMock(makeMockContext, makeMockCanvas);
const F = await import('../forge.js');
const A = await import('../athanor.js');
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const ruby = src('test/fixtures/kept-halftone2.json');
const validate = j => A.validateGraph(j);

const read = F.forgeReadSurfaces(ruby, validate);
check('Ruby\'s shelf text reads back: one surface, Halftone2', read && read.surfaces.length === 1 && read.surfaces[0].name === 'Halftone2' && read.bad === 0);
check('ONE NAME: a kept surface\'s Surface part is named as it is kept (it said "Halftone")', read && F.forgeSurfaceNameOf(JSON.parse(read.surfaces[0].graph)) === 'Halftone2');
const text = F.forgeWiringText(read.surfaces), again = F.forgeReadSurfaces(text, validate);
check('Copy the wiring → paste it back: the same surface', again && again.surfaces.length === 1 && again.surfaces[0].name === 'Halftone2' && again.surfaces[0].graph === read.surfaces[0].graph && !/thumb/.test(text));
const bare = F.forgeReadSurfaces(JSON.parse(read.surfaces[0].graph), validate);
check('a bare graph pasted is a surface named by its Surface part', bare && bare.surfaces.length === 1 && bare.surfaces[0].name === 'Halftone2');
check('text that isn\'t wiring is refused (nothing on the shelf changes)', F.forgeReadSurfaces('hello', validate) === null && F.forgeReadSurfaces('{"a":1}', validate) === null);
check('a broken surface among good ones is counted and left out', (() => { const r = F.forgeReadSurfaces(JSON.stringify({ surfaces: [read.surfaces[0], { name: 'x', graph: 'nope' }] }), validate); return r && r.surfaces.length === 1 && r.bad === 1; })());

{ const g = JSON.parse(read.surfaces[0].graph), renamed = F.forgeNameSurface(g, 'Halftone3');
  check('keeping under a new name renames the Surface part (one name), and nothing else in the graph',
    F.forgeSurfaceNameOf(renamed) === 'Halftone3' && A.athanorName(renamed) === 'Halftone3'
    && JSON.stringify(F.forgeNameSurface(JSON.parse(JSON.stringify(renamed)), 'Halftone2')) === read.surfaces[0].graph); }
// ---- THE BENCH (Ruby): choosing a kept surface sets the page's surface and leaves the Athanor's work alone ----
{ const wip = JSON.stringify(A.athanorStarter('ripples'));
  store['uv.forge.bench.v1'] = wip; F.forgeShelfWrite(read.surfaces);
  await import('../appEvents.js'); await new Promise(r => setTimeout(r, 30));
  const offered = (reg['athanorGroup'].children || []).filter(o => String(o.value).startsWith('kept:'));
  check('kept surfaces are chosen by name (not by place on the shelf), and the page calls them what the shelf does',
    offered.length === 1 && offered[0].value === 'kept:' + encodeURIComponent('Halftone2') && offered[0].textContent === 'Halftone2');
  const t = reg['textureType']; t.value = offered.length ? offered[0].value : ''; document.dispatchEvent({ type: 'change', target: t });
  check('choosing Halftone2 in the Surface menu shows it on the page, by its name',
    t.value === 'athanor' && A.athanorName(reg['forgeGraph'].value) === 'Halftone2');
  check('…and the work in progress on the Athanor\'s bench is untouched', store['uv.forge.bench.v1'] === wip);
  // THE CAMERA DIAL for a graph from the Athanor (Ruby: it never appeared): shown when its Camera Dial reaches the Surface
  const camShown = () => !String(reg['cameraRow'].className || '').split(' ').includes('tool-hidden') && !(reg['cameraRow'].classList && reg['cameraRow'].classList.contains('tool-hidden'));
  const noCam = camShown();
  const save = () => { reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); return JSON.parse(reg['advancedJson'].value); };
  const load = o => { reg['advancedJson'].value = JSON.stringify(o); reg['advancedLoadBtn'].dispatchEvent({ type: 'click' }); };
  const lich = A.athanorStarterAt('lichtenberg', [], []);
  load({ ...save(), textureType: 'athanor', forgeGraph: JSON.stringify(lich) }); await new Promise(r => setTimeout(r, 30));
  check('a graph without a Camera Dial shows no camera dial; one whose Camera Dial reaches its Surface does (Lichtenberg Figures, opened in the Athanor)',
    noCam === false && A.athanorCamera(lich) && camShown()); }
console.log(failures ? `\n${failures} FAILURES` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
