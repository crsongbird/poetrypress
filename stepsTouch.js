/**
 * stepsTouch.js — steps for 🜚 Touch surfaces (part of the steps library:
 * steps.js gathers them). Linen is made of the first two; Stained Glass of
 * PANES → GLASS; Scattered Polygons of FLAKES (below the weave):
 *
 *   weave   a woven cloth as a NORMAL MAP, lit by the dial: its shade and
 *           its sheen (silk → twill → linen → canvas → burlap)
 *   cloth   the cloth coloured (Fabric Hue, Light Hue) and its DETAILS laid
 *           on it as heights, lit: seams, stitching, slubs, buttons, rivets
 *
 * Each a step like any other: the Athanor offers them, and Linen is the chain
 * weave → cloth → surface (chains.js).
 */
import { drawStitch, pathFromPoints } from './stitches.js';
import { CPU, wordsRoom, lightBasis, lightSparse, lightHeights, lightVec, makeNoiseGrid, sampleNoiseGrid, parseHex, cpx, mulberry32, kitPicture, kitCanvas, fbmSampler, withSeed, kitWhole, wholeDial, wholeHex, wholeZoom, wholeAmt, wholeShare, wholeCam, wholeTurned } from './texCore.js';
import { genColdPress, genCupRing, genOldPaper, genBurntLetter, genHoarfrost, genGlassRain, genWater, genDunes, genMoss, genKintsugi, genSpangle, genCrystalLeaf, genSuminagashi } from './texTouch.js';

const TOUCH_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];

// Weave keyframes: silk → twill → linen → canvas → burlap
//   pitch   thread spacing (of the page)   tw     thread width (of the pitch)
//   slub    how lumpy threads are           sheen  silk's highlight
//   pattern 0 satin floats · 1 twill · 2 plain     fuzz   burlap's hairs
export const WEAVES = [
  // pitch varies only a little: SCALE zooms; WEAVE changes the cloth itself
  { at:0.00, pitch:0.0060, tw:0.97, slub:0.03, sheen:1.0, pattern:0, fuzz:0.00, round:0.55 },  // silk: satin floats, flat & glossy
  { at:0.25, pitch:0.0062, tw:0.92, slub:0.10, sheen:0.4, pattern:1, fuzz:0.05, round:0.8 },   // twill: diagonal ribs
  { at:0.50, pitch:0.0066, tw:0.84, slub:0.45, sheen:0.15,pattern:2, fuzz:0.12, round:1.0 },   // linen: plain, slubby
  { at:0.75, pitch:0.0074, tw:0.93, slub:0.18, sheen:0.08,pattern:2, fuzz:0.18, round:1.15 },  // canvas: plain, tight, round
  { at:1.00, pitch:0.0090, tw:0.62, slub:0.60, sheen:0.0, pattern:2, fuzz:0.6,  round:1.3 },   // burlap: open, hairy
];
export function weaveAt(f){
  f=Math.max(0,Math.min(1,f)); let i=0; while(i<WEAVES.length-2 && f>WEAVES[i+1].at) i++;
  const a=WEAVES[i], b=WEAVES[i+1], t=(f-a.at)/(b.at-a.at), o={};
  for(const k of Object.keys(a)) o[k]=a[k]+(b[k]-a[k])*t;
  // the over-under pattern is BLENDED, not switched: both are shaded and mixed
  // (at a keyframe only its own: half the work)
  o.patA=a.pattern; o.patB=b.pattern; o.mix=t;
  if(t>0.999){ o.patA=o.patB=b.pattern; o.mix=0; } else if(t<0.001){ o.patB=a.pattern; o.mix=0; }
  return o;
}
/** The working grid Linen needs: threads at least ~3 pixels apart (finer
 *  aliases into moiré), never finer than the export's grid, never coarser
 *  than the canvas. A preview no longer pays the export's price. */
export function weaveGridDiv(w, h, S, zoom){
  const fine = 2*S, coarse = Math.max(fine, 1);
  return Math.max(fine, Math.min(coarse, Math.min(w, h)*WEAVES[0].pitch*zoom/3.2));
}

