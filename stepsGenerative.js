/**
 * stepsGenerative.js — PARTS THAT GROW: generative processes, simulated, then
 * laid on a real material and lit (Ruby: between "the simplest pattern" and
 * "an entire scene" — the medium-effort textures: generative, structured,
 * lit, made of a material).
 *
 *   discharge  DISCHARGE: a Lichtenberg figure — the branching path electricity
 *              burns through an insulator — grown by the dielectric breakdown
 *              model (Niemeyer, Pietronero & Wiesmann 1984) in the fast,
 *              grid-free form of Kim, Sewall & Lin ("Fast simulation of
 *              Laplacian growth", 2007): each new step of the channel is a point
 *              charge; a neighbour of the channel is chosen with probability
 *              ∝ (its normalised potential)^η, so a low η branches bushily and a
 *              high one strikes thin and straight. One pole, or two or three
 *              that grow toward each other and meet (fractal burning: wood
 *              between two electrodes). Its trunk is thick where the most
 *              current ran (the branches beyond it), its twigs hairlines.
 *   wood       WOOD: a plank — growth rings round a pith far off the page, early
 *              and late wood, fibres along the grain — as a picture and heights.
 *   burn       BURN: any gray map of channels laid into a picture as a burn —
 *              charred and sunken in wood, still glowing as embers, or lit from
 *              inside a block of clear acrylic — with the picture's heights.
 *   traces     CIRCUIT TRACES: a circuit board routed as boards are by hand —
 *              chips and their pins, then buses of parallel traces that run
 *              straight and turn together (45° chamfers, or Factorio's 90°
 *              corners), ending in vias and pads — with each trace's own grey
 *              (so a cutoff can power some and not others), data running along
 *              them, the pads, the parts and their silkscreen.
 *   growline   GROWING LINE: differential growth (Anders Hoff's "differential
 *              line"; Nervous System's Floraform in a plane): a closed line whose
 *              points push each other apart, follow their neighbours and split
 *              where they stretch, so it ruffles and folds like a lettuce leaf or
 *              brain coral. The dial is the sun it grows toward (phototropism).
 *
 * The simulations run in page units on a lattice of their own, the same at
 * any size, so a preview is the export, smaller. Their randomness is the
 * texture's seed (+ Variant), like the other parts that grow.
 */
import { CPU, withSeed, wordsRoom, kitCanvas, makeNoiseGrid, sampleNoiseGrid, lightVec, mulberry32, seedChoice } from './texCore.js';

const GEN_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const genClamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
const genSeed = (E, n) => ((E.ctx.seed >>> 0) + Math.round(E.num(n, 'variant', 0))*7919) >>> 0;
// the dial (a wired value 0..1, else the page's own) as an angle, and the unit vector toward its handle
const genDial = (E, n, port) => { const v = E.input(n, port), deg = typeof v === 'number' ? v*360 : (E.ctx.light ?? 315), a = (deg - 90)*Math.PI/180; return { deg, x: Math.cos(a), y: Math.sin(a) }; };

// ---------------- THE GROUND CAMERA ----------------
// (Ruby: "change the fov of the lens and allow rotating or tracking around".) A part that draws a world lying on the
// page (a plank, a figure burned into it) sees it through a pinhole camera: Turn spins the ground about the page's
// middle, View tips its top away, so the far ground runs off toward a horizon above the page (never onto it), the
// near ground comes closer, and the lens is as far off as 1.1 of the page's long side. Turn 0 and View 0: no camera
// (null), the page exactly as it was. Everything in page units (the short side is 1).
export function groundCam(aspX, aspY, turn, view, zoom = 100){
  const th = (+turn || 0)*Math.PI/180, v = Math.max(0, Math.min(100, +view || 0))/100, Z = Math.max(0.25, Math.min(4, (+zoom || 100)/100));
  if(v < 1e-6 && Math.abs(Math.sin(th)) < 1e-9 && Math.cos(th) > 0 && Math.abs(Z - 1) < 1e-9) return null;
  const cx = aspX/2, cy = aspY/2, ct = Math.cos(th), st = Math.sin(th), d = 1.1*Math.max(aspX, aspY);
  // (the ZOOM is the lens: the picture magnified about the page's middle; zoomed out, the tip stops short so the horizon
  //  stays above the page's top)
  const phi = v*Math.min(1.2, Math.atan(0.9*2*d*Math.min(1, Z)/aspY)), cp = Math.cos(phi), sp = Math.sin(phi);
  return {
    // a point of the ground → where it shows, and how much it is magnified there (null: behind the lens)
    toScreen(gx, gy){ const X = gx - cx, Y = gy - cy, xr = X*ct - Y*st, yr = X*st + Y*ct, z = d - yr*sp;
      if(z <= 1e-6) return null; const k = d/z; return [cx + xr*k*Z, cy + yr*cp*k*Z, k*Z]; },
    // a point of the screen → the ground seen there, its magnification, and how much ground one unit of screen
    // spans there (the larger way: up the page, where the ground is foreshortened)
    toGround(sx, sy){ const xs = (sx - cx)/Z, ys = (sy - cy)/Z, den = d*cp + ys*sp; if(den <= 1e-6) return null;
      const yr = ys*d/den, z = d - yr*sp, k = d/z, xr = xs/k;
      return [cx + xr*ct + yr*st, cy - xr*st + yr*ct, k*Z, Math.max(1/k, 1/(cp*k*k))/Z]; }
  };
}

// ---------------- DISCHARGE ----------------
// The figure on a lattice G cells along the page's short side. Poles sit at the page's rim toward the dial (one),
// across from each other (two), or a triangle (three). Returns segments [x0, y0, x1, y1, current] in page units (short side 1).
// (Ruby: this, the first growth, was the better filter; a later one that always joined two poles is gone.) THE CAMERA:
// the figure grows as it always did, then o.zoom magnifies the finished figure about the page's middle, slid by
// o.offset along the dial's line: zoom 1 and no slide are the figure exactly as first made.
function genLichtenberg(aspX, aspY, o){
  const G = 240, h = 1/G, gx = Math.round(G*aspX), gy = Math.round(G*aspY);
  const poles = Math.max(1, Math.min(3, o.poles)), eta = o.eta, target = o.count;
  // the poles: toward the dial and round from it
  const cx = aspX/2, cy = aspY/2, rad = Math.min(aspX, aspY)*0.46, P = [];
  for(let k = 0; k < poles; k++){ const a = Math.atan2(o.dy, o.dx) + k*Math.PI*2/poles;
    const R = poles === 1 ? rad*0.15 : rad;                 // one pole: a strike near the middle, toward the dial
    P.push([Math.round((cx + Math.cos(a)*R)/h), Math.round((cy + Math.sin(a)*R)/h)]); }
  // charges (lattice points with a jitter, so the channel isn't drawn on graph paper), per tree
  const X = [], Y = [], JX = [], JY = [], par = [], tree = [], occ = new Uint8Array(gx*gy);
  const cand = new Map();   // lattice index → { s: [sum per tree], t: tree, p: parent }
  const R1 = 0.5;
  const addCharge = (ix, iy, t, p) => {
    const id = X.length; X.push(ix); Y.push(iy); JX.push((Math.random() - 0.5)*0.7); JY.push((Math.random() - 0.5)*0.7); par.push(p); tree.push(t);
    occ[iy*gx + ix] = 1; cand.delete(iy*gx + ix);
    // every candidate feels the new charge (Kim et al.: the potential of a point charge, 1 − R1/r, summed)
    for(const c of cand.values()){ const dx = c.x - ix, dy = c.y - iy, r = Math.sqrt(dx*dx + dy*dy); c.s[t] += 1 - R1/Math.max(R1, r); }
    // its free neighbours become candidates (their potential from every charge so far)
    for(let j = -1; j <= 1; j++) for(let i = -1; i <= 1; i++){ if(!i && !j) continue; const x = ix + i, y = iy + j;
      if(x < 1 || y < 1 || x >= gx - 1 || y >= gy - 1 || occ[y*gx + x]) continue; const k = y*gx + x; if(cand.has(k)) continue;
      const s = new Float64Array(poles); for(let q = 0; q < X.length; q++){ const dx = x - X[q], dy = y - Y[q], r = Math.sqrt(dx*dx + dy*dy); s[tree[q]] += 1 - R1/Math.max(R1, r); }
      cand.set(k, { x, y, s, t, p: id }); }
    return id;
  };
  const count = new Array(poles).fill(0);
  P.forEach((p, t) => { addCharge(Math.min(gx - 2, Math.max(1, p[0])), Math.min(gy - 2, Math.max(1, p[1])), t, -1); count[t]++; });
  // grain: growth along it is easier (wood burns along its fibres)
  const ga = o.grain, gcx = 1, gcy = 0;
  let turn = 0;
  for(let step = poles; step < target; step++){
    const t = turn; turn = (turn + 1) % poles;
    // the candidates of this tree: its own potential (high at the tips, far from the channel already burnt) and,
    // with more than one pole, the pull of the nearest other pole (the opposite charge) — each normalised, then
    // blended, then raised to the power η
    const list = []; let lo = Infinity, hi = -Infinity, alo = Infinity, ahi = -Infinity;
    for(const c of cand.values()){ if(c.t !== t) continue;
      const phi = c.s[t]/Math.max(1, count[t]); let att = 0;
      if(poles > 1){ let dm = Infinity; for(let q = 0; q < poles; q++) if(q !== t){ const d2 = Math.hypot(c.x - P[q][0], c.y - P[q][1]); if(d2 < dm) dm = d2; } att = -dm; }
      list.push([c, phi, att]); if(phi < lo) lo = phi; if(phi > hi) hi = phi; if(att < alo) alo = att; if(att > ahi) ahi = att; }
    if(!list.length) break;
    let tot = 0; const w = new Float64Array(list.length), pull = poles > 1 ? 0.62 : 0;
    for(let i = 0; i < list.length; i++){ const c = list[i][0], pn = (1 - pull)*(list[i][1] - lo)/Math.max(1e-9, hi - lo) + pull*(list[i][2] - alo)/Math.max(1e-9, ahi - alo);
      let g = 1; if(ga > 0){ const dx = c.x - X[c.p], dy = c.y - Y[c.p], m = Math.hypot(dx, dy) || 1; g = 1 + ga*2.5*Math.abs((dx*gcx + dy*gcy)/m); }
      w[i] = Math.pow(pn, eta)*g; tot += w[i]; }
    let r = Math.random()*tot, pick = list.length - 1; for(let i = 0; i < list.length; i++){ r -= w[i]; if(r <= 0){ pick = i; break; } }
    const c = list[pick][0]; addCharge(c.x, c.y, t, c.p); count[t]++;
  }
  // the current through each step: everything that grew beyond it
  const n = X.length, desc = new Float64Array(n).fill(1);
  for(let i = n - 1; i >= 0; i--) if(par[i] >= 0) desc[par[i]] += desc[i];
  const zoom = o.zoom || 1, off = o.offset || 0, sx = cx + o.dx*off*aspX*0.45, sy = cy + o.dy*off*aspY*0.45;
  const camX = v => zoom === 1 && !off ? v : sx + (v - cx)*zoom, camY = v => zoom === 1 && !off ? v : sy + (v - cy)*zoom;
  const segs = [];
  for(let i = 0; i < n; i++){ const p = par[i]; if(p < 0) continue;
    segs.push([camX((X[p] + JX[p])*h), camY((Y[p] + JY[p])*h), camX((X[i] + JX[i])*h), camY((Y[i] + JY[i])*h), desc[i]]); }
  return { segs, n };
}

// ---------------- RAINDROPS ----------------
// Rain on still water (Ruby's poem asked for it). Every drop that has fallen in the last moment is a ring wave
// spreading from where it hit: a short wave packet (a sine inside a smooth window) whose radius is its age times its
// speed, its height falling as it spreads (the energy shared round a growing circle), the longer waves running ahead
// (dispersion). Drops live on the water itself, in ground units (the page's short side is 1), seeded by a hash of
// each stretch of it, so any stretch near or far has its own and the picture never depends on the order things are
// drawn in. THE CAMERA (o.tilt) looks across the water toward the horizon, as Perspective does: rings draw as
// ellipses, smaller and denser with distance, and where a ring is finer than a pixel the water calms to flat (it
// would only flicker). A drop younger than a breath still shows its splash: a crater, a crown, and a few droplets.
function genRaindrops(ww, wh, unit, o){
  const N = ww*wh, H = new Float32Array(N), S = new Float32Array(N), D = new Float32Array(N);
  const lam = 0.012*o.size, packets = 2.5, Rmax = lam*(6 + 22*o.spread), reach = Rmax + lam*(packets + 1.5), C = Math.max(0.01, reach/2);
  const density = 20 + 520*o.rain, perCell = density*C*C, fresh = o.splash > 0 ? 0.015 + 0.05*o.splash : 0, salt = o.salt >>> 0;
  const hash = (a, b, c) => { let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647) ^ salt; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0)/4294967296; };
  const cells = new Map();
  const dropsIn = (cx, cy) => { const key = cx*73856093 ^ cy*19349663; let L = cells.get(key); if(L) return L; L = [];
    const n = Math.floor(perCell + hash(cx, cy, 0));
    for(let k = 1; k <= n; k++){
      // older drops wider and fainter; Spread lets the rings grow older (wider) before the next ones fall
      const a = Math.pow(hash(cx, cy, k*7 + 1), 0.7 + (1 - o.spread)*1.6), l = lam*(0.8 + 0.4*hash(cx, cy, k*7 + 2))*(1 + 0.7*a);
      L.push({ x: (cx + hash(cx, cy, k*7 + 3))*C, y: (cy + hash(cx, cy, k*7 + 4))*C, a, l, R: a*Rmax, amp: Math.pow(1 - a, 1.3)/Math.sqrt(1 + a*Rmax/lam),
        splash: a < fresh, turn: hash(cx, cy, k*7 + 5)*6.283 }); }
    cells.set(key, L); return L; };
  const t = Math.max(0, Math.min(0.9, o.tilt)), zFar = 1/(1 - t), aspX = ww/unit, aspY = wh/unit;
  // each row's depth: z (1 near, zFar at the top), its ground y, and a pixel's size on the water (forward, the larger)
  const Z = new Float32Array(wh), GY = new Float32Array(wh), FT = new Float32Array(wh);
  for(let y = 0; y < wh; y++){ const v = (y + 0.5)/wh, z = t > 1e-4 ? 1/(1 - t + t*v) : 1; Z[y] = z; GY[y] = (t > 1e-4 ? 1 - (z - 1)/t : v)*aspY; FT[y] = z*z/unit;
    const dist = t > 1e-4 ? (z - 1)/(zFar - 1) : 0; D.fill(dist, y*ww, y*ww + ww); }
  // the screen row nearest a ground y (rows run from far, at the top, to near)
  const rowOf = gy => { if(t <= 1e-4) return gy/aspY*wh - 0.5; const G = 1 - gy/aspY, v = (1 - G + G*t)/(1 + G*t); return v*wh - 0.5; };
  const h = new Float32Array(N);
  // EACH DROP IS LAID WHERE IT REACHES (not each point asking every drop nearby): row by row, only across its ring's band
  const gx0 = (0.5 - 0.5*zFar)*aspX - reach, gx1 = (0.5 + 0.5*zFar)*aspX + reach, gy0 = Math.min(GY[0], GY[wh - 1]) - reach, gy1 = Math.max(GY[0], GY[wh - 1]) + reach;
  for(let cy = Math.floor(gy0/C); cy <= Math.floor(gy1/C); cy++) for(let cx = Math.floor(gx0/C); cx <= Math.floor(gx1/C); cx++) for(const d of dropsIn(cx, cy)){
    const r0 = lam*0.7*(1 + d.a*12), rout = Math.max(d.R + d.l*1.5, d.splash ? r0*2.4 : 0), rin = d.splash ? 0 : Math.max(0, d.R - d.l*packets);
    const ya = Math.max(0, Math.floor(Math.min(rowOf(d.y - rout), rowOf(d.y + rout)))), yb = Math.min(wh - 1, Math.ceil(Math.max(rowOf(d.y - rout), rowOf(d.y + rout))));
    if(ya > yb) continue;
    // a drop whose rings are finer than a pixel where it lies, and that isn't splashing, would only flicker: the water there is calm
    const mid = Math.max(0, Math.min(wh - 1, Math.round(rowOf(d.y))));
    if(!d.splash && d.l/FT[mid] < 1.2) continue;
    for(let y = ya; y <= yb; y++){
      const dy = GY[y] - d.y, dy2 = dy*dy; if(dy2 > rout*rout) continue;
      const xo = Math.sqrt(rout*rout - dy2), xi = dy2 < rin*rin ? Math.sqrt(rin*rin - dy2) : 0, z = Z[y], foot = FT[y], row = y*ww;
      const toPx = gx => ((gx/aspX - 0.5)/z + 0.5)*ww - 0.5;
      for(const [a0, a1] of xi > 0 ? [[d.x - xo, d.x - xi], [d.x + xi, d.x + xo]] : [[d.x - xo, d.x + xo]]){
        const xa = Math.max(0, Math.floor(toPx(a0))), xb = Math.min(ww - 1, Math.ceil(toPx(a1)));
        for(let x = xa; x <= xb; x++){
          const gx = (0.5 + ((x + 0.5)/ww - 0.5)*z)*aspX, dx = gx - d.x, r = Math.sqrt(dx*dx + dy2), w = (d.R - r)/d.l, q = row + x;
          if(w > -1 && w < packets){
            // a ring finer than a pixel (far off, or seen edge-on) calms rather than flickers
            const sharp = Math.max(0, Math.min(1, (d.l/foot - 1.2)/2)), e = Math.sin(Math.PI*(w + 1)/(packets + 1));
            h[q] += 1.6*d.amp*sharp*e*e*Math.sin(6.283*w); }
          if(d.splash){
            // the splash: a crater where it struck, a crown thrown up round it, and a few droplets flung out
            const cr = (r - r0)/(lam*0.18);
            if(r < r0) h[q] -= 0.6*(1 - r/r0)*(1 - r/r0);
            if(cr > -3 && cr < 3){ const g = Math.exp(-cr*cr); h[q] += 0.5*g; if(g > S[q]) S[q] = g; }
            for(let k = 0; k < 6; k++){ const ang = d.turn + k*1.047, rr = r0*1.9, ox = d.x + Math.cos(ang)*rr, oy = d.y + Math.sin(ang)*rr*0.9, dd = Math.hypot(gx - ox, GY[y] - oy)/(lam*0.14);
              if(dd < 3){ const g = Math.exp(-dd*dd); if(g > S[q]) S[q] = g; h[q] += 0.3*g; } } }
        }
      }
    }
  }
  for(let q = 0; q < N; q++){ const v = h[q]; H[q] = 0.5 + 0.22*v/(1 + 0.45*Math.abs(v)); S[q] = Math.min(1, S[q]*(0.4 + o.splash*0.6)); }
  return [H, S, D];
}

// ---------------- WOOD ----------------
function genWood(ww, wh, unit, o){
  const N = ww*wh, pic = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, H = new Float32Array(N);
  const warp = makeNoiseGrid(9, 9), fib = makeNoiseGrid(64, 12), fig = makeNoiseGrid(6, 6), knot = makeNoiseGrid(5, 5);
  const pithY = -0.22 - Math.random()*0.35, pithX = 0.2 + Math.random()*0.6, rings = 34*o.rings + 8, L = o.light, D = o.dark;
  const cam = o.cam || null, ex = 9 - 4*o.figure, lateMean = 1/(ex + 1);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    let u = x/unit, v = y/unit, ringK = 1, fibK = 1;
    const i = y*ww + x;
    if(cam){ const g = cam.toGround((x + 0.5)/unit, (y + 0.5)/unit); if(!g) continue; u = g[0]; v = g[1];
      // far off, a ring or a fibre finer than a pixel would only shimmer: it fades to its average
      const foot = g[3]/unit; ringK = genClamp((1/rings/foot - 1.5)/2.5); fibK = genClamp((Math.min(ww/unit/63, wh/unit/11)/foot - 1)/2); }
    const wv = sampleNoiseGrid(warp, 9, 9, u/(ww/unit)*8, v/(wh/unit)*8) - 0.5;
    // (flat-sawn: the rings cut at a slant across the board, so they arch — "cathedrals" — round a pith above it;
    //  past the page's top, as a camera sees it, they straighten toward the pith's line and never close round it)
    const dv = v >= 0 ? v - pithY : -pithY*Math.exp(v/-pithY);
    const r = Math.hypot((u - pithX*ww/unit)*0.8, dv) + wv*0.05*o.figure + (sampleNoiseGrid(fig, 6, 6, u*2, v*2) - 0.5)*0.025*o.figure;
    const f = r*rings, q = f - Math.floor(f);
    // early wood pale and soft, late wood a dark sharp band at the ring's end
    const late = ringK === 1 ? Math.pow(q, ex) : lateMean + (Math.pow(q, ex) - lateMean)*ringK;
    const fb = sampleNoiseGrid(fib, 64, 12, u/(ww/unit)*63, v/(wh/unit)*11), fibre = fibK === 1 ? fb : 0.5 + (fb - 0.5)*fibK, pore = sampleNoiseGrid(knot, 5, 5, u*1.3, v*1.3);
    const tone = genClamp(0.1 + late*0.62 + (fibre - 0.5)*0.42 + (pore - 0.5)*0.18);
    pic.r[i] = L[0] + (D[0] - L[0])*tone; pic.g[i] = L[1] + (D[1] - L[1])*tone; pic.b[i] = L[2] + (D[2] - L[2])*tone;
    H[i] = 0.55 - late*0.05 + (fibre - 0.5)*0.05;
  }
  return [pic, H];
}

// ---------------- GROWING LINE ----------------
// Closed loops in page units; returns { loops: [[x,y,age]…], iters }.
function genGrowth(aspX, aspY, o){
  const d = 0.0065*o.fold, R = d*2.6, maxEdge = d*1.15, cap = Math.round(1000 + 5200*o.growth), iters = Math.round(120 + 720*o.growth);
  const loops = [];
  const seeds = Math.max(1, Math.round(o.seeds));
  for(let s = 0; s < seeds; s++){
    const cx = aspX*(seeds === 1 ? 0.5 : 0.18 + Math.random()*0.64), cy = aspY*(seeds === 1 ? 0.5 : 0.18 + Math.random()*0.64), r0 = 0.02 + Math.random()*0.02, k = 24;
    const L = []; for(let i = 0; i < k; i++){ const a = i/k*Math.PI*2; L.push([cx + Math.cos(a)*r0, cy + Math.sin(a)*r0, 0]); } loops.push(L); }
  const sun = o.sun, sunK = o.photo;
  const cell = R, gw = Math.ceil(aspX/cell) + 1, gh = Math.ceil(aspY/cell) + 1;
  for(let it = 1; it <= iters; it++){
    let total = 0; for(const L of loops) total += L.length;
    // the spatial hash: every point, by cell
    const head = new Int32Array(gw*gh).fill(-1), next = new Int32Array(total), PX = new Float64Array(total), PY = new Float64Array(total);
    let q = 0; for(const L of loops) for(const p of L){ PX[q] = p[0]; PY[q] = p[1]; const c = Math.min(gh - 1, Math.max(0, p[1]/cell|0))*gw + Math.min(gw - 1, Math.max(0, p[0]/cell|0)); next[q] = head[c]; head[c] = q; q++; }
    q = 0;
    for(const L of loops){ const m = L.length, NX = new Float64Array(m), NY = new Float64Array(m);
      for(let i = 0; i < m; i++, q++){
        const p = L[i], a = L[(i - 1 + m) % m], b = L[(i + 1) % m];
        // follow the neighbours (the line keeps smooth), and push off everything near
        let fx = ((a[0] + b[0])/2 - p[0])*0.35, fy = ((a[1] + b[1])/2 - p[1])*0.35;
        const ci = p[0]/cell|0, cj = p[1]/cell|0;
        for(let j = cj - 1; j <= cj + 1; j++){ if(j < 0 || j >= gh) continue; for(let k2 = ci - 1; k2 <= ci + 1; k2++){ if(k2 < 0 || k2 >= gw) continue;
          for(let z = head[j*gw + k2]; z >= 0; z = next[z]){ if(z === q) continue; const dx = p[0] - PX[z], dy = p[1] - PY[z], dd = dx*dx + dy*dy;
            if(dd < R*R && dd > 1e-12){ const dl = Math.sqrt(dd), f = (R - dl)/R*0.5*d/dl; fx += dx*f; fy += dy*f; } } } }
        NX[i] = Math.min(aspX - 0.01, Math.max(0.01, p[0] + fx)); NY[i] = Math.min(aspY - 0.01, Math.max(0.01, p[1] + fy));
      }
      for(let i = 0; i < m; i++){ L[i][0] = NX[i]; L[i][1] = NY[i]; }
    }
    if(total >= cap) continue;
    // growth: split stretched edges; and a few new points where the light is (the sun pulls the growth its way)
    for(let li = 0; li < loops.length; li++){ const L = loops[li], out = [];
      for(let i = 0; i < L.length; i++){ const p = L[i], b = L[(i + 1) % L.length]; out.push(p);
        const dx = b[0] - p[0], dy = b[1] - p[1], len = Math.hypot(dx, dy);
        let grow = len > maxEdge;
        if(!grow && Math.random() < 0.012){ const nx = dy/(len || 1), ny = -dx/(len || 1), face = nx*sun.x + ny*sun.y; grow = Math.random() < 0.5 + 0.5*sunK*face; }
        if(grow) out.push([(p[0] + b[0])/2, (p[1] + b[1])/2, it]); }
      loops[li] = out; }
  }
  return { loops, iters };
}

// ---------------- KNOTWORK ----------------
// Celtic knotwork by Cromwell's method ("Celtic knotwork: mathematical art", 1993) as Mercat draws it: a PLAIT of
// diagonal strands crossing at the points of a lattice, over and under in turn; then BREAKS — barriers at some
// crossings that turn the two strands back instead of crossing them — make the knot. A crossing's over-strand is
// fixed by its column, so every strand alternates over, under, over along its whole length. The panel's outline
// (a circle, square, diamond, cross, quatrefoil, or the whole page) is itself a set of breaks: a crossing on the
// edge turns its strands back inside. Interior breaks are mirrored four ways, so the knot reads as a sigil.
// Returns pieces: { a: [x,y], b: [x,y], c: [x,y] (the crossing), kind: 'over' | 'under' | 'turn' | 'pass' } in lattice units.
function genKnot(o){
  // CROMWELL'S GRID: square cells (the panel is a set of them), crossings at the midpoints of their edges; the strands
  // run diagonally between a cell's edge midpoints. In doubled coordinates a cell's centre is (odd, odd) and a
  // crossing is (even, odd) on an upright edge or (odd, even) on a level one.
  const n = Math.max(2, Math.round(o.cells)), shape = o.shape;
  const inShape = (u, v) => { const a = Math.abs(u), b = Math.abs(v);
    if(shape === 0) return u*u + v*v <= 1.0;                                    // circle
    if(shape === 1) return a <= 0.9 && b <= 0.9;                                // square
    if(shape === 2) return a + b <= 1.1;                                        // diamond
    if(shape === 3) return (a <= 0.34 && b <= 1) || (b <= 0.34 && a <= 1);      // cross
    if(shape === 4){ const q = 0.46; return Math.hypot(a - q, v) <= 0.5 || Math.hypot(u, b - q) <= 0.5 || (a <= 0.42 && b <= 0.42); }   // quatrefoil
    return a <= o.aspX && b <= o.aspY;                                          // the whole page
  };
  const R = n*2, span = shape === 5 ? Math.ceil(n*Math.max(o.aspX, o.aspY)) + 1 : n + 1;
  const cells = new Set(), ck = (x, y) => x + ',' + y;
  // (o.hole: a cell left out, as the words are when Shape Aware asks the knot to go round them: the strands turn back at
  //  its edges as they do at the panel's own)
  for(let b = -span; b < span; b++) for(let a = -span; a < span; a++){ const x = 2*a + 1, y = 2*b + 1; if(inShape(x/R, y/R) && !(o.hole && o.hole(x, y))) cells.add(ck(x, y)); }
  const cell = (x, y) => cells.has(ck(x, y));
  const hsh = (a, b, k) => { const t = Math.sin(a*127.1 + b*311.7 + k*74.7 + o.salt*13.37)*43758.5453; return t - Math.floor(t); };
  // the ends: NE (+1,-1) NW (-1,-1) SE (+1,+1) SW (-1,+1), each half way to the next crossing
  const pieces = [], seen = new Set();
  const end = (c, dx, dy) => [c[0] + dx*0.5, c[1] + dy*0.5];
  for(const k of cells){ const [cx, cy] = k.split(',').map(Number);
    for(const [ex, ey] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]){
      const kk = ck(ex, ey); if(seen.has(kk)) continue; seen.add(kk);
      const upright = (ex & 1) === 0, c = [ex, ey];
      const A = upright ? cell(ex - 1, ey) : cell(ex, ey - 1), B = upright ? cell(ex + 1, ey) : cell(ex, ey + 1);
      const NE = end(c, 1, -1), NW = end(c, -1, -1), SE = end(c, 1, 1), SW = end(c, -1, 1);
      // A on the left (upright edge) or above (level edge); a break ALONG the edge bounces each side back on itself
      const along = (A && !B) || (B && !A) ? true : null;
      let brk = along ? 'along' : null;
      if(!brk){ const ax = Math.abs(ex), ay = Math.abs(ey), r = hsh(Math.min(ax, ay), Math.max(ax, ay), 1);
        if(r < o.breaks*0.5) brk = hsh(ax, ay, 2) < 0.5 ? 'along' : 'across'; }
      if(!brk){
        // a crossing: which strand is over follows the edge's kind, so every strand alternates along its length
        const first = !upright;
        pieces.push({ a: NE, b: SW, c, kind: first ? 'over' : 'under' }, { a: NW, b: SE, c, kind: first ? 'under' : 'over' });
        continue; }
      const alongPairs = upright ? [[NW, SW, A], [NE, SE, B]] : [[NW, NE, A], [SW, SE, B]];
      const acrossPairs = upright ? [[NW, NE, true], [SW, SE, true]] : [[NW, SW, true], [NE, SE, true]];
      for(const [p, q, live] of (brk === 'along' ? alongPairs : acrossPairs)) if(live) pieces.push({ a: p, b: q, c, kind: 'turn' });
    }
  }
  // (in cell units: halve, so a cell is one unit)
  for(const pc of pieces) for(const k of ['a', 'b', 'c']) pc[k] = [pc[k][0]/2, pc[k][1]/2];
  return pieces;
}
// Draws the pieces as ribbons: unders first, each over cut out of what's beneath it by a gap, then the overs.
// x: a context; T(p) → canvas [x, y]; s: one lattice unit in pixels; wd: the ribbon's width; fill / edge: its colours.
function genDrawKnot(x, pieces, T, s, wd, edge, fill, gap){
  const curve = pc => { const A = T(pc.a), B = T(pc.b), C = T(pc.c);
    x.beginPath(); x.moveTo(A[0], A[1]);
    if(pc.kind === 'turn'){ const k = 0.9; x.bezierCurveTo(A[0] + (C[0] - A[0])*k, A[1] + (C[1] - A[1])*k, B[0] + (C[0] - B[0])*k, B[1] + (C[1] - B[1])*k, B[0], B[1]); }
    else { x.lineTo(C[0], C[1]); x.lineTo(B[0], B[1]); } };
  const rib = pc => { curve(pc); x.strokeStyle = edge; x.lineWidth = wd; x.stroke(); curve(pc); x.strokeStyle = fill; x.lineWidth = wd*0.62; x.stroke(); };
  x.lineCap = 'butt'; x.lineJoin = 'round';
  for(const pc of pieces) if(pc.kind !== 'over') rib(pc);
  for(const pc of pieces) if(pc.kind === 'over'){ curve(pc); x.strokeStyle = gap; x.lineWidth = wd*1.55; x.stroke(); }
  // (the gap cleared the unders' ribbons where they pass beneath: draw them again outside it, then the over on top)
  for(const pc of pieces) if(pc.kind === 'over') rib(pc);
  x.lineCap = 'round';
  // the turns and passes again over any gap that clipped them
  for(const pc of pieces) if(pc.kind === 'turn' || pc.kind === 'pass') rib(pc);
}

