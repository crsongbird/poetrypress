/**
 * stepsGrass.js — GRASS BLADES: a field of grass seen across the land, blade by blade, leaning with one wind and bent
 * further where its gusts pass (docs/prior-art/cel-shaded.md §8, Windswept Hills).
 *
 * How it gets its look (the doc's sources):
 *   - each blade a curve that tapers to its tip (cubic Bézier blades: Rademan after Ghost of Tsushima), drawn in two
 *     flat tones, the root's and the tip's, as toon grass is (no gradient: a cel band);
 *   - blades in CLUMPS that share their height, lean and hue (Voronoi clumps, ibid.), so the field is never even;
 *   - one wind, its strength varied across the field by a slow noise (Ghost of Tsushima: "you can see gusts of winds
 *     blow through"); where a gust passes, the blades bend over and their tops catch the light (Thoreau, 1852: "the
 *     bent blades (horizontal tops) of rank grass in the meadows"), the pale waves that cross a field in wind;
 *   - perspective: blades shrink toward the horizon and, too small to draw, become the field's own colour.
 * Outputs maps for general parts: picture (albedo), mask, height (tips stand above roots), sheen (where gusts bend
 * blades over: the light they catch).
 *
 * Haiku: / the wind is not seen — / only where the grass bows down / a paler green runs /
 */
import { mulberry32 } from './texCore.js';

const GR_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const grClamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const grMix = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
const grCss = c => `rgb(${Math.round(grClamp(c[0])*255)},${Math.round(grClamp(c[1])*255)},${Math.round(grClamp(c[2])*255)})`;
/** A smooth value noise (bilinear over a hashed lattice): the clumps' and the field's slow variation. */
function grNoise(seed){
  const h = (x, y) => { let t = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519); t = Math.imul(t ^ (t >>> 13), 1274126177); return ((t ^ (t >>> 16)) >>> 0)/4294967296; };
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, su = u*u*(3 - 2*u), sv = v*v*(3 - 2*v);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1); return a + (b - a)*su + (c - a)*sv + (a - b - c + d)*su*sv; };
}

/**
 * The field on a w×h grid. o: { where (Float32Array or null), wind (Float32Array or null), root, tip, sheen (rgb 0–1),
 * count, height, horizon, lean, bend, clumps, variety (0–1), unit, seed }. Returns { pic (canvas), mask, height, sheen }.
 */
