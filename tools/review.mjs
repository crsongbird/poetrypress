/**
 * tools/review.mjs — the standard sheet for Ruby's review of a new or changed surface, the same every round.
 *
 *   Four rows, one surface per sheet:
 *     the four readings (🜂 🜄 🜁 🜃), the default marked;
 *     four seeds of the default reading (the variety the seed gives);
 *     the light dial turned round (0°, 90°, 180°, 270°: a surface lit from its maps follows it);
 *     the camera moved (turn, view, zoom), when the surface has a camera dial.
 *   With --ref, a fifth row above them: the readings as an older version of the code drew them (before / after).
 *
 *   npm install --no-save @napi-rs/canvas      (once)
 *   node tools/review.mjs meadow                         review/meadow.png
 *   node tools/review.mjs meadow,macro --ref HEAD~3      with the older readings on top
 *   node tools/review.mjs meadow --size 320 --out /tmp/r
 *
 * Haiku: / four ways to see it — / turn the light, move the eye, change the seed: / the surface holds /
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
if(!types.length){ console.log('usage: node tools/review.mjs <surface>[,<surface>…] [--ref <git ref>] [--size 288] [--out review]'); process.exit(1); }
const REF = arg('--ref', null), SIZE = +arg('--size', 288), OUT = arg('--out', 'review'), GEN = SIZE*2;
const root = resolve(new URL('..', import.meta.url).pathname);
const load = async dir => ({ T: await import(pathToFileURL(join(dir, 'textureGenerators.js')).href), E: await import(pathToFileURL(join(dir, 'textureElements.js')).href) });
const now = await load(root);
let before = null;
if(REF){
  const old = mkdtempSync(join(tmpdir(), 'vellum-ref-'));
  execSync(`git archive ${REF} | tar -x -C ${old}`, { cwd: root, stdio: ['ignore', 'ignore', 'inherit'], shell: '/bin/sh' });
  if(existsSync(join(root, 'node_modules'))) symlinkSync(join(root, 'node_modules'), join(old, 'node_modules'));
  before = await load(old);
}

const backFor = b => /multiply|darken|burn/.test(b) ? '#EEE4D2' : /screen|lighten|dodge/.test(b) ? '#100E16' : /overlay|soft|hard/.test(b) ? '#6A3A4E' : '#1A1720';
function readings({ E, T }, type){
  const el = (E.TEXTURE_ELEMENTS || {})[type] || {}, defs = T.paramsFor(type);
  return ['fire', 'water', 'wind', 'earth'].map(k => {
    const r = el[k] || {};
    return { name: (r.name || k) + (el.def === k ? ' ●' : ''), def: el.def === k, knobs: defs.map((d, i) => r.k && r.k[i] != null ? r.k[i] : d.def),
      tints: r.t || [], blend: r.blend, light: r.light || [315, 100], seed: 4242, camera: null };
  });
}
function draw({ T }, type, rd){
  const caps = T.capsFor(type), blend = rd.blend && caps.blends.includes(rd.blend) ? rd.blend : caps.blends[0], k = rd.knobs;
  const o = { accent1: '#E07A8A', accent2: '#7A8AE8', seed: rd.seed, light: rd.light[0], lightTilt: rd.light[1], tint1: rd.tints[0] || null, tint2: rd.tints[1] || null, blend,
    ...Object.fromEntries(k.map((v, i) => ['p' + (i + 1), v])), ...(rd.camera ? { camera: rd.camera } : {}) };
  const page = createCanvas(GEN, GEN), c = page.getContext('2d');
  c.fillStyle = backFor(blend); c.fillRect(0, 0, GEN, GEN);
  if(T.clearTextureCache) T.clearTextureCache();   // (each drawn afresh, so its time is its own)
  const t0 = performance.now();
  c.globalCompositeOperation = blend; c.drawImage(T.getTextureCanvas(type, GEN, GEN, o), 0, 0);
  const ms = performance.now() - t0, v = createCanvas(SIZE, SIZE); v.getContext('2d').drawImage(page, 0, 0, SIZE, SIZE);
  return { canvas: v, ms };
}

mkdirSync(OUT, { recursive: true });
for(const type of types){
  const caps = now.T.capsFor(type), rds = readings(now, type), main = rds.find(r => r.def) || rds[0];
  const cam = caps.camera || null;
  const rows = [];
  if(before) rows.push([`readings, ${REF}`, readings(before, type).map(rd => ({ label: rd.name, tree: before, rd }))]);
  rows.push(['the four readings', rds.map(rd => ({ label: rd.name, tree: now, rd }))]);
  rows.push(['four seeds', [4242, 17, 90210, 31337].map(seed => ({ label: 'seed ' + seed, tree: now, rd: { ...main, seed } }))]);
  rows.push(['the light turned', [0, 90, 180, 270].map(a => ({ label: `light ${a}°`, tree: now, rd: { ...main, light: [a, main.light[1]] } }))]);
  if(cam) rows.push(['the camera moved', [{ turn: 0, view: cam.view ?? 0, zoom: 100 }, { turn: 90, view: cam.view ?? 0, zoom: 100 }, { turn: cam.turn ?? 0, view: 60, zoom: 100 }, { turn: cam.turn ?? 0, view: cam.view ?? 0, zoom: 200 }]
    .map(c => ({ label: `turn ${c.turn}° view ${c.view} zoom ${c.zoom}%`, tree: now, rd: { ...main, camera: c } }))]);
  const PAD = 10, LAB = 24, HEAD = 40, W = 4*(SIZE + PAD) + PAD, H = HEAD + rows.length*(SIZE + LAB + 22) + PAD;
  const sheet = createCanvas(W, H), s = sheet.getContext('2d');
  s.fillStyle = '#0D0B10'; s.fillRect(0, 0, W, H);
  s.fillStyle = '#EDE3E6'; s.font = '600 20px sans-serif'; s.fillText(`${type} — ${main.name.replace(' ●', '')} is the default (●)`, PAD, 27);
  rows.forEach(([title, cells], ri) => {
    const y = HEAD + ri*(SIZE + LAB + 22);
    s.fillStyle = '#B7A9B0'; s.font = '600 14px sans-serif'; s.fillText(title, PAD, y + 14);
    cells.forEach((cell, i) => {
      const x = PAD + i*(SIZE + PAD);
      let out; try { out = draw(cell.tree, type, cell.rd); } catch(e){ s.fillStyle = '#E06070'; s.font = '13px sans-serif'; s.fillText('could not draw: ' + e.message.slice(0, 40), x, y + 60); return; }
      s.drawImage(out.canvas, x, y + 20);
      s.fillStyle = '#EDE3E6'; s.font = '13px sans-serif'; s.fillText(`${cell.label} · ${Math.round(out.ms)} ms`, x + 2, y + 20 + SIZE + 16);
    });
  });
  writeFileSync(join(OUT, type + '.png'), sheet.toBuffer('image/png'));
  console.log('wrote', join(OUT, type + '.png'));
}