// ---------------- MATRIX: the stuff a network grows through ----------------
// Five materials as a picture (a grey to tint), heights, and where something can creep through (its ways):
//   0 rock STRATA (bands of sediment; the ways are the bedding planes between them) · 1 PEBBLES (rounded stones; the
//   ways, the gaps between) · 2 SAND (fine grains in ripples; anywhere) · 3 FIBRES (a bundle, combed one way; between
//   the strands) · 4 SKIN (pores and creases; along the creases).
function genMatrix(ww, wh, unit, o){
  const N = ww*wh, kind = o.kind, z = o.zoom, pic = new Float32Array(N), H = new Float32Array(N), W = new Float32Array(N);
  const n1 = makeNoiseGrid(7, 7), n2 = makeNoiseGrid(31, 31), n3 = makeNoiseGrid(90, 90);
  const S = (g, c, u, v) => sampleNoiseGrid(g, c, c, u*(c - 1), v*(c - 1));
  // pebbles: jittered points, the nearest two (Worley)
  const cs = unit*0.06*z, gx = Math.ceil(ww/cs) + 2, gy = Math.ceil(wh/cs) + 2, P = new Float32Array(gx*gy*3);
  for(let i = 0; i < gx*gy; i++){ P[i*3] = 0.15 + Math.random()*0.7; P[i*3+1] = 0.15 + Math.random()*0.7; P[i*3+2] = Math.random(); }
  const ca = Math.cos(o.angle), sa = Math.sin(o.angle);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const i = y*ww + x, u = x/unit/z, v = y/unit/z, au = (u*ca + v*sa), av = (-u*sa + v*ca);
    let p = 0.5, h = 0.5, w = 0;
    if(kind === 0){ // strata: bands bent by slow noise; each band its own tone; a dark seam where bands meet
      const b = av*7 + (S(n1, 7, u*0.25, v*0.25) - 0.5)*1.6 + (S(n2, 31, u*0.4, v*0.4) - 0.5)*0.25, f = b - Math.floor(b), band = Math.floor(b);
      const tone = 0.35 + 0.4*((Math.sin(band*12.9898)*43758.5453) % 1 + 1) % 1;
      const seam = Math.exp(-Math.pow(Math.min(f, 1 - f)*14, 2));
      p = tone*(0.88 + 0.24*S(n3, 90, u*0.5, v*0.5)) - seam*0.18; h = 0.5 + tone*0.12 - seam*0.25 + (S(n3, 90, u*0.5, v*0.5) - 0.5)*0.06; w = seam; }
    else if(kind === 1){ // pebbles
      const fx = x/cs + 1, fy = y/cs + 1, ci = Math.floor(fx), cj = Math.floor(fy); let d1 = 9, d2 = 9, t = 0;
      for(let dj = -1; dj <= 1; dj++) for(let di = -1; di <= 1; di++){ const a = ci + di, b2 = cj + dj; if(a < 0 || b2 < 0 || a >= gx || b2 >= gy) continue; const k = b2*gx + a, dx = fx - a - P[k*3], dy = fy - b2 - P[k*3+1], d = Math.sqrt(dx*dx + dy*dy);
        if(d < d1){ d2 = d1; d1 = d; t = P[k*3+2]; } else if(d < d2) d2 = d; }
      const edge = d2 - d1, dome = Math.min(1, edge*3.2);
      p = (0.3 + 0.45*t)*(0.85 + 0.3*S(n3, 90, u, v))*(0.55 + 0.45*dome) ; h = Math.sqrt(dome)*0.8 + 0.1; w = Math.max(0, 1 - edge*7); }
    else if(kind === 2){ // sand
      const g = S(n3, 90, u*1.8, v*1.8), rip = Math.sin((av + (S(n1, 7, u*0.3, v*0.3) - 0.5)*0.6)*48)*0.5 + 0.5;
      p = 0.45 + (g - 0.5)*0.5 + rip*0.08; h = 0.5 + rip*0.12 + (g - 0.5)*0.1; w = 0.55 + 0.45*(1 - rip); }
    else if(kind === 3){ // fibres: noise stretched along the comb
      const f = S(n3, 90, au*0.08, av*1.8), f2 = S(n2, 31, au*0.05, av*0.9);
      p = 0.35 + f*0.45 + (f2 - 0.5)*0.2; h = 0.35 + f*0.5; w = Math.max(0, 1 - f*2.2); }
    else { // skin: pores, and creases where two noises' bands meet
      const c1 = Math.abs(S(n1, 7, u*0.6, v*0.6)*2 - 1), c2 = Math.abs(S(n2, 31, u*0.35, v*0.35)*2 - 1), crease = Math.exp(-c1*c1*120) + 0.6*Math.exp(-c2*c2*200);
      const pore = S(n3, 90, u*1.2, v*1.2); p = 0.62 - crease*0.16 - Math.max(0, pore - 0.72)*0.8; h = 0.6 - crease*0.25 - Math.max(0, pore - 0.72)*0.6; w = Math.min(1, crease); }
    pic[i] = Math.max(0, Math.min(1, p)); H[i] = Math.max(0, Math.min(1, h)); W[i] = Math.max(0, Math.min(1, w));
  }
  return [pic, H, W];
}
// ---------------- TENDRILS: a network grown through it ----------------
// SPACE COLONIZATION (Runions, Fuhrer, Lane, Mech & Prusinkiewicz, "Modeling trees with a space colonization
// algorithm", 2007; and leaf venation, 2005): points of attraction are scattered where the matrix lets something
// through; from a root, every node grows one step toward the average of the points that have it as their nearest
// (within reach), and a point is used up when a node arrives. So the network branches where it must and fills
// the space it was given. Its thickness follows how much it feeds (Murray's law: r³ adds at a branch).
function genTendrils(ww, wh, unit, W, o){
  const step = unit*0.006*o.zoom, reach = step*(10 + 22*o.branching), kill = step*2.2;
  const nA = Math.round(1800*o.amount*(ww*wh)/(unit*unit)/(o.zoom*o.zoom)), AX = [], AY = [];
  for(let t = 0; AX.length < nA && t < nA*30; t++){ const x = Math.random()*ww, y = Math.random()*wh, w = W[(y|0)*ww + (x|0)];
    if(Math.random() < 0.08 + 0.92*w*w) { AX.push(x); AY.push(y); } }
  // the roots: from the page's edge toward the dial's handle, or from a point (Slide moves it)
  const NX = [], NY = [], PAR = [];
  const rx = ww/2 - o.dx*ww*(0.5 - 0.5*o.inner) + o.dy*o.slide*ww*0.4, ry = wh/2 - o.dy*wh*(0.5 - 0.5*o.inner) - o.dx*o.slide*wh*0.4;
  const roots = Math.max(1, Math.round(o.roots));
  for(let r = 0; r < roots; r++){ NX.push(Math.min(ww - 1, Math.max(0, rx + (r - (roots - 1)/2)*o.dy*unit*0.18))); NY.push(Math.min(wh - 1, Math.max(0, ry - (r - (roots - 1)/2)*o.dx*unit*0.18))); PAR.push(-1); }
  const alive = new Uint8Array(AX.length).fill(1);
  const cell = reach, gw = Math.ceil(ww/cell) + 1, gh = Math.ceil(wh/cell) + 1;
  for(let it = 0; it < 420; it++){
    // the nodes in buckets
    const head = new Int32Array(gw*gh).fill(-1), next = new Int32Array(NX.length);
    for(let k = 0; k < NX.length; k++){ const c = Math.min(gh - 1, NY[k]/cell|0)*gw + Math.min(gw - 1, NX[k]/cell|0); next[k] = head[c]; head[c] = k; }
    const sx = new Float64Array(NX.length), sy = new Float64Array(NX.length), cnt = new Int32Array(NX.length); let any = false;
    for(let a = 0; a < AX.length; a++){ if(!alive[a]) continue;
      const ci = AX[a]/cell|0, cj = AY[a]/cell|0; let best = -1, bd = reach*reach;
      for(let j = cj - 1; j <= cj + 1; j++){ if(j < 0 || j >= gh) continue; for(let i = ci - 1; i <= ci + 1; i++){ if(i < 0 || i >= gw) continue;
        for(let k = head[j*gw + i]; k >= 0; k = next[k]){ const dx = AX[a] - NX[k], dy = AY[a] - NY[k], d = dx*dx + dy*dy; if(d < bd){ bd = d; best = k; } } } }
      if(best < 0) continue;
      if(bd < kill*kill){ alive[a] = 0; continue; }
      const d = Math.sqrt(bd); sx[best] += (AX[a] - NX[best])/d; sy[best] += (AY[a] - NY[best])/d; cnt[best]++; any = true; }
    if(!any) break;
    const n0 = NX.length;
    for(let k = 0; k < n0; k++){ if(!cnt[k]) continue; let dx = sx[k], dy = sy[k]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      // and it keeps to the ways: of the way toward the points and two a little either side, the one most open ahead
      let best = -1, bx = dx, by = dy;
      for(const t of [0, -0.55, 0.55]){ const c = Math.cos(t), sn = Math.sin(t), ex = dx*c - dy*sn, ey = dx*sn + dy*c, qx = NX[k] + ex*step*2, qy = NY[k] + ey*step*2;
        const w = qx < 0 || qy < 0 || qx >= ww || qy >= wh ? 0 : W[(qy|0)*ww + (qx|0)], sc = w*o.keep + (t === 0 ? 0.35 : 0);
        if(sc > best){ best = sc; bx = ex; by = ey; } }
      NX.push(NX[k] + bx*step); NY.push(NY[k] + by*step); PAR.push(k); }
    if(NX.length > 30000) break;
  }
  // the flow through each node (everything beyond it), for its thickness
  const n = NX.length, flow = new Float64Array(n).fill(1);
  for(let k = n - 1; k >= 0; k--) if(PAR[k] >= 0) flow[PAR[k]] += flow[k];
  return { NX, NY, PAR, flow };
}

// ---------------- CIRCUIT TRACES: a board's copper, routed ----------------
// The way circuit boards are routed by hand, and the way generative circuit patterns are usually drawn: a grid of
// cells one trace apart. CHIPS go down first, their pins round their edges. Then BUSES (one to eight traces side by
// side) walk out from the pins, the page's edges and lone vias: straight for a while, then turning together, by 45°
// (a board's chamfered corners) or by 90° (Factorio's belts), every trace keeping its distance from its neighbours
// round the corner (a mitred offset), until something is in the way or the bus has gone far enough. There each trace
// ends in a via or a pad. Every cell remembers the bus that crossed it, so no two buses cross. Small parts (resistors,
// capacitors) and stitching vias fill some of what is left, and a silkscreen names the parts.
// Everything is in CELLS (the page's short side is `across` cells), so the board is the same at any size.
const CIR_DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];   // E SE S SW W NW N NE (y down)
// a 3×5 font for the silkscreen's part names (U chips, R resistors, C capacitors, digits)
const CIR_FONT = { U: '101101101101111', R: '110101110101101', C: '111100100100111', 0: '111101101101111', 1: '010110010010111', 2: '111001111100111',
  3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
  // (the rest of the alphabet and a few marks, for the Era's names and the Markings' stamps)
  A: '010101111101101', B: '110101110101110', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '111100101101111', H: '101101111101101',
  I: '111010010010111', J: '001001001101111', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '111101101101111',
  P: '110101110100100', Q: '111101101111001', S: '111100111001111', T: '111010010010010', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', '-': '000000111000000', '.': '000000000000010', '/': '001001010100100', ' ': '000000000000000', '+': '000010111010000',
  ':': '000010000010000', '!': '010010010000010', '?': '111001011000010', '>': '100010001010100', '<': '001010100010001', '=': '000111000111000',
  '#': '101111101111101', ',': '000000000010100', "'": '010010000000000', '%': '101001010100101', '*': '000101010101000', '(': '010100100100010', ')': '010001001001010',
  // RUNES (Magitech's silkscreen: made up, a stave and its branches), written as a–l
  a: '010011010110010', b: '010111010010010', c: '101010010010101', d: '010010111010010', e: '110011010110011', f: '010101010101010',
  g: '011010010010110', h: '101110100110101', i: '010010010101101', j: '100110111110100', k: '001011111011001', l: '111010010010111' };
// the Markings' little pictures, 7×7 (the board's Easter eggs): a fox, a bird, a crescent moon, a star, a witch's hat,
// an eye; a moth (Ruby's light mode: the moths will find you), a cat, a ghost, a heart, a key, a mushroom, a potion, a
// ringed planet; and the page's own: a quill, an open book, an inkwell, a candle, a spiral, a speech bubble
const CIR_EGGS = [
  '1000001110001111111111011101111111101111100011100', '0000110000111101111101111100001110000010000010100',
  '0011100011000011000001100000110000001100000011100', '0001000000100011111110011100011011001000100000000',
  '0001000000110000111000011110011111011111110000000', '0000000011111011000111011101110001101111100000000',
  '0100010001010011010111111111011111011010111000001', '1000001110001111111111011101111111111010110111110',
  '0011100011111011010111111111111111111111111010101', '0110110111111111111110111110001110000010000000000',
  '0000000011000010010001001111011010100000000000000', '0011100011111011010111111111001010000101000111110',
  '0011100000100000010000011100011111001111100011100', '0000011001111001111101111111011111001111001100000',
  '0000011000011100011100011100011100001000001000000', '0000000111011110010011001001100100111101110001000',
  '0000100000100000111000100010111111111111110111110', '0001000001110000010000011100001110000111000111110',
  '1111111100000010111101010010101011010000101111110', '1111111100000110101011000001111111100110000010000'];
// what a stamp says, by its era (Today, Future, Quantum, Atomic, Magitech): made up, every word of it (no real marks,
// names or brands), the board's own and, now and then, the page's (Ruby: text Easter eggs and tech labels)
const CIR_SAYS = [
  ['REV A', 'REV B', 'REV C', 'LOT 0427', 'DO NOT FLEX', 'ESD SAFE', 'TP1', 'GND', '3V3', '5V0', 'MADE BY HAND', 'KEEP DRY', 'PASS QC', 'SER 0091',
   'VBAT', 'AGND', 'SDA', 'SCL', 'MOSI', 'MISO', 'TX >', '< RX', 'RST', 'BOOT', 'CLK IN', 'EN', 'PWR', 'LED1', 'SW1', 'J1', 'FB1', 'F1 2A', 'BAT+', 'BAT-',
   'PROTO 2', 'EVAL ONLY', 'NOT FOR SALE', 'DO NOT PROBE', 'CUT HERE', 'BRIDGE TO ENABLE', 'V1.3', 'WK 42', 'HAND SOLDER', 'NO CLEAN', 'THIS SIDE UP',
   'POEM IN', 'VERSE OUT', 'LINE 14', 'STANZA 3', 'RHYME BUS', 'METER CLK', 'IAMB X5', 'EM DASH', 'KERNING', 'LEADING 1.4', 'DRAFT 9', 'NO ADVERBS', 'INK ONLY'],
  ['PHOTONIC BUS', 'NEURAL MESH', 'FUSION OK', 'GRAV LINK', 'SYNTH CORE', 'LIGHT PIPE 4', 'SELF HEAL', 'ORBITAL', 'NANO FAB 9', 'DREAM CACHE',
   'WARP SAFE', 'FIELD COIL 2', 'ION BUS', 'PLASMA OK', 'HOLO IO', 'SENTIENT? NO', 'MESH NODE 7', 'GRAPHENE', 'COLD FUSION', 'VAC SEALED', 'ZERO G OK', 'LUNAR LOT 3',
   'MUSE LINK', 'VERSE CORE', 'SONNET ENGINE', 'METAPHOR UNIT', 'SIMILE CACHE', 'HAIKU 5-7-5', 'LYRIC BUS', 'ODE PROC', 'ELEGY SAFE', 'GHAZAL MODE'],
  ['KEEP BELOW 20 MK', 'QUBIT ARRAY', 'ENTANGLED', 'OBSERVE GENTLY', 'SUPERPOSED', 'COHERENT', 'DO NOT LOOK', 'PHASE 0/1', 'SPIN UP', 'TUNNEL',
   'DECOHERE', 'BOTH AND NEITHER', 'Q0 Q1 Q2', 'BELL PAIR', 'UNMEASURED', 'CRYO ONLY', 'HERE AND THERE', 'COLLAPSE ON READ', 'NOISE FLOOR', 'GATE H',
   'ENJAMBED', 'CAESURA', 'BOTH MEANINGS', 'UNREAD UNTIL READ', 'VOLTA', 'UNCERTAIN METER', 'THE CAT IS FINE', 'MEANING: ?'],
  ['WARDED', 'BOUND', 'THIRD MOON', 'SPELLBOUND', 'HEX SAFE', 'FAMILIAR PORT', 'MANA 9', 'BRAZIER', 'SIGIL 7', 'WITCH OK',
   'VALVE 6', 'BRASS WORKS', 'RADIANT', 'PRESSURE OK', 'TUBE WARM', 'GEAR 12', 'STEAM VENT', 'DIAL 0-9', 'LAMPLIT', 'MOTH LAMP', 'CANDLE OK',
   'QUILL WIRE', 'INKWELL 3', 'THE SCRIBE', 'BOOK OF HOURS', 'WAX SEAL', 'LETTERPRESS', 'TYPE CASE 4'],
  ['LEYLINE 3', 'AETHER BUS', 'SUMMON GATE', 'PRISM CORE', 'STAR SEAL', 'ARCANE IO', 'SPELL CACHE', 'HALO 7', 'CRYSTAL OK', 'MANA 12', 'LIGHT ONLY', 'SING TO IT',
   'MOON WELL', 'CIRCLE CLOSED', 'SIGIL ROM', 'RITE 3', 'ASTRAL OUT', 'GLYPH CORE', 'FAMILIAR LINK', 'WARD 9', 'MOTHS WELCOME',
   'RUNE INK', 'WORDS OF POWER', 'TRUE NAME', 'SPEAK IT', 'VERSE OF BINDING', 'SAY IT TWICE', 'THE SPELL IS A POEM']];
// the board's rarest stamps (Ruby: "Enceladus and sci-fi references … peppered into various surfaces … as a rare Easter
// egg"): now and then a stamp speaks of Saturn, Enceladus or the old stories of space, by its era, and a little
// picture is Enceladus with its plume. They draw from a stream of their own, so a board without one is as it was.
const CIR_SPACE = [
  ['ICE MOON', 'E RING', 'TIGER STRIPES', 'PLUME OK', 'SATURN 6', 'RINGED', "DON'T PANIC", '42'],
  ['ENCELADUS BASE', 'PLUME SAMPLER', 'E-RING DUST', 'RING HABITAT', 'GENERATION SHIP', 'ANSIBLE', 'DYSON GRID', 'FTL INHIBIT', 'HYPERSPACE OK'],
  ['SUBSURFACE SEA', 'UNDER THE ICE', 'GEYSER FIELD', 'FIRST CONTACT', 'WORMHOLE SAFE', 'TACHYON?', 'SATURN SIX'],
  ['SATURNINE', 'RINGED GOD', 'LEAD OF SATURN', 'ICE AND STEAM', 'GEYSER VALVE', 'ORRERY 6'],
  ['KITSUNE OF ENCELADUS', 'SEVEN TAILS', 'SATURN SEAL', 'RING OF ICE', 'MOON OF GEYSERS', 'THE E RING SINGS']];
const CIR_ENCELADUS = '0011100011111001101100111110001110001010101010101';
// the kinds of stamp each era prints, and how often (Today, Future, Quantum, Atomic, Magitech)
const CIR_STAMPS = [
  [['say', 50], ['barcode', 10], ['tp', 10], ['warn', 6], ['maker', 6], ['egg', 6]],
  [['say', 50], ['matrix', 12], ['barcode', 8], ['tp', 6], ['warn', 6], ['maker', 6], ['egg', 6]],
  [['say', 50], ['matrix', 14], ['barcode', 4], ['tp', 6], ['warn', 6], ['maker', 6], ['egg', 6]],
  [['say', 60], ['moons', 10], ['maker', 8], ['warn', 5], ['egg', 6]],
  [['say', 60], ['moons', 10], ['maker', 8], ['warn', 5], ['egg', 6]]];
