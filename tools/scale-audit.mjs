/**
 * tools/scale-audit.mjs — how far is each texture from looking the same at
 * any canvas size?
 *
 * For every texture, with one seed and its default knobs:
 *   1. generate at the full export size, then scale that down to preview size
 *   2. generate directly at preview size, with S = preview / full
 * and score the difference, 0–255 in brightness, both laid over mid-grey so
 * transparent textures compare fairly:
 *   structure  both shrunk to 128px first, blurring away fine grain: elements
 *              in the wrong place, thinner lines, missing marks.
 *   relative   structure as a share of the texture's own contrast, so a
 *              faint texture can't pass just by being faint. THE verdict.
 *   detail     pixel by pixel; noise never matches exactly, so informational.
 *
 * When every texture scores low on structure, the preview can be drawn at
 * screen size without looking different from the export.
 *
 *   npm install @napi-rs/canvas          (once)
 *   node tools/scale-audit.mjs                    all textures, 3072 → 1024
 *   node tools/scale-audit.mjs --full 3072 --small 768 --images out/ --only moon,water
 *   node tools/scale-audit.mjs --knobs min            (or max: sliders at their ends)
 */
import { createCanvas, Path2D as P2 } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'fs';
globalThis.Path2D = P2;
globalThis.document = { createElement: () => createCanvas(1, 1) };
const T = await import(new URL('../textureGenerators.js', import.meta.url));

const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : process.argv[i + 1]; };
const FULL = +arg('--full', 3072), SMALL = +arg('--small', 1024), SEED = +arg('--seed', 4242);
const IMG = arg('--images', null), ONLY = arg('--only', null);
// which knob values to test: def (default), min or max — a texture can pass
// at its defaults and fail with its sliders at the ends
const KNOBS = arg('--knobs', 'def');
const S = SMALL / FULL;
if(IMG) mkdirSync(IMG, { recursive: true });

// laid over mid-grey at a given size
const flatten = (src, size) => {
  const c = createCanvas(size, size), x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, size, size);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(src, 0, 0, size, size);
  return c;
};
const lum = c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, out = new Float32Array(d.length / 4);
  for(let i = 0, j = 0; i < d.length; i += 4, j++) out[j] = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114; return out; };
const meanDiff = (a, b) => { let s = 0; for(let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };
// the texture's own contrast: mean distance from its average. A faint texture
// has little to get wrong, so differences are judged against this.
const spread = a => { let m = 0; for(const v of a) m += v; m /= a.length; let s = 0; for(const v of a) s += Math.abs(v - m); return s / a.length; };

// Deep Field is drawn by the renderer as two layers, the nebula and the
// stars; 'astral' on its own is never shown, so the layers are what count
const types = (ONLY ? ONLY.split(',') : Object.keys(T.TEXTURE_PARAMS))
  .flatMap(t => t === 'astral' ? ['astral_fog', 'astral_stars'] : [t]);
const rows = [];
for(const type of types){
  const defs = T.paramsFor(type.startsWith('astral') ? 'astral' : type), caps = T.capsFor(type.startsWith('astral') ? 'astral' : type);
  const opts = s => ({ accent1: '#d9a6b3', accent2: '#9B7FE8', seed: SEED, p1: defs[0] && defs[0][KNOBS], p2: defs[1] && defs[1][KNOBS], p3: defs[2] && defs[2][KNOBS],
                       light: 315, blend: caps.blends[0], scale: s });
  const t0 = Date.now();
  T.clearTextureCache();
  const full = T.getTextureCanvas(type, FULL, FULL, opts(1));
  const small = T.getTextureCanvas(type, SMALL, SMALL, opts(S));
  const down = flatten(full, SMALL), direct = flatten(small, SMALL);
  const detail = meanDiff(lum(down), lum(direct));
  const d128 = lum(flatten(down, 128));
  const structure = meanDiff(d128, lum(flatten(direct, 128)));
  // structure as a share of the texture's own contrast: the verdict uses this
  const relative = 100 * structure / Math.max(0.5, spread(d128));
  rows.push({ type, structure, relative, detail, ms: Date.now() - t0 });
  if(IMG){
    const side = createCanvas(SMALL*2 + 8, SMALL), x = side.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, side.width, SMALL);
    x.drawImage(down, 0, 0); x.drawImage(direct, SMALL + 8, 0);
    writeFileSync(`${IMG}/${type}.png`, side.toBuffer('image/png'));
  }
  T.clearTextureCache();
}
rows.sort((a, b) => b.relative - a.relative);
// judged by RELATIVE structure: the difference as a share of the texture's contrast
const verdict = r => r <= 10 ? 'fine' : r <= 25 ? 'close' : 'needs work';
console.log(`scale audit: ${FULL}px scaled down  vs  ${SMALL}px direct (S = ${S.toFixed(3)}), seed ${SEED}, knobs at ${KNOBS}\n`);
console.log('texture'.padEnd(16) + 'relative'.padStart(9) + 'structure'.padStart(11) + 'detail'.padStart(9) + '   verdict');
for(const r of rows) console.log(r.type.padEnd(16) + (r.relative.toFixed(0) + '%').padStart(9) + r.structure.toFixed(1).padStart(11) + r.detail.toFixed(1).padStart(9) + '   ' + verdict(r.relative));
const counts = rows.reduce((m, r) => (m[verdict(r.relative)] = (m[verdict(r.relative)] || 0) + 1, m), {});
console.log(`\n${rows.length} textures: ${counts.fine || 0} fine, ${counts.close || 0} close, ${counts['needs work'] || 0} need work`);