export function genGrass(w, h, o){
  const N = w*h, R = mulberry32(o.seed >>> 0), noise = grNoise(o.seed % 100003), noise2 = grNoise((o.seed + 7919) % 100003);
  const M = o.where, Wd = o.wind, at = (F, x, y, d) => F ? F[Math.min(h - 1, Math.max(0, y | 0))*w + Math.min(w - 1, Math.max(0, x | 0))] : d;
  const hz = o.horizon, depth = y => grClamp((y/h - hz)/Math.max(0.05, 1 - hz));
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true });
  const sc = document.createElement('canvas'); sc.width = w; sc.height = h; const s = sc.getContext('2d', { willReadFrequently: true });
  const mc = document.createElement('canvas'); mc.width = w; mc.height = h; const m = mc.getContext('2d', { willReadFrequently: true });
  // (the picture's ground is the field's own colour, so a blade's soft edge never darkens into black; the mask says where)
  g.fillStyle = grCss(grMix(o.root, o.tip, 0.4)); g.fillRect(0, 0, w, h); s.fillStyle = '#000'; s.fillRect(0, 0, w, h); m.fillStyle = '#000'; m.fillRect(0, 0, w, h);
  // the field's own colour under the blades: the root's darkening into the tip's toward the horizon (far blades blur
  // into one tone), varied slowly as the clumps are
  { const im = g.getImageData(0, 0, w, h), d = im.data, cs = o.unit*0.05*(0.4 + o.clumps*1.6);
    for(let y = 0; y < h; y++){ const dp = depth(y), base = 0.62 - 0.32*dp;
      for(let x = 0; x < w; x++){ const q = y*w + x; if(M && M[q] < 0.5) continue; const v = noise(x/(cs*(0.3 + dp)), y/(cs*0.35*(0.3 + dp)));
        const col = grMix(o.root, o.tip, grClamp(base + (v - 0.5)*o.variety*0.6)); d[q*4] = col[0]*255; d[q*4 + 1] = col[1]*255; d[q*4 + 2] = col[2]*255; } }
    g.putImageData(im, 0, 0); }
  // the blades, far rows first so the near ones stand over them
  const L0 = o.unit*0.26*o.height, lean = o.lean, minL = Math.max(1.2, o.unit*0.006), rowStep = d => Math.max(1, o.unit*(0.003 + 0.016*d*d)/(0.35 + o.count*1.3));
  for(let y = Math.max(0, Math.floor(hz*h)); y < h + L0*0.55; ){
    const d = depth(y), len0 = L0*(0.12 + 0.88*d*d); const dy = rowStep(d);
    if(len0 >= minL){ const dx = dy*1.1;
      for(let x = -len0*0.3 + R()*dx; x < w + len0*0.3; x += dx*(0.6 + R()*0.8)){
        const yy = y + (R() - 0.5)*dy; if(at(M, x, yy, 1) < 0.5) continue;
        // its clump: height, lean and hue shared with its neighbours
        const cs = o.unit*0.035*(0.4 + o.clumps*2)*(0.35 + d), cv = noise(x/cs, yy/(cs*0.45)), cv2 = noise2(x/cs, yy/(cs*0.45));
        const gust = grClamp(at(Wd, x, yy, 0)), L = len0*(0.7 + 0.6*cv)*(0.85 + R()*0.3)*(1 - gust*o.bend*0.25);
        const a = -Math.PI/2 + lean + (cv2 - 0.5)*0.5 + (R() - 0.5)*0.35 + gust*o.bend*0.9*Math.sign(lean || 0.0001), wb = L*(0.08 + R()*0.05);
        const tx = x + Math.cos(a)*L, ty = yy + Math.sin(a)*L, mx = x + (tx - x)*0.22, my = yy - L*0.55;   // (upright at the root, bowing toward its tip)
        const nx = -Math.sin(a), ny = Math.cos(a);
        const blade = (k, w0, cx = g) => { const bx = x + (tx - x)*k, by = yy + (ty - yy)*k, cx2 = mx + (tx - mx)*k*0.5, cy2 = my + (ty - my)*k*0.5;
          cx.beginPath(); cx.moveTo(bx - nx*w0, by - ny*w0); cx.quadraticCurveTo(cx2 - nx*w0*0.6, cy2 - ny*w0*0.6, tx, ty); cx.quadraticCurveTo(cx2 + nx*w0*0.6, cy2 + ny*w0*0.6, bx + nx*w0, by + ny*w0); cx.closePath(); };
        const hueShift = (cv2 - 0.5)*o.variety*0.5, root = grMix(o.root, o.tip, grClamp(0.08 + hueShift*0.4)), tip = grMix(grMix(o.tip, o.root, grClamp(-hueShift)), o.sheen, grClamp(gust*o.bend*1.1));
        // two flat tones: the root's, then the tip's over its upper part
        blade(0, wb); g.fillStyle = grCss(root); g.fill(); blade(0, wb, m); m.fillStyle = '#fff'; m.fill();
        blade(0.42 + 0.1*cv, wb*0.62); g.fillStyle = grCss(tip); g.fill();
        if(gust*o.bend > 0.08){ const v = Math.round(grClamp(gust*o.bend*1.4)*255); s.fillStyle = `rgb(${v},${v},${v})`; s.beginPath(); s.moveTo(x + (tx - x)*0.45, yy + (ty - yy)*0.45); s.lineTo(tx, ty); s.lineWidth = wb*1.2; s.strokeStyle = s.fillStyle; s.stroke(); }
      } }
    y += dy;
  }
  // height: the land low, each blade higher toward its tip (its light tone stands above its dark)
  const pd = g.getImageData(0, 0, w, h).data, sd = s.getImageData(0, 0, w, h).data, md = m.getImageData(0, 0, w, h).data, mask = new Float32Array(N), height = new Float32Array(N), sheen = new Float32Array(N);
  const lr = 0.299*o.root[0] + 0.587*o.root[1] + 0.114*o.root[2], lt = 0.299*o.tip[0] + 0.587*o.tip[1] + 0.114*o.tip[2], span = Math.abs(lt - lr) > 0.03 ? lt - lr : 0.1;
  for(let q = 0; q < N; q++){ const cover = Math.max(md[q*4]/255, M ? (M[q] >= 0.5 ? 1 : 0) : 1); mask[q] = cover;
    if(cover <= 0) continue; const l = (0.299*pd[q*4] + 0.587*pd[q*4 + 1] + 0.114*pd[q*4 + 2])/255; height[q] = grClamp(0.35 + 0.45*(l - lr)/span); sheen[q] = sd[q*4]/255; }
  return { pic: c, mask, height, sheen };
}

export const GRASS_STEPS = {
  // GRASS BLADES: a field of grass blade by blade, in two flat tones, leaning with one wind and bowed where its gusts pass
  grass: { cat: 'Marks', label: 'Grass Blades', ins: ['where', 'wind', 'root hue', 'tip hue', 'sheen hue'], outs: ['picture', 'mask', 'height', 'sheen'],
    io: { ins: ['field', 'field', 'colour', 'colour', 'colour'], outs: ['image', 'field', 'field', 'field'] }, cost: () => 4,
    params: [GR_R('count', 'Density', 50), GR_R('height', 'Blade Length', 45), GR_R('horizon', 'Horizon', 40), GR_R('lean', 'Lean', 62), GR_R('bend', 'Gusts Bend', 55),
      GR_R('clumps', 'Clumps', 45), GR_R('variety', 'Hue Variety', 40), GR_R('variation', 'Variation', 0, 0, 99)],
    run(E, n){ const { ww, wh, num, input, asField } = E;
      const hue = (j, d) => { const v = input(n, j); return Array.isArray(v) && !v.none ? [v[0], v[1], v[2]] : d; };
      const o = { where: asField(input(n, 1)), wind: asField(input(n, 2)), root: hue(3, [0.24, 0.42, 0.18]), tip: hue(4, [0.55, 0.74, 0.3]), sheen: hue(5, [0.86, 0.92, 0.62]),
        count: num(n, 'count', 50)/100, height: num(n, 'height', 45)/100, horizon: num(n, 'horizon', 40)/100, lean: (num(n, 'lean', 62) - 50)/50*1.0, bend: num(n, 'bend', 55)/100,
        clumps: num(n, 'clumps', 45)/100, variety: num(n, 'variety', 40)/100, unit: E.unit, seed: ((((E.ctx.seed >>> 0) + Math.round(num(n, 'variation', 0))*7919) >>> 0) ^ 0x6a55) >>> 0 };
      const r = genGrass(ww, wh, o);
      return [E.readCanvas(r.pic), r.mask, r.height, r.sheen]; } },
};