// a small part's value, printed beside it (resistors · capacitors), and a chip's own marking on its package
const CIR_VALUES = [['10K', '4K7', '220', '1M', '47R', '100K', '2K2', '330', '68K', '1K'], ['100N', '10U', '4U7', '22P', '1N', '47U', '220N', '10P']];
const CIR_SYLL = ['AR', 'VEL', 'ION', 'KAI', 'SOL', 'NYX', 'OR', 'TEL', 'LUM', 'QUA', 'MER', 'ZEN', 'RHO', 'AXI', 'DRA', 'FEN'];
function genCircuit(cw, ch, o){
  const R = Math.random, occ = new Int32Array(cw*ch), age = new Int32Array(cw*ch);
  const inb = (x, y) => x >= 0 && y >= 0 && x < cw && y < ch, at = (x, y) => (y | 0)*cw + (x | 0);
  // a mask kept clear (the part's first input): those cells are taken before anything is placed
  if(o.clear) for(let y = 0; y < ch; y++) for(let x = 0; x < cw; x++) if(o.clear(x + 0.5, y + 0.5) > 0.5) occ[y*cw + x] = -3;
  const chips = [], smd = [], vias = [], traces = [], names = [];
  // ---- chips: square ones with pins on four sides, long ones on two ----
  const nChips = Math.round(o.parts*cw*ch/650) + (o.parts > 0.08 ? 1 : 0);
  for(let t = 0; t < nChips*14 && chips.length < nChips; t++){
    const quad = R() < 0.5, a = quad ? 5 + (R()*7 | 0) : 2 + (R()*2 | 0), b = quad ? a : 5 + (R()*9 | 0);
    const [W, H] = quad || R() < 0.5 ? [a, b] : [b, a];
    const x = 3 + (R()*Math.max(1, cw - W - 6) | 0), y = 3 + (R()*Math.max(1, ch - H - 6) | 0);
    let ok = x + W + 3 < cw && y + H + 3 < ch;
    for(let j = y - 3; j < y + H + 3 && ok; j++) for(let i = x - 3; i < x + W + 3; i++) if(!inb(i, j) || occ[j*cw + i]){ ok = false; break; }
    if(!ok) continue;
    for(let j = y - 1; j <= y + H; j++) for(let i = x - 1; i <= x + W; i++) occ[j*cw + i] = -1;
    const c = { x, y, w: W, h: H, pins: [], rank: R() }, sides = quad ? [0, 1, 2, 3] : W < H ? [1, 3] : [0, 2];
    for(const sd of sides){ const len = sd % 2 === 0 ? W : H;
      for(let k = 0; k < len; k++) c.pins.push({ side: sd, k, used: false, rank: -1,
        x: sd === 0 || sd === 2 ? x + k + 0.5 : sd === 1 ? x + W + 0.5 : x - 0.5, y: sd === 1 || sd === 3 ? y + k + 0.5 : sd === 0 ? y - 0.5 : y + H + 0.5, dir: [6, 0, 2, 4][sd] }); }
    chips.push(c); names.push({ kind: 'U', n: chips.length, x: x, y: y - 2.2, chip: c });
  }
  // ---- buses ----
  const free = (x, y, id, t) => { if(!inb(x, y)) return 2; const q = at(x, y), v = occ[q]; return v === 0 || (v === id && age[q] > t - 4) ? 1 : 0; };
  const mark = (ax, ay, bx, by, id, t) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)*4));
    for(let s = 0; s <= n; s++){ const x = ax + (bx - ax)*s/n, y = ay + (by - ay)*s/n; if(!inb(x, y)) continue; const q = at(x, y); if(occ[q] === 0 || occ[q] === id){ occ[q] = id; age[q] = t; } } };
  const nrm = d => { const [dx, dy] = CIR_DIRS[d], l = Math.hypot(dx, dy); return [dy/l, -dx/l]; };
  const nBus = Math.round((0.2 + 3.4*o.traces)*cw*ch/150);
  let id = 0;
  const walk = (P, d, k, start, near = null) => {
    id++; const offs = Array.from({ length: k }, (_, i) => i - (k - 1)/2), busRank = near == null ? R() : near*0.65 + R()*0.35;
    let n = nrm(d);
    const pts = offs.map(oi => [[P[0] + n[0]*oi, P[1] + n[1]*oi]]), cur = pts.map(p => p[0].slice());
    // is the bus's footprint free at Q (going dd)? 0 no · 1 yes · 2 the whole bus has left the page
    const ok = (Q, dd, t) => { const nn = nrm(dd); let out = 0;
      for(const oi of offs){ const f = free(Q[0] + nn[0]*oi, Q[1] + nn[1]*oi, id, t); if(f === 0) return 0; if(f === 2) out++; }
      // a little room either side, so two buses never touch
      for(const oi of [offs[0] - 0.8, offs[k - 1] + 0.8]) if(free(Q[0] + nn[0]*oi, Q[1] + nn[1]*oi, id, t) === 0) return 0;
      return out === k ? 2 : 1; };
    const maxSteps = 8 + Math.round(R()*R()*150), turnP = 0.05 + 0.08*R(), diagonal = dd => dd % 2 === 1;
    let t = 0, run = 0, mov = 0, end = R() < 0.62 ? 'via' : 'pad';
    while(t < maxSteps){
      t++;
      const [dx, dy] = CIR_DIRS[d], Q = [P[0] + dx, P[1] + dy], mid = [P[0] + dx/2, P[1] + dy/2];
      const f = ok(Q, d, t), fm = ok(mid, d, t);
      if(f === 2){ end = 'off'; for(let i = 0; i < k; i++) pts[i].push([Q[0] + n[0]*offs[i], Q[1] + n[1]*offs[i]]); mov++; break; }
      const blocked = !f || !fm;
      // time to turn: a diagonal is a short jog; a straight run turns now and then; a blocked one must
      const want = blocked || (run >= (diagonal(d) ? 2 + (R()*4 | 0) : 3) && R() < (diagonal(d) ? 0.45 : turnP));
      if(want){
        // which way: 45° (a board's chamfer) or 90° (a belt's corner), toward the side with more room
        const opts = diagonal(d) || R() < o.bends ? [1, -1] : [2, -2];
        const room = sg => { const dd = (d + sg + 8) % 8, [ex, ey] = CIR_DIRS[dd]; let r = 0;
          for(let q = 1; q <= 6; q++){ if(!ok([P[0] + ex*q, P[1] + ey*q], dd, t)) break; r++; } return r + R()*0.5; };
        let turned = false;
        for(const [sg, r] of opts.map(sg => [sg, room(sg)]).sort((a, b) => b[1] - a[1])){
          const d2 = (d + sg + 8) % 8;
          if(r < 2 || (!o.diag && diagonal(d2))) continue;
          // the corner: each trace turns where its offset line meets the new one (a mitre)
          const n2 = nrm(d2), c = n[0]*n2[0] + n[1]*n2[1], m = [(n[0] + n2[0])/(1 + c), (n[1] + n2[1])/(1 + c)];
          for(let i = 0; i < k; i++){ const q = [P[0] + m[0]*offs[i], P[1] + m[1]*offs[i]]; mark(cur[i][0], cur[i][1], q[0], q[1], id, t); pts[i].push(q); cur[i] = q; }
          d = d2; n = n2; run = 0; turned = true; break;
        }
        if(turned) continue;
        if(blocked) break;
      }
      // a step straight on: each trace's line marked as taken
      for(let i = 0; i < k; i++){ const q = [Q[0] + n[0]*offs[i], Q[1] + n[1]*offs[i]]; mark(cur[i][0], cur[i][1], q[0], q[1], id, t); cur[i] = q; }
      P = Q; run++; mov++;
    }
    if(mov < 2) return false;
    const [dx, dy] = CIR_DIRS[d], ln = Math.hypot(dx, dy);
    if(end !== 'off') for(let i = 0; i < k; i++){
      // each trace runs on to its end (every other one a little further, so neighbouring vias don't touch)
      const ext = end === 'via' && k > 1 && i % 2 ? 1.1 : 0; pts[i].push([cur[i][0] + dx/ln*ext, cur[i][1] + dy/ln*ext]); }
    offs.forEach((_, i) => traces.push({ pts: pts[i], rank: Math.min(1, Math.max(0, busRank + (R() - 0.5)*0.14)), bus: id, start, end: end === 'off' ? null : end, w: k }));
    return true;
  };
  for(let b = 0; b < nBus; b++){
    const r = R();
    const k = (q => q < 0.32 ? 1 : q < 0.46 ? 2 : q < 0.7 ? 3 + (R()*2 | 0) : 5 + (R()*4 | 0))(R());
    if(r < 0.5 && chips.length){
      // out of a chip: k pins side by side that nothing uses yet
      const c = chips[R()*chips.length | 0], sd = c.pins[R()*c.pins.length | 0].side, row = c.pins.filter(p => p.side === sd);
      // a run of k pins that nothing uses yet (as long a run as there is, up to k)
      const k2 = Math.min(k, row.length); let run = [];
      for(let tries = 0; tries < 6 && !run.length; tries++){ const s0 = R()*(row.length - k2 + 1) | 0, r2 = row.slice(s0, s0 + k2); if(!r2.some(p => p.used)) run = r2; }
      if(!run.length) continue;
      // pins on the left or top of a side are counted the other way round from the bus's offsets
      const P = [run.reduce((a, p) => a + p.x, 0)/run.length, run.reduce((a, p) => a + p.y, 0)/run.length];
      const before = traces.length;
      if(walk(P, run[0].dir, run.length, 'pin', c.rank)){ run.forEach(p => { p.used = true; });
        // which trace left from which pin: the nearest
        for(const tr of traces.slice(before)){ const s = tr.pts[0]; let best = null, bd = 9; for(const p of run){ const dd = Math.hypot(p.x - s[0], p.y - s[1]); if(dd < bd){ bd = dd; best = p; } } if(best) best.rank = tr.rank; } }
    } else if(r < 0.72){
      // in from the page's edge
      const e = R()*4 | 0, d = [2, 4, 6, 0][e], along = e % 2 === 0 ? cw : ch, s = 2 + (R()*(along - 4) | 0);
      const P = e === 0 ? [s + 0.5, -0.5] : e === 1 ? [cw + 0.5, s + 0.5] : e === 2 ? [s + 0.5, ch + 0.5] : [-0.5, s + 0.5];
      walk(P, d, k, 'edge');
    } else {
      // out of a row of vias, anywhere free
      const x = 2 + (R()*(cw - 4) | 0), y = 2 + (R()*(ch - 4) | 0);
      if(occ[at(x, y)]) continue;
      walk([x + 0.5, y + 0.5], o.diag ? R()*8 | 0 : (R()*4 | 0)*2, Math.min(k, 4), 'via');
    }
  }
  // ---- small parts and stitching vias in what is left ----
  const room = (x, y, w, h, m) => { for(let j = y - m; j < y + h + m; j++) for(let i = x - m; i < x + w + m; i++) if(!inb(i, j) || occ[j*cw + i]) return false; return true; };
  const nSmd = Math.round(o.parts*cw*ch/170);
  for(let t = 0; t < nSmd*6 && smd.length < nSmd; t++){
    const horiz = R() < 0.5, w = horiz ? 3 : 2, h = horiz ? 2 : 3, x = 1 + (R()*(cw - w - 2) | 0), y = 1 + (R()*(ch - h - 2) | 0);
    if(!room(x, y, w, h, 1)) continue;
    for(let j = y; j < y + h; j++) for(let i = x; i < x + w; i++) occ[j*cw + i] = -2;
    smd.push({ x, y, w, h, horiz, cap: R() < 0.45 }); if(R() < 0.5) names.push({ kind: smd[smd.length - 1].cap ? 'C' : 'R', n: smd.length, x: x + w + 0.4, y: y + 0.2 });
  }
  const nVia = Math.round(o.parts*cw*ch/260);
  for(let t = 0; t < nVia*4 && vias.length < nVia; t++){ const x = 1 + (R()*(cw - 2) | 0), y = 1 + (R()*(ch - 2) | 0); if(!room(x, y, 1, 1, 1)) continue; occ[y*cw + x] = -2; vias.push([x + 0.5, y + 0.5]); }
  // the names: only where they don't sit on copper
  const named = names.filter(nm => { const x = Math.floor(nm.x), y = Math.floor(nm.y); return room(x, y, 3, 2, 0); });
  // ---- THE ERA (Ruby: today's boards → the future's and quantum ones → the atomic (brass, valves; "a hell of a lot more
  //      like something I would imagine in Fallout") → magitech, as in Final Fantasy: crystals and optical computing,
  //      holography, runes, summoning circles) ----
  // Nothing of the layout moves: each chip, name and trace has its own era, set by its own hash, so more Era turns more
  // of the board toward the next one (at 0, every one is today's, exactly as before).
  const eh = k => { const v = Math.sin((k + 1)*91.17 + o.salt*12.9898)*43758.5453; return v - Math.floor(v); };
  const era = Math.max(0, Math.min(4, (o.era || 0)*4)), level = k => Math.min(4, Math.floor(era + eh(k)));
  const runes = (k, n) => Array.from({ length: n }, (_, i) => 'abcdefghijkl'[Math.floor(eh(k*7 + i)*12)]).join('');
  chips.forEach((c, i) => { c.era = level(100 + i); }); smd.forEach((p, i) => { p.era = level(501 + i); });
  // ---- WHAT IS WRITTEN, NEVER ON ANYTHING ELSE (Ruby: nothing placed on top of anything at high density) ----
  // Every word, rune, value and stamp takes its cells as it is placed (`taken`), and is placed only where neither
  // copper, a part nor another word lies. A name the era lengthens past its room is left off, as before.
  const taken = new Uint8Array(cw*ch);
  const clear = (x, y, w, h, m = 0) => { x = Math.floor(x); y = Math.floor(y);
    for(let j = y - m; j < y + h + m; j++) for(let i = x - m; i < x + w + m; i++) if(!inb(i, j) || occ[j*cw + i] || taken[j*cw + i]) return false; return true; };
  const take = (x, y, w, h) => { x = Math.floor(x); y = Math.floor(y); for(let j = y; j < y + h; j++) for(let i = x; i < x + w; i++) if(inb(i, j)) taken[j*cw + i] = 1; };
  const span = (txt, px = 0.24) => Math.ceil(txt.length*px*4);
  const shown = named.filter(nm => {
    const lv = nm.chip ? nm.chip.era : level(500 + nm.n);
    const txt = !lv ? nm.kind + nm.n : nm.kind === 'U' ? ['', 'NX' + nm.n, 'Q' + nm.n, runes(nm.n, 3), runes(nm.n + 40, 2)][lv] : ['', (nm.kind === 'C' ? 'CL' : 'PH') + nm.n, (nm.kind === 'C' ? 'CQ' : 'JJ') + nm.n, runes(600 + nm.n, 2), runes(640 + nm.n, 1)][lv];
    // (a magitech chip's name stands a little higher, over its hologram)
    if(lv === 4 && nm.chip) nm.y = nm.chip.y - 2.9;
    if(!clear(nm.x, nm.y, span(txt), 2)) return false;
    if(lv) nm.text = txt; take(nm.x, nm.y, span(txt), 2); return true; });
  // ---- THE MARKINGS (Ruby: stamps, labels, glyphs, made-up technology, by the seed; "a much wider variety of text
  //      related Easter eggs and tech labels") ----
  // What each part says of itself comes first, by its own hash (more Markings marks more of them, and moves nothing):
  // today's chips carry a maker's code and a date on their packages, today's small parts their values.
  const marks = o.marks || 0, syl = k => CIR_SYLL[Math.floor(eh(k)*16)];
  if(marks > 0){
    chips.forEach((c, i) => { if(c.era || eh(1500 + i) >= marks || c.w < 4 || c.h < 2) return;
      const room1 = Math.floor((c.w - 0.5)/0.72), code = (syl(1510 + i) + syl(1520 + i) + (eh(1530 + i) < 0.5 ? '-' : '') + Math.floor(10 + eh(1540 + i)*89)).slice(0, room1);
      c.mark = c.h >= 3 ? [code, ['WK', 'L', 'D', 'R'][Math.floor(eh(1550 + i)*4)] + Math.floor(10 + eh(1560 + i)*89)].map(t => t.slice(0, room1)) : [code]; });
    smd.forEach((p, i) => { if(p.era || eh(1600 + i) >= marks*0.8) return;
      const list = CIR_VALUES[p.cap ? 1 : 0], txt = list[Math.floor(eh(1610 + i)*list.length)], wc = span(txt, 0.2);
      for(const [x, y] of p.horiz ? [[p.x, p.y + p.h + 0.25], [p.x, p.y - 1.3]] : [[p.x - wc - 0.2, p.y + 1], [p.x + p.w + 0.3, p.y + 1]])
        if(clear(x, y, wc, 1)){ take(x, y, wc, 1); shown.push({ kind: 'V', n: i, x, y: y + 0.05, text: txt, px: 0.2 }); break; } });
  }
  // a rune or three beside a magitech trace's longest run
  const glyphs = [];
  traces.forEach((tr, ti) => { tr.id = ti; tr.era = level(800 + ti); });
  if(era > 0) traces.forEach((tr, ti) => { if(level(800 + ti) < 3 || tr.pts.length < 2) return;   // (atomic and magitech traces alike)
    let best = 0, A = null, Bp = null; for(let i = 1; i < tr.pts.length; i++){ const l = Math.hypot(tr.pts[i][0] - tr.pts[i - 1][0], tr.pts[i][1] - tr.pts[i - 1][1]); if(l > best){ best = l; A = tr.pts[i - 1]; Bp = tr.pts[i]; } }
    if(best < 6) return; const mx = (A[0] + Bp[0])/2, my = (A[1] + Bp[1])/2, dx = (Bp[0] - A[0])/best, dy = (Bp[1] - A[1])/best;
    const txt = runes(900 + ti, 1 + Math.floor(eh(950 + ti)*3)), x = mx - dy*1.4 - txt.length*0.48, y = my + dx*1.4 - 0.6;
    if(clear(x, y, span(txt), 2)){ take(x, y, span(txt), 2); glyphs.push({ x, y, text: txt }); } });
  // Then the stamps, found room for last, so they move nothing: each says what its own era would say.
  const stamps = [], nMarks = Math.round(marks*(1 + cw*ch/700)), CE = seedChoice(o.salt >>> 0, 'circuit eggs');
  if(nMarks > 0){
    const name = () => CIR_SYLL[R()*16 | 0] + CIR_SYLL[R()*16 | 0] + (R() < 0.6 ? '-' + (2 + (R()*98 | 0)) : '');
    const place = (wc, hc) => { for(let t = 0; t < 60; t++){ const x = 1 + (R()*Math.max(1, cw - wc - 2) | 0), y = 1 + (R()*Math.max(1, ch - hc - 2) | 0);
      if(clear(x, y, wc, hc, 1)){ for(let j = y; j < y + hc; j++) for(let i = x; i < x + wc; i++) occ[j*cw + i] = -4; take(x, y, wc, hc); return [x, y]; } } return null; };
    const at = (kind, wc, hc, more) => { const p = place(wc, hc); if(p) stamps.push({ kind, x: p[0], y: p[1], w: wc, h: hc, ...more }); };
    for(let k = 0; k < nMarks; k++){
      // what kind of stamp: by its era's own weights (a line of words most often)
      const lv = level(1000 + k), r = k === 0 ? 0 : R();
      let kind = k === 0 ? 'title' : k === 1 && marks > 0.35 ? 'egg' : null;
      if(!kind){ const W = CIR_STAMPS[lv]; let x = r*W.reduce((a, q) => a + q[1], 0); for(const [kd, wt] of W){ if(x < wt){ kind = kd; break; } x -= wt; } kind = kind || 'say'; }
      if(kind === 'egg'){ const e = R()*CIR_EGGS.length | 0; at(kind, 3, 3, { egg: CE() < 0.2 ? -1 : e }); continue; }
      if(kind === 'matrix'){ at(kind, 2, 2, { bits: Array.from({ length: 36 }, () => R() < 0.5) }); continue; }
      if(kind === 'barcode'){ let x = 0; const bars = []; while(x < 5.4){ const w = 0.12 + (R()*3 | 0)*0.1; if(R() < 0.55) bars.push([x, w]); x += w + 0.1; }
        at(kind, 6, 3, { bars, code: Array.from({ length: 6 }, () => R()*10 | 0).join('') }); continue; }
      if(kind === 'warn'){ const word = [['HOT', 'HV', 'ESD', 'LASER', 'HIGH VOLTAGE'], ['PLASMA', 'FIELD', 'G FORCE', 'RADIATION'], ['CRYO', 'OBSERVER', 'DO NOT LOOK', 'COHERENCE'],
          ['RADIANT', 'PRESSURE', 'HOT BRASS', 'STEAM'], ['MANA', 'SUMMONING', 'WILD MAGIC', 'DO NOT SPEAK']][lv], txt = word[R()*word.length | 0];
        at(kind, span(txt) + 3, 2, { text: txt }); continue; }
      if(kind === 'tp'){ const txt = 'TP' + (1 + (R()*40 | 0)); at(kind, span(txt) + 2, 2, { text: txt }); continue; }
      if(kind === 'maker'){ at(kind, 3, 3, { text: 'ABCDEFGHJKLMNPRSTVWXYZ'[R()*22 | 0] + 'ABCDEFGHJKLMNPRSTVWXYZ'[R()*22 | 0], lv }); continue; }
      if(kind === 'moons'){ at(kind, 6, 2, { phase: R() }); continue; }
      const lines = kind === 'title' ? [lv >= 3 ? runes(1100, 4) + ' ' + name() : name(), lv >= 3 ? runes(1200, 3) : ['REV ', 'MK ', 'GEN ', 'CIRCLE '][lv] + 'ABCDEFGH'[R()*8 | 0]]
        : [lv >= 3 && R() < 0.4 ? runes(1300 + k, 2 + (R()*4 | 0)) : (t => CE() < 0.07 ? CIR_SPACE[lv][CE()*CIR_SPACE[lv].length | 0] : t)(CIR_SAYS[lv][R()*CIR_SAYS[lv].length | 0])];
      const wc = Math.ceil(Math.max(...lines.map(t => t.length))*0.96 + 0.6), hc = Math.ceil(lines.length*1.45 + 0.4);
      at(kind, wc, hc, { lines, box: kind === 'title' || R() < 0.35 });
    }
  }
  // ---- THE POEM KEPT CLEAR (Ruby: no traces under the text), cut away last, so the rest of the board never moves
  //      as the poem changes: what lies under it is lifted, and a trace cut by it ends in a via at the cut ----
  if(o.cut){
    const out = (x, y) => !o.cut(x, y), boxOut = (x, y, w, h) => out(x, y) && out(x + w, y) && out(x, y + h) && out(x + w, y + h) && out(x + w/2, y + h/2);
    const keepChips = new Set(chips.filter(c => boxOut(c.x - 1, c.y - 1, c.w + 2, c.h + 2)));
    const cutTraces = [];
    for(const tr of traces){
      let piece = [], first = true;
      const flush = (endsCut) => { if(piece.length >= 2){ let L = 0; for(let i = 1; i < piece.length; i++) L += Math.hypot(piece[i][0] - piece[i - 1][0], piece[i][1] - piece[i - 1][1]);
          if(L >= 1.2) cutTraces.push({ ...tr, pts: piece, start: first ? tr.start : 'via', end: endsCut ? 'via' : tr.end }); }
        piece = []; first = false; };
      for(let i = 0; i < tr.pts.length; i++){
        const a = tr.pts[i];
        if(i === 0){ if(out(a[0], a[1])) piece.push(a); else first = false; continue; }
        const b = tr.pts[i - 1], n = Math.max(1, Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1])*4));
        for(let k = 1; k <= n; k++){ const p = [b[0] + (a[0] - b[0])*k/n, b[1] + (a[1] - b[1])*k/n], o2 = out(p[0], p[1]);
          if(o2){ if(!piece.length && k < n){ piece.push(p); continue; } if(k === n) piece.push(a); }
          else if(piece.length){ piece.push(p); flush(true); } }
      }
      flush(false);
    }
    // (a trace that ran into a lifted chip keeps its pins' end only where the chip stays)
    return { chips: chips.filter(c => keepChips.has(c)), smd: smd.filter(p => boxOut(p.x, p.y, p.w, p.h)), vias: vias.filter(v => out(v[0], v[1])), traces: cutTraces,
      names: shown.filter(nm => (!nm.chip || keepChips.has(nm.chip)) && boxOut(nm.x, nm.y, (nm.text || 'U00').length*0.96, 1.2)),
      glyphs: glyphs.filter(gl => boxOut(gl.x, gl.y, gl.text.length*0.96, 1.2)), stamps: stamps.filter(st => boxOut(st.x, st.y, st.w || 3, st.h || 3)) };
  }
  return { chips, smd, vias, traces, names: shown, glyphs, stamps };
}
// A chip of another era, drawn in place of today's (its pins are drawn after, as today's are). What of it lights
// is copper with the chip's own grey (each trace's way), so Charge powers it as it powers the traces.
//   1 · the future's: a chamfered body with a window across it that lights, corner brackets for an outline
//   2 · quantum: no package at all, a cross of bare metal (a qubit) on the board, a serpentine resonator, a dashed keep-out
//   3 · magitech: a dark body set with gems that light, ringed by a sigil (a star in an oval)
function cirEraChip(c, K){
  const { CU, HT, PD, PT, EA, LG, rect, disc, line, poly, s, tw, g } = K, x0 = c.x - 0.1, y0 = c.y - 0.1, W = c.w + 0.2, H = c.h + 0.2, mx = c.x + c.w/2, my = c.y + c.h/2, m = Math.min(c.w, c.h);
  const h = k => { const v = Math.sin((c.x*31 + c.y*17 + k)*12.9898)*43758.5453; return v - Math.floor(v); };
  const used = c.pins.filter(p => p.rank >= 0), e = g(0.1 + 0.85*(used.length ? Math.max(...used.map(p => p.rank)) : h(9)));
  const lit = (draw) => { draw(CU, '#fff'); draw(PD, '#fff'); draw(EA, e); };
  const wide = c.w >= c.h, long = Math.max(c.w, c.h) > m*1.6;
  if(c.era === 1){
    const k = Math.min(0.9, m*0.25), body = [[x0 + k, y0], [x0 + W - k, y0], [x0 + W, y0 + k], [x0 + W, y0 + H - k], [x0 + W - k, y0 + H], [x0 + k, y0 + H], [x0, y0 + H - k], [x0, y0 + k]];
    poly(PT, body, '#fff'); poly(HT, body, 'rgb(205,205,205)');
    const win = wide ? [c.x + 0.7, my - 0.2, c.w - 1.4, 0.4] : [mx - 0.2, c.y + 0.7, 0.4, c.h - 1.4];
    lit((x, col) => rect(x, ...win, col)); rect(HT, ...win, 'rgb(214,214,214)');
    LG.strokeStyle = '#fff'; LG.lineWidth = 0.12*s;
    for(const [ax, ay, sx, sy] of [[c.x - 1.15, c.y - 1.15, 1, 1], [c.x + c.w + 1.15, c.y - 1.15, -1, 1], [c.x - 1.15, c.y + c.h + 1.15, 1, -1], [c.x + c.w + 1.15, c.y + c.h + 1.15, -1, -1]]){
      LG.beginPath(); LG.moveTo(ax*s, (ay + sy*1.2)*s); LG.lineTo(ax*s, ay*s); LG.lineTo((ax + sx*1.2)*s, ay*s); LG.stroke(); }
    poly(LG, [[c.x - 1.15, c.y - 0.5], [c.x - 0.5, c.y - 1.15], [c.x - 1.15, c.y - 1.15]], '#fff');
    return;
  }
  if(c.era === 2){
    const ax = long ? (wide ? c.w*0.42 : 0.6) : Math.max(0.9, m*0.42), ay = long ? (wide ? 0.6 : c.h*0.42) : ax, aw = 0.45;
    for(const r of [[mx - ax, my - aw/2, ax*2, aw], [mx - aw/2, my - ay, aw, ay*2]]){ lit((x, col) => rect(x, ...r, col)); rect(HT, ...r, 'rgb(118,118,118)'); }
    // the resonator: a meander beside the cross, along the chip's long side
    if(c.w >= 4 && c.h >= 4){ const turns = 2 + Math.floor(h(1)*3), pitch = (c.w*0.5 - 0.6)/(turns*2), top = c.y + 0.5, bot = my - 0.7, pts = [[mx + 0.4, bot]];
      let x = mx + 0.4; for(let i = 0; i < turns*2; i++){ pts.push([x, i % 2 ? bot : top]); x += pitch; pts.push([x, i % 2 ? bot : top]); }
      line(CU, pts, tw*0.55*s, '#fff'); line(PD, pts, tw*0.55*s, '#fff'); line(HT, pts, tw*0.55*s, 'rgb(104,104,104)'); }
    // flux lines to the middle pin of each side
    for(const sd of [0, 1, 2, 3]){ const ps = c.pins.filter(p => p.side === sd); if(!ps.length) continue; const p = ps[ps.length >> 1];
      const end = sd === 0 ? [mx, my - ay] : sd === 1 ? [mx + ax, my] : sd === 2 ? [mx, my + ay] : [mx - ax, my];
      line(CU, [end, [p.x, p.y]], tw*0.45*s, '#fff'); line(PD, [end, [p.x, p.y]], tw*0.3*s, '#fff'); }
    LG.strokeStyle = '#fff'; LG.lineWidth = 0.1*s; if(LG.setLineDash) LG.setLineDash([0.5*s, 0.4*s]);
    LG.strokeRect((c.x - 1.15)*s, (c.y - 1.15)*s, (c.w + 2.3)*s, (c.h + 2.3)*s); if(LG.setLineDash) LG.setLineDash([]);
    return;
  }
  if(c.era === 4){ cirMagitekChip(c, K, h, e, mx, my, m, long, wide); return; }
  // ATOMIC (the era that was Magitech's first: Ruby, "it starts to go steampunk, with crystals and things that look maybe
  // low-tech combined with things that look extremely high-tech" — it went Fallout, and stays): a brass gear for a body,
  // spoked over the dark, a cut crystal set in its hub that lights with the charge, rivets round it; a long one is a
  // riveted brass bar set with a row of crystals
  const { BR } = K, crystal = (cx, cy, r) => { const pts = [[cx, cy - r], [cx + r*0.5, cy - r*0.45], [cx + r*0.5, cy + r*0.45], [cx, cy + r], [cx - r*0.5, cy + r*0.45], [cx - r*0.5, cy - r*0.45]];
    lit((x, col) => poly(x, pts, col)); poly(HT, pts, 'rgb(240,240,240)'); line(HT, [[cx, cy - r], [cx, cy + r]], 0.06*s, 'rgb(255,255,255)'); };
  const rivet = (x, y) => { disc(BR, [x, y], 0.2, '#fff'); disc(HT, [x, y], 0.2, 'rgb(214,214,214)'); };
  if(!long){
    const R = m/2 + 0.35, teeth = 8 + Math.floor(h(2)*6), hub = Math.max(0.55, R*0.38), spokes = 3 + Math.floor(h(3)*3);
    disc(PT, [mx, my], R, '#fff'); disc(HT, [mx, my], R, 'rgb(150,150,150)');
    const gear = []; for(let k = 0; k < teeth*4; k++){ const a = (k/(teeth*4))*Math.PI*2 + h(4), on = (k % 4) < 2, rr = on ? R + 0.32 : R; gear.push([mx + Math.cos(a)*rr, my + Math.sin(a)*rr]); }
    poly(BR, gear, '#fff'); poly(HT, gear, 'rgb(200,200,200)');
    // the windows between the spokes show the dark beneath
    const r1 = R - 0.35, r0 = hub + 0.2;
    if(r1 - r0 > 0.25) for(let k = 0; k < spokes; k++){ const a0 = (k + 0.18)/spokes*Math.PI*2 + h(5), a1 = (k + 0.82)/spokes*Math.PI*2 + h(5);
      for(const X of [BR, HT]){ X.fillStyle = X === BR ? '#000' : 'rgb(150,150,150)'; X.beginPath(); X.arc(mx*s, my*s, r1*s, a0, a1); X.arc(mx*s, my*s, r0*s, a1, a0, true); X.closePath(); X.fill(); } }
    disc(BR, [mx, my], hub, '#000'); crystal(mx, my, hub*0.95);
    for(let k = 0; k < 4; k++){ const a = k*Math.PI/2 + Math.PI/4; rivet(mx + Math.cos(a)*(R + 0.75), my + Math.sin(a)*(R + 0.75)); }
  } else {
    const L = Math.max(c.w, c.h), n = Math.max(1, Math.round(L/2.6)), ux = wide ? 1 : 0, uy = wide ? 0 : 1, bw = wide ? W : W, bh = H;
    rect(BR, x0, y0, bw, bh, '#fff'); rect(HT, x0, y0, bw, bh, 'rgb(196,196,196)');
    for(let k = 0; k < n; k++){ const t = n === 1 ? 0 : -L/2 + 1.3 + (L - 2.6)*k/(n - 1), cx = mx + ux*t, cy = my + uy*t, r = Math.max(0.4, m*0.42);
      disc(BR, [cx, cy], r + 0.08, '#000'); crystal(cx, cy, r); }
    rivet(mx - ux*(L/2 - 0.35) , my - uy*(L/2 - 0.35)); rivet(mx + ux*(L/2 - 0.35), my + uy*(L/2 - 0.35));
  }
  // the silkscreen: an engraved plate's border, its corners clipped, as a maker's plate would have
  { const k = 0.6, X0 = c.x - 1.15, Y0 = c.y - 1.15, X1 = c.x + c.w + 1.15, Y1 = c.y + c.h + 1.15;
    poly(LG, [[X0 + k, Y0], [X1 - k, Y0], [X1, Y0 + k], [X1, Y1 - k], [X1 - k, Y1], [X0 + k, Y1], [X0, Y1 - k], [X0, Y0 + k]], '#fff', false, 0.1); }
}
// MAGITECH, as Final Fantasy's (Ruby: "optical computing and crystals embedded in motherboards and all kinds of weird
// stuff that diverges a bit from what a person would consider to be real, possibly with some holography, runes,
// summoning circles"). A square chip is a cut crystal set in the board in a silver bezel, ringed by a summoning circle
// (two rings, runes between, a star inside); light guides curve from it to its pins; over some, a hologram's rings hang.
// A long one is a crystal rod in a cradle, runes along it. What lights is drawn in Arcana (its own light) and in Each
// Trace's grey, so Charge powers it as it powers the copper.
function cirMagitekChip(c, K, h, e, mx, my, m, long, wide){
  const { HT, PD, PT, EA, LG, AR, poly, line, disc, s } = K;
  const ring = (X, cx, cy, r, w, col, a0 = 0, a1 = Math.PI*2) => { X.strokeStyle = col; X.lineWidth = w*s; X.beginPath(); X.arc(cx*s, cy*s, r*s, a0, a1); X.stroke(); };
  const glow = (draw, a = 1) => { AR.globalAlpha = a; draw(AR, '#fff'); AR.globalAlpha = 1; draw(EA, e); };
  const gem = (cx, cy, rx, ry, rot = 0) => {
    const n = 6, pts = Array.from({ length: n }, (_, k) => { const a = rot + k/n*Math.PI*2; return [cx + Math.cos(a)*rx, cy + Math.sin(a)*ry]; });
    // the bezel (silver, raised), the stone in it (it glows), its facets (lines to a table in the middle)
    const bez = pts.map(([x, y]) => [cx + (x - cx)*1.22, cy + (y - cy)*1.22]);
    poly(PT, bez, '#fff'); poly(HT, bez, 'rgb(212,212,212)'); poly(PD, bez, '#fff');
    poly(PD, pts, '#000'); poly(HT, pts, 'rgb(236,236,236)');
    glow((X, col) => poly(X, pts, col), 0.75);
    const tbl = pts.map(([x, y]) => [cx + (x - cx)*0.45, cy + (y - cy)*0.45]);
    glow((X, col) => poly(X, tbl, col), 1);
    for(let k = 0; k < n; k++){ line(HT, [pts[k], tbl[k]], 0.07*s, 'rgb(255,255,255)'); line(AR, [pts[k], tbl[k]], 0.08*s, '#fff'); } };
  if(!long){
    const R = Math.max(c.w, c.h)/2 + 0.9, n = 5 + Math.floor(h(6)*3);
    // the summoning circle: the silkscreen's lines, and its light
    for(const X of [LG]){ ring(X, mx, my, R, 0.12, '#fff'); ring(X, mx, my, R*0.8, 0.1, '#fff'); }
    glow((X, col) => { ring(X, mx, my, R, 0.16, col); ring(X, mx, my, R*0.8, 0.12, col); }, 0.7);
    const star = Array.from({ length: n }, (_, k) => { const a = -Math.PI/2 + k/n*Math.PI*2 + h(7); return [mx + Math.cos(a)*R*0.8, my + Math.sin(a)*R*0.8]; });
    for(let k = 0; k < n; k++){ const A = star[k], B = star[(k + 2) % n]; line(LG, [A, B], 0.08*s, '#fff'); AR.globalAlpha = 0.5; line(AR, [A, B], 0.1*s, '#fff'); AR.globalAlpha = 1; line(EA, [A, B], 0.1*s, e); }
    // runes round the band between the rings
    const nr = Math.max(6, Math.floor(R*2*Math.PI*0.9/1.2));
    for(let k = 0; k < nr; k++){ const a = k/nr*Math.PI*2, rr = R*0.9, bits = CIR_FONT['abcdefghijkl'[Math.floor(h(20 + k)*12)]], px = 0.13, x0 = mx + Math.cos(a)*rr - px*1.5, y0 = my + Math.sin(a)*rr - px*2.5;
      for(let r = 0; r < 5; r++) for(let q = 0; q < 3; q++) if(bits[r*3 + q] === '1'){ LG.fillStyle = '#fff'; LG.fillRect((x0 + q*px)*s, (y0 + r*px)*s, px*0.9*s, px*0.9*s); AR.globalAlpha = 0.6; AR.fillStyle = '#fff'; AR.fillRect((x0 + q*px)*s, (y0 + r*px)*s, px*0.9*s, px*0.9*s); AR.globalAlpha = 1; } }
    // the crystal at its heart
    gem(mx, my, m*0.32 + 0.2, (m*0.32 + 0.2)*1.15, -Math.PI/2);
    // light guides: a curve of light from the crystal to every pin in use
    for(const p of c.pins){ if(p.rank < 0) continue; const a = Math.atan2(p.y - my, p.x - mx), r0 = m*0.42 + 0.3, sx = mx + Math.cos(a)*r0, sy = my + Math.sin(a)*r0, k1 = [(sx + p.x)/2 + Math.sin(a)*0.6, (sy + p.y)/2 - Math.cos(a)*0.6];
      const pts = Array.from({ length: 9 }, (_, i) => { const t = i/8; return [(1 - t)*(1 - t)*sx + 2*(1 - t)*t*k1[0] + t*t*p.x, (1 - t)*(1 - t)*sy + 2*(1 - t)*t*k1[1] + t*t*p.y]; });
      line(HT, pts, 0.16*s, 'rgb(150,150,150)'); line(AR, pts, 0.1*s, '#fff'); line(EA, pts, 0.22*s, K.g(0.1 + 0.85*p.rank)); }
    // a hologram over some: broken rings of light hanging above the chip, ticks round them
    // (close about the circle, inside the room the chip keeps: Ruby, nothing on top of anything)
    if(h(8) < 0.55){ AR.globalAlpha = 0.4; for(const [rr, a0, span] of [[R + 0.28, h(9)*6.3, 4.2], [R + 0.5, h(10)*6.3, 2.6]]){ ring(AR, mx, my, rr, 0.07, '#fff', a0, a0 + span);
        for(let k = 0; k < 24; k++){ const a = a0 + span*k/24; line(AR, [[mx + Math.cos(a)*rr, my + Math.sin(a)*rr], [mx + Math.cos(a)*(rr + 0.16), my + Math.sin(a)*(rr + 0.16)]], 0.05*s, '#fff'); } }
      AR.globalAlpha = 1; }
  } else {
    // a crystal rod lying in a cradle, its facets running its length, runes along it
    const L = Math.max(c.w, c.h), ux = wide ? 1 : 0, uy = wide ? 0 : 1, vx = uy, vy = ux, half = L/2 - 0.2, t = Math.max(0.45, m*0.38);
    const rod = [[-half - t*0.8, 0], [-half, -t], [half, -t], [half + t*0.8, 0], [half, t], [-half, t]].map(([a, b]) => [mx + ux*a + vx*b, my + uy*a + vy*b]);
    const cradle = rod.map(([x, y]) => [mx + (x - mx)*1.08 + vx*0, my + (y - my)*1.35]);
    poly(PT, cradle, '#fff'); poly(HT, cradle, 'rgb(200,200,200)'); poly(PD, cradle, '#fff'); poly(PD, rod, '#000');
    poly(HT, rod, 'rgb(240,240,240)'); glow((X, col) => poly(X, rod, col), 0.75);
    glow((X, col) => line(X, [[mx - ux*half + vx*0, my - uy*half], [mx + ux*half, my + uy*half]], 0.16*s, col), 1);
    for(const sg of [-1, 1]) line(HT, [[mx - ux*half + vx*sg*t*0.5, my - uy*half + vy*sg*t*0.5], [mx + ux*half + vx*sg*t*0.5, my + uy*half + vy*sg*t*0.5]], 0.06*s, 'rgb(255,255,255)');
    const n = Math.max(2, Math.floor(L/1.1)); for(let k = 0; k < n; k++){ const a = -half + 0.5 + (2*half - 1)*k/Math.max(1, n - 1), x = mx + ux*a + vx*(t + 0.75) - 0.2, y = my + uy*a + vy*(t + 0.75) - 0.3, bits = CIR_FONT['abcdefghijkl'[Math.floor(h(30 + k)*12)]];
      for(let r = 0; r < 5; r++) for(let q = 0; q < 3; q++) if(bits[r*3 + q] === '1'){ LG.fillStyle = '#fff'; LG.fillRect((x + q*0.13)*s, (y + r*0.13)*s, 0.12*s, 0.12*s); } }
  }
}
// The board drawn: s pixels a cell. Each of the part's maps is its own canvas (see the part).
function genDrawCircuit(B, ww, wh, s, o){
  const mk = () => kitCanvas(ww, wh), cv = {}, fillAll = (x, c) => { x.fillStyle = c; x.fillRect(0, 0, ww, wh); };
  for(const k of ['copper', 'height', 'each', 'data', 'pads', 'parts', 'legend', 'brass', 'arcana']){ const [c, x] = mk(); fillAll(x, k === 'height' ? 'rgb(77,77,77)' : '#000'); x.lineCap = 'round'; x.lineJoin = 'round'; cv[k] = [c, x]; }
  const g = v => { const q = Math.round(Math.max(0, Math.min(1, v))*255); return `rgb(${q},${q},${q})`; };
  const line = (x, pts, w, col) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0]*s, p[1]*s) : x.moveTo(p[0]*s, p[1]*s)); x.stroke(); };
  const disc = (x, p, r, col) => { x.fillStyle = col; x.beginPath(); x.arc(p[0]*s, p[1]*s, r*s, 0, Math.PI*2); x.fill(); };
  const rect = (x, X, Y, W, H, col) => { x.fillStyle = col; x.fillRect(X*s, Y*s, W*s, H*s); };
  const [, CU] = cv.copper, [, HT] = cv.height, [, EA] = cv.each, [, DA] = cv.data, [, PD] = cv.pads, [, PT] = cv.parts, [, LG] = cv.legend, [, BR] = cv.brass, [, AR] = cv.arcana;
  const tw = 0.34;
  // the traces: copper, raised a little, and each one's own grey (drawn wide, so a cutoff takes the whole trace)
  for(const tr of B.traces){
    const e = g(0.1 + 0.85*tr.rank);   // (never quite white: a cutoff at the top passes none)
    line(CU, tr.pts, tw*s, '#fff'); line(HT, tr.pts, tw*s, 'rgb(107,107,107)'); line(EA, tr.pts, 0.78*s, e);
    const ends = [];
    if(tr.start === 'via') ends.push([tr.pts[0], 'via']);
    if(tr.end) ends.push([tr.pts[tr.pts.length - 1], tr.end]);
    for(const [p, kind] of ends){
      if(kind === 'via'){ disc(CU, p, 0.4, '#fff'); disc(HT, p, 0.4, 'rgb(117,117,117)'); disc(HT, p, 0.16, 'rgb(31,31,31)'); disc(CU, p, 0.16, '#000'); disc(PD, p, 0.4, '#fff'); disc(PD, p, 0.16, '#000'); disc(EA, p, 0.46, e); }
      else { rect(CU, p[0] - 0.36, p[1] - 0.36, 0.72, 0.72, '#fff'); rect(HT, p[0] - 0.36, p[1] - 0.36, 0.72, 0.72, 'rgb(117,117,117)'); rect(PD, p[0] - 0.36, p[1] - 0.36, 0.72, 0.72, '#fff'); rect(EA, p[0] - 0.42, p[1] - 0.42, 0.84, 0.84, e); }
    }
  }
  // the silkscreen's letters (and runes), px cells a font pixel
  const write = (txt, X, Y, px = 0.24) => { let x0 = X; for(const ch of txt){ const bits = CIR_FONT[ch] || ''; for(let r = 0; r < 5; r++) for(let q = 0; q < 3; q++) if(bits[r*3 + q] === '1') rect(LG, x0 + q*px, Y + r*px, px*0.92, px*0.92, '#fff'); x0 += px*4; } };
  const poly = (x, pts, col, fill = true, w = 0.12) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0]*s, p[1]*s) : x.moveTo(p[0]*s, p[1]*s)); x.closePath();
    if(fill){ x.fillStyle = col; x.fill(); } else { x.strokeStyle = col; x.lineWidth = w*s; x.stroke(); } };
  // the chips: a dark body standing well above the board, a pin pad at every pin, a dimple at pin one
  // (or, as the Era turns them: the future's, a quantum qubit, a magitech sigil — their pins are where they were)
  for(const c of B.chips){
    if(c.era){ cirEraChip(c, { CU, HT, PD, PT, EA, LG, BR, AR, rect, disc, line, poly, s, tw, g });
      for(const p of c.pins){ const [dx, dy] = CIR_DIRS[p.dir], L = 0.75, W = 0.4, cx = p.x - dx*0.15, cy = p.y - dy*0.15;
        const [X, Y, Wd, Hd] = dx ? [cx - L/2, cy - W/2, L, W] : [cx - W/2, cy - L/2, W, L];
        rect(CU, X, Y, Wd, Hd, '#fff'); rect(PD, X, Y, Wd, Hd, '#fff'); rect(HT, X, Y, Wd, Hd, 'rgb(122,122,122)');
        if(p.rank >= 0) rect(EA, X - 0.05, Y - 0.05, Wd + 0.1, Hd + 0.1, g(0.1 + 0.85*p.rank)); }
      continue; }
    rect(PT, c.x - 0.1, c.y - 0.1, c.w + 0.2, c.h + 0.2, '#fff');
    rect(HT, c.x - 0.1, c.y - 0.1, c.w + 0.2, c.h + 0.2, 'rgb(205,205,205)'); rect(HT, c.x + 0.25, c.y + 0.25, c.w - 0.5, c.h - 0.5, 'rgb(218,218,218)');
    disc(HT, [c.x + 0.9, c.y + 0.9], 0.3, 'rgb(196,196,196)');
    for(const p of c.pins){ const [dx, dy] = CIR_DIRS[p.dir], L = 0.75, W = 0.4, cx = p.x - dx*0.15, cy = p.y - dy*0.15;
      const [X, Y, Wd, Hd] = dx ? [cx - L/2, cy - W/2, L, W] : [cx - W/2, cy - L/2, W, L];
      rect(CU, X, Y, Wd, Hd, '#fff'); rect(PD, X, Y, Wd, Hd, '#fff'); rect(HT, X, Y, Wd, Hd, 'rgb(122,122,122)');
      if(p.rank >= 0) rect(EA, X - 0.05, Y - 0.05, Wd + 0.1, Hd + 0.1, g(0.1 + 0.85*p.rank)); }
    // the silkscreen: an outline round the body and its pins, a notch at pin one
    LG.strokeStyle = '#fff'; LG.lineWidth = 0.12*s; LG.strokeRect((c.x - 1.15)*s, (c.y - 1.15)*s, (c.w + 2.3)*s, (c.h + 2.3)*s);
    disc(LG, [c.x - 1.15, c.y - 1.15], 0.32, '#fff');
    // (Markings: the maker's code and a date printed on the package, small and centred)
    if(c.mark) c.mark.forEach((t, i) => write(t, c.x + c.w/2 - t.length*0.36 + 0.04, c.y + c.h/2 - c.mark.length*0.5 + i*1.0 + 0.1, 0.18));
  }
  // small parts: two pads and a body between
  for(const p of B.smd){
    const [a, b] = p.horiz ? [[p.x, p.y + 0.5, 0.9, 1], [p.x + 2.1, p.y + 0.5, 0.9, 1]] : [[p.x + 0.5, p.y, 1, 0.9], [p.x + 0.5, p.y + 2.1, 1, 0.9]];
    for(const q of [a, b]){ rect(CU, ...q, '#fff'); rect(PD, ...q, '#fff'); rect(HT, ...q, 'rgb(122,122,122)'); }
    const body = p.horiz ? [p.x + 0.55, p.y + 0.45, 1.9, 1.1] : [p.x + 0.45, p.y + 0.55, 1.1, 1.9];
    if(p.era === 4){
      // a shard of crystal set in the board, glowing with the charge (each its own hashed grey)
      const [bx, by, bw, bh] = body, e = g(0.1 + 0.85*((Math.sin((p.x*7 + p.y*13)*12.9898)*43758.5453 % 1 + 1) % 1)), cx = bx + bw/2, cy = by + bh/2;
      const pts = p.horiz ? [[bx, cy], [cx, by - 0.1], [bx + bw, cy], [cx, by + bh + 0.1]] : [[cx, by], [bx + bw + 0.1, cy], [cx, by + bh], [bx - 0.1, cy]];
      poly(PD, pts, '#000'); poly(HT, pts, 'rgb(232,232,232)'); poly(AR, pts, '#fff'); poly(EA, pts, e);
      line(HT, [pts[0], pts[2]], 0.06*s, 'rgb(255,255,255)');
      continue;
    }
    if(p.era === 3){
      // a valve: a glass envelope in brass end-caps, its filament glowing with the charge (each trace's grey: one hashed)
      const [bx, by, bw, bh] = body, e = g(0.1 + 0.85*((Math.sin((p.x*7 + p.y*13)*12.9898)*43758.5453 % 1 + 1) % 1));
      rect(PD, bx + 0.1, by + 0.1, bw - 0.2, bh - 0.2, 'rgb(90,90,90)'); rect(HT, bx, by, bw, bh, 'rgb(176,176,176)');
      const cap = p.horiz ? [[bx, by, 0.3, bh], [bx + bw - 0.3, by, 0.3, bh]] : [[bx, by, bw, 0.3], [bx, by + bh - 0.3, bw, 0.3]];
      for(const q of cap){ rect(BR, ...q, '#fff'); rect(HT, ...q, 'rgb(196,196,196)'); }
      const fil = p.horiz ? [[bx + 0.4, by + bh/2], [bx + bw - 0.4, by + bh/2]] : [[bx + bw/2, by + 0.4], [bx + bw/2, by + bh - 0.4]];
      line(CU, fil, 0.12*s, '#fff'); line(EA, fil, 0.3*s, e);
      continue;
    }
    rect(PT, ...body, p.cap ? 'rgb(150,150,150)' : '#fff'); rect(HT, ...body, p.cap ? 'rgb(168,168,168)' : 'rgb(158,158,158)');
    LG.strokeStyle = '#fff'; LG.lineWidth = 0.1*s; LG.strokeRect((p.x - 0.25)*s, (p.y - 0.25)*s, (p.w + 0.5)*s, (p.h + 0.5)*s);
  }
  // a magitech trace is a light pipe: a thread of light down its middle (it lights with the charge)
  for(const tr of B.traces){ if(tr.era !== 4 || tr.pts.length < 2) continue; line(AR, tr.pts, tw*0.32*s, '#fff'); }
  // an atomic trace has a coil wound round its longest run: brass wire, loop on loop
  for(const tr of B.traces){ if(tr.era !== 3 || tr.pts.length < 2) continue;
    let best = 0, A = null, Bp = null; for(let i = 1; i < tr.pts.length; i++){ const l = Math.hypot(tr.pts[i][0] - tr.pts[i - 1][0], tr.pts[i][1] - tr.pts[i - 1][1]); if(l > best){ best = l; A = tr.pts[i - 1]; Bp = tr.pts[i]; } }
    if(best < 5) continue;
    const dx = (Bp[0] - A[0])/best, dy = (Bp[1] - A[1])/best, len = Math.min(best*0.5, 4), t0 = (best - len)/2, turns = Math.round(len/0.28);
    for(let k = 0; k <= turns; k++){ const t = t0 + len*k/turns, cx = A[0] + dx*t, cy = A[1] + dy*t;
      for(const [X, col, wd] of [[BR, '#fff', 0.09], [HT, 'rgb(190,190,190)', 0.09]]){ X.strokeStyle = col; X.lineWidth = wd*s; X.beginPath();
        X.ellipse(cx*s, cy*s, 0.12*s, 0.42*s, Math.atan2(dy, dx), 0, Math.PI*2); X.stroke(); } } }
  for(const v of B.vias){ disc(CU, v, 0.38, '#fff'); disc(CU, v, 0.15, '#000'); disc(PD, v, 0.38, '#fff'); disc(PD, v, 0.15, '#000'); disc(HT, v, 0.38, 'rgb(115,115,115)'); disc(HT, v, 0.15, 'rgb(31,31,31)'); }
  // the parts' names, in the silkscreen's little font (each in its era's words)
  for(const nm of B.names) write(nm.text || nm.kind + nm.n, nm.x, nm.y, nm.px);
  for(const gl of B.glyphs || []) write(gl.text, gl.x, gl.y);
  // the Markings: stamps of what each era would print, a code block, and once a little picture
  for(const st of B.stamps || []){
    if(st.kind === 'egg'){ const bits = st.egg < 0 ? CIR_ENCELADUS : CIR_EGGS[st.egg], px = 0.38; for(let r = 0; r < 7; r++) for(let q = 0; q < 7; q++) if(bits[r*7 + q] === '1') rect(LG, st.x + q*px, st.y + r*px, px*0.9, px*0.9, '#fff'); continue; }
    if(st.kind === 'matrix'){ const px = 0.3; LG.strokeStyle = '#fff'; LG.lineWidth = 0.08*s; LG.strokeRect(st.x*s, st.y*s, 6*px*s, 6*px*s);
      st.bits.forEach((b, i) => { if(b) rect(LG, st.x + (i % 6)*px, st.y + Math.floor(i/6)*px, px*0.9, px*0.9, '#fff'); }); continue; }
    if(st.kind === 'barcode'){ for(const [x, w] of st.bars) rect(LG, st.x + 0.3 + x, st.y + 0.3, w, 1.5, '#fff'); write(st.code, st.x + 0.3, st.y + 2.05, 0.16); continue; }
    if(st.kind === 'warn'){ const cx = st.x + 1.2, cy = st.y + 1.05; poly(LG, [[cx, cy - 0.85], [cx + 0.95, cy + 0.75], [cx - 0.95, cy + 0.75]], '#fff', false, 0.12);
      write('!', cx - 0.3, cy - 0.35, 0.2); write(st.text, st.x + 2.6, st.y + 0.4); continue; }
    if(st.kind === 'tp'){ const p = [st.x + 0.9, st.y + 1]; disc(CU, p, 0.42, '#fff'); disc(PD, p, 0.42, '#fff'); disc(HT, p, 0.42, 'rgb(122,122,122)');
      LG.strokeStyle = '#fff'; LG.lineWidth = 0.08*s; LG.beginPath(); LG.arc(p[0]*s, p[1]*s, 0.68*s, 0, Math.PI*2); LG.stroke(); write(st.text, st.x + 1.8, st.y + 0.4); continue; }
    if(st.kind === 'maker'){ const cx = st.x + 1.5, cy = st.y + 1.5, n = st.lv === 3 ? 10 : st.lv === 4 ? 7 : st.lv ? 6 : 0;
      // a maker's mark: a ring (today), a hexagon (the future, quantum), a cog (atomic), a seven-pointed star (magitech)
      if(!n){ LG.strokeStyle = '#fff'; LG.lineWidth = 0.1*s; LG.beginPath(); LG.arc(cx*s, cy*s, 1.25*s, 0, Math.PI*2); LG.stroke(); }
      else poly(LG, Array.from({ length: st.lv === 3 ? n*2 : st.lv === 4 ? n : n }, (_, k) => { const N = st.lv === 3 ? n*2 : n, a = -Math.PI/2 + k/N*Math.PI*2*(st.lv === 4 ? 3 : 1), r = st.lv === 3 && k % 2 ? 1.05 : 1.3; return [cx + Math.cos(a)*r, cy + Math.sin(a)*r]; }), '#fff', false, 0.1);
      write(st.lv >= 3 ? 'abcdefghijkl'[st.text.charCodeAt(0) % 12] + 'abcdefghijkl'[st.text.charCodeAt(1) % 12] : st.text, cx - 0.9, cy - 0.6); continue; }
    if(st.kind === 'moons'){ for(let k = 0; k < 5; k++){ const cx = st.x + 0.75 + k*1.12, cy = st.y + 1, f = ((st.phase + k/8) % 1)*2 - 1;
        disc(LG, [cx, cy], 0.45, '#fff'); if(Math.abs(f) < 0.97) disc(LG, [cx + f*0.9, cy], 0.45, '#000'); } continue; }
    st.lines.forEach((t, i) => write(t, st.x + 0.3, st.y + 0.35 + i*1.45));
    if(st.box){ LG.strokeStyle = '#fff'; LG.lineWidth = 0.1*s; LG.strokeRect((st.x + 0.05)*s, (st.y + 0.05)*s, (st.w - 0.1)*s, (st.h - 0.1)*s); }
  }
  // DATA: bright pulses running along the traces, a comet each (the head bright, the tail fading behind it), and
  // packets of bits; each trace's are fixed by its own hash, so more Data Flow adds pulses and moves none
  const flow = o.flow;
  if(flow > 0) B.traces.forEach((tr, tix) => { const ti = tr.id ?? tix;
    const P = tr.pts, seg = []; let L = 0;
    for(let i = 1; i < P.length; i++){ const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push([L, l, P[i - 1], P[i]]); L += l; }
    if(L < 1) return;
    const point = u => { for(const [s0, l, a, b] of seg) if(u <= s0 + l || seg[seg.length - 1][2] === a){ const f = l ? Math.max(0, Math.min(1, (u - s0)/l)) : 0; return [a[0] + (b[0] - a[0])*f, a[1] + (b[1] - a[1])*f]; } return P[P.length - 1]; };
    const hs = k => { const v = Math.sin((ti + 1)*127.1 + k*311.7 + o.salt*17.3)*43758.5453; return v - Math.floor(v); };
    const slots = Math.ceil(L/3);
    for(let k = 0; k < slots; k++){
      if(hs(k*3) > flow*0.9) continue;
      const head = hs(k*3 + 1)*L, len = 0.8 + hs(k*3 + 2)*2.6*(0.5 + flow), back = hs(k*7 + 5) < 0.5;
      if(hs(k*5 + 9) < 0.28*flow){
        // a packet: a run of bits, some lit
        for(let b = 0; b < 6; b++){ if(hs(k*13 + b) < 0.45) continue; const u = head + (back ? -b : b)*0.42; if(u < 0 || u > L) continue; disc(DA, point(u), 0.13, '#fff'); }
        continue; }
      // a comet: ten short strokes, brighter toward the head
      for(let q = 0; q < 10; q++){ const u0 = head - (back ? -1 : 1)*len*(q + 1)/10, u1 = head - (back ? -1 : 1)*len*q/10;
        if(Math.max(u0, u1) < 0 || Math.min(u0, u1) > L) continue;
        DA.globalAlpha = Math.pow(1 - q/10, 1.6); line(DA, [point(Math.max(0, Math.min(L, u0))), point(Math.max(0, Math.min(L, u1)))], tw*0.9*s, '#fff'); }
      DA.globalAlpha = 1; disc(DA, point(Math.max(0, Math.min(L, head))), 0.2, '#fff');
    }
  });
  return cv;
}

