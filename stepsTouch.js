/**
 * stepsTouch.js — steps for 🜚 Touch surfaces (part of the steps library:
 * steps.js gathers them). Linen is made of these:
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
import { CPU, lightBasis, lightSparse } from './texCore.js';

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

export const TOUCH_STEPS = {
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
