/**
 * tools/look.mjs — render textures with a REAL canvas, to look at them.
 *
 * The test canvas records geometry, not pixels, so it cannot tell you what a
 * texture looks like. This can. Every texture problem that survived several
 * rounds (lotuses reading as daisies, the Rorschach going black) was visible
 * in one image the moment this existed.
 *
 *   npm install @napi-rs/canvas          (once; prebuilt, no compiler needed)
 *   node tools/look.mjs '[{"type":"moon","seed":11},{"type":"wax","bg":"#F0E6D2"}]' out.png 4
 *
 * Each item: type, and optionally label, bg, opacity, blend, p1, p2, seed,
 * light, tint1, a1, a2. Textures are generated at 1536px — counts depend on
 * real page size, so small renders are unrepresentative — then scaled down.
 */
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
globalThis.document = { createElement: () => createCanvas(1, 1) };
const T = await import(new URL('../textureGenerators.js', import.meta.url));
const GEN = 1536, VIEW = 300;       // generate large, view small — counts depend on real size
async function tile(o){
  const caps = T.capsFor(o.type), blend = o.blend || caps.blends[0];
  const tex = T.getTextureCanvas(o.type, GEN, GEN, { accent1: o.a1||'#d9a6b3', accent2: o.a2||'#9B7FE8', seed: o.seed||4242, p1: o.p1, p2: o.p2, light: o.light||315, tint1: o.tint1||null, blend });
  const page = createCanvas(GEN, GEN), c = page.getContext('2d');
  c.fillStyle = o.bg || '#1d1a1a'; c.fillRect(0,0,GEN,GEN);
  c.globalCompositeOperation = blend; c.globalAlpha = o.opacity ?? 0.8; c.drawImage(tex,0,0);
  const v = createCanvas(VIEW, VIEW); v.getContext('2d').drawImage(page,0,0,VIEW,VIEW); return v;
}
const items = JSON.parse(process.argv[2]);
const cols = +process.argv[4] || 4, rows = Math.ceil(items.length/cols);
const out = createCanvas(cols*(VIEW+8), rows*(VIEW+24)), o = out.getContext('2d');
o.fillStyle='#0b0b0b'; o.fillRect(0,0,out.width,out.height);
for(let i=0;i<items.length;i++){
  const t = await tile(items[i]), x=(i%cols)*(VIEW+8), y=Math.floor(i/cols)*(VIEW+24);
  o.drawImage(t,x,y); o.fillStyle='#ddd'; o.font='13px sans-serif'; o.fillText(items[i].label||items[i].type, x+4, y+VIEW+16);
}
writeFileSync(process.argv[3], out.toBuffer('image/png'));