// ---------------- A RINGWORLD, SEEN FROM ITS FLOOR ----------------
// (Ruby: a ringworld, Niven's or Halo's, but abstract; its light the star at its centre, so the dial is the camera and
// one slider the light.) A ring of radius 1 round its star, `W` wide, walled at both rims; the camera stands on its
// inner floor. Each pixel's ray is followed to what it meets: the floor (near ground, or far off where the ring rises
// into the arch overhead), a rim wall, the star, the shadow squares that make its nights, or open space. What the
// part hands on are maps OF the world — where on the ring each pixel shows (along it and across it, in band widths),
// how far off, how fine a pixel is there, and where it is day — so any noise or picture can be laid on the ring.
export const RING_COV = 0.36, RING_SQR = 0.15;   // the share of each turn the shadow squares cover (night), and their ring's radius
const RING_SQS = [6, 8, 10, 10, 12, 14];   // how many squares circle the star: by the seed (more of them, shorter nights)
// the camera on the floor and the day (the Painted Ringworld's parts paint from the same camera)
export function ringCamera(o){
  const W = o.band, Hw = o.walls, hc = o.altitude, R = 1, z0 = o.place*W*0.45, fov = o.lens*Math.PI/180, f = 0.5/Math.tan(fov/2);
  const psi = o.look*Math.PI/180, th = o.lift*Math.PI/180, hx = Math.cos(psi), hz = Math.sin(psi);
  // up is toward the ring's axis (−x); along the ring is +y, across it +z. f: forward; r: right; u: the screen's up
  const fx = -Math.sin(th), fy = Math.cos(th)*hx, fz = Math.cos(th)*hz;
  // right = h × up, with h = (0, hx, hz), up = (−1, 0, 0): (0, −hz, hx)
  const rx = 0, ry = -hz, rz = hx;
  const ux = ry*fz - rz*fy, uy = rz*fx - rx*fz, uz = rx*fy - ry*fx;
  // the shadow squares turn so that the camera stands where Daylight says: 1 noon (mid-gap), 0 midnight (mid-square)
  // (0 midnight, behind the middle of a square; 0.5 the very edge of its shadow, dusk; 1 noon, the middle of a gap)
  const nsq = RING_SQS[((o.seed >>> 0) >>> 3) % RING_SQS.length];
  const dl = Math.max(0, Math.min(1, o.daylight)), per = Math.PI*2/nsq, uc = dl < 0.5 ? RING_COV/2 + dl*RING_COV : RING_COV + (dl - 0.5)*(1 - RING_COV), q0 = -uc*per;
  // the air the walls hold in: thinning with height (Hs, its scale height), so a column straight up is o.air deep
  // (its optical depth) and the ground far along is hazed far more than the ground at your feet
  const Hs = Math.min(Hw*0.5, W*0.025) + 1e-6, L0 = Hs/Math.max(0.005, o.air);
  // the clouds float this high over the floor (above you, unless you fly higher)
  return { W, Hw, hc, R, z0, f, fx, fy, fz, rx, ry, rz, ux, uy, uz, per, q0, Hs, L0, Px: R - hc, side: o.side < 0 ? -1 : 1, Rc: R - W*0.012 };
}
function ringLook(o){ const L = ringCamera(o); ringBuild(L, o); return L; }
// THE WORKS (Ruby: "spires, archways, cities, lights, spaceships, structures, and magical/magitech … seed dependent as
// much as you can so users see large varieties of ringworlds"; and before, "never bare"). Whoever built the ring
// decides what stands on it: five builders, the seed's two (one leading, one in its shadow), or the one the Builders
// slider names. Cities (o.build, 0.25 at its lowest; past its first quarter it spreads cities too) says how much;
// Landforms what the land itself raises; Traffic how busy the sky is. Each kind of work draws from its own stream, so
// more of any adds works and moves none.
//            spires · arches · towers · ships · city · crystals · circles · pillars · scaffolding · (monoliths, rim towers,
//            light bridges); the lights' colours (the engineers' the Forerunners' blue: Ruby, "push it more that way")
const RING_BUILDERS = ['wilds', 'engineers', 'cities', 'magi', 'ruins'];
// the forms of arch each builder raises, and how often: spans (wall top to wall top, holding the air), flying buttresses
// (a wall's top down to the land), arcades (arches striding on piers), gates (on the land), the land's own stone arches
const RING_ARCHES = {
  wilds:     [['stone', 1], ['span', 0.35], ['gate', 0.3]],
  engineers: [['buttress', 1], ['span', 0.8], ['arcade', 0.5]],
  cities:    [['arcade', 1], ['span', 0.5], ['gate', 0.6], ['buttress', 0.3]],
  magi:      [['span', 1], ['gate', 0.8], ['buttress', 0.4], ['stone', 0.3]],
  ruins:     [['span', 1], ['arcade', 0.9], ['gate', 0.7], ['stone', 0.4]] };
const RING_WORKS = {
  wilds:     { sp: 0.35, ar: 0.5, tw: 0,    sh: 0.12, ci: 0,    cr: 0.1,  rc: 0.25, pl: 0.35, sc: 0.15, mo: 1, pal: [[1, 0.82, 0.55], [0.6, 1, 0.75], [0.85, 0.95, 1]] },
  engineers: { sp: 1,    ar: 0.8, tw: 0.45, sh: 0.8,  ci: 0.35, cr: 0,    rc: 0,    pl: 0,    sc: 1,    rt: 1,   br: 1,   pal: [[0.55, 0.82, 1], [0.78, 0.94, 1], [1, 0.62, 0.3]] },
  cities:    { sp: 0.35, ar: 0.4, tw: 1,    sh: 1,    ci: 1,    cr: 0,    rc: 0,    pl: 0.15, sc: 0.3,  rt: 0.3, br: 0.3, pal: [[1, 0.76, 0.42], [1, 0.93, 0.8], [0.55, 0.82, 1]] },
  magi:      { sp: 0.5,  ar: 0.9, tw: 0.25, sh: 0.3,  ci: 0.25, cr: 1,    rc: 1,    pl: 1,    sc: 0,    rt: 0.4, br: 0.6, pal: [[0.72, 0.5, 1], [0.4, 0.95, 1], [1, 0.82, 0.45]] },
  ruins:     { sp: 0.5,  ar: 1,   tw: 0.35, sh: 0.15, ci: 0.15, cr: 0.25, rc: 0.3,  pl: 0.1,  sc: 0.6, mo: 0.6, rt: 0.6, broken: 1, pal: [[1, 0.5, 0.28], [0.5, 1, 0.8], [0.9, 0.85, 0.7]] },
};
const ringRand = (seed, k) => { let st = (Math.imul((seed >>> 0) ^ 0x9E3779B9, 2*k + 1) ^ Math.imul(k + 7, 0x85EBCA6B)) | 0;
  return () => { st = st + 0x6D2B79F5 | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; };
const ringNorm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; };
function ringBuild(L, o){
  let st = (o.seed >>> 0) || 1; const rnd = () => { st = Math.imul(st ^ (st >>> 15), 2246822507) + 0x6D2B79F5 | 0; st = Math.imul(st ^ (st >>> 13), 3266489909); return ((st ^= st >>> 16) >>> 0)/4294967296; };
  const b = o.build, W = L.W, style = rnd();
  // who built it
  const pick = rnd(), pick2 = rnd(), w2 = 0.2 + rnd()*0.35;
  const lead = o.builders > 0 ? RING_BUILDERS[Math.min(4, o.builders - 1)] : RING_BUILDERS[Math.floor(pick*5)], second = RING_BUILDERS[Math.floor(pick2*5)];
  const A = RING_WORKS[lead], B = RING_WORKS[second], how = k => Math.max(A[k] || 0, (B[k] || 0)*w2), seed = o.seed >>> 0;
  L.builders = lead; L.pal = A.pal.concat([B.pal[0]]);
  const broken = how('broken'), P = L.prims = [];
  const floorAt = (phi, z, up = 0) => [(L.R - up)*Math.cos(phi), (L.R - up)*Math.sin(phi), z];
  const upAt = phi => [-Math.cos(phi), -Math.sin(phi), 0], alongAt = phi => [-Math.sin(phi), Math.cos(phi), 0];
  const near = (r, lo, hi) => (r() < 0.5 ? -1 : 1)*W*(lo + Math.pow(r(), 1.5)*(hi - lo));
  // (a thing standing on the land never stands where you are: a mountain or a mesa over the camera filled the view from
  //  inside it; an arch's pieces are kept whatever, so no arch is cut into floating pieces)
  const beam = (B0, A0, h, r0, r1, more) => { const c = [B0[0] + A0[0]*h/2, B0[1] + A0[1]*h/2, B0[2] + A0[2]*h/2];
    if(!(more && more.arch)){ const dc = Math.hypot(Math.atan2(B0[1], B0[0]), B0[2] - L.z0);
      // (nor looms over you: a tower or a mesa closer than its height, its top cut off in the sky, read as a slab in the air)
      if(dc < Math.max(r0, r1)*1.2 + W*0.006 || ((more.tower || more.cap || more.stone) && dc < h)) return; }
    P.push({ k: 0, bx: B0[0], by: B0[1], bz: B0[2], ax: A0[0], ay: A0[1], az: A0[2], h, r0, r1, c, rad: h/2 + Math.max(r0, (more && more.glowR) || 0)*3, ...more }); };
  // SPIRES: needles standing up from the floor, many near you and a few far round the ring (the seed may grow a forest)
  { const r = ringRand(seed, 1), forest = style < 0.3, k = how('sp'), nSp = Math.max(3, Math.round(((forest ? 18 : 8) + (forest ? 40 : 22)*b*(0.5 + r()))*k));
    for(let i = 0; i < nSp; i++){
      // (none closer than a quarter of the band: a needle at your elbow would fill the view)
      const isNear = i < nSp*0.7, phi = isNear ? near(r, 0.3, 4) : (r()*2 - 1)*Math.PI, z = (r()*2 - 1)*W*0.45;
      // (Ruby: "thicker geometry": a spire is a tapering tower, not a needle)
      const snapped = broken > 0 && r() < 0.6*broken, h = L.Hw*(0.8 + r()*(forest ? 1.8 : 3))*(0.6 + b*0.8)*(snapped ? 0.35 + r()*0.3 : 1), rr = Math.max(W*0.003, h*(0.018 + r()*0.022));
      const U = upAt(phi), base = floorAt(phi, z), tip = [base[0] + U[0]*h - L.Px, base[1] + U[1]*h, base[2] + U[2]*h - L.z0], tl = Math.hypot(tip[0], tip[1], tip[2]), glowR = Math.max(rr*1.2, W*0.002);
      beam(base, U, h, rr, snapped ? rr*0.8 : rr*0.12, { spire: true, glowR, beacon: !snapped, tip: [tip[0]/tl, tip[1]/tl, tip[2]/tl], tl, tipCos: Math.cos(Math.min(1.5, 3*glowR/tl)) });
    } }
  // THE CITY: blocks of streets laid on the land where the seed's noise is high (lit at night), and towers in it.
  // (Cities, the fourth slider, says how built-up the ring is: past its first quarter the cities spread whoever built it)
  const moreCity = genClamp(((o.cities ?? 0.25) - 0.25)/0.75), kCity = Math.max(how('ci'), moreCity);
  L.traffic = o.traffic ?? 0.5;
  { const r = ringRand(seed, 2), k = kCity;
    L.city = { on: k > 0.05, cut: 1 - 0.8*k*(0.4 + 0.6*b), f: 0.9 + r()*1.6, cell: 0.003 + r()*0.004, salt: (r()*1e6) | 0 };
    // (a city's own builders raise a skyline: more than twice the towers anyone else does)
    const nTw = Math.round(Math.max(how('tw'), moreCity)*(6 + 40*b)*(0.6 + 0.8*r())*(lead === 'cities' ? 2.4 : 1));
    for(let i = 0, tries = 0; i < nTw && tries < nTw*30; tries++){
      const phi = tries % 5 === 4 ? (r()*2 - 1)*Math.PI : near(r, 0.04, 2.5), z = (r()*2 - 1)*W*0.44, a = phi/W, c = z/W + 0.5;
      if(L.city.on && ringCityCover(L, a, c) < 0.5 && r() < 0.85) continue;
      const h = W*(0.015 + 0.12*Math.pow(r(), 2))*(0.6 + 0.8*b), r0 = h*(0.05 + 0.06*r());
      beam(floorAt(phi, z), upAt(phi), h, r0, r0*(0.65 + 0.35*r()), { tower: true, id: i + 1 }); i++; } }
  // MONOLITHS: standing stones, alone or in rings (the wilds' and the ruins'), some leaning
  { const r = ringRand(seed, 8), k = how('mo'), nM = Math.round(k*(8 + 26*b*r()));
    for(let i = 0; i < nM; ){ const phi = near(r, 0.03, 2), z = (r()*2 - 1)*W*0.44, ring = r() < 0.4 ? 5 + Math.floor(r()*5) : 1, rr = W*(0.006 + 0.02*r());
      for(let j = 0; j < ring && i < nM; j++, i++){ const a = j/ring*Math.PI*2, ph = phi + (ring > 1 ? Math.cos(a)*rr : 0), zz = z + (ring > 1 ? Math.sin(a)*rr : 0);
        const h = W*(0.006 + 0.03*Math.pow(r(), 1.5)), U = upAt(ph), T = alongAt(ph), lean = (r() - 0.5)*0.3, A0 = ringNorm([U[0] + T[0]*lean, U[1] + T[1]*lean, U[2] + lean*0.5]);
        beam(floorAt(ph, zz), A0, h, h*(0.14 + 0.1*r()), h*(0.1 + 0.08*r()), { stone: true }); } } }
  // ARCHES (Ruby: "archways should go across the mountains as if they contain the atmosphere"; then "arches are only in
  // some ringworld designs and they only always go from edge to edge … thicker geometry … nothing floating"): every ring
  // raises arches now, of one or two forms by whoever built it (RING_ARCHES): SPANS from wall top to wall top, the air
  // they hold a faint field beneath each; flying BUTTRESSES from a wall's top down to a pier on the land, in rows along
  // the ring as the Forerunners' walls stand; ARCADES striding on piers, along the ring or across it; GATES on the land;
  // and the land's own STONE ARCHES. A ruin's arch breaks in its middle and stands as two stubs: nothing floats.
  { const r = ringRand(seed, 3), k = Math.max(0.55, how('ar')), lf = o.landforms ?? 0.5;
    const pickArch = T => { let x = r()*T.reduce((a, q) => a + q[1], 0); for(const [f, wt] of T){ if(x < wt) return f; x -= wt; } return T[0][0]; };
    const forms = new Set([pickArch(RING_ARCHES[lead])]); if(r() < 0.6) forms.add(pickArch(RING_ARCHES[r() < 0.5 ? lead : second]));
    if(lf < 0.05) forms.delete('stone'); if(!forms.size) forms.add('span');
    const brk = () => broken > 0 && r() < 0.65*broken ? (a0 => [a0, a0 + 0.1 + r()*0.35])(0.22 + r()*0.28) : null;
    // a tube along points (each piece a little longer than its stretch, so the joints close however thick it is)
    const tube = (pts, rad, more, cut, radAt) => { const n = pts.length - 1;
      for(let i = 0; i < n; i++){ const u = (i + 0.5)/n; if(cut && u > cut[0] && u < cut[1]) continue;
        const p0 = pts[i], p1 = pts[i + 1], d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], l = Math.hypot(d[0], d[1], d[2]), A0 = [d[0]/l, d[1]/l, d[2]/l], rr = radAt ? radAt(u) : rad, e = rr*0.45;
        beam([p0[0] - A0[0]*e, p0[1] - A0[1]*e, p0[2] - A0[2]*e], A0, l + 2*e, rr, radAt ? radAt((i + 1)/n) : rr, { arch: true, ...more }); } };
    // an arch on a line at angle phi: along the ring (across false) or across it, its middle at zc, springing at height lift
    const arch = (phi, zc, span, ht, across, rad, segs, lift = 0, more, cut, radAt) => { const U = upAt(phi), S = across ? [0, 0, 1] : alongAt(phi), C0 = floorAt(phi, zc);
      const pts = Array.from({ length: segs + 1 }, (_, i) => { const th = Math.PI*i/segs, a = Math.cos(th)*span/2, e = lift + Math.sin(th)*ht;
        return [C0[0] + S[0]*a + U[0]*e, C0[1] + S[1]*a + U[1]*e, C0[2] + S[2]*a + U[2]*e]; });
      tube(pts, rad, more, cut, radAt); };
    // (none stands about the camera: an arch seen from under it, its feet out of sight, looked like a slab in the air)
    const clearOf = (phi, z, r0) => Math.hypot(phi, z - L.z0) > r0 + W*0.05;
    const pier = (phi, z, h, rad, more) => beam(floorAt(phi, z), upAt(phi), h, rad, rad*0.92, { arch: true, ...more });
    if(forms.has('span')){ const nA = Math.max(1, Math.round(k*(1.5 + 5*b*r())));
      for(let i = 0; i < nA; i++){ const phi = i === 0 ? near(r, 0.5, 1.6) : (r() < 0.5 ? near(r, 1, 8) : (r()*2 - 1)*Math.PI);
        const ht = W*(0.12 + 0.4*r()), rad = W*(0.022 + 0.03*r()), cut = brk();
        arch(phi, 0, W, ht, true, rad, 26, L.Hw, null, cut);
        if(!cut) P.push({ k: 7, O: floorAt(phi, 0, L.Hw), N: alongAt(phi), E1: [0, 0, 1], E2: upAt(phi), a: W/2, ht, c: floorAt(phi, 0, L.Hw + ht/2), rad: Math.hypot(W/2, ht), col: [0.62, 0.86, 1] }); } }
    if(forms.has('buttress')){
      // a row of them along the ring (both walls, or one), from just under a wall's top down to a pier partway across
      const nB = Math.round(k*(5 + 14*b*r())), step = W*(0.35 + 0.6*r()), reach = W*(0.1 + 0.18*r()), hb = L.Hw*(0.7 + 0.25*r()), both = r() < 0.7, ph0 = near(r, 0.2, 1.2);
      for(let i = 0; i < nB; i++){ const phi = ph0 + (i - nB/2)*step; if(Math.abs(phi) < W*0.3) continue;   // (never one over your head)
        for(const sg of both ? [-1, 1] : [i % 2 ? -1 : 1]){ const rad = W*(0.012 + 0.008*r())*(0.7 + 0.6*hb/W*3), cut = brk(), U = upAt(phi);
          const pts = Array.from({ length: 17 }, (_, j) => { const th = Math.PI/2*j/16, z = sg*(W/2 - reach*Math.sin(th)), h = hb*Math.cos(th); return floorAt(phi, z, h); });
          tube(pts, rad, null, cut, u => rad*(0.8 + 0.6*u));
          pier(phi, sg*(W/2 - reach), hb*0.12, rad*2.4); } } }
    if(forms.has('arcade')){
      const nC = Math.max(1, Math.round(k*(1 + 3*b*r())));
      for(let c = 0; c < nC; c++){ const across = r() < 0.4, span = W*(across ? 0.05 + 0.05*r() : 0.025 + 0.05*r()), n = across ? Math.round(W/span) : 6 + Math.floor(r()*18);
        const hp = span*(0.6 + 0.8*r()), ht = span*(0.45 + 0.1*r()), rad = span*(0.08 + 0.04*r()), phi0 = near(r, 0.15, 3), z0a = across ? -W/2 + span/2 : (r()*2 - 1)*W*0.38, cut = brk();
        for(let j = 0; j < n; j++){ if(cut && (j + 0.5)/n > cut[0] && (j + 0.5)/n < cut[1]) continue;
          const phi = across ? phi0 : phi0 + (j - n/2)*span, z = across ? z0a + j*span : z0a; if(!clearOf(phi, z, span)) continue;
          arch(phi, z, span, ht, across, rad, 8, hp);
          // its piers, and the deck along its top
          const ps = across ? [[phi, z - span/2], [phi, z + span/2]] : [[phi - span/2, z], [phi + span/2, z]];
          for(const [pp, zz] of ps) pier(pp, zz, hp + rad, rad*1.5);
          const D0 = floorAt(ps[0][0], ps[0][1], hp + ht + rad*1.4), D1 = floorAt(ps[1][0], ps[1][1], hp + ht + rad*1.4), dd = [D1[0] - D0[0], D1[1] - D0[1], D1[2] - D0[2]], dl = Math.hypot(dd[0], dd[1], dd[2]);
          beam(D0, [dd[0]/dl, dd[1]/dl, dd[2]/dl], dl, rad*1.2, rad*1.2, { arch: true }); } } }
    // (a few gates stand on every ring; a ring of gate-builders raises many)
    { const nG = Math.round(k*(forms.has('gate') ? 8 + 26*b*r() : 2 + 6*b*r()));
      for(let i = 0; i < nG; i++){ const phi = near(r, 0.05, 1.5), span = W*(0.03 + 0.2*Math.pow(r(), 1.5)), z = (r()*2 - 1)*(W*0.48 - span/2); if(!clearOf(phi, z, span*0.7)){ r(); r(); continue; }
        arch(phi, z, span, span*(0.5 + 0.6*r()), r() < 0.5, span*(0.06 + 0.04*r()), 12, 0, null, brk()); } }
    if(forms.has('stone')){ const nS = Math.round((3 + 12*r())*Math.pow(lf, 1.2)*k);
      // the land's own: a thick, uneven bow of rock, heaviest at its feet
      for(let i = 0; i < nS; i++){ const phi = near(r, 0.04, 2.5), span = W*(0.012 + 0.07*Math.pow(r(), 1.6)), z = (r()*2 - 1)*(W*0.46 - span/2), rad = span*(0.12 + 0.08*r()), wob = r()*6;
        if(!clearOf(phi, z, span*0.7)){ r(); r(); continue; }
        arch(phi, z, span, span*(0.35 + 0.45*r()), r() < 0.5, rad, 12, 0, { rock: true }, null, u => rad*(1.5 - 0.7*Math.sin(Math.PI*u))*(0.85 + 0.3*Math.sin(u*9 + wob))); } } }
  // SHIPS: hulls in the air, going along the ring or across it, engines lit behind, some drawing a trail
  { const r = ringRand(seed, 4), k = how('sh'), T = L.traffic, nS = Math.round(k*(4 + 30*b*r())*(T <= 0.5 ? Math.pow(T/0.5, 1.2) : 1 + (T - 0.5)*3));
    for(let i = 0; i < nS; i++){
      const big = r() < 0.08, phi = big || r() < 0.25 ? (r()*2 - 1)*Math.PI*0.5 : near(r, 0.05, 3), z = (r()*2 - 1)*W*0.45, alt = W*(big ? 0.15 + 0.3*r() : 0.01 + 0.2*Math.pow(r(), 2));
      const U = upAt(phi), T = alongAt(phi), psi = r()*Math.PI*2, F = ringNorm([T[0]*Math.cos(psi), T[1]*Math.cos(psi), Math.sin(psi)]), Sd = ringNorm([F[1]*U[2] - F[2]*U[1], F[2]*U[0] - F[0]*U[2], F[0]*U[1] - F[1]*U[0]]);
      const ax = W*(big ? 0.08 + 0.12*r() : 0.004 + 0.025*Math.pow(r(), 3)), C = floorAt(phi, z, alt), trail = !big && r() < 0.6 ? ax*(10 + 50*r()) : 0;
      P.push({ k: 1, c: C, F, U, S: Sd, ax, ay: ax*0.24, az: ax*0.36, rad: ax*1.2, col: L.pal[2 % L.pal.length] });
      const E = [C[0] - F[0]*ax*1.05, C[1] - F[1]*ax*1.05, C[2] - F[2]*ax*1.05];
      P.push({ k: 6, c: E, rad: ax*2.5, g: ax*0.35, col: L.pal[(i % 2) ? 1 : 2] });   // its engines
      if(trail){ const S1 = [E[0] - F[0]*trail, E[1] - F[1]*trail, E[2] - F[2]*trail];
        P.push({ k: 5, bx: E[0], by: E[1], bz: E[2], ax: -F[0], ay: -F[1], az: -F[2], h: trail, w: Math.min(ax*0.12, W*0.002), c: [(E[0] + S1[0])/2, (E[1] + S1[1])/2, (E[2] + S1[2])/2], rad: trail/2 + ax*4 }); }
    } }
  // CRYSTALS: stones of light growing out of the land (the magi's), in clusters, leaning, glowing from within
  // (Ruby: "nothing floating": they stood in the air once; now each is sunk a third of its height in the ground)
  { const r = ringRand(seed, 5), k = how('cr'), nC = Math.round(k*(6 + 30*b*r()));
    let cPhi = 0, cZ = 0, cSize = 0;
    for(let i = 0; i < nC; i++){
      const cluster = i > 0 && r() < 0.55, size = cluster ? cSize*(0.35 + 0.5*r()) : W*(0.004 + 0.03*Math.pow(r(), 2));
      const phi = cluster ? cPhi + (r() - 0.5)*cSize*3 : near(r, 0.04, 2), z = cluster ? Math.max(-W*0.46, Math.min(W*0.46, cZ + (r() - 0.5)*cSize*3)) : (r()*2 - 1)*W*0.45;
      if(!cluster){ cPhi = phi; cZ = z; cSize = size; }
      const e0 = 1.6 + r()*0.9, C = floorAt(phi, z, size*e0*0.62);
      const U = upAt(phi), a = r()*Math.PI*2, tilt = (r() - 0.5)*(cluster ? 1.3 : 0.5), T = alongAt(phi), E1 = ringNorm([T[0]*Math.cos(a), T[1]*Math.cos(a), Math.sin(a)]);
      const E3 = ringNorm([U[0] + E1[0]*tilt, U[1] + E1[1]*tilt, U[2] + E1[2]*tilt]), E2 = ringNorm([E3[1]*E1[2] - E3[2]*E1[1], E3[2]*E1[0] - E3[0]*E1[2], E3[0]*E1[1] - E3[1]*E1[0]]);
      const e = e0, planes = [];
      for(const s1 of [-1, 1]) for(const s2 of [-1, 1]) for(const s3 of [-1, 1]) planes.push([(s1*E1[0] + s2*E2[0])/size + s3*E3[0]/(e*size), (s1*E1[1] + s2*E2[1])/size + s3*E3[1]/(e*size), (s1*E1[2] + s2*E2[2])/size + s3*E3[2]/(e*size)]);
      P.push({ k: 2, c: C, size, planes, U, rad: size*e*1.2 + size*5, col: L.pal[i % L.pal.length] });
    } }
  // CIRCLES: summoning circles laid on the land, and rings standing on it, gates of light: two rings, a star inside, runes
  // between (Ruby: "nothing floating": they hung in the air; a standing one now rests on a plinth of stone)
  { const r = ringRand(seed, 6), k = how('rc'), nR = Math.round(k*(3 + 12*b*r()));
    for(let i = 0; i < nR; i++){
      // (laid on the land they show only from above, the camera drawn out past the rim)
      const onFloor = r() < 0.3, phi = near(r, 0.04, 2), z = (r()*2 - 1)*W*0.42, rad = W*(onFloor ? 0.04 + 0.12*r() : 0.012 + 0.06*r());
      const upright = !onFloor && r() < 0.75, lay = !upright, base = rad*0.14;
      const U = upAt(phi), T = alongAt(phi), C = floorAt(phi, z, lay ? W*0.0003 : rad + base);
      const N = upright ? T : U, E1 = upright ? [0, 0, 1] : T, E2 = upright ? U : [0, 0, 1];
      P.push({ k: 4, c: C, N, E1, E2, R: rad, rad: rad*1.15, points: 5 + Math.floor(r()*3), runes: 12 + Math.floor(r()*14), salt: (r()*1e6) | 0, col: L.pal[i % L.pal.length] });
      if(upright){ const B0 = floorAt(phi, z); beam(B0, U, base*1.25, rad*0.42, rad*0.34, { stone: true, cap: true }); }
    } }
  // PILLARS: beams of light from the land toward the star, seen far round the ring rising from the arch
  { const r = ringRand(seed, 7), k = how('pl'), nP = Math.round(k*(2 + 8*b*r()));
    for(let i = 0; i < nP; i++){ const phi = i % 2 ? (r()*2 - 1)*Math.PI : near(r, 0.5, 6), z = (r()*2 - 1)*W*0.4, U = upAt(phi), B0 = floorAt(phi, z), Lp = 0.25 + 0.65*r();
      P.push({ k: 3, bx: B0[0], by: B0[1], bz: B0[2], ax: U[0], ay: U[1], az: U[2], h: Lp, w: W*(0.002 + 0.008*r()), c: floorAt(phi, z, Lp/2), rad: Lp/2 + W*0.06, col: L.pal[i % L.pal.length] }); } }
  // RIM TOWERS (Ruby: "it's kind of reminding me of Halo … push it more that way"): pylons standing on the walls' tops at
  // even steps, the Forerunners' way, a light at each head; and LIGHT BRIDGES, bars of hard light from wall to wall
  { const r = ringRand(seed, 18), k = how('rt'), n = Math.round(k*(4 + 16*b*r()));
    if(n > 0){ const step = W*(0.35 + 0.8*r()), ph0 = near(r, 0.1, 1), both = r() < 0.6;
      for(let i = 0; i < n; i++){ const phi = ph0 + (i - n/2)*step;
        for(const sg of both ? [-1, 1] : [i % 2 ? 1 : -1]){ const h = L.Hw*(0.25 + 0.4*r()), rr = h*(0.1 + 0.06*r()), U = upAt(phi), base = floorAt(phi, sg*(W/2 - rr*0.9), L.Hw - h*0.05);
          const tip = [base[0] + U[0]*h - L.Px, base[1] + U[1]*h, base[2] + U[2]*h - L.z0], tl = Math.hypot(tip[0], tip[1], tip[2]), glowR = Math.max(rr*0.9, W*0.002);
          beam(base, U, h, rr, rr*0.3, { spire: true, glowR, beacon: true, tip: [tip[0]/tl, tip[1]/tl, tip[2]/tl], tl, tipCos: Math.cos(Math.min(1.5, 3*glowR/tl)) }); } } } }
  { const r = ringRand(seed, 19), k = how('br'), n = Math.round(k*(0.6 + 4*b*r()));
    for(let i = 0; i < n; i++){ const phi = near(r, 0.3, 4), h = L.Hw*(0.55 + 0.4*r()), B0 = floorAt(phi, -W/2, h);
      P.push({ k: 3, bx: B0[0], by: B0[1], bz: B0[2], ax: 0, ay: 0, az: 1, h: W, w: W*(0.0012 + 0.0018*r()), c: floorAt(phi, 0, h), rad: W/2 + W*0.06, col: L.pal[1], even: true }); } }
  // scaffolding: stretches of floor left unfinished, an open lattice over the void (more of it on some rings)
  { const k = how('sc'); L.scaf = { on: k > 0.1 && style > 0.1, amount: (0.08 + 0.3*b)*k*(style > 0.7 ? 1.6 : 1), cell: 0.05 + rnd()*0.07, beam: 0.14 + rnd()*0.1, salt: (rnd()*1e6) | 0 }; }
  // DOMES over the city's heart (the cities' way of holding air): glass, seen only by the light it catches at its rim
  { const r = ringRand(seed, 9), nD = L.city.on ? Math.round(kCity*(1 + 10*b*r())) : 0;
    for(let i = 0, tries = 0; i < nD && tries < nD*20; tries++){ const phi = near(r, 0.05, 3), z = (r()*2 - 1)*W*0.4;
      if(ringCityCover(L, phi/W, z/W + 0.5) < 0.6) continue;
      const R0 = W*(0.015 + 0.08*Math.pow(r(), 2)), Rv = R0*(0.45 + 0.4*r());
      P.push({ k: 8, c: floorAt(phi, z), U: upAt(phi), R: R0, Rv, rad: R0*1.05, col: [0.72, 0.88, 1] }); i++; } }
  // TRAFFIC LANES (Traffic past its middle): streams of small craft along the ring at their own heights, their engines
  // a dotted line of lights far off
  { const r = ringRand(seed, 12), nL = Math.floor(genClamp((L.traffic - 0.5)/0.5)*5.99);
    for(let l = 0; l < nL; l++){
      const alt = W*(0.008 + 0.12*Math.pow(r(), 1.5)), z = (r()*2 - 1)*W*0.4, dir = r() < 0.5 ? -1 : 1, gap = W*(0.006 + 0.02*r()), size = W*(0.002 + 0.004*r());
      const n = 30 + Math.floor(r()*40), ph0 = (r() - 0.5)*W*2, col = L.pal[(l + 1) % L.pal.length];
      for(let j = 0; j < n; j++){ const phi = ph0 + (j - n/2)*gap*(0.7 + 0.6*r()), U = upAt(phi), T = alongAt(phi), F = [T[0]*dir, T[1]*dir, 0];
        const Sd = ringNorm([F[1]*U[2] - F[2]*U[1], F[2]*U[0] - F[0]*U[2], F[0]*U[1] - F[1]*U[0]]), C = floorAt(phi, z + (r() - 0.5)*W*0.012, alt + (r() - 0.5)*W*0.004);
        P.push({ k: 1, c: C, F, U, S: Sd, ax: size, ay: size*0.3, az: size*0.4, rad: size*1.2, col });
        P.push({ k: 6, c: [C[0] - F[0]*size*1.05, C[1] - F[1]*size*1.05, C[2]], rad: size*4, g: size*0.8, col: [1, 0.86, 0.62] }); } } }
  // LANDFORMS (the second slider; Ruby: "additional structures and mountains, ways to do sparse nearby geometry"): what
  // the land itself raises, from the seed's own country: peaks (snow-capped when tall) near the walls and far round the
  // ring, mesas, boulders strewn near you, pinnacles, and ranges along the walls' feet. Each kind its own stream. (The
  // magi's floating isles are gone: Ruby, "artistic cohesion, nothing floating"; the karst raises stone arches instead.)
  { const lf = o.landforms ?? 0.5, g = Math.pow(lf, 1.4), r0 = ringRand(seed, 10), country = RING_LANDS[Math.floor(r0()*RING_LANDS.length)];
    const rock = { rock: true };
    const zAt = (r, edge) => r() < edge ? (r() < 0.5 ? -1 : 1)*W*(0.47 - 0.12*Math.pow(r(), 2)) : (r()*2 - 1)*W*0.42;
    { const r = ringRand(seed, 11), n = Math.round(country[0]*g*16);   // peaks: cones, a few huge
      for(let i = 0; i < n; i++){ const phi = i % 3 === 2 ? (r()*2 - 1)*Math.PI : near(r, 0.3, 5), z = zAt(r, 0.6), h = W*(0.03 + 0.22*Math.pow(r(), 2))*(0.6 + lf), rb = h*(0.55 + 0.4*r());
        beam(floorAt(phi, z), upAt(phi), h, rb, rb*0.02, { ...rock, peak: true, snow: h > W*0.07 }); } }
    { const r = ringRand(seed, 13), n = Math.round(country[1]*g*16);   // mesas: flat-topped, steep-sided
      for(let i = 0; i < n; i++){ const phi = near(r, 0.1, 4), z = zAt(r, 0.2), rr = W*(0.01 + 0.06*Math.pow(r(), 1.5)), h = rr*(0.35 + 0.8*r())*(0.6 + lf);
        beam(floorAt(phi, z), upAt(phi), h, rr, rr*(0.78 + 0.15*r()), { ...rock, cap: true }); } }
    { const r = ringRand(seed, 14), n = Math.round(country[2]*g*90);   // boulders near you: half sunk, never at your elbow
      for(let i = 0; i < n; i++){ const phi = near(r, 0.002, 0.6), z = Math.max(-W*0.46, Math.min(W*0.46, L.z0 + (r()*2 - 1)*W*0.35)), far = Math.hypot(phi, z - L.z0);
        const sz = Math.min(far*0.09, W*(0.0006 + 0.012*Math.pow(r(), 3))), U = upAt(phi), T = alongAt(phi), yaw = r()*Math.PI, F = ringNorm([T[0]*Math.cos(yaw), T[1]*Math.cos(yaw), Math.sin(yaw)]);
        const Sd = ringNorm([F[1]*U[2] - F[2]*U[1], F[2]*U[0] - F[0]*U[2], F[0]*U[1] - F[1]*U[0]]), ay = sz*(0.45 + 0.3*r());
        P.push({ k: 1, c: floorAt(phi, z, ay*0.35), F, U, S: Sd, ax: sz, ay, az: sz*(0.65 + 0.3*r()), rad: sz*1.1, ...rock }); } }
    { const r = ringRand(seed, 15), n = Math.round(country[3]*g*40);   // pinnacles: hoodoos and needles of stone
      for(let i = 0; i < n; i++){ const phi = near(r, 0.01, 2), z = zAt(r, 0.15), h = W*(0.005 + 0.05*Math.pow(r(), 1.5))*(0.6 + lf), rb = h*(0.08 + 0.08*r());
        beam(floorAt(phi, z), upAt(phi), h, rb, rb*(0.35 + 0.35*r()), { ...rock, cap: true }); } }
    { const r = ringRand(seed, 16), n = Math.round(country[4]*g*30);   // the karst's arches of stone: thick bows, heaviest at the feet
      for(let i = 0; i < n; i++){ const phi = near(r, 0.04, 2.5), span = W*(0.01 + 0.05*Math.pow(r(), 1.6)), z = (r()*2 - 1)*(W*0.46 - span/2), rad = span*(0.13 + 0.07*r()), ht = span*(0.4 + 0.4*r());
        const U = upAt(phi), S = r() < 0.5 ? [0, 0, 1] : alongAt(phi), C0 = floorAt(phi, z), wob = r()*6; if(Math.hypot(phi, z - L.z0) < span*0.7 + W*0.05) continue;
        for(let j = 0; j < 10; j++){ const t0 = Math.PI*j/10, t1 = Math.PI*(j + 1)/10, pt = th => [C0[0] + S[0]*Math.cos(th)*span/2 + U[0]*Math.sin(th)*ht, C0[1] + S[1]*Math.cos(th)*span/2 + U[1]*Math.sin(th)*ht, C0[2] + S[2]*Math.cos(th)*span/2 + U[2]*Math.sin(th)*ht];
          const a0 = pt(t0), a1 = pt(t1), d = [a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]], l = Math.hypot(d[0], d[1], d[2]), rr = u => rad*(1.5 - 0.7*Math.sin(Math.PI*u))*(0.85 + 0.3*Math.sin(u*9 + wob)), e = rr(j/10)*0.45;
          beam([a0[0] - d[0]/l*e, a0[1] - d[1]/l*e, a0[2] - d[2]/l*e], [d[0]/l, d[1]/l, d[2]/l], l + 2*e, rr(j/10), rr((j + 1)/10), { ...rock }); } } }
    // RANGES AGAINST THE WALLS (Ruby: "better landforms around the border mountains"): the walls rise out of mountains,
    // a range along each rim's foot, foothills before it, the tallest snow-capped; never above the wall's top
    if(g > 0.01){ const r = ringRand(seed, 17), spread = 4.5*W;
      for(const sg of [-1, 1]){ let phi = -spread - r()*W*0.3;
        while(phi < spread){ const h = Math.min(L.Hw*0.96, L.Hw*(0.25 + 0.75*Math.pow(r(), 1.2))*(0.45 + 0.9*lf)), rb = h*(0.9 + 0.8*r()), z = sg*(W/2 - rb*(0.2 + 0.25*r()));
          beam(floorAt(phi, z), upAt(phi), h, rb, rb*0.03, { ...rock, peak: true, snow: h > W*0.07 });
          // (its shoulders, lower, either side along the ring: a range has many summits, not one cone)
          for(const sd of [-1, 1]){ const hs = h*(0.45 + 0.3*r()), rs = rb*(0.55 + 0.25*r()), ps = phi + sd*rb*(0.45 + 0.25*r());
            beam(floorAt(ps, sg*(W/2 - rs*(0.25 + 0.3*r()))), upAt(ps), hs, rs, rs*0.04, { ...rock, peak: true, snow: hs > W*0.07 }); }
          if(r() < 0.65){ const h2 = h*(0.25 + 0.3*r()), rb2 = h2*(1.2 + 0.7*r()), p2 = phi + (r() - 0.5)*rb;
            beam(floorAt(p2, sg*(W/2 - rb*0.75 - rb2*0.6)), upAt(p2), h2, rb2, rb2*0.05, { ...rock, peak: true }); }
          phi += rb*(1.1 + 0.9*r())*(Math.abs(phi) > 1.5*W ? 1.6 : 1); } } } }
  // the rare seam: now and then the edge of the world shows (Ruby's egg; "make it significantly more rare"), about one ring in fifty
  L.seam = mnHash(o.seed | 0, 61, 3) < 1/50;
}
// the lands a seed may give a ring: how much of each landform it raises (peaks, mesas, boulders, pinnacles, stone arches)
//               alpine · mesa country · boulder fields · hoodoos · karst · mixed
const RING_LANDS = [[1, 0.1, 0.6, 0.2, 0], [0.15, 1, 0.4, 0.6, 0], [0.3, 0.2, 1, 0.3, 0], [0.2, 0.4, 0.5, 1, 0], [0.7, 0, 0.3, 0.8, 0.2], [0.35, 0.3, 0.6, 0.4, 0.12]];
// the city's cover where it stands (0..1): the seed's noise, never at the walls' feet
function ringCityCover(L, a, c){ const C = L.city; if(!C || !C.on) return 0;
  return genClamp((mnValue(a*C.f + 11.3, c*C.f*1.6 + 2.9, C.salt) - C.cut)/0.06)*genClamp((0.47 - Math.abs(c - 0.5))/0.03); }
