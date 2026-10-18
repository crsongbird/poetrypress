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
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

// this browser's storage, holding one saved spell (a custom preset) that carries more than a look
const store = new Map([['uv.firstvisit.v1', '1'], ['uv.spells.v1', JSON.stringify([{ name: 'Mine',
  settings: { bg1: '#102030', texture: true, textureType: 'linen', poemText: 'their poem', locks: ['bg1'], username: '@theirs' } }])]]);
globalThis.localStorage = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const { PRESETS } = await import('../appOptions.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const walk = (n, cls, out = []) => { for(const c of n.children || []){ if(String(c.className || '').split(' ').includes(cls)) out.push(c); walk(c, cls, out); } return out; };

check('every preset button was built (and a heading for each group)', registry['presetGrid'].children.length === PRESETS.length + (await import('../appOptions.js')).PRESET_GROUPS.length);

// each element of the snapshot, by behavior: a canvas that writes down what is drawn on it, and a texture source that
// writes down what it is asked for (the app's own is put back at the end)
const { paintPresetSwatch, setSwatchTextureSource } = await import('../swatches.js');
const asked = [];
const recCanvas = () => {
  const ops = [], base = { ops, globalCompositeOperation: 'source-over', globalAlpha: 1, fillStyle: '#000', lineWidth: 1, textBaseline: 'alphabetic',
    fillRect(){ ops.push(['fill', this.fillStyle]); }, drawImage(img){ ops.push(['draw', img && img.tex, this.globalCompositeOperation, this.globalAlpha]); },
    moveTo(x, y){ ops.push(['pt', x, y]); }, lineTo(x, y){ ops.push(['pt', x, y]); }, arcTo(x1, y1, x2, y2){ ops.push(['pt', x1, y1], ['pt', x2, y2]); },
    stroke(){ ops.push(['stroke', this.lineWidth]); }, fillText(t, x, y){ ops.push(['text', String(t), x, y, this.textBaseline]); },
    measureText(t){ return { width: String(t || '').length * 6 }; }, createLinearGradient(){ return { addColorStop(){} }; } };
  const ctx = new Proxy(base, { get: (t, k) => k in t ? t[k] : () => {} });
  return { width: 0, height: 0, getContext: () => ctx, ops };
};
const paintWith = (look, source, w = 120, h = 40) => { setSwatchTextureSource(source); const cv = recCanvas(); paintPresetSwatch(cv, look, w, h); return cv.ops; };
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

// ---- snapshot geometry ----
// The canvas is painted at roughly the display box's aspect so filling it
// introduces no visible distortion, and the border is inset by a full stroke
// width so all four edges land inside the canvas.
// the dimensions moved into tunables.js so they can be edited by hand
const { SWATCH } = await import('../tunables.js');
check('that size still matches the box\'s aspect',
  Math.abs((SWATCH.width / SWATCH.height) - (208 / 48)) < 0.6);
{ const ops = paintWith({ bg1: '#000', border: true, borderColor: '#fff' }, src), pts = ops.filter(o => o[0] === 'pt'), lw = (ops.find(o => o[0] === 'stroke') || [])[1];
  check('the frame is inset past its stroke, so no edge falls off the tile',
    pts.length > 4 && lw > 0 && pts.every(([, x, y]) => x - lw/2 >= 0 && x + lw/2 <= 120 && y - lw/2 >= 0 && y + lw/2 <= 40));
  const tx = paintWith({ bg1: '#000', spell: PRESETS[0].spell }, src, 240, 40).filter(o => o[0] === 'text'), last = tx[tx.length - 1] || [];
  check('the glyphs are centred both ways',
    tx.length > 0 && Math.abs(tx[0][2] - (240 - (last[2] + last[1].length * 6))) < 1e-6 && tx[0][2] > 0 && tx.every(o => o[3] === 20 && o[4] === 'middle')); }

// ---- saved presets in the grid: a spell kept in this browser is a tile of its own ----
{
  const save = () => { registry['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); return JSON.parse(registry['advancedJson'].value); };
  const mine = walk(registry['customPresetGrid'], 'preset-custom').find(t => t.dataset.name === 'Mine');
  check('saved presets go in their own grid (Custom Presets), never among the built-ins',
    !!mine && !walk(registry['presetGrid'], 'preset-btn').some(t => t.dataset.name === 'Mine'));
  const built = walk(registry['presetGrid'], 'preset-btn')[0], parts = t => (t ? t.children : []).map(c => c.className).join();
  check('tiles are built by one shared helper (a saved preset\'s tile is made as a built-in\'s is)', !!mine && parts(mine) === parts(built) && parts(built) === 'preset-swatch,preset-label');
  registry['poemText'].value = 'my own poem';
  const before = save();
  if(mine){ mine.dispatchEvent({ type: 'click' }); await new Promise(r => setTimeout(r, 60)); }
  const s = save();
  check('a saved preset applies its own look and spell, through the look filter (never the poem, the locks or the credit it carried)',
    s.textureType === 'linen' && /^#102030$/i.test(s.bg1) && s.poemText === 'my own poem' && JSON.stringify(s.locks) === JSON.stringify(before.locks) && s.username === before.username);
}

// ---- tiles paint when they are seen (paintWhenSeen), one a frame ----
{
  const swatches = walk(registry['presetGrid'], 'preset-swatch');
  let threw = null;
  try { globalThis.IntersectionObserver.showAll();
    for(let t = 0; t < 100 && swatches.some(c => !c.width); t++) await new Promise(r => setTimeout(r, 50)); } catch(e){ threw = e; }
  check('preset tiles paint once seen, each without throwing', threw === null && swatches.every(c => c.width > 0));
  // the swatch must be a canvas, not a div with a background, painted at the tunable size
  check('swatches are painted, not CSS gradients', swatches.length === PRESETS.length && swatches.every(c => typeof c.getContext === 'function' && !(c.style && c.style.background)));
  check('the swatch is painted from the tunable size', swatches.every(c => c.width === SWATCH.width && c.height === SWATCH.height));
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
