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
import { CPU, lightBasis, lightSparse, lightHeights, lightVec, makeNoiseGrid, sampleNoiseGrid, parseHex, cpx, mulberry32, kitPicture, fbmSampler, withSeed } from './texCore.js';

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
      const sc = 100/Math.max(1, num(n, 'scale', 100)), cr = num(n, 'crests', 22)/100, seed = ((ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0;
      return withSeed(seed, () => {
        const broad = fbmSampler(3, 4), ridge = fbmSampler(5, 3), warp = fbmSampler(3, 2), H = new Float32Array(N);
        for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
          const u = x/unit*sc, v = y/unit*sc, wu = u + (warp(u*0.5, v*0.5) - 0.5)*0.6, wv = v + (warp(v*0.5 + 3.1, u*0.5 + 1.7) - 0.5)*0.6;
          const r = 1 - Math.abs(ridge(wu*0.6, wv*0.6)*2 - 1);
          H[y*ww + x] = (1 - cr)*broad(wu*0.45, wv*0.45) + cr*r*r*r;
        }
        let lo = Infinity, hi = -Infinity; for(let i = 0; i < N; i++){ if(H[i] < lo) lo = H[i]; if(H[i] > hi) hi = H[i]; }
        for(let i = 0; i < N; i++) H[i] = (H[i] - lo)/Math.max(1e-6, hi - lo);
        return [H]; }); } },
  // Every line a promise
  // kept at one height all the way
  // round the hill and home.
  // CONTOUR LINES: the isolines of any gray map (d3-contour's maps, found per pixel: how far the value is from its
  // level, against the slope, so a line keeps one width on steep and gentle ground); every Nth an index line, heavier
  contours: { cat: 'Marks', label: 'Contour Lines', ins: ['height'], outs: ['lines'],
    params: [TOUCH_R('levels', 'Levels', 20, 3, 60), TOUCH_R('weight', 'Line Weight', 100, 25, 400), TOUCH_R('index', 'Index Every', 5, 0, 10), TOUCH_R('strength', 'Strength', 90)], cost: () => 2,
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
export function paneLayout(ww, wh, zoom, amt, order){
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
  // each pane's color slot of the glazier's ten (a patterned window repeats a few, in its rhythm), and its own number
  const RHY = [0, 3, 8, 6, 4, 9].slice(0, 4 + Math.floor(Math.random()*2));
  const slot = S.map(s => s[2] >= 0 ? (s[2]*3 + (s[3] % 2)*5) % 10 : s[2] === -2 ? RHY[s[3] % RHY.length] : Math.floor(Math.random()*10));
  const own = S.map(() => Math.random());
  // the seeds in buckets, for the nearest-seed search (one ring of buckets is enough)
  const bs = sep*1.15, bw = Math.ceil(ww/bs) + 4, bh = Math.ceil(wh/bs) + 4, B2 = new Array(bw*bh);
  S.forEach((s, i) => { const bx = Math.floor(s[0]/bs) + 2, by = Math.floor(s[1]/bs) + 2; if(bx < 0 || by < 0 || bx >= bw || by >= bh) return; (B2[by*bw + bx] || (B2[by*bw + bx] = [])).push(i); });
  const lw = Math.max(0.6, unit*0.0065*amt);                         // the came's half-width
  const lead = new Float32Array(N), edge = new Float32Array(N), pane = new Float32Array(N), pal = new Float32Array(N);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const bx = Math.floor(x/bs) + 2, by = Math.floor(y/bs) + 2;
    let best = -1, bd = Infinity;
    for(let j = by - 1; j <= by + 1; j++) for(let i = bx - 1; i <= bx + 1; i++){ if(i < 0 || j < 0 || i >= bw || j >= bh) continue; const L = B2[j*bw + i]; if(!L) continue;
      for(const k of L){ const dx = S[k][0] - x, dy = S[k][1] - y, d = dx*dx + dy*dy; if(d < bd){ bd = d; best = k; } } }
    // the distance to the nearest bisector: the lead's centre line
    let e = Infinity; const s1 = S[best];
    for(let j = by - 1; j <= by + 1; j++) for(let i = bx - 1; i <= bx + 1; i++){ if(i < 0 || j < 0 || i >= bw || j >= bh) continue; const L = B2[j*bw + i]; if(!L) continue;
      for(const k of L){ if(k === best) continue; const s2 = S[k], gx = s2[0] - s1[0], gy = s2[1] - s1[1], gl = Math.hypot(gx, gy) || 1;
        const dd = ((x - s1[0])*gx + (y - s1[1])*gy)/gl, ed = gl/2 - dd; if(ed < e) e = ed; } }
    const p = y*ww + x, q = e/lw;
    lead[p] = q < 1 ? Math.sqrt(Math.max(0, 1 - q*q)) : 0; edge[p] = Math.min(1, e/(lw*8)); pane[p] = own[best]; pal[p] = (slot[best] + 0.5)/10;
  }
  return { lead, edge, pane, pal };
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
export function litGlass(F, ww, wh, colA, colB, light, relief){
  const { lead, edge, pane, pal } = F, unit = Math.min(ww, wh), N = ww*wh, lwPx = Math.max(0.6, unit*0.0065)*relief;
  const mixA = (a, b, t) => a.map((v, i) => v + (b[i] - v)*t), A = colA, Bc = colB, AMBER = [214, 152, 40], GREEN = [46, 122, 62], PALE = [232, 224, 196];
  const PAL = [A, A, mixA(A, [0, 0, 0], 0.35), Bc, Bc, mixA(Bc, AMBER, 0.5), AMBER, GREEN, mixA(A, PALE, 0.6), PALE];
  const fbm = (cells, oct) => { const gs = []; for(let o = 0; o < oct; o++){ const g = Math.max(2, Math.round(cells*Math.pow(2, o))) + 1; gs.push({ g, grid: makeNoiseGrid(g, g), a: Math.pow(0.5, o) }); }
    const nm = gs.reduce((s, o) => s + o.a, 0); return (u, v) => { let s = 0; for(const o of gs) s += sampleNoiseGrid(o.grid, o.g, o.g, u*(o.g - 1), v*(o.g - 1))*o.a; return s/nm; }; };
  const streak = fbm(4, 3), tooth = fbm(18, 2);
  // the came's relief and the glass's ripple, lit by the dial
  const H = new Float32Array(N);
  for(let i = 0; i < N; i++){ const x = i % ww, y = (i/ww) | 0; H[i] = lead[i] > 0 ? lwPx*(1.6*lead[i] + 0.6) : (tooth(x/unit*2, y/unit*2) - 0.5)*lwPx*0.35; }
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
      // lead: dull grey metal, lit by the dial
      const gv = (34 + 46*L.light[i]/L.flat + 150*L.spec[i])/255; r[i] = clamp(gv); g[i] = clamp(gv); b[i] = clamp(gv*1.04); continue;
    }
    const P = paneOf(pane[i]), u = x/unit, v = y/unit, col = PAL[Math.min(9, Math.floor(pal[i]*10))];
    const back = 0.72 + 0.5*Math.max(0, 1 - Math.hypot(x - sunX, y - sunY)/diag*1.4);
    const along = u*P.cs + v*P.sn, across = -u*P.sn + v*P.cs;
    const st = 0.86 + 0.28*streak(along*0.6 + P.k*37, across*7);
    let bk = P.sh*back*st*(0.72 + 0.28*Math.min(1, (er - 1)/2.5));       // darker against the lead (thicker glass)
    // a bubble now and then, held in the glass
    if(er > 2.5){ const cx = Math.floor(x/bub), cy = Math.floor(y/bub), hb = hashB(cx, cy, P.k);
      if(hb < 0.022){ const bx = (cx + 0.5)*bub, by = (cy + 0.5)*bub, rr = bub*(0.12 + hb*8), d = Math.hypot(x - bx, y - by); if(d < rr) bk *= 1.12 + 0.2*(d/rr); } }
    // the FRONT: the pane's lean and its dome (its normal turning outward toward the lead), rippled
    const gx = edge[i + (x < ww - 1 ? 1 : 0)] - edge[i - (x > 0 ? 1 : 0)], gy = edge[i + (y < wh - 1 ? ww : 0)] - edge[i - (y > 0 ? ww : 0)], gl = Math.hypot(gx, gy) || 1;
    const dome = (1 - edge[i])*0.35, qx = P.nx - gx/gl*dome, qy = P.ny - gy/gl*dome, ql = Math.hypot(qx, qy, P.nz) || 1;
    const rip = (L.spec[i] - 0.02)*0.6, nh = Math.max(0, (qx*HX + qy*HY + P.nz*HZ)/ql + rip);
    const flash = Math.pow(nh, 60)*230, roll = Math.pow(nh, 8)*30;
    let rim = 0; if(er < 2.2){ const face = -(gx*FX + gy*FY)/gl; if(face > 0) rim = face*(1 - (er - 1)/1.2)*70; }
    const sheen = L.spec[i]*70 + flash + roll + Math.max(0, rim);
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
  panes: { cat: 'Noise', label: 'Panes', ins: [], outs: ['lead', 'edge', 'pane', 'palette'],
    params: [TOUCH_R('size', 'Pane Size', 100, 50, 250), TOUCH_R('leading', 'Leading', 100, 30, 250), TOUCH_R('shape', 'Shape', 25)], cost: () => 10,
    run(E, n){ const L = paneLayout(E.ww, E.wh, E.num(n, 'size', 100)/100, E.num(n, 'leading', 100)/100, Math.max(0, Math.min(1, E.num(n, 'shape', 25)/100)));
      return [L.lead, L.edge, L.pane, L.pal]; } },
  glass: { cat: 'Light & Color', label: 'Glass', ins: ['lead', 'edge', 'pane', 'palette', 'glass hue', 'second hue'],
    outs: ['image'], io: { ins: ['field', 'field', 'field', 'field', 'colour', 'colour'], outs: ['image'] },
    params: [TOUCH_R('relief', 'Lead Relief', 100, 25, 300)], cost: () => 16,
    run(E, n){ const { ww, wh, N, input, asField, ctx } = E;
      const f = j => asField(input(n, j)) || new Float32Array(N);
      return [litGlass({ lead: f(1), edge: (asField(input(n, 2)) || new Float32Array(N).fill(1)), pane: f(3), pal: f(4) }, ww, wh,
        touchRGB(input(n, 5), '#2148A8'), touchRGB(input(n, 6), '#A8182C'), ctx.light, E.num(n, 'relief', 100)/100)]; } },
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