// the city on the floor, filtered by a pixel's footprint: [its blocks by day (0..1), its lights at night (0..1)]
function ringCity(L, a, c, foot){
  const cov = ringCityCover(L, a, c); if(cov <= 0) return [0, 0];
  const C = L.city, fx = a/C.cell, fy = c/C.cell, ix = Math.floor(fx), iy = Math.floor(fy), h = mnHash(ix, iy, C.salt), fine = genClamp(1.5 - foot/C.cell);
  const ux = fx - ix, uy = fy - iy, street = ux < 0.14 || uy < 0.14;
  // lights: the street's lamps in a line, and the block's lit windows as points (a 4×4 of them, some lit)
  let light = 0;
  if(street) light = (ux < 0.14 && uy < 0.14) ? 1 : 0.35*(0.6 + 0.8*L.traffic);   // (Traffic: the streets' own lights)
  else { const gx = Math.floor((ux - 0.14)/0.86*4), gy = Math.floor((uy - 0.14)/0.86*4), lx = (ux - 0.14)/0.86*4 - gx, ly = (uy - 0.14)/0.86*4 - gy;
    light = (lx > 0.3 && lx < 0.7 && ly > 0.3 && ly < 0.7 && mnHash(ix*4 + gx, iy*4 + gy, C.salt + 5) < 0.25 + 0.5*h) ? 1 : 0; }
  const fineL = genClamp(1.5 - foot*4/C.cell);
  return [cov*(fine*(street ? 0.45 : 0.7 + 0.3*h) + (1 - fine)*0.66), cov*(fineL*light + (1 - fineL)*0.32)];
}
// the scaffolding's lattice, filtered by a pixel's own footprint (box-filtered beams: no shimmer at any distance)
function ringLattice(L, a, c, foot){
  const S = L.scaf; if(!S.on) return [0, 0];
  const reg = mnValue(a*1.1 + 3.7, c*2.2 + 9.1, S.salt), wR = genClamp((reg - (1 - S.amount))/0.04)*genClamp((Math.abs(a) - 1.5)/2);
  if(wR <= 0) return [0, 0];
  const bw = S.beam, F = x => Math.floor(x)*bw + Math.min(x - Math.floor(x), bw);
  const cover = (x, w) => w < 1e-6 ? ((x - Math.floor(x)) < bw ? 1 : 0) : Math.min(1, Math.max(0, (F(x + w/2) - F(x - w/2))/w));
  const fw = foot/S.cell, cu = cover(a/S.cell, fw), cv = cover(c/S.cell, fw), beams = 1 - (1 - cu)*(1 - cv);
  return [wR*beams, wR*(1 - beams)];
}
// day at a ring angle: 1 in a gap between the squares, 0 behind one, a soft edge (the star's own size) between
// (L.side: which way round the dusk comes, by the light dial)
export function ringDay(L, phi){ let u = (phi*L.side - L.q0)/L.per; u -= Math.floor(u);
  const sd = u >= RING_COV ? Math.min(u - RING_COV, 1 - u) : -Math.min(u, RING_COV - u), t = genClamp(0.5 + sd/0.09); return t*t*(3 - 2*t); }
// THE WORKS ON SCREEN: each work's bounding cube, projected, puts it in the tiles of the picture it can touch, so a
// pixel tests only the few that could be in its way (they were tested for every pixel: a third of the time)
const RING_TILE = 16;
function ringBin(L, ww, wh, unit){
  const px = 1/unit, tw = Math.ceil(ww/RING_TILE), th = Math.ceil(wh/RING_TILE), bins = Array.from({ length: tw*th }, () => []), all = [];
  const cam = (x, y, z) => { const cx = x - L.Px, cz = z - L.z0; return [cx*L.rx + y*L.ry + cz*L.rz, cx*L.ux + y*L.uy + cz*L.uz, cx*L.fx + y*L.fy + cz*L.fz]; };
  for(const p of L.prims){
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const box = (X, Y, Z, r) => { for(const dx of [-r, r]) for(const dy of [-r, r]){ const sx = L.f*(X + dx)/Z, sy = -L.f*(Y + dy)/Z;
      if(sx < x0) x0 = sx; if(sx > x1) x1 = sx; if(sy < y0) y0 = sy; if(sy > y1) y1 = sy; } };
    if(p.h !== undefined){
      // a long thing (a beam, a pillar, a trail): its two ends, clipped to just before the camera, each widened by its width
      const w = Math.max(p.r0 || 0, p.glowR ? p.glowR*3 : 0, p.w ? p.w*(p.k === 3 ? 6 : 5) : 0)*1.5 + 1e-6, near = 1e-5;
      let A = cam(p.bx, p.by, p.bz), B = cam(p.bx + p.ax*p.h, p.by + p.ay*p.h, p.bz + p.az*p.h);
      if(A[2] < near && B[2] < near) continue;
      if(A[2] < near){ const t = (near - A[2])/(B[2] - A[2]); A = [A[0] + (B[0] - A[0])*t, A[1] + (B[1] - A[1])*t, near]; }
      if(B[2] < near){ const t = (near - B[2])/(A[2] - B[2]); B = [B[0] + (A[0] - B[0])*t, B[1] + (A[1] - B[1])*t, near]; }
      box(A[0], A[1], A[2], w); box(B[0], B[1], B[2], w);
    } else {
      const [X, Y, Z] = cam(p.c[0], p.c[1], p.c[2]), r = p.rad*1.733;
      if(Z < -r) continue;
      if(Z - r <= 1e-4){ all.push(p); continue; }
      box(X, Y, Z - r, r); box(X, Y, Z + r, r);
    }
    const X0 = Math.floor(x0/px + ww/2) - 2, X1 = Math.ceil(x1/px + ww/2) + 2, Y0 = Math.floor(y0/px + wh/2) - 2, Y1 = Math.ceil(y1/px + wh/2) + 2;
    if(X1 < 0 || X0 >= ww || Y1 < 0 || Y0 >= wh) continue;
    for(let ty = Math.max(0, Math.floor(Y0/RING_TILE)); ty <= Math.min(th - 1, Math.floor(Y1/RING_TILE)); ty++)
      for(let tx = Math.max(0, Math.floor(X0/RING_TILE)); tx <= Math.min(tw - 1, Math.floor(X1/RING_TILE)); tx++) bins[ty*tw + tx].push(p);
  }
  if(all.length) for(const bn of bins) for(const p of all) bn.push(p);
  return { bins, tw, at: (x, y) => bins[Math.min(th - 1, Math.max(0, Math.floor(y/RING_TILE)))*tw + Math.min(tw - 1, Math.max(0, Math.floor(x/RING_TILE)))] };
}
// one ray: what it meets. Returns { kind: 0 space, 1 floor, 2 wall (or a work), 3 star, 4 square, t, phi, z, h (height up a wall), air, cosI }
function ringRay(L, dx, dy, dz, air, list){
  const Px = L.Px, z0 = L.z0, a = dx*dx + dy*dy, b = Px*dx, c = Px*Px - L.R*L.R;
  let hit = null;
  if(a > 1e-12){ const t = (-b + Math.sqrt(b*b - a*c))/a, z = z0 + t*dz;
    if(Math.abs(z) <= L.W/2){ const X = Px + t*dx, Y = t*dy; hit = { kind: 1, t, phi: Math.atan2(Y, X), z, h: 0, cosI: Math.abs(X*dx + Y*dy)/L.R }; }
    else if(Math.abs(dz) > 1e-12){ const zw = Math.sign(dz)*L.W/2, tw = (zw - z0)/dz, X = Px + tw*dx, Y = tw*dy, rho = Math.sqrt(X*X + Y*Y);
      if(rho >= L.R - L.Hw) hit = { kind: 2, t: tw, phi: Math.atan2(Y, X), z: zw, h: (L.R - rho)/L.W, cosI: Math.abs(dz) }; } }
  // the shadow squares: a ring of panels close round the star, 0.6 band widths tall
  const Rq = RING_SQR, aq = a, cq = Px*Px - Rq*Rq, dq = b*b - aq*cq;
  if(aq > 1e-12 && dq > 0){ const t1 = (-b - Math.sqrt(dq))/aq;
    if(t1 > 0 && (!hit || t1 < hit.t)){ const z = z0 + t1*dz; if(Math.abs(z) <= L.W*0.3){ const X = Px + t1*dx, Y = t1*dy; let u = (Math.atan2(Y, X)*L.side - L.q0)/L.per; u -= Math.floor(u);
      if(u < RING_COV) hit = { kind: 4, t: t1, phi: 0, z, h: 0, cosI: 1 }; } } }
  // the works in this pixel's tile: needles and beams (spires, towers, arches), ships' hulls, crystals
  if(list) for(const p of list){
    if(p.k === 0){
      // the closest approach of the ray (P + tD) and the beam's axis (B + A·s, 0 ≤ s ≤ h), then where it enters the beam
      // (and, for a capped one — a mesa, a pinnacle, a plinth — where it meets the flat top, if that is nearer)
      const wx = Px - p.bx, wy = -p.by, wz = z0 - p.bz, b2 = dx*p.ax + dy*p.ay + dz*p.az, d1 = dx*wx + dy*wy + dz*wz, e1 = p.ax*wx + p.ay*wy + p.az*wz, den = 1 - b2*b2;
      let te = Infinity, se = 0, nx = 0, ny = 0, nz = 0;
      if(den >= 1e-9){ const t = (b2*e1 - d1)/den, sv = (e1 - b2*d1)/den;
        if(sv >= 0 && sv <= p.h && t > 0 && !(hit && t > hit.t)){
          const qx = Px + t*dx - (p.bx + p.ax*sv), qy = t*dy - (p.by + p.ay*sv), qz = z0 + t*dz - (p.bz + p.az*sv), q2 = qx*qx + qy*qy + qz*qz, rr = p.r0 + (p.r1 - p.r0)*sv/p.h;
          if(q2 <= rr*rr){ te = Math.max(1e-6, t - Math.sqrt(rr*rr - q2)/Math.sqrt(den)); const Ex = Px + te*dx, Ey = te*dy, Ez = z0 + te*dz; se = (Ex - p.bx)*p.ax + (Ey - p.by)*p.ay + (Ez - p.bz)*p.az;
            nx = Ex - p.bx - p.ax*se; ny = Ey - p.by - p.ay*se; nz = Ez - p.bz - p.az*se; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl; } } }
      if(p.cap && Math.abs(b2) > 1e-9){ const tc = ((p.bx + p.ax*p.h - Px)*p.ax + (p.by + p.ay*p.h)*p.ay + (p.bz + p.az*p.h - z0)*p.az)/b2;
        if(tc > 0 && tc < te && !(hit && tc > hit.t)){ const cx = Px + tc*dx - (p.bx + p.ax*p.h), cy = tc*dy - (p.by + p.ay*p.h), cz = z0 + tc*dz - (p.bz + p.az*p.h);
          if(cx*cx + cy*cy + cz*cz <= p.r1*p.r1){ te = tc; se = p.h; const sg = b2 < 0 ? 1 : -1; nx = p.ax*sg; ny = p.ay*sg; nz = p.az*sg; } } }
      if(!(te < Infinity)) continue;
      const Ex = Px + te*dx, Ey = te*dy, phi = Math.atan2(Ey, Ex), Ux = -Math.cos(phi), Uy = -Math.sin(phi), view = Math.max(0, -(nx*dx + ny*dy + nz*dz)), top = Math.max(0, nx*Ux + ny*Uy);
      hit = { kind: 2, t: te, phi, z: (p.bz >= 0 ? 1 : -1)*L.W*0.5, h: Math.max(0, se)/L.W + 0.3, cosI: 0.5, spire: p.spire ? se/p.h : undefined,
        ac: p.rock ? (z0 + te*dz)/L.W + 0.5 + (L.R - Math.hypot(Ex, Ey))/L.W*2 : undefined,
        shade: (0.5 + 0.5*view)*(0.62 + 0.38*top)*(p.arch ? 1.05 : p.tower ? 0.8 : 1), work: p, n: [nx, ny, nz], se };
    } else if(p.k === 1){
      // a hull: an ellipsoid along its heading
      const ox = Px - p.c[0], oy = -p.c[1], oz = z0 - p.c[2];
      const o1 = (ox*p.F[0] + oy*p.F[1] + oz*p.F[2])/p.ax, o2 = (ox*p.U[0] + oy*p.U[1] + oz*p.U[2])/p.ay, o3 = (ox*p.S[0] + oy*p.S[1] + oz*p.S[2])/p.az;
      const d1 = (dx*p.F[0] + dy*p.F[1] + dz*p.F[2])/p.ax, d2 = (dx*p.U[0] + dy*p.U[1] + dz*p.U[2])/p.ay, d3 = (dx*p.S[0] + dy*p.S[1] + dz*p.S[2])/p.az;
      const A2 = d1*d1 + d2*d2 + d3*d3, B2 = o1*d1 + o2*d2 + o3*d3, C2 = o1*o1 + o2*o2 + o3*o3 - 1, disc = B2*B2 - A2*C2;
      if(disc <= 0) continue;
      const t = (-B2 - Math.sqrt(disc))/A2; if(t <= 0 || (hit && t > hit.t)) continue;
      const p1 = (o1 + t*d1)/p.ax, p2 = (o2 + t*d2)/p.ay, p3 = (o3 + t*d3)/p.az;
      const n = ringNorm([p.F[0]*p1 + p.U[0]*p2 + p.S[0]*p3, p.F[1]*p1 + p.U[1]*p2 + p.S[1]*p3, p.F[2]*p1 + p.U[2]*p2 + p.S[2]*p3]);
      const X = Px + t*dx, Y = t*dy, top = Math.max(0, n[0]*p.U[0] + n[1]*p.U[1] + n[2]*p.U[2]), view = Math.max(0, -(n[0]*dx + n[1]*dy + n[2]*dz));
      hit = { kind: 2, t, phi: Math.atan2(Y, X), z: (p.c[2] >= 0 ? 1 : -1)*L.W*0.5, h: 0.3, cosI: 0.5, work: p, ac: p.rock ? (z0 + t*dz)/L.W + 0.5 + (L.R - Math.hypot(X, Y))/L.W*2 : undefined,
        shade: p.rock ? (0.5 + 0.5*view)*(0.5 + 0.5*top) : 0.55*(0.35 + 0.65*top)*(0.6 + 0.4*view) };
    } else if(p.k === 2){
      // a crystal: an upright octahedron, clipped plane by plane
      const ox = Px - p.c[0], oy = -p.c[1], oz = z0 - p.c[2]; let tn = 0, tf = Infinity, nIn = null;
      for(const n of p.planes){ const num = 1 - (n[0]*ox + n[1]*oy + n[2]*oz), dn = n[0]*dx + n[1]*dy + n[2]*dz;
        if(Math.abs(dn) < 1e-12){ if(num < 0){ tf = -1; break; } continue; }
        const t = num/dn; if(dn < 0){ if(t > tn){ tn = t; nIn = n; } } else if(t < tf) tf = t; }
      if(!nIn || tn > tf || tn <= 0 || (hit && tn > hit.t)) continue;
      const n = ringNorm(nIn), X = Px + tn*dx, Y = tn*dy, face = Math.abs(n[0]*dx + n[1]*dy + n[2]*dz), top = Math.max(0, n[0]*p.U[0] + n[1]*p.U[1] + n[2]*p.U[2]);
      hit = { kind: 2, t: tn, phi: Math.atan2(Y, X), z: (p.c[2] >= 0 ? 1 : -1)*L.W*0.5, h: 0.3, cosI: 0.5, shade: 0.25 + 0.3*top, work: p, emit: 0.45 + 0.55*(1 - face) + 0.25*top };
    }
  }
  // the star (radius 0.02) at the centre
  const cs = Px*Px - 0.0004, ds = b*b - (dx*dx + dy*dy + dz*dz)*cs;
  if(ds > 0){ const ts = (-b - Math.sqrt(ds))/(dx*dx + dy*dy + dz*dz); if(ts > 0 && (!hit || ts < hit.t)) hit = { kind: 3, t: ts, phi: 0, z: 0, h: 0, cosI: 1 }; }
  if(!hit) hit = { kind: 0, t: 4, phi: 0, z: 0, h: 0, cosI: 1 };
  hit.air = air ? ringAir(L, dx, dy, dz, a, b, hit) : 0;
  return hit;
}
// THE LIGHTS that are not solid, along one ray up to what it met (at tHit): engines, trails, pillars, circles,
// crystals' halos; each at least a pixel wide where it is, and dimmer as it thins below one (no shimmer)
function ringGlow(L, dx, dy, dz, tHit, list, alpha, out){
  const Px = L.Px, z0 = L.z0;
  for(const p of list){
    if(p.k === 3 || p.k === 5){
      // a pillar or a trail: glow by the ray's distance from its line
      const wx = Px - p.bx, wy = -p.by, wz = z0 - p.bz, b2 = dx*p.ax + dy*p.ay + dz*p.az, d1 = dx*wx + dy*wy + dz*wz, e1 = p.ax*wx + p.ay*wy + p.az*wz, den = 1 - b2*b2;
      if(den < 1e-9) continue;
      const t = (b2*e1 - d1)/den, sv = (e1 - b2*d1)/den; if(t <= 0 || t >= tHit || sv < 0 || sv > p.h) continue;
      const qx = Px + t*dx - (p.bx + p.ax*sv), qy = t*dy - (p.by + p.ay*sv), qz = z0 + t*dz - (p.bz + p.az*sv), d = Math.sqrt(qx*qx + qy*qy + qz*qz);
      const w = p.k === 5 ? p.w*(1 + 4*sv/p.h) : p.w, we = Math.max(w, t*alpha*1.2), kk = w/we, u = sv/p.h;
      let v; let col;
      // (a light bridge is even along its length; a pillar fades toward the star)
      if(p.k === 3){ v = (Math.exp(-(d*d)/(we*we))*Math.max(0.4, kk) + 0.35*Math.exp(-(d*d)/(25*we*we))*Math.max(0.3, Math.sqrt(kk)))*(p.even ? 0.85 : Math.pow(1 - u, 0.7)); col = p.col; }
      else { v = 0.22*Math.exp(-(d*d)/(we*we))*Math.sqrt(kk)*Math.pow(1 - u, 1.5); col = [0.95, 0.97, 1]; }
      if(v > 1e-4){ out[0] += col[0]*v; out[1] += col[1]*v; out[2] += col[2]*v; }
    } else if(p.k === 6 || p.k === 2){
      // an engine, or a crystal's halo: a point of light
      const vx = p.c[0] - Px, vy = p.c[1], vz = p.c[2] - z0, t0 = vx*dx + vy*dy + vz*dz, g = p.k === 6 ? p.g : p.size*3;
      if(t0 <= 0 || t0 > tHit + g*2) continue;
      const d2 = vx*vx + vy*vy + vz*vz - t0*t0, s = Math.max(g, t0*alpha*1.2), v = (p.k === 6 ? 1.2 : 0.45)*Math.exp(-d2/(s*s))*Math.max(0.2, Math.sqrt(g/s));
      if(v > 1e-4){ out[0] += p.col[0]*v; out[1] += p.col[1]*v; out[2] += p.col[2]*v; }
    } else if(p.k === 7){
      // an arch's field (the air it holds): a sheet in the arch's plane, between the walls' tops and the arch, faint face-on,
      // brighter seen edge-on, brightest along the arch itself, with slow bands as of something moving in it
      const dn = dx*p.N[0] + dy*p.N[1] + dz*p.N[2]; if(Math.abs(dn) < 1e-6) continue;
      const t = ((p.O[0] - Px)*p.N[0] + p.O[1]*p.N[1] + (p.O[2] - z0)*p.N[2])/dn; if(t <= 0 || t >= tHit) continue;
      const qx = Px + t*dx - p.O[0], qy = t*dy - p.O[1], qz = z0 + t*dz - p.O[2], x = (qx*p.E1[0] + qy*p.E1[1] + qz*p.E1[2])/p.a, y = (qx*p.E2[0] + qy*p.E2[1] + qz*p.E2[2])/p.ht;
      if(y < 0) continue; const e = Math.sqrt(x*x + y*y); if(e > 1.06) continue;
      const we = Math.max(0.012, t*alpha*1.5/(p.ht*Math.max(0.15, Math.abs(dn)))), edge = Math.exp(-((e - 1)*(e - 1))/(we*we));
      const v = (e < 1 ? Math.min(0.32, 0.07/Math.max(0.2, Math.abs(dn)))*(0.8 + 0.2*Math.sin(y*38 + x*5))*(0.6 + 0.4*y) : 0) + 0.45*edge;
      if(v > 1e-4){ out[0] += p.col[0]*v; out[1] += p.col[1]*v; out[2] += p.col[2]*v; }
    } else if(p.k === 8){
      // a dome of glass: the ray against its ellipsoid (round across, Rv high), its upper half; the light it catches grows
      // toward its rim, where the ray glances off it
      const k = p.R/p.Rv, ox = Px - p.c[0], oy = -p.c[1], oz = z0 - p.c[2], ou = ox*p.U[0] + oy*p.U[1] + oz*p.U[2], du = dx*p.U[0] + dy*p.U[1] + dz*p.U[2];
      const Ox = ox + p.U[0]*ou*(k - 1), Oy = oy + p.U[1]*ou*(k - 1), Oz = oz + p.U[2]*ou*(k - 1), Dx = dx + p.U[0]*du*(k - 1), Dy = dy + p.U[1]*du*(k - 1), Dz = dz + p.U[2]*du*(k - 1);
      const A2 = Dx*Dx + Dy*Dy + Dz*Dz, B2 = Ox*Dx + Oy*Dy + Oz*Dz, C2 = Ox*Ox + Oy*Oy + Oz*Oz - p.R*p.R, disc = B2*B2 - A2*C2; if(disc <= 0) continue;
      const t = (-B2 - Math.sqrt(disc))/A2; if(t <= 0 || t >= tHit) continue;
      const hx = ox + t*dx, hy = oy + t*dy, hz = oz + t*dz, hu = hx*p.U[0] + hy*p.U[1] + hz*p.U[2]; if(hu < 0) continue;
      const kk = k*k - 1, nx = hx + p.U[0]*hu*kk, ny = hy + p.U[1]*hu*kk, nz = hz + p.U[2]*hu*kk, nl = Math.hypot(nx, ny, nz) || 1, cv = Math.abs(nx*dx + ny*dy + nz*dz)/nl;
      const v = 0.05 + 0.55*Math.pow(1 - cv, 3);
      out[0] += p.col[0]*v; out[1] += p.col[1]*v; out[2] += p.col[2]*v;
    } else if(p.k === 4){
      // a circle: where the ray crosses its plane, two rings, a star inside, runes between them
      const dn = dx*p.N[0] + dy*p.N[1] + dz*p.N[2]; if(Math.abs(dn) < 1e-5) continue;
      const t = ((p.c[0] - Px)*p.N[0] + p.c[1]*p.N[1] + (p.c[2] - z0)*p.N[2])/dn; if(t <= 0 || t >= tHit) continue;
      const qx = Px + t*dx - p.c[0], qy = t*dy - p.c[1], qz = z0 + t*dz - p.c[2], x = qx*p.E1[0] + qy*p.E1[1] + qz*p.E1[2], y = qx*p.E2[0] + qy*p.E2[1] + qz*p.E2[2], rho = Math.hypot(x, y);
      if(rho > p.R*1.12) continue;
      const lw = p.R*0.018, we = Math.max(lw, t*alpha*1.2/Math.max(0.12, Math.abs(dn))), kk = lw/we, R = p.R;
      const ring = e => Math.exp(-((rho - e)*(rho - e))/(we*we));
      let v = ring(R) + 0.8*ring(R*0.8) + (rho < R ? 0.06 : 0);
      // the star: chords between every second point on the inner ring
      for(let i = 0; i < p.points; i++){ const a0 = i/p.points*Math.PI*2, a1 = (i + 2)/p.points*Math.PI*2, x0 = Math.cos(a0)*R*0.8, y0 = Math.sin(a0)*R*0.8, x1 = Math.cos(a1)*R*0.8, y1 = Math.sin(a1)*R*0.8;
        const ex = x1 - x0, ey = y1 - y0, f = Math.max(0, Math.min(1, ((x - x0)*ex + (y - y0)*ey)/(ex*ex + ey*ey))), ddx = x - x0 - ex*f, ddy = y - y0 - ey*f;
        v += 0.7*Math.exp(-(ddx*ddx + ddy*ddy)/(we*we)); }
      // the runes: a little 3×3 glyph in each sector of the band between the rings (an even glow when too fine to read)
      if(rho > R*0.83 && rho < R*0.97){ const cellW = R*0.14/3;
        if(t*alpha > cellW*0.8) v += 0.35;
        else { const ang = Math.atan2(y, x)/(Math.PI*2) + 0.5, sec = Math.floor(ang*p.runes), uu = ang*p.runes - sec, vv = (rho - R*0.83)/(R*0.14);
          const bits = mnHash(sec, 3, p.salt)*512 | 0, cell = Math.min(2, Math.floor(vv*3))*3 + Math.min(2, Math.floor(uu*3)); if((bits >> cell) & 1) v += 0.8; } }
      v *= Math.sqrt(kk);
      if(v > 1e-4){ out[0] += p.col[0]*v; out[1] += p.col[1]*v; out[2] += p.col[2]*v; }
    }
  }
}
// the air a ray passes through (its optical depth), summed where there is air: near the camera, and near the far floor it
// meets (the ring's middle, far from any floor, is empty). Between the walls only.
// the air's sample points along a stretch: crowded toward its near end (0) or its far end (1), as cubes
const RING_AIR = [0, 1].map(far => { const n = 14, m = [], w = []; for(let k = 0; k < n; k++){ const a = k/n, b = (k + 1)/n, c = (a + b)/2;
  const F = x => far ? 1 - (1 - x)*(1 - x)*(1 - x) : x*x*x; m.push(F(c)); w.push(F(b) - F(a)); } return { n, m, w }; });
