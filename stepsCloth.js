/**
 * stepsCloth.js — CLOTH (Ruby: "replace those with node graphs and run a full cloth simulation now for half the
 * cost"). Prior art: docs/prior-art/cloth.md.
 *
 *   drape        DRAPE: a sheet of cloth simulated as it hangs or falls (from a rod, gathered; from two corners; from
 *                one; twisted; over a hidden form; crumpled; laid flat) until it settles, then seen from in front or
 *                from above and handed on as MAPS: its height, its facing (a normal map), where each point of the
 *                cloth came from (u, v: so a weave follows the folds), how much it is gathered there, where the
 *                cloth is, and where its back shows
 *   weavemaps    WEAVE MAPS: threads over and under, as a loom's draft says (plain, twill, satin, basket,
 *                herringbone), at any point of the cloth (u, v), as maps: their height, their gloss, which thread
 *                shows (warp or weft, each spun a little different), and the gaps between them. Threads too fine
 *                for the pixels they fall on (a fold's steep wall) fade to their average, so they never shimmer
 *   detailnormals  DETAIL NORMALS: a normal map with a fine height laid over it (a weave over a fold, grain over a
 *                carved form): a general part
 *
 * THE SIMULATION (§1.3 of the research): position-based, after Müller's XPBD as Ten Minute Physics teaches it.
 * Particles on a grid joined by distance constraints (structural, shear, and bending as skip-one), solved Gauss–Seidel
 * in a fixed order; long tethers from each free particle to its pin, so a hanging sheet never stretches; 2 substeps
 * × 5 iterations a frame, damped, its speed clamped, until it settles. Deterministic: Float64, the same order every
 * time, and no sin, cos or exp inside the loop (they round differently from one browser to the next, and a settle
 * would amplify the difference: the same seed must give the same folds everywhere).
 */
import { mulberry32 } from './texCore.js';

const CL_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
export const CL_HANGS = ['from a rod, gathered', 'from two corners', 'from one corner', 'twisted', 'over a hidden form', 'crumpled', 'laid flat'];
export const CL_FABRICS = ['silk', 'satin', 'muslin', 'linen', 'denim', 'canvas', 'tweed', 'burlap', 'velvet'];
// each fabric: how freely it bends (compliance: heavy cloth makes few broad folds, light cloth many small: fold width
// goes as bending's fourth root, so neighbours differ about tenfold, §2.1), its weave (the loom's draft), threads
// across the page, how lumpy its yarn (slub), the gaps between threads, its gloss, and its sheen
export const CL_FABRIC = {
  silk:   { bend: 3e-1, draft: 'plain',  threads: 420, slub: 0.05, gap: 0.04, gloss: 0.85, fuzz: 0.0 },
  satin:  { bend: 1.5e-1, draft: 'satin', threads: 360, slub: 0.02, gap: 0.02, gloss: 0.95, fuzz: 0.0 },
  muslin: { bend: 1e-1, draft: 'plain',  threads: 150, slub: 0.25, gap: 0.30, gloss: 0.15, fuzz: 0.3 },
  linen:  { bend: 1e-2, draft: 'plain',  threads: 110, slub: 0.55, gap: 0.12, gloss: 0.30, fuzz: 0.25 },
  denim:  { bend: 6e-4, draft: 'twill',  threads: 90,  slub: 0.30, gap: 0.05, gloss: 0.20, fuzz: 0.2 },
  canvas: { bend: 1e-3, draft: 'basket', threads: 70,  slub: 0.20, gap: 0.10, gloss: 0.10, fuzz: 0.3 },
  tweed:  { bend: 1e-3, draft: 'herringbone', threads: 60, slub: 0.45, gap: 0.08, gloss: 0.08, fuzz: 0.7 },
  burlap: { bend: 3e-4, draft: 'plain',  threads: 32,  slub: 0.80, gap: 0.38, gloss: 0.05, fuzz: 0.8 },
  velvet: { bend: 3e-3, draft: 'plain',  threads: 500, slub: 0.0,  gap: 0.0,  gloss: 0.55, fuzz: 1.0 } };

// ---------------- THE SIMULATION ----------------
// a parabola for sin(πt) on [0, 1] (exact at 0, ½ and 1): shapes the start without a transcendental call
const clArch = t => 4*t*(1 - t);
/** Settle a sheet. o: { cols, aspect, hang, bend (compliance), folds 0..1, seed }. Returns the settled grid and how
 *  it is to be seen: { P (Float64Array x,y,z), C, Rr, view: 'front'|'top', fill, comp (compression per particle) }. */
