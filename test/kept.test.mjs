/**
 * kept.test.mjs — surfaces made in the Athanor and kept on the shelf (Ruby's Halftone2 report):
 * one name (the Surface part's name is the name it is kept under), wiring that can be copied,
 * shared and pasted back, ports drawn in their own order, thumbnails, Keep in the bar.
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

const fg = src('forge.js'), ev = src('appEvents.js'), html = src('index.html'), ch = src('chooser.js');
check('WIRES LAND ON THEIR ROWS: a node\'s ports are put in their own order before Drawflow draws them (Halftone2\'s were input_2, input_3, input_1)',
  /n\.inputs = ordered\(n\.inputs, 'input_'\); n\.outputs = ordered\(n\.outputs, 'output_'\);/.test(fg));
check('keeping under a new name renames the Surface part; keeping over a kept one asks first (the soft no)',
  /if\(sid && surfaceName\(\) !== clean\) setData\(sid, \{ name: clean \}\)/.test(fg) && /fill\(KEPT\.replaceAsk, at\.name\)[^\n]*danger: true/.test(fg));
check('Replace it with the graph on the grid, asked first', /const replaceKept = async rec => \{[\s\S]{0,200}fill\(KEPT\.replaceWithAsk, rec\.name\)[^\n]*danger: true/.test(fg));
check('Keep is one tap, in the bar', /id="forgeKeepBtn"/.test(html) && /\$\('forgeKeepBtn'\)\.addEventListener\('click', \(\) => keep\(\)\)/.test(fg));
check('kept surfaces get thumbnails at canonical settings, kept with them until their wiring changes', /function keptThumb\(rec, canvas, unsaved\)/.test(ev) && /rec\.thumb\.of === of/.test(ev) && /seed: 4242, scale: n\/3072, light: 315, lightTilt: 100/.test(ev));
check('a long press on a surface made in the Athanor opens its menu: use, open, share, copy the wiring, take it off', /opts\.hold\(it\.value, b\)/.test(ch) && /function holdSurface\(value, tile\)/.test(ev) && /KEPT\.copy, hint: KEPT\.copyHint, act: \(\) => copyWiring\(rec\)/.test(ev));
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