function ringAir(L, dx, dy, dz, a, b, hit){
  const Px = L.Px, top = L.R - L.Hs*7, ci = Px*Px - top*top, di = b*b - a*ci, end = hit.kind === 1 || hit.kind === 2 ? hit.t : 3;
  const segs = [];
  if(a <= 1e-12 || di <= 0) segs.push([0, end]);
  else { const t1 = (-b - Math.sqrt(di))/a, t2 = (-b + Math.sqrt(di))/a; segs.push([0, Math.min(end, Math.max(0, t1))]); if(t2 < end) segs.push([Math.max(0, t2), end]); }
  let tau = 0;
  // (samples crowd toward the camera's end of the first stretch and the far floor's end of the second, where the air is:
  //  evenly spaced, a ray skimming over low walls stepped clean past the thin air beside you)
  segs.forEach(([t0, t1], si) => { if(t1 <= t0) return; const S = RING_AIR[si];
    for(let k = 0; k < S.n; k++){ const dt = S.w[k]*(t1 - t0), t = t0 + S.m[k]*(t1 - t0), z = L.z0 + t*dz, over = Math.abs(z) - L.W/2;
      // (past the walls the air thins away, not at a line: an edge in the sky gave the world away)
      const X = Px + t*dx, Y = t*dy, h = L.R - Math.sqrt(X*X + Y*Y); if(h < 0) continue; tau += Math.exp(-h/L.Hs - (over > 0 ? over/(L.W*0.08) : 0))*dt; } });
  return tau/L.L0;
}
// SATURN for the ring (Ruby: "Ringworld should sometimes be orbiting Saturn"; ROADMAP K1): by the seed (one ring in four,
// from a stream of its own, so every other ring is as it was) or the part's Saturn setting, the ring orbits it and it
// hangs huge in the sky beyond. It is placed in the world where the opening shot looks (turn 40, view 55), a little off
// by the seed, so the first picture shows it and turning the camera turns past it; its rings opened a little, lit by the
// ring's star at the ring's middle; now and then Enceladus beside it. Saturn's radius is the unit here; null: no Saturn.
function ringSaturn(o, mode){
  const S = seedChoice(o.seed >>> 0, 'ring saturn'), by = S() < 0.25;
  if(!(mode === 'always' || (mode !== 'never' && by))) return null;
  const L0 = ringCamera({ ...o, look: 40, lift: 90 - 90*0.55 }), f = [L0.fx, L0.fy, L0.fz], r = [L0.rx, L0.ry, L0.rz], u = [L0.ux, L0.uy, L0.uz];
  const a = (S() - 0.5)*0.6, b = -0.02 + 0.25*S(), sv = ringNorm([0, 1, 2].map(i => f[i]*Math.cos(a)*Math.cos(b) + r[i]*Math.sin(a)*Math.cos(b) + u[i]*Math.sin(b)));
  const rho = 0.1 + 0.09*S(), D = 1/Math.sin(rho), dot = (p, q) => p[0]*q[0] + p[1]*q[1] + p[2]*q[2], cross = (p, q) => [p[1]*q[2] - p[2]*q[1], p[2]*q[0] - p[0]*q[2], p[0]*q[1] - p[1]*q[0]];
  const up = ringNorm(u.map((v, i) => v - sv[i]*dot(u, sv))), roll = (S() - 0.5)*0.5, side = cross(sv, up), u2 = ringNorm(up.map((v, i) => v*Math.cos(roll) + side[i]*Math.sin(roll)));
  const open = (S() < 0.5 ? -1 : 1)*(0.2 + 0.25*S()), nR = ringNorm(u2.map((v, i) => v*Math.cos(open) + sv[i]*Math.sin(open)));
  // (where it is, from the camera, in Saturn's radii; the way to the star from it; the ring plane's own two ways)
  const C = sv.map(v => v*D), O = [L0.Px, 0, L0.z0], Ls = ringNorm(C.map((v, i) => -(O[i] + v))), a1 = ringNorm(sv.map((v, i) => v - nR[i]*dot(sv, nR))), a2 = cross(nR, a1);
  const enc = S() < 0.45 ? (th => C.map((v, i) => v + 3.95*(a1[i]*Math.cos(th) + a2[i]*Math.sin(th))))((S() < 0.5 ? -1 : 1)*(0.35 + 0.15*S())*Math.PI) : null;
  return { C, nR, Ls, D, enc, phase: S()*6.283 };
}
// a ring's opacity at r Saturn radii out: the C ring faint, the B ring bright, the Cassini gap, the A ring with Encke's
const RING_SAT_BANDS = [[1.24, 1.53, 0.28, 0.62], [1.53, 1.95, 0.88, 0.95], [1.95, 2.03, 0.06, 0.7], [2.03, 2.205, 0.62, 0.85], [2.215, 2.27, 0.55, 0.82]];
function ringSatRing(r, span){ let a = 0, b = 0; for(const [r0, r1, al, br] of RING_SAT_BANDS){ const k = genClamp(Math.min(r - r0, r1 - r)/Math.max(1e-4, span) + 0.5); a += al*k; b += br*al*k; } return [a, a > 0 ? b/a : 0]; }
const RING_SAT_TONES = [[0.85, 0.79, 0.62], [0.91, 0.85, 0.70], [0.80, 0.71, 0.52], [0.93, 0.88, 0.74], [0.76, 0.67, 0.49], [0.88, 0.81, 0.64], [0.72, 0.66, 0.53]];
// what a ray d (unit, from the camera) sees of Saturn: [r, g, b, cover], or null; px the pixel's angle
function ringSatSee(sat, d, px){
  const { C, nR, Ls } = sat, dot = (p, q) => p[0]*q[0] + p[1]*q[1] + p[2]*q[2], Cl = sat.D;
  let pc = 0, pr = 0, pg = 0, pb = 0, tS = Infinity;
  // the globe: where the ray meets it (its edge as wide as a pixel), banded by latitude, lit by the star, the rings' shadow on it
  const bb = dot(d, C), c2 = Cl*Cl - bb*bb;
  if(bb > 0 && c2 < 1.2){ const miss = Math.sqrt(Math.max(0, c2)); pc = genClamp(0.5 - (miss - 1)/(Cl*px));
    if(pc > 0){ const tq = bb - Math.sqrt(Math.max(0, 1 - Math.min(1, c2))); tS = tq; const n = [d[0]*tq - C[0], d[1]*tq - C[1], d[2]*tq - C[2]], nl = Math.hypot(n[0], n[1], n[2]) || 1; for(let i = 0; i < 3; i++) n[i] /= nl;
      const lat = dot(n, nR), t = (lat*0.5 + 0.5)*13 + 0.35*Math.sin(lat*29 + sat.phase), i0 = Math.floor(t), fr = t - i0, k = fr*fr*(3 - 2*fr), A = RING_SAT_TONES[((i0 % 7) + 7) % 7], B = RING_SAT_TONES[(((i0 + 1) % 7) + 7) % 7];
      let col = [0, 1, 2].map(j => A[j] + (B[j] - A[j])*k); const pole = genClamp((Math.abs(lat) - 0.78)/0.15); col = col.map((v, j) => v + ([0.6, 0.6, 0.56][j] - v)*pole*0.7);
      let lit = 0.05 + 0.95*Math.pow(Math.max(0, dot(n, Ls)), 0.9); const mu = Math.max(0, -dot(d, n)); lit *= 0.6 + 0.4*mu;
      const den = dot(Ls, nR); if(Math.abs(den) > 1e-4){ const ts = -dot(n, nR)/den; if(ts > 0){ const q = [n[0] + Ls[0]*ts, n[1] + Ls[1]*ts, n[2] + Ls[2]*ts], rr = Math.hypot(q[0], q[1], q[2]); lit *= 1 - 0.7*ringSatRing(rr, 0.02)[0]; } }
      pr = col[0]*lit; pg = col[1]*lit; pb = col[2]*lit; } }
  // the rings: where the ray crosses their plane, their opacity by the distance out; the globe's shadow across them
  let ra = 0, rc = 0, tR = Infinity; const dn = dot(d, nR);
  if(Math.abs(dn) > 1e-6){ const t = dot(C, nR)/dn; if(t > 0){ const q = [d[0]*t - C[0], d[1]*t - C[1], d[2]*t - C[2]], rr = Math.hypot(q[0], q[1], q[2]);
    if(rr > 1.1 && rr < 2.4){ const [al, br] = ringSatRing(rr, t*px/Math.max(0.05, Math.abs(dn))); ra = al; tR = t;
      const qa = dot(q, Ls), sh = qa < 0 && rr*rr - qa*qa < 1 ? 0.18 : 1; rc = br*(0.45 + 0.55*Math.abs(dot(Ls, nR)))*sh; } } }
  // Enceladus: small and white, lit
  let ec = 0, er = 0, tE = Infinity;
  if(sat.enc){ const E = sat.enc, er0 = 0.08, eb = dot(d, E), el = Math.hypot(E[0], E[1], E[2]), e2 = el*el - eb*eb;
    if(eb > 0 && e2 < er0*er0*1.6){ ec = genClamp(0.5 - (Math.sqrt(Math.max(0, e2)) - er0)/(el*px)); tE = eb;
      const n = ringNorm([d[0]*eb - E[0], d[1]*eb - E[1], d[2]*eb - E[2]]); er = 0.08 + 0.9*Math.max(0, dot(n, Ls)); } }
  if(pc <= 0 && ra <= 0 && ec <= 0) return null;
  // laid far to near: the globe or the ring behind it, then what is in front
  const layers = [[tS, pc, [pr, pg, pb]], [tR, ra, [rc*0.93, rc*0.87, rc*0.74]], [tE, ec, [er*0.95, er*0.97, er]]].filter(l => l[1] > 0).sort((p, q) => q[0] - p[0]);
  let R = 0, Gc = 0, Bc = 0, cov = 0;
  for(const [, al, col] of layers){ R = R*(1 - al) + col[0]*al; Gc = Gc*(1 - al) + col[1]*al; Bc = Bc*(1 - al) + col[2]*al; cov = cov*(1 - al) + al; }
  return cov > 0 ? [R/cov, Gc/cov, Bc/cov, cov] : null;
}
function genRingView(ww, wh, unit, o, saturnMode){
  const L = ringLook(o), N = ww*wh, along = new Float32Array(N), across = new Float32Array(N), dist = new Float32Array(N), detail = new Float32Array(N);
  const sky = new Float32Array(N), walls = new Float32Array(N), star = new Float32Array(N), day = new Float32Array(N), squares = new Float32Array(N), airs = new Float32Array(N);
  const scaf = new Float32Array(N), open = new Float32Array(N), seam = new Float32Array(N), skyAir = new Float32Array(N);
  const city = new Float32Array(N), cityL = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, lights = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
  const shade = new Float32Array(N).fill(1), cA = new Float32Array(N), cC = new Float32Array(N), cD = new Float32Array(N).fill(1), cHere = new Float32Array(N);
  const rock = new Float32Array(N), snow = new Float32Array(N), satP = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, satC = new Float32Array(N);
  const sat = ringSaturn(o, saturnMode);
  // (the day where the camera stands: the air about it is lit by it, whatever lies beyond)
  const here = new Float32Array(N).fill(ringDay(L, 0)), beacon = new Float32Array(N);
  const px = 1/unit, alpha = px/L.f, D3 = new Float64Array(3), G = [0, 0, 0], bins = ringBin(L, ww, wh, unit), cityCol = L.pal[0], winCol = L.pal[1];
  const ray = (sx, sy) => { const dx = L.f*L.fx + sx*L.rx - sy*L.ux, dy = L.f*L.fy + sx*L.ry - sy*L.uy, dz = L.f*L.fz + sx*L.rz - sy*L.uz, l = Math.sqrt(dx*dx + dy*dy + dz*dz); D3[0] = dx/l; D3[1] = dy/l; D3[2] = dz/l; return D3; };
  // what each pixel's CORNER sees (shared by the four pixels round it): their mix is the pixel's coverage, its edges smooth
  const cw = ww + 1, K = new Uint8Array(cw*(wh + 1));
  for(let y = 0; y <= wh; y++) for(let x = 0; x <= ww; x++){ const d = ray((x - ww/2)*px, (y - wh/2)*px); K[y*cw + x] = ringRay(L, d[0], d[1], d[2], false, bins.at(x, y)).kind; }
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const q = y*ww + x, list = bins.at(x, y), sx = (x + 0.5 - ww/2)*px, sy = (y + 0.5 - wh/2)*px, ks = [K[y*cw + x], K[y*cw + x + 1], K[(y + 1)*cw + x], K[(y + 1)*cw + x + 1]];
    const d = ray(sx, sy), dx = d[0], dy = d[1], dz = d[2], c = ringRay(L, dx, dy, dz, true, list);
    let n0 = 0, n2 = 0, n3 = 0, n4 = 0; for(const k of ks){ if(k === 0) n0++; else if(k === 2) n2++; else if(k === 3) n3++; else if(k === 4) n4++; }
    // (the centre counts as much as the corners together)
    const w = k => (k === c.kind ? 0.5 : 0) + 0.125*(k === 0 ? n0 : k === 2 ? n2 : k === 3 ? n3 : n4);
    const space = w(0) + w(3) + w(4);
    sky[q] = space; walls[q] = w(2); star[q] = w(3); squares[q] = w(4);
    // Saturn, where the pixel sees open space
    if(sat && w(0) > 0){ const sv = ringSatSee(sat, d, alpha); if(sv){ satP.r[q] = sv[0]; satP.g[q] = sv[1]; satP.b[q] = sv[2]; satC[q] = sv[3]*w(0); } }
    // the star's glow in the air: by the angle from it (it stands straight up, at −x)
    const cosA = Math.max(-1, Math.min(1, -dx));
    if(cosA > 0.9){ const ang = Math.acos(cosA), glow = (space - w(4))*(Math.exp(-ang*ang/0.0016)*0.8 + Math.exp(-ang*ang/0.04)*0.25); star[q] = Math.min(1, star[q] + glow); }
    let H = c.kind === 1 || c.kind === 2 ? c : null;
    // (an edge pixel whose centre missed the ring: the ring's coordinates from a corner that met it)
    if(!H) for(let k = 0; k < 4 && !H; k++) if(ks[k] === 1 || ks[k] === 2){ const e = ray(sx + ((k & 1) - 0.5)*px, sy + ((k >> 1) - 0.5)*px), h = ringRay(L, e[0], e[1], e[2], false, list); if(h.kind === 1 || h.kind === 2) H = h; }
    if(H){ along[q] = H.phi/L.W; across[q] = H.ac !== undefined ? H.ac : H.kind === 2 ? (H.z > 0 ? 1 + H.h : -H.h) : H.z/L.W + 0.5;
      dist[q] = 1 - Math.exp(-H.t/(L.W*6)); detail[q] = H.t*alpha/Math.max(0.03, H.cosI)/L.W; day[q] = ringDay(L, H.phi);
      if(H.shade !== undefined) shade[q] = 1 - w(2) + w(2)*H.shade;
      // the land's own forms are rock (and a tall peak's head snow), not the builders' metal
      if(H.work && (H.work.rock || H.work.stone)){ rock[q] = w(2); if(H.work.snow) snow[q] = w(2)*genClamp((H.se/H.work.h - 0.66)/0.08); }
      const night = 1 - day[q];
      // the unfinished floor: its beams (metal), and the void seen between them (space shows through); the city on the land
      if(H.kind === 1){ const [bm, op] = ringLattice(L, along[q], across[q], detail[q]); const fl = 1 - space - w(2); scaf[q] = bm*fl; open[q] = op*fl;
        if(L.city.on){ const [cb, cl] = ringCity(L, along[q], across[q], detail[q]); city[q] = cb*fl*(1 - bm); const v = cl*fl*(1 - bm)*Math.pow(night, 0.8)*1.1;
          cityL.r[q] = cityCol[0]*v; cityL.g[q] = cityCol[1]*v; cityL.b[q] = cityCol[2]*v; } }
      // a work's own light: a crystal glowing from within; a tower's windows, lit at night
      if(H.emit){ const v = H.emit*w(2); lights.r[q] += H.work.col[0]*v; lights.g[q] += H.work.col[1]*v; lights.b[q] += H.work.col[2]*v; }
      if(H.work && H.work.tower && night > 0.05){ const p = H.work, rh = p.r0*0.22, row = Math.floor(H.se/rh), T = [-Math.sin(H.phi), Math.cos(H.phi)], ang = Math.atan2(H.n[2], H.n[0]*T[0] + H.n[1]*T[1]);
        const cu = (ang/(Math.PI*2) + 0.5)*36, col = Math.floor(cu), fine = genClamp(1.5 - H.t*alpha/rh);
        const lit = mnHash(row, col + p.id*131, 77) < 0.35 ? 1 : 0, fy = H.se/rh - row, fx = cu - col, win = fy > 0.3 && fy < 0.75 && fx > 0.2 && fx < 0.8 ? lit : 0, v = (fine*win + (1 - fine)*0.12)*night*w(2)*0.9;
        lights.r[q] += winCol[0]*v; lights.g[q] += winCol[1]*v; lights.b[q] += winCol[2]*v; } }
    else { dist[q] = 1; detail[q] = 1; day[q] = here[0]; }
    airs[q] = 1 - Math.exp(-c.air);
    // the air of the sky part of a pixel: an edge pixel whose centre met the ring takes it from a corner that saw space
    skyAir[q] = airs[q];
    if(space > 0 && !(c.kind === 0 || c.kind === 3 || c.kind === 4)) for(let k = 0; k < 4; k++) if(ks[k] === 0){ const e = ray(sx + ((k & 1) - 0.5)*px, sy + ((k >> 1) - 0.5)*px), h = ringRay(L, e[0], e[1], e[2], true, list); skyAir[q] = 1 - Math.exp(-h.air); break; }
    // THE CLOUDS float over the land: where this ray last crosses their layer before the ground it meets (so they stand off
    // their shadows, and the ground at your feet, under them, has none of their bodies, only their shade)
    if(H && H.kind === 1){ const a2 = dx*dx + dy*dy, b2 = L.Px*dx, c2 = L.Px*L.Px - L.Rc*L.Rc, disc = b2*b2 - a2*c2;
      if(a2 > 1e-12 && disc > 0){ const tC = (-b2 + Math.sqrt(disc))/a2, zC = L.z0 + tC*dz;
        if(tC > 0 && tC < H.t && Math.abs(zC) < L.W/2){ const X = L.Px + tC*dx, Y = tC*dy; cA[q] = Math.atan2(Y, X)/L.W; cC[q] = zC/L.W + 0.5;
          cD[q] = tC*alpha/Math.max(0.03, Math.abs(X*dx + Y*dy)/L.Rc)/L.W; cHere[q] = 1 - space - w(2); } } }
    // a beacon at each spire's tip, always lit (red, as a tall thing's warning light is)
    for(const sp of list){ if(!sp.beacon) continue; const cosT = dx*sp.tip[0] + dy*sp.tip[1] + dz*sp.tip[2]; if(cosT < sp.tipCos) continue;
      const a2 = (1 - cosT)*2*sp.tl*sp.tl/(sp.glowR*sp.glowR); if(a2 < 9) beacon[q] = Math.max(beacon[q], Math.exp(-a2)*Math.min(1, 0.002/(px*sp.tl/L.W) + 0.4)); }
    // the lights that are not solid: engines, trails, pillars, circles, crystals' halos
    G[0] = G[1] = G[2] = 0; ringGlow(L, dx, dy, dz, c.t, list, alpha, G); lights.r[q] += G[0]; lights.g[q] += G[1]; lights.b[q] += G[2];
    // the seam (a rare ring): the edges of the world's own box, faint, where you look out into space
    if(L.seam && space > 0){ const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz), mxA = Math.max(ax, ay, az), mid = ax + ay + az - mxA - Math.min(ax, ay, az);
      const edge = Math.exp(-Math.pow((mxA - mid)/(px*1.5), 2)), u = (ax === mxA ? dy/ax : dx/mxA)*4, v = (az === mxA ? dy/az : dz/mxA)*4, gu = Math.abs(u - Math.round(u)), gv = Math.abs(v - Math.round(v));
      seam[q] = space*Math.min(1, edge + 0.35*Math.exp(-Math.pow(Math.min(gu, gv)/(px*6), 2))); }
  }
  return [along, across, dist, detail, sky, walls, star, day, squares, airs, here, scaf, open, seam, beacon, skyAir, city, cityL, lights, shade, cA, cC, cD, cHere, rock, snow, satP, satC];
}

// a Ringworld View's settings (as its sliders give them) as the world it draws — shared with the camera's guide
export function ringParams(r){
  const b = r.band/100, W = 0.012 + 0.22*b*b, z = Math.max(0.25, (r.zoom ?? 100)/100);
  return { band: W, walls: W*(0.04 + 0.7*r.walls/100), altitude: W*Math.pow(10, -3.2 + 3*r.altitude/100), look: r.look,
    lift: Math.max(-30, Math.min(89.5, r.up != null ? 90 - 90*Math.min(1.3, r.up) : (r.lift ?? 15)*0.9)),
    lens: 2*Math.atan(Math.tan((r.lens ?? 75)*Math.PI/360)/z)*180/Math.PI, place: (r.placeBy === 'where the seed says' ? ringPlaceOf(r.seed >>> 0) : r.place ?? 0)/100, daylight: (r.daylight ?? 80)/100,
    air: (a => 0.01 + 0.4*a*a)((r.air ?? 50)/100), build: 0.25 + 0.75*(r.build ?? 35)/100, seed: r.seed >>> 0,
    side: r.side ?? 1, builders: Math.max(0, Math.min(5, Math.round((r.builders ?? 0)/20))),
    landforms: (r.landforms ?? 50)/100, cities: (r.cities ?? 25)/100, traffic: (r.traffic ?? 50)/100 };
}
// where across the band the seed stands you (Ringworld's own: its Stand At slider became Traffic), −0.65…0.65 of the half-band
export const ringPlaceOf = seed => (mnHash(seed | 0, 91, 7) - 0.5)*130;
// THE CAMERA'S GUIDE (Ruby: "a fast render … almost a guide while you're adjusting the camera"): the shot as a few
// lines, in page units (the short side 1), drawn over the page while the camera dial moves and the surface is still
// being made. A plane (Wood, Discharge): its grid, the page's own square bold. A ring: its floor's edges, its walls.
/** THE PAINTED RINGWORLD'S SUN (Ruby: the light dial places it, in the world, so turning the camera turns past it and the
 *  light on the land comes from where it is): its direction from the eye, a unit vector in the ring's coordinates. Its way
 *  round is the dial's (the way you face at that camera turn: the two dials agree), its height the dial's reach (the
 *  middle overhead, the rim the horizon, past it below); overhead it is the ring's own star, at the ring's middle. */
export function ringSunDir(L, deg, reach){
  const a = (deg == null ? 315 : deg)*Math.PI/180, e = (90 - 90*Math.max(0, Math.min(1.3, reach == null ? 0.4 : reach)))*Math.PI/180;
  const s = Math.hypot(L.Px, L.z0) || 1, S0 = [-L.Px/s, 0, -L.z0/s], ce = Math.cos(e), se = Math.sin(e);
  return ringNorm([S0[0]*se, Math.cos(a)*ce, Math.sin(a)*ce + S0[2]*se]);
}
/** Where the Painted Ringworld's sun falls on the page (0..aspX, 0..aspY), for the guide drawn while the light dial moves:
 *  { x, y, up } (up: above the horizon), or null when it is behind you. */
export function ringSunGuide(aspX, aspY, ring, deg, reach){
  const L = ringCamera(ringParams(ring)), D = ringSunDir(L, deg, reach), F = L.f, cx = aspX/2, cy = aspY/2;
  const vf = D[0]*L.fx + D[1]*L.fy + D[2]*L.fz, q = 1 + vf;
  if(q <= 0.12) return null;
  return { x: cx + 2*F*(D[0]*L.rx + D[1]*L.ry + D[2]*L.rz)/q, y: cy - 2*F*(D[0]*L.ux + D[1]*L.uy + D[2]*L.uz)/q, up: reach == null || reach <= 1 };
}
/**
 * RING IN THE SKY's ring as a solid (Ruby: "some depth… at the moment it's a flat disc"), shared by its painter
 * (stepsWhimsy paintRingSky) and the camera's wireframe guide: a band round its star, its land on the inside, a rim
 * wall standing in from each edge (Dw deep), seen from Dc ring-radii away in a gentle perspective, so the near arc is
 * nearer and larger than the far. w, h: the picture (any units); o: { width 0..1, tilt (the eye's height above the
 * ring's plane, degrees), turn (degrees), size, centre (the star's height, 0..1 of h) }.
 * P(t, r, z): the page point at angle t round the ring (its far side where sin t < 0), r in ring-radii, z across the
 * band (-1 its lower edge, 1 its upper). depthAt(t, r, z): larger is nearer the eye (0 the star's). faceSeen(n, t, r, z):
 * whether a face of normal n (the world's: x across, y away from the eye's side, z along the ring's axis) there faces the eye.
 */