export function clSettle(o){
  const C = o.cols, s = 1/(C - 1), Rr = Math.max(4, Math.round(o.aspect/s) + 1), n = C*Rr, R = mulberry32(o.seed >>> 0);
  const hang = o.hang, top = hang === 'over a hidden form' || hang === 'crumpled' || hang === 'laid flat', folds = o.folds;
  const P = new Float64Array(n*3), Q = new Float64Array(n*3), V = new Float64Array(n*3), W = new Float64Array(n).fill(1);
  const id = (i, j) => j*C + i, set = (k, x, y, z) => { P[k*3] = x; P[k*3 + 1] = y; P[k*3 + 2] = z; };
  // a smooth random bump field for the start (sums of hat functions on a coarse lattice: no transcendental)
  const bumps = (() => { const g = 6, L = new Float64Array((g + 1)*(g + 1)); for(let q = 0; q < L.length; q++) L[q] = R()*2 - 1;
    return (u, v) => { const x = u*g, y = v*g, i0 = Math.min(g - 1, x | 0), j0 = Math.min(g - 1, y | 0), fx = x - i0, fy = y - j0, sx = fx*fx*(3 - 2*fx), sy = fy*fy*(3 - 2*fy);
      return (L[j0*(g + 1) + i0]*(1 - sx) + L[j0*(g + 1) + i0 + 1]*sx)*(1 - sy) + (L[(j0 + 1)*(g + 1) + i0]*(1 - sx) + L[(j0 + 1)*(g + 1) + i0 + 1]*sx)*sy; }; })();
  const pins = [];
  // ---- THE START: each hang laid out near where it will settle, so it settles in a few dozen frames ----
  if(hang === 'from a rod, gathered'){
    // rings every few threads on a rod shorter than the cloth; between rings the cloth bulges out and back
    const gather = 0.42 + 0.4*(1 - folds), ring = 3 + Math.floor(R()*3), A = ring*s*Math.sqrt(Math.max(0, 1 - gather*gather))*0.55;
    for(let j = 0; j < Rr; j++) for(let i = 0; i < C; i++){ const k = id(i, j), seg = Math.floor(i/ring), t = (i % ring)/ring;
      set(k, (i*s - 0.5)*gather, -j*s, (seg % 2 ? -1 : 1)*A*clArch(t)*(0.6 + 0.4*(1 - j/Rr)) + 0.01*bumps(i/C, j/Rr)); }
    for(let i = 0; i < C; i += ring) pins.push(id(i, 0)); if((C - 1) % ring) pins.push(id(C - 1, 0));
    // (each ring a little off its even place on the rod, as rings slide: no two curtains gather alike)
    for(const p of pins){ const i = p % C; if(i > 0 && i < C - 1) P[p*3] += (R() - 0.5)*ring*s*gather*0.7; }
  } else if(hang === 'from two corners'){
    const spread = 0.95 - 0.4*folds;
    for(let j = 0; j < Rr; j++) for(let i = 0; i < C; i++) set(id(i, j), (i*s - 0.5)*spread, -j*s*0.95, 0.03*bumps(i/C, j/Rr));
    pins.push(id(0, 0), id(C - 1, 0));
  } else if(hang === 'from one corner'){
    // turned an eighth round (a diagonal hanging down from the pinned corner), and a second nail along the top edge: a swag
    const h = Math.SQRT1_2, nail = Math.max(1, Math.round((C - 1)*(0.45 - 0.25*folds)));
    for(let j = 0; j < Rr; j++) for(let i = 0; i < C; i++){ const x = i*s, y = -j*s; set(id(i, j), (x + y)*h*0.9, (y - x)*h*0.9, 0.02*bumps(i/C, j/Rr)); }
    pins.push(id(0, 0), id(nail, 0));
  } else if(hang === 'twisted'){
    // the top held, the hem turned about the upright axis (by a half-angle tangent: no trig)
    const t = 0.25 + 0.75*folds, cr = (1 - t*t)/(1 + t*t), sr = 2*t/(1 + t*t);
    for(let j = 0; j < Rr; j++) for(let i = 0; i < C; i++){ const x = (i*s - 0.5)*0.9, f = j/(Rr - 1), c = 1 + (cr - 1)*f, sn = sr*f; set(id(i, j), x*c, -j*s*0.97, x*sn); }
    for(let i = 0; i < C; i++){ pins.push(id(i, 0)); pins.push(id(i, Rr - 1)); }
  } else { // the views from above: the cloth starts in the air (y up) and falls
    const sq = hang === 'crumpled' ? 0.66 + 0.18*(1 - folds) : hang === 'laid flat' ? 0.95 + 0.04*(1 - folds) : 1;
    const lift = hang === 'over a hidden form' ? 0.42 : 0.06;
    // (pushed about in the plane too, a little, so the buckles run every way and not along the threads)
    const push = hang === 'over a hidden form' ? 0 : hang === 'crumpled' ? 0.035 : 0.01;
    for(let j = 0; j < Rr; j++) for(let i = 0; i < C; i++){ const u = i/(C - 1), v = j/(Rr - 1);
      set(id(i, j), (u - 0.5)*sq + push*bumps(v*0.9 + 0.31, u*0.9 + 0.17), lift + (hang === 'crumpled' ? 0.12 : hang === 'laid flat' ? 0.03 : 0.02)*(bumps(u, v) + 1),
        (v - 0.5)*o.aspect*sq + push*bumps(u*0.8 + 0.53, 1 - v*0.8)); }
  }
  for(const k of pins) W[k] = 0;
  // the form beneath (a sphere and a lower box-ish bump): where it is, by the seed
  const form = { x: (R() - 0.5)*0.2, z: (R() - 0.5)*0.2*o.aspect, r: 0.2 + 0.08*folds + 0.04*R() };
  // ---- THE CONSTRAINTS: structural, shear, bending (skip-one), each a distance at rest in the flat sheet ----
  const CA = [], CB = [], CL = [], CK = [];   // a, b, rest, kind (0 structural, 1 shear, 2 bend)
  const con = (a, b, kind) => { CA.push(a); CB.push(b); CL.push(s*(kind === 1 ? Math.SQRT2 : kind === 2 ? 2 : 1)); CK.push(kind); };
  for(let j = 0; j < Rr; j++) for(let i = 0; i < C; i++){ if(i + 1 < C) con(id(i, j), id(i + 1, j), 0); if(j + 1 < Rr) con(id(i, j), id(i, j + 1), 0); }
  for(let j = 0; j + 1 < Rr; j++) for(let i = 0; i + 1 < C; i++){ con(id(i, j), id(i + 1, j + 1), 1); con(id(i + 1, j), id(i, j + 1), 1); }
  for(let j = 0; j < Rr; j++) for(let i = 0; i < C; i++){ if(i + 2 < C) con(id(i, j), id(i + 2, j), 2); if(j + 2 < Rr) con(id(i, j), id(i, j + 2), 2); }
  const NC = CA.length, A = Int32Array.from(CA), B = Int32Array.from(CB), L0 = Float64Array.from(CL), KND = Uint8Array.from(CK);
  // the tethers: each free particle to its nearest pin, no farther than in the flat sheet
  const TP = new Int32Array(n).fill(-1), TL = new Float64Array(n);
  if(pins.length) for(let k = 0; k < n; k++){ if(!W[k]) continue; const i = k % C, j = (k/C) | 0; let best = Infinity;
    for(const p of pins){ const pi = p % C, pj = (p/C) | 0, d = Math.sqrt((pi - i)*(pi - i) + (pj - j)*(pj - j))*s; if(d < best){ best = d; TP[k] = p; } } TL[k] = best; }
  // ---- THE LOOP ----
  const dt = 1/30, sub = 2, iters = 5, h = dt/sub, g = -9.8, damp = 0.93, vmax = 0.5*s/h, comp = [0, 1e-4, o.bend];
  const softC = 4e-6;   // (structural constraints give a little in compression, as Buckling Ratio: folds then form crisply)
  const ground = top ? 0 : -Infinity, frames = top ? 110 : 80;
  for(let f = 0; f < frames; f++){
    for(let st = 0; st < sub; st++){
      for(let k = 0; k < n; k++){ if(!W[k]) continue; const q = k*3; V[q + 1] += g*h;
        let vx = V[q]*damp, vy = V[q + 1]*damp, vz = V[q + 2]*damp; const sp = Math.sqrt(vx*vx + vy*vy + vz*vz); if(sp > vmax){ const m = vmax/sp; vx *= m; vy *= m; vz *= m; }
        V[q] = vx; V[q + 1] = vy; V[q + 2] = vz; Q[q] = P[q]; Q[q + 1] = P[q + 1]; Q[q + 2] = P[q + 2]; P[q] += vx*h; P[q + 1] += vy*h; P[q + 2] += vz*h; }
      for(let it = 0; it < iters; it++){
        for(let c = 0; c < NC; c++){ const a = A[c], b = B[c], wa = W[a], wb = W[b], w = wa + wb; if(!w) continue;
          const qa = a*3, qb = b*3, dx = P[qb] - P[qa], dy = P[qb + 1] - P[qa + 1], dz = P[qb + 2] - P[qa + 2], len = Math.sqrt(dx*dx + dy*dy + dz*dz); if(len < 1e-12) continue;
          const Cv = len - L0[c], kd = KND[c], al = (kd === 0 ? (Cv < 0 ? softC : 0) : comp[kd])/(h*h), dl = -Cv/(w + al)/len;
          P[qa] -= dx*dl*wa; P[qa + 1] -= dy*dl*wa; P[qa + 2] -= dz*dl*wa; P[qb] += dx*dl*wb; P[qb + 1] += dy*dl*wb; P[qb + 2] += dz*dl*wb; }
        // tethers (only when stretched)
        if(pins.length) for(let k = 0; k < n; k++){ const p = TP[k]; if(p < 0) continue; const q = k*3, qp = p*3, dx = P[q] - P[qp], dy = P[q + 1] - P[qp + 1], dz = P[q + 2] - P[qp + 2], d = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if(d > TL[k]*1.01){ const m = TL[k]*1.01/d; P[q] = P[qp] + dx*m; P[q + 1] = P[qp + 1] + dy*m; P[q + 2] = P[qp + 2] + dz*m; } }
        // the ground and the form beneath: pushed out, with friction (most of the step along them taken back)
        if(top) for(let k = 0; k < n; k++){ const q = k*3;
          if(hang === 'over a hidden form'){ const dx = P[q] - form.x, dy = P[q + 1], dz = P[q + 2] - form.z, d = Math.sqrt(dx*dx + dy*dy + dz*dz), r = form.r + s*0.3;
            if(d < r && d > 1e-9){ const m = r/d; P[q] = form.x + dx*m; P[q + 1] = dy*m; P[q + 2] = form.z + dz*m; P[q] += (Q[q] - P[q])*0.6; P[q + 2] += (Q[q + 2] - P[q + 2])*0.6; } }
          if(P[q + 1] < ground){ P[q + 1] = ground; P[q] += (Q[q] - P[q])*0.8; P[q + 2] += (Q[q + 2] - P[q + 2])*0.8; } }
      }
      for(let k = 0; k < n*3; k++) V[k] = (P[k] - Q[k])/h;
    }
  }
  // how gathered the cloth is at each particle: its structural neighbours nearer than at rest
  const CP = new Float64Array(n), CU = new Float64Array(n), CV = new Float64Array(n), cnt = new Float64Array(n);
  for(let c = 0; c < NC; c++){ if(KND[c] === 1) continue; const a = A[c], b = B[c], qa = a*3, qb = b*3, len = Math.hypot(P[qb] - P[qa], P[qb + 1] - P[qa + 1], P[qb + 2] - P[qa + 2]);
    const e = Math.max(0, 1 - len/L0[c]), across = b - a < C; for(const k of [a, b]){ (across ? CU : CV)[k] += e; cnt[k] += 0.5; } }
  for(let k = 0; k < n; k++) if(cnt[k]){ CU[k] /= cnt[k]; CV[k] /= cnt[k]; CP[k] = CU[k] + CV[k]; }
  return { P, C, Rr, view: top ? 'top' : 'front', fill: hang === 'from a rod, gathered' || hang === 'twisted' || hang === 'laid flat', CU, CV };
}

