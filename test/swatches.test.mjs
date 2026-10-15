/**
 * swatches.test.mjs — preset snapshots.
 *
 * A swatch has to show enough to tell presets apart: the ground, a hint of
 * the surface, the border if it has one, and its glyphs. The cost matters —
 * sixteen of these are painted at boot — so the texture is generated AT
 * swatch size rather than rendered full and scaled.
 *
 * Run: node test/swatches.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas, createdCanvases, resetCreatedCanvases } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const { PRESETS } = await import('../appOptions.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
const vault = readFileSync(new URL('../vault.js', import.meta.url), 'utf8');

check('every preset button was built (and a heading for each group)', registry['presetGrid'].children.length === PRESETS.length + (await import('../appOptions.js')).PRESET_GROUPS.length);

// the swatch must be a canvas, not a div with a background
check('swatches are painted, not CSS gradients',
  /const swatch = document\.createElement\('canvas'\)/.test(ev) &&
  !/swatch\.style\.background/.test(ev));

// each element of the snapshot
// the painter moved to its own module in the refactor
const sw = readFileSync(new URL('../swatches.js', import.meta.url), 'utf8');
const paint = (sw.match(/function paintPresetSwatch[\s\S]*?\n\}/) || [''])[0];
check('the painter exists', paint.length > 400);
// what it paints, by behavior: a canvas that writes down what is drawn on it, and a texture source that
// writes down what it is asked for (the app's own is put back at the end)
const { paintPresetSwatch, setSwatchTextureSource } = await import('../swatches.js');
const asked = [];
const recCanvas = () => {
  const ops = [], base = { ops, globalCompositeOperation: 'source-over', globalAlpha: 1, fillStyle: '#000',
    fillRect(){ ops.push(['fill', this.fillStyle]); }, drawImage(img){ ops.push(['draw', img && img.tex, this.globalCompositeOperation, this.globalAlpha]); },
    measureText(t){ return { width: String(t || '').length * 6 }; }, createLinearGradient(){ return { addColorStop(){} }; } };
  const ctx = new Proxy(base, { get: (t, k) => k in t ? t[k] : () => {} });
  return { width: 0, height: 0, getContext: () => ctx, ops };
};
const paintWith = (look, source) => { setSwatchTextureSource(source); const cv = recCanvas(); paintPresetSwatch(cv, look, 120, 40); return cv.ops; };
const src = (type, w, h, opts) => { asked.push({ type, w, h, opts }); return { tex: type, width: w, height: h }; };
{
  const ops = paintWith({ bg1: '#102030', texture: true, textureType: 'hatch', textureBlend: 'multiply', textureOpacity: 40 }, src);
  check('it paints the ground', ops.some(o => o[0] === 'fill' && o[1] === '#102030'));
  check('it paints the surface, in its blend and opacity', ops.some(o => o[0] === 'draw' && o[1] === 'hatch' && o[2] === 'multiply' && Math.abs(o[3] - 0.4) < 1e-6));
  check('the texture is made at swatch size', asked.some(a => a.type === 'hatch' && a.w === 120 && a.h === 40));
  const def = paintWith({ bg1: '#000', texture: true, textureType: 'hatch', textureBlend: 'vivid-light' }, src);
  check('a blend a canvas can\'t mix (⚡) shows as the surface\'s own first', def.some(o => o[0] === 'draw' && o[2] === 'overlay'));
  asked.length = 0; paintWith({ bg1: '#000', texture: true, textureType: 'astral' }, src);
  check('the composite starfield is asked for by a real generator', asked.some(a => a.type === 'astral_stars'));
  const two = paintWith({ bg1: '#000', texture: true, textureType: 'hatch', baseToggle: true, baseLayer: { textureType: 'linen', textureBlend: 'screen', textureOpacity: 70 } }, src);
  const iLow = two.findIndex(o => o[0] === 'draw' && o[1] === 'linen'), iUp = two.findIndex(o => o[0] === 'draw' && o[1] === 'hatch');
  check('a look with two surfaces shows both, the lower beneath', iLow >= 0 && iUp > iLow && two[iLow][2] === 'screen');
  let threw = null; try { paintWith({ bg1: '#000', texture: true, textureType: 'hatch' }, () => { throw new Error('boom'); }); } catch(e){ threw = e; }
  check('a swatch failure can never break the page', threw === null);
  setSwatchTextureSource(src);   // (a source that answers, for the tiles below)
}

// the Spellcrafting wheel shares the painter rather than duplicating it
check('the wheel uses the same painter', /deps\.paintSwatch/.test(vault));
check('the wheel still works without one', /else \{[\s\S]{0,200}chip-swatch/.test(vault));
check('the painter is injected into the vault', /paintSwatch: paintPresetSwatch/.test(ev));

// painting sixteen swatches must not be extravagant
resetCreatedCanvases();
const before = createdCanvases.length;
check('painting is cheap enough to do at boot', before < 400);

// ---- snapshot geometry ----
// The canvas is painted at roughly the display box's aspect so filling it
// introduces no visible distortion, and the border is inset by a full stroke
// width so all four edges land inside the canvas.
// the dimensions moved into tunables.js so they can be edited by hand
const { SWATCH } = await import('../tunables.js');
check('the swatch is painted from the tunable size',
  /paintPresetSwatch\(swatch, p, SWATCH\.width, SWATCH\.height\)/.test(ev));
check('that size still matches the box\'s aspect',
  Math.abs((SWATCH.width / SWATCH.height) - (208 / 48)) < 0.6);
check('the frame is inset past its stroke, so no edge falls off the tile', /const inset = bw \* 1\.6;/.test(paint));
check('the glyphs are centred both ways',
  /textBaseline = 'middle'/.test(paint) && /\(w - total\) \/ 2/.test(paint) && /const y = h \/ 2/.test(paint));

// ---- saved presets in the grid ----
const savedFn = (ev.match(/function renderSavedPresets[\s\S]*?\n\}/) || [''])[0];
check('saved presets go in their own grid (Custom Presets), never among the built-ins',
  /customGrid\.appendChild\(presetTile\(/.test(savedFn) && !/presetGrid\.appendChild/.test(savedFn));
check('an empty Custom Presets says how to fill it', /customPresetsEmpty/.test(savedFn));
check('a saved preset applies its own look and spell, through the look filter',
  /safeRestore\(stripToLook\(Object\.assign\(\{\}, rec\.settings, \{ spell: rec\.spell \}\)\), 'This spell'\)/.test(savedFn));
check('tiles are built by one shared helper', /function presetTile/.test(ev));


// ---- tiles paint when they are seen (paintWhenSeen) ----
{
  let threw = null;
  try { globalThis.IntersectionObserver.showAll(); await new Promise(r => setTimeout(r, 50)); } catch(e){ threw = e; }
  check('preset tiles paint once seen, each without throwing', threw === null);
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