export function skyRingFrame(w, h, o){
  const phi = o.tilt*Math.PI/180, sp = Math.sin(phi), cp = Math.cos(phi), cx = w*0.5, cy = h*o.centre, A = Math.sqrt(w*h)*0.56*o.size;
  const bw = 0.03 + 0.26*o.width, Hw = bw*0.72, Dw = Math.max(0.014, bw*0.3), Dc = 5, rot = o.turn*Math.PI/180, cr = Math.cos(rot), sr = Math.sin(rot);
  const W = (t, r, z) => [r*Math.cos(t), -r*Math.sin(t), z*Hw];
  const depthAt = (t, r, z) => { const p = W(t, r, z); return -p[1]*cp + p[2]*sp; };
  const P = (t, r, z) => { const [X, Y, Z] = W(t, r, z), up = Z*cp + Y*sp, f = Dc/(Dc - (-Y*cp + Z*sp)), ex = X*A*f, ey = -up*A*f;
    return [cx + ex*cr - ey*sr, cy + ex*sr + ey*cr]; };
  const faceSeen = (n, t, r, z) => { const p = W(t, r, z); return n[0]*(0 - p[0]) + n[1]*(-Dc*cp - p[1]) + n[2]*(Dc*sp - p[2]) > 0; };
  return { P, depthAt, faceSeen, A, Hw, Dw, cx, cy, cp, sp, cr, sr };
}
export function cameraGuide(kind, aspX, aspY, cam, ring){
  const lines = [];
  if(kind === 'plane'){
    const g = groundCam(aspX, aspY, cam.turn, cam.view, cam.zoom), P = (x, y) => g ? g.toScreen(x, y) : [x, y, 1];
    const run = (pts, bold) => { const out = []; for(const [x, y] of pts){ const p = P(x, y); if(p) out.push([p[0], p[1]]); } if(out.length > 1) lines.push({ pts: out, bold }); };
    const step = Math.min(aspX, aspY)/6;
    for(let x = -aspX; x <= aspX*2 + 1e-9; x += step) run(Array.from({ length: 41 }, (_, i) => [x, -aspY*2 + i*aspY*5/40]), false);
    for(let y = -aspY*2; y <= aspY*3 + 1e-9; y += step) run(Array.from({ length: 41 }, (_, i) => [-aspX + i*aspX*3/40, y]), false);
    run([[0, 0], [aspX, 0], [aspX, aspY], [0, aspY], [0, 0]].flatMap((p, i, a) => i ? Array.from({ length: 10 }, (_, k) => [a[i - 1][0] + (p[0] - a[i - 1][0])*(k + 1)/10, a[i - 1][1] + (p[1] - a[i - 1][1])*(k + 1)/10]) : [p]), true);
    return lines;
  }
  if(kind === 'ring' && ring){
    const L = ringCamera(ringParams(ring)), F = L.f, cx = aspX/2, cy = aspY/2;
    // (the Painted Ringworld sees in a painter's curved perspective, stereographic: stepsRing.js)
    const proj = ring.curved ? (X, Y, Z) => { const dx = X - L.Px, dy = Y, dz = Z - L.z0, q = Math.sqrt(dx*dx + dy*dy + dz*dz) + dx*L.fx + dy*L.fy + dz*L.fz; if(q <= 1e-6) return null;
        return [cx + 2*F*(dx*L.rx + dy*L.ry + dz*L.rz)/q, cy - 2*F*(dx*L.ux + dy*L.uy + dz*L.uz)/q]; }
      : (X, Y, Z) => { const dx = X - L.Px, dy = Y, dz = Z - L.z0, zc = dx*L.fx + dy*L.fy + dz*L.fz; if(zc <= 1e-6) return null;
        return [cx + F*(dx*L.rx + dy*L.ry + dz*L.rz)/zc, cy - F*(dx*L.ux + dy*L.uy + dz*L.uz)/zc]; };
    const run = (fn, n, bold) => { let cur = []; for(let i = 0; i <= n; i++){ const p = fn(i/n); if(p && Math.abs(p[0] - cx) < aspX*3 && Math.abs(p[1] - cy) < aspY*3) cur.push(p); else { if(cur.length > 1) lines.push({ pts: cur, bold }); cur = []; } } if(cur.length > 1) lines.push({ pts: cur, bold }); };
    // the floor's two edges and the walls' tops, round the whole ring; the band's middle, faint; rungs across it near you
    for(const [zf, rr, bold] of [[0.5, 1, true], [-0.5, 1, true], [0.5, 1 - L.Hw, false], [-0.5, 1 - L.Hw, false], [0, 1, false]])
      run(t => { const a = (t*2 - 1)*Math.PI; return proj(rr*Math.cos(a), rr*Math.sin(a), zf*L.W); }, 720, bold);
    for(let k = -12; k <= 12; k++){ const a = k*L.W*0.5; run(t => proj(Math.cos(a), Math.sin(a), (t - 0.5)*L.W), 8, false); }
    return lines;
  }
  if(kind === 'ellipse'){
    // (Ring in the Sky's ring, as it is drawn from the dial: Turn spins it, View raises the eye, Zoom sizes it; the
    //  band's two edges and its walls' inner edges, the far half bold)
    const size = (63 + Math.max(0, Math.min(1, (cam.zoom - 25)/375))*187)/100, tilt = 2 + Math.max(0, Math.min(100, cam.view))*0.88;
    const F = skyRingFrame(aspX, aspY, { width: 0.45, tilt, turn: cam.turn, size, centre: ring && ring.centre != null ? ring.centre : 0.45 });
    for(const [r, z] of [[1, 1], [1, -1], [1 - F.Dw, 1], [1 - F.Dw, -1]]) for(const far of [true, false])
      lines.push({ pts: Array.from({ length: 91 }, (_, i) => F.P((far ? Math.PI : 0) + i/90*Math.PI, r, z)), bold: far && r === 1 });
    for(let k = 0; k < 12; k++){ const t = k/12*Math.PI*2; lines.push({ pts: [F.P(t, 1, -1), F.P(t, 1, 1)], bold: false }); }
    const [cx, cy] = [F.cx, F.cy];
    lines.push({ pts: [[cx - 0.03, cy], [cx + 0.03, cy]], bold: true }, { pts: [[cx, cy - 0.03], [cx, cy + 0.03]], bold: true });
    return lines;
  }
  return lines;
}

// ---------------- NOISE AT COORDINATES ----------------
// Noise read wherever two maps say (any projection: a ring's floor, a polar wrap, a perspective), never repeating, and
// never finer than a pixel where it lands: a third map (Detail, how much ground a pixel spans there) ends the octaves
// a pixel can't show, so far ground is smooth and near ground sharp.
export const mnHash = (x, y, s) => { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0)/4294967296; };
export function mnValue(x, y, s){ const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx*fx*(3 - 2*fx), v = fy*fy*(3 - 2*fy);
  const a = mnHash(xi, yi, s), b = mnHash(xi + 1, yi, s), c = mnHash(xi, yi + 1, s), d = mnHash(xi + 1, yi + 1, s);
  return a + (b - a)*u + (c - a)*v + (a - b - c + d)*u*v; }
function genMapNoise(X, Y, D, N, o){
  const out = new Float32Array(N), slope = new Float32Array(N), base = 1/Math.max(1e-6, o.size), seed = o.seed | 0, oct = Math.max(1, Math.min(14, Math.round(o.octaves)));
  const fbm = (x, y, foot) => {
    if(o.warp > 0){ const wx = (mnValue(x*base*0.5 + 17.3, y*base*0.5, seed + 7) - 0.5)*o.warp*o.size, wy = (mnValue(x*base*0.5, y*base*0.5 + 41.1, seed + 9) - 0.5)*o.warp*o.size; x += wx; y += wy; }
    let sum = 0, norm = 0, amp = 1, fq = base;
    for(let k = 0; k < oct; k++){
      // how many pixels one cell of this octave spans here: under one, it would only shimmer, so it gives way to its mean
      const w = foot ? genClamp(1/(fq*foot) - 1) : 1;
      if(w <= 0){ sum += amp*0.5; norm += amp; break; }
      let nv = mnValue(x*fq, y*fq, seed + k*101);
      if(o.ridges > 0){ const r = 1 - Math.abs(2*nv - 1); nv = nv + (r*r - nv)*o.ridges; }
      sum += amp*(0.5 + (nv - 0.5)*w); norm += amp; amp *= o.rough; fq *= 2.03;
    }
    return sum/norm; };
  for(let i = 0; i < N; i++){
    const x = X ? X[i] : 0, y = Y ? Y[i] : 0, foot = D ? Math.max(1e-9, D[i]) : 0, v = fbm(x, y, foot);
    out[i] = v;
    // THE SLOPE, on the ground itself (not on the page): how steep the land is where this pixel looks, as if its
    // heights were Steepness × Size tall; read across a pixel's own width, so far ground is as smooth as it looks
    if(o.steep > 0){ const e = Math.max(foot*2.5, o.size*1e-4), gx = (fbm(x + e, y, foot) - v)/e, gy = (fbm(x, y + e, foot) - v)/e, g = Math.hypot(gx, gy)*o.steep*o.size*4;
      slope[i] = 1 - 1/Math.sqrt(1 + g*g); }
  }
  return [out, slope];
}

// ---------------- GLASS SHARDS ----------------
// (Ruby: "a bunch of glass fragments laying on nothing" — "I really like glass textures and glassy things".) Broken
// glass lying on the page: each shard a sharp polygon, tilted a little as it fell, some resting on others. The light
// dial lights them: a face that lies right for the light flashes whole; the edges catch it on the side toward it, in
// split colours (glass bends each colour its own way); and the light through each falls beside it on the ground as a
// caustic, concentrated, fringed with colour, inside a pale shadow. Through the camera dial they lie on a plane.
const GS_TINTS = [[1, 1, 1], [0.55, 0.86, 0.6], [0.96, 0.7, 0.34], [0.52, 0.7, 1], [0.8, 0.96, 0.9], [0.78, 0.58, 0.95]];   // clear, bottle green, amber, cobalt, sea glass, violet
function gsShards(aspX, aspY, o){
  const R = Math.random, salt = (R()*4294967296) >>> 0, area = aspX*aspY, n = Math.round(o.count*150*area), piles = [];
  for(let k = 0; k < 3; k++) piles.push([aspX*(0.2 + 0.6*R()), aspY*(0.2 + 0.6*R())]);
  const np = 1 + (salt % 3), out = [];
  for(let i = 0; i < n; i++){
    // (each shard its own draw: more Shards adds shards and moves none)
    const r = mulberry32((salt + Math.imul(i + 1, 0x9E3779B1)) >>> 0), P = piles[Math.floor(r()*np)];
    const g = () => { let u = 0; while(!u) u = r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r()); };
    // where: about a pile, flung wider as Spread rises (a gaussian's tail: a few fly far); and, more as it rises, anywhere
    const sig = 0.06 + 0.5*o.spread, flung = r() < Math.pow(o.spread, 1.5)*0.85, gx = g(), gy = g(), ux = r(), uy = r();
    let cx = flung ? aspX*(-0.05 + 1.1*ux) : P[0] + gx*sig*aspX*0.5, cy = flung ? aspY*(-0.05 + 1.1*uy) : P[1] + gy*sig*aspY*0.5;
    let size = o.size*(0.012 + 0.1*Math.pow(r(), 2.4)); const k = r() < 0.4 ? 3 : r() < 0.75 ? 4 : 5;
    // THE WORDS (Text Aware): a shard that fell on a line of the poem is a small one, so the line reads; FILLING THEM
    // (Shape Aware, blended into the letters): every shard lies on a line, sized to its letters (its own second stream)
    if(o.lines && o.lines.length){
      if(o.fill){ const r2 = mulberry32((salt ^ 0x51ED27) + Math.imul(i + 1, 0x2545F491) >>> 0), Ln = gsPickLine(o.lines, r2()), lh = (Ln[3] - Ln[1])*aspY;
        cx = (Ln[0] + (Ln[2] - Ln[0])*r2())*aspX; cy = (Ln[1] + (Ln[3] - Ln[1])*r2())*aspY; size = lh*o.size*(0.1 + 0.55*Math.pow(r2(), 2)); }
      // ROUND THEM (Shape Aware on the page; Ruby: "shattered glass also, generally avoid the text"): a shard that would
      // touch a line is swept away, or at a softer Shape Strength only made smaller
      else if(o.around){ const pad = size*1.15;
        if(o.lines.some(L => cx >= L[0]*aspX - pad && cx <= L[2]*aspX + pad && cy >= L[1]*aspY - pad && cy <= L[3]*aspY + pad)){ size *= 1 - o.around; if(size < 0.002) continue; } }
      else if(o.lines.some(L => cx >= L[0]*aspX && cx <= L[2]*aspX && cy >= (L[1] - (L[3] - L[1])*0.2)*aspY && cy <= (L[3] + (L[3] - L[1])*0.2)*aspY)) size *= 0.4; }
    // its outline: corners at uneven angles and distances, drawn out into a sliver as Slivers rises, turned any way
    const angs = Array.from({ length: k }, (_, j) => (j + (r() - 0.5)*0.7)/k*Math.PI*2).sort((a, b) => a - b);
    const stretch = 1 + o.slivers*3.5*r(), rot = r()*Math.PI, cr = Math.cos(rot), sr = Math.sin(rot);
    const pts = angs.map(a => { const rr = size*(0.45 + 0.55*r()), x = Math.cos(a)*rr*stretch, y = Math.sin(a)*rr; return [cx + x*cr - y*sr, cy + x*sr + y*cr]; });
    // how it lies (a little tilted, a little raised), and its glass's colour
    const tl = 0.25 + 0.75*r()*r(), ta = r()*Math.PI*2, nx = Math.cos(ta)*tl*0.75, ny = Math.sin(ta)*tl*0.75, nl = Math.hypot(nx, ny, 1), lift = size*(0.04 + 0.4*r()*r()), tinted = r() < o.colors, tint = tinted ? GS_TINTS[1 + Math.floor(r()*(GS_TINTS.length - 1))] : GS_TINTS[0];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for(const p of pts){ x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const mx = pts.reduce((a, p) => a + p[0], 0)/k, my = pts.reduce((a, p) => a + p[1], 0)/k;
    // (the edge of clear glass shows its own green, as window glass does seen edge on)
    out.push({ pts, n: [nx/nl, ny/nl, 1/nl], lift, tint, edge: tinted ? tint : [0.82, 1, 0.9], size, mx, my, box: [x0, y0, x1, y1], th: size*(0.025 + 0.03*r()) });
  }
  return out;
}
// a line of the poem, chosen by its area (so long lines take more), from a roll 0..1
function gsPickLine(lines, u){ const a = lines.map(L => Math.max(1e-6, (L[2] - L[0])*(L[3] - L[1]))), tot = a.reduce((x, y) => x + y, 0); let acc = 0;
  for(let i = 0; i < lines.length; i++){ acc += a[i]/tot; if(u <= acc) return lines[i]; } return lines[lines.length - 1]; }
// the poem's lines as the part is given them (x0, y0, x1, y1 as shares of the page), or none
const genLinesOf = text => String(text || '').split(';').map(p => p.split(',').map(Number)).filter(v => v.length >= 4 && v.slice(0, 4).every(isFinite) && v[2] > v[0] && v[3] > v[1]);
// signed distance from a point to a shard's outline (+ inside), and the nearest edge's outward normal
function gsDist(pts, x, y){
  let d2 = Infinity, ex = 0, ey = 0, inside = false;
  for(let i = 0, j = pts.length - 1; i < pts.length; j = i++){
    const ax = pts[j][0], ay = pts[j][1], dx = pts[i][0] - ax, dy = pts[i][1] - ay, L2 = dx*dx + dy*dy || 1e-12, t = Math.max(0, Math.min(1, ((x - ax)*dx + (y - ay)*dy)/L2));
    const qx = ax + dx*t - x, qy = ay + dy*t - y, q2 = qx*qx + qy*qy;
    if(q2 < d2){ d2 = q2; const l = Math.sqrt(L2); ex = dy/l; ey = -dx/l; }
    if((ay > y) !== (pts[i][1] > y) && x < ax + (y - ay)*dx/dy) inside = !inside;
  }
  return [inside ? Math.sqrt(d2) : -Math.sqrt(d2), ex, ey];
}
function gsRender(ww, wh, unit, S, o, cam, ground){
  const N = ww*wh, aspX = ww/unit, aspY = wh/unit, out = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, cov = new Float32Array(N), cau = new Float32Array(N);
  // the light: its way across the page (toward the dial's handle) and its height (overhead at the dial's middle)
  const a = (o.deg - 90)*Math.PI/180, Ex = Math.max(3, 90 - 78*Math.min(1.3, o.reach))*Math.PI/180, Lx = Math.cos(a)*Math.cos(Ex), Ly = Math.sin(a)*Math.cos(Ex), Lz = Math.sin(Ex);
  const hl = Math.hypot(Lx, Ly, Lz + 1), Hx = Lx/hl, Hy = Ly/hl, Hz = (Lz + 1)/hl, ax = Math.cos(a), ay = Math.sin(a), cot = Math.cos(Ex)/Math.sin(Ex);
  // the grid: which shards (with their shadows and caustics, cast away from the light) can touch each cell
  const cs = 0.05, gx0 = -2, gy0 = -2, gw = Math.ceil((aspX + 4)/cs), gh = Math.ceil((aspY + 4)/cs), cells = new Map();
  for(const sh of S){ const off = Math.min(sh.size*3, sh.lift*cot); sh.ox = -ax*off; sh.oy = -ay*off; const m = sh.size*0.15;
    const bx0 = Math.min(sh.box[0], sh.box[0] + sh.ox) - m, by0 = Math.min(sh.box[1], sh.box[1] + sh.oy) - m, bx1 = Math.max(sh.box[2], sh.box[2] + sh.ox) + m, by1 = Math.max(sh.box[3], sh.box[3] + sh.oy) + m;
    for(let cy = Math.max(0, Math.floor((by0 - gy0)/cs)); cy <= Math.min(gh - 1, Math.floor((by1 - gy0)/cs)); cy++)
      for(let cx = Math.max(0, Math.floor((bx0 - gx0)/cs)); cx <= Math.min(gw - 1, Math.floor((bx1 - gx0)/cs)); cx++){ const key = cy*gw + cx; let l = cells.get(key); if(!l) cells.set(key, l = []); l.push(sh); } }
  const look = (F, x, y) => { x = Math.max(0, Math.min(ww - 1.001, x)); y = Math.max(0, Math.min(wh - 1.001, y)); const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0*ww + x0, j = Math.min(wh - 1, y0 + 1)*ww + x0, x1 = x0 < ww - 1 ? 1 : 0;
    return (F[i]*(1 - fx) + F[i + x1]*fx)*(1 - fy) + (F[j]*(1 - fx) + F[j + x1]*fx)*fy; };
  const base = [0, 0, 0], col = [0, 0, 0];
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const q = y*ww + x; let px, py, fp;
    if(cam){ const g = cam.toGround((x + 0.5)/unit, (y + 0.5)/unit); if(!g){ for(const [c, F] of [[0, out.r], [1, out.g], [2, out.b]]) F[q] = ground ? [ground.r, ground.g, ground.b][c][q] : 128/255; continue; } px = g[0]; py = g[1]; fp = g[3]/unit; }
    else { px = (x + 0.5)/unit; py = (y + 0.5)/unit; fp = 1/unit; }
    if(ground){ base[0] = ground.r[q]; base[1] = ground.g[q]; base[2] = ground.b[q]; } else base[0] = base[1] = base[2] = 128/255;
    const cx = Math.floor((px - gx0)/cs), cy = Math.floor((py - gy0)/cs), list = cx >= 0 && cy >= 0 && cx < gw && cy < gh ? cells.get(cy*gw + cx) : null;
    if(!list){ out.r[q] = base[0]; out.g[q] = base[1]; out.b[q] = base[2]; continue; }
    // THE GROUND first: each shard's shadow, pale (it is glass), and inside it the light it gathers, its edges brightest, each colour a little apart
    let shade = 0, cl = [0, 0, 0];
    for(const sh of list){ const qx = px - sh.ox, qy = py - sh.oy, soft = fp + sh.lift*0.3;
      const ds = gsDist(sh.pts, qx, qy)[0]; if(ds < -soft*2) continue;
      shade = Math.max(shade, genClamp(0.5 + ds/soft)*o.shadows);
      for(let c = 0; c < 3; c++){ const k = 0.86 - c*0.03, dc = gsDist(sh.pts, sh.mx + (qx - sh.mx)/k, sh.my + (qy - sh.my)/k)[0]*k, w = Math.max(fp, sh.size*0.02) + sh.lift*0.08;
        if(dc < -w*3) continue; const inner = genClamp(0.5 + dc/w), edge = Math.exp(-(dc*dc)/(w*w));
        cl[c] += o.caustics*(0.22*inner + 0.75*edge)*(0.4 + 0.6*sh.tint[c]); } }
    for(let c = 0; c < 3; c++){ const v = base[c]*(1 - 0.28*shade); base[c] = 1 - (1 - v)*(1 - Math.min(1, cl[c])); }
    cau[q] = Math.min(1, (cl[0] + cl[1] + cl[2])/3);
    // THE SHARDS, each over what lies under it: bent a little, coloured by its glass, its face and edges lit
    for(const sh of list){
      const [sd, ex, ey] = gsDist(sh.pts, px, py), c = genClamp(0.5 + sd/fp); if(c <= 0) continue;
      if(c > cov[q]) cov[q] = c;
      const n = sh.n, spec = Math.pow(Math.max(0, n[0]*Hx + n[1]*Hy + n[2]*Hz), 70)*o.glints*1.2, face = 0.035 + 0.09*Math.max(0, n[0]*ax + n[1]*ay)/0.3;
      const ew = Math.max(sh.th, fp*1.2), facing = ex*ax + ey*ay, inner = 0.12*Math.exp(-Math.pow((sd - ew*1.7)/(ew*0.6), 2));
      // the corner nearest: a glint where two edges meet and face the light
      let cd = Infinity; for(const p of sh.pts){ const d = Math.hypot(p[0] - px, p[1] - py); if(d < cd) cd = d; }
      const corner = Math.max(0, facing)*Math.exp(-(cd*cd)/(ew*ew*6))*o.glints;
      for(let ch = 0; ch < 3; ch++){
        // the glass's own: what is under it, seen through it (bent by its tilt), tinted, a little darker
        let v = ground ? look([ground.r, ground.g, ground.b][ch], x + n[0]*sh.th*unit*6, y + n[1]*sh.th*unit*6) : base[ch];
        // (the shadows and the caustic light on the ground show through it too, on what it bends there)
        if(ground) v = 1 - (1 - v*(1 - 0.28*shade))*(1 - Math.min(1, cl[ch]));
        v *= (0.9 + 0.1*sh.tint[ch])*(1 - 0.35*(1 - sh.tint[ch]));
        // its edge, each colour's band a little wider or narrower (the split), bright toward the light, dark away
        const band = genClamp(1 - sd/(ew*(1.25 - 0.2*ch))), L = face*sh.tint[ch] + spec + band*(Math.max(0, facing)*0.85 + 0.08)*sh.edge[ch] + corner*1.5;
        v = v*(1 - band*Math.max(0, -facing)*0.3 - inner);
        col[ch] = 1 - (1 - v)*(1 - Math.min(1, L));
      }
      for(let ch = 0; ch < 3; ch++) base[ch] = base[ch]*(1 - c) + col[ch]*c;
    }
    out.r[q] = base[0]; out.g[q] = base[1]; out.b[q] = base[2];
  }
  return [out, cov, cau];
}

// ---------------- DEWY WEBS ----------------
// (Ruby: "Dewey spider webs getting caught by the light … a texture we need to make".) Orb webs: a frame of anchor
// threads, spokes from the hub, the sticky spiral wound out between them and sagging a little, some of it torn. Dew
// gathers on the spiral in beads (as a wet thread breaks into drops, a big one and small ones between), larger low in
// the web; each drop a tiny lens: a bright point toward the light, a rim, a dark heart. The silk glints where it runs
// across the way to the light, and near the light it shows the colours thin silk splits it into.
function dwWebs(aspX, aspY, o){
  const R = Math.random, salt = (R()*4294967296) >>> 0, webs = [], nW = o.fill && o.lines && o.lines.length ? Math.max(o.lines.length, 1 + Math.round(o.webs*4)) : 1 + Math.round(o.webs*4);
  for(let w = 0; w < nW; w++){
    // (each web its own draw: more Webs adds webs and moves none)
    const r = mulberry32((salt + Math.imul(w + 1, 0x85EBCA6B)) >>> 0); let size = Math.min(aspX, aspY)*(w ? 0.16 + 0.22*r() : 0.32 + 0.12*r())*o.size;
    // its hub: of a few places, the one farthest from the webs already strung (Text Aware: and off the poem's lines,
    // so no hub sits on the words)
    let hx = 0, hy = 0, best = -Infinity;
    const onWords = (x, y) => (o.lines || []).some(L => x >= L[0]*aspX && x <= L[2]*aspX && y >= L[1]*aspY - 0.03 && y <= L[3]*aspY + 0.03);
    for(let t = 0; t < 6; t++){ const x = aspX*(0.12 + 0.76*r()), y = aspY*(0.12 + 0.76*r()), d = webs.reduce((m, W) => Math.min(m, Math.hypot(x - W.hx, y - W.hy) - W.size*0.8), 9) - (o.fill ? 0 : onWords(x, y) ? 5 : 0);
      if(d > best){ best = d; hx = x; hy = y; } }
    // FILLING THE LETTERS (Shape Aware): each web strung across a line of the poem, as tall as two of its lines
    if(o.fill && o.lines && o.lines.length){ const Ln = o.lines[w % o.lines.length], u = r(); hx = (Ln[0] + (Ln[2] - Ln[0])*(0.15 + 0.7*u))*aspX; hy = (Ln[1] + Ln[3])/2*aspY; size = (Ln[3] - Ln[1])*aspY*1.1*o.size; }
    // ROUND THEM (Shape Aware on the page): a web is strung no wider than the room its hub has from the words
    else if(o.around && o.lines && o.lines.length){ const room = o.lines.reduce((m, L) => Math.min(m, Math.hypot(Math.max(L[0]*aspX - hx, 0, hx - L[2]*aspX), Math.max(L[1]*aspY - hy, 0, hy - L[3]*aspY))), 9);
      size = size*(1 - o.around) + Math.max(Math.min(aspX, aspY)*0.05, Math.min(size, room*0.8))*o.around; }
    // the frame: a ring of anchor points round the hub at uneven reach (an orb web's hub sits a little above its middle)
    const nf = 4 + Math.floor(r()*4), rot = r()*Math.PI*2, frame = Array.from({ length: nf }, (_, k) => { const t = rot + (k + (r() - 0.5)*0.55)/nf*Math.PI*2, s2 = Math.sin(t) > 0 ? 1.15 : 0.9;
      return [hx + Math.cos(t)*size*(0.8 + 0.35*r()), hy + Math.sin(t)*size*(0.75 + 0.35*r())*s2]; });
    // its tears: a stretch of the spiral gone, across some of its turns (Torn decides how many and how wide)
    const tears = Array.from({ length: 3 }, (_, k) => ({ at: r()*Math.PI*2, wide: 0.25 + 0.6*r(), r0: 0.15 + 0.5*r(), r1: 0.55 + 0.6*r(), need: k*0.3 + 0.08*r(), hang: r() }));
    webs.push({ hx, hy, size, spokes: 20 + Math.floor(r()*14), turns: Math.round(8 + o.threads*28*(0.8 + 0.4*r())), frame, tears, rot, salt: (r()*1e6) | 0,
      anchors: frame.map(p => { const k = 1.5 + r()*3; return [p[0] + (p[0] - hx)*k, p[1] + (p[1] - hy)*k]; }) });
  }
  return webs;
}
const dwHue = h => [0, 1/3, 2/3].map(o => genClamp(Math.abs(((h + o) % 1)*6 - 3) - 1)*0.75 + 0.25);
// where a spoke at angle t meets the frame (the polygon of anchor points), from the hub
function dwReach(W, t){ const dx = Math.cos(t), dy = Math.sin(t); let best = W.size;
  for(let i = 0, j = W.frame.length - 1; i < W.frame.length; j = i++){ const ax = W.frame[j][0] - W.hx, ay = W.frame[j][1] - W.hy, bx = W.frame[i][0] - W.hx, by = W.frame[i][1] - W.hy, ex = bx - ax, ey = by - ay, den = dx*ey - dy*ex;
    if(Math.abs(den) < 1e-9) continue; const s = (ax*ey - ay*ex)/den, u = (ax*dy - ay*dx)/den; if(s > 0 && u >= 0 && u <= 1) best = Math.min(best, s); }
  return best; }
function dwDraw(ww, wh, unit, webs, o, E){
  const [tc, tx] = kitCanvas(ww, wh), [gc, gx] = kitCanvas(ww, wh), [dc, dxx] = kitCanvas(ww, wh);
  for(const X of [tx, gx, dxx]){ X.fillStyle = '#000'; X.fillRect(0, 0, ww, wh); X.lineCap = 'round'; X.lineJoin = 'round'; }
  const a = (o.deg - 90)*Math.PI/180, Lx = Math.cos(a), Ly = Math.sin(a), thin = E.px(0.9), drops = []; let cur = null, rr = Math.random;
  // a thread: drawn faint, and glinting where it runs across the light's way (each piece its own), in the colours
  // thin silk splits light into (Iridescence), changing along the thread and with its angle
  const silk = (pts, w0, alpha) => {
    let w = E.px(w0)*o.width, al = alpha; if(w < thin){ al *= w/thin; w = thin; } tx.lineWidth = w; gx.lineWidth = w*1.4;
    tx.globalAlpha = al; tx.strokeStyle = '#fff'; tx.beginPath(); pts.forEach((p, i) => i ? tx.lineTo(p[0]*unit, p[1]*unit) : tx.moveTo(p[0]*unit, p[1]*unit)); tx.stroke();
    for(let i = 1; i < pts.length; i++){ const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, across = Math.abs(dx*Ly - dy*Lx)/l;
      const gl = Math.pow(across, 3)*Math.min(1, al*1.6); if(gl < 0.03) continue;
      const d = cur ? Math.hypot((x0 + x1)/2 - cur.hx, (y0 + y1)/2 - cur.hy)/cur.size : 0, hc = dwHue((across*1.4 + d*1.6 + 0.55) % 1), k = o.irid;
      gx.globalAlpha = gl; gx.strokeStyle = `rgb(${hc.map(c => Math.round(255*(1 - k + k*c))).join(',')})`; gx.beginPath(); gx.moveTo(x0*unit, y0*unit); gx.lineTo(x1*unit, y1*unit); gx.stroke(); } };
  // dew along a thread: beads at a wet thread's rhythm (a drop, and often a small one between), larger low in the web
  const bead = (pts, W, share) => { if(o.dew <= 0) return;
    for(let i = 1; i < pts.length; i++){ const A = pts[i - 1], B = pts[i], len = Math.hypot(B[0] - A[0], B[1] - A[1]); let u = rr()*0.01;
      while(u < len){ const v = u/len, P = [A[0] + (B[0] - A[0])*v, A[1] + (B[1] - A[1])*v], fall = genClamp((P[1] - W.hy)/W.size*0.5 + 0.5);
        const rad = o.dropSize*(0.0011 + 0.0028*rr()*(0.4 + 0.8*fall))*(0.6 + 0.6*o.dew);
        if(rr() < share*(0.2 + 0.8*o.dew)){ drops.push([P[0], P[1], rad]); if(rr() < 0.5) drops.push([P[0] + (B[0] - A[0])/len*rad*3.2, P[1] + (B[1] - A[1])/len*rad*3.2, rad*0.4]); }
        u += rad*(5 + 9*(1 - o.dew))*(0.7 + 0.6*rr()); } } };
  for(const W of webs){ cur = W;
    const r = mulberry32(W.salt); rr = r;
    // torn: whether the spiral at this angle and share of the way out is gone
    const torn = (t, f) => W.tears.some(T => o.torn > T.need && f > T.r0 && f < T.r1 && Math.abs(((t - T.at) % (Math.PI*2) + Math.PI*3) % (Math.PI*2) - Math.PI) < T.wide*Math.min(1, (o.torn - T.need)*3));
    // the anchor lines and the frame: the stoutest silk
    for(let i = 0; i < W.frame.length; i++){ const f = W.frame[i], g = W.frame[(i + 1) % W.frame.length], A = W.anchors[i];
      silk([f, A], 1.8, 0.6); const fr = [f, [(f[0] + g[0])/2, (f[1] + g[1])/2 + Math.hypot(g[0] - f[0], g[1] - f[1])*o.sag*0.03], g]; silk(fr, 1.8, 0.7); bead(fr, W, 0.35); }
    // the spokes, hub to frame, and the hub's little mesh
    const sp = Array.from({ length: W.spokes }, (_, k) => W.rot + (k + (r() - 0.5)*0.4)/W.spokes*Math.PI*2), reach = sp.map(t => dwReach(W, t));
    sp.forEach((t, k) => { const P = [[W.hx, W.hy], [W.hx + Math.cos(t)*reach[k], W.hy + Math.sin(t)*reach[k]]]; silk(P, 1.2, 0.6); bead(P, W, 0.15); });
    for(let j = 1; j <= 3; j++){ const hr = W.size*0.02*j; silk(sp.map(t => [W.hx + Math.cos(t)*hr, W.hy + Math.sin(t)*hr]).concat([[W.hx + Math.cos(sp[0])*hr, W.hy + Math.sin(sp[0])*hr]]), 0.9, 0.5); }
    // the sticky spiral: from past the hub's free zone out to the frame, between each two spokes a thread sagging a little
    const free = 0.16;
    for(let k = 0; k < W.spokes; k++){ const t0 = sp[k], t1 = sp[(k + 1) % W.spokes] + (k === W.spokes - 1 ? Math.PI*2 : 0), rmax = Math.min(reach[k], reach[(k + 1) % W.spokes]);
      for(let j = 0; j < W.turns; j++){ const f0 = free + (1 - free)*(j + (t0 - W.rot)/(Math.PI*2))/W.turns, f1 = free + (1 - free)*(j + (t1 - W.rot)/(Math.PI*2))/W.turns;
        const r0 = f0*reach[k]*0.97, r1 = f1*reach[(k + 1) % W.spokes]*0.97; if(Math.max(r0/reach[k], r1/reach[(k + 1) % W.spokes]) > 0.97 || f1 > 1) break;
        if(torn((t0 + t1)/2, (f0 + f1)/2)){
          // a torn thread: now and then a loose end, hanging down from the spoke it is still caught on
          if(r() < 0.12){ const P = [W.hx + Math.cos(t0)*r0, W.hy + Math.sin(t0)*r0], L = W.size*(0.03 + 0.1*r()), sw = (r() - 0.5)*L*0.6;
            const loose = [P, [P[0] + sw*0.5, P[1] + L*0.5], [P[0] + sw, P[1] + L]]; silk(loose, 0.8, 0.7); bead(loose, W, 0.8); }
          continue; }
        const A = [W.hx + Math.cos(t0)*r0, W.hy + Math.sin(t0)*r0], B = [W.hx + Math.cos(t1)*r1, W.hy + Math.sin(t1)*r1], len = Math.hypot(B[0] - A[0], B[1] - A[1]), sag = len*o.sag*0.18;
        const pts = Array.from({ length: 4 }, (_, i) => { const u = i/3; return [A[0] + (B[0] - A[0])*u, A[1] + (B[1] - A[1])*u + sag*4*u*(1 - u)]; });
        silk(pts, 0.9, 0.75); bead(pts, W, 1); } } }
  // the drops: each a tiny lens — its body faint, a point of light toward the light, a bright crescent on its far side
  // (the light it gathers), drawn no smaller than a pixel (a smaller one fades instead)
  for(const [x, y, rad] of drops){ let r = rad*unit; const floor = E.px(1.2); let al = 1; if(r < floor){ al = (r/floor)*(r/floor); r = floor; }
    dxx.globalAlpha = al*0.45; dxx.fillStyle = '#fff'; dxx.beginPath(); dxx.arc(x*unit, y*unit, r, 0, Math.PI*2); dxx.fill();
    dxx.globalAlpha = al; dxx.strokeStyle = '#fff'; dxx.lineWidth = Math.max(E.px(0.5), r*0.3); dxx.beginPath(); dxx.arc(x*unit, y*unit, r*0.78, a + Math.PI*0.65, a + Math.PI*1.35); dxx.stroke();
    gx.globalAlpha = al; gx.fillStyle = '#fff'; gx.beginPath(); gx.arc((x + Lx*rad*0.42)*unit, (y + Ly*rad*0.42)*unit, Math.max(floor*0.75, r*0.28), 0, Math.PI*2); gx.fill(); }
  return [tc, gc, dc];
}