// ---------------- SEEING IT: the settled sheet rasterized into maps ----------------
// Catmull-Rom between four values
const clCR = (a, b, c, d, t) => { const t2 = t*t, t3 = t2*t; return 0.5*(2*b + (c - a)*t + (2*a - 5*b + 4*c - d)*t2 + (3*b - a - 3*c + d)*t3); };
/** The settled sheet as maps on a ww×wh grid: depth (toward the eye), normals (x right, y down, z toward the eye),
 *  u, v (where on the cloth), gather across and along, the cloth's coverage, and its back. */
export function clRaster(S, ww, wh, sub = 3){
  const { P, C, Rr } = S, top = S.view === 'top';
  // the sheet as seen: screen x, screen y (down), depth (toward the eye)
  const sx = k => P[k*3], sy = k => top ? P[k*3 + 2] : -P[k*3 + 1], sd = k => top ? P[k*3 + 1] : P[k*3 + 2];
  // a finer grid, Catmull-Rom through the particles (so the folds are smooth, not faceted)
  const FC = (C - 1)*sub + 1, FR = (Rr - 1)*sub + 1, FX = new Float64Array(FC*FR), FY = new Float64Array(FC*FR), FD = new Float64Array(FC*FR), FU = new Float64Array(FC*FR), FV = new Float64Array(FC*FR);
  const at = (f, i, j) => f(Math.min(Rr - 1, Math.max(0, j))*C + Math.min(C - 1, Math.max(0, i)));
  const smooth = (f, i, j, ti, tj) => { const row = jj => clCR(at(f, i - 1, jj), at(f, i, jj), at(f, i + 1, jj), at(f, i + 2, jj), ti);
    return clCR(row(j - 1), row(j), row(j + 1), row(j + 2), tj); };
  const lin = (F, i, j, ti, tj) => { const a = F[Math.min(Rr - 1, j)*C + Math.min(C - 1, i)], b = F[Math.min(Rr - 1, j)*C + Math.min(C - 1, i + 1)], c = F[Math.min(Rr - 1, j + 1)*C + Math.min(C - 1, i)], d = F[Math.min(Rr - 1, j + 1)*C + Math.min(C - 1, i + 1)];
    return (a*(1 - ti) + b*ti)*(1 - tj) + (c*(1 - ti) + d*ti)*tj; };
  for(let J = 0; J < FR; J++) for(let I = 0; I < FC; I++){ const i = Math.min(C - 2, (I/sub) | 0), j = Math.min(Rr - 2, (J/sub) | 0), ti = I/sub - i, tj = J/sub - j, k = J*FC + I;
    FX[k] = smooth(sx, i, j, ti, tj); FY[k] = smooth(sy, i, j, ti, tj); FD[k] = smooth(sd, i, j, ti, tj); FU[k] = lin(S.CU, i, j, ti, tj); FV[k] = lin(S.CV, i, j, ti, tj); }
  // where to look: the sheet's bounds, filled (a curtain that is the page) or framed with room round it
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, d0 = Infinity, d1 = -Infinity;
  for(let k = 0; k < FC*FR; k++){ x0 = Math.min(x0, FX[k]); x1 = Math.max(x1, FX[k]); y0 = Math.min(y0, FY[k]); y1 = Math.max(y1, FY[k]); d0 = Math.min(d0, FD[k]); d1 = Math.max(d1, FD[k]); }
  const bw = x1 - x0, bh = y1 - y0, inset = S.fill ? 0.06 : 0, sc = S.fill ? Math.max(ww/(bw*(1 - 2*inset)), wh/(bh*(1 - 2*inset))) : Math.min(ww/bw, wh/bh)*0.9;
  const ox = ww/2 - (x0 + bw/2)*sc, oy = wh/2 - (y0 + bh/2)*sc;
  const N = ww*wh, DEP = new Float32Array(N).fill(-Infinity), NX = new Float32Array(N), NY = new Float32Array(N), NZ = new Float32Array(N).fill(1);
  const U = new Float32Array(N), Vv = new Float32Array(N), GU = new Float32Array(N), GV = new Float32Array(N), MASK = new Float32Array(N), BACK = new Float32Array(N);
  // each fine vertex's normal (from its neighbours across and along), in the screen's frame
  const NRM = new Float64Array(FC*FR*3);
  for(let J = 0; J < FR; J++) for(let I = 0; I < FC; I++){ const k = J*FC + I, a = J*FC + Math.max(0, I - 1), b = J*FC + Math.min(FC - 1, I + 1), c = Math.max(0, J - 1)*FC + I, d = Math.min(FR - 1, J + 1)*FC + I;
    const ux = FX[b] - FX[a], uy = FY[b] - FY[a], ud = FD[b] - FD[a], vx = FX[d] - FX[c], vy = FY[d] - FY[c], vd = FD[d] - FD[c];
    // (screen x right, y down, depth toward the eye: the cross product of along-u and along-v)
    let nx = uy*vd - ud*vy, ny = ud*vx - ux*vd, nz = ux*vy - uy*vx; const l = Math.hypot(nx, ny, nz) || 1; NRM[k*3] = nx/l; NRM[k*3 + 1] = ny/l; NRM[k*3 + 2] = nz/l; }
  const tri = (a, b, c) => {
    const ax = FX[a]*sc + ox, ay = FY[a]*sc + oy, bx = FX[b]*sc + ox, by = FY[b]*sc + oy, cx = FX[c]*sc + ox, cy = FY[c]*sc + oy;
    const den = (by - cy)*(ax - cx) + (cx - bx)*(ay - cy); if(Math.abs(den) < 1e-9) return;
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx))), maxX = Math.min(ww - 1, Math.ceil(Math.max(ax, bx, cx))), minY = Math.max(0, Math.floor(Math.min(ay, by, cy))), maxY = Math.min(wh - 1, Math.ceil(Math.max(ay, by, cy)));
    const ia = a % FC, ja = (a/FC) | 0, ib = b % FC, jb = (b/FC) | 0, ic = c % FC, jc = (c/FC) | 0;
    for(let y = minY; y <= maxY; y++) for(let x = minX; x <= maxX; x++){ const px = x + 0.5, py = y + 0.5;
      const l1 = ((by - cy)*(px - cx) + (cx - bx)*(py - cy))/den, l2 = ((cy - ay)*(px - cx) + (ax - cx)*(py - cy))/den, l3 = 1 - l1 - l2;
      if(l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
      const d = l1*FD[a] + l2*FD[b] + l3*FD[c], q = y*ww + x; if(d <= DEP[q]) continue;
      DEP[q] = d; MASK[q] = 1;
      let nx = l1*NRM[a*3] + l2*NRM[b*3] + l3*NRM[c*3], ny = l1*NRM[a*3 + 1] + l2*NRM[b*3 + 1] + l3*NRM[c*3 + 1], nz = l1*NRM[a*3 + 2] + l2*NRM[b*3 + 2] + l3*NRM[c*3 + 2];
      // (a face turned away: its back is what shows, and it faces the eye the other way round)
      if(nz < 0){ nx = -nx; ny = -ny; nz = -nz; BACK[q] = 1; } else BACK[q] = 0;
      const nl = Math.hypot(nx, ny, nz) || 1; NX[q] = nx/nl; NY[q] = ny/nl; NZ[q] = nz/nl;
      U[q] = (l1*ia + l2*ib + l3*ic)/(FC - 1); Vv[q] = (l1*ja + l2*jb + l3*jc)/(FR - 1)*(Rr - 1)/(C - 1);
      GU[q] = l1*FU[a] + l2*FU[b] + l3*FU[c]; GV[q] = l1*FV[a] + l2*FV[b] + l3*FV[c]; } };
  for(let J = 0; J + 1 < FR; J++) for(let I = 0; I + 1 < FC; I++){ const k = J*FC + I; tri(k, k + 1, k + FC); tri(k + 1, k + FC + 1, k + FC); }
  // the depth as a height in the page's pixels (the true shape: the Light Engine's shadows fall as they would)
  const H = new Float32Array(N); for(let q = 0; q < N; q++) H[q] = MASK[q] ? (DEP[q] - d0)*sc : 0;
  return { H, NX, NY, NZ, U, V: Vv, GU, GV, MASK, BACK, sc };
}