// WATERCOLOR, in two parts (Watercolor Wash, texTouch genWatercolour until now). WASHES lays the pigment's
// shapes after Tyler Hobbs's method: a polygon deformed by recursive midpoint displacement, drawn forty times
// over at a few percent, each copy deformed again — two layers, one per pigment, as densities 0..1.
function touchWashes(ww, wh, amt, zoom, wet){
  const unit = Math.min(ww, wh), N = ww*wh;
  const gauss = () => { let u = 0, v = 0; while(!u) u = Math.random(); while(!v) v = Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  const deform = (poly, depth, vs) => { let P = poly;
    for(let d = 0; d < depth; d++){ const Q = [];
      for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        Q.push(a); Q.push([(a[0] + b[0])/2 + gauss()*len*a[2]*vs, (a[1] + b[1])/2 + gauss()*len*a[2]*vs, a[2]*(0.85 + Math.random()*0.3)]); }
      P = Q; }
    return P; };
  const layers = [document.createElement('canvas'), document.createElement('canvas')];
  const lx = layers.map(c => { c.width = ww; c.height = wh; const x = c.getContext('2d', CPU); x.fillStyle = '#000'; return x; });
  const nB = Math.max(3, Math.round((4 + Math.random()*3)*(ww*wh)/(unit*unit)/zoom));
  const LAY = Math.round((30 + wet*14)*(0.75 + 0.25*Math.min(2.5, amt))), alpha = Math.min(0.1, 0.024*Math.sqrt(amt)*(1.15 - wet*0.3));   // more pigment: more, and denser, layers
  for(let b = 0; b < nB; b++){
    // the first is a broad, pale ground wash; the rest are passages laid over it
    const ground = b === 0, cx = ground ? ww*(0.3 + Math.random()*0.4) : Math.random()*ww, cy = ground ? wh*(0.3 + Math.random()*0.4) : Math.random()*wh;
    const R = unit*zoom*(ground ? 0.6 + Math.random()*0.2 : 0.2*(0.55 + Math.random()*0.8)), k = Math.random() < 0.62 ? 0 : 1;
    const sides = 10, base = [], sq = 0.7 + Math.random()*0.3;
    for(let s = 0; s < sides; s++){ const a = s/sides*Math.PI*2, rr = R*(0.85 + Math.random()*0.3); base.push([cx + Math.cos(a)*rr, cy + Math.sin(a)*rr*sq, 0.5 + Math.random()*0.9]); }
    const shape = deform(base, 3, 0.2), ctx = lx[k]; ctx.globalAlpha = ground ? alpha*0.45 : alpha;
    for(let l = 0; l < LAY; l++){ const P = deform(shape, 3, 0.07 + wet*0.2);
      ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for(let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.closePath(); ctx.fill(); }
  }
  return lx.map(ctx => { const d = ctx.getImageData(0, 0, ww, wh).data, D = new Float32Array(N); for(let i = 0; i < N; i++) D[i] = d[i*4 + 3]/255; return D; });
}
// PIGMENT lays any density (a gray map) on a picture as watercolor does on paper (Curtis et al., "Computer-Generated
// Watercolor"): EDGE DARKENING (pigment drifts to a drying edge), GRANULATION (it settles in the paper's tooth), an
// uneven load, and a GRADED WASH (it runs downhill: the dial). It mixes subtractively with what is under it.
function touchPigment(D, img, ww, wh, col, wet, light){
  const unit = Math.min(ww, wh), N = ww*wh;
  const blurF = (S, r) => { const T = new Float32Array(N), O = new Float32Array(N), n = 2*r + 1;
    for(let y = 0; y < wh; y++){ let s = 0; for(let x = -r; x <= r; x++) s += S[y*ww + Math.min(ww - 1, Math.max(0, x))];
      for(let x = 0; x < ww; x++){ T[y*ww + x] = s/n; s += S[y*ww + Math.min(ww - 1, x + r + 1)] - S[y*ww + Math.max(0, x - r)]; } }
    for(let x = 0; x < ww; x++){ let s = 0; for(let y = -r; y <= r; y++) s += T[Math.min(wh - 1, Math.max(0, y))*ww + x];
      for(let y = 0; y < wh; y++){ O[y*ww + x] = s/n; s += T[Math.min(wh - 1, y + r + 1)*ww + x] - T[Math.max(0, y - r)*ww + x]; } }
    return O; };
  const er = Math.max(1, Math.round(unit*(0.006 + wet*0.012))), blurred = blurF(blurF(D, er), er);
  const tooth = fbmSampler(28, 2), bloom = fbmSampler(5, 3);
  const lv = lightVec(light == null ? 0 : light), lm = Math.hypot(lv.lx, lv.ly), gx = lm > 1e-3 ? lv.lx/lm : 0, gy = lm > 1e-3 ? lv.ly/lm : 0, run = Math.min(1, lm);
  const rim = 1.1*(1 - wet*0.6), gran = 0.12 + 0.12*(1 - wet), out = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
  for(let i = 0; i < N; i++){
    const x = i % ww, y = (i/ww) | 0, u = x/unit, v = y/unit;
    let r = img.r[i], g = img.g[i], b = img.b[i], d = D[i];
    if(d >= 0.004){
      const grade = 1 + run*0.45*((u - ww/unit/2)*gx + (v - wh/unit/2)*gy);        // downhill holds more pigment
      d += Math.max(0, d - blurred[i])*rim*2.2;                                   // the darker drying edge
      d *= grade*(1 + gran*(tooth(u*1.5, v*1.5) - 0.5)*2)*(0.62 + 0.76*bloom(u, v)**2);   // granulation, and an uneven load
      d = Math.max(0, Math.min(1, d*1.1));
      r *= 1 - d*(1 - col[0]); g *= 1 - d*(1 - col[1]); b *= 1 - d*(1 - col[2]);
    }
    out.r[i] = r; out.g[i] = g; out.b[i] = b;
  }
  return out;
}

export const TOUCH_STEPS = {
  // 🜚 the older Touch textures, each one part (kitWhole: drawn as it always was, under the texture's own seed + Variant)
  coldpress: kitWhole({ cat: 'Textures', label: 'Cold Press', ins: ['light from'], outs: ['paper'], io: { ins: ['value'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Tooth Scale', 100, 75, 400), TOUCH_R('amount', 'Tooth Depth', 100, 20, 300), TOUCH_R('form', 'Press', 50), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 6 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), a = wholeAmt(E, n, 'amount', 100), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 50);
      return () => genColdPress(w, h, a, z, light, f, E.ctx.mat || null); }),
  cupring: kitWhole({ cat: 'Marks', label: 'Cup Ring', ins: ['light from', 'stain hue'], outs: ['rings'], io: { ins: ['value', 'colour'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Ring Size', 100, 40, 320), TOUCH_R('amount', 'Ring Count', 100, 30, 300), TOUCH_R('form', 'Spill', 35), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 5 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), t1 = wholeHex(E, n, 2), a = wholeAmt(E, n, 'amount', 100), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 35);
      return () => genCupRing(w, h, a, z, light, t1, f, E.ctx.mat || null, E.ctx.glow || null); }),
  oldpaper: kitWhole({ cat: 'Textures', label: 'Old Paper', ins: ['light from', 'age hue', 'mold hue'], outs: ['paper'], io: { ins: ['value', 'colour', 'colour'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Scale', 100, 40, 400), TOUCH_R('amount', 'Folds', 35), TOUCH_R('form', 'Age', 30), TOUCH_R('crinkle', 'Crinkle', 25), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 8 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), t1 = wholeHex(E, n, 2), t2 = wholeHex(E, n, 3), a = wholeAmt(E, n, 'amount', 35), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 30), c = wholeShare(E, n, 'crinkle', 25);
      return () => genOldPaper(w, h, a, z, light, t1, t2, f, c, E.ctx.mat || null, E.ctx.glow || null); }),
  ash: kitWhole({ cat: 'Textures', label: 'Burnt Letter', ins: ['light from', 'ash hue', 'ember hue'], outs: ['ash'], io: { ins: ['value', 'colour', 'colour'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Flake Size', 100, 40, 300), TOUCH_R('amount', 'Ashfall', 100, 20, 400), TOUCH_R('form', 'Char', 55), TOUCH_R('embers', 'Embers', 20), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 8 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), t1 = wholeHex(E, n, 2), t2 = wholeHex(E, n, 3), a = wholeAmt(E, n, 'amount', 100), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 55), em = wholeShare(E, n, 'embers', 20);
      return () => genBurntLetter(w, h, a, z, light, t1, t2, f, em, E.ctx.mat || null); }),
  hoarfrost: kitWhole({ cat: 'Marks', label: 'Hoarfrost', ins: ['light from', 'frost hue'], outs: ['frost'], io: { ins: ['value', 'colour'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Crystal Size', 100, 50, 250), TOUCH_R('amount', 'Frost', 100, 20, 250), TOUCH_R('form', 'Feathering', 55), TOUCH_R('rime', 'Rime', 30), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 10 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), t1 = wholeHex(E, n, 2), a = wholeAmt(E, n, 'amount', 100), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 55), r = wholeShare(E, n, 'rime', 30);
      return () => genHoarfrost(w, h, a, z, light, t1, f, r, E.ctx.mat || null, E.ctx.glow || null); }),
  glassrain: kitWhole({ cat: 'Textures', label: 'Rain on Glass', ins: ['light from'], outs: ['glass'], io: { ins: ['value'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Drop Size', 100, 40, 300), TOUCH_R('amount', 'Rain', 100, 20, 300), TOUCH_R('form', 'Condensation', 30), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 12 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), a = wholeAmt(E, n, 'amount', 100), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 30);
      return () => genGlassRain(w, h, a, z, light, f, E.ctx.mat || null, E.ctx.env || null); }),
  water: kitWhole({ cat: 'Textures', label: 'Scrying Pool', ins: ['light from'], outs: ['pool'], io: { ins: ['value'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Wave Scale', 100, 40, 250), TOUCH_R('amount', 'Turbulence', 35), TOUCH_R('form', 'Depth', 35), TOUCH_R('haze', 'Haze', 10), TOUCH_R('murk', 'Murk', 0), TOUCH_R('tilt', 'View', 35), TOUCH_R('variant', 'Variant', 0, 0, 99),
      TOUCH_R('turn', 'Turn', 0, 0, 360), TOUCH_R('lens', 'Camera Zoom', 100, 25, 400)], cost: () => 12 },
    (E, n, w, h) => { const cam = wholeCam(E, n), light = wholeTurned(wholeDial(E, n, 1), cam), a = wholeAmt(E, n, 'amount', 35), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 35);
      const hz = wholeShare(E, n, 'haze', 10), mk = wholeShare(E, n, 'murk', 0), tl = wholeShare(E, n, 'tilt', 35);
      return () => genWater(w, h, a, z, light, f, hz, mk, tl, E.ctx.mat || null, cam); }),
  dunes: kitWhole({ cat: 'Textures', label: 'Dune Ripples', ins: ['light from', 'sand hue', 'sun hue'], outs: ['sand'], io: { ins: ['value', 'colour', 'colour'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Ripple Size', 100, 40, 300), TOUCH_R('amount', 'Wind', 50), TOUCH_R('form', 'Dune Height', 40), TOUCH_R('tilt', 'View', 40), TOUCH_R('variant', 'Variant', 0, 0, 99),
      TOUCH_R('turn', 'Turn', 0, 0, 360), TOUCH_R('lens', 'Camera Zoom', 100, 25, 400)], cost: () => 10 },
    (E, n, w, h) => { const cam = wholeCam(E, n), light = wholeTurned(wholeDial(E, n, 1), cam), t1 = wholeHex(E, n, 2), t2 = wholeHex(E, n, 3), a = wholeAmt(E, n, 'amount', 50), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 40), tl = wholeShare(E, n, 'tilt', 40);
      return () => genDunes(w, h, a, z, light, t1, t2, f, tl, E.ctx.mat || null, E.ctx.glow || null, cam); }),
  moss: kitWhole({ cat: 'Textures', label: 'Moss on Stone', ins: ['light from', 'stone hue', 'moss hue'], outs: ['stone'], io: { ins: ['value', 'colour', 'colour'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Stone Scale', 100, 40, 300), TOUCH_R('amount', 'Moss', 45), TOUCH_R('form', 'Dampness', 30), TOUCH_R('tilt', 'View', 30), TOUCH_R('variant', 'Variant', 0, 0, 99),
      TOUCH_R('turn', 'Turn', 0, 0, 360), TOUCH_R('lens', 'Camera Zoom', 100, 25, 400)], cost: () => 8 },
    (E, n, w, h) => { const cam = wholeCam(E, n), light = wholeTurned(wholeDial(E, n, 1), cam), t1 = wholeHex(E, n, 2), t2 = wholeHex(E, n, 3), a = wholeAmt(E, n, 'amount', 45), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 30), tl = wholeShare(E, n, 'tilt', 30);
      return () => genMoss(w, h, a, z, light, t1, t2, f, tl, E.ctx.mat || null, E.ctx.glow || null, cam); }),
  kintsugi: kitWhole({ cat: 'Textures', label: 'Kintsugi', ins: ['light from', 'glaze hue', 'gold hue'], outs: ['vessel'], io: { ins: ['value', 'colour', 'colour'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Seam Width', 100, 50, 300), TOUCH_R('amount', 'Fractures', 100, 20, 400), TOUCH_R('form', 'Gloss', 70), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 8 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), t1 = wholeHex(E, n, 2), t2 = wholeHex(E, n, 3), a = wholeAmt(E, n, 'amount', 100), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 70);
      return () => genKintsugi(w, h, a, z, light, t1, t2, f, E.ctx.mat || null, E.ctx.glow || null); }),
  spangle: kitWhole({ cat: 'Textures', label: 'Metal Spangle', ins: ['light from', 'metal hue'], outs: ['metal'], io: { ins: ['value', 'colour'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Crystal Size', 100, 40, 300), TOUCH_R('amount', 'Dendrites', 50), TOUCH_R('form', 'Terraces', 0), TOUCH_R('irregular', 'Irregularity', 40), TOUCH_R('brushing', 'Brushing', 0), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 8 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), t1 = wholeHex(E, n, 2), a = wholeAmt(E, n, 'amount', 50), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 0), v = wholeShare(E, n, 'irregular', 40), b = wholeShare(E, n, 'brushing', 0);
      return () => genSpangle(w, h, a, z, light, t1, f, v, b, E.ctx.mat || null, E.ctx.glow || null); }),
  crystal: kitWhole({ cat: 'Textures', label: 'Crystal Leaf', ins: ['light from', 'crystal hue', 'inclusion hue'], outs: ['crystal'], io: { ins: ['value', 'colour', 'colour'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Facet Size', 100, 40, 300), TOUCH_R('amount', 'Clarity', 70), TOUCH_R('form', 'Fire', 50), TOUCH_R('phantoms', 'Phantoms', 30), TOUCH_R('inclusions', 'Inclusions', 20), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 10 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), t1 = wholeHex(E, n, 2), t2 = wholeHex(E, n, 3), a = wholeAmt(E, n, 'amount', 70), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 50);
      const ph = wholeShare(E, n, 'phantoms', 30), inc = wholeShare(E, n, 'inclusions', 20);
      return () => genCrystalLeaf(w, h, a, z, light, t1, t2, f, ph, inc, E.ctx.mat || null, E.ctx.glow || null); }),
  marbling: kitWhole({ cat: 'Textures', label: 'Suminagashi', ins: ['breath from', 'ink hue', 'second ink hue'], outs: ['marbling'], io: { ins: ['value', 'colour', 'colour'], outs: ['image'] },
    params: [TOUCH_R('zoom', 'Ring Size', 100, 50, 250), TOUCH_R('amount', 'Drops', 100, 30, 250), TOUCH_R('form', 'Breath', 40), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 10 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), t1 = wholeHex(E, n, 2), t2 = wholeHex(E, n, 3), a = wholeAmt(E, n, 'amount', 100), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 40);
      return () => genSuminagashi(w, h, a, z, light, f, t1, t2); }),
  // POURED WAX, in parts (texTouch genPouredWax until now). POURS: pour points and volumes from the seed; each
  // pour spreads into a pool, and pools that meet MERGE (a metaball field). SPLATTER (Ruby: a wax simulator that
  // becomes a fluid-spatter simulator): drops thrown from each pour, away from the dial, stretched along their
  // flight, and crowns of spikes on the pools — at 0 exactly the pours as they were.
  pours: { cat: 'Marks', label: 'Pours', ins: ['thrown from'], outs: ['amount'], io: { ins: ['value'], outs: ['field'] },
    params: [TOUCH_R('size', 'Pool Size', 100, 40, 400), TOUCH_R('count', 'Pool Count', 100, 25, 300), TOUCH_R('viscosity', 'Viscosity', 45), TOUCH_R('splatter', 'Splatter', 0), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 3,
    run(E, n){ const { ww, wh, unit, num, ctx } = E, seed = ((ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0;
      const zoom = num(n, 'size', 100)/100, amt = num(n, 'count', 100)/100, visc = num(n, 'viscosity', 45)/100, spl = num(n, 'splatter', 0)/100;
      const dv = E.input(n, 1), deg = typeof dv === 'number' ? dv*360 : (ctx.light ?? 315), da = (deg - 90)*Math.PI/180, tx = -Math.cos(da), ty = -Math.sin(da);
      return withSeed(seed, () => {
        const nP = Math.max(1, Math.round(3*amt)), spread = 1.2 - 0.45*visc, pours = [];
        for(let k = 0; k < nP; k++){
          const V = 0.4 + Math.random()*0.9, R = unit*0.12*zoom*spread*Math.sqrt(V), cx = ww*(0.1 + Math.random()*0.8), cy = wh*(0.1 + Math.random()*0.8);
          pours.push({ cx, cy, R, V, ph1: Math.random()*6.28, ph2: Math.random()*6.28, lobes: 3 + Math.floor(Math.random()*3) });
          // a pour runs on in a lobe or two: smaller blobs nudged downhill from it
          const runs = Math.floor(Math.random()*3*(1 - visc*0.6));
          for(let r = 0; r < runs; r++){ const a = Math.random()*6.28, d = R*(0.6 + Math.random()*0.5);
            pours.push({ cx: cx + Math.cos(a)*d, cy: cy + Math.sin(a)*d, R: R*(0.35 + Math.random()*0.3), V: V*0.5, ph1: Math.random()*6.28, ph2: Math.random()*6.28, lobes: 3, run: true }); }
        }
        // the splatter (its own draws, after every pour's: at 0 the pours above are exactly as they were)
        if(spl > 0){ const mains = pours.filter(p => !p.run);
          for(const p of mains){
            // the crown: fingers of liquid of every length, mostly toward the throw
            const nS = Math.round(7 + spl*16); p.spikes = [];
            for(let k = 0; k < nS; k++){ const a = Math.random() < 0.5 ? Math.atan2(ty, tx) + (Math.random() - 0.5)*2.2 : Math.random()*6.283;
              p.spikes.push([a, Math.pow(Math.random(), 1.6)*spl*1.7, 0.05 + Math.random()*0.12]); }
            const m = Math.round(spl*46*Math.sqrt(p.V));
            for(let k = 0; k < m; k++){
              // flung mostly away from the dial (a throw), some everywhere (a splash)
              const a0 = Math.atan2(ty, tx), a = Math.random() < 0.65 ? a0 + (Math.random() - 0.5)*1.6 : Math.random()*6.283;
              const dist = p.R*(1.05 + Math.pow(Math.random(), 1.8)*(1.2 + 3.6*spl)), r = p.R*(0.035 + Math.pow(Math.random(), 2)*0.16)*(1.15 - 0.6*spl);
              const stretch = 1 + Math.random()*2.6*spl*Math.min(1, dist/(p.R*2));
              pours.push({ cx: p.cx + Math.cos(a)*dist, cy: p.cy + Math.sin(a)*dist, R: r, V: 0.75 + Math.random()*0.5, ph1: Math.random()*6.28, ph2: Math.random()*6.28, lobes: 4, ex: Math.cos(a), ey: Math.sin(a), st: stretch, drop: true });
              // a trail of beads back toward the pool behind a long throw
              if(stretch > 2 && Math.random() < 0.5){ const beads = 2 + Math.floor(Math.random()*3);
                for(let b = 1; b <= beads; b++){ const t = b/(beads + 1)*0.5; pours.push({ cx: p.cx + Math.cos(a)*dist*(1 - t), cy: p.cy + Math.sin(a)*dist*(1 - t), R: r*(0.45 - t*0.4), V: 0.8, ph1: 0, ph2: 0, lobes: 3, drop: true }); } }
            } } }
        const F = new Float32Array(ww*wh);
        for(const p of pours){
          const st = p.st || 1, reach = p.R*1.6*st*(p.spikes ? 1 + spl*1.7 : 1), x0 = Math.max(0, Math.floor(p.cx - reach)), x1 = Math.min(ww - 1, Math.ceil(p.cx + reach)), y0 = Math.max(0, Math.floor(p.cy - reach)), y1 = Math.min(wh - 1, Math.ceil(p.cy + reach));
          for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){
            let dx = x - p.cx, dy = y - p.cy;
            if(st > 1){ const u = dx*p.ex + dy*p.ey, v = -dx*p.ey + dy*p.ex; dx = u/st; dy = v; }   // a drop stretched along its flight
            const a = Math.atan2(dy, dx);
            let Rw = p.R*(1 + 0.12*Math.sin(a*p.lobes + p.ph1) + 0.06*Math.sin(a*7 + p.ph2));   // never a true circle
            if(p.spikes){ let g = 0; for(const [sa, sl, sw] of p.spikes){ let d = a - sa; d -= Math.round(d/6.283185)*6.283185; g += sl*Math.exp(-(d*d)/(sw*sw)); } Rw *= 1 + g; }   // and its crown, when it splashes
            const q = (dx*dx + dy*dy)/(Rw*Rw*2.2);
            if(q < 1) F[y*ww + x] += p.V*(1 - q)*(1 - q);
          }
        }
        return [F]; }); } },
  // MENISCUS: the poured field's surface — flat-topped, round-edged, lumpy where thick (its own lumps, from the seed)
  meniscus: { cat: 'Shape', label: 'Meniscus', ins: ['amount'], outs: ['height', 'coverage', 'thin', 'thick'], io: { ins: ['field'], outs: ['field', 'field', 'field', 'field'] },
    params: [TOUCH_R('viscosity', 'Viscosity', 45), TOUCH_R('height', 'Height', 50), TOUCH_R('lumps', 'Lumps', 50), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 2,
    run(E, n){ const { ww, wh, N, num, input, asField, ctx } = E, F = asField(input(n, 1)); if(!F) return null;
      const visc = num(n, 'viscosity', 45)/100, hk = num(n, 'height', 50)/50, lk = num(n, 'lumps', 50)/50;
      const lump = withSeed(((ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919 + 31) >>> 0, () => fbmSampler(5, 3));
      // heights in 0..1 of a thick pour (the Light Engine's Relief scales them): thick wax stands taller
      const thickK = (0.004 + 0.009*visc)/0.013, T0 = 0.16, T1 = 0.16 + 0.10 + 0.25*visc;
      const H = new Float32Array(N), C = new Float32Array(N), TH = new Float32Array(N), TK = new Float32Array(N);
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const i = y*ww + x, f = F[i]; if(f <= T0) continue;
        const t = Math.min(1, (f - T0)/(T1 - T0)), m = t*t*(3 - 2*t);
        C[i] = Math.min(1, (f - T0)/0.025);
        const h0 = thickK*hk*(m + visc*0.35*lk*(lump(x/ww, y/wh) - 0.5) + 0.25*Math.max(0, f - T1*1.6));
        H[i] = Math.max(0, Math.min(1, h0*0.75)); TH[i] = C[i]*(1 - Math.min(1, m/0.7)); TK[i] = C[i]*Math.min(1, m); }
      return [H, C, TH, TK]; } },
  washes: { cat: 'Marks', label: 'Washes', ins: [], outs: ['first', 'second'],
    params: [TOUCH_R('amount', 'Pigment', 100, 30, 250), TOUCH_R('size', 'Wash Size', 100, 40, 250), TOUCH_R('wet', 'Wetness', 50), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 6,
    run(E, n){ const { ww, wh, num, ctx } = E, seed = ((ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0;
      return withSeed(seed, () => touchWashes(ww, wh, num(n, 'amount', 100)/100, num(n, 'size', 100)/100, num(n, 'wet', 50)/100)); } },
  pigment: { cat: 'Light & Color', label: 'Pigment', ins: ['paper', 'density', 'color', 'runs to'], outs: ['image'], io: { ins: ['image', 'field', 'colour', 'value'], outs: ['image'] },
    params: [TOUCH_R('wet', 'Wetness', 50)], cost: () => 4,
    run(E, n){ const { ww, wh, input, num, asField, asImage, ctx } = E, D = asField(input(n, 2)); if(!D) return null;
      const img = asImage(input(n, 1) ?? 1), c = input(n, 3), col = Array.isArray(c) ? c : [0.18, 0.36, 0.54], dv = input(n, 4);
      return [touchPigment(D, img, ww, wh, col, num(n, 'wet', 50)/100, typeof dv === 'number' ? dv*360 : (ctx.light ?? 0))]; } },
  // TERRAIN: Contour Map's land — broad masses and a few sharp crests, warped — as heights 0..1.
  // Drawn from the texture's own seed (+ Variant), so the map shows the land it always did.
  terrain: { cat: 'Noise', label: 'Terrain', ins: [], outs: ['height'],
    params: [TOUCH_R('scale', 'Scale', 100, 40, 300), TOUCH_R('crests', 'Crests', 22), TOUCH_R('variant', 'Variant', 0, 0, 99)], cost: () => 3,
    run(E, n){ const { ww, wh, N, unit, num, ctx } = E;
      const sc = 100/Math.max(1, num(n, 'scale', 100))*(ctx.fill ? 2.2 : 1), cr = num(n, 'crests', 22)/100, seed = ((ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0;
      return withSeed(seed, () => {
        const broad = fbmSampler(3, 4), ridge = fbmSampler(5, 3), warp = fbmSampler(3, 2), H = new Float32Array(N);
        for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
          const u = x/unit*sc, v = y/unit*sc, wu = u + (warp(u*0.5, v*0.5) - 0.5)*0.6, wv = v + (warp(v*0.5 + 3.1, u*0.5 + 1.7) - 0.5)*0.6;
          const r = 1 - Math.abs(ridge(wu*0.6, wv*0.6)*2 - 1);
          H[y*ww + x] = (1 - cr)*broad(wu*0.45, wv*0.45) + cr*r*r*r;
        }
        let lo = Infinity, hi = -Infinity; for(let i = 0; i < N; i++){ if(H[i] < lo) lo = H[i]; if(H[i] > hi) hi = H[i]; }
        for(let i = 0; i < N; i++) H[i] = (H[i] - lo)/Math.max(1e-6, hi - lo);
        // (Shape Aware, round the words: the land under them is levelled to one height, the average about them, so its
        //  contours run round the poem as round a plateau, never through it; in the letters it is finer, to show in a stroke)
        const room = wordsRoom(ctx, ww, wh, 0.3, 2.2);
        if(room){ let m = 0, wsum = 0; for(let i = 0; i < N; i++){ const k = 1 - room[i]; m += H[i]*k; wsum += k; }
          const lev = wsum > 0 ? m/wsum + 0.013 : 0.5; for(let i = 0; i < N; i++) H[i] = H[i]*room[i] + lev*(1 - room[i]); }
        return [H]; }); } },
  // Every line a promise
  // kept at one height all the way
  // round the hill and home.
  // CONTOUR LINES: the isolines of any gray map (d3-contour's maps, found per pixel: how far the value is from its
  // level, against the slope, so a line keeps one width on steep and gentle ground); every Nth an index line, heavier
  contours: { cat: 'Marks', label: 'Contour Lines', ins: ['height'], outs: ['lines'],
    params: [TOUCH_R('levels', 'Levels', 20, 3, 60), TOUCH_R('weight', 'Line Weight', 100, 25, 400), TOUCH_R('index', 'Heavy Line Every', 5, 0, 10), TOUCH_R('strength', 'Strength', 90)], cost: () => 2,
    run(E, n){ const { ww, wh, N, unit, num, input, asField } = E, H = asField(input(n, 1)); if(!H) return null;
      // a line finer than half a cell is drawn half a cell wide but fainter, so a small preview keeps the export's weight
      const levels = Math.max(3, Math.round(num(n, 'levels', 20))), lw0 = unit*0.0011*num(n, 'weight', 100)/100, lw = Math.max(0.5, lw0), lwIdx = Math.max(0.5, lw0*2.1);
      const fade = Math.min(1, lw0/0.5), fadeIdx = Math.min(1, lw0*2.1/0.5);
      const every = Math.round(num(n, 'index', 5)), st = num(n, 'strength', 90)/100, LN = new Float32Array(N);
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
        const i = y*ww + x, v = H[i]*levels;
        const gx = (H[y*ww + Math.min(ww - 1, x + 1)] - H[y*ww + Math.max(0, x - 1)])*0.5*levels, gy = (H[Math.min(wh - 1, y + 1)*ww + x] - H[Math.max(0, y - 1)*ww + x])*0.5*levels;
        const g = Math.max(1e-4, Math.hypot(gx, gy)), f = v - Math.floor(v), dist = Math.min(f, 1 - f)/g;
        const k = Math.round(v), idx = every > 0 && k % every === 0, half = (idx ? lwIdx : lw)*0.5;
        LN[i] = Math.max(0, Math.min(1, half + 0.5 - dist))*(idx ? fadeIdx : 0.8*fade)*st;
      }
      return [LN]; } },
  weave: { cat: 'Textures', label: 'Weave', ins: [], outs: ['shade', 'sheen'],
    params: [TOUCH_R('weave', 'Weave', 50), TOUCH_R('scale', 'Scale', 100, 50, 400)], cost: () => 6,
    // The weave is a NORMAL MAP (threads are far too fine to be heights that
    // cast shadows): each point's normal, shaded by the dial's light — its
    // elevation, and a highlight as sharp as the fibre's gloss (silk glossy,
    // burlap matte). Each thread a rounded bump catching the light as it rises
    // over its neighbour and dips under the next; never quite straight, lumpy
    // with slubs, each spun a little lighter or darker than the next (cloth is
    // never one even tone); its edges soft, a pixel wide (no stair-steps).
    run(E, n){ const { ww, wh, unit, ctx, num } = E;
      const W = weaveAt(num(n, 'weave', 50)/100), zoom = num(n, 'scale', 100)/100;
      const LB = lightBasis(ctx.light ?? 315), flatD = Math.max(0.05, LB.flat), threadGloss = 0.12 + W.sheen*0.55;
      const p = Math.max(2, unit*W.pitch*zoom);
      const seedA = (Math.random()*4294967296) >>> 0, seedB = Math.random()*1000;
      // a fast integer hash (this loop runs a million times at export: no Math.sin here)
      const hash = v => { let x = ((v*1024) | 0) ^ seedA; x = Math.imul(x ^ (x >>> 16), 0x7feb352d); x = Math.imul(x ^ (x >>> 15), 0x846ca68b); x ^= x >>> 16; return (x >>> 0)/4294967296; };
      const lump = (i, t) => { const a = Math.floor(t), f = t - a, u = f*f*(3 - 2*f); return hash(i*31.7 + a)*(1 - u) + hash(i*31.7 + a + 1)*u; };
      const slubAmp = W.slub*0.9;
      const top = (pat, i, j) => pat === 2 ? ((i + j) & 1) === 0 : pat === 1 ? ((((i - j) % 3) + 3) % 3) < 2 : ((i*2 + j) % 5) === 0;
      // the light, unpacked once (shadeNormal, inlined: no object per pixel)
      const Lx = LB.Lx, Ly = LB.Ly, Lz = LB.Lz, Hx = LB.Hx, Hy = LB.Hy, Hz = LB.Hz, spPow = 4 + threadGloss*120, spK = 0.15 + threadGloss*0.85;
      let tS = 0, tP = 0;                                     // one thread's shade and sheen (written by thread())
      // one thread's shade at a point: across it (a), along it (f), whether it is on top
      // tables for the curves each thread point needs (pow, sin and cos are the loop's cost)
      const TB = 256, PROF = new Float32Array(TB + 1), SINF = new Float32Array(TB + 1), COSF = new Float32Array(TB + 1);
      for(let q = 0; q <= TB; q++){ const t = q/TB; PROF[q] = Math.pow(Math.max(0, 1 - t*t), 0.5*W.round); SINF[q] = Math.sin(Math.PI*t); COSF[q] = Math.cos(Math.PI*t); }
      const thread = (warp, a, f, onTop, idx, along, toneK) => {
        const qa = ((a < 0 ? -a : a)*TB + 0.5) | 0, qf = (f*TB + 0.5) | 0;   // a is SIGNED: one side of the thread faces the light, the other away
        const ht = PROF[qa]*(0.78 + 0.22*SINF[qf]);
        // a soft roundness: real yarn is fuzzy, its shading gentle (a hard dome reads as plastic)
        const s1 = a*0.62*W.round, s2 = COSF[qf]*0.24*(onTop ? 1 : -1);
        let nx = warp ? s1 : s2, ny = warp ? s2 : s1, nz = 1; const l = Math.sqrt(nx*nx + ny*ny + 1); nx /= l; ny /= l; nz /= l;
        const diff = Math.max(0, nx*Lx + ny*Ly + nz*Lz), nh = Math.max(0, nx*Hx + ny*Hy + nz*Hz), rel = Math.min(1.6, diff/flatD);
        const fibre = 0.94 + 0.12*hash(Math.floor(along)*17.3 + idx);
        tS = (0.82 + 0.16*ht)*fibre*toneK*(0.76 + 0.24*rel); tP = W.sheen > 0 ? W.sheen*Math.pow(nh, spPow)*spK*1.4 : 0;
      };
      let oS = 0, oP = 0;
      const shadeAt = (pat, i, j, fu, fv, aw, af, cW, cF, tW, tF) => {
        const warpTop = top(pat, i, j);
        // the top thread covers what is under it; their edges are a pixel soft
        const a = warpTop ? cW : cF, b = (warpTop ? cF : cW)*(1 - a), g = 1 - a - b;
        let S = 0, P = 0;
        if(a > 0){ if(warpTop) thread(true, Math.max(-1, Math.min(1, aw)), fv, true, i, fu*7.0 + i*3.1, tW); else thread(false, Math.max(-1, Math.min(1, af)), fu, true, j, fv*7.0 + j*2.7, tF); S += tS*a; P += tP*a; }
        if(b > 0){ if(warpTop) thread(false, Math.max(-1, Math.min(1, af)), fu, false, j, fv*7.0 + j*2.7, tF); else thread(true, Math.max(-1, Math.min(1, aw)), fv, false, i, fu*7.0 + i*3.1, tW); S += tS*b; P += tP*b; }
        if(g > 0){
          // the gap between threads: shadow, softly (light still finds its way through)
          const edge = Math.min(Math.abs(Math.abs(aw) - 1)*W.tw, Math.abs(Math.abs(af) - 1)*W.tw);
          S += (0.72 - Math.min(0.24, edge*1.2))*g;
        }
        oS = S; oP = P;
      };
      // each thread spun its own tone (heathered, as real yarn is): one per thread, kept
      const toneOf = new Map(), tone = key => { let v = toneOf.get(key); if(v === undefined){ v = 1 + (hash(key*7.13 + 3.7) - 0.5)*0.1*(0.5 + W.slub); toneOf.set(key, v); } return v; };
      const N = ww*wh, SH = new Float32Array(N), SP = new Float32Array(N), wob = 0.08 + W.slub*0.18;
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
        // threads are never straight: each wanders a little as it goes
        const u0 = x/p, v0 = y/p;
        const u = u0 + wob*Math.sin(v0*0.45 + Math.floor(u0)*1.7), v = v0 + wob*Math.sin(u0*0.45 + Math.floor(v0)*2.3);
        const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
        const thW = W.tw*(1 + slubAmp*(lump(i, v*0.11 + seedB) - 0.5)*1.6), thF = W.tw*(1 + slubAmp*(lump(j + 500, u*0.11) - 0.5)*1.6);
        const aw = (fu - 0.5)/(thW/2), af = (fv - 0.5)/(thF/2);
        // coverage, a pixel soft: a pixel is 1/p of a thread's pitch
        const cW = Math.max(0, Math.min(1, (1 - Math.abs(aw))*p*thW/2 + 0.5)), cF = Math.max(0, Math.min(1, (1 - Math.abs(af))*p*thF/2 + 0.5));
        const tW = tone(i), tF = tone(j + 100000);
        shadeAt(W.patA, i, j, fu, fv, aw, af, cW, cF, tW, tF);
        let shade = oS, spec = oP;
        if(W.patB !== W.patA && W.mix > 0){
          shadeAt(W.patB, i, j, fu, fv, aw, af, cW, cF, tW, tF);
          shade = shade + (oS - shade)*W.mix; spec = spec + (oP - spec)*W.mix;
        }
        // hairs: burlap's fuzz, fixed to the cloth (the same each time it is drawn)
        if(W.fuzz > 0) shade += (hash(x*0.731 + y*91.17) - 0.5)*W.fuzz*0.22;
        const k = y*ww + x; SH[k] = shade; SP[k] = spec;
      }
      return [SH, SP];
    } },

  cloth: { cat: 'Textures', label: 'Cloth & Details', ins: ['shade', 'sheen', 'fabric hue', 'light hue'], outs: ['image'],
    params: [TOUCH_R('details', 'Details', 42), TOUCH_R('scale', 'Scale', 100, 50, 400)], cost: () => 18,
    // The cloth, coloured: Fabric Hue colours it, Light Hue the light on it.
    // DETAILS run stitching → slubs → buttons → rivets: real things on the
    // cloth, HEIGHTS lit by the lighting engine, so a button or a rivet throws
    // its shadow across the weave, a seam is a ditch beside the raised fold of
    // cloth sewn under it, and stitches stand proud of the cloth. Far from a
    // detail, the weave is untouched. GLOW: luminous thread in the stitching.
    run(E, n){ const { ww, wh, unit, ctx, input, num, asField, asColour, hexCol, px } = E;
      const shadeF = asField(input(n, 1), 0.82), specF = asField(input(n, 2), 0);
      const fc = asColour(input(n, 3), hexCol((ctx.tints || [])[0] || '#808080')), lc = asColour(input(n, 4), hexCol((ctx.tints || [])[1] || '#FFFFFF'));
      const F = { r: fc[0]*255, g: fc[1]*255, b: fc[2]*255 }, Lc = { r: lc[0]*255, g: lc[1]*255, b: lc[2]*255 };
      const amt = num(n, 'details', 42)/100, zoom = num(n, 'scale', 100)/100, light = ctx.light ?? 315, GL = ctx.glow || null;
      const N = ww*wh, d = new Float32Array(N*3);
      const lr0 = 1 + (Lc.r/255 - 1)*0.3, lg0 = 1 + (Lc.g/255 - 1)*0.3, lb0 = 1 + (Lc.b/255 - 1)*0.3;
      for(let k = 0; k < N; k++){ const s = shadeF[k], sp = specF[k];
        d[k*3] = Math.max(0, Math.min(255, F.r*s*lr0 + Lc.r*sp)); d[k*3+1] = Math.max(0, Math.min(255, F.g*s*lg0 + Lc.g*sp)); d[k*3+2] = Math.max(0, Math.min(255, F.b*s*lb0 + Lc.b*sp)); }
      const tri = (x, c, r) => Math.max(0, 1 - Math.abs(x - c)/r);
      const dS = tri(amt, 0.15, 0.2), dL = tri(amt, 0.42, 0.22), dB = tri(amt, 0.68, 0.22), dR = tri(amt, 0.95, 0.22);
      const seedA = Math.random()*1000, hash = v => { const s = Math.sin(v*127.1 + seedA)*43758.5453; return s - Math.floor(s); };
      const H = new Float32Array(N), cov = new Float32Array(N), alb = new Float32Array(N*3);
      const shine = new Float32Array(N), metal = new Uint8Array(N), TG = GL ? new Float32Array(N) : null;
      const over = (i, a, c, s, m) => { if(a <= 0) return; const o = 1 - a, q = i*3;
        alb[q] = alb[q]*o + c.r*a; alb[q+1] = alb[q+1]*o + c.g*a; alb[q+2] = alb[q+2]*o + c.b*a;
        cov[i] = cov[i]*o + a; shine[i] = shine[i]*o + s*a; if(m && a > 0.5) metal[i] = 1; else if(a > 0.5) metal[i] = 0; };
      const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v, smooth = (a, b, v) => { const t = clamp01((v - a)/(b - a)); return t*t*(3 - 2*t); };
      const g = unit;
      const thread = { r: Math.min(255, F.r*0.45 + Lc.r*0.6), g: Math.min(255, F.g*0.45 + Lc.g*0.6), b: Math.min(255, F.b*0.45 + Lc.b*0.5) };
      // DETAILS live on SEAMS, as on real clothes: stitching runs along them,
      // rivets are set into them, buttons sit on a placket
      const SEAM_STITCHES = ['dashed', 'zigzag', 'cross', 'herringbone', 'chain', 'blanket', 'wave', 'satindiamond'];
      const seamStitch = SEAM_STITCHES[Math.floor(Math.random()*SEAM_STITCHES.length)];
      const seams = []; const ns = 2 + Math.floor(Math.random()*2);
      for(let k = 0; k < ns; k++) seams.push({ vert: Math.random() < 0.5, at: (0.14 + Math.random()*0.72) });
      const seamOn = Math.max(dS, dR, dL*0.4, dB*0.6);
      const bR = g*0.026*zoom;
      seams.forEach((sm, k) => { sm.side = Math.random() < 0.5 ? -1 : 1; sm.ph = Math.random()*6.283; sm.buttons = k === 0 && dB > 0.02; sm.band = sm.buttons ? bR*2.7 : g*0.022*zoom; });
      const ditch = Math.max(1.2, g*0.0035*zoom), lam = g*0.016*zoom, tw = Math.max(1.6, px(7)*zoom);
      for(const sm of seams){
        if(seamOn <= 0.02) break;
        const atG = sm.at*(sm.vert ? ww : wh), len = sm.vert ? wh : ww, band = sm.band, pkW = g*0.013*zoom, reachD = band*1.2 + pkW*3;
        // two layers under the fold stand ~a thread's thickness higher; the seam
        // line is pulled down into a ditch; the cloth beside it puckers in chevrons
        const fold = 1.7*seamOn, dig = 1.3*seamOn, pk = 0.55*seamOn*(0.5 + 1.4*dS);
        const lo = Math.max(0, Math.floor(atG - reachD)), hi = Math.min(sm.vert ? ww : wh, Math.ceil(atG + reachD));
        for(let c = lo; c < hi; c++){
          const dd = (c - atG)*sm.side, ad = Math.abs(dd);
          const base = dd > 0 ? fold*smooth(0, ditch*2.2, dd)*(1 - smooth(band*0.82, band*1.12, dd))
                              : fold*0.3*smooth(0, ditch*2.2, -dd)*Math.exp(dd/(band*0.5))*(1 - smooth(reachD*0.7, reachD, ad));
          const dip = -dig*Math.exp(-(dd/ditch)*(dd/ditch)), env = Math.exp(-ad/pkW)*(1 - smooth(reachD*0.7, reachD, ad));
          for(let t = 0; t < len; t++){
            const i = sm.vert ? t*ww + c : c*ww + t;
            const wave = Math.sin(6.2832*(t + 0.55*ad)/lam + 1.6*Math.sin(t/(lam*3.7) + sm.ph));
            H[i] += base + dip + pk*wave*env*(0.6 + 0.4*Math.sin(t/(lam*9) + sm.ph*2));
          }
        }
      }
      // stitching: raised thread, drawn by the seam's stitch (stitches.js) as a
      // mask, rounded into a thread's profile; a second row joins it as the
      // details grow (twin-needle topstitching, as on jeans)
      const sw = Math.max(dS, dR*0.8, dB*0.7);
      if(seamOn > 0.02 && sw > 0.02){
        const mk = document.createElement('canvas'); mk.width = ww; mk.height = wh;
        const mx = mk.getContext('2d', CPU);
        for(const sm of seams){
          const atG = sm.at*(sm.vert ? ww : wh), len = sm.vert ? wh : ww;
          const P = (t, o) => sm.vert ? [atG + o*sm.side, t] : [t, atG + o*sm.side];
          const offs = sm.buttons ? [sm.band*0.12, sm.band*0.9] : (amt > 0.25 ? [sm.band*0.24, sm.band*0.66] : [sm.band*0.36]);
          offs.forEach((off, r) => {
            const sp = { period: g*0.02*zoom, amp: g*0.006*zoom, width: tw, side: (r ? -1 : 1) };
            drawStitch(mx, pathFromPoints([P(0, off), P(len, off)], false), sm.buttons ? 'running' : seamStitch, { ...sp, color: '#fff' });
          });
        }
        const A = mx.getImageData(0, 0, ww, wh).data, m = new Float32Array(N);
        for(let i = 0; i < N; i++) m[i] = A[i*4+3]/255;
        const rb = Math.max(1, Math.round(tw*0.3)), tmp = new Float32Array(N), sm2 = new Float32Array(N);
        for(let pass = 0; pass < 2; pass++){
          const src = pass ? sm2 : m;
          for(let y = 0; y < wh; y++){ let s = 0; const r = y*ww; for(let x = -rb; x <= rb; x++) s += src[r + Math.min(ww - 1, Math.max(0, x))];
            for(let x = 0; x < ww; x++){ tmp[r + x] = s/(2*rb + 1); s += src[r + Math.min(ww - 1, x + rb + 1)] - src[r + Math.max(0, x - rb)]; } }
          for(let x = 0; x < ww; x++){ let s = 0; for(let y = -rb; y <= rb; y++) s += tmp[Math.min(wh - 1, Math.max(0, y))*ww + x];
            for(let y = 0; y < wh; y++){ sm2[y*ww + x] = s/(2*rb + 1); s += tmp[Math.min(wh - 1, y + rb + 1)*ww + x] - tmp[Math.max(0, y - rb)*ww + x]; } }
        }
        const thH = tw*0.6*sw, per = tw*0.9;
        for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
          const i = y*ww + x, a = m[i]; if(a <= 0.01) continue;
          H[i] += sm2[i]*thH;
          const tf = 0.84 + 0.16*Math.sin((x + y)*4.443/per);                // the ply's twist
          over(i, a*sw, { r: thread.r*tf, g: thread.g*tf, b: thread.b*tf }, 0.25, false);
          if(TG) TG[i] = Math.max(TG[i], a*sw);
        }
      }
      // rivets: copper caps set into the seams, domed, stamped with a ring, the
      // cloth pulled up around them; tarnished toward the rim
      if(dR > 0.02 && seamOn > 0.02){
        const r = g*0.0095*zoom, rH = r*0.45*dR, step = g*0.075*zoom, R2 = r*2.2;
        for(const sm of seams){
          if(sm.buttons) continue;
          const atG = sm.at*(sm.vert ? ww : wh), len = sm.vert ? wh : ww, tarnish = 0.25 + Math.random()*0.5;
          for(let t = step*(0.4 + Math.random()*0.3); t < len; t += step){
            const cx = sm.vert ? atG + sm.band*0.45*sm.side : t, cy = sm.vert ? t : atG + sm.band*0.45*sm.side;
            const tn = tarnish*(0.6 + Math.random()*0.8);
            for(let y = Math.max(0, Math.floor(cy - R2)); y < Math.min(wh, Math.ceil(cy + R2)); y++) for(let x = Math.max(0, Math.floor(cx - R2)); x < Math.min(ww, Math.ceil(cx + R2)); x++){
              const i = y*ww + x, rho = Math.hypot(x - cx, y - cy), e = rho/r;
              if(e < 1.02){
                const dome = rH*(0.55 + 0.45*Math.sqrt(Math.max(0, 1 - e*e))) - rH*0.14*Math.exp(-(((e - 0.62)/0.07)**2));
                const a = clamp01(r - rho + 0.5); H[i] = H[i]*(1 - a) + (H[i] + dome)*a;
                const rim = e*e*tn, warm = 0.78 + 0.22*(1 - e);
                over(i, a, { r: (190*warm)*(1 - rim) + 88*rim, g: (112*warm)*(1 - rim) + 62*rim, b: (60*warm)*(1 - rim) + 40*rim }, 1, true);
              } else if(e < 2.2){
                H[i] += rH*0.22*Math.max(0, 1 - (e - 1)/0.4) - rH*0.1*Math.sin(Math.PI*clamp01((e - 1.4)/0.8));
              }
            }
          }
        }
      }
      // buttons, down a placket: a rounded rim, a dished centre, four holes, and
      // thread through them crossed or in pairs — each the same, as on a shirt;
      // horn, shell, wood, or dyed to match, by the seed
      if(dB > 0.02 && seamOn > 0.02){
        const sm = seams[0], atG = sm.at*(sm.vert ? ww : wh), len = sm.vert ? wh : ww, step = g*0.15*zoom;
        const MATS = [ { c: { r: 72, g: 50, b: 34 }, s: 0.75, grain: 'mottle' }, { c: { r: 232, g: 226, b: 214 }, s: 0.85, grain: 'nacre' },
                       { c: { r: 150, g: 104, b: 64 }, s: 0.25, grain: 'rings' }, { c: { r: Math.min(255, F.r*0.85 + 26), g: Math.min(255, F.g*0.85 + 24), b: Math.min(255, F.b*0.85 + 22) }, s: 0.55, grain: 'none' } ];
        const mat = MATS[Math.floor(Math.random()*MATS.length)], crossed = Math.random() < 0.5;
        const bH = bR*0.3*dB, hr = bR*0.085, ho = bR*0.22, thw = bR*0.1;
        const holes = [[-ho, -ho], [ho, -ho], [-ho, ho], [ho, ho]];
        const strands = crossed ? [[holes[0], holes[3]], [holes[1], holes[2]]] : [[holes[0], holes[1]], [holes[2], holes[3]]];
        const segD = (qx, qy, [ax, ay], [bx, by]) => { const vx = bx - ax, vy = by - ay, t = clamp01(((qx - ax)*vx + (qy - ay)*vy)/(vx*vx + vy*vy)); return Math.hypot(qx - ax - vx*t, qy - ay - vy*t); };
        for(let t = step*(0.5 + Math.random()*0.3); t < len - bR; t += step){
          const cx = sm.vert ? atG + sm.band*0.5*sm.side : t, cy = sm.vert ? t : atG + sm.band*0.5*sm.side, rot = Math.random()*0.5;
          const cs = Math.cos(rot), sn = Math.sin(rot);
          for(let y = Math.max(0, Math.floor(cy - bR - 1)); y < Math.min(wh, Math.ceil(cy + bR + 1)); y++) for(let x = Math.max(0, Math.floor(cx - bR - 1)); x < Math.min(ww, Math.ceil(cx + bR + 1)); x++){
            const i = y*ww + x, dx = x - cx, dy = y - cy, rho = Math.hypot(dx, dy), e = rho/bR;
            if(e > 1.02) continue;
            const a = clamp01(bR - rho + 0.5);
            let hgt = e > 0.8 ? bH*(1 - 0.5*((e - 0.8)/0.2)**2) : e > 0.68 ? bH*(0.8 + 0.2*smooth(0.68, 0.8, e)) : bH*(0.8 - 0.07*(1 - (e/0.68)**2));
            let k = 1;
            if(mat.grain === 'mottle') k = 0.82 + 0.3*hash(Math.floor(dx*0.18 + 9)*7.1 + Math.floor(dy*0.18 + 9)*3.3 + t)*(0.5 + 0.5*Math.sin(dx*0.07 + dy*0.05 + t));
            else if(mat.grain === 'rings') k = 0.86 + 0.14*Math.sin(Math.hypot(dx + bR*0.9, dy*0.6)*0.9);
            else if(mat.grain === 'nacre') k = 0.94 + 0.06*Math.sin(dx*0.21 + Math.sin(dy*0.17)*2);
            let col = { r: mat.c.r*k, g: mat.c.g*k, b: mat.c.b*k }, s = mat.s;
            if(mat.grain === 'nacre'){ const ph = dx*0.09 + dy*0.13; col = { r: col.r*(0.97 + 0.03*Math.sin(ph)), g: col.g*(0.97 + 0.03*Math.sin(ph + 2.1)), b: col.b*(0.97 + 0.03*Math.sin(ph + 4.2)) }; }
            const ux = dx*cs + dy*sn, uy = -dx*sn + dy*cs;
            let inHole = 0; for(const [hx, hy] of holes) inHole = Math.max(inHole, clamp01(hr - Math.hypot(ux - hx, uy - hy) + 0.5));
            if(inHole > 0){ hgt = hgt*(1 - inHole) + bH*0.15*inHole; col = { r: col.r*(1 - inHole*0.75), g: col.g*(1 - inHole*0.75), b: col.b*(1 - inHole*0.75) }; }
            let thd = Infinity; for(const s2 of strands) thd = Math.min(thd, segD(ux, uy, s2[0], s2[1]));
            if(thd < thw*0.6){
              const q = clamp01(1 - thd/(thw*0.6)), ta = clamp01((thw*0.6 - thd) + 0.5);
              hgt = Math.max(hgt, bH*0.74 + Math.sqrt(q)*thw*0.6);
              const tf = 0.84 + 0.16*Math.sin((ux + uy)*4.443/(thw*0.9));
              col = { r: col.r*(1 - ta) + thread.r*tf*ta, g: col.g*(1 - ta) + thread.g*tf*ta, b: col.b*(1 - ta) + thread.b*tf*ta }; s = s*(1 - ta) + 0.25*ta;
            }
            H[i] = H[i]*(1 - a) + (H[i] + hgt)*a;
            over(i, a*dB, col, s, false);
          }
        }
      }
      // light it all: shadows from every proud thing fall across the weave
      const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      let any = false; for(let i = 0; i < N && !any; i++) if(H[i] !== 0 || cov[i] !== 0) any = true;
      if(!any){ for(let i = 0; i < N; i++){ o.r[i] = d[i*3]/255; o.g[i] = d[i*3+1]/255; o.b[i] = d[i*3+2]/255; } return [o]; }
      const Ls = lightSparse(H, ww, wh, { light, relief: 1, gloss: 0.72, shadow: 0.7, ao: 0.45, ambient: 0.4 });
      const fl = Ls.flat || 1;
      for(let i = 0; i < N; i++){
        const kk = Ls.light[i]/fl, c = cov[i], q = i*3;
        let r = d[q], gg = d[q+1], b = d[q+2];
        if(kk !== 1 || c !== 0){
          const sp = Ls.spec[i]*shine[i];
          r *= (1 - c)*kk; gg *= (1 - c)*kk; b *= (1 - c)*kk;
          if(c > 0){
            const mk = metal[i] ? 0.55 : 1;
            r += alb[q]*kk*mk*lr0; gg += alb[q+1]*kk*mk*lg0; b += alb[q+2]*kk*mk*lb0;
            if(sp > 0){
              if(metal[i]){ const ic = 1/Math.max(1e-3, c); r += sp*Math.min(255, alb[q]*ic*1.5); gg += sp*Math.min(255, alb[q+1]*ic*1.5); b += sp*Math.min(255, alb[q+2]*ic*1.5); }
              else { r += sp*Lc.r*0.8; gg += sp*Lc.g*0.8; b += sp*Lc.b*0.8; }
            }
          }
        }
        if(TG && TG[i] > 0){ const e = 255*TG[i]*0.9; r += GL.r*e; gg += GL.g*e; b += GL.b*e; }
        o.r[i] = Math.min(255, r)/255; o.g[i] = Math.min(255, gg)/255; o.b[i] = Math.min(255, b)/255;
      }
      return [o];
    } },
};

// ======================= STAINED GLASS: panes → glass =======================
/**
 * THE PANES of a window, as a Voronoi tiling on a ww×wh grid: each point
 * belongs to its nearest seed, the lead runs where two are equally near (its
 * width measured from the bisector, so every came is even). SHAPE runs
 * through four kinds of window: RANDOM shards (0–30) → a PATTERNED lattice
 * (diamond quarries, hexagons or bricks, its colours in rhythm) → a ROSE
 * window (55–80, ring by ring) → an ORDERED grid of squares.
 * Out: lead (the came's rounded profile, 0..1, on the lead only), edge (the
 * distance from the lead's centre, 1 at eight came-widths), pane (each
 * pane's own number, 0..1) and palette (which of the glazier's ten colours).
 */
export function paneLayout(ww, wh, zoom, amt, order, more = {}){
  const unit = Math.min(ww, wh), N = ww*wh, sep = unit*0.1*zoom;
  const kind = order < 0.3 ? 'random' : order < 0.55 ? 'pattern' : order < 0.8 ? 'rose' : 'grid';
  // the seeds: [x, y, ring, index-in-ring] — ring -1 a random pane, -2 a patterned one (index: its colour slot)
  const S = [];
  if(kind === 'random'){
    const jit = 0.5 - order*0.7;
    for(let gy = -1; gy <= Math.ceil(wh/sep) + 1; gy++) for(let gx = -1; gx <= Math.ceil(ww/sep) + 1; gx++){
      const ox = (gy % 2 ? 0.5 : 0)*order*1.6;             // calmer: rows offset like bricks
      S.push([(gx + 0.5 + ox + (Math.random()*2 - 1)*jit)*sep, (gy + 0.5 + (Math.random()*2 - 1)*jit)*sep, -1, 0]);
    }
  } else if(kind === 'pattern'){
    // a lattice, chosen by the seed; a hair of irregularity as the knob nears the random end (old glass is never perfect)
    const lat = Math.floor(Math.random()*3), jit = sep*0.04*(1 - (order - 0.3)/0.25), cyc = 2 + Math.floor(Math.random()*2);
    const R = Math.ceil(Math.hypot(ww, wh)/sep) + 2;
    for(let gy = -2; gy <= R; gy++) for(let gx = -2; gx <= R; gx++){
      let x, y;
      if(lat === 0){ x = (gx + 0.5*(gy & 1))*sep*1.15; y = gy*sep*0.58; }                      // diamond quarries
      else if(lat === 1){ x = (gx + 0.5*(gy & 1))*sep; y = gy*sep*0.866; }                      // hexagons
      else { x = (gx + 0.5*(gy & 1))*sep*1.4; y = gy*sep*0.6; }                                // bricks (long panes)
      if(x < -sep*2 || y < -sep*2 || x > ww + sep*2 || y > wh + sep*2) continue;
      S.push([x + (Math.random()*2 - 1)*jit, y + (Math.random()*2 - 1)*jit, -2, ((gx % cyc) + cyc + (gy % cyc)*(cyc - 1) + 9*cyc) % (cyc*2)]);
    }
  } else if(kind === 'grid'){
    const g = sep*0.9;
    for(let gy = -1; gy <= Math.ceil(wh/g) + 1; gy++) for(let gx = -1; gx <= Math.ceil(ww/g) + 1; gx++)
      S.push([(gx + 0.5)*g, (gy + 0.5)*g, -2, (gx + 2*gy + 100) % 4]);
  } else {
    const cx = ww/2, cy = wh/2, sym = Math.random() < 0.5 ? 6 : 8, jit = (1 - order)*0.6*sep, K = Math.ceil(Math.hypot(ww, wh)/2/sep) + 1;
    S.push([cx, cy, 0, 0]);
    for(let k = 1; k <= K; k++){ const n = sym*k, off = (k % 2)*0.5;
      for(let j = 0; j < n; j++){ const a = (j + off)/n*Math.PI*2, r = k*sep;
        S.push([cx + Math.cos(a)*r + (Math.random()*2 - 1)*jit, cy + Math.sin(a)*r + (Math.random()*2 - 1)*jit, k, j]); } }
  }
  // VARIETY: panes of many sizes — some cells split into several small panes (where a glazier needed detail);
  // its draws happen only when it is up, so at 0 the window is exactly as it was
  const variety = more.variety || 0;
  if(variety > 0 && kind === 'random'){ const extra = [];
    for(const s0 of S){ if(Math.random() > variety*0.55) continue; const k = 2 + Math.floor(Math.random()*4*variety);
      for(let j = 0; j < k; j++) extra.push([s0[0] + (Math.random() - 0.5)*sep*0.9, s0[1] + (Math.random() - 0.5)*sep*0.9, -1, 0]); }
    S.push(...extra); }
  // each pane's color slot of the glazier's ten (a patterned window repeats a few, in its rhythm), and its own number
  const RHY = [0, 3, 8, 6, 4, 9].slice(0, 4 + Math.floor(Math.random()*2));
  const slot = S.map(s => s[2] >= 0 ? (s[2]*3 + (s[3] % 2)*5) % 10 : s[2] === -2 ? RHY[s[3] % RHY.length] : Math.floor(Math.random()*10));
  const own = S.map(() => Math.random());
  // the seeds in buckets, for the nearest-seed search (one ring of buckets is enough)
  const bs = sep*1.15, bw = Math.ceil(ww/bs) + 4, bh = Math.ceil(wh/bs) + 4, B2 = new Array(bw*bh);
  S.forEach((s, i) => { const bx = Math.floor(s[0]/bs) + 2, by = Math.floor(s[1]/bs) + 2; if(bx < 0 || by < 0 || bx >= bw || by >= bh) return; (B2[by*bw + bx] || (B2[by*bw + bx] = [])).push(i); });
  const lw = Math.max(0.6, unit*0.0065*amt);                         // the came's half-width
  const lead = new Float32Array(N), edge = new Float32Array(N), pane = new Float32Array(N), pal = new Float32Array(N), win = new Float32Array(N).fill(1);
  // THE WINDOW'S SHAPE (Ruby: arches made OF the glass, not set in stone): none (the whole page is glass), a LANCET
  // (a tall pointed arch), a ROUND window, or an ARCADE of three lancets. The outline is itself leading — a heavier
  // came — and the glass beyond it carries on as a border in its own colours. frameD(x, y): how far inside, in pixels.
  const frame = more.frame || 0, mg = unit*0.07;
  const lancet = (L, Rr, top, bot) => (x, y) => {
      const half = (Rr - L)/2, rad = (Rr - L)*0.86, spring = top + Math.sqrt(Math.max(0, rad*rad - (rad - half)**2));   // where the arch's two arcs leave the sides
      let d = Math.min(x - L, Rr - x, bot - y);
      if(y < spring){ const dl = rad - Math.hypot(x - (L + rad), y - spring), dr = rad - Math.hypot(x - (Rr - rad), y - spring); d = Math.min(d, dl, dr); }
      return d; };
  const arc3 = (() => { const gap = unit*0.05, wd = (ww - mg*2 - gap*2)/3, A = [0, 1, 2].map(k => lancet(mg + k*(wd + gap), mg + k*(wd + gap) + wd, mg + (k === 1 ? 0 : wh*0.08), wh - mg));
    return (x, y) => Math.max(A[0](x, y), A[1](x, y), A[2](x, y)); })();
  const frameD = frame === 1 ? lancet(mg, ww - mg, mg, wh - mg) : frame === 2 ? (x, y) => Math.min(ww, wh)/2 - mg - Math.hypot(x - ww/2, y - wh/2) : frame === 3 ? arc3 : null;
  const joint = new Float32Array(N);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const bx = Math.floor(x/bs) + 2, by = Math.floor(y/bs) + 2;
    let best = -1, bd = Infinity;
    for(let j = by - 1; j <= by + 1; j++) for(let i = bx - 1; i <= bx + 1; i++){ if(i < 0 || j < 0 || i >= bw || j >= bh) continue; const L = B2[j*bw + i]; if(!L) continue;
      for(const k of L){ const dx = S[k][0] - x, dy = S[k][1] - y, d = dx*dx + dy*dy; if(d < bd){ bd = d; best = k; } } }
    // the distance to the nearest bisector: the lead's centre line (and to the next nearest: where two meet, a joint)
    let e = Infinity, e2 = Infinity; const s1 = S[best];
    for(let j = by - 1; j <= by + 1; j++) for(let i = bx - 1; i <= bx + 1; i++){ if(i < 0 || j < 0 || i >= bw || j >= bh) continue; const L = B2[j*bw + i]; if(!L) continue;
      for(const k of L){ if(k === best) continue; const s2 = S[k], gx = s2[0] - s1[0], gy = s2[1] - s1[1], gl = Math.hypot(gx, gy) || 1;
        const dd = ((x - s1[0])*gx + (y - s1[1])*gy)/gl, ed = gl/2 - dd; if(ed < e){ e2 = e; e = ed; } else if(ed < e2) e2 = ed; } }
    const p = y*ww + x;
    let own2 = own[best], lwHere = lw;
    if(frameD){ const fd = frameD(x, y), af = Math.abs(fd);
      if(fd < 0){ win[p] = 0; own2 = (own2 + 0.5) % 1; }                    // beyond the outline: the border's glass, its own pane
      if(af/1.8 < e){ e2 = e; e = af/1.8; lwHere = lw; } else if(af/1.8 < e2) e2 = af/1.8; }   // the outline: a came 1.8× as broad
    const q = e/lwHere;
    lead[p] = q < 1 ? Math.sqrt(Math.max(0, 1 - q*q)) : 0; edge[p] = Math.min(1, e/(lw*8)); pane[p] = own2; pal[p] = (slot[best] + 0.5)/10;
    joint[p] = lead[p] > 0 ? Math.max(0, 1 - e2/(lw*2.4)) : 0;
  }
  return { lead, edge, pane, pal, win, joint };
}
/**
 * GLASS: panes lit — from BEHIND (brighter toward the dial's sun, streaked and
 * bubbled, darker against the lead where the glass is thick) and from the
 * FRONT (each pane gently domed and set at its own slight lean, so it flashes
 * where it faces the light, a sheen rolls across it, and a bright rim
 * catches where it meets the came on the lit side). The came itself: dull
 * metal in relief, lit by the dial. Colours: the two hues and what a glazier
 * sets beside them (amber, green, pale).
 */
export function litGlass(F, ww, wh, colA, colB, light, relief, more = {}){
  const { lead, edge, pane, pal } = F, win = F.win || null, scene = more.scene || null, sceneK = more.sceneK || 0, tex = more.texture || 0, refl = more.reflect ?? 1, unit = Math.min(ww, wh), N = ww*wh, lwPx = Math.max(0.6, unit*0.0065)*relief;
  const mixA = (a, b, t) => a.map((v, i) => v + (b[i] - v)*t), A = colA, Bc = colB, AMBER = [214, 152, 40], GREEN = [46, 122, 62], PALE = [232, 224, 196];
  const PAL = [A, A, mixA(A, [0, 0, 0], 0.35), Bc, Bc, mixA(Bc, AMBER, 0.5), AMBER, GREEN, mixA(A, PALE, 0.6), PALE];
  const fbm = (cells, oct) => { const gs = []; for(let o = 0; o < oct; o++){ const g = Math.max(2, Math.round(cells*Math.pow(2, o))) + 1; gs.push({ g, grid: makeNoiseGrid(g, g), a: Math.pow(0.5, o) }); }
    const nm = gs.reduce((s, o) => s + o.a, 0); return (u, v) => { let s = 0; for(const o of gs) s += sampleNoiseGrid(o.grid, o.g, o.g, u*(o.g - 1), v*(o.g - 1))*o.a; return s/nm; }; };
  const streak = fbm(4, 3), tooth = fbm(18, 2);
  // THE GLASS'S TEXTURE (0 cathedral, as before) → HAMMERED (dimpled) → SEEDY (full of bubbles) → OPALESCENT (milky, Tiffany's
  // swirled glass, which glows with its own colour more than it shows the light through); weights, so the knob slides between them
  const tri = (t, c) => Math.max(0, 1 - Math.abs(t - c)/0.34), wHam = tex > 0 ? tri(tex, 0.34) : 0, wSeed = tex > 0 ? tri(tex, 0.67) : 0, wOpal = Math.max(0, (tex - 0.67)/0.33);
  const swirl = tex > 0.5 ? fbm(3, 4) : null;
  // A SCENE behind the leading: each pane takes the average colour of the picture where it lies (a landscape window, Tiffany's way)
  let paneCol = null;
  if(scene && sceneK > 0){ paneCol = new Map();
    for(let i = 0; i < N; i++){ if(lead[i] > 0 || (win && win[i] < 0.5)) continue; const k = pane[i]; let a = paneCol.get(k); if(!a){ a = [0, 0, 0, 0]; paneCol.set(k, a); } a[0] += scene.r[i]; a[1] += scene.g[i]; a[2] += scene.b[i]; a[3]++; }
    for(const a of paneCol.values()){ const m = (a[0] + a[1] + a[2])/(3*a[3]);
      // glass is richer than paint: the colour pushed from its grey, and never quite black
      const mm = 0.5 + (m - 0.5)*1.35; for(let c = 0; c < 3; c++) a[c] = Math.max(18, Math.min(255, (mm + (a[c]/a[3] - m)*1.9)*255*1.05)); } }
  // the came's relief and the glass's ripple, lit by the dial
  const H = new Float32Array(N);
  // (a came is an H in section: a FLAT face with its edges rounded over, not a pipe; a soldered joint sits a little proud)
  const JT = F.joint || null;
  for(let i = 0; i < N; i++){ const x = i % ww, y = (i/ww) | 0;
    H[i] = lead[i] > 0 ? lwPx*(1.1*Math.min(1, lead[i]*2.6) + 0.5 + (JT ? JT[i]*0.55 : 0)) : (tooth(x/unit*2, y/unit*2) - 0.5)*lwPx*0.35; }
  const L = lightHeights(H, ww, wh, { light, relief: 1, gloss: 0.45, shadow: 0.5, ao: 0.35, ambient: 0.4 });
  // the sun behind the window: brighter toward the dial
  const lv = lightVec(light == null ? 315 : light), sunX = ww/2 - lv.lx*ww*0.45, sunY = wh/2 - lv.ly*wh*0.45, diag = Math.hypot(ww, wh);
  // the light on the FRONT of the glass: toward the dial, raking as the dial's handle nears the rim; Blinn's half vector, the viewer overhead
  const tl = Math.min(1, Math.hypot(lv.lx, lv.ly)), el = (90 - tl*70)*Math.PI/180, lm2 = tl > 1e-6 ? tl : 1;
  const FX = -lv.lx/lm2*Math.cos(el), FY = -lv.ly/lm2*Math.cos(el), FZ = Math.sin(el), HL = Math.hypot(FX, FY, FZ + 1) || 1, HX = FX/HL, HY = FY/HL, HZ = (FZ + 1)/HL;
  // each pane's own: its brightness, the run of its streaks, its lean (from its number: the same pane, the same glass)
  const panes = new Map(), paneOf = p => { let P = panes.get(p); if(P) return P; const R = mulberry32((p*2147483647) >>> 0);
    const sh = 0.82 + R()*0.3, ang = R()*Math.PI, ta = R()*Math.PI*2, tm = 0.04 + R()*0.22;
    P = { sh, cs: Math.cos(ang), sn: Math.sin(ang), nx: Math.cos(ta)*tm, ny: Math.sin(ta)*tm, nz: Math.sqrt(1 - tm*tm), k: (p*997) % 1 }; panes.set(p, P); return P; };
  const bub = unit*0.022, hashB = (cx, cy, k) => { const s = Math.sin(cx*127.1 + cy*311.7 + k*74.7)*43758.5453; return s - Math.floor(s); };
  const r = new Float32Array(N), g = new Float32Array(N), b = new Float32Array(N), clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
  for(let i = 0; i < N; i++){
    const x = i % ww, y = (i/ww) | 0, er = edge[i]*8;                  // the distance from the lead, in came-widths
    if(lead[i] > 0){
      // lead: dark, patinated, satin (it takes a soft sheen, not a mirror's); a joint's solder brighter, tin-grey
      const pat = 0.85 + 0.3*tooth(x/unit*9, y/unit*9), jt = JT ? JT[i] : 0;
      const gv = ((26 + 30*L.light[i]/L.flat)*pat + 48*L.spec[i] + jt*(30 + 70*L.spec[i]))/255; r[i] = clamp(gv*0.98); g[i] = clamp(gv); b[i] = clamp(gv*1.03); continue;
    }
    const P = paneOf(pane[i]), u = x/unit, v = y/unit; let col = PAL[Math.min(9, Math.floor(pal[i]*10))];
    // beyond a window's outline: the border's glass — the second hue deepened, amber and a clear pale, by turns
    if(win && win[i] < 0.5){ const b3 = Math.floor(pane[i]*3); col = b3 === 0 ? mixA(Bc, [0, 0, 0], 0.45) : b3 === 1 ? mixA(AMBER, Bc, 0.3) : mixA(PALE, Bc, 0.25); }
    if(paneCol){ const sc = paneCol.get(pane[i]); if(sc) col = [0, 1, 2].map(c => col[c] + (sc[c] - col[c])*sceneK); }
    const back = 0.72 + 0.5*Math.max(0, 1 - Math.hypot(x - sunX, y - sunY)/diag*1.4);
    const along = u*P.cs + v*P.sn, across = -u*P.sn + v*P.cs;
    const st = 0.86 + 0.28*streak(along*0.6 + P.k*37, across*7);
    let bk = P.sh*back*st*(0.72 + 0.28*Math.min(1, (er - 1)/2.5));       // darker against the lead (thicker glass)
    // a bubble now and then, held in the glass (seedy glass: full of small ones)
    if(er > 2.5){ const bs = bub*(1 - 0.6*wSeed), cx = Math.floor(x/bs), cy = Math.floor(y/bs), hb = hashB(cx, cy, P.k);
      if(hb < 0.022 + 0.2*wSeed){ const bx = (cx + 0.5)*bs, by = (cy + 0.5)*bs, rr = bs*(0.12 + hb*(8 - 6*wSeed)), d = Math.hypot(x - bx, y - by); if(d < rr) bk *= 1.12 + 0.2*(d/rr); } }
    // hammered: a field of shallow dimples, each a lens that gathers the light behind it
    let dimX = 0, dimY = 0;
    if(wHam > 0){ const ds = unit*0.012, cx = Math.floor(x/ds), cy = Math.floor(y/ds), jx = (hashB(cx, cy, 3.1) - 0.5)*0.6, jy = (hashB(cx, cy, 5.7) - 0.5)*0.6;
      const ox = x/ds - cx - 0.5 - jx, oy = y/ds - cy - 0.5 - jy, dd = Math.min(1, Math.hypot(ox, oy)*1.6);
      dimX = ox*wHam*0.9; dimY = oy*wHam*0.9; bk *= 1 + wHam*(0.22*(1 - dd*dd) - 0.08); }
    // opalescent: milky, swirled; it glows with its own colour more than it lets the light through
    if(wOpal > 0){ const sw = swirl(u*1.2 + P.k*13, v*1.2), milk = wOpal*(0.35 + 0.4*sw); bk = bk*(1 - wOpal*0.35) + milk*0.5; col = col.map((c, k) => c + ((PALE[k] + c)/2 - c)*milk*0.6); }
    // the FRONT: the pane's lean and its dome (its normal turning outward toward the lead), rippled
    const gx = edge[i + (x < ww - 1 ? 1 : 0)] - edge[i - (x > 0 ? 1 : 0)], gy = edge[i + (y < wh - 1 ? ww : 0)] - edge[i - (y > 0 ? ww : 0)], gl = Math.hypot(gx, gy) || 1;
    const dome = (1 - edge[i])*0.35, qx = P.nx - gx/gl*dome + dimX, qy = P.ny - gy/gl*dome + dimY, ql = Math.hypot(qx, qy, P.nz) || 1;
    const rip = (L.spec[i] - 0.02)*0.6, nh = Math.max(0, (qx*HX + qy*HY + P.nz*HZ)/ql + rip);
    const flash = Math.pow(nh, 60)*230, roll = Math.pow(nh, 8)*30;
    let rim = 0; if(er < 2.2){ const face = -(gx*FX + gy*FY)/gl; if(face > 0) rim = face*(1 - (er - 1)/1.2)*70; }
    const sheen = (L.spec[i]*70 + flash + roll + Math.max(0, rim))*refl;
    r[i] = clamp((col[0]*bk + sheen)/255); g[i] = clamp((col[1]*bk + sheen)/255); b[i] = clamp((col[2]*bk + sheen)/255);
  }
  return { r, g, b };
}

// ======================= SCATTERED POLYGONS: flakes =======================
/**
 * FLAKES of leaf over whatever is on the canvas: translucent polygons in the
 * leaf's colour, each its own brightness, a dark seam where one overlaps the
 * next. At 0 on the last three knobs they are drawn EXACTLY as they always
 * were:  SHAPE   0: five-to-eight-sided flakes; higher, more of them convex
 *                polygons of every kind (3–10 sides, even or uneven), drawn
 *                out long toward the top
 *        SHEEN   each flake tilting to the dial's light: brighter or darker,
 *                a band of reflection inside it, a highlight on its near edge
 *        GLITTER soft, speckled, noisy highlights over the flakes
 * o: { amt (coverage), zoom (size), shape, sheen, glitter, leaf: {r,g,b}, light, px }
 */
export function drawFlakes(ctx, w, h, o){
  const amt = o.amt ?? 1, zoom = o.zoom ?? 1, px = o.px || cpx, leaf = o.leaf;
  const shapeV = Math.max(0, Math.min(1, o.shape || 0)), sheen = Math.max(0, Math.min(1, o.sheen || 0)), glitter = Math.max(0, Math.min(1, o.glitter || 0));
  const lv = lightVec(o.light == null ? 315 : o.light), lm = Math.hypot(lv.lx, lv.ly) || 1, TX = -lv.lx/lm, TY = -lv.ly/lm;   // toward the light
  // a tone of the leaf: k > 1 lifts it toward white (keeping its hue), k < 1 darkens it
  const tone = (k, a) => { const f = v => Math.round(k > 1 ? v + (255 - v)*Math.min(1, k - 1) : v*k); return `rgba(${f(leaf.r)},${f(leaf.g)},${f(leaf.b)},${a})`; };
  const unit = Math.max(w, h);
  const flakes = Math.max(10, Math.round((120 + Math.random()*90)*amt));
  for(let i = 0; i < flakes; i++){
    const cx = Math.random()*w, cy = Math.random()*h;
    const r = unit*(0.015 + Math.random()*0.055)*zoom;
    const sides = 5 + Math.floor(Math.random()*4);
    const rot = Math.random()*Math.PI*2;
    const pts = [];
    for(let s = 0; s < sides; s++){ const a = rot + (s/sides)*Math.PI*2, rr = r*(0.55 + Math.random()*0.7); pts.push([cx + Math.cos(a)*rr, cy + Math.sin(a)*rr]); }
    // SHAPE (only drawn when the knob is up): CONVEX polygons, their corners on an ellipse in order, so none folds in on itself
    if(shapeV > 0 && Math.random() < shapeV){
      const stretch = 1 + Math.random()*shapeV*shapeV*2.6;                            // up to ~3.6 : 1 at the top
      // 3 … 10 sides, most often few (a many-sided one drawn long reads as an oval, so long ones keep to six)
      const n = Math.min(stretch > 1.8 ? 6 : 10, 3 + Math.floor(Math.pow(Math.random(), 1.4)*(3 + shapeV*5.99)));
      const even = Math.random() < 0.35 + 0.3*(1 - shapeV);                           // some are regular, the rest uneven
      const ca = Math.cos(rot), sa = Math.sin(rot), a = r*Math.sqrt(stretch)*(0.8 + Math.random()*0.4), b = r/Math.sqrt(stretch)*(0.8 + Math.random()*0.4);
      const ang = [];
      for(let s = 0; s < n; s++) ang.push((s + (even ? 0 : (Math.random() - 0.5)*0.85))/n*Math.PI*2);
      ang.sort((p, q) => p - q);
      pts.length = 0;
      for(const t of ang){ const u = Math.cos(t)*a, v = Math.sin(t)*b; pts.push([cx + u*ca - v*sa, cy + u*sa + v*ca]); }
    }
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for(let s = 1; s < pts.length; s++) ctx.lineTo(pts[s][0], pts[s][1]); ctx.closePath();
    // each flake keeps its own brightness, carried in the leaf's colour
    let lift = (178 + Math.floor(Math.random()*66))/210;
    const alpha = 0.16 + Math.random()*0.4;
    // SHEEN: the flake's tilt to the light
    let facing = 0;
    if(sheen > 0){ const ta = Math.random()*Math.PI*2, tm = 0.3 + Math.random()*0.7; facing = (Math.cos(ta)*TX + Math.sin(ta)*TY)*tm; if(facing < 0) lift *= 1 + sheen*0.55*facing; }
    ctx.globalAlpha = alpha;
    if(facing > 0){ const m = sheen*0.5*facing, ch = v => Math.round(Math.min(255, v*lift) + (255 - Math.min(255, v*lift))*m);   // turned to the light: toward white, not a hue
      ctx.fillStyle = `rgb(${ch(leaf.r)},${ch(leaf.g)},${ch(leaf.b)})`; }
    else ctx.fillStyle = `rgb(${Math.min(255, Math.round(leaf.r*lift))},${Math.min(255, Math.round(leaf.g*lift))},${Math.min(255, Math.round(leaf.b*lift))})`;
    ctx.fill();
    if(sheen > 0){
      ctx.save(); ctx.clip();
      // light caught inside the metal: a soft band across the flake, along the light
      const Lb = r*1.4, band = ctx.createLinearGradient(cx + TX*Lb, cy + TY*Lb, cx - TX*Lb, cy - TY*Lb), off = 0.3 + 0.4*Math.random();
      band.addColorStop(0, tone(1.5, 0)); band.addColorStop(Math.max(0, off - 0.18), tone(1.5, 0)); band.addColorStop(off, tone(1.7, 0.55*sheen*(0.5 + 0.5*Math.max(0, facing))));
      band.addColorStop(Math.min(1, off + 0.18), tone(1.5, 0)); band.addColorStop(1, tone(0.5, 0.25*sheen));
      ctx.globalAlpha = Math.min(1, alpha*1.6); ctx.fillStyle = band; ctx.fillRect(cx - Lb*1.5, cy - Lb*1.5, Lb*3, Lb*3);
      // a highlight where its near edge meets the light
      if(facing > 0){ const hx = cx + TX*r*0.55, hy = cy + TY*r*0.55, sp = ctx.createRadialGradient(hx, hy, 0, hx, hy, r*0.7);
        sp.addColorStop(0, `rgba(255,252,240,${(0.7*sheen*facing*facing).toFixed(3)})`); sp.addColorStop(1, 'rgba(255,252,240,0)');
        ctx.globalAlpha = 1; ctx.fillStyle = sp; ctx.fillRect(hx - r, hy - r, r*2, r*2); }
      ctx.restore();
    }
    // the seam where one leaf overlaps the next
    ctx.globalAlpha = 0.10 + Math.random()*0.25;
    ctx.strokeStyle = 'rgb(48,48,48)';
    ctx.lineWidth = Math.max(px(0.5), unit*0.0009);
    ctx.stroke();
    // GLITTER: soft speckled highlights over the flake, noisy
    if(glitter > 0){
      const n = Math.round(glitter*(4 + r*r/(unit*unit)*9000));
      ctx.save(); ctx.clip();
      for(let k = 0; k < n; k++){ const gx = cx + (Math.random() - 0.5)*r*2, gy = cy + (Math.random() - 0.5)*r*2, gr = px(0.6 + Math.random()*Math.random()*3.2);
        const gl = Math.random()**3*(0.35 + 0.65*Math.max(0, 0.5 + facing));
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr*2.4); g.addColorStop(0, `rgba(255,250,235,${(gl*0.9).toFixed(3)})`); g.addColorStop(1, 'rgba(255,250,235,0)');
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(gx - gr*2.4, gy - gr*2.4, gr*4.8, gr*4.8); }
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

const touchRGB = (v, def) => { if(Array.isArray(v)) return v.map(q => Math.round(q*255)); const p = parseHex(def); return [p.r, p.g, p.b]; };
Object.assign(TOUCH_STEPS, {
  panes: { cat: 'Noise', label: 'Panes', ins: [], outs: ['lead', 'edge', 'pane', 'palette', 'window', 'joints'],
    params: [TOUCH_R('size', 'Pane Size', 100, 50, 250), TOUCH_R('leading', 'Leading', 100, 30, 250), TOUCH_R('shape', 'Shape', 25), TOUCH_R('variety', 'Size Variety', 0), TOUCH_R('frame', 'Window: None · Lancet · Arcade · Round', 0)], cost: () => 10,
    run(E, n){ const fr = E.num(n, 'frame', 0), more = { variety: E.num(n, 'variety', 0)/100, frame: fr < 30 ? 0 : fr < 55 ? 1 : fr < 80 ? 3 : 2 };   // (Round stays at the top, where it was)
      const L = paneLayout(E.ww, E.wh, E.num(n, 'size', 100)/100, E.num(n, 'leading', 100)/100, Math.max(0, Math.min(1, E.num(n, 'shape', 25)/100)), more);
      return [L.lead, L.edge, L.pane, L.pal, L.win, L.joint]; } },
  glass: { cat: 'Light & Color', label: 'Stained Glass', ins: ['lead', 'edge', 'pane', 'palette', 'glass hue', 'second hue', 'window', 'scene', 'joints'],
    outs: ['image'], io: { ins: ['field', 'field', 'field', 'field', 'colour', 'colour', 'field', 'image', 'field'], outs: ['image'] },
    params: [TOUCH_R('relief', 'Lead Relief', 100, 25, 300), TOUCH_R('scene', 'Scene', 0), TOUCH_R('texture', 'Cathedral · Hammered · Seedy · Opal', 0), TOUCH_R('reflect', 'Reflectance', 100, 0, 250)], cost: () => 16,
    run(E, n){ const { ww, wh, N, input, asField, ctx } = E;
      const f = j => asField(input(n, j)) || new Float32Array(N);
      return [litGlass({ lead: f(1), edge: (asField(input(n, 2)) || new Float32Array(N).fill(1)), pane: f(3), pal: f(4), win: asField(input(n, 7)), joint: asField(input(n, 9)) }, ww, wh,
        touchRGB(input(n, 5), '#2148A8'), touchRGB(input(n, 6), '#A8182C'), ctx.light, E.num(n, 'relief', 100)/100,
        { scene: E.num(n, 'scene', 0) > 0 && input(n, 8) != null ? E.asImage(input(n, 8)) : null, sceneK: E.num(n, 'scene', 0)/100,   // (the scene is only made when it is wanted)
          texture: E.num(n, 'texture', 0)/100, reflect: E.num(n, 'reflect', 100)/100 })]; } },
  flakes: { cat: 'Marks', label: 'Flakes', ins: ['base', 'leaf hue'], outs: ['image', 'mask'], io: { ins: ['image', 'colour'], outs: ['image', 'field'] },
    params: [TOUCH_R('size', 'Leaf Size', 100, 60, 360), TOUCH_R('coverage', 'Coverage', 100, 20, 260), TOUCH_R('shape', 'Shape', 0), TOUCH_R('sheen', 'Sheen', 0), TOUCH_R('glitter', 'Glitter', 0)], cost: () => 4,
    opts(E, n){ const c = touchRGB(E.input(n, 2), '#E0B38D');
      return { amt: E.num(n, 'coverage', 100)/100, zoom: Math.max(0.25, E.num(n, 'size', 100)/100), shape: E.num(n, 'shape', 0)/100, sheen: E.num(n, 'sheen', 0)/100,
        glitter: E.num(n, 'glitter', 0)/100, leaf: { r: c[0], g: c[1], b: c[2] }, light: E.ctx.light, px: E.canvasPass ? cpx : E.px }; },
    paint(E, n){ const [c, x] = kitPicture(E.input(n, 1), E.ww, E.wh); drawFlakes(x, E.ww, E.wh, this.opts(E, n)); return [c, null]; },
    run(E, n){ const [c, x] = kitPicture(E.input(n, 1), E.ww, E.wh), before = E.lum(E.readCanvas(c));
      drawFlakes(x, E.ww, E.wh, this.opts(E, n)); const im = E.readCanvas(c), after = E.lum(im), m = new Float32Array(E.N);
      for(let i = 0; i < E.N; i++) m[i] = Math.min(1, Math.abs(after[i] - before[i])*6);
      return [im, m]; } },
});

// ─────────────────────────────────────────────────────────────────────────────
// UNDER GLASS (Ruby: a glass to lay over another surface, through Two Surfaces or a Blend in the Athanor).
// A sheet of glass shows what lies under it, bent a little, and adds only what the glass itself catches: a window
// it reflects, scratches glinting toward the light, the oil of fingers, water spots and dust, and cracks if it is
// broken. Over mid-gray, clean glass that catches nothing is exactly mid-gray, so its blend leaves the page alone.
//
//   a pane laid flat —
//   the room it will not let in
//   shines on its surface

// where the light's own reflection falls on the sheet, in page units: the page's middle when the light is
// overhead, sliding toward the light as the dial's handle is drawn out (past the edge when the light is low)
const ugUnit = (aspX, aspY, deg, reach) => { const a = (deg - 90)*Math.PI/180, d = reach*0.62*Math.hypot(aspX, aspY)/2;
  return { x: aspX/2 + Math.cos(a)*d, y: aspY/2 + Math.sin(a)*d, dx: Math.cos(a), dy: Math.sin(a) }; };
const ugLight = (E, n, dirPort, reachPort) => { const dv = dirPort ? E.input(n, dirPort) : null, rv = reachPort ? E.input(n, reachPort) : null;
  return { deg: typeof dv === 'number' ? dv*360 : (E.ctx.light ?? 315), reach: typeof rv === 'number' ? rv : Math.max(0, Math.min(1.3, (E.ctx.lightTilt ?? 100)/100)) }; };
const ugStep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a)/(b - a))); return t*t*(3 - 2*t); };

// SCRATCHES: hairlines in bunches (things slid across the glass) and, with Swirl, the arcs a cloth leaves wiping
// it round and round. Each scratch is its own draw (`mulberry32` from its number), so more Scratches adds scratches
// and moves none. A scratch is a tiny groove: it throws the light back only across itself, so it glints where it
// runs at right angles to the way toward the light's reflection, and round a wiped sheet the glints ring the light.
function ugScratchLines(aspX, aspY, o){
  const R = Math.random, salt = (R()*4294967296) >>> 0, area = aspX*aspY, n = Math.round(o.count*480*area), lines = [];
  const bunches = [], wipes = [];
  for(let k = 0; k < 6; k++) bunches.push({ x: R()*aspX, y: R()*aspY, a: R()*Math.PI, s: 0.12 + R()*0.3 });
  for(let k = 0; k < 5; k++) wipes.push({ x: (R()*1.1 - 0.05)*aspX, y: (R()*1.1 - 0.05)*aspY });
  const nb = 3 + (salt % 4), nw = 2 + (salt >>> 3) % 4;
  for(let k = 0; k < n; k++){
    const r = mulberry32((salt + Math.imul(k + 1, 0x9E3779B1)) >>> 0), depth = 0.25 + 0.75*Math.pow(r(), 1.8), wide = 0.6 + r()*0.8, kind = r(), pick = r(), a = r(), b = r(), c = r(), d = r();
    if(kind < o.swirl*0.9){
      // a wipe: an arc about one of the cloth's centres
      const W = wipes[Math.floor(pick*nw)], rad = 0.02 + Math.pow(a, 0.8)*0.55, a0 = b*Math.PI*2, span = (0.04 + c*0.3)*(0.3 + 1.4*o.length)/Math.sqrt(rad + 0.05);
      const steps = Math.max(2, Math.ceil(span/0.04)), pts = [];
      for(let s = 0; s <= steps; s++){ const t = a0 + span*s/steps; pts.push([W.x + Math.cos(t)*rad, W.y + Math.sin(t)*rad]); }
      lines.push({ pts, depth, wide });
    } else {
      const B = pick < 0.7 ? bunches[Math.floor(pick/0.7*nb)] : null;
      const ang = B ? B.a + (a - 0.5)*0.22 : a*Math.PI, cx = B ? B.x + (b - 0.5)*B.s*2 : b*aspX, cy = B ? B.y + (c - 0.5)*B.s*2 : c*aspY;
      const len = (0.012 + Math.pow(d, 2.2)*0.32)*(0.3 + 1.4*o.length), sag = (r() - 0.5)*0.16*len, steps = Math.max(2, Math.ceil(len/0.02)), pts = [], ux = Math.cos(ang), uy = Math.sin(ang);
      for(let s = 0; s <= steps; s++){ const t = s/steps - 0.5, q = sag*(1 - 4*t*t); pts.push([cx + ux*t*len - uy*q, cy + uy*t*len + ux*q]); }
      lines.push({ pts, depth, wide });
    }
  }
  return lines;
}
function ugDrawScratches(lines, ww, wh, unit, hot, o, px){
  const [sc, sx] = kitCanvas(ww, wh), [gc, gx] = kitCanvas(ww, wh);
  for(const x of [sx, gx]){ x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh); x.strokeStyle = '#fff'; x.lineCap = 'butt'; }
  const thin = px(0.8), k = 2 + o.sharp*60, spread = 0.12 + 0.6*(1 - o.sharp);
  for(const L of lines){
    let w = px(1.8)*o.width*L.wide, a = L.depth; if(w < thin){ a *= w/thin; w = thin; }
    sx.lineWidth = gx.lineWidth = w;
    const P = L.pts, m = P.length - 1;
    for(let s = 0; s < m; s++){
      const x0 = P[s][0], y0 = P[s][1], x1 = P[s + 1][0], y1 = P[s + 1][1], taper = Math.sqrt(Math.sin(Math.PI*(s + 0.5)/m)), al = a*taper;
      sx.globalAlpha = al; sx.beginPath(); sx.moveTo(x0*unit, y0*unit); sx.lineTo(x1*unit, y1*unit); sx.stroke();
      // the glint: the groove lying across the way to the light's reflection, brightest near it
      const tx = x1 - x0, ty = y1 - y0, hx = hot.x - (x0 + x1)/2, hy = hot.y - (y0 + y1)/2, tl = Math.hypot(tx, ty) || 1, hl = Math.hypot(hx, hy) || 1;
      const g = Math.pow(Math.abs(tx*hy - ty*hx)/(tl*hl), k)*(0.25 + 0.75*Math.exp(-(hl*hl)/spread))*al;
      if(g > 0.006){ gx.globalAlpha = Math.min(1, g*2); gx.beginPath(); gx.moveTo(x0*unit, y0*unit); gx.lineTo(x1*unit, y1*unit); gx.stroke(); }
    }
  }
  return [sc, gc];
}

// SMUDGES: what hands and weather leave on glass. Fingerprints, a hand's few at a time (whorls, loops and arches,
// each pressed harder on one side), smears where something wiped it, water spots (dried rings, in splashes), and
// dust (specks, and a few fibres). Ridges finer than the grid can show fade into the smudge they make together.
function ugSmudges(ww, wh, unit, o, px){
  const N = ww*wh, R = Math.random, salt = (R()*4294967296) >>> 0, aspX = ww/unit, aspY = wh/unit, area = aspX*aspY;
  const oil = new Float32Array(N), spots = new Float32Array(N), warp = fbmSampler(3, 3), grain = fbmSampler(20, 2);
  const box = (cx, cy, r) => [Math.max(0, Math.floor((cx - r)*unit)), Math.min(ww - 1, Math.ceil((cx + r)*unit)), Math.max(0, Math.floor((cy - r)*unit)), Math.min(wh - 1, Math.ceil((cy + r)*unit))];
  // FINGERPRINTS: a touch is two to four fingertips along an arc, pointing one way
  const touches = Math.round(o.prints*4.5*area);
  for(let t = 0; t < touches; t++){
    const r = mulberry32((salt + Math.imul(t + 1, 0x85EBCA6B)) >>> 0);
    const hx = r()*aspX, hy = r()*aspY, ha = r()*Math.PI*2, fingers = 1 + Math.floor(r()*4), Rp = 0.036*o.size*(0.85 + r()*0.3);
    for(let f = 0; f < fingers; f++){
      const off = (f - (fingers - 1)/2)*Rp*1.9, fwd = -0.3*off*off/Rp;
      const cx = hx + Math.cos(ha + Math.PI/2)*off + Math.cos(ha)*fwd, cy = hy + Math.sin(ha + Math.PI/2)*off + Math.sin(ha)*fwd;
      const pa = ha + (r() - 0.5)*0.5, ca = Math.cos(pa), sa = Math.sin(pa), nr = 12 + r()*5, kind = r(), side = r() < 0.5 ? -1 : 1, spiral = r() < 0.5 ? 0 : side;
      const pdx = r()*2 - 1, pdy = r()*2 - 1, str = 0.55 + 0.45*r(), ox = r(), oy = r();
      const period = Rp/nr*unit, rc = Math.max(0, Math.min(1, (period - 1.6)/2.4));
      const [x0, x1, y0, y1] = box(cx, cy, Rp*1.2);
      for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){
        const u = (x + 0.5)/unit - cx, v = (y + 0.5)/unit - cy, lx = (u*sa - v*ca)/Rp, ly = (u*ca + v*sa)/Rp, rho = Math.hypot(lx/0.74, ly);
        if(rho > 1.2) continue;
        let ph;
        if(kind < 0.35) ph = Math.hypot(lx*1.08, ly - 0.08)*nr + spiral*Math.atan2(ly, lx)/(2*Math.PI);   // a whorl (or a spiral one)
        else if(kind < 0.85){   // a loop: ridges nested round its axis, which runs out to one side
          const ax = side*1.4, ay = -0.9, bx = 0, by = 0.12, ex = ax - bx, ey = ay - by, q = Math.max(0, Math.min(1, ((lx - bx)*ex + (ly - by)*ey)/(ex*ex + ey*ey)));
          ph = Math.hypot(lx - bx - q*ex, ly - by - q*ey)*nr;
        } else ph = (ly + 0.5*Math.exp(-(lx*lx)/0.3))*nr;   // an arch
        ph += (warp(ox + lx*0.5, oy + ly*0.5) - 0.5)*2.4;
        const ridge = 0.5 + 0.5*Math.cos(ph*2*Math.PI), rv = 0.5 + (ridge - 0.5)*rc;
        const rim = ugStep(0, 0.45, 1 - rho - (warp(oy + lx*0.7, ox + ly*0.7) - 0.5)*0.4), press = Math.max(0, Math.min(1, 0.6 + 0.8*(lx*pdx + ly*pdy)));
        const i = y*ww + x, m = rim*press*str*(0.15 + 0.85*rv);
        if(m > oil[i]) oil[i] = m;
      }
    }
  }
  // SMEARS: something wiped across it, leaving streaks along the stroke, thinning toward its end
  const smears = Math.round(o.smears*4*area);
  for(let s = 0; s < smears; s++){
    const r = mulberry32((salt + Math.imul(s + 1, 0xC2B2AE35)) >>> 0);
    const Rr = 0.12 + r()*0.5, mx = r()*aspX, my = r()*aspY, a = r()*Math.PI*2, cx = mx - Math.cos(a)*Rr, cy = my - Math.sin(a)*Rr;
    const span = (0.08 + r()*0.3)/Rr, hw = (0.012 + r()*0.03)*o.size, str = 0.5 + 0.5*r(), gy = r();
    const [x0, x1, y0, y1] = box(cx, cy, Rr + hw);
    for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){
      const dx = (x + 0.5)/unit - cx, dy = (y + 0.5)/unit - cy, rr = Math.hypot(dx, dy), across = (rr - Rr)/hw;
      if(across <= -1 || across >= 1) continue;
      let ang = Math.atan2(dy, dx) - a; ang -= Math.round(ang/(2*Math.PI))*2*Math.PI;
      const t = ang/span + 0.5; if(t <= 0 || t >= 1) continue;
      const streak = grain(0.5 + across*0.4, gy), env = (1 - across*across)*(1 - across*across)*Math.pow(Math.sin(Math.PI*t), 0.6)*(1 - 0.55*t);
      const i = y*ww + x; oil[i] = Math.min(1, oil[i] + env*str*0.75*(0.2 + 0.8*ugStep(0.35, 0.75, streak)));
    }
  }
  // WATER SPOTS: dried drops, a splash of them at a time; the minerals gather at each one's edge
  const splashes = o.spots > 0 ? Math.max(1, Math.round(o.spots*3*area)) : 0;
  for(let s = 0; s < splashes; s++){
    const r = mulberry32((salt + Math.imul(s + 1, 0x27D4EB2F)) >>> 0), sx = r()*aspX, sy = r()*aspY, m = Math.round(4 + o.spots*26*r());
    for(let k = 0; k < m; k++){
      const q = Math.pow(r(), 0.7)*0.12, an = r()*Math.PI*2, cx = sx + Math.cos(an)*q, cy = sy + Math.sin(an)*q, rs = (0.003 + Math.pow(r(), 2)*0.013)*o.size, str = 0.5 + 0.5*r();
      const f1 = r()*6.28, f2 = r()*6.28, w1 = 0.01 + r()*0.04, w2 = r()*0.03;   // never quite round
      const [x0, x1, y0, y1] = box(cx, cy, rs*1.5);
      for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){
        const ex = (x + 0.5)/unit - cx, ey = (y + 0.5)/unit - cy, th = Math.atan2(ey, ex), d = Math.hypot(ex, ey)/(rs*(1 + w1*Math.sin(3*th + f1) + w2*Math.sin(5*th + f2))); if(d > 1.3) continue;
        const e = (d - 1)/0.14, v = str*(Math.exp(-(e*e))*0.9 + (d < 1 ? 0.16 : 0)), i = y*ww + x;
        if(v > spots[i]) spots[i] = v;
      }
    }
  }
  // DUST: specks of every size, and now and then a fibre
  const [dc, dx] = kitCanvas(ww, wh); dx.fillStyle = '#000'; dx.fillRect(0, 0, ww, wh); dx.fillStyle = dx.strokeStyle = '#fff'; dx.lineCap = 'round';
  const specks = Math.round(o.dust*900*area), floor = px(0.7);
  for(let k = 0; k < specks; k++){
    const r = mulberry32((salt + Math.imul(k + 1, 0x165667B1)) >>> 0);
    const x = r()*ww, y = r()*wh; let rad = px(0.45 + Math.pow(r(), 3)*2.4), al = 0.35 + 0.65*r();
    if(rad < floor){ al *= (rad/floor)*(rad/floor); rad = floor; }
    dx.globalAlpha = al; dx.beginPath(); dx.arc(x, y, rad, 0, Math.PI*2); dx.fill();
  }
  const fibres = Math.round(o.dust*28*area);
  for(let k = 0; k < fibres; k++){
    const r = mulberry32((salt + Math.imul(k + 1, 0xD3A2646C)) >>> 0);
    let x = r()*aspX, y = r()*aspY, h = r()*Math.PI*2; const len = 0.01 + r()*0.04, steps = 10, turn = (r() - 0.5)*0.9;
    dx.globalAlpha = 0.45 + 0.4*r(); dx.lineWidth = Math.max(floor, px(0.6 + r()*0.6)); dx.beginPath(); dx.moveTo(x*unit, y*unit);
    for(let s = 0; s < steps; s++){ h += turn + (r() - 0.5)*0.8; x += Math.cos(h)*len/steps; y += Math.sin(h)*len/steps; dx.lineTo(x*unit, y*unit); }
    dx.stroke();
  }
  return { oil, spots, dust: dc };
}

// WINDOW REFLECTION: what a pane or a polished face mirrors from the room. A window's bright bands (one wide, the
// rest narrower beside it), lying across the way the light comes from and turned by Slant, brightest about where
// the light's own reflection falls and fading along and away; and a soft glow of sky toward the light. A Bend map
// ripples the bands, as old glass bends what it shows.
function ugReflection(ww, wh, unit, hot, o, B){
  const N = ww*wh, R = Math.random, out = new Float32Array(N), aspX = ww/unit, aspY = wh/unit, half = Math.hypot(aspX, aspY)/2;
  const sl = o.slant*Math.PI/180, nx = hot.dx*Math.cos(sl) - hot.dy*Math.sin(sl), ny = hot.dx*Math.sin(sl) + hot.dy*Math.cos(sl);
  const bands = [], nb = Math.max(1, Math.round(o.bands)); let at = 0;
  for(let k = 0; k < nb; k++){ const w = (k === 0 ? 1 : 0.2 + R()*0.55)*o.width*0.2, gap = (0.015 + R()*0.07)*o.width;
    bands.push({ c: at + w/2, w, b: k === 0 ? 0.8 : 0.4 + R()*0.4 }); at += w + gap; }
  const mid = at/2 + (R() - 0.5)*0.08, len = 0.7 + R()*0.5, soft = 0.04 + 0.96*o.soft;
  for(const b of bands) b.c -= mid;
  const cx = aspX/2, cy = aspY/2;
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const i = y*ww + x, u = (x + 0.5)/unit, v = (y + 0.5)/unit, px = u - hot.x, py = v - hot.y;
    const s = px*nx + py*ny + (B ? (B[i] - 0.5)*0.03*o.ripple : 0), t = -px*ny + py*nx;
    let val = 0;
    for(const b of bands){ const e = Math.max(1.5/unit, soft*b.w*0.5), lo = b.c - b.w/2, hi = b.c + b.w/2;
      if(s < lo - e || s > hi + e) continue;
      val += b.b*ugStep(lo - e, lo + e, s)*(1 - ugStep(hi - e, hi + e, s))*(0.8 + 0.2*(s - lo)/b.w); }
    val *= Math.exp(-(t*t)/(len*len))*Math.exp(-Math.max(0, Math.abs(s) - 0.15)*1.6);
    // the sky: a soft glow on the side the light comes from
    const sky = o.sky*0.35*ugStep(-0.9, 1, ((u - cx)*hot.dx + (v - cy)*hot.dy)/half);
    out[i] = Math.min(1, val + sky);
  }
  return out;
}

// SHATTER: glass broken by a blow. Cracks run out from where it was struck, rings of cracks cross them (the
// spider's web), and the heart is crushed to a star; Shards gives each piece between its own gray (the unbroken
// pane black), so a Glass Pane can bend and mirror each piece its own way.
function ugShatter(aspX, aspY, o){
  const R = Math.random, salt = (R()*4294967296) >>> 0, cracks = [], cells = [];
  const impacts = o.breaks <= 0 ? 0 : 1 + (o.breaks > 0.55 ? 1 : 0) + (o.breaks > 0.88 ? 1 : 0);
  for(let m = 0; m < impacts; m++){
    const r = mulberry32((salt + Math.imul(m + 1, 0x9E3779B1)) >>> 0);
    const cx = (0.15 + r()*0.7)*aspX, cy = (0.15 + r()*0.7)*aspY, reach = (0.25 + 0.6*o.breaks)*(0.8 + 0.4*r())*o.reach*(m ? 0.6 : 1);
    const nr = 6 + Math.round(o.rays*14 + r()*3), rays = [];
    for(let k = 0; k < nr; k++){
      const base = (k + (r() - 0.5)*0.6)/nr*Math.PI*2, L = reach*(0.45 + 0.75*r()), pts = [[cx, cy, 0]];
      let h = base, x = cx, y = cy, d = 0;
      while(d < L){ h += (r() - 0.5)*0.16 + (base - h)*0.15; x += Math.cos(h)*0.012; y += Math.sin(h)*0.012; d = Math.hypot(x - cx, y - cy); pts.push([x, y, d]); }
      rays.push(pts); cracks.push(pts.map(p => [p[0], p[1]]));
    }
    // the rings: a vertex on each ray at each ring's radius, joined across to the next ray's, sagging inward
    const nR = 2 + Math.round(o.rings*6), radius = j => reach*0.06*Math.pow(0.85/0.06, j/Math.max(1, nR - 1));
    const vtx = rays.map(pts => { const out = []; for(let j = 0; j < nR; j++){ const want = radius(j)*(0.9 + 0.2*r()), q = pts.findIndex(p => p[2] >= want); out.push(q > 0 ? q : -1); } return out; });
    const arc = [];   // arc[k][j]: the crack from ray k to ray k+1 at ring j (null: not cracked through)
    for(let k = 0; k < nr; k++){ arc.push([]); const A = rays[k], B = rays[(k + 1) % nr];
      for(let j = 0; j < nR; j++){ const qa = vtx[k][j], qb = vtx[(k + 1) % nr][j];
        if(qa < 0 || qb < 0){ arc[k].push(null); continue; }
        const p = A[qa], q = B[qb], pts = [[p[0], p[1]]];
        for(let s = 1; s < 3; s++){ const t = s/3, mx = p[0] + (q[0] - p[0])*t, my = p[1] + (q[1] - p[1])*t, sag = 0.06 + (r() - 0.5)*0.05;
          pts.push([mx + (cx - mx)*sag, my + (cy - my)*sag]); }
        pts.push([q[0], q[1]]);
        const cracked = r() < 0.8 || j === 0; arc[k].push({ pts, cracked }); if(cracked) cracks.push(pts); }
    }
    // the crushed heart
    for(let k = 0; k < 26; k++){ const a = r()*Math.PI*2, l = 0.003 + r()*0.018, b = a + (r() - 0.5)*1.2, q = r()*0.006;
      cracks.push([[cx + Math.cos(b)*q, cy + Math.sin(b)*q], [cx + Math.cos(a)*(q + l), cy + Math.sin(a)*(q + l)]]); }
    // the pieces: between two rays and two rings (an uncracked ring leaves the two pieces one)
    const ids = new Map(), root = key => { while(ids.get(key) !== key) key = ids.get(key); return key; };
    for(let k = 0; k < nr; k++) for(let j = -1; j < nR - 1; j++){ const key = k*64 + j + 1; ids.set(key, key); }
    for(let k = 0; k < nr; k++) for(let j = 0; j < nR - 1; j++){ const a = arc[k][j]; if(a && !a.cracked){ const lo = root(k*64 + j), hi = root(k*64 + j + 1); if(lo !== hi) ids.set(hi, lo); } }
    for(let k = 0; k < nr; k++){ const A = rays[k], B = rays[(k + 1) % nr];
      for(let j = -1; j < nR - 1; j++){
        const a0 = j < 0 ? 0 : vtx[k][j], a1 = vtx[k][j + 1], b0 = j < 0 ? 0 : vtx[(k + 1) % nr][j], b1 = vtx[(k + 1) % nr][j + 1];
        if(a0 < 0 || a1 < 0 || b0 < 0 || b1 < 0 || !arc[k][j + 1] || (j >= 0 && !arc[k][j])) continue;
        const poly = [];
        for(let q = a0; q <= a1; q++) poly.push(A[q]);
        for(const p of arc[k][j + 1].pts) poly.push(p);
        for(let q = b1; q >= b0; q--) poly.push(B[q]);
        if(j >= 0) for(const p of arc[k][j].pts.slice().reverse()) poly.push(p);
        const id = root(k*64 + j + 1), h = mulberry32((salt ^ Math.imul(m + 1, 0x632BE5AB) ^ Math.imul(id + 7, 0x85EBCA6B)) >>> 0)();
        cells.push({ poly, v: 0.1 + 0.9*h });
      }
    }
  }
  return { cracks, cells };
}

// GLASS PANE: the glass itself, over a picture (or mid-gray). What lies under it is seen bent by the glass's
// waves and, through a broken pane, each shard its own way; then the light the glass gives back is added as light
// adds (a screen): the reflection (dulled where oil scatters it), the glints, the smudges, spots and dust, the
// cracks. A thick edge darkens it, green in its depth. Clean glass catching nothing is the picture exactly.
function ugPane(E, n){
  const { ww, wh, N, unit, input, asField, asImage, num, ctx } = E;
  const pic = asImage(input(n, 1) ?? 128/255), f = j => input(n, j) != null ? asField(input(n, j)) : null;
  const Rf = f(2), G = f(3), O = f(4), D = f(5), Sp = f(6), C = f(7), SH = f(8), W = f(9);
  const rk = num(n, 'reflect', 60)/100, gk = num(n, 'glint', 80)/100, ok = num(n, 'smudge', 60)/100, dk = num(n, 'dust', 70)/100, bk = num(n, 'bend', 30)/100, ek = num(n, 'edge', 0)/100;
  const la = ((ctx.light ?? 315) - 90)*Math.PI/180, lx = Math.cos(la), ly = Math.sin(la);
  const halo = C ? E.boxBlur(C, Math.max(1, E.px(3))) : null, bevel = (0.004 + 0.035*ek)*unit;
  const P = [pic.r, pic.g, pic.b], out = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, Q = [out.r, out.g, out.b];
  const look = (F, x, y) => { x = Math.max(0, Math.min(ww - 1.001, x)); y = Math.max(0, Math.min(wh - 1.001, y)); const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0*ww + x0, j = Math.min(wh - 1, y0 + 1)*ww + x0, x1 = x0 < ww - 1 ? 1 : 0;
    return (F[i]*(1 - fx) + F[i + x1]*fx)*(1 - fy) + (F[j]*(1 - fx) + F[j + x1]*fx)*fy; };
  const edgeTint = [0.84, 0.97, 0.91];
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const i = y*ww + x;
    // where the eye lands through the glass: bent along the waves' slope, and by each shard's tilt
    let ox = 0, oy = 0;
    if(W && bk > 0){ const gx = (W[y*ww + Math.min(ww - 1, x + 1)] - W[y*ww + Math.max(0, x - 1)])*0.5, gy = (W[Math.min(wh - 1, y + 1)*ww + x] - W[Math.max(0, y - 1)*ww + x])*0.5;
      ox += gx*unit*unit*bk*0.006; oy += gy*unit*unit*bk*0.006; }
    const sh = SH ? SH[i] : 0, tx = sh > 0.02 ? Math.sin(sh*917.3) : 0, ty = sh > 0.02 ? Math.cos(sh*533.7) : 0;
    if(sh > 0.02){ ox += tx*unit*0.006*(0.3 + bk); oy += ty*unit*0.006*(0.3 + bk); }
    // the light the glass gives back (a shard mirrors the room from its own angle)
    const Rv = Rf ? (sh > 0.02 ? look(Rf, x + tx*unit*0.09, y + ty*unit*0.09) : Rf[i]) : 0, oil = O ? O[i] : 0;
    let L = rk*Rv*(1 - 0.75*ok*oil) + ok*oil*0.34 + gk*(G ? G[i] : 0) + dk*((D ? D[i] : 0)*0.9 + (Sp ? Sp[i] : 0)*0.8);
    if(sh > 0.02) L += 0.035*Math.max(0, tx*lx + ty*ly);
    if(C) L += 0.85*C[i] + 0.3*halo[i];   // the faces of a crack catch the light, and glow a little
    // a thick edge: the bevel facing the light catches it, a bright line where it meets the face, green in its depth
    let tint = 0;
    if(ek > 0){ const dl = x + 0.5, dr = ww - x - 0.5, dt = y + 0.5, db = wh - y - 0.5, d = Math.min(dl, dr, dt, db);
      if(d < bevel*1.2){ const q = d/bevel, nx = d === dl ? -1 : d === dr ? 1 : 0, ny = d === dt ? -1 : d === db ? 1 : 0, face = Math.max(0, nx*lx + ny*ly);
        const inb = q < 1 ? 1 : 0, ln = (q - 1)/0.08;
        L += inb*face*0.35*Math.sin(Math.PI*Math.min(1, q)) + 0.25*Math.exp(-(ln*ln)); tint = inb*(1 - q*0.6); } }
    L = Math.max(0, Math.min(1, L));
    for(let c = 0; c < 3; c++){
      let v = (ox || oy) ? look(P[c], x + ox, y + oy) : P[c][i];
      v = 1 - (1 - v)*(1 - L);
      if(tint > 0) v *= 1 - tint*(1 - edgeTint[c]);
      Q[c][i] = v; }
  }
  return out;
}

Object.assign(TOUCH_STEPS, {
  scratches: { cat: 'Marks', label: 'Scratches', ins: ['light from', 'light height'], outs: ['scratches', 'glints'], io: { ins: ['value', 'value'], outs: ['field', 'field'] },
    doc: 'Fine scratches in glass or a polished face: straight, in bunches, or swirled where a cloth wiped it, with the glints they throw toward the light.',
    params: [TOUCH_R('count', 'Scratches', 40), TOUCH_R('length', 'Length', 50), TOUCH_R('swirl', 'Swirl', 30), TOUCH_R('width', 'Width', 100, 30, 300), TOUCH_R('sharp', 'Glint Sharpness', 50), TOUCH_R('variation', 'Variation', 0, 0, 99)], cost: () => 4,
    run(E, n){ const { ww, wh, unit, num } = E, L = ugLight(E, n, 1, 2), hot = ugUnit(ww/unit, wh/unit, L.deg, L.reach);
      const o = { count: num(n, 'count', 40)/100, length: num(n, 'length', 50)/100, swirl: num(n, 'swirl', 30)/100, width: num(n, 'width', 100)/100, sharp: num(n, 'sharp', 50)/100 };
      const [sc, gc] = ugDrawScratches(ugScratchLines(ww/unit, wh/unit, o), ww, wh, unit, hot, o, E.px);
      // a glint blooms a little round itself, as bright things do
      const G = E.asField(E.readCanvas(gc)), bloom = E.boxBlur(G, Math.max(1, E.px(4)));
      for(let i = 0; i < G.length; i++) G[i] = Math.min(1, G[i] + bloom[i]*1.6);
      return [E.asField(E.readCanvas(sc)), G]; } },
  smudges: { cat: 'Marks', label: 'Smudges', ins: [], outs: ['oil', 'spots', 'dust'], io: { outs: ['field', 'field', 'field'] },
    doc: 'What hands and weather leave on glass: fingerprints, smears, dried water spots and dust, each as its own gray map.',
    params: [TOUCH_R('prints', 'Fingerprints', 35), TOUCH_R('smears', 'Smears', 30), TOUCH_R('spots', 'Water Spots', 20), TOUCH_R('dust', 'Dust', 30), TOUCH_R('size', 'Size', 100, 40, 250), TOUCH_R('variation', 'Variation', 0, 0, 99)], cost: () => 6,
    run(E, n){ const { ww, wh, unit, num } = E;
      const S = ugSmudges(ww, wh, unit, { prints: num(n, 'prints', 35)/100, smears: num(n, 'smears', 30)/100, spots: num(n, 'spots', 20)/100, dust: num(n, 'dust', 30)/100, size: num(n, 'size', 100)/100 }, E.px);
      return [S.oil, S.spots, E.asField(E.readCanvas(S.dust))]; } },
  reflection: { cat: 'Light & Color', label: 'Window Reflection', ins: ['light from', 'light height', 'bend'], outs: ['reflection'], io: { ins: ['value', 'value', 'field'], outs: ['field'] },
    doc: 'The bright bands of a window mirrored in glass or a polished face, lying about where the light’s own reflection falls.',
    params: [TOUCH_R('bands', 'Bands', 2, 1, 5), TOUCH_R('width', 'Width', 100, 30, 300), TOUCH_R('soft', 'Softness', 35), TOUCH_R('slant', 'Slant', 20, -90, 90), TOUCH_R('sky', 'Sky', 30), TOUCH_R('ripple', 'Ripple', 50), TOUCH_R('variation', 'Variation', 0, 0, 99)], cost: () => 2,
    run(E, n){ const { ww, wh, unit, num } = E, L = ugLight(E, n, 1, 2), B = E.input(n, 3) != null ? E.asField(E.input(n, 3)) : null;
      return [ugReflection(ww, wh, unit, ugUnit(ww/unit, wh/unit, L.deg, L.reach), { bands: num(n, 'bands', 2), width: num(n, 'width', 100)/100, soft: num(n, 'soft', 35)/100, slant: num(n, 'slant', 20),
        sky: num(n, 'sky', 30)/100, ripple: num(n, 'ripple', 50)/100 }, B)]; } },
  shatter: { cat: 'Marks', label: 'Shatter', ins: [], outs: ['cracks', 'shards'], io: { outs: ['field', 'field'] },
    doc: 'Glass broken by a blow: cracks running out from where it was struck, rings of cracks across them, and a gray for each piece.',
    params: [TOUCH_R('breaks', 'Breakage', 60), TOUCH_R('reach', 'Reach', 100, 40, 250), TOUCH_R('rays', 'Rays', 50), TOUCH_R('rings', 'Rings', 50), TOUCH_R('width', 'Crack Width', 100, 30, 300), TOUCH_R('variation', 'Variation', 0, 0, 99)], cost: () => 3,
    run(E, n){ const { ww, wh, unit, num } = E, S = ugShatter(ww/unit, wh/unit, { breaks: num(n, 'breaks', 60)/100, reach: num(n, 'reach', 100)/100, rays: num(n, 'rays', 50)/100, rings: num(n, 'rings', 50)/100 });
      const [cc, cx] = kitCanvas(ww, wh), [sc, sx] = kitCanvas(ww, wh); cx.fillStyle = sx.fillStyle = '#000'; cx.fillRect(0, 0, ww, wh); sx.fillRect(0, 0, ww, wh);
      for(const c of S.cells){ const g = Math.round(c.v*255); sx.fillStyle = `rgb(${g},${g},${g})`; sx.beginPath(); c.poly.forEach((p, k) => k ? sx.lineTo(p[0]*unit, p[1]*unit) : sx.moveTo(p[0]*unit, p[1]*unit)); sx.closePath(); sx.fill(); }
      let w = E.px(2.4)*num(n, 'width', 100)/100, a = 1; const thin = E.px(0.8); if(w < thin){ a *= w/thin; w = thin; }
      cx.strokeStyle = '#fff'; cx.lineWidth = w; cx.globalAlpha = a; cx.lineJoin = cx.lineCap = 'round';
      for(const pts of S.cracks){ cx.beginPath(); pts.forEach((p, k) => k ? cx.lineTo(p[0]*unit, p[1]*unit) : cx.moveTo(p[0]*unit, p[1]*unit)); cx.stroke(); }
      return [E.asField(E.readCanvas(cc)), E.asField(E.readCanvas(sc))]; } },
  glasspane: { cat: 'Light & Color', label: 'Glass Pane', ins: ['picture', 'reflection', 'glints', 'oil', 'dust', 'spots', 'cracks', 'shards', 'waves'], outs: ['picture'],
    io: { ins: ['image', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field'], outs: ['image'] },
    doc: 'A sheet of glass over a picture (or over mid-gray, to lay on another surface): it bends what lies under it and adds the light the glass catches.',
    params: [TOUCH_R('reflect', 'Reflection', 60), TOUCH_R('glint', 'Glints', 80), TOUCH_R('smudge', 'Smudges', 60), TOUCH_R('dust', 'Dust', 70), TOUCH_R('bend', 'Bend', 30), TOUCH_R('edge', 'Edge', 0)], cost: () => 3,
    run(E, n){ return [ugPane(E, n)]; } },
});
