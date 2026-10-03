/**
 * tools/texture-gallery.mjs — look at the textures, don't just test them.
 *
 * Renders every texture (or the ones named) on four backgrounds — dark, light,
 * a complementary deep teal and a contrasting terracotta — with its own
 * default blend and knobs, one sheet per texture, so each can be judged by eye.
 * Deep Field is drawn as the renderer draws it: nebula, then stars.
 *
 * Run only when a visual review is asked for:
 *   npm install @napi-rs/canvas                     (once)
 *   node tools/texture-gallery.mjs                  every texture → gallery/
 *   node tools/texture-gallery.mjs --only moon,linen --size 512 --seed 7 --out /tmp/g
 *   node tools/texture-gallery.mjs --knobs min       (or max: sliders at their ends)
 */
import { createCanvas, Path2D as P2 } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'fs';
globalThis.Path2D = P2;
globalThis.document = { createElement: () => createCanvas(1, 1) };
const T = await import(new URL('../textureGenerators.js', import.meta.url));

const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : process.argv[i + 1]; };
const SIZE = +arg('--size', 384), SEED = +arg('--seed', 4242), OUT = arg('--out', 'gallery'), ONLY = arg('--only', null), KNOBS = arg('--knobs', 'def');
const RES = SIZE * 2;                                       // render at twice the panel size, shown scaled
const BACKS = [['dark', '#15131c'], ['light', '#f1ebe0'], ['complementary', '#2e5e6b'], ['contrasting', '#c8553d']];
mkdirSync(OUT, { recursive: true });

const types = ONLY ? ONLY.split(',') : Object.keys(T.TEXTURE_PARAMS);
for(const type of types){
  const defs = T.paramsFor(type), caps = T.capsFor(type);
  const knob = i => defs[i] ? defs[i][KNOBS] : null;
  const opts = { accent1: '#d9a6b3', accent2: '#9B7FE8', seed: SEED, p1: knob(0), p2: knob(1), p3: knob(2), light: 315, blend: caps.blends[0] };
  const layers = type === 'astral'
    ? [['astral_fog', { ...opts, p1: knob(1), p3: knob(2) }, 'overlay'], ['astral_stars', { ...opts, p1: knob(0), p3: knob(2) }, 'screen']]
    : [[type, opts, caps.blends[0]]];
  const sheet = createCanvas(BACKS.length * (SIZE + 8) - 8, SIZE + 26), sx = sheet.getContext('2d');
  sx.fillStyle = '#0b0b0e'; sx.fillRect(0, 0, sheet.width, sheet.height);
  BACKS.forEach(([name, col], i) => {
    const page = createCanvas(RES, RES), px = page.getContext('2d');
    px.fillStyle = col; px.fillRect(0, 0, RES, RES);
    for(const [t, o, blend] of layers){
      const tex = T.getTextureCanvas(t, RES, RES, o);
      px.globalCompositeOperation = blend === 'source-over' ? 'source-over' : blend; px.globalAlpha = 0.9;
      px.drawImage(tex, 0, 0); px.globalCompositeOperation = 'source-over'; px.globalAlpha = 1;
    }
    sx.drawImage(page, i * (SIZE + 8), 0, SIZE, SIZE);
    sx.fillStyle = '#bbb'; sx.font = '13px sans-serif'; sx.fillText(`${type} · ${name} · ${caps.blends[0]}`, i * (SIZE + 8) + 4, SIZE + 17);
  });
  writeFileSync(`${OUT}/${type}.png`, sheet.toBuffer('image/png'));
  T.clearTextureCache();
  console.log(`${OUT}/${type}.png`);
}