export const GEN_STEPS = {
  // (Ruby: a ringworld; the dial is its camera, one slider its light) the world's maps, for other parts to lay things on
  ringview: { cat: 'Shape', label: 'Ringworld View', ins: ['look toward', 'look up', 'zoom', 'sun height', 'sun from'],
    outs: ['along', 'across', 'distance', 'detail', 'space', 'walls', 'star', 'daylight', 'shadow squares', 'air', 'daylight here', 'scaffolding', 'open floor', 'seam', 'beacons', 'sky air',
      'city', 'city lights', 'lights', 'works shade', 'cloud along', 'cloud across', 'cloud detail', 'clouds here', 'rock', 'snow', 'saturn', 'saturn cover'],
    io: { ins: ['value', 'value', 'value', 'value', 'value'], outs: ['field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field',
      'field', 'image', 'image', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'image', 'field'] },
    params: [GEN_R('band', 'Band Width', 45), GEN_R('walls', 'Rim Walls', 25), GEN_R('altitude', 'Altitude', 15), GEN_R('look', 'Look Toward', 0, 0, 360), GEN_R('lift', 'Look Up', 15, -30, 100),
      GEN_R('lens', 'Lens', 75, 30, 120), GEN_R('place', 'Stand At', 0, -100, 100), GEN_R('daylight', 'Daylight', 80), GEN_R('air', 'Air', 50), GEN_R('build', 'Construction', 35),
      GEN_R('builders', 'Builders: Seed · Wilds · Engineers · Cities · Magi · Ruins', 0), GEN_R('landforms', 'Landforms', 50), GEN_R('cities', 'Cities', 25), GEN_R('traffic', 'Traffic', 50),
      ['placeBy', 'Stand', 'select', 'at Stand At', { options: ['at Stand At', 'where the seed says'] }], ['saturn', 'Saturn', 'select', 'by the seed', { options: ['by the seed', 'never', 'always'] }]], cost: () => 9,
    doc: 'A ringworld seen from its floor: maps of what each pixel looks at — the ground near you, the ring rising far off into the arch overhead, its rim walls, the star, the shadow squares, what its builders raised, open space.',
    // (a dial wired in is the camera — the Camera Dial: its turn where you look round the ring, its view how far up (at the
    //  middle, straight up at the arch; at the rim, level; past it, a little down), its zoom the lens. The Light Dial is
    //  the day: its height the time (overhead noon, at the rim dusk, past it night), its direction which way dusk comes)
    run(E, n){ const { ww, wh, unit, num, input } = E, toward = input(n, 1), up = input(n, 2), zoom = input(n, 3), sun = input(n, 4), from = input(n, 5);
      const daylight = typeof sun === 'number' ? 100*(sun <= 1 ? 1 - 0.5*sun : Math.max(0, 0.5 - (sun - 1)/0.3*0.5)) : num(n, 'daylight', 80);
      return genRingView(ww, wh, unit, ringParams({ band: num(n, 'band', 45), walls: num(n, 'walls', 25), altitude: num(n, 'altitude', 15),
        look: typeof toward === 'number' ? toward*360 : num(n, 'look', 0), up: typeof up === 'number' ? up : null, lift: num(n, 'lift', 15),
        lens: num(n, 'lens', 75), zoom: typeof zoom === 'number' ? 25 + 375*zoom : 100, place: num(n, 'place', 0), daylight, air: num(n, 'air', 50), build: num(n, 'build', 35),
        side: typeof from === 'number' && Math.cos((from*360 - 90)*Math.PI/180) < 0 ? -1 : 1, builders: num(n, 'builders', 0), seed: E.ctx.seed >>> 0,
        landforms: num(n, 'landforms', 50), cities: num(n, 'cities', 25), traffic: num(n, 'traffic', 50), placeBy: E.P(n, 'placeBy', 'at Stand At') }), E.P(n, 'saturn', 'by the seed')); } },
  // the GROUND CAMERA's view as maps (Wood and Discharge see the plank this way): where on the page's plane each pixel
  // looks, and how much of it a pixel spans — for Noise at Coordinates (or a Lookup) to lay anything on the same plank
  groundview: { cat: 'Shape', label: 'Ground Coordinates', ins: [], outs: ['across', 'down', 'detail'], io: { outs: ['field', 'field', 'field'] },
    params: [GEN_R('turn', 'Turn', 0, 0, 360), GEN_R('view', 'View', 0), GEN_R('lens', 'Camera Zoom', 100, 25, 400)], cost: () => 1,
    doc: 'Where on the page’s plane each pixel looks, through the ground camera that Wood and Discharge share: across, down, and how much a pixel spans there.',
    run(E, n){ const { ww, wh, unit, N, num } = E, cam = groundCam(ww/unit, wh/unit, num(n, 'turn', 0), num(n, 'view', 0), num(n, 'lens', 100));
      const X = new Float32Array(N), Y = new Float32Array(N), D = new Float32Array(N);
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, sx = (x + 0.5)/unit, sy = (y + 0.5)/unit;
        if(!cam){ X[q] = sx; Y[q] = sy; D[q] = 1/unit; continue; }
        const g = cam.toGround(sx, sy); if(!g){ D[q] = 1; continue; } X[q] = g[0]; Y[q] = g[1]; D[q] = g[3]/unit; }
      return [X, Y, D]; } },
  mapnoise: { cat: 'Noise', label: 'Noise at Coordinates', ins: ['across', 'down', 'detail'], outs: ['noise', 'slope'], io: { ins: ['field', 'field', 'field'], outs: ['field', 'field'] },
    params: [GEN_R('size', 'Size', 100, 1, 1000), GEN_R('octaves', 'Octaves', 8, 1, 14), GEN_R('rough', 'Roughness', 50), GEN_R('ridges', 'Ridges', 0), GEN_R('warp', 'Warp', 0), GEN_R('variation', 'Variation', 0, 0, 99),
      GEN_R('steep', 'Steepness', 0)], cost: () => 4,
    doc: 'Noise read wherever two maps say: laid on a ring, a polar wrap or a perspective, never repeating, never finer than a pixel where it lands.',
    run(E, n){ const { N, num, input, asField } = E, X = asField(input(n, 1)), Y = asField(input(n, 2)), D = input(n, 3) != null ? asField(input(n, 3)) : null;
      return genMapNoise(X, Y, D, N, { size: num(n, 'size', 100)/100, octaves: num(n, 'octaves', 8), rough: 0.3 + 0.4*num(n, 'rough', 50)/100, ridges: num(n, 'ridges', 0)/100,
        warp: num(n, 'warp', 0)/100*2, steep: num(n, 'steep', 0)/100, seed: ((E.ctx.seed >>> 0) % 100003) + Math.round(num(n, 'variation', 0))*7919 }); } },
  raindrops: { cat: 'Marks', label: 'Raindrops', ins: [], outs: ['ripples', 'splashes', 'distance'], io: { outs: ['field', 'field', 'field'] },
    params: [GEN_R('size', 'Ripple Size', 100, 40, 250), GEN_R('rain', 'Rain', 50), GEN_R('spread', 'Spread', 50), GEN_R('splash', 'Splashes', 40), GEN_R('view', 'View', 35, 0, 85), GEN_R('variation', 'Variation', 0, 0, 99)], cost: () => 8,
    doc: 'Rain falling on still water: every drop a ring wave spreading from where it struck, the newest still splashing, seen from above or across the water.',
    run(E, n){ const { num } = E;
      return genRaindrops(E.ww, E.wh, E.unit, { size: num(n, 'size', 100)/100, rain: num(n, 'rain', 50)/100, spread: num(n, 'spread', 50)/100, splash: num(n, 'splash', 40)/100,
        tilt: num(n, 'view', 35)/100, salt: ((E.ctx.seed >>> 0) + Math.round(num(n, 'variation', 0))*7919) >>> 0 }); } },
  traces: { cat: 'Marks', label: 'Circuit Traces', ins: ['keep clear'], outs: ['copper', 'height', 'each trace', 'data', 'pads', 'parts', 'silkscreen', 'brass', 'arcana'],
    io: { ins: ['field'], outs: ['field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field'] },
    params: [GEN_R('traces', 'Traces', 55), GEN_R('scale', 'Scale', 100, 40, 300), GEN_R('bends', 'Bends', 70), GEN_R('parts', 'Components', 45), GEN_R('flow', 'Data Flow', 40), GEN_R('variant', 'Variation', 0, 0, 99),
      GEN_R('era', 'Era', 0), GEN_R('marks', 'Markings', 0), ['clearing', 'Keep Clear By', 'select', 'routing around it', { options: ['routing around it', 'cutting it away'] }]], cost: () => 6,
    // (filling the letters, Shape Aware: the board is finer, to show in their strokes, and keeps nothing clear)
    // (its cells are counted on the export's grid, `ctx.page`, so a preview and the saved image are one board)
    paint(E, n){ const { ww: w, wh: h } = E, unit = Math.min(w, h), across = 80/(E.num(n, 'scale', 100)/100)*(1 + 0.7*(+E.ctx.fill || 0)), s = unit/across;
      const [PW, PH] = E.ctx.page || [w, h], sp = Math.min(PW, PH)/across;
      const cw = Math.max(4, Math.ceil(PW/sp)), ch = Math.max(4, Math.ceil(PH/sp)), kv = E.ctx.fill ? null : E.input(n, 1), keep = kv != null ? E.asField(kv) : null;
      const bends = E.num(n, 'bends', 70)/100;
      const o = { traces: E.num(n, 'traces', 55)/100, parts: E.num(n, 'parts', 45)/100, bends, diag: bends > 0, flow: E.num(n, 'flow', 40)/100,
        era: E.num(n, 'era', 0)/100, marks: E.num(n, 'marks', 0)/100,
        salt: Math.round(E.num(n, 'variant', 0)) + ((E.ctx.seed >>> 0) % 997),
        clear: null, cut: null };
      // KEEP CLEAR: routed around (the cells are taken before anything is placed), or, for a mask that moves (the poem),
      // cut away after, so the rest of the board stays where it was
      const look = keep ? (x, y) => keep[Math.min(h - 1, Math.max(0, y*s | 0))*w + Math.min(w - 1, Math.max(0, x*s | 0))] : null;
      // (Shape Aware, round the words: the board is routed round the poem, whatever Keep Clear By says)
      if(look){ if(E.ctx.around || E.P(n, 'clearing', 'routing around it') !== 'cutting it away') o.clear = look; else if(keep.some(v => v > 0.5)) o.cut = (x, y) => look(x, y) > 0.5; }
      const B = withSeed(genSeed(E, n), () => genCircuit(cw, ch, o)), cv = genDrawCircuit(B, w, h, s, o);
      return ['copper', 'height', 'each', 'data', 'pads', 'parts', 'legend', 'brass', 'arcana'].map(k => cv[k][0]); },
    run(E, n){ return this.paint(E, n).map(c => E.asField(E.readCanvas(c))); } },
  matrix: { cat: 'Textures', label: 'Growth Medium', ins: [], outs: ['picture', 'height', 'ways'], io: { outs: ['field', 'field', 'field'] },
    params: [GEN_R('kind', 'Strata · Pebbles · Sand · Fibres · Skin', 25), GEN_R('scale', 'Scale', 100, 40, 300), GEN_R('angle', 'Angle', 0, 0, 180), GEN_R('variant', 'Variation', 0, 0, 99)], cost: () => 4,
    run(E, n){ const k = Math.min(4, Math.floor(E.num(n, 'kind', 25)/100*5));
      return withSeed(genSeed(E, n), () => genMatrix(E.ww, E.wh, E.unit, { kind: k, zoom: E.num(n, 'scale', 100)/100, angle: E.num(n, 'angle', 0)*Math.PI/180 })); } },
  tendrils: { cat: 'Marks', label: 'Tendrils', ins: ['ways', 'grow from'], outs: ['wires', 'glow'], io: { ins: ['field', 'value'], outs: ['field', 'field'] },
    params: [GEN_R('amount', 'Reach', 60), GEN_R('branching', 'Branching', 50), GEN_R('roots', 'Roots', 2, 1, 6), GEN_R('inner', 'Start Inside', 0), GEN_R('slide', 'Slide', 0, -100, 100),
      GEN_R('zoom', 'Scale', 100, 40, 300), GEN_R('width', 'Wire Width', 100, 30, 300), GEN_R('keep', 'Follow the Ways', 60), GEN_R('variant', 'Variation', 0, 0, 99)], cost: () => 14,
    run(E, n){ const { ww, wh, unit, N, num } = E, dial = genDial(E, n, 2), Wv = E.asField(E.input(n, 1)) || new Float32Array(N).fill(0.6);
      const o = { amount: num(n, 'amount', 60)/100 + 0.05, branching: num(n, 'branching', 50)/100, roots: num(n, 'roots', 2), inner: num(n, 'inner', 0)/100, slide: num(n, 'slide', 0)/100,
        zoom: num(n, 'zoom', 100)/100, dx: dial.x, dy: dial.y, keep: num(n, 'keep', 60)/100 };
      const T = withSeed(genSeed(E, n), () => genTendrils(ww, wh, unit, Wv, o));
      const [c, x] = kitCanvas(ww, wh); x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh); x.strokeStyle = '#fff'; x.lineCap = 'round';
      const wk = num(n, 'width', 100)/100;
      for(let k = 0; k < T.NX.length; k++){ const p = T.PAR[k]; if(p < 0) continue;
        x.lineWidth = Math.max(E.px(0.9), E.px(1.1)*wk*o.zoom*Math.cbrt(T.flow[k])); x.beginPath(); x.moveTo(T.NX[p], T.NY[p]); x.lineTo(T.NX[k], T.NY[k]); x.stroke(); }
      const wires = E.asField(E.readCanvas(c)), g1 = E.boxBlur(wires, unit*0.004), g2 = E.boxBlur(wires, unit*0.016), glow = new Float32Array(N);
      for(let i = 0; i < N; i++) glow[i] = Math.min(1, wires[i]*0.8 + g1[i]*1.2 + g2[i]*1.1);
      return [wires, glow]; } },
  knotwork: { cat: 'Marks', label: 'Knotwork', ins: ['slide toward'], outs: ['picture', 'height'], io: { ins: ['value'], outs: ['image', 'field'] },
    params: [GEN_R('size', 'Size', 100, 40, 300), GEN_R('cells', 'Strands', 8, 3, 24), GEN_R('breaks', 'Breaks', 45), GEN_R('shape', 'Circle · Square · Diamond · Cross · Quatrefoil · Page', 0),
      GEN_R('width', 'Ribbon Width', 55, 20, 90), GEN_R('offset', 'Slide', 0, -100, 100), GEN_R('variant', 'Variation', 0, 0, 99)], cost: () => 4,
    paint(E, n){ const { ww: w, wh: h } = E, unit = Math.min(w, h), dial = genDial(E, n, 1), sh = E.num(n, 'shape', 0);
      // (Shape Aware: in the letters, more strands, finer; round the words, the knot leaves them a hole and weaves round it)
      const o = { cells: E.num(n, 'cells', 8)*(1 + 1.5*(+E.ctx.fill || 0)), breaks: E.num(n, 'breaks', 45)/100, shape: Math.min(5, Math.floor(sh/100*6)), salt: Math.round(E.num(n, 'variant', 0)) + ((E.ctx.seed >>> 0) % 997),
        aspX: w/unit, aspY: h/unit };
      const size = E.num(n, 'size', 100)/100, off = E.num(n, 'offset', 0)/100;
      // the panel: its radius a share of the page, zoomed by Size; slid along the dial's line
      const s = unit*0.44*size/Math.max(2, Math.round(o.cells))*2, cx = w/2 + dial.x*off*w*0.42, cy = h/2 + dial.y*off*h*0.42;
      const T = p => [cx + p[0]*s/2, cy + p[1]*s/2], wd = s*0.5*0.707*E.num(n, 'width', 55)/100*1.3;
      const room = wordsRoom(E.ctx, w, h, 0.3, 0.9);
      if(room) o.hole = (x, y) => { const [px, py] = T([x, y]); return px >= 0 && py >= 0 && px < w && py < h && room[(py | 0)*w + (px | 0)] < 0.55; };
      const pieces = genKnot(o);
      const [pc, px] = kitCanvas(w, h), [hc, hx] = kitCanvas(w, h);
      px.fillStyle = 'rgb(128,128,128)'; px.fillRect(0, 0, w, h); hx.fillStyle = '#000'; hx.fillRect(0, 0, w, h);
      genDrawKnot(px, pieces, T, s, wd, 'rgb(28,26,24)', 'rgb(232,226,214)', 'rgb(128,128,128)');
      // heights: the ribbon raised, its edges rounded down, the under-strand lower where it passes beneath
      genDrawKnot(hx, pieces, T, s, wd, 'rgb(150,150,150)', 'rgb(235,235,235)', '#000');
      return [pc, hc]; },
    run(E, n){ const [pc, hc] = this.paint(E, n); return [E.readCanvas(pc), E.asField(E.readCanvas(hc))]; } },
  discharge: { cat: 'Marks', label: 'Discharge', ins: ['strike from'], outs: ['channels'], io: { ins: ['value'], outs: ['field'] },
    params: [GEN_R('reach', 'Reach', 50), GEN_R('branching', 'Branching', 50), GEN_R('poles', 'Poles', 2, 1, 3), GEN_R('grain', 'Along the Grain', 30), GEN_R('width', 'Channel Width', 100, 30, 300),
      GEN_R('zoom', 'Zoom', 100, 50, 400), GEN_R('offset', 'Slide', 0, -100, 100), GEN_R('variant', 'Variation', 0, 0, 99),
      GEN_R('turn', 'Turn', 0, 0, 360), GEN_R('view', 'View', 0), GEN_R('lens', 'Camera Zoom', 100, 25, 400)], cost: () => 12,
    run(E, n){ const { ww, wh, unit, num } = E, dial = genDial(E, n, 1), zoom = num(n, 'zoom', 100)/100, cam = groundCam(ww/unit, wh/unit, num(n, 'turn', 0), num(n, 'view', 0), num(n, 'lens', 100));
      const o = { count: Math.round(700 + 8000*num(n, 'reach', 50)/100), eta: 1.2 + (1 - num(n, 'branching', 50)/100)*6.5, poles: Math.round(num(n, 'poles', 2)),
        grain: num(n, 'grain', 30)/100, dx: dial.x, dy: dial.y, zoom, offset: num(n, 'offset', 0)/100 };
      const { segs } = withSeed(genSeed(E, n), () => genLichtenberg(ww/unit, wh/unit, o));
      const [c, x] = kitCanvas(ww, wh); x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh); x.strokeStyle = '#fff'; x.lineCap = 'round';
      const wk = num(n, 'width', 100)/100;
      // thick where the most current ran; the twigs fade as well as thin
      // (magnified with the figure: the camera brings the channels closer, wider as well as longer)
      // (through the ground camera: a channel is as wide as it is near; one finer than the thinnest line fades instead)
      const thin = E.px(0.9);
      for(const [x0, y0, x1, y1, cur] of segs){ let w = Math.max(E.px(0.9)*zoom, E.px(1.6)*wk*Math.pow(cur, 0.34)*zoom), a = Math.min(1, 0.35 + Math.pow(cur, 0.5)*0.22);
        let p = [x0, y0], q = [x1, y1];
        if(cam){ p = cam.toScreen(x0, y0); q = cam.toScreen(x1, y1); if(!p || !q) continue; w *= (p[2] + q[2])/2; if(w < thin){ a *= w/thin; w = thin; } }
        x.globalAlpha = a; x.lineWidth = w;
        x.beginPath(); x.moveTo(p[0]*unit, p[1]*unit); x.lineTo(q[0]*unit, q[1]*unit); x.stroke(); }
      return [E.asField(E.readCanvas(c))]; } },
  wood: { cat: 'Textures', label: 'Wood', ins: ['light wood', 'dark wood'], outs: ['picture', 'height'], io: { ins: ['colour', 'colour'], outs: ['image', 'field'] },
    params: [GEN_R('rings', 'Rings', 40), GEN_R('figure', 'Figure', 50), GEN_R('variant', 'Variation', 0, 0, 99), GEN_R('turn', 'Turn', 0, 0, 360), GEN_R('view', 'View', 0), GEN_R('lens', 'Camera Zoom', 100, 25, 400)], cost: () => 4,
    run(E, n){ const a = E.input(n, 1), b = E.input(n, 2);
      const o = { rings: E.num(n, 'rings', 40)/100, figure: E.num(n, 'figure', 50)/100, light: Array.isArray(a) ? a : [0.80, 0.64, 0.45], dark: Array.isArray(b) ? b : [0.42, 0.26, 0.15],
        cam: groundCam(E.ww/E.unit, E.wh/E.unit, E.num(n, 'turn', 0), E.num(n, 'view', 0), E.num(n, 'lens', 100)) };
      return withSeed(genSeed(E, n), () => genWood(E.ww, E.wh, E.unit, o)); } },
  burn: { cat: 'Light & Color', label: 'Burn', ins: ['picture', 'channels', 'glow'], outs: ['picture', 'height'], io: { ins: ['image', 'field', 'colour'], outs: ['image', 'field'] },
    params: [GEN_R('material', 'Charred · Embers · Acrylic', 0), GEN_R('scorch', 'Scorch', 50), GEN_R('depth', 'Depth', 50), GEN_R('etch', 'Etched', 0)], cost: () => 3,
    run(E, n){ const { N, unit } = E, ch = E.asField(E.input(n, 2)); if(!ch) return null;
      const pic = E.asImage(E.input(n, 1) ?? 0.6), gv = E.input(n, 3), m = E.num(n, 'material', 0)/100, sc = E.num(n, 'scorch', 50)/100, dp = E.num(n, 'depth', 50)/100, et = E.num(n, 'etch', 0)/100;
      const ember = genClamp(1 - Math.abs(m - 0.5)*2), acr = genClamp((m - 0.5)*2), wood = genClamp(1 - m*2);
      const glow = Array.isArray(gv) ? gv : [1*(1 - acr) + 0.62*acr, 0.42*(1 - acr) + 0.86*acr, 0.12*(1 - acr) + 1*acr];
      // the scorch: wide and soft; the lip: just beside the channel
      const wide = E.boxBlur(ch, unit*0.012*(0.4 + sc)), lip = E.boxBlur(ch, unit*0.0025);
      const out = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, H = new Float32Array(N), P = [pic.r, pic.g, pic.b], O = [out.r, out.g, out.b];
      const block = [0.035, 0.05, 0.075];
      for(let i = 0; i < N; i++){
        const c = ch[i], s = genClamp(wide[i]*3.2*sc), core = genClamp(c*1.4), inner = genClamp((lip[i] - 0.72)*3.5);
        for(let k = 0; k < 3; k++){
          // wood: browned round the channel, black in it
          const brown = [0.42, 0.24, 0.12][k], burnt = P[k][i]*(1 - s*0.55) + brown*P[k][i]*s*0.55, charred = burnt*(1 - core*0.92) + 0.03*core;
          // embers: the char with fire still in its heart
          const hot = charred*(1 - inner*0.4) + glow[k]*(inner*0.85 + core*s*0.18);
          // acrylic: a dark clear block, the channels white-hot at the core and coloured round it
          const lit = block[k] + glow[k]*(s*0.45 + core*0.8) + inner*0.9;
          const o = wood*charred + ember*hot + acr*lit;
          // ETCHED (slate, brass): the cut shows paler than the face, its own material bared and catching light; no char
          O[k][i] = et > 0 ? o*(1 - et) + et*(P[k][i]*(1 - s*0.25) + (0.8 + 0.2*P[k][i] - P[k][i]*(1 - s*0.25))*core*0.85) : o;
        }
        // sunk into the wood, with a crust of char at the lip (acrylic: smooth)
        H[i] = (0.55 - dp*0.45*core - dp*0.12*s + dp*0.18*genClamp(lip[i]*2 - core))*(1 - acr) + 0.5*acr;
      }
      return [out, H]; } },
  growline: { cat: 'Marks', label: 'Differential Growth', ins: ['sun'], outs: ['line', 'body', 'relief'], io: { ins: ['value'], outs: ['field', 'field', 'field'] },
    params: [GEN_R('growth', 'Growth', 55), GEN_R('fold', 'Fold Size', 100, 50, 250), GEN_R('seeds', 'Seeds', 1, 1, 7), GEN_R('photo', 'Toward the Sun', 40),
      GEN_R('zoom', 'Zoom', 100, 50, 400), GEN_R('offset', 'Slide', 0, -100, 100), GEN_R('variant', 'Variation', 0, 0, 99)], cost: () => 14,
    run(E, n){ const { ww, wh, unit, num } = E, dial = genDial(E, n, 1), zoom = num(n, 'zoom', 100)/100, off = num(n, 'offset', 0)/100;
      const o = { growth: num(n, 'growth', 55)/100, fold: num(n, 'fold', 100)/100, seeds: num(n, 'seeds', 1), photo: num(n, 'photo', 40)/100, sun: { x: dial.x, y: dial.y } };
      // (grown on the export's grid's shape, so the preview grows the saved image's loops)
      const [GW, GH] = E.ctx.page || [ww, wh], gu = Math.min(GW, GH);
      const { loops } = withSeed(genSeed(E, n), () => genGrowth(GW/gu, GH/gu, o));
      // into the page: zoomed about the page's middle, then slid along the dial's line (the sun's)
      const cx = ww/unit/2, cy = wh/unit/2, sx = cx + dial.x*off*cx*0.9, sy = cy + dial.y*off*cy*0.9;
      for(const L of loops) for(const p of L){ p[0] = sx + (p[0] - cx)*zoom; p[1] = sy + (p[1] - cy)*zoom; }
      const [lc, lx] = kitCanvas(ww, wh), [bc, bx] = kitCanvas(ww, wh);
      bx.fillStyle = '#000'; bx.fillRect(0, 0, ww, wh); lx.fillStyle = '#000'; lx.fillRect(0, 0, ww, wh);
      // the body: every loop filled (even–odd, so a loop grown round another leaves a ring)
      bx.fillStyle = '#fff'; bx.beginPath(); for(const L of loops){ L.forEach((p, i) => i ? bx.lineTo(p[0]*unit, p[1]*unit) : bx.moveTo(p[0]*unit, p[1]*unit)); bx.closePath(); } bx.fill('evenodd');
      lx.strokeStyle = '#fff'; lx.lineJoin = 'round'; lx.lineWidth = Math.max(1, E.px(3.2)*o.fold*zoom);
      lx.beginPath(); for(const L of loops){ L.forEach((p, i) => i ? lx.lineTo(p[0]*unit, p[1]*unit) : lx.moveTo(p[0]*unit, p[1]*unit)); lx.closePath(); } lx.stroke();
      const line = E.asField(E.readCanvas(lc)), body = E.asField(E.readCanvas(bc));
      // relief: the body rounded at its edges, a groove along the line
      const soft = E.boxBlur(body, unit*0.0045*o.fold*zoom), rel = new Float32Array(E.N);
      for(let i = 0; i < E.N; i++) rel[i] = genClamp(soft[i]*0.9 - line[i]*0.25 + 0.05);
      return [line, body, rel]; } },
  // GLASS SHARDS (Ruby: "a bunch of glass fragments laying on nothing"): broken glass on the page, or over a picture
  // wired in (seen through each shard, bent by its tilt). The light dial lights it — wired into light from and light
  // height — and the camera dial lays the shards on a plane (wired into Turn, View and Camera Zoom)
  shards: { cat: 'Marks', label: 'Glass Shards', ins: ['picture', 'light from', 'light height'], outs: ['picture', 'shards', 'caustics'],
    io: { ins: ['image', 'value', 'value'], outs: ['image', 'field', 'field'] },
    params: [GEN_R('count', 'Shards', 40), GEN_R('size', 'Size', 100, 30, 300), GEN_R('spread', 'Spread', 55), GEN_R('slivers', 'Slivers', 35), GEN_R('caustics', 'Caustics', 60),
      GEN_R('glints', 'Glints', 60), GEN_R('colors', 'Colored Glass', 25), GEN_R('shadows', 'Shadows', 50), GEN_R('variant', 'Variation', 0, 0, 99),
      GEN_R('turn', 'Turn', 0, 0, 360), GEN_R('view', 'View', 0), GEN_R('lens', 'Camera Zoom', 100, 25, 400)], cost: () => 10,
    doc: 'Broken glass lying on the page, or on a picture: sharp shards, a little tilted, lit by the light dial, each throwing its light beside it.',
    run(E, n){ const { ww, wh, unit, num, input } = E, dial = genDial(E, n, 2), h = input(n, 3), pic = input(n, 1);
      const o = { count: num(n, 'count', 40)/100, size: num(n, 'size', 100)/100, spread: num(n, 'spread', 55)/100, slivers: num(n, 'slivers', 35)/100, caustics: num(n, 'caustics', 60)/100,
        glints: num(n, 'glints', 60)/100, colors: num(n, 'colors', 25)/100, shadows: num(n, 'shadows', 50)/100, deg: dial.deg,
        reach: typeof h === 'number' ? h : Math.max(0, Math.min(1.3, (E.ctx.lightTilt ?? 100)/100)) };
      // (the poem's lines, when the graph is handed them: kept readable, or filled; filling them, the camera stays put)
      o.lines = genLinesOf(E.ctx.text); o.fill = !!E.ctx.fill && o.lines.length > 0; o.around = Math.min(1, +E.ctx.around || 0);
      const cam = o.fill ? null : groundCam(ww/unit, wh/unit, num(n, 'turn', 0), num(n, 'view', 0), num(n, 'lens', 100));
      if(cam) o.lines = [];   // (through the camera the glass lies on another plane than the words)
      const S = withSeed(genSeed(E, n), () => gsShards(ww/unit, wh/unit, o));
      return gsRender(ww, wh, unit, S, o, cam, pic != null ? E.asImage(pic) : null); } },
  // DEWY WEBS (Ruby: "dewy spider webs getting caught by the light"): orb webs, beaded with dew, the silk glinting where
  // it runs across the light's way, in the colours thin silk splits light into; the drops each a lens with a point of light
  dewwebs: { cat: 'Marks', label: 'Dewy Webs', ins: ['light from'], outs: ['silk', 'glints', 'dew'], io: { ins: ['value'], outs: ['field', 'image', 'field'] },
    params: [GEN_R('webs', 'Webs', 30), GEN_R('size', 'Size', 100, 40, 250), GEN_R('dew', 'Dew', 60), GEN_R('drops', 'Drop Size', 100, 30, 300), GEN_R('torn', 'Torn', 20),
      GEN_R('sag', 'Sag', 40), GEN_R('irid', 'Iridescence', 50), GEN_R('threads', 'Threads', 50), GEN_R('width', 'Thread Width', 100, 30, 300), GEN_R('variant', 'Variation', 0, 0, 99)], cost: () => 5,
    doc: 'Orb webs strung across the page and beaded with dew: the silk, its glints in the colours thin silk makes, and the drops, each a tiny lens.',
    run(E, n){ const { ww, wh, unit, num } = E, dial = genDial(E, n, 1);
      const o = { webs: num(n, 'webs', 30)/100, size: num(n, 'size', 100)/100, dew: num(n, 'dew', 60)/100, dropSize: num(n, 'drops', 100)/100, torn: num(n, 'torn', 20)/100,
        sag: num(n, 'sag', 40)/100, irid: num(n, 'irid', 50)/100, threads: num(n, 'threads', 50)/100, width: num(n, 'width', 100)/100, deg: dial.deg };
      o.lines = genLinesOf(E.ctx.text); o.fill = !!E.ctx.fill && o.lines.length > 0; o.around = Math.min(1, +E.ctx.around || 0);
      const [tc, gc, dc] = withSeed(genSeed(E, n), () => dwDraw(ww, wh, unit, dwWebs(ww/unit, wh/unit, o), o, E));
      return [E.asField(E.readCanvas(tc)), E.readCanvas(gc), E.asField(E.readCanvas(dc))]; } },
};
