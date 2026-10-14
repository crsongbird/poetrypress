/**
 * tools/compare.mjs — before and after, for Ruby's approval.
 *
 * Ruby: a texture may be REPLACED by a better or faster method, when Ruby
 * approves the change from test renders. This makes those renders: each
 * texture's four readings (🜂 🜄 🜁 🜃), drawn by an older version of the code
 * (a git ref) above, and by the working tree below, with how long each took
 * and how much changed.
 *
 *   npm install --no-save @napi-rs/canvas      (once)
 *   node tools/compare.mjs stainedglass,linen                 HEAD vs the working tree
 *   node tools/compare.mjs wax --ref 10c9b46 --size 512       an older release
 *   node tools/compare.mjs wax --out /tmp/compare             where the sheets go (default compare/)
 *
 * Sheets are PNGs named <texture>.png. The timing is single-threaded Node on
 * this machine: compare the two rows, not the numbers with a phone.
 */
import { createCanvas, Path2D as P2 } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync, mkdtempSync, symlinkSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
globalThis.Path2D = P2;
globalThis.document = { createElement: () => createCanvas(1, 1) };

const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : process.argv[i + 1]; };
const types = (process.argv[2] || '').split(',').filter(t => t && !t.startsWith('--'));
if(!types.length){ console.log('usage: node tools/compare.mjs <texture>[,<texture>…] [--ref HEAD] [--size 384] [--out compare]'); process.exit(1); }
const REF = arg('--ref', 'HEAD'), SIZE = +arg('--size', 384), OUT = arg('--out', 'compare'), GEN = SIZE*2;
const root = resolve(new URL('..', import.meta.url).pathname);

// the older code, unpacked beside the newer (its node_modules borrowed)
const old = mkdtempSync(join(tmpdir(), 'vellum-ref-'));
execSync(`git archive ${REF} | tar -x -C ${old}`, { cwd: root, stdio: ['ignore', 'ignore', 'inherit'], shell: '/bin/sh' });
if(existsSync(join(root, 'node_modules'))) symlinkSync(join(root, 'node_modules'), join(old, 'node_modules'));
const load = async dir => ({
  T: await import(pathToFileURL(join(dir, 'textureGenerators.js')).href),
  E: await import(pathToFileURL(join(dir, 'textureElements.js')).href),
});
const trees = [[`${REF}`, await load(old)], ['working tree', await load(root)]];

const backFor = b => /multiply|darken|burn/.test(b) ? '#EEE4D2' : /screen|lighten|dodge/.test(b) ? '#100E16' : /overlay|soft|hard/.test(b) ? '#6A3A4E' : '#1A1720';
function readings(E, T, type){
  const el = (E.TEXTURE_ELEMENTS || {})[type] || {}, defs = T.paramsFor(type);
  return ['fire', 'water', 'wind', 'earth'].map(k => {
    const r = el[k] || {}, isDef = el.def === k;
    const knobs = defs.map((d, i) => r.k && r.k[i] != null ? r.k[i] : d.def);
    return { name: (r.name || k) + (isDef ? ' (default)' : ''), knobs, tints: r.t || [], blend: r.blend, light: r.light || [315, 100] };
  });
}
function draw(T, type, rd){
  const caps = T.capsFor(type), blend = rd.blend && caps.blends.includes(rd.blend) ? rd.blend : caps.blends[0];
  const k = rd.knobs, o = { accent1: '#E07A8A', accent2: '#7A8AE8', seed: 4242, p1: k[0], p2: k[1], p3: k[2], p4: k[3], p5: k[4], p6: k[5],
    light: rd.light[0], lightTilt: rd.light[1], tint1: rd.tints[0] || null, tint2: rd.tints[1] || null, blend };
  const page = createCanvas(GEN, GEN), c = page.getContext('2d');
  c.fillStyle = backFor(blend); c.fillRect(0, 0, GEN, GEN);
  const t0 = performance.now();
  const layers = type === 'astral' ? [['astral_fog', { ...o, p1: k[1] }, 'overlay'], ['astral_stars', o, 'screen']] : [[type, o, blend]];
  for(const [t, oo, b] of layers){ const tex = T.getTextureCanvas(t, GEN, GEN, oo); c.globalCompositeOperation = b; c.drawImage(tex, 0, 0); }
  const ms = performance.now() - t0;
  const v = createCanvas(SIZE, SIZE); v.getContext('2d').drawImage(page, 0, 0, SIZE, SIZE);
  return { canvas: v, ms };
}
const diff = (a, b) => { const A = a.getContext('2d').getImageData(0, 0, SIZE, SIZE).data, B = b.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
  let s = 0; for(let i = 0; i < A.length; i += 4) s += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]); return s/(SIZE*SIZE*3*255)*100; };

mkdirSync(OUT, { recursive: true });
for(const type of types){
  const PAD = 10, LAB = 40, W = 4*(SIZE + PAD) + PAD + 150, H = 2*(SIZE + LAB) + PAD*3 + 40;
  const sheet = createCanvas(W, H), s = sheet.getContext('2d');
  s.fillStyle = '#0D0B10'; s.fillRect(0, 0, W, H);
  s.fillStyle = '#EDE3E6'; s.font = '600 22px sans-serif'; s.fillText(`${type} — above: ${REF}, below: the working tree`, PAD, 28);
  const rows = trees.map(([label, { T, E }]) => {
    try { return readings(E, T, type).map(rd => ({ rd, ...draw(T, type, rd) })); } catch(e){ return { error: e.message }; }
  });
  rows.forEach((row, ri) => {
    const y = 40 + PAD + ri*(SIZE + LAB + PAD);
    s.fillStyle = '#B7A9B0'; s.font = '15px sans-serif'; s.fillText(trees[ri][0], W - 145, y + 20);
    if(row.error){ s.fillStyle = '#E06070'; s.fillText('could not draw: ' + row.error.slice(0, 90), PAD, y + 30); return; }
    let total = 0;
    row.forEach((t, i) => { const x = PAD + i*(SIZE + PAD); s.drawImage(t.canvas, x, y); total += t.ms;
      s.fillStyle = '#EDE3E6'; s.font = '14px sans-serif'; s.fillText(`${t.rd.name} · ${Math.round(t.ms)} ms`, x + 2, y + SIZE + 16);
      if(ri === 1 && !rows[0].error){ const d = diff(rows[0][i].canvas, t.canvas); s.fillStyle = d < 0.05 ? '#7CC08A' : '#E8B86A'; s.fillText(d < 0.05 ? 'identical' : `${d.toFixed(1)}% changed`, x + 2, y + SIZE + 32); } });
    s.fillStyle = '#B7A9B0'; s.fillText(`${Math.round(total)} ms in all`, W - 145, y + 42);
  });
  writeFileSync(join(OUT, type + '.png'), sheet.toBuffer('image/png'));
  console.log('wrote', join(OUT, type + '.png'));
}
