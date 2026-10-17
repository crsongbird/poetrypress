/**
 * textureLayers.test.mjs — SURFACE LAYERS (Ruby: "all controls for the second
 * layer, a swap, every blend"): two surfaces, one above the other. Every
 * control edits whichever the layer bar shows; a look saves the upper under
 * its own keys and the lower as `baseLayer` (its locks as `baseLocks`); Swap
 * trades the two whole. Old looks' base layers open as lower surfaces that
 * draw as before. Tested by behavior, on the booted app.
 *
 * Run: node test/textureLayers.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const reg = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const { capsFor } = await import('../textureGenerators.js');
const { SURFACE_BLENDS } = await import('../canvasRenderer.js');
const { BLEND_NAMES } = await import('../strings.js');
const { BOX_GPU_BLENDS } = await import('../boxFx.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const save = () => { reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); return JSON.parse(reg['advancedJson'].value); };
const load = obj => { reg['advancedJson'].value = JSON.stringify(obj); reg['advancedLoadBtn'].dispatchEvent({ type: 'click' }); };
const show = which => reg['layerSeg'].dispatchEvent({ type: 'click', target: { closest: () => ({ dataset: { layer: which } }) } });
const two = on => { reg['baseToggle'].checked = on; reg['baseToggle'].dispatchEvent({ type: 'change' }); };
const turned = seed => ((parseInt(seed, 10) || 0) ^ 0x5bd1e995) >>> 0;
const set = (id, v) => { reg[id].value = v; reg[id].dispatchEvent({ type: 'input' }); reg[id].dispatchEvent({ type: 'change' }); };

const base = save();

load({ ...base, texture: true, textureType: 'hatch', baseToggle: false, locks: [] });
let s = save();
check('one surface: the look carries no lower one', !s.baseToggle && s.baseLayer === undefined);

two(true); s = save();
check('Two Surfaces: a lower surface appears, Waking Grain on a seed of its own (as the base layer always began)',
  s.baseToggle === true && s.baseLayer && s.baseLayer.textureType === 'grain' && s.baseLayer.textureSeed === turned(s.textureSeed) && s.textureType === 'hatch');

show('lower');
check('Lower: the controls show the lower surface', reg['textureType'].value === 'grain');
set('textureType', 'linen'); set('textureBlend', 'multiply'); set('texP1', '77'); set('textureOpacity', '61');
s = save();
check('…and every control changes it (variant, blend, knobs, opacity), while the look keeps the upper under its own keys',
  s.textureType === 'hatch' && s.baseLayer.textureType === 'linen' && s.baseLayer.textureBlend === 'multiply' && String(s.baseLayer.texP1) === '77' && +s.baseLayer.textureOpacity === 61);

load({ ...s, locks: ['texP2'], baseLocks: ['texP1', 'textureBlend'] });
s = save();
check('a look loaded while the lower is shown shows the lower again (an undo keeps its place)', reg['textureType'].value === 'linen');
check('each surface keeps its own locks, whichever is shown', s.locks.includes('texP2') && !s.locks.includes('texP1') && s.baseLocks.includes('texP1') && s.baseLocks.includes('textureBlend'));

reg['layerSwap'].dispatchEvent({ type: 'click' });
s = save();
check('Swap trades the two whole: variant, blend, knobs, opacity, seed and locks',
  s.textureType === 'linen' && s.textureBlend === 'multiply' && String(s.texP1) === '77' && +s.textureOpacity === 61
  && s.baseLayer.textureType === 'hatch' && s.locks.includes('texP1') && s.locks.includes('textureBlend') && s.baseLocks.includes('texP2'));
check('…and the controls stay where they were (on the lower, now the other surface)', reg['textureType'].value === 'hatch');

show('upper');
check('Upper: the controls show the surface on top', reg['textureType'].value === 'linen');
show('lower'); two(false);
check('turning Two Surfaces off returns the controls to the upper', reg['textureType'].value === 'linen');
s = save();
check('…and the lower waits in the look, for when it is turned on again', s.baseToggle === false && s.baseLayer && s.baseLayer.textureType === 'hatch');

// ---- looks from before ----
load({ ...base, texture: true, textureType: 'hatch', textureSeed: 1234, textureLight: '200', baseToggle: true, baseType: 'linen', baseP1: '61', baseP2: '33', baseOpacity: '44', baseBlend: 'multiply', lookVersion: 2, locks: [] });
s = save();
const L = s.baseLayer || {};
check('an old look\'s base layer opens as the lower surface, drawn as before (its knobs, opacity and blend; the page\'s light; the seed turned)',
  L.textureType === 'linen' && String(L.texP1) === '61' && String(L.texP2) === '33' && +L.textureOpacity === 44 && L.textureBlend === 'multiply'
  && String(L.textureLight) === '200' && L.textureSeed === turned(1234) && s.baseType === undefined && s.baseP1 === undefined && L.textureGround === undefined);
load({ ...base, texture: true, textureType: 'hatch', baseToggle: true, baseType: 'clouds', baseBlend: 'source-over', lookVersion: 2, locks: [] });
s = save();
check('…on the ground it was made on then, where a blend not made for it once fell back to its first',
  s.baseLayer.textureBlend === 'source-over' && s.baseLayer.textureGround === capsFor('clouds').blends[0]);
load({ ...base, texture: true, textureType: 'hatch', textureBlend: 'difference', lookVersion: 2 });
check('an older look\'s blend that its surface did not offer is its first blend, as it was drawn', save().textureBlend === capsFor('hatch').blends[0]);
load({ ...base, texture: true, textureType: 'hatch', textureBlend: 'difference' });
check('…while a look from now keeps any blend', save().textureBlend === 'difference');

// ---- every blend, for every surface ----
check('every blend a layer can take has a name; the ⚡ ones are those a canvas can\'t do (mixed per pixel)',
  SURFACE_BLENDS.every(b => BLEND_NAMES[b]) && SURFACE_BLENDS.filter(b => /⚡/.test(BLEND_NAMES[b])).sort().join() === [...BOX_GPU_BLENDS].sort().join());
check('…and every surface\'s own blends are among them', ['hatch', 'linen', 'clouds', 'stainedglass', 'cards', 'astral'].every(t => capsFor(t).blends.every(b => SURFACE_BLENDS.includes(b))));

// ---- the surface and the words: Text Aware (each surface), Blend with Text and Shape Aware (the second) ----
load({ ...base, texture: true, textureType: 'hatch', baseToggle: false, locks: [] });
s = save();
check('a look from before the words\' boxes: its surface is Text Aware, nothing blended into the letters', s.textureTextAware === true && s.textureTextBlend === false && s.textureShapeAware === false);
const tick = (id, on) => { reg[id].checked = on; reg[id].dispatchEvent({ type: 'change' }); };
tick('textureTextAware', false); s = save();
check('Text Aware off is the surface\'s own, saved with it', s.textureTextAware === false);
two(true); show('lower'); tick('textureTextBlend', true); tick('textureShapeAware', true); s = save();
check('the second surface blended into the letters, Shape Aware, saved as its own (the first keeps its own box)',
  s.baseLayer.textureTextBlend === true && s.baseLayer.textureShapeAware === true && s.textureTextAware === false && !s.textureTextBlend);
show('upper'); load(s); show('lower');
check('…and they come back with it', reg['textureTextBlend'].checked === true && reg['textureShapeAware'].checked === true && !reg['textureShapeAware'].disabled);
tick('textureTextBlend', false);
check('Shape Aware waits, greyed, while the surface is not blended into the letters', reg['textureShapeAware'].disabled === true);
show('upper');

// ---- a preset turns the lower off ----
load({ ...base, texture: true, baseToggle: true, baseLayer: { textureType: 'linen' } });
const walk = (n, cls, out = []) => { for(const c of n.children || []){ if(String(c.className || '').split(' ').includes(cls)) out.push(c); walk(c, cls, out); } return out; };
const tile = walk(reg['presetGrid'], 'preset-btn').find(t => t.dataset.name === 'Andromeda');
if(tile){ tile.dispatchEvent({ type: 'click' }); await new Promise(r => setTimeout(r, 60)); }
s = save();
check('a preset turns the lower surface off (it never leaks from one look to the next)', !!tile && s.baseToggle === false && s.baseLayer === undefined);

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