// ---------------- THE WEAVE ----------------
// which thread is on top at cell (i, j) of a draft: warp (true) or weft
export function clDraft(kind, i, j){
  switch(kind){
    case 'twill': return (((i - j) % 4) + 4) % 4 < 3;                  // 3/1 warp-faced (denim)
    case 'satin': return (((i*3 - j) % 5) + 5) % 5 === 0 ? false : true; // 5-harness: long warp floats
    case 'basket': return (((i >> 1) + (j >> 1)) & 1) === 0;
    case 'herringbone': { const k = Math.floor(i/6), s = k & 1 ? 1 : -1; return ((((i*s - j) % 4) + 4) % 4) < 2; }
    default: return ((i + j) & 1) === 0; }
}
// a fast integer hash to 0..1 (no Math.sin in a loop this hot)
const clHash = (a, b, s) => { let x = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ s; x = Math.imul(x ^ (x >>> 15), 0x85ebca6b); x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); return ((x ^ (x >>> 16)) >>> 0)/4294967296; };
/** The weave at every point of a grid: u, v where on the cloth (null: the page itself), `threads` across the cloth.
 *  Returns height (0..1), gloss, tone (0 weft … 1 warp, each thread spun a little different) and gap. */
export function clWeave(ww, wh, U, V, f, seed){
  const N = ww*wh, H = new Float32Array(N), G = new Float32Array(N), T = new Float32Array(N), GP = new Float32Array(N), mn = Math.min(ww, wh), th = f.threads;
  const uAt = q => U ? U[q] : (q % ww)/mn, vAt = q => V ? V[q] : ((q/ww) | 0)/mn;
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x;
    const tu = uAt(q)*th, tv = vAt(q)*th;
    // how many pixels a thread spans here (a steep fold wall foreshortens it): too few, and it fades to its average
    const qx = x + 1 < ww ? q + 1 : q - 1, qy = y + 1 < wh ? q + ww : q - ww;
    const fu = Math.max(Math.abs(uAt(qx) - uAt(q)), Math.abs(uAt(qy) - uAt(q)))*th, fv = Math.max(Math.abs(vAt(qx) - vAt(q)), Math.abs(vAt(qy) - vAt(q)))*th;
    const foot = Math.max(fu, fv), keep = foot > 0 ? Math.max(0, Math.min(1, (1/foot - 1.5)/2)) : 1;
    const i = Math.floor(tu), j = Math.floor(tv), au = tu - i, av = tv - j, warp = clDraft(f.draft, i, j);
    // the yarn: lumpy along its length (slub), each thread its own tone
    const slubU = f.slub*(clHash(i, Math.floor(tv*0.25), seed) - 0.5), slubV = f.slub*(clHash(j + 7919, Math.floor(tu*0.25), seed) - 0.5);
    const half = 0.5*(1 - f.gap) + (warp ? slubU : slubV)*0.18, a = warp ? au - 0.5 : av - 0.5, along = warp ? av : au;
    const inT = Math.abs(a) < half, prof = inT ? 1 - (a/half)*(a/half) : 0;
    // a thread rises over its crossing and dips under the next (a long float stays flat: satin)
    const arch = 0.75 + 0.25*4*along*(1 - along), h = inT ? Math.sqrt(prof)*arch : 0, fuzz = f.fuzz*(clHash(x, y, seed ^ 0x51) - 0.5)*0.25;
    const tone = (warp ? 0.68 : 0.32) + (clHash(warp ? i : j + 31337, warp ? 1 : 2, seed) - 0.5)*0.2 + fuzz*0.4;
    H[q] = h*keep + 0.55*(1 - keep) + fuzz*keep; T[q] = tone*keep + 0.5*(1 - keep); GP[q] = (inT ? 0 : 1)*keep + f.gap*(1 - keep);
    G[q] = f.gloss*(inT ? 0.6 + 0.4*prof : 0.2)*keep + f.gloss*0.6*(1 - keep); }
  return { H, G, T, GP };
}

const clClamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
// a smooth value noise from the hash (no transcendental: the same everywhere), 0..1
const clNoise = (x, y, seed) => { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, sx = fx*fx*(3 - 2*fx), sy = fy*fy*(3 - 2*fy);
  return (clHash(i, j, seed)*(1 - sx) + clHash(i + 1, j, seed)*sx)*(1 - sy) + (clHash(i, j + 1, seed)*(1 - sx) + clHash(i + 1, j + 1, seed)*sx)*sy; };
// a name from a list, by a setting's 0..100 (each name an equal share)
const clPick = (list, v) => list[Math.max(0, Math.min(list.length - 1, Math.floor(v/100*list.length)))];
// the sims a page keeps: a light, a hue or a weave changed never simulates again (§1.3: the settled mesh is small)
const CL_KEPT = new Map();
export const CLOTH_STEPS = {
  drape: { cat: 'Textures', label: 'Drape', ins: [], outs: ['height', 'normals', 'u', 'v', 'gather', 'cloth', 'back'],
    io: { ins: [], outs: ['field', 'image', 'field', 'field', 'field', 'field', 'field'] },
    params: [CL_R('hang', 'Hang: ' + CL_HANGS.join(' · '), 0), CL_R('fabric', 'Fabric: ' + CL_FABRICS.join(' · '), 40),
      CL_R('folds', 'Folds', 50), CL_R('detail', 'Detail', 40, 20, 80), CL_R('wrinkles', 'Wrinkles', 50), CL_R('variation', 'Variation', 0, 0, 99)],
    cost: () => 8,
    run(E, n){ const { ww, wh, num } = E, N = ww*wh, fname = clPick(CL_FABRICS, num(n, 'fabric', 40));
      const hang = clPick(CL_HANGS, num(n, 'hang', 0)), fabric = CL_FABRIC[fname];
      const seed = ((((E.ctx.seed >>> 0) + Math.round(num(n, 'variation', 0))*7919) >>> 0) ^ 0xc107) >>> 0, folds = num(n, 'folds', 50)/100;
      const cols = Math.round(num(n, 'detail', 40)), aspect = wh/ww, key = [hang, fname, folds.toFixed(3), cols, aspect.toFixed(3), seed].join('|');
      let S = CL_KEPT.get(key); if(!S){ S = clSettle({ cols, aspect: Math.max(0.5, Math.min(2.2, aspect)), hang, bend: fabric.bend, folds, seed }); CL_KEPT.set(key, S); if(CL_KEPT.size > 6) CL_KEPT.delete(CL_KEPT.keys().next().value); }
      const M = clRaster(S, ww, wh);
      // fine wrinkles where the cloth is gathered, across the way it is gathered (§2.3): too fine for the particles to
      // make, so drawn on, their size by the fabric (silk many and small, canvas few and broad)
      const wr = num(n, 'wrinkles', 50)/100, lam = 0.01 + 0.02*Math.pow(0.3/fabric.bend, 0.25), H = M.H, nrm = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      const wrH = new Float32Array(N);
      // (each wave's phase wanders with a slow noise, and each runs only so far before it fades: wrinkles, not ruled lines;
      //  and only where the cloth is gathered more than its folds already take up)
      if(wr > 0) for(let q = 0; q < N; q++){ if(!M.MASK[q]) continue; const uu = M.U[q], vv = M.V[q];
        const a = Math.sqrt(Math.max(0, Math.min(0.25, M.GU[q]) - 0.02)), b = Math.sqrt(Math.max(0, Math.min(0.25, M.GV[q]) - 0.02)); if(a + b === 0) continue;
        const u = uu/lam + 1.6*clNoise(uu*4, vv*4, seed), v = vv/lam + 1.6*clNoise(uu*4 + 9.3, vv*4 + 4.1, seed);
        const fu = u - Math.floor(u), fv = v - Math.floor(v), wu = 4*fu*(1 - fu) - 0.5, wv = 4*fv*(1 - fv) - 0.5;   // (a parabola for the wave: no sin)
        const eu = Math.max(0, clNoise(uu*2.5 + 3.3, vv*9, seed ^ 0x77)*2 - 0.2), ev = Math.max(0, clNoise(uu*9, vv*2.5 + 5.5, seed ^ 0x99)*2 - 0.2);
        wrH[q] = (a*wu*eu + b*wv*ev)*lam*M.sc*wr*0.9; }
      const HT = new Float32Array(N); for(let q = 0; q < N; q++) HT[q] = H[q] + wrH[q];
      // the normals: the sheet's own, bent by the wrinkles' slope
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x; if(!M.MASK[q]){ nrm.r[q] = 0.5; nrm.g[q] = 0.5; nrm.b[q] = 1; continue; }
        const gx = (wrH[x + 1 < ww ? q + 1 : q] - wrH[x > 0 ? q - 1 : q])*0.5, gy = (wrH[y + 1 < wh ? q + ww : q] - wrH[y > 0 ? q - ww : q])*0.5;
        let nx = M.NX[q] - gx*M.NZ[q], ny = M.NY[q] - gy*M.NZ[q], nz = M.NZ[q]; const l = Math.hypot(nx, ny, nz) || 1;
        nrm.r[q] = clClamp(nx/l*0.5 + 0.5); nrm.g[q] = clClamp(ny/l*0.5 + 0.5); nrm.b[q] = clClamp(nz/l*0.5 + 0.5); }
      // (the height as the Light Engine reads it: a field whose 1 is 3% of the grid's short side at Relief 100)
      const k = 1/(Math.min(ww, wh)*0.03); for(let q = 0; q < N; q++) HT[q] *= k;
      const gather = new Float32Array(N); for(let q = 0; q < N; q++) gather[q] = clClamp((M.GU[q] + M.GV[q])*4);
      return [HT, nrm, M.U, M.V, gather, M.MASK, M.BACK]; } },
  weavemaps: { cat: 'Textures', label: 'Weave Maps', ins: ['u', 'v'], outs: ['height', 'gloss', 'tone', 'gaps'],
    params: [CL_R('fabric', 'Fabric: ' + CL_FABRICS.join(' · '), 40), ['draft', 'Weave', 'select', 'the fabric’s', { options: ['the fabric’s', 'plain', 'twill', 'satin', 'basket', 'herringbone'] }],
      CL_R('threads', 'Threads', 100, 25, 400), CL_R('slub', 'Slub', 100, 0, 200), CL_R('variation', 'Variation', 0, 0, 99)],
    cost: () => 3,
    run(E, n){ const { ww, wh, num } = E, P = E.P || ((nn, k, d) => nn.params && nn.params[k] != null ? nn.params[k] : d);
      const F = { ...CL_FABRIC[clPick(CL_FABRICS, num(n, 'fabric', 40))] }, dr = P(n, 'draft', 'the fabric’s');
      if(['plain', 'twill', 'satin', 'basket', 'herringbone'].includes(dr)) F.draft = dr;
      F.threads *= num(n, 'threads', 100)/100; F.slub *= num(n, 'slub', 100)/100;
      // (threads across the PAGE: a cloth's u runs 0..1 across it; the page's own place runs across its short side)
      const U = E.asField(E.input(n, 1)), V = E.asField(E.input(n, 2)), seed = ((((E.ctx.seed >>> 0) + Math.round(num(n, 'variation', 0))*7919) >>> 0) ^ 0x3ea7) >>> 0;
      const R = clWeave(ww, wh, U, V, F, seed);
      return [R.H, R.G, R.T, R.GP]; } },
  detailnormals: { cat: 'Light & Color', label: 'Detail Normals', ins: ['normal map', 'detail'], outs: ['normal map'], io: { ins: ['image', 'field'], outs: ['image'] }, maps: ['strength'],
    params: [CL_R('strength', 'Strength', 50, 0, 200)], cost: () => 1,
    run(E, n){ const { ww, wh, N } = E, nm = E.input(n, 1) != null ? E.asImage(E.input(n, 1)) : null, D = E.asField(E.input(n, 2)), out = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      const st = E.map(n, 'strength', 50);
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x;
        let nx = nm ? nm.r[q]*2 - 1 : 0, ny = nm ? nm.g[q]*2 - 1 : 0, nz = nm ? Math.max(1e-3, nm.b[q]*2 - 1) : 1;
        if(D){ const k = E.at(st, q)/100*2, gx = (D[x + 1 < ww ? q + 1 : q] - D[x > 0 ? q - 1 : q])*0.5*k, gy = (D[y + 1 < wh ? q + ww : q] - D[y > 0 ? q - ww : q])*0.5*k;
          nx -= gx*nz; ny -= gy*nz; }
        const l = Math.hypot(nx, ny, nz) || 1; out.r[q] = clClamp(nx/l*0.5 + 0.5); out.g[q] = clClamp(ny/l*0.5 + 0.5); out.b[q] = clClamp(nz/l*0.5 + 0.5); }
      return [out]; } },
};
